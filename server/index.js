const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const PORT = process.env.PORT || 6000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/api/get', (req, res) => {
    res.status(200).json({ message: 'GET request successful' });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', Message: 'Server is running' });
});
app.use(express.static('../client/dist'));


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});