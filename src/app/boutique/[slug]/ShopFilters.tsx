"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { PRICE_RANGES } from "./price-ranges";

export function ShopFilters({
  categories,
  accentColor,
  totalCount,
  filteredCount,
  activeCategory,
  activePrix,
}: {
  categories: string[];
  accentColor: string;
  totalCount: number;
  filteredCount: number;
  activeCategory: string;
  activePrix: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters = !!activeCategory || !!activePrix;

  return (
    <div className="mb-8">
      {/* Titre + compteur */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-40">Collection</p>
          <h2 className="text-2xl font-bold" style={{ color: accentColor }}>
            {activeCategory || "Tous nos articles"}
          </h2>
        </div>
        <span className="shrink-0 text-sm opacity-50">
          {filteredCount === totalCount
            ? `${totalCount} article${totalCount > 1 ? "s" : ""}`
            : `${filteredCount} / ${totalCount}`}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Filtre catégorie */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider opacity-40 w-20 shrink-0">Catégorie</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => update("categorie", cat)}
                    className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                    style={
                      active
                        ? { backgroundColor: accentColor, borderColor: accentColor, color: "#fff" }
                        : { borderColor: `${accentColor}44`, color: "inherit" }
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtre prix */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider opacity-40 w-20 shrink-0">Prix</span>
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((range) => {
              const active = range.value === activePrix;
              return (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => update("prix", range.value)}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                  style={
                    active
                      ? { backgroundColor: accentColor, borderColor: accentColor, color: "#fff" }
                      : { borderColor: `${accentColor}44`, color: "inherit" }
                  }
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Effacer les filtres */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="self-start text-xs underline opacity-40 hover:opacity-70 transition-opacity"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      <div className="mt-5 h-px opacity-10" style={{ backgroundColor: accentColor }} />
    </div>
  );
}
