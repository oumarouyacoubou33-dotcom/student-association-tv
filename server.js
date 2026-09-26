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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./public')) fs.mkdirSync('./public');

const pool = new Pool({
    connectionString: 'postgresql://postgres:976994Roukki@db.hoevhqthuombztskejkh.supabase.co:5432/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

// Tabbatar da tables suna nan
pool.connect()
    .then(client => {
        console.log('An haɗa da Supabase PostgreSQL Database.');
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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

app.post('/api/news', upload.single('image'), async (req, res) => {
    try {
        const { title, category, content } = req.body;
        const image = req.file ? req.file.filename : null;
        const date_published = new Date().toLocaleDateString('ha-NG', { year: 'numeric', month: 'short', day: 'numeric' });

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Shigar da title da content!' });
        }

        const sql = `INSERT INTO news (title, category, content, image, date_published) VALUES ($1, $2, $3, $4, $5)`;
        await pool.query(sql, [title, category || 'General', content, image, date_published]);
        res.json({ success: true, message: 'An adana labarin!' });
    } catch (err) {
        console.error("Kuskure wajen wallafa labari:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/news/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('SELECT image FROM news WHERE id = $1', [id]);
        if (result.rows.length > 0 && result.rows[0].image) {
            const imagePath = path.join(__dirname, 'uploads', result.rows[0].image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
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
