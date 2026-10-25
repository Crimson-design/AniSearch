import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RatingBox from "@/components/RatingBox";
import TopBar from "@/components/TopBar";

type Params = Promise<{ id: string }>;

async function Reviews({ animeId }: { animeId: number }) {
  const { data } = await supabase
    .from("ratings")
    .select("username, score, review, created_at")
    .eq("anime_id", animeId)
    .not("review", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <section className="reviews">
      <h2 className="section-title">Reviews</h2>
      {!data || data.length === 0 ? (
        <p className="empty-message">No reviews yet. Be the first!</p>
      ) : (
        data.map((r, i) => (
          <div key={i} className="review-card">
            <div className="review-head">
              <span className="review-user">{r.username || "Anonymous"}</span>
              <span className="review-score">{r.score}/10</span>
              <span className="review-date">
                {new Date(r.created_at).toLocaleDateString("en-US")}
              </span>
            </div>
            <p className="review-text">{r.review}</p>
          </div>
        ))
      )}
    </section>
  );
}

async function Details({ params }: { params: Params }) {
  const { id } = await params;
  const animeId = Number(id);
  if (!Number.isInteger(animeId)) notFound();

  const { data: anime } = await supabase
    .from("anime")
    .select("*")
    .eq("id", animeId)
    .single();

  if (!anime) notFound();

  const { data: ratings } = await supabase
    .from("ratings")
    .select("score")
    .eq("anime_id", animeId);

  const count = ratings?.length ?? 0;
  const average =
    count > 0
      ? (ratings!.reduce((sum, r) => sum + r.score, 0) / count).toFixed(1)
      : null;

  return (
    <>
      <div className="detail-top">
        {anime.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.cover_url}
            alt={anime.title_romaji}
            className="detail-poster-lg"
          />
        )}
        <div className="detail-side">
          <h1 className="detail-title">
            {anime.title_english || anime.title_romaji}
          </h1>
          {anime.title_english && (
            <p className="detail-subtitle">{anime.title_romaji}</p>
          )}
          <p className="detail-year">{anime.year ?? "Year unknown"}</p>
          <div className="genre-row">
            {anime.genres?.map((g: string) => (
              <span key={g} className="genre-tag">
                {g}
              </span>
            ))}
          </div>
          <div className="avg-row">
            <span className="avg-score">
              {average ? `★ ${average}` : "No ratings yet"}
            </span>
            {count > 0 && (
              <span className="avg-count">
                {count} {count === 1 ? "rating" : "ratings"}
              </span>
            )}
          </div>
          <RatingBox animeId={animeId} />
        </div>
      </div>

      <section className="detail-about">
        <h2 className="section-title">About</h2>
        <p className="synopsis">{anime.synopsis}</p>
      </section>

      <Reviews animeId={animeId} />
    </>
  );
}

export default function AnimePage({ params }: { params: Params }) {
  return (
    <>
      <TopBar />
      <main className="container">
        <Suspense fallback={<p className="empty-message">Loading...</p>}>
          <Details params={params} />
        </Suspense>
      </main>
    </>
  );
}