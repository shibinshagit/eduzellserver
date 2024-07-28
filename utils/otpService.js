const nodemailer = require('nodemailer');


       
const sendOtp = async (email, otp) => {
    console.log('formkjh',email,otp)
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "OTP for Registration",
    text: `Your OTP for registration is: ${otp}. It will expire in 5 minutes.`,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Error sending OTP');
  } 
};

module.exports = { sendOtp };
