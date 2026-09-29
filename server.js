const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'news.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

// Tabbatar foldan uploads yana nan
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Saita Multer don adana hotuna da bidiyoyi a cikin 'public/uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Iyaka 50MB
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Karanta labarai
app.get('/api/news', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json({ success: true, data: JSON.parse(data) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur de lecture' });
    }
});

// Wallafa sabon labari tare da loda fayil (hoto ko bidiyo)
app.post('/api/news', upload.single('mediaFile'), (req, res) => {
    try {
        const { title, category, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Champs requis manquants' });
        }

        let mediaUrl = '';
        if (req.file) {
            mediaUrl = '/uploads/' + req.file.filename;
        } else if (req.body.image) {
            mediaUrl = req.body.image; // Idan an tura ta base64 ko link
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const newItem = {
            id: Date.now(),
            title,
            category: category || 'Actualites',
            content,
            image: mediaUrl,
            date_published: new Date().toLocaleDateString()
        };

        data.unshift(newItem);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Publié avec succès !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur d’enregistrement' });
    }
});

// Goge labari
app.delete('/api/news/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        data = data.filter(item => item.id !== id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Supprimé avec succès !' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur de suppression' });
    }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username.trim() === 'admin' && password.trim() === 'admin') {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Nom d’utilisateur ou mot de passe incorrect !' });
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
