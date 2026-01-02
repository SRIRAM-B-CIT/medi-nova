const PatientDetails = require('../models/PatientDetails');

// @desc    Get patient details
// @route   GET /api/patient-details
// @access  Private
exports.getPatientDetails = async (req, res) => {
  try {
    const patientDetails = await PatientDetails.findOne({ user_id: req.user._id });
    
    if (!patientDetails) {
      return res.status(404).json({ message: 'Patient details not found' });
    }

    res.json(patientDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient details by user ID (for doctors)
// @route   GET /api/patient-details/:userId
// @access  Private (Doctor only)
exports.getPatientDetailsByUserId = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctors only.' });
    }

    const patientDetails = await PatientDetails.findOne({ user_id: req.params.userId });
    
    if (!patientDetails) {
      return res.status(404).json({ message: 'Patient details not found' });
    }

    res.json(patientDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update patient details
// @route   POST /api/patient-details
// @access  Private
exports.createOrUpdatePatientDetails = async (req, res) => {
  try {
    const patientData = {
      user_id: req.user._id,
      ...req.body,
    };

    let patientDetails = await PatientDetails.findOne({ user_id: req.user._id });

    if (patientDetails) {
      // Update existing
      patientDetails = await PatientDetails.findOneAndUpdate(
        { user_id: req.user._id },
        patientData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new
      patientDetails = await PatientDetails.create(patientData);
    }

    res.json(patientDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if patient has health record
// @route   GET /api/patient-details/check
// @access  Private
exports.checkHealthRecord = async (req, res) => {
  try {
    const patientDetails = await PatientDetails.findOne({ user_id: req.user._id });
    res.json({ hasRecord: !!patientDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
