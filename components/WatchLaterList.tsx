"use client";

import "./WatchLater.css";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Anime = {
  id: number;
  title_romaji: string;
  title_english: string | null;
  cover_url: string | null;
};
type Item = { added_at: string; anime: Anime | null };
type ListRow = { id: string; name: string; watchlist_items: Item[] };

const MAX = 5;

function sortedItems(list: ListRow): Item[] {
  return list.watchlist_items
    .filter((i) => i.anime)
    .sort((a, b) => a.added_at.localeCompare(b.added_at));
}

export default function WatchLaterList() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [lists, setLists] = useState<ListRow[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const load = useCallback(async (u: User) => {
    const { data, error } = await supabase
      .from("watchlists")
      .select(
        "id, name, watchlist_items(added_at, anime:anime_id (id, title_romaji, title_english, cover_url))"
      )
      .eq("user_id", u.id)
      .order("created_at", { ascending: true });
    if (error) {
      setMessage(error.message);
      setLists([]);
      return;
    }
    setLists((data ?? []) as unknown as ListRow[]);
  }, []);

  useEffect(() => {
    if (user) load(user);
    else setLists(null);
  }, [user, load]);

  async function createList() {
    if (!user) return;
    const name = newName.trim();
    if (!name) {
      setMessage("Give your list a name first.");
      return;
    }
    setCreating(true);
    setMessage("");
    const { error } = await supabase
      .from("watchlists")
      .insert({ user_id: user.id, name });
    if (error) {
      setMessage(error.message);
    } else {
      setNewName("");
      await load(user);
    }
    setCreating(false);
  }

  async function saveRename(listId: string) {
    const name = renameValue.trim();
    if (!name) {
      setMessage("A list needs a name.");
      return;
    }
    setMessage("");
    const { error } = await supabase
      .from("watchlists")
      .update({ name })
      .eq("id", listId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setLists(
      (prev) => prev?.map((l) => (l.id === listId ? { ...l, name } : l)) ?? null
    );
    setRenamingId(null);
  }

  async function removeItem(listId: string, animeId: number) {
    const { error } = await supabase
      .from("watchlist_items")
      .delete()
      .eq("watchlist_id", listId)
      .eq("anime_id", animeId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setLists(
      (prev) =>
        prev?.map((l) =>
          l.id === listId
            ? {
              ...l,
              watchlist_items: l.watchlist_items.filter(
                (i) => i.anime?.id !== animeId
              ),
            }
            : l
        ) ?? null
    );
  }

  async function deleteList(listId: string) {
    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("id", listId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setConfirmDeleteId(null);
    setLists((prev) => prev?.filter((l) => l.id !== listId) ?? null);
  }

  if (!checked) {
    return (
      <div className="wl">
        <div className="wl-card wl-skeleton" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="wl-login">
        <h2 className="wl-name">Log in to make your watch lists</h2>
        <p>Build playlists of up to 5 anime each and keep them in one place.</p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("open-auth"))}
        >
          Log in / Sign up
        </button>
      </div>
    );
  }

  const totalAnime =
    lists?.reduce((sum, l) => sum + sortedItems(l).length, 0) ?? 0;

  return (
    <div className="wl">
      <p className="wl-sub">
        Make playlists of up to {MAX} anime each. Open any anime and press{" "}
        <strong>+ Add to list</strong> to fill them.
      </p>

      {lists && (
        <div className="wl-stats">
          <span>
            <b>{lists.length}</b>
            {lists.length === 1 ? "list" : "lists"}
          </span>
          <span>
            <b>{totalAnime}</b>anime saved
          </span>
        </div>
      )}

      <form
        className="wl-create"
        onSubmit={(e) => {
          e.preventDefault();
          createList();
        }}
      >
        <input
          placeholder="New list name (e.g. Weekend binge)"
          value={newName}
          maxLength={60}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "+ New list"}
        </button>
      </form>

      {message && <p className="wl-error">{message}</p>}

      {lists === null ? (
        <>
          <div className="wl-card wl-skeleton" />
          <div className="wl-card wl-skeleton" />
        </>
      ) : lists.length === 0 ? (
        <div className="wl-empty-state">
          <p className="wl-empty-title">No lists yet</p>
          <p>
            Create your first list above, then open any anime and press{" "}
            <strong>+ Add to list</strong>.
          </p>
          <a href="/" className="wl-cta">
            Browse anime
          </a>
        </div>
      ) : (
        lists.map((list) => {
          const items = sortedItems(list);
          const full = items.length >= MAX;
          return (
            <section key={list.id} className="wl-card">
              <header className="wl-card-head">
                <div className="wl-title-wrap">
                  {renamingId === list.id ? (
                    <div className="wl-rename-row">
                      <input
                        className="wl-rename"
                        autoFocus
                        value={renameValue}
                        maxLength={60}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(list.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                      <button
                        type="button"
                        className="wl-link"
                        onClick={() => saveRename(list.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="wl-link"
                        onClick={() => setRenamingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h2 className="wl-name">{list.name}</h2>
                  )}
                  <span className={`wl-badge ${full ? "wl-badge-full" : ""}`}>
                    {full ? "Full" : `${items.length}/${MAX}`}
                  </span>
                </div>

                <div className="wl-actions">
                  {renamingId !== list.id && (
                    <button
                      type="button"
                      className="wl-link"
                      onClick={() => {
                        setRenamingId(list.id);
                        setRenameValue(list.name);
                      }}
                    >
                      Rename
                    </button>
                  )}
                  {confirmDeleteId === list.id ? (
                    <>
                      <span className="wl-confirm">Delete this list?</span>
                      <button
                        type="button"
                        className="wl-link wl-danger"
                        onClick={() => deleteList(list.id)}
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        className="wl-link"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="wl-link wl-danger"
                      onClick={() => setConfirmDeleteId(list.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </header>

              <div className="wl-progress" aria-hidden="true">
                <span style={{ width: `${(items.length / MAX) * 100}%` }} />
              </div>

              <div className="wl-slots">
                {Array.from({ length: MAX }, (_, i) => {
                  const item = items[i];
                  if (!item) {
                    return (
                      <a key={`empty-${i}`} href="/" className="wl-empty">
                        <span className="wl-empty-plus">+</span>
                        <span className="wl-empty-text">Add anime</span>
                      </a>
                    );
                  }
                  const a = item.anime!;
                  const title = a.title_english || a.title_romaji;
                  return (
                    <div key={a.id} className="wl-slot">
                      <a href={`/anime/${a.id}`} className="wl-poster">
                        {a.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.cover_url} alt={title} />
                        ) : (
                          <div className="wl-noimg">No image</div>
                        )}
                        <span className="wl-rank">{i + 1}</span>
                      </a>
                      <button
                        type="button"
                        className="wl-remove"
                        title="Remove from list"
                        aria-label={`Remove ${title}`}
                        onClick={() => removeItem(list.id, a.id)}
                      >
                        ×
                      </button>
                      <p className="wl-slot-title">{title}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}