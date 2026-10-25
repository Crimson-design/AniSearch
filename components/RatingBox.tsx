"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const VERDICTS = [
  "",
  "Awful",
  "Bad",
  "Poor",
  "Meh",
  "Okay",
  "Good",
  "Great",
  "Excellent",
  "Amazing",
  "Masterpiece",
];

export default function RatingBox({ animeId }: { animeId: number }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [score, setScore] = useState(5);
  const [hasRated, setHasRated] = useState(false);
  const [review, setReview] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function show(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setHasRated(false);
      return;
    }
    supabase
      .from("ratings")
      .select("score, review, username")
      .eq("anime_id", animeId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setScore(data.score);
          setReview(data.review ?? "");
          setUsername(data.username ?? "");
          setHasRated(true);
        }
      });
  }, [user, animeId]);

  async function save() {
    if (!user) return;
    const cleanReview = review.trim();
    const cleanName = username.trim();

    if (cleanReview && cleanName.length < 2) {
      show("Add a display name (2+ characters) to post a review.", true);
      return;
    }

    const { error } = await supabase.from("ratings").upsert(
      {
        user_id: user.id,
        anime_id: animeId,
        score,
        review: cleanReview || null,
        username: cleanName || null,
      },
      { onConflict: "user_id,anime_id" }
    );

    if (error) {
      show(error.message, true);
      return;
    }
    setHasRated(true);
    show("Saved!");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="rating-box">
        <p className="rating-heading">Rate and review this anime</p>
        <p className="empty-message">
          Log in to add your rating and write a review.
        </p>
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

  const fill = `${((score - 1) / 9) * 100}%`;

  return (
    <div className="rating-box">
      <p className="rating-heading">
        {hasRated ? "Your rating and review" : "Rate and review this anime"}
      </p>

      <div className="rating-readout">
        <span className="rating-number">{score}</span>
        <span className="rating-outof">/ 10</span>
        <span className="rating-verdict">{VERDICTS[score]}</span>
      </div>

      <input
        className="volume-slider"
        type="range"
        min={1}
        max={10}
        step={1}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        style={{ "--fill": fill } as CSSProperties}
        aria-label="Rating from 1 to 10"
      />
      <div className="rating-ticks">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>

      <input
        className="field"
        placeholder="Display name (shown with your review)"
        value={username}
        maxLength={30}
        onChange={(e) => setUsername(e.target.value)}
      />
      <textarea
        className="field"
        placeholder="Write a review (optional)..."
        rows={4}
        value={review}
        maxLength={2000}
        onChange={(e) => setReview(e.target.value)}
      />

      <div className="btn-row">
        <button className="btn btn-primary" onClick={save}>
          {hasRated ? "Update" : "Save"}
        </button>
      </div>

      {message && (
        <p className={`message ${isError ? "message-error" : ""}`}>{message}</p>
      )}
    </div>
  );
}