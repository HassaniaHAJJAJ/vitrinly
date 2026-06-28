"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const MAX_PHOTOS = 10;
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
          // Ne compresser que si ça réduit vraiment la taille
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function PhotosField({ label = "Photos (max. 10)" }: { label?: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files ?? []);
    e.target.value = "";

    const merged = [...files];
    const toAdd = added.filter(
      (f) => !merged.find((x) => x.name === f.name && x.size === f.size)
    );

    if (merged.length + toAdd.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos. Retire des photos avant d'en ajouter.`);
      return;
    }

    setError(null);
    setCompressing(true);
    const compressed = await Promise.all(toAdd.map(compressImage));
    setFiles([...merged, ...compressed]);
    setCompressing(false);
  }

  function remove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-base font-semibold">{label}</p>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded border bg-black/5">
              <Image
                src={URL.createObjectURL(file)}
                alt={file.name}
                fill
                sizes="80px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
                title="Retirer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length < MAX_PHOTOS && (
        <label className={`flex cursor-pointer items-center gap-2 rounded border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 ${compressing ? "pointer-events-none opacity-60" : ""}`}>
          {compressing ? (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
          {compressing
            ? "Optimisation en cours…"
            : files.length === 0
            ? "Choisir des photos"
            : `Ajouter d'autres photos (${files.length}/${MAX_PHOTOS})`}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleChange}
            disabled={compressing}
          />
        </label>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {files.map((file, i) => (
        <FileInput key={i} file={file} />
      ))}
    </div>
  );
}

function FileInput({ file }: { file: File }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    ref.current.files = dt.files;
  }, [file]);

  return <input ref={ref} type="file" name="photos" className="hidden" />;
}
