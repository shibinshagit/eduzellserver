const Application = require('../Models/ApplicationSchema');

// Apply for a job
const applyForJob = async (req, res) => {
  try {
    const { userId, jobId, coverLetter, resume } = req.body;
    const newApplication = new Application({
      userId,
      jobId,
      coverLetter,
      resume
    });
    await newApplication.save();
    res.status(201).json({ message: 'Application submitted successfully', application: newApplication });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all applications
const getApplications = async (req, res) => {
  try {
    const applications = await Application.find().populate('userId jobId');
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate('userId jobId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json({ message: 'Application status updated successfully', application });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findByIdAndDelete(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  applyForJob,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication
};
