const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appliedJobSchema = new Schema({
  jobseekerId: { type: Schema.Types.ObjectId, ref: 'Jobseeker', required: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  appliedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['applied', 'interview', 'accepted', 'rejected'], required: true }
});

const AppliedJob = mongoose.model('AppliedJob', appliedJobSchema);
module.exports = AppliedJob;
