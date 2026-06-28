"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

type ImageItem = { id: string; url: string };

export function DeleteImagesField({
  images: initial,
  deleteAction,
}: {
  images: ImageItem[];
  deleteAction: (imageId: string) => Promise<void>;
}) {
  const [images, setImages] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  if (images.length === 0) return null;

  function handleDelete(id: string) {
    setDeleting(id);
    startTransition(async () => {
      await deleteAction(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      setDeleting(null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-base font-semibold">Photos actuelles</p>
      <div className="flex flex-wrap gap-3">
        {images.map((image) => (
          <div key={image.id} className="group relative h-20 w-20 overflow-hidden rounded border bg-black/5">
            <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              disabled={pending}
              onClick={() => handleDelete(image.id)}
              className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
              title="Supprimer cette photo"
            >
              {deleting === image.id ? (
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
