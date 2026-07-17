const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const OVERPASS_ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const NOMINATIM_URL = process.env.NOMINATIM_URL
  || 'https://nominatim.openstreetmap.org/search';
const CACHE_TTL_MS = 15 * 60 * 1000;
const resultCache = new Map();
let lastNominatimRequestAt = 0;

const coordinate = (value, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
};

const cacheKey = (lat, lon) => `${lat.toFixed(2)},${lon.toFixed(2)}`;

const getCached = (key) => {
  const cached = resultCache.get(key);
  if (!cached || Date.now() - cached.createdAt > CACHE_TTL_MS) {
    resultCache.delete(key);
    return null;
  }
  return cached.elements;
};

const waitForNominatimRateLimit = async () => {
  const waitMs = Math.max(0, 1050 - (Date.now() - lastNominatimRequestAt));
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastNominatimRequestAt = Date.now();
};

const searchNominatim = async (lat, lon) => {
  const latitudeDelta = 0.06;
  const longitudeDelta = 0.06 / Math.max(Math.cos((lat * Math.PI) / 180), 0.25);
  const viewbox = [
    lon - longitudeDelta,
    lat + latitudeDelta,
    lon + longitudeDelta,
    lat - latitudeDelta,
  ].join(',');

  await waitForNominatimRateLimit();
  const response = await axios.get(NOMINATIM_URL, {
    params: {
      q: 'hospital',
      format: 'jsonv2',
      bounded: 1,
      viewbox,
      limit: 20,
      addressdetails: 0,
    },
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MediNova/1.0 nearby-hospital-search',
    },
    timeout: 12000,
  });

  if (!Array.isArray(response.data)) return [];
  return response.data
    .map((place) => ({
      type: place.osm_type || 'place',
      id: place.osm_id || place.place_id,
      lat: Number(place.lat),
      lon: Number(place.lon),
      tags: {
        name: place.name || String(place.display_name || '').split(',')[0] || 'Hospital',
      },
    }))
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon));
};

const searchOverpass = async (lat, lon) => {
  const query = `[out:json][timeout:10];
    nwr["amenity"="hospital"](around:5000,${lat},${lon});
    out center 20;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await axios.post(
        endpoint,
        new URLSearchParams({ data: query }).toString(),
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'MediNova/1.0 nearby-hospital-search',
          },
          responseType: 'text',
          timeout: 12000,
        }
      );

      const data = typeof response.data === 'string'
        ? JSON.parse(response.data)
        : response.data;
      if (Array.isArray(data?.elements) && data.elements.length) return data.elements;
    } catch (error) {
      console.warn(`Nearby hospital provider failed (${endpoint}):`, error.message);
    }
  }

  return [];
};

router.get('/', authMiddleware, async (req, res) => {
  const lat = coordinate(req.query.lat, -90, 90);
  const lon = coordinate(req.query.lon, -180, 180);

  if (lat === null || lon === null) {
    return res.status(400).json({ message: 'Valid latitude and longitude are required.' });
  }

  const key = cacheKey(lat, lon);
  const cached = getCached(key);
  if (cached) return res.json({ elements: cached, source: 'cache' });

  try {
    const elements = await searchNominatim(lat, lon);
    if (elements.length) {
      resultCache.set(key, { elements, createdAt: Date.now() });
      return res.json({ elements, source: 'nominatim' });
    }
  } catch (error) {
    console.warn('Nearby hospital Nominatim search failed:', error.message);
  }

  const elements = await searchOverpass(lat, lon);
  if (elements.length) {
    resultCache.set(key, { elements, createdAt: Date.now() });
    return res.json({ elements, source: 'overpass' });
  }

  return res.status(502).json({
    message: 'Nearby hospital data providers are temporarily unavailable. Please try again.',
  });
});

module.exports = router;
