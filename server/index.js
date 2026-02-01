const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const PORT = process.env.PORT || 4004;

app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1️⃣ API routes - միշտ առաջինը
app.get('/api/get', (req, res) => {
    res.status(200).json({ message: 'GET request successful' });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// 2️⃣ Static files - frontend dist
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// 3️⃣ SPA fallback - React routing
app.get('/', (req, res) => {
    // Եթե path-ը /api չի սկսվում, ուղարկում ենք index.html
    if (req.path.startsWith('/api')) return res.status(404).send('API route not found');
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
