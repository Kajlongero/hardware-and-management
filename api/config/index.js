require('dotenv').config();

const config = {
  JWT_SECRET: process.env.JWT_SECRET,
  MAILER_EMAIL: process.env.MAILER_EMAIL,
  MAILER_PASSWORD: process.env.MAILER_PASSWORD,
};

module.exports = config;