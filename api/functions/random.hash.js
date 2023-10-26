const { createHash } = require('crypto');

const randomHash = (email) => createHash('sha256').update(email, 'utf8').digest('base64').slice(-8);

module.exports = randomHash;