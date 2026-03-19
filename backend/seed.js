const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, 'uploads', 'azfin_db.sqlite');
    
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    try {
        const defaultsPath = path.join(__dirname, '../frontend/siteContentDefaults.json');
        const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf-8'));

        const content = JSON.stringify(defaults);
        
        // Ensure table exists (though server.js usually does this, seed might run independently)
        await db.run(`
            CREATE TABLE IF NOT EXISTS site_settings (
                id INTEGER PRIMARY KEY,
                content TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.run(
            'INSERT INTO site_settings (id, content) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content',
            [content]
        );

        console.log('✅ Database seeded successfully with default content');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedDatabase();
