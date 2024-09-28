const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobseekerSchema = new Schema({
  name: { type: String,  },
  phone: { type: String,  },
  password: { type: String,  },
  email: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  resume: { type: String },
  education: [{
    degree: { type: String },
    institution: { type: String },
    yearOfCompletion: { type: Number },
  }],
  experience: [{
    company: { type: String },
    role: { type: String },
    // startDate: { type: String },
    // endDate: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String },
  }],
  skills: [{ type: String }],
  isCompany: { type: Boolean, default: false },
  companyDetails: {
    companyName: { type: String },
    companyWebsite: { type: String },
    companySize: { type: String },
    industry: { type: String },
  },
  appliedJobs: [{ type: Schema.Types.ObjectId, ref: 'AppliedJob' }],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// For both jobseeker and company profiles
const Jobseeker = mongoose.model('Jobseeker', jobseekerSchema);

module.exports = Jobseeker;
