const CACHE_NAME = 'genmedibot-v1';
const urlsToCache = [
  '/',
  '/calm',
  '/emergency',
  '/manifest.json',
  '/favicon.ico'
];

// Emergency response templates for offline use
const emergencyResponses = {
  'cpr': "🚨 CPR EMERGENCY: 1) Call 911 immediately 2) Place hands on center of chest 3) Push hard and fast at least 2 inches deep 4) 30 compressions, then 2 breaths 5) Continue until help arrives.",
  'choking': "🚨 CHOKING: If person can cough/speak, encourage coughing. If not: 1) Stand behind them 2) 5 back blows between shoulder blades 3) 5 abdominal thrusts (Heimlich) 4) Repeat until object comes out 5) Call 911 if unsuccessful.",
  'bleeding': "🩹 BLEEDING: 1) Apply direct pressure with clean cloth 2) Elevate the wound above heart if possible 3) Don't remove embedded objects 4) If blood soaks through, add more cloth on top 5) Seek medical attention for deep cuts.",
  'burns': "🔥 BURNS: 1) Remove from heat source 2) Cool with running water for 10-15 minutes 3) Don't use ice 4) Cover with clean, loose bandage 5) For severe burns (larger than palm), seek immediate medical attention.",
  'anxiety': "💙 ANXIETY SUPPORT: You're safe. Try the 5-4-3-2-1 technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Breathe slowly: 4 seconds in, 4 hold, 4 out.",
  'breathing': "🫁 BREATHING HELP: Slow down your breathing. Breathe into a paper bag or cupped hands if available. Focus on exhaling slowly - longer exhales than inhales. Try our Calm Corner breathing exercise."
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If offline and requesting the main app, return the cached index
        if (event.request.navigate) {
          return caches.match('/');
        }
      })
  );
});

// Handle emergency response requests when offline
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_EMERGENCY_RESPONSE') {
    const query = event.data.query.toLowerCase();
    let response = "I'm currently offline, but here are the emergency numbers: 911 for emergencies, 988 for crisis support.";
    
    // Match emergency responses
    for (const [key, emergencyResponse] of Object.entries(emergencyResponses)) {
      if (query.includes(key)) {
        response = emergencyResponse;
        break;
      }
    }
    
    event.ports[0].postMessage({ response });
  }
});