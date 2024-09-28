const mongoose = require("mongoose");
const Admin = require("../Models/adminSchema");
const User = require("../Models/JobSeekerSchema");
const Job = require("../Models/JobSchema");
const Application = require("../Models/ApplicationSchema");
const cron = require('node-cron');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOtp } = require('../utils/otpService');
const crypto = require('crypto');
const stripTime = (date) => new Date(date.setHours(0, 0, 0, 0));

// checkEmail==================================================================================================================
const checkEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        // Email exists and is verified, redirect to password entry
        return res.status(200).json({ exists: true });
      } else {
        // Email exists but is not verified, resend OTP
        const otp = crypto.randomInt(1000, 9999).toString();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOtp(email, otp);

        return res.status(200).json({ exists: false });
      }
    } else {
      // Email does not exist, generate OTP and send
      const otp = crypto.randomInt(1000, 9999).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const newUser = new User({ email, otp, otpExpiry });
      await newUser.save();

      await sendOtp(email, otp);

      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp} = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: false });
    }

    if (user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(200).json({ success: false });
    }

    user.otp = null; 
    user.otpExpiry = null;
    user.isVerified = true;
    await user.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const createPassword = async (req, res) => {
  const { email, password } = req.body;
  // Check if the email and password are provided
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (user) {
      // Hash the password
      const saltRounds = 10; // Adjust the number of salt rounds as needed
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Save the hashed password
      user.password = hashedPassword;
      await user.save();

      // Generate a JWT token
      const token = jwt.sign(
        { id: user._id},
        process.env.JWT_SECRET, // Use environment variable for the secret key
        { expiresIn: '1h' }
      );

      // Send the success response with token
      return res.status(200).json({ success: true, token });
    } else {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error creating password:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const verifyPassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      // Compare the provided password with the hashed password
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        return res.status(200).json({ success: true, token });
      } else {
        return res.status(400).json({ success: false, message: 'Incorrect password' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};



// getUserProfile================================================================================================================
const getUserProfile = async (req, res) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(' ')[1]; // Assumes Bearer token is used

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure your JWT secret is in your environment variables

    // Extract user ID from decoded token
    const userId = decoded.id; // Ensure your token is structured to have the id field

    // Find user by ID from database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send back user data, including education, experience, and skills
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      education: user.education || [], // Ensure it's an array
      experience: user.experience || [], // Ensure it's an array
      skills: user.skills || [], // Ensure it's an array
      companyDetails: user.companyDetails || null // Include company details if applicable
    });

  } catch (error) {
    // Handling invalid token and other potential errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// updateUser=======================================================================================================================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params; // Assuming user ID is passed in the URL parameters
    const updateData = req.body; // Get the data to update from the request body
console.log('updateUserController:',id)
    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user information with new data
    user.name = updateData.name || user.name;
    user.phone = updateData.phone || user.phone;
    user.email = updateData.email || user.email;
    user.education = updateData.education || user.education; // Assuming this is an array
    user.experience = updateData.experience || user.experience; // Assuming this is an array
    user.skills = updateData.skills || user.skills; // Assuming this is an array

    // If the user is a company, update company details
    if (updateData.companyDetails) {
      user.companyDetails = {
        companyName: updateData.companyDetails.companyName || user.companyDetails.companyName,
        companyWebsite: updateData.companyDetails.companyWebsite || user.companyDetails.companyWebsite,
        companySize: updateData.companyDetails.companySize || user.companyDetails.companySize,
        industry: updateData.companyDetails.industry || user.companyDetails.industry,
      };
    }

    // Save the updated user
    await user.save();

    return res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};
// ====================== Node cron=========================================================================================================================
async function cleanupExpiredJobs() {
  try {
    const currentDate = stripTime(new Date());
    const result = await Job.deleteMany({ expirationDate: { $lt: currentDate } });
    console.log(`Deleted ${result.deletedCount} expired jobs.`);
  } catch (err) {
    console.error('Error cleaning up expired jobs:', err);
  }
}

// Schedule the function to run daily at midnight
cron.schedule('0 0 * * *', cleanupExpiredJobs);

module.exports = {
  checkEmail,
  verifyOtp,
  verifyPassword,
  createPassword,
  getUserProfile,
  updateUser
};
