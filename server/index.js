import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/get', (req, res) => {
    res.status(200).json({ message: 'GET request successful' });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('/', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).send('API route not found');
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});