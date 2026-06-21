import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>

      {sent ? (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Si un compte existe avec cet email, un lien de réinitialisation vient d&apos;être envoyé.
        </p>
      ) : (
        <form action={requestPasswordReset} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded border px-3 py-2"
            />
          </div>

          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Envoyer le lien de réinitialisation
          </button>
        </form>
      )}
    </main>
  );
}
