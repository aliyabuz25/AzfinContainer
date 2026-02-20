require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { randomUUID } = require('crypto');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const CURRENT_SITEMAP_PATH = process.env.CURRENT_SITEMAP_PATH || path.join(UPLOADS_DIR, 'current-sitemap.json');
const CURRENT_SITE_CONTENT_PATH = process.env.CURRENT_SITE_CONTENT_PATH || path.join(UPLOADS_DIR, 'current-site-content.json');
const CURRENT_SMTP_SETTINGS_PATH = process.env.CURRENT_SMTP_SETTINGS_PATH || path.join(UPLOADS_DIR, 'current-smtp-settings.json');
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '25mb';
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 5000);
const DB_MAX_RETRIES = Number(process.env.DB_MAX_RETRIES || 0); // 0 => unlimited
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
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'azfin_user',
    password: process.env.DB_PASSWORD || 'azfin_password',
    database: process.env.DB_NAME || 'azfin_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureColumn(tableName, columnName, definition) {
    const [rows] = await pool.execute(
        `SELECT 1
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ?
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [dbConfig.database, tableName, columnName]
    );

    if (rows.length === 0) {
        await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
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
        return new Intl.DateTimeFormat('az-AZ', {
            dateStyle: 'full',
            timeStyle: 'short'
        }).format(dateValue);
    } catch (_) {
        return dateValue.toISOString();
    }
}

function buildSubmissionEmailBody({ type, submissionId, formData, createdAt }) {
    const typeLabel = getSubmissionTypeLabel(type);
    const entries = Object.entries(formData || {});
    const siteContent = readCurrentSiteContent() || {};
    const siteSettings = siteContent.settings || {};
    const brandName = siteSettings.siteTitle || 'AZFIN GROUP MMC';
    const brandLogo = toPublicUrl(siteSettings.navbarLogo || siteSettings.footerLogo || '');
    const accentColor = getSubmissionTypeAccent(type);
    const createdAtLabel = formatDateForEmail(createdAt);
    const formName = typeof formData?.formName === 'string' && formData.formName.trim()
        ? formData.formName.trim()
        : typeLabel;
    const summaryName = formatSubmissionValue(formData?.name);
    const summaryEmail = formatSubmissionValue(formData?.email);
    const summaryPhone = formatSubmissionValue(formData?.phone);
    const details = entries.filter(([key]) => key !== 'formName');

    const metaLines = [
        `Brand: ${brandName}`,
        `Form: ${formName}`,
        `Submission ID: ${submissionId}`,
        `Type: ${typeLabel}`,
        `Created At: ${createdAtLabel}`,
        `Name: ${summaryName}`,
        `Email: ${summaryEmail}`,
        `Phone: ${summaryPhone}`
    ];
    const dataLines = details.map(([key, value]) => `${prettifyFieldKey(key)}: ${formatSubmissionValue(value)}`);

    const text = [...metaLines, '', ...dataLines].join('\n');
    const htmlRows = details
        .map(([key, value], index) => `
            <tr>
              <td style="padding:12px 14px;border:1px solid #e2e8f0;font-weight:700;font-size:13px;color:#0f172a;background:${index % 2 === 0 ? '#ffffff' : '#f8fafc'};vertical-align:top;width:34%;">
                ${escapeHtml(prettifyFieldKey(key))}
              </td>
              <td style="padding:12px 14px;border:1px solid #e2e8f0;font-size:13px;color:#334155;background:${index % 2 === 0 ? '#ffffff' : '#f8fafc'};line-height:1.55;">
                ${escapeHtml(formatSubmissionValue(value))}
              </td>
            </tr>`)
        .join('');

    const logoBlock = brandLogo
        ? `<img src="${escapeHtml(brandLogo)}" alt="${escapeHtml(brandName)}" style="height:38px;max-width:180px;display:block;object-fit:contain;" />`
        : `<span style="display:inline-block;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.02em;">AZFIN</span>`;

    const html = `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(formName)} üçün yeni müraciət daxil oldu.
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;font-family:Arial,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:760px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
              <tr>
                <td style="background:#0f172a;padding:22px 24px;border-bottom:3px solid ${accentColor};">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;">${logoBlock}</td>
                      <td align="right" style="vertical-align:middle;">
                        <span style="display:inline-block;padding:8px 12px;border-radius:999px;background:${accentColor};color:#ffffff;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
                          ${escapeHtml(typeLabel)}
                        </span>
                      </td>
                    </tr>
                  </table>
                  <h1 style="margin:16px 0 0;color:#ffffff;font-size:22px;line-height:1.25;font-weight:900;text-transform:uppercase;">
                    ${escapeHtml(formName)}
                  </h1>
                  <p style="margin:8px 0 0;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                    ${escapeHtml(brandName)}
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:22px 24px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 10px;">
                    <tr>
                      <td style="width:50%;padding-right:8px;">
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
                          <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Müraciət ID</div>
                          <div style="margin-top:4px;font-size:14px;font-weight:800;color:#0f172a;">#${submissionId}</div>
                        </div>
                      </td>
                      <td style="width:50%;padding-left:8px;">
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
                          <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Tarix</div>
                          <div style="margin-top:4px;font-size:14px;font-weight:800;color:#0f172a;">${escapeHtml(createdAtLabel)}</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="width:33.33%;padding-right:8px;">
                        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:10px 12px;">
                          <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">Ad Soyad</div>
                          <div style="margin-top:4px;font-size:13px;font-weight:700;color:#0f172a;line-height:1.4;">${escapeHtml(summaryName)}</div>
                        </div>
                      </td>
                      <td style="width:33.33%;padding:0 4px;">
                        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:10px 12px;">
                          <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">E-poçt</div>
                          <div style="margin-top:4px;font-size:13px;font-weight:700;color:#0f172a;line-height:1.4;">${escapeHtml(summaryEmail)}</div>
                        </div>
                      </td>
                      <td style="width:33.33%;padding-left:8px;">
                        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:10px 12px;">
                          <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">Telefon</div>
                          <div style="margin-top:4px;font-size:13px;font-weight:700;color:#0f172a;line-height:1.4;">${escapeHtml(summaryPhone)}</div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:6px 24px 24px;">
                  <div style="font-size:11px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">
                    Form Məlumatları
                  </div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;">
                    <thead>
                      <tr>
                        <th style="padding:12px 14px;border:1px solid #dbe7ff;background:#eff6ff;text-align:left;font-size:12px;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;">Sahə</th>
                        <th style="padding:12px 14px;border:1px solid #dbe7ff;background:#eff6ff;text-align:left;font-size:12px;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;">Dəyər</th>
                      </tr>
                    </thead>
                    <tbody>${htmlRows || '<tr><td colspan="2" style="padding:12px 14px;border:1px solid #e2e8f0;color:#64748b;">Məlumat daxil edilməyib.</td></tr>'}</tbody>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 24px 24px;">
                  <a href="${escapeHtml(ADMIN_PANEL_URL)}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:${accentColor};color:#ffffff;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
                    Admin Paneldə Aç
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
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

