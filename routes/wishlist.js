const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { getToken } = require('../utils/tokenStore');

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;

// 🔐 Перевірка HMAC (Shopify App Proxy)
function isRequestFromShopify(query) {
    const { hmac, ...params } = query;

    const message = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');

    const generated = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex');

    return generated === hmac;
}

router.get('/', async (req, res) => {
    const { customerId, productId, shop } = req.query;

    // 🛡️ Перевірка обов'язкових параметрів
    if (!shop || !customerId || !productId) {
        return res.status(400).json({ error: 'Missing shop, customerId or productId' });
    }

    // 🔍 Лог для дебагу
    console.log('[Incoming Wishlist request]', {
        shop,
        customerId,
        productId,
        hmac: req.query.hmac,
    });

    // 🔐 Перевірка HMAC (тільки для запитів із Shopify)
    // if (!isRequestFromShopify(req.query)) {
    //     console.warn('[Security] Invalid HMAC signature for shop:', shop);
    //     return res.status(403).json({ error: 'Invalid HMAC signature' });
    // }

    // 🔑 Отримуємо токен
    const token = SHOPIFY_API_TOKEN;
    if (!token) {
        console.warn('[Token] No token for shop:', shop);
        return res.status(401).json({ error: 'No access token found for this shop' });
    }

    try {
        // 🧲 Отримуємо метаполя клієнта
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

        // ➕➖ Додаємо або видаляємо продукт
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

        // 📤 Записуємо нове значення
        const url = metafield
            ? `https://${shop}/admin/api/${API_VERSION}/metafields/${metafield.id}.json`
            : `https://${shop}/admin/api/${API_VERSION}/customers/${customerId}/metafields.json`;

        const method = metafield ? 'put' : 'post';

        const response = await axios({
            method,
            url,
            data: payload,
            headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json',
            },
        });

        return res.json({
            success: true,
            wishlist,
            metafield_id: response.data.metafield?.id || null,
        });
    } catch (err) {
        console.error('[Wishlist error]', err?.response?.data || err.message);
        return res.status(500).json({ error: 'Internal error updating wishlist' });
    }
});

module.exports = router;
