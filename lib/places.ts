export type PlaceMatch = { name: string; latitude: number; longitude: number };

const placeCache = new Map<string, { match: PlaceMatch | null; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function findPlace(query: string): Promise<PlaceMatch | null> {
  const normalizedKey = query.trim().toLowerCase();
  const cached = placeCache.get(normalizedKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.match;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query.trim())}`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "RoamwiseTravelPlanner/1.0 (personal project)" },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const match = data[0];
    const result: PlaceMatch | null = match
      ? { name: match.display_name || query, longitude: Number(match.lon), latitude: Number(match.lat) }
      : null;

    placeCache.set(normalizedKey, { match: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    return null;
  }
}

