"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import "./SearchBar.css";

type SearchBarProps = {
  initial?: string;
};

export default function SearchBar({ initial = "" }: SearchBarProps) {
  const [query, setQuery] = useState<string>(initial);
  const router = useRouter();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/?q=${encodeURIComponent(q)}`);
  };

  return (
    <form className="searchbar" onSubmit={submit} role="search">
      <svg className="searchbar__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="22" y2="22" />
      </svg>

      <input
        className="searchbar__input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search anime..."
        aria-label="Search anime"
      />

      <button
        type="button"
        className={`searchbar__clear ${query ? "show" : ""}`}
        onClick={() => setQuery("")}
        aria-label="Clear search"
        tabIndex={query ? 0 : -1}
      >
        ✕
      </button>

      <button type="submit" className="searchbar__go">
        Search
      </button>
    </form>
  );
}