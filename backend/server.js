require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { randomUUID } = require('crypto');
const crypto = require('crypto');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const CURRENT_SITEMAP_PATH = process.env.CURRENT_SITEMAP_PATH || path.join(UPLOADS_DIR, 'current-sitemap.json');
const CURRENT_SITE_CONTENT_PATH = process.env.CURRENT_SITE_CONTENT_PATH || path.join(UPLOADS_DIR, 'current-site-content.json');
const CURRENT_SMTP_SETTINGS_PATH = process.env.CURRENT_SMTP_SETTINGS_PATH || path.join(UPLOADS_DIR, 'current-smtp-settings.json');
const SNAPSHOT_DIR = process.env.SNAPSHOT_DIR || path.join(UPLOADS_DIR, '_snapshots');
const CHANGE_LOG_PATH = process.env.CHANGE_LOG_PATH || path.join(UPLOADS_DIR, '_change-log.ndjson');
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '25mb';
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 5000);
const DB_MAX_RETRIES = Number(process.env.DB_MAX_RETRIES || 0); // 0 => unlimited
const DB_REQUEST_WAIT_MS = Number(process.env.DB_REQUEST_WAIT_MS || 15000);
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_TOKEN_TTL_MS = Number(process.env.ADMIN_TOKEN_TTL_MS || (8 * 60 * 60 * 1000));
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://azfin.az';
const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL || `${PUBLIC_SITE_URL.replace(/\/$/, '')}/#/admin`;
const SMTP_SETTINGS_ID = 1;
const DEFAULT_SMTP_SETTINGS = {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: '',
    to: '',
    cc: '',
    bcc: '',
    subjectPrefix: 'AZFIN'
};

// DB Config
const dbConfig = {
    filename: process.env.DB_PATH || path.join(UPLOADS_DIR, 'azfin_db.sqlite')
};

let pool;
let dbReady = false;
let dbInitStartedAt = null;
let lastDbInitError = null;
let dbInitPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const PASSWORD_HASH_PREFIX = 'scrypt';

function isDbAvailable() {
    return Boolean(pool) && dbReady;
}

function getDbUnavailableMessage() {
    if (lastDbInitError?.message) {
        return `Database is not ready yet: ${lastDbInitError.message}`;
    }
    return 'Database initialization is still in progress. Please try again shortly.';
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${PASSWORD_HASH_PREFIX}$${salt}$${derivedKey}`;
}

function verifyPassword(password, storedPassword) {
    if (typeof storedPassword !== 'string' || !storedPassword) return false;
    const [scheme, salt, hash] = storedPassword.split('$');
    if (scheme !== PASSWORD_HASH_PREFIX || !salt || !hash) {
        return password === storedPassword;
    }

    const derivedKey = crypto.scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(hash, 'hex');
    if (storedBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(storedBuffer, derivedKey);
}

function validateAdminCredentials(username, password) {
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';

    if (!normalizedUsername || normalizedUsername.length < 3) {
        return { ok: false, error: 'İstifadəçi adı ən azı 3 simvol olmalıdır.' };
    }

    if (!normalizedPassword || normalizedPassword.length < 8) {
        return { ok: false, error: 'Şifrə ən azı 8 simvol olmalıdır.' };
    }

    return {
        ok: true,
        username: normalizedUsername,
        password: normalizedPassword
    };
}

function signAdminTokenPayload(encodedPayload) {
    return crypto
        .createHmac('sha256', ADMIN_TOKEN_SECRET)
        .update(encodedPayload)
        .digest('base64url');
}

function createAdminAccessToken(user) {
    const now = Date.now();
    const payload = {
        sub: Number(user.id),
        username: String(user.username || '').trim(),
        iat: now,
        exp: now + ADMIN_TOKEN_TTL_MS
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encodedPayload}.${signAdminTokenPayload(encodedPayload)}`;
}

function verifyAdminAccessToken(token) {
    if (typeof token !== 'string' || !token.includes('.')) return null;

    const [encodedPayload, providedSignature] = token.split('.', 2);
    if (!encodedPayload || !providedSignature) return null;

    const expectedSignature = signAdminTokenPayload(encodedPayload);
    if (expectedSignature.length !== providedSignature.length) {
        return null;
    }

    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(providedSignature);
    if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
        if (!payload || typeof payload !== 'object') return null;

        const userId = Number(payload.sub);
        const expiresAt = Number(payload.exp);
        if (!Number.isInteger(userId) || userId <= 0) return null;
        if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

        return payload;
    } catch (_) {
        return null;
    }
}

function extractBearerToken(req) {
    const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
    if (!authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice('Bearer '.length).trim() || null;
}

async function requireAdminAuth(req, res, next) {
    try {
        const token = extractBearerToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Admin girişi tələb olunur.' });
        }

        const payload = verifyAdminAccessToken(token);
        if (!payload) {
            return res.status(401).json({ error: 'Admin oturumu etibarsızdır və ya vaxtı bitib.' });
        }

        const rows = await pool.all(
            'SELECT id, username FROM admin_users WHERE id = ? LIMIT 1',
            [payload.sub]
        );
        const adminUser = rows[0];

        if (!adminUser) {
            return res.status(401).json({ error: 'Admin hesabı tapılmadı.' });
        }

        req.adminUser = adminUser;
        return next();
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function ensureColumn(tableName, columnName, definition) {
    const rows = await pool.all(`PRAGMA table_info(${tableName})`);
    const exists = rows.some((r) => r.name === columnName);

    if (!exists) {
        await pool.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
        console.log(`Added missing column ${tableName}.${columnName}`);
    }
}

function normalizeSyllabus(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }
    return [];
}

function normalizeStringList(value) {
    return normalizeSyllabus(value)
        .map((item) => String(item || '').trim())
        .filter(Boolean);
}

function normalizeSyllabusEntries(value) {
    return normalizeSyllabus(value)
        .map((item) => {
            if (typeof item === 'string') {
                const text = item.trim();
                return text ? { type: 'text', text } : null;
            }

            if (!item || typeof item !== 'object') return null;

            const type = item.type === 'file' ? 'file' : 'text';
            const text = typeof item.text === 'string' ? item.text.trim() : '';
            const label = typeof item.label === 'string' ? item.label.trim() : '';
            const url = typeof item.url === 'string' ? item.url.trim() : '';

            if (type === 'file') {
                if (!label && !url) return null;
                return { type, label, url };
            }

            if (!text) return null;
            return { type, text };
        })
        .filter(Boolean);
}

function toSqlValue(value) {
    return value === undefined ? null : value;
}

function parseDbJson(value, fallback) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (_) {
            return fallback;
        }
    }
    if (typeof value === 'object') return value;
    return fallback;
}

