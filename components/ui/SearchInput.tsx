"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "./icons";

/**
 * Filters rows already rendered by the server: any element matching
 * `rowSelector` inside `scopeSelector` gets `hidden` toggled based on
 * whether its text (or its `data-search-text` override) contains the query.
 * No new query is issued — it only filters data already on the page.
 */
export default function SearchInput({
  placeholder = "Buscar...",
  scopeSelector,
  rowSelector = "[data-search-row]",
  noResultsSelector,
  className = "",
}: {
  placeholder?: string;
  scopeSelector: string;
  rowSelector?: string;
  noResultsSelector?: string;
  className?: string;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const scope = document.querySelector(scopeSelector);
    if (!scope) return;
    const rows = scope.querySelectorAll<HTMLElement>(rowSelector);
    const needle = value.trim().toLowerCase();
    let anyVisible = false;

    rows.forEach((row) => {
      const haystack = (row.dataset.searchText ?? row.textContent ?? "").toLowerCase();
      const matches = needle.length === 0 || haystack.includes(needle);
      row.classList.toggle("hidden", !matches);
      if (matches) anyVisible = true;
    });

    if (noResultsSelector) {
      const noResultsEl = document.querySelector<HTMLElement>(noResultsSelector);
      noResultsEl?.classList.toggle("hidden", needle.length === 0 || anyVisible);
    }
  }, [value, scopeSelector, rowSelector, noResultsSelector]);

  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  );
}
