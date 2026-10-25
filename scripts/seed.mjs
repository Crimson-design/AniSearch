import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id
      title { romaji english }
      description(asHtml: false)
      genres
      seasonYear
      coverImage { large }
    }
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(page) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { page, perPage: 50 } }),
  });
  if (!res.ok) throw new Error(`AniList error ${res.status} on page ${page}`);
  const json = await res.json();
  return json.data.Page.media;
}

const clean = (text) => (text ? text.replace(/<[^>]*>/g, " ").trim() : null);

for (let page = 1; page <= 10; page++) {
  const media = await fetchPage(page);
  const rows = media.map((m) => ({
    id: m.id,
    title_romaji: m.title.romaji || m.title.english || "Untitled",
    title_english: m.title.english,
    synopsis: clean(m.description),
    genres: m.genres,
    year: m.seasonYear,
    cover_url: m.coverImage?.large,
  }));

  const { error } = await supabase
    .from("anime")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }
  console.log(`Page ${page} done (${rows.length} anime)`);
  await sleep(1500);
}
console.log("All done!");