function normalizeBoolean(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'on', 'enabled', 'active'].includes(normalized)) return true;
        if (['0', 'false', 'no', 'off', 'disabled', 'inactive'].includes(normalized)) return false;
    }
    return fallback;
}

function normalizePort(value, fallback = 587) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : fallback;
}

function normalizeSmtpSettings(payload) {
    const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
    return {
        enabled: normalizeBoolean(source.enabled, DEFAULT_SMTP_SETTINGS.enabled),
        host: typeof source.host === 'string' ? source.host.trim() : '',
        port: normalizePort(source.port, DEFAULT_SMTP_SETTINGS.port),
        secure: normalizeBoolean(source.secure, DEFAULT_SMTP_SETTINGS.secure),
        user: typeof source.user === 'string' ? source.user.trim() : '',
        pass: typeof source.pass === 'string' ? source.pass : '',
        from: typeof source.from === 'string' ? source.from.trim() : '',
        to: typeof source.to === 'string' ? source.to.trim() : '',
        cc: typeof source.cc === 'string' ? source.cc.trim() : '',
        bcc: typeof source.bcc === 'string' ? source.bcc.trim() : '',
        subjectPrefix: typeof source.subjectPrefix === 'string' && source.subjectPrefix.trim()
            ? source.subjectPrefix.trim()
            : DEFAULT_SMTP_SETTINGS.subjectPrefix
    };
}

function prettifyFieldKey(field) {
    return String(field)
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/^./, (s) => s.toUpperCase());
}

const SUBMISSION_FIELD_LABELS = {
    name: 'Ad və soyad',
    fullName: 'Ad və soyad',
    phone: 'Telefon',
    email: 'E-poçt',
    note: 'Qeyd',
    message: 'Mesaj',
    service: 'Xidmət',
    company: 'Şirkət',
    position: 'Vəzifə',
    trainingTitle: 'Təlim adı',
    trainingName: 'Təlim adı',
    courseTitle: 'Təlim adı',
    courseName: 'Təlim adı',
    formName: 'Forma adı'
};

function getSubmissionFieldLabel(field) {
    const key = String(field || '').trim();
    return SUBMISSION_FIELD_LABELS[key] || prettifyFieldKey(key);
}

function normalizeSubmissionFormTitle(type, rawTitle) {
    const fallback = getSubmissionTypeLabel(type);
    if (typeof rawTitle !== 'string') return fallback;
    const normalized = rawTitle.trim().toLowerCase();
    if (!normalized) return fallback;

    if (type === 'training') {
        if (['training application', 'apply for training', 'training form'].includes(normalized)) {
            return 'Təlim müraciəti';
        }
    }

    if (type === 'contact') {
        if (['contact form', 'contact application'].includes(normalized)) {
            return 'Əlaqə forması';
        }
    }

    if (type === 'audit') {
        if (['audit application', 'audit form', 'audit request'].includes(normalized)) {
            return 'Audit sorğusu';
        }
    }

    return rawTitle.trim();
}

function formatSubmissionValue(value) {
    if (value === null || value === undefined || value === '') return '-';
    if (Array.isArray(value)) {
        if (value.length === 0) return '-';
        return value
            .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
            .join(', ');
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch (_) {
            return String(value);
        }
    }
    return String(value);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripRichText(value) {
    return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\[[^\]]+\]/g, ' ')
        .replace(/[*_`>#-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildShareDescription(post) {
    const preferred = stripRichText(post?.excerpt || post?.content || '');
    return preferred.slice(0, 180) || 'Azfin bloqundan faydalı məqalə.';
}

function getSubmissionTypeLabel(type) {
    switch (type) {
        case 'contact':
            return 'Əlaqə Forması';
        case 'audit':
            return 'Audit Sorğusu';
        case 'training':
            return 'Təlim Müraciəti';
        default:
            return 'Forma Müraciəti';
    }
}

function toPublicUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const value = raw.trim().replace(/&amp;/g, '&');
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('//')) return `https:${value}`;
    const base = PUBLIC_SITE_URL.replace(/\/$/, '');
    if (value.startsWith('/')) return `${base}${value}`;
    return `${base}/${value.replace(/^\/+/, '')}`;
}

function getSubmissionTypeAccent(type) {
    switch (type) {
        case 'contact':
            return '#14b8a6';
        case 'audit':
            return '#3b82f6';
        case 'training':
            return '#22c55e';
        default:
            return '#3b82f6';
    }
}

function formatDateForEmail(dateValue) {
    try {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        const weekdays = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
        const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
        const weekday = weekdays[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${weekday}, ${day} ${month} ${year} / ${hours}:${minutes}`;
    } catch (_) {
        return dateValue.toISOString();
    }
}

function getEmailBranding() {
    const siteContent = readCurrentSiteContent() || {};
    const siteSettings = siteContent.settings || {};
    return {
        brandName: siteSettings.siteTitle || 'AZFIN GROUP MMC',
        brandLogo: toPublicUrl(siteSettings.navbarLogo || siteSettings.footerLogo || '')
    };
}

function buildEmailLogoBlock(brandName, brandLogo) {
    return brandLogo
        ? `<img src="${escapeHtml(brandLogo)}" alt="${escapeHtml(brandName)}" style="height:38px;max-width:180px;display:block;object-fit:contain;" />`
        : `<span style="display:inline-block;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.02em;">AZFIN</span>`;
}

