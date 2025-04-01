// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const wishlistRoute = require('./routes/wishlist');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/wishlist-update', wishlistRoute);

app.listen(PORT, () => {
    console.log(`✅ Wishlist app is running on http://localhost:${PORT}`);
});
