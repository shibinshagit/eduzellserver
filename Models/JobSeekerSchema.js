const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobseekerSchema = new Schema({
  name: { type: String},
  phone: { type: String},
  password:{type: String},
  email: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  resume: { type: String },  
  appliedJobs: [{ type: Schema.Types.ObjectId, ref: 'AppliedJob' }],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Jobseeker = mongoose.model('Jobseeker', jobseekerSchema);
module.exports = Jobseeker;
