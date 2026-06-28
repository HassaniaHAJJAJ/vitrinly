"use client";

import { useState } from "react";
import { submitReview } from "./actions";

export function ReviewForm({
  reviewId,
  buyerName,
  accentColor,
}: {
  reviewId: string;
  buyerName: string;
  accentColor: string;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(buyerName);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Merci de sélectionner une note."); return; }
    setLoading(true);
    setError(null);
    const res = await submitReview({ reviewId, rating, comment: comment.trim(), buyerName: name.trim() });
    setLoading(false);
    if (res?.error) { setError(res.error); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="text-lg font-semibold mb-1">Merci pour ton avis !</h2>
        <p className="text-sm opacity-60">Il sera publié après validation de la boutique.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Ton prénom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Ta note</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            >
              <span style={{ color: star <= (hovered || rating) ? "#FBBF24" : "#D1D5DB" }}>★</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Ton commentaire <span className="opacity-40 font-normal">(optionnel)</span></label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Dis-nous ce que tu as pensé du produit..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        {loading ? "Envoi…" : "Envoyer mon avis"}
      </button>
    </form>
  );
}
