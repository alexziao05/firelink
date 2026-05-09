"use client";

import { useEffect, useRef, useState } from "react";

export interface FilterOption<T extends string> {
  id: T;
  label: string;
}

interface FilterMenuProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible label for the menu (e.g. "Sort households"). */
  menuLabel: string;
  /** Accessible verb describing the action (e.g. "Filter", "Sort"). Defaults to "Filter". */
  buttonLabel?: string;
  /** Optional additional classes applied to the button element. */
  buttonClassName?: string;
  /** Optional alignment of the dropdown panel. Defaults to "right". */
  align?: "left" | "right";
}

export function FilterMenu<T extends string>({
  options,
  value,
  onChange,
  menuLabel,
  buttonLabel = "Filter",
  buttonClassName,
  align = "right",
}: FilterMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const activeLabel = options.find((o) => o.id === value)?.label ?? "";

  return (
    <div
      ref={wrapperRef}
      className={`relative flex ${align === "right" ? "justify-end" : "justify-start"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${buttonLabel}. Current: ${activeLabel}`}
        className={`inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-amber)]/50 dark:hover:border-slate-500 ${buttonClassName ?? ""}`}
      >
        <FilterIcon className="h-3.5 w-3.5" />
        {buttonLabel}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={menuLabel}
          className={`absolute top-full z-10 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-1 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}
        >
          {options.map((opt) => {
            const selected = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-medium transition ${
                  selected
                    ? "bg-[var(--brand-amber)]/12 text-[var(--foreground)] dark:bg-[var(--brand-amber)]/18"
                    : "text-[var(--muted-foreground)] hover:bg-slate-100 hover:text-[var(--foreground)] dark:hover:bg-slate-800/80"
                }`}
              >
                <span>{opt.label}</span>
                {selected && <CheckIcon className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 5h18l-7 9v6l-4-2v-4z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
