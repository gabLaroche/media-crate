const BASE_URL = "https://api.discogs.com";
const TOKEN = import.meta.env.VITE_DISCOGS_TOKEN;

export async function searchRelease({ artist, title }) {
  const params = new URLSearchParams({
    artist,
    release_title: title,
    type: "master",
  });

  const res = await fetch(`${BASE_URL}/database/search?${params}`, {
    headers: {
      Authorization: `Discogs token=${TOKEN}`,
      "User-Agent": "CDCollectionApp/1.0",
    },
  });

  if (!res.ok) {
    throw new Error("Discogs search failed");
  }

  return res.json();
}
