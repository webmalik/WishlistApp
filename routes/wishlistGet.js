// routes/wishlistGet.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;

module.exports = router;
