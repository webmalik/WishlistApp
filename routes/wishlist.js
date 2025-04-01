// routes/wishlist.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { getToken } = require('../utils/tokenStore');

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

function isRequestFromShopify(query) {
    const { hmac, ...params } = query;
    const message = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');
    const generated = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex');
    return generated === hmac;
}

router.post('/', async (req, res) => {
    const { customerId, productId } = req.body;
    const { shop } = req.query;

    if (!shop || !customerId || !productId) {
        return res.status(400).json({ error: 'Missing shop, customerId or productId' });
    }

    // if (!isRequestFromShopify(req.query)) {
    //     return res.status(403).json({ error: 'Invalid HMAC signature' });
    // }

    const token = getToken(shop);
    if (!token) {
        return res.status(401).json({ error: 'No access token found for this shop' });
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

        let metafield = data.metafields.find(
            (m) => m.namespace === 'custom' && m.key === 'wishlist',
        );

        let wishlist = [];

        if (metafield?.value) {
            wishlist = JSON.parse(metafield.value.replace(/gid:\/\/shopify\/Product\//g, '')).map(
                Number,
            );
        }

        const index = wishlist.indexOf(productId);
        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(productId);
        }

        const value = JSON.stringify(wishlist.map((id) => `gid://shopify/Product/${id}`));

        const payload = {
            metafield: {
                namespace: 'custom',
                key: 'wishlist',
                type: 'list.product_reference',
                value,
            },
        };

        const method = metafield ? 'put' : 'post';
        const url = metafield
            ? `https://${shop}/admin/api/${API_VERSION}/metafields/${metafield.id}.json`
            : `https://${shop}/admin/api/${API_VERSION}/customers/${customerId}/metafields.json`;

        const response = await axios({
            method,
            url,
            data: payload,
            headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json',
            },
        });

        res.json({
            success: true,
            wishlist,
            metafield_id: response.data.metafield?.id || null,
        });
    } catch (err) {
        console.error('[Wishlist error]', err?.response?.data || err.message);
        res.status(500).json({ error: 'Internal error updating wishlist' });
    }
});

module.exports = router;
