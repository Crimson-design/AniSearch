import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Pager from "@/components/Pager";
import TopBar from "@/components/TopBar";

type SearchParams = Promise<{ q?: string; page?: string }>;

const PAGE_SIZE = 30;

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { q, page } = await searchParams;
  const term = (q ?? "").replace(/[%,()]/g, " ").trim();
  const current = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("anime")
    .select("id, title_romaji, title_english, year, cover_url", {
      count: "exact",
    })
    .order("id", { ascending: true })
    .range(from, to);

  if (term) {
    query = query.or(
      `title_romaji.ilike.%${term}%,title_english.ilike.%${term}%`
    );
  }

  const { data, error, count } = await query;

  if (error) return <p className="empty-message">Error: {error.message}</p>;
  if (!data || data.length === 0)
    return <p className="empty-message">No anime found.</p>;

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <h2 className="section-title">
        {term ? `Results for "${term}"` : "Browse Anime"}
      </h2>
      <div className="poster-grid">
        {data.map((a) => (
          <a key={a.id} href={`/anime/${a.id}`} className="poster-card">
            {a.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.cover_url}
                alt={a.title_romaji}
                className="poster-image"
              />
            )}
            <p className="poster-title">{a.title_english || a.title_romaji}</p>
            <p className="poster-meta">{a.year ?? "Year unknown"}</p>
          </a>
        ))}
      </div>
      <Pager term={term} current={current} totalPages={totalPages} />
    </>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <TopBar />
      <main className="container">
        <Suspense fallback={<p className="empty-message">Loading...</p>}>
          <Results searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}