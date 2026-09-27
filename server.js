const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = "Mrouyac";
const ADMIN_PASSWORD = "976994mrou";

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

if (!fs.existsSync('./public')) fs.mkdirSync('./public');

const pool = new Pool({
    connectionString: 'postgresql://postgres.hoevhqthuombztskejkh:976994Roukki@aws-0-eu-north-1.pooler.supabase.com:6543/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(client => {
        console.log('An haɗa da Supabase PostgreSQL Database ta Pooler!');
        return client.query(`
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT,
                content TEXT NOT NULL,
                image TEXT,
                date_published TEXT
            );

            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name TEXT,
                email TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `).then(() => client.release());
    })
    .catch(err => console.error('Matsalar haɗin Database:', err));

app.use(express.static(path.join(__dirname, 'public')));

const upload = multer();

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
        res.json({ success: true, token: "dvt_admin_authenticated" });
    } else {
        res.status(401).json({ success: false, message: "Kuskure a Username ko Password!" });
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM news ORDER BY id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Kuskure wajen ciro labarai:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Mun yi amfani da upload.any() domin karɓar komai ko ta wace kala ce admin.html ke tura shi
app.post('/api/news', upload.any(), async (req, res) => {
    try {
        const title = req.body.title;
        const category = req.body.category;
        const content = req.body.content;
        let image = req.body.image || null;

        // Idan an tura hoton ta multer (file)
        if (req.files && req.files.length > 0) {
            const file = req.files.find(f => f.fieldname === 'image') || req.files[0];
            if (file) {
                image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            }
        }

        const date_published = new Date().toLocaleDateString('ha-NG', { year: 'numeric', month: 'short', day: 'numeric' });

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Shigar da title da content!' });
        }

        const sql = `INSERT INTO news (title, category, content, image, date_published) VALUES ($1, $2, $3, $4, $5)`;
        await pool.query(sql, [title, category || 'General', content, image, date_published]);
        res.json({ success: true, message: 'An adana labarin da hotonsa!' });
    } catch (err) {
        console.error("Kuskure wajen wallafa labari:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/news/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await pool.query('DELETE FROM news WHERE id = $1', [id]);
        res.json({ success: true, message: 'An share labarin!' });
    } catch (err) {
        console.error("Kuskure wajen share labari:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server tana aiki a PORT: ${PORT}`);
});
