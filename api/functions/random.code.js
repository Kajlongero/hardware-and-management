const { randomInt } = require('crypto');

const randomCode = () => {
  const code = Math.round(Math.random() * 899999) + 100000
  return code;
}

module.exports = randomCode;