function normalizeTrainingPayload(payload) {
    const t = payload && typeof payload === 'object' ? payload : {};
    const rawTitle = typeof t.title === 'string' ? t.title.trim() : '';
    const rawId = typeof t.id === 'string' ? t.id.trim() : '';

    return {
        ...t,
        id: rawId || randomUUID(),
        title: rawTitle || 'Adsız Təlim',
        status: typeof t.status === 'string' && t.status.trim() ? t.status : 'upcoming'
    };
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
        fs.writeFileSync(
            filePath,
            JSON.stringify(payload, null, 2),
            'utf-8'
        );
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
    const [rows] = await pool.execute('SELECT config FROM smtp_settings WHERE id = ?', [SMTP_SETTINGS_ID]);
    const dbSettings = rows[0] ? parseDbJson(rows[0].config, {}) : {};
    const fileSettings = readCurrentSmtpSettings() || {};
    const merged = { ...DEFAULT_SMTP_SETTINGS, ...dbSettings, ...fileSettings };
    return normalizeSmtpSettings(merged);
}

async function saveSmtpSettings(payload) {
    const normalized = normalizeSmtpSettings(payload);
    const serialized = JSON.stringify(normalized);
    await pool.execute(
        'INSERT INTO smtp_settings (id, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE config = ?',
        [SMTP_SETTINGS_ID, serialized, serialized]
    );
    writeCurrentSmtpSettings(normalized);
    return normalized;
}

