"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Row = {
  score: number;
  review: string | null;
  created_at: string;
  anime: {
    id: number;
    title_romaji: string;
    title_english: string | null;
    cover_url: string | null;
  } | null;
};

export default function MyReviews() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRows(null);
      return;
    }
    supabase
      .from("ratings")
      .select(
        "score, review, created_at, anime:anime_id (id, title_romaji, title_english, cover_url)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows((data ?? []) as unknown as Row[]);
      });
  }, [user]);

  if (!checked) return <p className="empty-message">Loading...</p>;

  if (!user) {
    return (
      <div className="rating-box">
        <p className="rating-heading">Log in to see your reviews</p>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={() => window.dispatchEvent(new Event("open-auth"))}
          >
            Log in / Sign up
          </button>
        </div>
      </div>
    );
  }

  if (error) return <p className="message-error">Error: {error}</p>;
  if (!rows) return <p className="empty-message">Loading...</p>;

  if (rows.length === 0) {
    return (
      <p className="empty-message">
        You haven&apos;t rated anything yet.{" "}
        <a href="/" className="back-link">
          Browse anime
        </a>{" "}
        and add your first rating.
      </p>
    );
  }

  return (
    <div className="my-reviews">
      {rows
        .filter((r) => r.anime)
        .map((r) => (
          <div key={r.anime!.id} className="review-card my-review">
            {r.anime!.cover_url && (
              <a href={`/anime/${r.anime!.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.anime!.cover_url}
                  alt={r.anime!.title_romaji}
                  className="my-review-poster"
                />
              </a>
            )}
            <div className="my-review-body">
              <div className="review-head">
                <a href={`/anime/${r.anime!.id}`} className="review-user">
                  {r.anime!.title_english || r.anime!.title_romaji}
                </a>
                <span className="review-score">{r.score}/10</span>
                <span className="review-date">
                  {new Date(r.created_at).toLocaleDateString("en-US")}
                </span>
              </div>
              <p className="review-text">
                {r.review || "Rating only, no written review."}
              </p>
              <a href={`/anime/${r.anime!.id}`} className="back-link">
                Edit
              </a>
            </div>
          </div>
        ))}
    </div>
  );
}