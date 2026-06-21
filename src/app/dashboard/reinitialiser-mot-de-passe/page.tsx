"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Nouveau mot de passe</h1>

      {done ? (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Mot de passe mis à jour, redirection…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </div>

          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Mettre à jour
          </button>
        </form>
      )}
    </main>
  );
}
