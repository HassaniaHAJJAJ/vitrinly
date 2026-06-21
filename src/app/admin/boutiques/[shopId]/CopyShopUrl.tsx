"use client";

import { useState } from "react";

export function CopyShopUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">Lien de la boutique</label>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="flex-1 rounded border bg-gray-50 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="whitespace-nowrap rounded border px-3 py-2 text-sm hover:bg-gray-50"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
    </div>
  );
}
