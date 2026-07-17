const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const MODEL = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are MediNova's weather-related health risk educator. Analyze only the supplied current weather conditions.

Rules:
- Do not diagnose the user or claim that weather proves they will develop a disease.
- Describe plausible short-term weather-related health concerns or exposure risks, not personalized predictions.
- Do not prescribe medicines, supplements, doses, or treatments.
- Give simple, low-risk prevention actions. Never claim an action guarantees prevention.
- Do not infer outbreaks, mosquito prevalence, air pollution, pollen, or local disease incidence when that data is absent.
- Include only concerns genuinely supported by the supplied conditions. If conditions are mild, say overall exposure risk is low.
- Use clear language suitable for the general public. Return only the required JSON.`;

const asFiniteNumber = (value, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
};

router.post('/', authMiddleware, async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const input = req.body?.weather;

  if (!apiKey) {
    return res.status(503).json({ message: 'Weather health analysis is not configured.' });
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return res.status(400).json({ message: 'Current weather data is required.' });
  }

  const weather = {
    temperatureC: asFiniteNumber(input.temperatureC, -90, 65),
    apparentTemperatureC: asFiniteNumber(input.apparentTemperatureC, -100, 75),
    humidityPercent: asFiniteNumber(input.humidityPercent, 0, 100),
    precipitationMm: asFiniteNumber(input.precipitationMm, 0, 1000),
    windSpeedKmh: asFiniteNumber(input.windSpeedKmh, 0, 500),
    uvIndex: asFiniteNumber(input.uvIndex, 0, 30),
    weatherDescription: String(input.weatherDescription || 'Unknown').slice(0, 80),
    observedAt: String(input.observedAt || '').slice(0, 50),
    timezone: String(input.timezone || '').slice(0, 80),
  };

  if (weather.temperatureC === null || weather.humidityPercent === null) {
    return res.status(400).json({ message: 'Temperature and humidity are required.' });
  }

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze these current conditions:\n${JSON.stringify(weather)}` },
        ],
        temperature: 0.2,
        max_completion_tokens: 700,
        reasoning_effort: 'low',
        include_reasoning: false,
        tool_choice: 'auto',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'weather_health_risk',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                overview: { type: 'string' },
                overallRisk: { type: 'string', enum: ['Low', 'Moderate', 'High'] },
                concerns: {
                  type: 'array',
                  maxItems: 4,
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      riskLevel: { type: 'string', enum: ['Low', 'Moderate', 'High'] },
                      reason: { type: 'string' },
                      preventionActions: {
                        type: 'array',
                        minItems: 1,
                        maxItems: 4,
                        items: { type: 'string' },
                      },
                    },
                    required: ['name', 'riskLevel', 'reason', 'preventionActions'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['overview', 'overallRisk', 'concerns'],
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
        (toolCall) => toolCall.function?.name === 'weather_health_risk'
      )?.function?.arguments;
    const analysis = JSON.parse(content);

    if (!analysis?.overview || !Array.isArray(analysis?.concerns)) {
      throw new Error('The model returned an invalid analysis.');
    }

    return res.json({ ...analysis, model: MODEL });
  } catch (error) {
    console.error('Weather disease risk error:', error.response?.data || error.message);
    const status = error.response?.status;
    return res.status(status === 429 ? 429 : 502).json({
      message: status === 429
        ? 'The weather health service is busy. Please try again shortly.'
        : 'Weather health risks could not be analyzed. Please try again.',
    });
  }
});

module.exports = router;
