const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'news.json');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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

app.post('/api/news', (req, res) => {
    try {
        const { title, category, content, image } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Champs requis manquants' });
        }
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const newItem = {
            id: Date.now(),
            title,
            category: category || 'Actualites',
            content,
            image: image || '',
            date_published: new Date().toLocaleDateString()
        };
        data.unshift(newItem);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Publié avec succès !' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur d’enregistrement' });
    }
});

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

// Route admin login corrigée
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'dvt2026') {
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
