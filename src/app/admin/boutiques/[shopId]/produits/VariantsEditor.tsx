"use client";

import { useState } from "react";

export type VariantRow = {
  key: string;
  size: string;
  color: string;
  stock: number;
};

export function VariantsEditor({ initial }: { initial?: VariantRow[] }) {
  const [rows, setRows] = useState<VariantRow[]>(
    initial && initial.length > 0
      ? initial
      : [{ key: crypto.randomUUID(), size: "", color: "", stock: 0 }]
  );

  function updateRow(key: string, field: keyof VariantRow, value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? { ...row, [field]: field === "stock" ? Number(value) || 0 : value }
          : row
      )
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { key: crypto.randomUUID(), size: "", color: "", stock: 0 }]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* En-têtes */}
      <div className="grid grid-cols-[1fr_1fr_1px_100px_auto] items-center gap-2">
        <span className="text-sm font-semibold">Taille</span>
        <span className="text-sm font-semibold">Couleur</span>
        <span />
        <span className="text-sm font-semibold">Stock</span>
        <span />
      </div>

      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-[1fr_1fr_1px_100px_auto] items-center gap-2">
          <input
            type="text"
            placeholder="ex : M"
            value={row.size}
            onChange={(e) => updateRow(row.key, "size", e.target.value)}
            name="sizes[]"

            className="rounded border px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="ex : Noir"
            value={row.color}
            onChange={(e) => updateRow(row.key, "color", e.target.value)}
            name="colors[]"

            className="rounded border px-2 py-1.5 text-sm"
          />
          {/* Séparateur vertical */}
          <div className="self-stretch bg-gray-200" />
          <input
            type="number"
            min={0}
            placeholder="0"
            value={row.stock}
            onChange={(e) => updateRow(row.key, "stock", e.target.value)}
            name="stocks[]"
            required
            className="rounded border px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-fit rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        + Ajouter une variante
      </button>
    </div>
  );
}
