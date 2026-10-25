"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type ListRow = {
  id: string;
  name: string;
  watchlist_items: { anime_id: number }[];
};

const MAX_PER_LIST = 5;

export default function WatchLaterButton({ animeId }: { animeId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async (u: User) => {
    const { data, error } = await supabase
      .from("watchlists")
      .select("id, name, watchlist_items(anime_id)")
      .eq("user_id", u.id)
      .order("created_at", { ascending: true });
    if (error) {
      setMessage(error.message);
      return;
    }
    setLists((data ?? []) as unknown as ListRow[]);
  }, []);

  useEffect(() => {
    if (user) load(user);
    else setLists([]);
  }, [user, load]);

  async function toggle(list: ListRow) {
    if (!user) return;
    setBusy(true);
    setMessage("");
    const has = list.watchlist_items.some((i) => i.anime_id === animeId);
    const { error } = has
      ? await supabase
          .from("watchlist_items")
          .delete()
          .eq("watchlist_id", list.id)
          .eq("anime_id", animeId)
      : await supabase
          .from("watchlist_items")
          .insert({ watchlist_id: list.id, anime_id: animeId });
    if (error) {
      setMessage(
        error.message.includes("at most")
          ? `"${list.name}" is full (5 anime max).`
          : error.message
      );
    }
    await load(user);
    setBusy(false);
  }

  async function createList() {
    if (!user) return;
    const name = newName.trim();
    if (!name) {
      setMessage("Give your list a name.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase
      .from("watchlists")
      .insert({ user_id: user.id, name })
      .select("id")
      .single();
    if (error || !data) {
      setMessage(error?.message ?? "Could not create the list.");
      setBusy(false);
      return;
    }
    await supabase
      .from("watchlist_items")
      .insert({ watchlist_id: data.id, anime_id: animeId });
    setNewName("");
    await load(user);
    setBusy(false);
  }

  const inCount = lists.filter((l) =>
    l.watchlist_items.some((i) => i.anime_id === animeId)
  ).length;

  return (
    <div className="list-picker">
      <button
        type="button"
        className={`watch-btn ${inCount > 0 ? "watch-btn-on" : ""}`}
        onClick={() => {
          if (!user) {
            window.dispatchEvent(new Event("open-auth"));
            return;
          }
          setOpen(!open);
        }}
      >
        {inCount > 0
          ? `✓ In ${inCount} list${inCount === 1 ? "" : "s"}`
          : "+ Add to list"}
      </button>

      {open && user && (
        <div className="list-panel">
          <p className="list-panel-title">
            Your watch lists ({MAX_PER_LIST} anime max each)
          </p>

          {lists.length === 0 && (
            <p className="empty-message">
              You don&apos;t have any lists yet. Create one below.
            </p>
          )}

          {lists.map((l) => {
            const has = l.watchlist_items.some((i) => i.anime_id === animeId);
            const full = l.watchlist_items.length >= MAX_PER_LIST;
            return (
              <button
                key={l.id}
                type="button"
                className={`list-option ${has ? "list-option-on" : ""}`}
                disabled={busy || (full && !has)}
                onClick={() => toggle(l)}
              >
                <span>
                  {has ? "✓ " : ""}
                  {l.name}
                </span>
                <span className="list-count">
                  {l.watchlist_items.length}/{MAX_PER_LIST}
                </span>
              </button>
            );
          })}

          <div className="list-create">
            <input
              className="field"
              placeholder="New list name"
              value={newName}
              maxLength={60}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createList();
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={createList}
            >
              Create
            </button>
          </div>

          {message && <p className="message message-error">{message}</p>}

          <div className="btn-row">
            <a href="/watch-later" className="back-link">
              Manage lists
            </a>
            <button
              type="button"
              className="link-button"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}