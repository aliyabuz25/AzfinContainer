require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { randomUUID } = require('crypto');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 5000);
const DB_MAX_RETRIES = Number(process.env.DB_MAX_RETRIES || 0); // 0 => unlimited

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
app.use(express.json());

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
        res.json(rows[0] ? rows[0].content : {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const content = JSON.stringify(req.body);
        await pool.execute(
            'INSERT INTO site_settings (id, content) VALUES (1, ?) ON DUPLICATE KEY UPDATE content = ?',
            [content, content]
        );
        res.json({ success: true });
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
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/submissions', async (req, res) => {
    try {
        const { type, form_data } = req.body;
        await pool.execute(
            'INSERT INTO form_submissions (type, form_data) VALUES (?, ?)',
            [type, JSON.stringify(form_data)]
        );
        res.json({ success: true });
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
