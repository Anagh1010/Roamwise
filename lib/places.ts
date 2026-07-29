export type PlaceMatch = { name: string; latitude: number; longitude: number };

export async function findPlace(query: string): Promise<PlaceMatch | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "RoamwiseTravelPlanner/1.0 (personal project)" },
    next: { revalidate: 86_400 }
  });
  if (!response.ok) return null;
  const data = await response.json();
  const match = data[0];
  if (!match) return null;
  return { name: match.display_name || query, longitude: Number(match.lon), latitude: Number(match.lat) };
}
