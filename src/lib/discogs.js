const BASE_URL = "https://api.discogs.com";
const TOKEN = import.meta.env.VITE_DISCOGS_TOKEN;

const headers = {
  Authorization: `Discogs token=${TOKEN}`,
  "User-Agent": "CDCollectionApp/1.0",
};

export async function searchRelease({ artist }) {
  const params = new URLSearchParams({
    artist,
    type: "release",
  });
  const res = await fetch(`${BASE_URL}/database/search?${params}`, { headers });
  if (!res.ok) throw new Error("Discogs search failed");
  return res.json();
}
