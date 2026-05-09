"use client";

import { useLayoutEffect, useState } from "react";

export function ThemeToggle() {
  /** Must match server render; sync from DOM after hydration (see theme script in layout `<head>`). */
  const [isDark, setIsDark] = useState(false);

  useLayoutEffect(() => {
    // Initial `false` matches SSR; script in `<head>` may already have set `.dark` on `<html>`.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from external DOM; not derivable on server
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem("theme", nextIsDark ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-8 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] px-2.5 text-[11px] font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-amber)]/45 dark:hover:bg-slate-800/90"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      {isDark ? "Dark" : "Light"}
    </button>
  );
}
