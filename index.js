// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const wishlistRoute = require('./routes/wishlist');
const wishlistGetRoute = require('./routes/wishlistGet');
const authRoute = require('./routes/auth');
const { initTokenStore } = require('./utils/tokenStore');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initTokenStore();

app.use('/auth', authRoute);
app.use('/wishlist-update', wishlistRoute);

app.listen(PORT, () => {
    console.log(`✅ Wishlist app is running on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    res.send(`<h1>✅ Wishlist App is live</h1>`);
});

app.get('/status', (req, res) => {
    res.json({ status: '✅ OK', time: new Date().toISOString() });
});

app.get('/test', (req, res) => {
    res.send('👋 Це тестовий маршрут. Сервіс працює!');
});
