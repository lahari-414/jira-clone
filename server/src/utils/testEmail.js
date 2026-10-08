require('dotenv').config();

const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('SMTP CONFIG');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('Secure:', process.env.SMTP_SECURE);
  console.log('User:', process.env.SMTP_USER);
  console.log(
    'Password:',
    process.env.SMTP_PASS ? 'LOADED' : 'MISSING'
  );

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();

    console.log('SMTP connection successful.');

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.SMTP_USER,
      subject: 'AmiVel PMS SMTP Test',
      text: 'Email delivery from AmiVel PMS is working successfully.',
    });

    console.log('Email sent successfully.');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('SMTP ERROR');
    console.error(error);
  }
}

testEmail();