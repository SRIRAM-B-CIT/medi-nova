const mongoose = require('mongoose');

const patientDetailsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  full_name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: true,
  },
  blood_group: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  height: Number,
  weight: Number,
  allergies: [String],
  chronic_conditions: [String],
  current_medications: [String],
  emergency_contact_name: String,
  emergency_contact_phone: String,
  emergency_contact_relation: String,
  lab_report_summaries: [{
    report_name: {
      type: String,
      required: true,
      maxlength: 200,
    },
    report_date: String,
    overview: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    overall_flag: {
      type: String,
      enum: ['Within range', 'Review suggested', 'Prompt review', 'Unclear'],
      default: 'Unclear',
    },
    key_findings: [{
      test: String,
      value: String,
      reference_range: String,
      status: {
        type: String,
        enum: ['Low', 'Within range', 'High', 'Abnormal', 'Unclear'],
      },
      explanation: String,
    }],
    follow_up_questions: [String],
    urgent_warnings: [String],
    created_at: {
      type: Date,
      default: Date.now,
    },
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

patientDetailsSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('PatientDetails', patientDetailsSchema);