function buildSubmissionEmailBody({ type, submissionId, formData, createdAt }) {
    const typeLabel = getSubmissionTypeLabel(type);
    const entries = Object.entries(formData || {});
    const { brandName, brandLogo } = getEmailBranding();
    const accentColor = getSubmissionTypeAccent(type);
    const createdAtLabel = formatDateForEmail(createdAt);
    const formName = normalizeSubmissionFormTitle(type, formData?.formName);
    const summaryName = formatSubmissionValue(formData?.name);
    const summaryEmail = formatSubmissionValue(formData?.email);
    const summaryPhone = formatSubmissionValue(formData?.phone);
    const details = entries.filter(([key]) => key !== 'formName');

    const metaLines = [
        `Brend: ${brandName}`,
        `Forma: ${formName}`,
        `Müraciət ID: ${submissionId}`,
        `Növ: ${typeLabel}`,
        `Tarix: ${createdAtLabel}`,
        `Ad və soyad: ${summaryName}`,
        `E-poçt: ${summaryEmail}`,
        `Telefon: ${summaryPhone}`
    ];
    const dataLines = details.map(([key, value]) => `${getSubmissionFieldLabel(key)}: ${formatSubmissionValue(value)}`);

    const text = [...metaLines, '', ...dataLines].join('\n');
    const htmlRows = details
        .map(([key, value], index) => `
            <div style="margin-top:${index === 0 ? '0' : '12px'};padding:16px 18px;border:1px solid #e2e8f0;border-radius:14px;background:${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">
                ${escapeHtml(getSubmissionFieldLabel(key))}
              </div>
              <div style="font-size:14px;color:#334155;line-height:1.65;font-weight:600;word-break:break-word;">
                ${escapeHtml(formatSubmissionValue(value))}
              </div>
            </div>`)
        .join('');

    const logoBlock = buildEmailLogoBlock(brandName, brandLogo);

    const html = `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(formName)} üçün yeni müraciət daxil oldu.
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:20px 10px;font-family:Arial,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
              <tr>
                <td style="background:#0f172a;padding:22px 20px;border-bottom:3px solid ${accentColor};">
                  <div style="text-align:left;">${logoBlock}</div>
                  <div style="margin-top:16px;">
                    <span style="display:inline-block;padding:8px 12px;border-radius:999px;background:${accentColor};color:#ffffff;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
                      ${escapeHtml(typeLabel)}
                    </span>
                  </div>
                  <h1 style="margin:16px 0 0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:900;text-transform:uppercase;">
                    ${escapeHtml(formName)}
                  </h1>
                  <p style="margin:8px 0 0;color:#cbd5e1;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                    ${escapeHtml(brandName)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;">
                    <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Müraciət ID</div>
                    <div style="margin-top:6px;font-size:15px;font-weight:800;color:#0f172a;word-break:break-word;">#${submissionId}</div>
                  </div>
                  <div style="margin-top:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;">
                    <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Tarix</div>
                    <div style="margin-top:6px;font-size:15px;font-weight:800;color:#0f172a;line-height:1.5;">${escapeHtml(createdAtLabel)}</div>
                  </div>

                  <div style="margin-top:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:16px 18px;">
                    <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">Ad və soyad</div>
                    <div style="margin-top:6px;font-size:14px;font-weight:800;color:#0f172a;line-height:1.55;word-break:break-word;">${escapeHtml(summaryName)}</div>
                  </div>
                  <div style="margin-top:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:16px 18px;">
                    <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">E-poçt</div>
                    <div style="margin-top:6px;font-size:14px;font-weight:800;color:#0f172a;line-height:1.55;word-break:break-word;">${escapeHtml(summaryEmail)}</div>
                  </div>
                  <div style="margin-top:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:16px 18px;">
                    <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">Telefon</div>
                    <div style="margin-top:6px;font-size:14px;font-weight:800;color:#0f172a;line-height:1.55;word-break:break-word;">${escapeHtml(summaryPhone)}</div>
                  </div>

                  <div style="margin-top:24px;font-size:11px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:0.15em;">
                    Müraciət Məlumatları
                  </div>
                  <div style="margin-top:12px;">
                    ${htmlRows || '<div style="padding:16px 18px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;color:#64748b;font-size:14px;">Məlumat daxil edilməyib.</div>'}
                  </div>

                  <div style="margin-top:24px;">
                    <a href="${escapeHtml(ADMIN_PANEL_URL)}" style="display:block;padding:14px 18px;border-radius:14px;background:${accentColor};color:#ffffff;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-align:center;">
                      Admin Panelini Aç
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6;">
                    Bu e-poçt avtomatik olaraq Azfin saytındakı forma müraciətlərindən göndərilir.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    return { text, html, typeLabel };
}

function buildSmtpTestEmailBody() {
    const { brandName, brandLogo } = getEmailBranding();
    const logoBlock = buildEmailLogoBlock(brandName, brandLogo);
    const sentAt = formatDateForEmail(new Date());
    const subject = `[${brandName}] SMTP Sınaq Məktubu`;
    const text = [
        `${brandName} SMTP sınaq məktubu`,
        `Göndərilmə vaxtı: ${sentAt}`,
        `Admin panel: ${ADMIN_PANEL_URL}`,
        '',
        'Bu məktub SMTP ayarlarının düzgün işlədiyini yoxlamaq üçün avtomatik yaradılıb.'
    ].join('\n');

    const html = `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(brandName)} SMTP test məktubu
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:20px 10px;font-family:Arial,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
              <tr>
                <td style="background:#0f172a;padding:22px 20px;border-bottom:3px solid #c6a153;">
                  <div style="text-align:left;">${logoBlock}</div>
                  <div style="margin-top:16px;">
                    <span style="display:inline-block;padding:8px 12px;border-radius:999px;background:#c6a153;color:#ffffff;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
                      SMTP SINAQ
                    </span>
                  </div>
                  <h1 style="margin:16px 0 0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:900;text-transform:uppercase;">
                    SMTP konfiqurasiyası işləyir
                  </h1>
                  <p style="margin:8px 0 0;color:#cbd5e1;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                    ${escapeHtml(brandName)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:18px 20px;">
                    <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Göndərilmə vaxtı</div>
                    <div style="margin-top:6px;font-size:15px;font-weight:800;color:#0f172a;line-height:1.55;word-break:break-word;">${escapeHtml(sentAt)}</div>
                  </div>
                  <div style="margin-top:16px;padding:18px 20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
                    <p style="margin:0;font-size:14px;line-height:1.75;color:#475569;">
                      Bu məktub AZFIN admin panelindəki SMTP ayarlarının düzgün qurulduğunu təsdiqləmək üçün göndərildi. Saytdakı əlaqə, audit və təlim formaları bundan sonra bu üslubda HTML məktub kimi çatdırılacaq.
                    </p>
                  </div>
                  <div style="margin-top:24px;">
                    <a href="${escapeHtml(ADMIN_PANEL_URL)}" style="display:block;padding:14px 18px;border-radius:14px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-align:center;">
                      Admin Panelinə Keç
                    </a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    return { subject, text, html };
}

function getSubmitterEmail(formData) {
    const value = typeof formData?.email === 'string' ? formData.email.trim() : '';
    return value || '';
}

function getSubmitterDisplayName(formData) {
    const candidates = [formData?.name, formData?.fullName];
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }
    return 'Hörmətli müraciətçi';
}

function getConfirmationMessageByType(type) {
    switch (type) {
        case 'contact':
            return 'Mesajınız qəbul olundu. Komandamız ən qısa zamanda sizinlə əlaqə saxlayacaq.';
        case 'audit':
            return 'Audit sorğunuz qəbul olundu. Mütəxəssislərimiz sorğunuzu nəzərdən keçirib sizinlə geri dönüş edəcəklər.';
        case 'training':
            return 'Təlim müraciətiniz qəbul olundu. Qeydiyyat və növbəti addımlarla bağlı qısa zamanda sizinlə əlaqə saxlanılacaq.';
        default:
            return 'Müraciətiniz uğurla qəbul olundu. Qısa zamanda sizinlə əlaqə saxlanılacaq.';
    }
}

