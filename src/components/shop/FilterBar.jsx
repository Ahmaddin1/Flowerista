"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dropdown({ triggerLabel, ariaLabel, children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex items-center gap-2 rounded-pill border border-card-border bg-card px-4 py-1.5 text-sm text-text transition-colors duration-200 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span>{triggerLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="card-surface absolute right-0 z-20 mt-2 min-w-[220px] p-1.5"
        >
          {children({ close: () => setOpen(false) })}
        </div>
      ) : null}
    </div>
  );
}

function OptionRow({ label, selected, indented = false, onSelect }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm transition-colors duration-150 ${
        indented ? "pl-7" : ""
      } ${
        selected
          ? "bg-accent-strong text-text-on-accent"
          : "text-text hover:bg-hairline/50"
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterBar({
  categories = [],
  activeCategory = "",
  activeSubcategory = "",
  activeSort = "newest",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const topLevel = categories.filter((category) => !category.parentSlug);
  const childrenOf = (parentSlug) =>
    categories.filter((category) => category.parentSlug === parentSlug);
  const labelForSlug = (slug) =>
    categories.find((category) => category.slug === slug)?.name ?? "";

  const normalizedSort =
    SORT_OPTIONS.find((option) => option.value === activeSort)?.value ??
    "newest";

  const pushParams = (mutate) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const selectAll = (close) => {
    pushParams((params) => {
      params.delete("category");
      params.delete("subcategory");
    });
    close?.();
  };

  const selectCategory = (slug, close) => {
    pushParams((params) => {
      params.set("category", slug);
      params.delete("subcategory");
    });
    close?.();
  };

  const selectSubcategory = (parentSlug, childSlug, close) => {
    pushParams((params) => {
      params.set("category", parentSlug);
      params.set("subcategory", childSlug);
    });
    close?.();
  };

  const selectSort = (value, close) => {
    pushParams((params) => {
      if (value === "newest") {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }
    });
    close?.();
  };

  const hasCategoryFilter = Boolean(activeCategory || activeSubcategory);
  const categoryTriggerLabel = activeSubcategory
    ? labelForSlug(activeSubcategory)
    : activeCategory
      ? labelForSlug(activeCategory)
      : "All Products";
  const sortTriggerLabel =
    SORT_OPTIONS.find((option) => option.value === normalizedSort)?.label ??
    "Newest";
  const isAllSelected = !activeCategory && !activeSubcategory;

  return (
    <div className="sticky top-20 z-10 flex flex-col gap-4 rounded-card border-b border-card-border bg-bg/70 px-4 py-4 backdrop-blur-lg md:top-24 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {hasCategoryFilter ? (
          <button
            type="button"
            onClick={() => selectAll()}
            className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-3 py-1.5 text-xs font-semibold text-text transition-colors duration-200 hover:bg-accent-strong hover:text-text-on-accent"
          >
            {categoryTriggerLabel}
            <X className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            <span className="sr-only">Clear category filter</span>
          </button>
        ) : null}

        {normalizedSort !== "newest" ? (
          <button
            type="button"
            onClick={() => selectSort("newest")}
            className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-3 py-1.5 text-xs font-semibold text-text transition-colors duration-200 hover:bg-accent-strong hover:text-text-on-accent"
          >
            {sortTriggerLabel}
            <X className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            <span className="sr-only">Reset sort</span>
          </button>
        ) : null}

        {!hasCategoryFilter && normalizedSort === "newest" ? (
          <span className="text-xs uppercase tracking-[2px] text-muted-text">
            All Products
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Dropdown triggerLabel={categoryTriggerLabel} ariaLabel="Filter by category">
          {({ close }) => (
            <>
              <OptionRow
                label="All Products"
                selected={isAllSelected}
                onSelect={() => selectAll(close)}
              />
              {topLevel.map((category) => {
                const children = childrenOf(category.slug);
                const categorySelected =
                  activeCategory === category.slug && !activeSubcategory;

                return (
                  <div key={category.slug}>
                    <OptionRow
                      label={category.name}
                      selected={categorySelected}
                      onSelect={() => selectCategory(category.slug, close)}
                    />
                    {children.map((child) => (
                      <OptionRow
                        key={child.slug}
                        label={child.name}
                        indented
                        selected={activeSubcategory === child.slug}
                        onSelect={() =>
                          selectSubcategory(category.slug, child.slug, close)
                        }
                      />
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </Dropdown>

        <Dropdown triggerLabel={sortTriggerLabel} ariaLabel="Sort products">
          {({ close }) => (
            <>
              {SORT_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  label={option.label}
                  selected={normalizedSort === option.value}
                  onSelect={() => selectSort(option.value, close)}
                />
              ))}
            </>
          )}
        </Dropdown>
      </div>
    </div>
  );
}
