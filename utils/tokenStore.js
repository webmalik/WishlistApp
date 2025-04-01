// utils/tokenStore.js
let tokens = {};

function saveToken(shop, token) {
    tokens[shop] = token;
}

function getToken(shop) {
    return tokens[shop];
}

function initTokenStore() {
    tokens = {}; // optionally, load from file/db later
}

module.exports = {
    saveToken,
    getToken,
    initTokenStore,
};