function buildSubmitterConfirmationEmailBody({ type, formData, submissionId, createdAt }) {
    const { brandName, brandLogo } = getEmailBranding();
    const logoBlock = buildEmailLogoBlock(brandName, brandLogo);
    const typeLabel = getSubmissionTypeLabel(type);
    const accentColor = getSubmissionTypeAccent(type);
    const createdAtLabel = formatDateForEmail(createdAt);
    const displayName = getSubmitterDisplayName(formData);
    const formName = normalizeSubmissionFormTitle(type, formData?.formName);
    const followupMessage = getConfirmationMessageByType(type);
    const subject = `${brandName} | ${typeLabel} təsdiqi`;
    const text = [
        `${displayName}, salam.`,
        '',
        `${formName} üzrə müraciətiniz qəbul olundu.`,
        followupMessage,
        `Müraciət ID: ${submissionId}`,
        `Tarix: ${createdAtLabel}`,
        '',
        `${brandName}`
    ].join('\n');

    const html = `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(formName)} üzrə müraciətiniz qəbul olundu.
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:20px 10px;font-family:Arial,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
              <tr>
                <td style="background:#0f172a;padding:22px 20px;border-bottom:3px solid ${accentColor};">
                  <div style="text-align:left;">${logoBlock}</div>
                  <div style="margin-top:16px;">
                    <span style="display:inline-block;padding:8px 12px;border-radius:999px;background:${accentColor};color:#ffffff;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
                      TƏSDİQ
                    </span>
                  </div>
                  <h1 style="margin:16px 0 0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:900;text-transform:uppercase;">
                    Müraciətiniz qəbul olundu
                  </h1>
                  <p style="margin:8px 0 0;color:#cbd5e1;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                    ${escapeHtml(brandName)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <div style="padding:18px 20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
                    <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">
                      ${escapeHtml(displayName)}, salam. <strong style="color:#0f172a;">${escapeHtml(formName)}</strong> üzrə müraciətiniz qeydə alındı.
                    </p>
                    <p style="margin:14px 0 0;font-size:14px;line-height:1.75;color:#475569;">
                      ${escapeHtml(followupMessage)}
                    </p>
                  </div>

                  <div style="margin-top:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;">
                    <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Müraciət ID</div>
                    <div style="margin-top:6px;font-size:15px;font-weight:800;color:#0f172a;word-break:break-word;">#${submissionId}</div>
                  </div>
                  <div style="margin-top:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;">
                    <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Tarix</div>
                    <div style="margin-top:6px;font-size:15px;font-weight:800;color:#0f172a;line-height:1.55;word-break:break-word;">${escapeHtml(createdAtLabel)}</div>
                  </div>

                  <div style="margin-top:24px;">
                    <a href="${escapeHtml(PUBLIC_SITE_URL)}" style="display:block;padding:14px 18px;border-radius:14px;background:${accentColor};color:#ffffff;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-align:center;">
                      Sayta Keç
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6;">
                    Bu məktub avtomatik olaraq ${escapeHtml(brandName)} saytındakı forma müraciətinizə cavab olaraq göndərildi.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    return { subject, text, html };
}

function normalizeTrainingPayload(payload) {
    const t = payload && typeof payload === 'object' ? payload : {};
    const rawTitle = typeof t.title === 'string' ? t.title.trim() : '';
    const rawId = typeof t.id === 'string' ? t.id.trim() : '';
    const normalizeText = (value, fallback = '') => typeof value === 'string' ? value : fallback;

    return {
        id: rawId || randomUUID(),
        title: rawTitle || 'Adsız Təlim',
        description: normalizeText(t.description),
        fullContent: normalizeText(t.fullContent),
        syllabus: normalizeSyllabusEntries(t.syllabus),
        targetAudience: normalizeStringList(t.targetAudience),
        startDate: normalizeText(t.startDate),
        duration: normalizeText(t.duration),
        level: normalizeText(t.level),
        image: normalizeText(t.image),
        status: typeof t.status === 'string' && t.status.trim() ? t.status : 'upcoming',
        certLabel: normalizeText(t.certLabel),
        infoTitle: normalizeText(t.infoTitle),
        aboutTitle: normalizeText(t.aboutTitle, 'Təlim haqqında'),
        syllabusTitle: normalizeText(t.syllabusTitle, 'Təlim proqramı'),
        targetAudienceTitle: normalizeText(t.targetAudienceTitle, 'Bu kurs kimlər üçündür?'),
        durationLabel: normalizeText(t.durationLabel),
        startLabel: normalizeText(t.startLabel),
        statusLabel: normalizeText(t.statusLabel),
        sidebarNote: normalizeText(t.sidebarNote),
        highlightWord: normalizeText(t.highlightWord)
    };
}

function ensureDirectoryFor(fileOrDirPath, isDirectory = false) {
    const dirPath = isDirectory ? fileOrDirPath : path.dirname(fileOrDirPath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function toSnapshotFilePath(label) {
    const safeLabel = String(label || 'snapshot')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'snapshot';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(SNAPSHOT_DIR, `${safeLabel}-${timestamp}.json`);
}

function appendChangeLog(entry) {
    try {
        ensureDirectoryFor(CHANGE_LOG_PATH);
        fs.appendFileSync(CHANGE_LOG_PATH, `${JSON.stringify(entry)}\n`, 'utf-8');
    } catch (err) {
        console.warn('Failed to append change log:', err.message);
    }
}

function readJsonObject(filePath, label) {
    if (!fs.existsSync(filePath)) return null;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (err) {
        console.warn(`Failed to read ${label}:`, err.message);
        return null;
    }
}

function writeJsonObject(filePath, payload, label) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
    try {
        ensureDirectoryFor(filePath);
        ensureDirectoryFor(SNAPSHOT_DIR, true);

        const serialized = JSON.stringify(payload, null, 2);
        const tempPath = `${filePath}.tmp`;
        const snapshotPath = toSnapshotFilePath(label);

        fs.writeFileSync(tempPath, serialized, 'utf-8');
        fs.renameSync(tempPath, filePath);
        fs.writeFileSync(snapshotPath, serialized, 'utf-8');

        appendChangeLog({
            type: 'json_snapshot',
            label,
            filePath,
            snapshotPath,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.warn(`Failed to write ${label}:`, err.message);
    }
}

function readCurrentSitemap() {
    return readJsonObject(CURRENT_SITEMAP_PATH, 'current sitemap file');
}

function writeCurrentSitemap(navigation) {
    writeJsonObject(CURRENT_SITEMAP_PATH, navigation, 'current sitemap file');
}

function readCurrentSiteContent() {
    return readJsonObject(CURRENT_SITE_CONTENT_PATH, 'current site content file');
}

function writeCurrentSiteContent(content) {
    writeJsonObject(CURRENT_SITE_CONTENT_PATH, content, 'current site content file');
}

function readCurrentSmtpSettings() {
    return readJsonObject(CURRENT_SMTP_SETTINGS_PATH, 'current smtp settings file');
}

function writeCurrentSmtpSettings(settings) {
    writeJsonObject(CURRENT_SMTP_SETTINGS_PATH, settings, 'current smtp settings file');
}

async function getSmtpSettings() {
    const rows = await pool.all('SELECT config FROM smtp_settings WHERE id = ?', [SMTP_SETTINGS_ID]);
    const dbSettings = rows[0] ? parseDbJson(rows[0].config, {}) : {};
    const historySettings = await getLatestSmtpSettingsHistory() || {};
    const fileSettings = readCurrentSmtpSettings() || {};
    const merged = { ...DEFAULT_SMTP_SETTINGS, ...historySettings, ...dbSettings, ...fileSettings };
    return normalizeSmtpSettings(merged);
}

async function getLatestSiteSettingsHistory() {
    const rows = await pool.all(
        'SELECT content FROM site_settings_history WHERE site_settings_id = ? ORDER BY id DESC LIMIT 1',
        [1]
    );
    return rows[0] ? parseDbJson(rows[0].content, {}) : null;
}

async function getLatestSitemapHistory() {
    const rows = await pool.all(
        'SELECT content FROM sitemap_history ORDER BY id DESC LIMIT 1'
    );
    return rows[0] ? parseDbJson(rows[0].content, {}) : null;
}

async function getLatestSmtpSettingsHistory() {
    const rows = await pool.all(
        'SELECT config FROM smtp_settings_history WHERE smtp_settings_id = ? ORDER BY id DESC LIMIT 1',
        [SMTP_SETTINGS_ID]
    );
    return rows[0] ? parseDbJson(rows[0].config, {}) : null;
}

async function persistSiteSettings(payload) {
    const content = JSON.stringify(payload || {});
    const navigation = payload?.navigation || {};
    try {
        await pool.run('BEGIN TRANSACTION');
        await pool.run(
            'INSERT INTO site_settings (id, content) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content',
            [content]
        );
        await pool.run(
            'INSERT INTO site_settings_history (site_settings_id, content) VALUES (?, ?)',
            [1, content]
        );
        await pool.run(
            'INSERT INTO sitemap_history (content) VALUES (?)',
            [JSON.stringify(navigation)]
        );
        await pool.run('COMMIT');
    } catch (err) {
        await pool.run('ROLLBACK');
        throw err;
    }
}

async function persistSmtpSettings(normalized) {
    const serialized = JSON.stringify(normalized || {});
    try {
        await pool.run('BEGIN TRANSACTION');
        await pool.run(
            'INSERT INTO smtp_settings (id, config) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET config = excluded.config',
            [SMTP_SETTINGS_ID, serialized]
        );
        await pool.run(
            'INSERT INTO smtp_settings_history (smtp_settings_id, config) VALUES (?, ?)',
            [SMTP_SETTINGS_ID, serialized]
        );
        await pool.run('COMMIT');
    } catch (err) {
        await pool.run('ROLLBACK');
        throw err;
    }
}

async function ensurePersistentStateRecovered() {
    const siteRows = await pool.all('SELECT content FROM site_settings WHERE id = 1');
    if (siteRows.length === 0) {
        const recoveredSite = await getLatestSiteSettingsHistory() || readCurrentSiteContent();
        if (recoveredSite) {
            const serialized = JSON.stringify(recoveredSite);
            await pool.run(
                'INSERT INTO site_settings (id, content) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content',
                [serialized]
            );
        }
    }

    const smtpRows = await pool.all('SELECT config FROM smtp_settings WHERE id = ?', [SMTP_SETTINGS_ID]);
    if (smtpRows.length === 0) {
        const recoveredSmtp = await getLatestSmtpSettingsHistory() || readCurrentSmtpSettings() || DEFAULT_SMTP_SETTINGS;
        const serialized = JSON.stringify(normalizeSmtpSettings(recoveredSmtp));
        await pool.run(
            'INSERT INTO smtp_settings (id, config) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET config = excluded.config',
            [SMTP_SETTINGS_ID, serialized]
        );
    }
}

async function saveSmtpSettings(payload) {
    const normalized = normalizeSmtpSettings(payload);
    await persistSmtpSettings(normalized);
    writeCurrentSmtpSettings(normalized);
    return normalized;
}

function createSmtpTransporter(smtp) {
    const transporterConfig = {
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
    };

    if (smtp.user && smtp.pass) {
        transporterConfig.auth = {
            user: smtp.user,
            pass: smtp.pass
        };
    }

    return nodemailer.createTransport(transporterConfig);
}

function validateSmtpDeliverySettings(smtp) {
    const fromAddress = smtp.from || smtp.user;
    if (!smtp.host || !smtp.port || !smtp.to || !fromAddress) {
        return { valid: false, fromAddress: '', reason: 'SMTP config is incomplete' };
    }
    return { valid: true, fromAddress, reason: null };
}

async function sendSubmissionNotification({ type, formData, submissionId, createdAt }) {
    const smtp = await getSmtpSettings();
    if (!smtp.enabled) {
        return { sent: false, skipped: true, reason: 'SMTP disabled' };
    }

    const { valid, fromAddress, reason } = validateSmtpDeliverySettings(smtp);
    if (!valid) {
        return { sent: false, skipped: true, reason };
    }

    const transporter = createSmtpTransporter(smtp);
    const { text, html, typeLabel } = buildSubmissionEmailBody({ type, submissionId, formData, createdAt });
    const subjectPrefix = smtp.subjectPrefix || DEFAULT_SMTP_SETTINGS.subjectPrefix;
    const subject = `[${subjectPrefix}] ${typeLabel} #${submissionId}`;
    const replyTo = typeof formData?.email === 'string' && formData.email.trim() ? formData.email.trim() : undefined;

    await transporter.sendMail({
        from: fromAddress,
        to: smtp.to,
        cc: smtp.cc || undefined,
        bcc: smtp.bcc || undefined,
        subject,
        text,
        html,
        replyTo
    });

    return { sent: true };
}

