// routes/wishlistGet.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;

router.get('/', async (req, res) => {
    const { customerId } = req.query;

    const allowedShops = ['dev-paka.myshopify.com'];
    const shop = 'dev-paka.myshopify.com';
    if (!allowedShops.includes(shop)) {
        return res.status(403).json({ error: 'Invalid shop' });
    }

    if (!customerId || !shop) {
        return res.status(400).json({ error: 'Missing customerId or shop' });
    }

    const token = SHOPIFY_API_TOKEN;
    if (!token) {
        return res.status(401).json({ error: 'Missing API token' });
    }

    try {
        const { data } = await axios.get(
            `https://${shop}/admin/api/${API_VERSION}/customers/${customerId}/metafields.json`,
            {
                headers: {
                    'X-Shopify-Access-Token': token,
                    'Content-Type': 'application/json',
                },
            },
        );

        const metafield = data.metafields.find(
            (m) => m.namespace === 'custom' && m.key === 'wishlist',
        );

        let wishlist = [];

        if (metafield?.value) {
            wishlist = JSON.parse(metafield.value.replace(/gid:\/\/shopify\/Product\//g, '')).map(
                Number,
            );
        }
        console.log('[Shopify metafields]', data.metafields);
        console.log('[Parsed wishlist]', wishlist);
        res.json({ success: true, wishlist });
    } catch (err) {
        console.error('[Wishlist GET error]', err?.response?.data || err.message);
        res.status(500).json({ error: 'Internal error loading wishlist' });
    }
});

module.exports = router;
