"use client";

import { useRouter } from "next/navigation";

export default function Pager({
  term,
  current,
  totalPages,
}: {
  term: string;
  current: number;
  totalPages: number;
}) {
  const router = useRouter();

  function go(page: number) {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    params.set("page", String(page));
    router.push(`/?${params.toString()}`);
  }

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        type="button"
        className="pager-btn"
        disabled={current <= 1}
        onClick={() => go(current - 1)}
      >
        ← Previous
      </button>
      <span className="pager-info">
        Page {current} of {totalPages}
      </span>
      <button
        type="button"
        className="pager-btn"
        disabled={current >= totalPages}
        onClick={() => go(current + 1)}
      >
        Next →
      </button>
    </nav>
  );
}