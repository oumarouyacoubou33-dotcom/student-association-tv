const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Bayanan shiga na Admin
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin123";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./public')) fs.mkdirSync('./public');

const db = new sqlite3.Database('./data/dvt.db', (err) => {
    if (!err) console.log('An haɗa da SQLite Database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT,
        content TEXT NOT NULL,
        image TEXT,
        date_published TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Admin Login da Username & Password
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
        res.json({ success: true, token: "dvt_admin_authenticated" });
    } else {
        res.status(401).json({ success: false, message: "Kuskure a Username ko Password!" });
    }
});

// Ciro Duk Labarai
app.get('/api/news', (req, res) => {
    db.all('SELECT * FROM news ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
});

// Wallafa Labari
app.post('/api/news', upload.single('image'), (req, res) => {
    const { title, category, content } = req.body;
    const image = req.file ? req.file.filename : null;
    const date_published = new Date().toLocaleDateString('ha-NG', { year: 'numeric', month: 'short', day: 'numeric' });

    if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Shigar da title da content!' });
    }

    const sql = `INSERT INTO news (title, category, content, image, date_published) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [title, category || 'General', content, image, date_published], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'An adana labarin!' });
    });
});

// Share / Cire Labari da ID
app.delete('/api/news/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT image FROM news WHERE id = ?', [id], (err, row) => {
        if (row && row.image) {
            const imagePath = path.join(__dirname, 'uploads', row.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        db.run('DELETE FROM news WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'An share labarin!' });
        });
    });
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server tana aiki a PORT: ${PORT}`);
});
