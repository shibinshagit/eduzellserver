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
        { id: user._id, user: user },
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
          { id: user._id, user: user },
          "your_jwt_secret_key",
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



// login=======================================================================================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (isMatch) {
      const token = jwt.sign(
        { id: admin._id, email: admin.email },
        "your_jwt_secret_key",
        { expiresIn: "1h" }
      );
      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
      });
    } else {
      res.status(400).json({ error: "Unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// createJob====================================================================================================================
const createJob = async (req, res) => {
  try {
    const { title, description, location, salary, company } = req.body;
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      company,
    });
    await newJob.save();
    res.status(200).json({
      message: "Job created successfully",
      jobId: newJob._id,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Error creating job" });
  }
};

// getJobs======================================================================================================================
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

// applyJob=====================================================================================================================
const applyJob = async (req, res) => {
  try {
    const { userId, jobId, coverLetter, resume } = req.body;
    const newApplication = new Application({
      userId,
      jobId,
      coverLetter,
      resume,
    });
    await newApplication.save();
    res.status(200).json({
      message: "Application submitted successfully",
      applicationId: newApplication._id,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ message: "Error submitting application" });
  }
};

// getApplications================================================================================================================
const getApplications = async (req, res) => {
  try {
    const applications = await Application.find().populate('jobId').populate('userId');
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

// editJob=======================================================================================================================
const editJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, salary, company } = req.body;
    const updatedJobData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: updatedJobData },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// deleteJob======================================================================================================================
const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await Job.findByIdAndDelete(jobId);
    return res.status(200).json({ message: 'Job deleted permanently' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// updateProfile=================================================================================================================
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, bio } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const updatedUserData = { name, email, phone, bio };

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updatedUserData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// getUserProfile================================================================================================================
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
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
  login,
  createJob,
  getJobs,
  applyJob,
  getApplications,
  editJob,
  deleteJob,
  updateProfile,
  getUserProfile
};
