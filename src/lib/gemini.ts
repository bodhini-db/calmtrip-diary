import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

/** Strips markdown code fences that Gemini sometimes wraps JSON in. */
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text.trim();
}

// ── Types ─────────────────────────────────────────────────────

export interface AiCheckpoint {
  name: string;
  description: string;
  suggested_duration_minutes: number;
  lat?: number;
  lng?: number;
}

export interface AiTripPlan {
  title: string;
  description: string;
  estimated_duration_minutes: number;
  city: string;
  checkpoints: AiCheckpoint[];
}

export interface NearbyPlace {
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  distance_m: number;
}

// ── Feature 1: AI Trip Planner ────────────────────────────────

export const planTrip = async (
  prompt: string,
  durationMinutes: number,
  pastTripSummary: string
): Promise<AiTripPlan> => {
  const fullPrompt = `You are a knowledgeable local travel guide for Indian cities.

User request: "${prompt}"
Available time: ${durationMinutes} minutes
User's past travels: ${pastTripSummary || 'New user, no travel history yet'}

Create a realistic trip plan. Return ONLY valid JSON (no markdown, no explanation):
{
  "title": "Short catchy trip title",
  "description": "2-sentence overview of this journey and why it's great",
  "estimated_duration_minutes": ${durationMinutes},
  "city": "City name for geocoding (e.g. Bangalore, Mumbai)",
  "checkpoints": [
    {
      "name": "Exact place name as it would appear on Google Maps / OpenStreetMap",
      "description": "What to do or see here — 1 engaging sentence",
      "suggested_duration_minutes": 30
    }
  ]
}

Rules:
- 3 to 5 checkpoints that form a logical, walkable/driveable route
- Use real, well-known place names that can be found on a map
- Make sure total checkpoint durations fit within ${durationMinutes} minutes
- Focus on the area mentioned by the user`;

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text();
  return JSON.parse(extractJson(text)) as AiTripPlan;
};

/**
 * Geocodes each checkpoint name using Nominatim (free, no key needed).
 * Respects Nominatim's 1 req/sec rate limit.
 */
export const geocodeCheckpoints = async (
  checkpoints: AiCheckpoint[],
  city: string
): Promise<AiCheckpoint[]> => {
  const results: AiCheckpoint[] = [];

  for (const cp of checkpoints) {
    let found = false;

    // Try progressively simpler queries until one works
    const queries = [
      `${cp.name}, ${city}, India`,
      `${cp.name}, India`,
      // Strip neighbourhood suffix (e.g. ", HSR Layout") and try just the place name + city
      `${cp.name.split(',')[0].trim()}, ${city}, India`,
    ];

    for (const q of queries) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'CalmTripDiary/1.0 (student project)' },
        });
        const data = await res.json();
        if (data.length > 0) {
          results.push({ ...cp, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          found = true;
          break;
        }
      } catch {
        // try next query
      }
      await new Promise(r => setTimeout(r, 1100));
    }

    if (!found) results.push(cp);
  }

  return results;
};

// ── Feature 2: AI Journal Narrator ───────────────────────────

export const generateJournalEntry = async (tripData: {
  origin: string;
  destination: string;
  distance_km: number;
  duration_minutes: number;
  checkpoints: Array<{ name: string; photoCount: number }>;
  date: string;
}): Promise<string> => {
  const stops = tripData.checkpoints.length > 0
    ? tripData.checkpoints.map(cp => `${cp.name}${cp.photoCount > 0 ? ` (${cp.photoCount} photos)` : ''}`).join(', ')
    : 'no named stops';

  const prompt = `Write a warm, personal travel diary entry in first person. Sound like a real person — conversational, reflective, with small sensory details. 2–3 short paragraphs. No title.

Trip details:
- Date: ${tripData.date}
- Route: ${tripData.origin} → ${tripData.destination}
- Distance: ${tripData.distance_km.toFixed(1)} km in ${tripData.duration_minutes} minutes
- Stops visited: ${stops}

Write the diary entry directly. Capture the mood, pace, and feeling of the journey.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

// ── Feature 3: Nearby Discovery ──────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fetches real nearby POIs from Overpass (OpenStreetMap). No API key needed. */
export const fetchNearbyPlaces = async (
  lat: number,
  lng: number,
  radiusM = 600
): Promise<Array<{ name: string; type: string; lat: number; lng: number; distance_m: number }>> => {
  const query = `[out:json][timeout:10];
(
  node["amenity"~"cafe|restaurant|library|museum|cinema|theatre|place_of_worship"](around:${radiusM},${lat},${lng});
  node["tourism"~"attraction|viewpoint|museum|artwork|gallery"](around:${radiusM},${lat},${lng});
  node["leisure"~"park|garden"](around:${radiusM},${lat},${lng});
  node["historic"](around:${radiusM},${lat},${lng});
);
out body 25;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'text/plain' },
  });
  const data = await res.json();

  return (data.elements as any[])
    .filter(el => el.tags?.name)
    .map(el => ({
      name: el.tags.name as string,
      type: (el.tags.amenity || el.tags.tourism || el.tags.leisure || el.tags.historic || 'place') as string,
      lat: el.lat as number,
      lng: el.lon as number,
      distance_m: Math.round(haversineKm(lat, lng, el.lat, el.lon) * 1000),
    }))
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, 20);
};

/** Sends the raw Overpass places to Gemini for ranking + descriptions. */
export const discoverNearby = async (
  places: Array<{ name: string; type: string; lat: number; lng: number; distance_m: number }>
): Promise<NearbyPlace[]> => {
  if (places.length === 0) return [];

  const list = places
    .map((p, i) => `${i + 1}. ${p.name} (${p.type}, ${p.distance_m}m away)`)
    .join('\n');

  const prompt = `You are helping a traveller discover interesting nearby places in India.

Nearby options:
${list}

Pick the 5 most interesting/worthwhile places and write one engaging sentence for each explaining why it's worth visiting.
Return ONLY valid JSON array (no markdown):
[
  { "index": 1, "description": "One sentence about why this place is worth visiting." }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const ranked: Array<{ index: number; description: string }> = JSON.parse(extractJson(text));

  return ranked
    .map(r => {
      const p = places[r.index - 1];
      if (!p) return null;
      return {
        name: p.name,
        category: p.type,
        description: r.description,
        lat: p.lat,
        lng: p.lng,
        distance_m: p.distance_m,
      } as NearbyPlace;
    })
    .filter(Boolean) as NearbyPlace[];
};