async function sendSubmitterConfirmation({ type, formData, submissionId, createdAt }) {
    const submitterEmail = getSubmitterEmail(formData);
    if (!submitterEmail) {
        return { sent: false, skipped: true, reason: 'Submitter email missing' };
    }

    const smtp = await getSmtpSettings();
    if (!smtp.enabled) {
        return { sent: false, skipped: true, reason: 'SMTP disabled' };
    }

    const fromAddress = smtp.from || smtp.user;
    if (!smtp.host || !smtp.port || !fromAddress) {
        return { sent: false, skipped: true, reason: 'SMTP config is incomplete' };
    }

    const transporter = createSmtpTransporter(smtp);
    const { subject, text, html } = buildSubmitterConfirmationEmailBody({
        type,
        formData,
        submissionId,
        createdAt
    });

    await transporter.sendMail({
        from: fromAddress,
        to: submitterEmail,
        subject,
        text,
        html
    });

    return { sent: true };
}

async function sendSmtpTestEmail(payload) {
    const smtp = normalizeSmtpSettings(payload);
    const { valid, fromAddress, reason } = validateSmtpDeliverySettings(smtp);
    if (!valid) {
        return { sent: false, reason };
    }

    const transporter = createSmtpTransporter(smtp);
    const { subject, text, html } = buildSmtpTestEmailBody();

    await transporter.sendMail({
        from: fromAddress,
        to: smtp.to,
        cc: smtp.cc || undefined,
        bcc: smtp.bcc || undefined,
        subject,
        text,
        html
    });

    return { sent: true };
}

