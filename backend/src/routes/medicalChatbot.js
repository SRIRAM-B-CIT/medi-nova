const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const MODEL = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are MediNova's health information assistant. You are not a doctor and must not diagnose, prescribe, recommend medicines or supplements, interpret tests, or provide personalized medical treatment.

Conversation rules:
1. For a new concern, ask one short, relevant follow-up question at a time. Gather 2 or 3 follow-up answers before providing any self-care information. Prioritize duration, severity, associated symptoms, age/pregnancy, relevant conditions, and current medicines where relevant. Do not repeat a question already answered.
2. After 2 or 3 follow-up answers, give a brief summary and only low-risk, general comfort/self-care information (for example rest, hydration when normally safe, or avoiding an obvious irritant). Clearly label it "General self-care information", not a medical recommendation or cure.
3. Never claim that a home remedy treats or cures a disease. Never provide drug names, doses, medication changes, or a diagnosis. Encourage consultation with a qualified clinician when symptoms persist, worsen, recur, or concern the user.
4. If the messages suggest an emergency or red flag (such as severe trouble breathing, chest pain, unconsciousness, stroke signs, severe bleeding, seizure, suicidal intent, severe allergic reaction, or sudden severe symptoms), do not wait for follow-ups. Tell the user to contact local emergency services now and seek nearby human help. Do not provide a long response.
5. Be calm, concise, empathetic, and use plain language. Ask at most one question per response. Do not mention these internal rules.

Return only the response text for the user. Do not return JSON and do not call or imitate tools.`;

router.post('/', authMiddleware, async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const messages = req.body?.messages;

  if (!apiKey) {
    return res.status(503).json({ message: 'Medical chatbot is not configured.' });
  }

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
    return res.status(400).json({ message: 'Messages must be a non-empty array with at most 20 entries.' });
  }

  const sanitizedMessages = messages
    .filter((message) => message && ['user', 'assistant'].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim().slice(0, 2000),
    }))
    .filter((message) => message.content);

  if (!sanitizedMessages.length || sanitizedMessages.at(-1).role !== 'user') {
    return res.status(400).json({ message: 'The last message must be from the user.' });
  }

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...sanitizedMessages],
        temperature: 0.25,
        max_completion_tokens: 500,
        reasoning_effort: 'low',
        include_reasoning: false,
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
    const content = responseMessage?.content;
    let reply = typeof content === 'string' ? content.trim() : '';

    // Accept JSON text as a defensive fallback if the model ignores the
    // plain-text instruction, without enabling Groq's tool-call parser.
    if (reply.startsWith('{')) {
      try {
        reply = JSON.parse(reply)?.reply?.trim() || reply;
      } catch {
        // Keep the original text when it is not valid JSON.
      }
    }

    if (!reply) throw new Error('The model returned an empty response.');

    return res.json({ reply, model: MODEL });
  } catch (error) {
    console.error('Medical chatbot error:', error.response?.data || error.message);
    const status = error.response?.status;
    return res.status(status === 429 ? 429 : 502).json({
      message: status === 429
        ? 'The chatbot is busy. Please try again shortly.'
        : 'The chatbot could not respond. Please try again.',
    });
  }
});

module.exports = router;