async function sendSubmissionNotification({ type, formData, submissionId, createdAt }) {
    const smtp = await getSmtpSettings();
    if (!smtp.enabled) {
        return { sent: false, skipped: true, reason: 'SMTP disabled' };
    }

    const fromAddress = smtp.from || smtp.user;
    if (!smtp.host || !smtp.port || !smtp.to || !fromAddress) {
        return { sent: false, skipped: true, reason: 'SMTP config is incomplete' };
    }

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

    const transporter = nodemailer.createTransport(transporterConfig);
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

async function initDb() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Connected to MySQL database');

        // Initial table creation
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS site_settings (
                id INT PRIMARY KEY,
                content JSON NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS blog_posts (
                id VARCHAR(255) PRIMARY KEY,
                title TEXT NOT NULL,
                excerpt TEXT,
                content LONGTEXT,
                date TEXT,
                author TEXT,
                image TEXT,
                category TEXT,
                status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS trainings (
                id VARCHAR(255) PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                fullContent LONGTEXT,
                syllabus JSON,
                startDate TEXT,
                duration TEXT,
                level TEXT,
                image TEXT,
                status TEXT,
                certLabel TEXT,
                infoTitle TEXT,
                aboutTitle TEXT,
                syllabusTitle TEXT,
                durationLabel TEXT,
                startLabel TEXT,
                statusLabel TEXT,
                sidebarNote TEXT,
                highlightWord TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Keep old production schemas in sync with the fields used by INSERT/UPDATE queries.
        await ensureColumn('trainings', 'fullContent', 'LONGTEXT');
        await ensureColumn('trainings', 'syllabus', 'JSON');
        await ensureColumn('trainings', 'certLabel', 'TEXT');
        await ensureColumn('trainings', 'infoTitle', 'TEXT');
        await ensureColumn('trainings', 'aboutTitle', 'TEXT');
        await ensureColumn('trainings', 'syllabusTitle', 'TEXT');
        await ensureColumn('trainings', 'durationLabel', 'TEXT');
        await ensureColumn('trainings', 'startLabel', 'TEXT');
        await ensureColumn('trainings', 'statusLabel', 'TEXT');
        await ensureColumn('trainings', 'sidebarNote', 'TEXT');
        await ensureColumn('trainings', 'highlightWord', 'TEXT');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS form_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type TEXT NOT NULL,
                form_data JSON NOT NULL,
                status VARCHAR(50) DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS smtp_settings (
                id INT PRIMARY KEY,
                config JSON NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed default admin if none exists
        const [users] = await pool.execute('SELECT * FROM admin_users LIMIT 1');
        if (users.length === 0) {
            await pool.execute(
                'INSERT INTO admin_users (username, password) VALUES (?, ?)',
                ['tural', 'rootazfinA1']
            );
        }

        const seededSmtp = normalizeSmtpSettings(readCurrentSmtpSettings() || DEFAULT_SMTP_SETTINGS);
        const smtpDefaults = JSON.stringify(seededSmtp);
        await pool.execute(
            'INSERT INTO smtp_settings (id, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = id',
            [SMTP_SETTINGS_ID, smtpDefaults]
        );
        writeCurrentSmtpSettings(seededSmtp);

        console.log('Database tables verified/created');
    } catch (err) {
        if (pool) {
            try {
                await pool.end();
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
            console.error(`Database initialization failed (attempt ${attempt}):`, err.message);
            if (DB_MAX_RETRIES > 0 && attempt >= DB_MAX_RETRIES) {
                process.exit(1);
            }
            await sleep(DB_RETRY_DELAY_MS);
        }
    }
}

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));

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
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.execute(
            'SELECT * FROM admin_users WHERE username = ? AND password = ?',
            [username, password]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır.' });
        }
        res.json({ user: { username: rows[0].username }, access_token: 'custom-token' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SETTINGS ENDPOINTS ---
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT content FROM site_settings WHERE id = 1');
        const dbContent = rows[0] ? parseDbJson(rows[0].content, {}) : {};
        const fileContent = readCurrentSiteContent();
        const content = fileContent || dbContent || {};
        const currentSitemap = readCurrentSitemap();
        if (currentSitemap) {
            content.navigation = currentSitemap;
        }
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const payload = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {};
        writeCurrentSiteContent(payload);
        writeCurrentSitemap(payload.navigation);
        const content = JSON.stringify(payload);
        await pool.execute(
            'INSERT INTO site_settings (id, content) VALUES (1, ?) ON DUPLICATE KEY UPDATE content = ?',
            [content, content]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/smtp-settings', async (req, res) => {
    try {
        const settings = await getSmtpSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/smtp-settings', async (req, res) => {
    try {
        const payload = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {};
        const settings = await saveSmtpSettings(payload);
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BLOG ENDPOINTS ---
app.get('/api/blog', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM blog_posts ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/blog', async (req, res) => {
    try {
        const post = req.body;
        const query = `
            INSERT INTO blog_posts (id, title, excerpt, content, date, author, image, category, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                title=?, excerpt=?, content=?, date=?, author=?, image=?, category=?, status=?
        `;
        const params = [
            post.id, post.title, post.excerpt, post.content, post.date, post.author, post.image, post.category, post.status,
            post.title, post.excerpt, post.content, post.date, post.author, post.image, post.category, post.status
        ];
        await pool.execute(query, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/blog/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TRAINING ENDPOINTS ---
app.get('/api/trainings', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM trainings ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('GET /api/trainings failed:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/trainings', async (req, res) => {
    try {
        const t = normalizeTrainingPayload(req.body);

        const syllabus = normalizeSyllabus(t.syllabus);
        const syllabusJson = JSON.stringify(syllabus);
        const insertValues = [
            t.id, t.title, t.description, t.fullContent, syllabusJson, t.startDate, t.duration, t.level, t.image, t.status, t.certLabel, t.infoTitle, t.aboutTitle, t.syllabusTitle, t.durationLabel, t.startLabel, t.statusLabel, t.sidebarNote, t.highlightWord
        ].map(toSqlValue);
        const updateValues = [
            t.title, t.description, t.fullContent, syllabusJson, t.startDate, t.duration, t.level, t.image, t.status, t.certLabel, t.infoTitle, t.aboutTitle, t.syllabusTitle, t.durationLabel, t.startLabel, t.statusLabel, t.sidebarNote, t.highlightWord
        ].map(toSqlValue);
        const query = `
            INSERT INTO trainings (id, title, description, fullContent, syllabus, startDate, duration, level, image, status, certLabel, infoTitle, aboutTitle, syllabusTitle, durationLabel, startLabel, statusLabel, sidebarNote, highlightWord)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                title=?, description=?, fullContent=?, syllabus=?, startDate=?, duration=?, level=?, image=?, status=?, certLabel=?, infoTitle=?, aboutTitle=?, syllabusTitle=?, durationLabel=?, startLabel=?, statusLabel=?, sidebarNote=?, highlightWord=?
        `;
        const params = [...insertValues, ...updateValues];
        await pool.execute(query, params);
        res.json({ success: true });
    } catch (err) {
        console.error('POST /api/trainings failed:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/trainings/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM trainings WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SUBMISSION ENDPOINTS ---
app.get('/api/submissions', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM form_submissions ORDER BY created_at DESC');
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

        const [result] = await pool.execute(
            'INSERT INTO form_submissions (type, form_data) VALUES (?, ?)',
            [normalizedType, JSON.stringify(normalizedFormData)]
        );

        const submissionId = result.insertId;
        const createdAt = new Date();
        let mailSent = false;
        let mailInfo = null;

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

        res.json({ success: true, id: submissionId, mailSent, mailInfo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/submissions/:id', async (req, res) => {
    try {
        await pool.execute('UPDATE form_submissions SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/submissions/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM form_submissions WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- UPLOAD ENDPOINT ---
app.post('/api/upload', upload.single('file'), (req, res) => {
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
    res.json({ status: 'ok' });
});

async function startServer() {
    await initDbWithRetry();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend server running on port ${PORT}`);
        console.log(`Uploads directory: ${UPLOADS_DIR}`);
    });
}

startServer();