async function initDb() {
    try {
        dbReady = false;
        ensureDirectoryFor(dbConfig.filename);
        pool = await open({
            filename: dbConfig.filename,
            driver: sqlite3.Database
        });
        console.log('Connected to SQLite database');

        // Initial table creation
        await pool.run(`
            CREATE TABLE IF NOT EXISTS site_settings (
                id INTEGER PRIMARY KEY,
                content TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.run(`
            CREATE TABLE IF NOT EXISTS site_settings_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                site_settings_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.run('CREATE INDEX IF NOT EXISTS idx_site_settings_history_settings_id ON site_settings_history(site_settings_id)');
        await pool.run('CREATE INDEX IF NOT EXISTS idx_site_settings_history_created_at ON site_settings_history(created_at)');

        await pool.run(`
            CREATE TABLE IF NOT EXISTS blog_posts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                excerpt TEXT,
                content TEXT,
                date TEXT,
                author TEXT,
                image TEXT,
                category TEXT,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.run(`
            CREATE TABLE IF NOT EXISTS trainings (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                fullContent TEXT,
                syllabus TEXT,
                targetAudience TEXT,
                startDate TEXT,
                duration TEXT,
                level TEXT,
                image TEXT,
                status TEXT,
                certLabel TEXT,
                infoTitle TEXT,
                aboutTitle TEXT,
                syllabusTitle TEXT,
                targetAudienceTitle TEXT,
                durationLabel TEXT,
                startLabel TEXT,
                statusLabel TEXT,
                sidebarNote TEXT,
                highlightWord TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Sync columns
        await ensureColumn('trainings', 'fullContent', 'TEXT');
        await ensureColumn('trainings', 'syllabus', 'TEXT');
        await ensureColumn('trainings', 'targetAudience', 'TEXT');
        await ensureColumn('trainings', 'certLabel', 'TEXT');
        await ensureColumn('trainings', 'infoTitle', 'TEXT');
        await ensureColumn('trainings', 'aboutTitle', 'TEXT');
        await ensureColumn('trainings', 'syllabusTitle', 'TEXT');
        await ensureColumn('trainings', 'targetAudienceTitle', 'TEXT');
        await ensureColumn('trainings', 'durationLabel', 'TEXT');
        await ensureColumn('trainings', 'startLabel', 'TEXT');
        await ensureColumn('trainings', 'statusLabel', 'TEXT');
        await ensureColumn('trainings', 'sidebarNote', 'TEXT');
        await ensureColumn('trainings', 'highlightWord', 'TEXT');

        await pool.run(`
            CREATE TABLE IF NOT EXISTS form_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                form_data TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.run(`
            CREATE TABLE IF NOT EXISTS smtp_settings (
                id INTEGER PRIMARY KEY,
                config TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.run(`
            CREATE TABLE IF NOT EXISTS smtp_settings_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                smtp_settings_id INTEGER NOT NULL,
                config TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.run('CREATE INDEX IF NOT EXISTS idx_smtp_settings_history_settings_id ON smtp_settings_history(smtp_settings_id)');
        await pool.run('CREATE INDEX IF NOT EXISTS idx_smtp_settings_history_created_at ON smtp_settings_history(created_at)');

        await pool.run(`
            CREATE TABLE IF NOT EXISTS sitemap_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.run('CREATE INDEX IF NOT EXISTS idx_sitemap_history_created_at ON sitemap_history(created_at)');

        await pool.run(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const seededSmtp = normalizeSmtpSettings(readCurrentSmtpSettings() || DEFAULT_SMTP_SETTINGS);
        const smtpDefaults = JSON.stringify(seededSmtp);
        await pool.run(
            'INSERT INTO smtp_settings (id, config) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET id = id',
            [SMTP_SETTINGS_ID, smtpDefaults]
        );
        writeCurrentSmtpSettings(seededSmtp);
        await ensurePersistentStateRecovered();

        dbReady = true;
        lastDbInitError = null;
        console.log('Database tables verified/created');
    } catch (err) {
        dbReady = false;
        lastDbInitError = err;
        if (pool) {
            try {
                await pool.close();
            } catch (_) {
                // noop
            }
            pool = null;
        }
        throw err;
    }
}

async function initDbWithRetry() {
    let attempt = 0;
    for (;;) {
        attempt += 1;
        try {
            await initDb();
            return;
        } catch (err) {
            lastDbInitError = err;
            console.error(`Database initialization failed (attempt ${attempt}):`, err.message);
            if (DB_MAX_RETRIES > 0 && attempt >= DB_MAX_RETRIES) {
                process.exit(1);
            }
            await sleep(DB_RETRY_DELAY_MS);
        }
    }
}

function startDbInitialization() {
    if (dbInitPromise) return dbInitPromise;
    dbInitStartedAt = new Date().toISOString();
    dbInitPromise = initDbWithRetry();
    return dbInitPromise;
}

async function waitForDbReady(timeoutMs = DB_REQUEST_WAIT_MS) {
    if (isDbAvailable()) return true;

    const initPromise = startDbInitialization();
    if (!timeoutMs || timeoutMs <= 0) {
        return isDbAvailable();
    }

    await Promise.race([
        initPromise.then(() => true),
        sleep(timeoutMs).then(() => false)
    ]);

    return isDbAvailable();
}

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    const isOptionalRoute = req.path === '/api/health'
        || (req.path === '/api/settings' && req.method === 'GET');

    if (isOptionalRoute || !req.path.startsWith('/api/')) {
        return next();
    }

    if (isDbAvailable()) {
        return next();
    }

    try {
        const ready = await waitForDbReady();
        if (ready) {
            return next();
        }
    } catch (_) {
        // noop; fallback to the structured 503 below
    }

    return res.status(503).json({
        error: getDbUnavailableMessage(),
        code: 'DB_NOT_READY'
    });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- AUTH ENDPOINT ---
app.get('/api/admin/bootstrap', async (req, res) => {
    try {
        const rows = await pool.all('SELECT COUNT(*) AS count FROM admin_users');
        res.json({ hasAdmin: Number(rows[0]?.count || 0) > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/register', async (req, res) => {
    try {
        const validation = validateAdminCredentials(req.body?.username, req.body?.password);
        if (!validation.ok) {
            return res.status(400).json({ error: validation.error });
        }

        const rows = await pool.all('SELECT COUNT(*) AS count FROM admin_users');
        if (Number(rows[0]?.count || 0) > 0) {
            return res.status(409).json({ error: 'Admin hesabı artıq mövcuddur.' });
        }

        const hashedPassword = hashPassword(validation.password);
        const result = await pool.run(
            'INSERT INTO admin_users (username, password) VALUES (?, ?)',
            [validation.username, hashedPassword]
        );
        const adminUser = {
            id: result.lastID,
            username: validation.username
        };

        res.json({
            success: true,
            user: adminUser,
            access_token: createAdminAccessToken(adminUser)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/users', requireAdminAuth, async (req, res) => {
    try {
        const rows = await pool.all(
            'SELECT id, username, created_at FROM admin_users ORDER BY created_at ASC, id ASC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/users', requireAdminAuth, async (req, res) => {
    try {
        const validation = validateAdminCredentials(req.body?.username, req.body?.password);
        if (!validation.ok) {
            return res.status(400).json({ error: validation.error });
        }

        const existing = await pool.all(
            'SELECT id FROM admin_users WHERE username = ? LIMIT 1',
            [validation.username]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Bu istifadəçi adı artıq mövcuddur.' });
        }

        await pool.run(
            'INSERT INTO admin_users (username, password) VALUES (?, ?)',
            [validation.username, hashPassword(validation.password)]
        );

        const rows = await pool.all(
            'SELECT id, username, created_at FROM admin_users ORDER BY created_at ASC, id ASC'
        );
        res.json({ success: true, users: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', requireAdminAuth, async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ error: 'Etibarsız istifadəçi ID-si.' });
        }

        const countRows = await pool.all('SELECT COUNT(*) AS count FROM admin_users');
        if (Number(countRows[0]?.count || 0) <= 1) {
            return res.status(400).json({ error: 'Son admin hesabı silinə bilməz.' });
        }

        const result = await pool.run('DELETE FROM admin_users WHERE id = ?', [userId]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Admin hesabı tapılmadı.' });
        }

        const rows = await pool.all(
            'SELECT id, username, created_at FROM admin_users ORDER BY created_at ASC, id ASC'
        );
        res.json({ success: true, users: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/share/blog/:id', async (req, res) => {
    try {
        const rows = await pool.all('SELECT * FROM blog_posts WHERE id = ? LIMIT 1', [req.params.id]);
        const post = rows[0];
        const targetUrl = `${PUBLIC_SITE_URL.replace(/\/$/, '')}/blog/${encodeURIComponent(req.params.id)}`;

        if (!post) {
            return res.status(404).send(`<!DOCTYPE html>
<html lang="az">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${targetUrl}" />
    <title>Azfin Bloq</title>
  </head>
  <body>
    <a href="${targetUrl}">Yönləndirilir...</a>
  </body>
</html>`);
        }

        const title = escapeHtml(`${post.title || 'Azfin Bloq'} | Azfin Bloq`);
        const description = escapeHtml(buildShareDescription(post));
        const imageUrl = escapeHtml(toPublicUrl(post.image || ''));
        const canonicalUrl = escapeHtml(targetUrl);

        res.type('html').send(`<!DOCTYPE html>
<html lang="az">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonicalUrl}" />
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
    <meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ''}
    <link rel="canonical" href="${canonicalUrl}" />
    <meta http-equiv="refresh" content="0; url=${canonicalUrl}" />
    <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <p>Yönləndirilir...</p>
    <p><a href="${canonicalUrl}">${canonicalUrl}</a></p>
  </body>
</html>`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        const rows = await pool.all(
            'SELECT * FROM admin_users WHERE username = ? LIMIT 1',
            [username]
        );
        const user = rows[0];

        if (!user || !verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır.' });
        }

        // Upgrade legacy plaintext passwords to hashed storage after successful login.
        if (typeof user.password === 'string' && !user.password.startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
            await pool.run(
                'UPDATE admin_users SET password = ? WHERE id = ?',
                [hashPassword(password), user.id]
            );
        }

        const adminUser = { id: user.id, username: user.username };
        res.json({ user: adminUser, access_token: createAdminAccessToken(adminUser) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SETTINGS ENDPOINTS ---
app.get('/api/settings', async (req, res) => {
    try {
        let dbContent = {};
        let historyContent = {};
        const fileContent = readCurrentSiteContent();
        let currentSitemap = readCurrentSitemap();

        if (isDbAvailable()) {
            const rows = await pool.all('SELECT content FROM site_settings WHERE id = 1');
            dbContent = rows[0] ? parseDbJson(rows[0].content, {}) : {};
            historyContent = await getLatestSiteSettingsHistory() || {};
            if (!currentSitemap) {
                currentSitemap = await getLatestSitemapHistory();
            }
        }

        const content = { ...historyContent, ...fileContent, ...dbContent };
        if (currentSitemap) {
            content.navigation = currentSitemap;
        }
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', requireAdminAuth, async (req, res) => {
    try {
        const payload = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {};
        writeCurrentSiteContent(payload);
        writeCurrentSitemap(payload.navigation);

        if (!isDbAvailable()) {
            return res.json({
                success: true,
                persisted: 'file',
                warning: getDbUnavailableMessage()
            });
        }

        await persistSiteSettings(payload);
        res.json({ success: true, persisted: 'database' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/smtp-settings', requireAdminAuth, async (req, res) => {
    try {
        const settings = isDbAvailable()
            ? await getSmtpSettings()
            : normalizeSmtpSettings(readCurrentSmtpSettings() || DEFAULT_SMTP_SETTINGS);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/smtp-settings', requireAdminAuth, async (req, res) => {
    try {
        const payload = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {};
        const normalized = normalizeSmtpSettings(payload);

        if (!isDbAvailable()) {
            writeCurrentSmtpSettings(normalized);
            return res.json({
                success: true,
                settings: normalized,
                persisted: 'file',
                warning: getDbUnavailableMessage()
            });
        }

        const settings = await saveSmtpSettings(payload);
        res.json({ success: true, settings, persisted: 'database' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/smtp-settings/test', requireAdminAuth, async (req, res) => {
    try {
        const payload = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {};
        const result = await sendSmtpTestEmail(payload);
        if (!result.sent) {
            return res.status(400).json({ error: result.reason || 'SMTP test failed' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BLOG ENDPOINTS ---
app.get('/api/blog', async (req, res) => {
    try {
        const rows = await pool.all('SELECT * FROM blog_posts ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/blog', requireAdminAuth, async (req, res) => {
    try {
        const post = req.body;
        const query = `
            INSERT INTO blog_posts (id, title, excerpt, content, date, author, image, category, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
                title=excluded.title, 
                excerpt=excluded.excerpt, 
                content=excluded.content, 
                date=excluded.date, 
                author=excluded.author, 
                image=excluded.image, 
                category=excluded.category, 
                status=excluded.status
        `;
        const params = [
            post.id, post.title, post.excerpt, post.content, post.date, post.author, post.image, post.category, post.status
        ];
        await pool.run(query, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/blog/:id', requireAdminAuth, async (req, res) => {
    try {
        await pool.run('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TRAINING ENDPOINTS ---
app.get('/api/trainings', async (req, res) => {
    try {
        const rows = await pool.all('SELECT * FROM trainings ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('GET /api/trainings failed:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/trainings', requireAdminAuth, async (req, res) => {
    try {
        const t = normalizeTrainingPayload(req.body);

        const syllabusJson = JSON.stringify(t.syllabus);
        const targetAudienceJson = JSON.stringify(t.targetAudience);
        const insertValues = [
            t.id, t.title, t.description, t.fullContent, syllabusJson, targetAudienceJson, t.startDate, t.duration, t.level, t.image, t.status, t.certLabel, t.infoTitle, t.aboutTitle, t.syllabusTitle, t.targetAudienceTitle, t.durationLabel, t.startLabel, t.statusLabel, t.sidebarNote, t.highlightWord
        ].map(toSqlValue);
        const updateValues = [
            t.title, t.description, t.fullContent, syllabusJson, targetAudienceJson, t.startDate, t.duration, t.level, t.image, t.status, t.certLabel, t.infoTitle, t.aboutTitle, t.syllabusTitle, t.targetAudienceTitle, t.durationLabel, t.startLabel, t.statusLabel, t.sidebarNote, t.highlightWord
        ].map(toSqlValue);
        const query = `
            INSERT INTO trainings (id, title, description, fullContent, syllabus, targetAudience, startDate, duration, level, image, status, certLabel, infoTitle, aboutTitle, syllabusTitle, targetAudienceTitle, durationLabel, startLabel, statusLabel, sidebarNote, highlightWord)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
                title=excluded.title, description=excluded.description, fullContent=excluded.fullContent, syllabus=excluded.syllabus, targetAudience=excluded.targetAudience, startDate=excluded.startDate, duration=excluded.duration, level=excluded.level, image=excluded.image, status=excluded.status, certLabel=excluded.certLabel, infoTitle=excluded.infoTitle, aboutTitle=excluded.aboutTitle, syllabusTitle=excluded.syllabusTitle, targetAudienceTitle=excluded.targetAudienceTitle, durationLabel=excluded.durationLabel, startLabel=excluded.startLabel, statusLabel=excluded.statusLabel, sidebarNote=excluded.sidebarNote, highlightWord=excluded.highlightWord
        `;
        const params = insertValues;
        await pool.run(query, params);
        res.json({ success: true });
    } catch (err) {
        console.error('POST /api/trainings failed:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/trainings/:id', requireAdminAuth, async (req, res) => {
    try {
        await pool.run('DELETE FROM trainings WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SUBMISSION ENDPOINTS ---
app.get('/api/submissions', requireAdminAuth, async (req, res) => {
    try {
        const rows = await pool.all('SELECT * FROM form_submissions ORDER BY created_at DESC');
        const normalizedRows = rows.map((row) => ({
            ...row,
            form_data: parseDbJson(row.form_data, {})
        }));
        res.json(normalizedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/submissions', async (req, res) => {
    try {
        const { type, form_data } = req.body || {};
        const normalizedType = typeof type === 'string' ? type.trim() : '';
        const normalizedFormData = form_data && typeof form_data === 'object' && !Array.isArray(form_data)
            ? form_data
            : {};

        if (!normalizedType) {
            return res.status(400).json({ error: 'Form type is required.' });
        }

        const result = await pool.run(
            'INSERT INTO form_submissions (type, form_data) VALUES (?, ?)',
            [normalizedType, JSON.stringify(normalizedFormData)]
        );

        const submissionId = result.lastID;
        const createdAt = new Date();
        let mailSent = false;
        let mailInfo = null;
        let confirmationSent = false;
        let confirmationInfo = null;

        try {
            const emailResult = await sendSubmissionNotification({
                type: normalizedType,
                formData: normalizedFormData,
                submissionId,
                createdAt
            });
            mailSent = emailResult.sent;
            if (!emailResult.sent) {
                mailInfo = emailResult.reason || 'Email skipped';
            }
        } catch (mailErr) {
            console.error('Submission email send failed:', mailErr.message);
            mailInfo = `Email failed: ${mailErr.message}`;
        }

        try {
            const confirmationResult = await sendSubmitterConfirmation({
                type: normalizedType,
                formData: normalizedFormData,
                submissionId,
                createdAt
            });
            confirmationSent = confirmationResult.sent;
            if (!confirmationResult.sent) {
                confirmationInfo = confirmationResult.reason || 'Confirmation email skipped';
            }
        } catch (mailErr) {
            console.error('Submitter confirmation email failed:', mailErr.message);
            confirmationInfo = `Confirmation email failed: ${mailErr.message}`;
        }

        res.json({ success: true, id: submissionId, mailSent, mailInfo, confirmationSent, confirmationInfo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/submissions/:id', requireAdminAuth, async (req, res) => {
    try {
        await pool.run('UPDATE form_submissions SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/submissions/:id', requireAdminAuth, async (req, res) => {
    try {
        await pool.run('DELETE FROM form_submissions WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- UPLOAD ENDPOINT ---
app.post('/api/upload', requireAdminAuth, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = `/uploads/${req.file.filename}`;
    res.json({
        url: relativePath,
        filename: req.file.filename
    });
});

// Basic health check
app.get('/api/health', (req, res) => {
    res.status(isDbAvailable() ? 200 : 503).json({
        status: isDbAvailable() ? 'ok' : 'degraded',
        dbReady: isDbAvailable(),
        dbInitStartedAt,
        dbError: lastDbInitError?.message || null
    });
});

async function startServer() {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend server running on port ${PORT}`);
        console.log(`Uploads directory: ${UPLOADS_DIR}`);
        startDbInitialization().catch((err) => {
            console.error('Background database initialization failed:', err.message);
        });
    });
}

startServer();
