const { createHash } = require('crypto');

const randomHash = (data) => createHash('sha256').update(data, 'utf8').digest('base64').slice(-8);

module.exports = randomHash;