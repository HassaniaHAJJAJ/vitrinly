"use client";

import { useState } from "react";

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function BannerUpload({
  headerImageUrl,
  headerColor,
}: {
  headerImageUrl?: string | null;
  headerColor?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      setError(`Image trop lourde (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum autorisé : ${MAX_SIZE_MB} Mo.`);
      e.target.value = "";
      setPreview(null);
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
  }

  const displayUrl = preview ?? headerImageUrl;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div
          className="h-20 w-full rounded-lg"
          style={
            displayUrl
              ? { backgroundImage: `url(${displayUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { backgroundColor: headerColor ?? "#f3f4f6" }
          }
        />
        {displayUrl ? (
          <label
            htmlFor="header_image"
            className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-white p-1.5 shadow hover:bg-gray-100"
            title="Changer l'image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </label>
        ) : (
          <label
            htmlFor="header_image"
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-gray-500 hover:bg-black/5"
          >
            Charger une image
          </label>
        )}
        <input
          id="header_image"
          name="header_image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
