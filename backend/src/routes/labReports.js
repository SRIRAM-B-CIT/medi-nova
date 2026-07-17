const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const PatientDetails = require('../models/PatientDetails');

const router = express.Router();
const MODEL = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are MediNova's lab-report information assistant. Analyze only the extracted report text supplied by the user.

Safety and accuracy rules:
- This is an explanation, not a diagnosis. Never diagnose a health condition, prescribe treatment, name medicines to take, give doses, or tell the user to change medication.
- Never invent a test, value, unit, reference range, report date, or patient fact. If OCR text is ambiguous, mark it Unclear.
- Compare a result only with the reference range printed in the supplied report. Do not silently substitute a generic range.
- Explain flagged findings in plain language and state that significance depends on clinical context.
- Put emergency guidance in urgentWarnings only when the report itself contains a clearly critical value or explicit critical flag. Do not create alarm from a minor abnormality.
- Follow-up questions should be concise questions the user can ask a qualified clinician.
- Always include keyPoints, followUpQuestions, and urgentWarnings as JSON arrays. Use an empty array when there is nothing appropriate to add.
- Keep the overview concise and useful for a future patient record. Return only the required JSON.`;

const cleanString = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

router.post('/analyze', authMiddleware, async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const reportName = cleanString(req.body?.reportName, 200);
  const extractedText = cleanString(req.body?.extractedText, 30000);

  if (req.user.role === 'doctor') {
    return res.status(403).json({ message: 'Lab summaries can only be added to a patient record.' });
  }
  if (!apiKey) {
    return res.status(503).json({ message: 'Lab report analysis is not configured.' });
  }
  if (!reportName || extractedText.length < 40) {
    return res.status(400).json({ message: 'The report did not contain enough readable text to analyze.' });
  }

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `File label: ${reportName}\n\nExtracted report text:\n${extractedText}` },
        ],
        temperature: 0.1,
        max_completion_tokens: 1600,
        reasoning_effort: 'medium',
        include_reasoning: false,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'lab_report_analysis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                reportTitle: { type: 'string' },
                reportDate: { type: 'string' },
                overview: { type: 'string' },
                overallFlag: {
                  type: 'string',
                  enum: ['Within range', 'Review suggested', 'Prompt review', 'Unclear'],
                },
                findings: {
                  type: 'array',
                  maxItems: 20,
                  items: {
                    type: 'object',
                    properties: {
                      test: { type: 'string' },
                      value: { type: 'string' },
                      referenceRange: { type: 'string' },
                      status: {
                        type: 'string',
                        enum: ['Low', 'Within range', 'High', 'Abnormal', 'Unclear'],
                      },
                      explanation: { type: 'string' },
                    },
                    required: ['test', 'value', 'referenceRange', 'status', 'explanation'],
                    additionalProperties: false,
                  },
                },
                keyPoints: {
                  type: 'array',
                  maxItems: 6,
                  items: { type: 'string' },
                },
                followUpQuestions: {
                  type: 'array',
                  maxItems: 5,
                  items: { type: 'string' },
                },
                urgentWarnings: {
                  type: 'array',
                  maxItems: 3,
                  items: { type: 'string' },
                },
              },
              required: ['reportTitle', 'reportDate', 'overview', 'overallFlag', 'findings'],
              additionalProperties: false,
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    const responseMessage = response.data?.choices?.[0]?.message;
    const content = responseMessage?.content
      || responseMessage?.tool_calls?.find(
        (toolCall) => toolCall.function?.name === 'lab_report_analysis'
      )?.function?.arguments;
    const parsedAnalysis = JSON.parse(content);

    if (!parsedAnalysis?.overview || !Array.isArray(parsedAnalysis?.findings)) {
      throw new Error('The model returned an invalid lab analysis.');
    }

    const analysis = {
      ...parsedAnalysis,
      keyPoints: Array.isArray(parsedAnalysis.keyPoints) ? parsedAnalysis.keyPoints : [],
      followUpQuestions: Array.isArray(parsedAnalysis.followUpQuestions)
        ? parsedAnalysis.followUpQuestions
        : [],
      urgentWarnings: Array.isArray(parsedAnalysis.urgentWarnings)
        ? parsedAnalysis.urgentWarnings
        : [],
    };

    const savedSummary = {
      report_name: cleanString(analysis.reportTitle || reportName, 200),
      report_date: cleanString(analysis.reportDate, 80),
      overview: cleanString(analysis.overview, 3000),
      overall_flag: analysis.overallFlag,
      key_findings: analysis.findings.map((finding) => ({
        test: cleanString(finding.test, 200),
        value: cleanString(finding.value, 200),
        reference_range: cleanString(finding.referenceRange, 200),
        status: finding.status,
        explanation: cleanString(finding.explanation, 800),
      })),
      follow_up_questions: analysis.followUpQuestions.map((item) => cleanString(item, 500)),
      urgent_warnings: analysis.urgentWarnings.map((item) => cleanString(item, 500)),
      created_at: new Date(),
    };

    const patient = await PatientDetails.findOneAndUpdate(
      { user_id: req.user._id },
      {
        $push: {
          lab_report_summaries: {
            $each: [savedSummary],
            $position: 0,
            $slice: 20,
          },
        },
        $set: { updated_at: new Date() },
      },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Complete your patient details before saving a lab summary.' });
    }

    return res.json({
      analysis,
      savedRecord: patient.lab_report_summaries[0],
      model: MODEL,
      privacy: 'The uploaded file and extracted text were not stored.',
    });
  } catch (error) {
    console.error('Lab report analysis error:', error.response?.data || error.message);
    const status = error.response?.status;
    return res.status(status === 429 ? 429 : 502).json({
      message: status === 429
        ? 'The lab analysis service is busy. Please try again shortly.'
        : 'The lab report could not be analyzed. Please check the file and try again.',
    });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  const patient = await PatientDetails.findOne({ user_id: req.user._id })
    .select('lab_report_summaries');
  if (!patient) return res.status(404).json({ message: 'Patient details not found.' });
  return res.json(patient.lab_report_summaries || []);
});

module.exports = router;
