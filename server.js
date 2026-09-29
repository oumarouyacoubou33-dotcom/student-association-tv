const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'news.json');

// Saita iyakar girman fayil da za a iya turawa (A saita zuwa 50MB don ba da damar bidiyo da hotuna)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Duba ko news.json yana nan, idan babu a ƙirƙiro shi
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// API don samun labarai da bidiyo
app.get('/api/news', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json({ success: true, data: JSON.parse(data) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Kuskure wajen karanta bayanai' });
    }
});

// API don ƙara labari ko bidiyo
app.post('/api/news', (req, res) => {
    try {
        const { title, category, content, image } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Ana buƙatar babban batun da bayani!' });
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const newItem = {
            id: Date.now(),
            title,
            category: category || 'Actualités',
            content,
            image: image || '',
            date_published: new Date().toLocaleDateString()
        };

        data.unshift(newItem); // Saka sabon abu a sama
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'An loda shi cikin nasara!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Kuskure wajen adana fayil din' });
    }
});

// API don goge labari ko bidiyo
app.delete('/api/news/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        data = data.filter(item => item.id !== id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'An goge shi cikin nasara!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Kuskure wajen gogewa' });
    }
});

// API na Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Za ka iya sauya sunan shiga da kalmar sirri anan idan ka ga dama
    if (username === 'admin' && password === 'dvt2026') {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Sunan mai amfani ko kalmar sirri ba daidai ba ne!' });
    }
});

app.listen(PORT, () => {
    console.log(`Server yana aiki a tashar: http://localhost:${PORT}`);
});
