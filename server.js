const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'news.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

app.get('/api/news', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json({ success: true, data: JSON.parse(data) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur de lecture' });
    }
});

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
            mediaUrl = req.body.image;
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

app.delete('/api/news/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        // Cire fayil din dake server idan akwai shi don rage cunkoso
        const itemToDelete = data.find(item => item.id === id);
        if (itemToDelete && itemToDelete.image && itemToDelete.image.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, 'public', itemToDelete.image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        data = data.filter(item => item.id !== id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Supprimé avec succès !' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur de suppression' });
    }
});

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
