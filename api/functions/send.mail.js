const nodemailer = require('nodemailer');
const { MAILER_EMAIL, MAILER_PASSWORD } = require('../config');

const sendMail = async (mail) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: MAILER_EMAIL,
      pass: MAILER_PASSWORD,
    },
    disableUrlAccess: true,
    disableFileAccess: true,
  });

  await transporter.sendMail(mail)
}

const emailTemplate = async (email, code) => {
  const mail = {
    from: MAILER_EMAIL,
    to: email,
    subject: "Reset your user password",
    text: "Password Recovery",
    html: `The verification code for your app is ${code}`,
  }

  const rta = await sendMail(mail);
  return rta; 
}

module.exports = { sendMail: emailTemplate };