"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function AddAnimeForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!ALLOWED.includes(picked.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError("That image is over 5 MB. Please choose a smaller one.");
      return;
    }
    setError("");
    setFile(picked);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");

    const cleanName = name.trim();
    const cleanDesc = description.trim();

    if (cleanName.length < 2) {
      setError("The name needs at least 2 characters.");
      return;
    }
    if (!file) {
      setError("Please choose a cover image.");
      return;
    }
    if (cleanDesc.length < 10) {
      setError("The description needs at least 10 characters.");
      return;
    }

    setSaving(true);

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("anime-covers")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError(`Image upload failed: ${uploadError.message}`);
      setSaving(false);
      return;
    }

    const { data: pub } = supabase.storage
      .from("anime-covers")
      .getPublicUrl(path);

    const { data, error: insertError } = await supabase
      .from("anime")
      .insert({
        title_romaji: cleanName,
        synopsis: cleanDesc,
        cover_url: pub.publicUrl,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(`Could not save: ${insertError?.message ?? "unknown error"}`);
      setSaving(false);
      return;
    }

    router.push(`/anime/${data.id}`);
  }

  if (!checked) return <p className="empty-message">Loading...</p>;

  if (!user) {
    return (
      <div className="rating-box">
        <p className="rating-heading">Log in to add an anime</p>
        <p className="empty-message">
          You need an account to add an anime to the site.
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

  return (
    <form className="add-form" onSubmit={submit}>
      <div className="upload-box">
        <label className="upload-drop">
          <input
            className="upload-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Cover preview" />
          ) : (
            <>
              <span className="upload-plus">+</span>
              <span>Click to choose a cover image</span>
              <span className="upload-hint">JPG, PNG or WEBP, up to 5 MB</span>
            </>
          )}
        </label>
        {preview && (
          <button
            type="button"
            className="link-button"
            onClick={() => setFile(null)}
          >
            Remove image
          </button>
        )}
      </div>

      <div className="add-fields">
        <label className="field-label">Name</label>
        <input
          className="field"
          placeholder="e.g. Cowboy Bebop"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="field-label">Description</label>
        <textarea
          className="field"
          placeholder="What is it about?"
          rows={8}
          value={description}
          maxLength={3000}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add anime"}
          </button>
          <a href="/" className="btn">
            Cancel
          </a>
        </div>

        {error && <p className="message message-error">{error}</p>}
      </div>
    </form>
  );
}