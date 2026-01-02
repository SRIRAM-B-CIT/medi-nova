const MedicationReminder = require('../models/MedicationReminder');

// @desc    Get all medication reminders for current user
// @route   GET /api/medication-reminders
// @access  Private
exports.getMedicationReminders = async (req, res) => {
  try {
    let query;
    
    if (req.user.role === 'doctor') {
      // Doctors can see all reminders
      query = MedicationReminder.find();
    } else {
      // Patients can only see their own
      query = MedicationReminder.find({ patient_id: req.user._id });
    }

    const reminders = await query
      .populate('patient_id', 'email full_name')
      .populate('created_by', 'email full_name')
      .sort({ created_at: -1 });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single medication reminder
// @route   GET /api/medication-reminders/:id
// @access  Private
exports.getMedicationReminder = async (req, res) => {
  try {
    const reminder = await MedicationReminder.findById(req.params.id)
      .populate('patient_id', 'email full_name')
      .populate('created_by', 'email full_name');

    if (!reminder) {
      return res.status(404).json({ message: 'Medication reminder not found' });
    }

    // Check authorization
    if (req.user.role !== 'doctor' && reminder.patient_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create medication reminder
// @route   POST /api/medication-reminders
// @access  Private
exports.createMedicationReminder = async (req, res) => {
  try {
    const reminderData = {
      ...req.body,
      patient_id: req.body.patient_id || req.user._id,
      created_by: req.user._id,
    };

    // If non-doctor is creating, they can only create for themselves
    if (req.user.role !== 'doctor' && reminderData.patient_id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create reminders for others' });
    }

    const reminder = await MedicationReminder.create(reminderData);
    const populatedReminder = await MedicationReminder.findById(reminder._id)
      .populate('patient_id', 'email full_name')
      .populate('created_by', 'email full_name');

    res.status(201).json(populatedReminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update medication reminder
// @route   PUT /api/medication-reminders/:id
// @access  Private
exports.updateMedicationReminder = async (req, res) => {
  try {
    let reminder = await MedicationReminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Medication reminder not found' });
    }

    // Check authorization
    if (req.user.role !== 'doctor' && reminder.patient_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    reminder = await MedicationReminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('patient_id', 'email full_name')
      .populate('created_by', 'email full_name');

    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete medication reminder
// @route   DELETE /api/medication-reminders/:id
// @access  Private
exports.deleteMedicationReminder = async (req, res) => {
  try {
    const reminder = await MedicationReminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Medication reminder not found' });
    }

    // Check authorization
    if (req.user.role !== 'doctor' && reminder.patient_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await MedicationReminder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medication reminder deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
