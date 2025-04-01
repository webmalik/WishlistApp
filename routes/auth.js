// routes/auth.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { saveToken } = require('../utils/tokenStore');

const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;

function verifyHMAC(query) {
    const { hmac, ...params } = query;
    const message = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');

    const digest = crypto.createHmac('sha256', API_SECRET).update(message).digest('hex');

    return digest === hmac;
}

router.get('/callback', async (req, res) => {
    const { shop, hmac, code } = req.query;

    if (!verifyHMAC(req.query)) {
        return res.status(403).send('HMAC validation failed');
    }

    try {
        const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: API_KEY,
            client_secret: API_SECRET,
            code,
        });

        const accessToken = tokenRes.data.access_token;
        saveToken(shop, accessToken);

        console.log(`✅ Access token for ${shop}:`, accessToken);

        res.send(`✅ App installed successfully for ${shop}`);
    } catch (error) {
        console.error('[OAuth Error]', error?.response?.data || error.message);
        res.status(500).send('Error exchanging code for token');
    }
});

module.exports = router;
