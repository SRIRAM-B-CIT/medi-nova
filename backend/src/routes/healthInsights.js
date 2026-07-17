const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const MODEL = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You summarize a health-insights dashboard for spoken playback. Use only the supplied report; do not diagnose, prescribe, recommend medication, or invent facts. Write 2 or 3 short sentences in plain language, ideally under 55 words. Mention the overall status, the most important trend or alert, and whether professional care should be considered. If a high-risk alert or anomaly is present, clearly advise prompt medical evaluation. End by saying this is general information, not a diagnosis. Return only the required JSON.`;

router.post('/summary', authMiddleware, async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const report = req.body?.report;

  if (!apiKey) {
    return res.status(503).json({ message: 'AI health insights are not configured.' });
  }

  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    return res.status(400).json({ message: 'A health-insights report is required.' });
  }

  const reportText = JSON.stringify(report).slice(0, 10000);

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Summarize this dashboard report:\n${reportText}` },
        ],
        temperature: 0.2,
        max_completion_tokens: 180,
        reasoning_effort: 'low',
        include_reasoning: false,
        tool_choice: 'auto',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'health_insights_summary',
            strict: true,
            schema: {
              type: 'object',
              properties: { summary: { type: 'string' } },
              required: ['summary'],
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
        timeout: 30000,
      }
    );

    const responseMessage = response.data?.choices?.[0]?.message;
    const content = responseMessage?.content
      || responseMessage?.tool_calls?.find(
        (toolCall) => toolCall.function?.name === 'health_insights_summary'
      )?.function?.arguments;
    const summary = JSON.parse(content)?.summary?.trim();

    if (!summary) throw new Error('The model returned an empty summary.');
    return res.json({ summary, model: MODEL });
  } catch (error) {
    console.error('Health insights summary error:', error.response?.data || error.message);
    const status = error.response?.status;
    return res.status(status === 429 ? 429 : 502).json({
      message: status === 429
        ? 'The AI summary service is busy. Please try again shortly.'
        : 'The AI summary could not be generated. Please try again.',
    });
  }
});

module.exports = router;
