// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const wishlistRoute = require('./routes/wishlist');
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
