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

  let info = await transporter.sendMail(mailOptions);

  // console.log('Email sent: ' + info.response);