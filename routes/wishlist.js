const express = require('express');
const router = express.Router();
const axios = require('axios');

const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

router.post('/', async (req, res) => {
    const { customerId, productId } = req.body;

    if (!customerId || !productId) {
        return res.status(400).json({ error: 'Missing customerId or productId' });
    }

    try {
        // Отримуємо всі метаполя користувача
        const { data } = await axios.get(
            `https://${SHOP}/admin/api/2023-10/customers/${customerId}/metafields.json`,
            {
                headers: {
                    'X-Shopify-Access-Token': TOKEN,
                    'Content-Type': 'application/json',
                },
            },
        );

        let metafield = data.metafields.find(
            (m) => m.namespace === 'custom' && m.key === 'wishlist',
        );

        let wishlist = [];

        if (metafield && metafield.value) {
            wishlist = JSON.parse(metafield.value.replace(/gid:\/\/shopify\/Product\//g, '')).map(
                Number,
            );
        }

        const index = wishlist.indexOf(productId);
        if (index > -1) {
            wishlist.splice(index, 1); // видалити
        } else {
            wishlist.push(productId); // додати
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

        const url = metafield
            ? `https://${SHOP}/admin/api/2023-10/metafields/${metafield.id}.json`
            : `https://${SHOP}/admin/api/2023-10/customers/${customerId}/metafields.json`;

        const method = metafield ? 'put' : 'post';

        await axios({
            method,
            url,
            data: payload,
            headers: {
                'X-Shopify-Access-Token': TOKEN,
                'Content-Type': 'application/json',
            },
        });

        res.json({ success: true, wishlist });
    } catch (err) {
        console.error('[Wishlist error]', err?.response?.data || err.message);
        res.status(500).json({ error: 'Internal error updating wishlist' });
    }
});

module.exports = router;
