"use client";

export function OpenStripeDashboardButton({ shopId }: { shopId: string }) {
  async function handleClick() {
    const res = await fetch("/api/admin/stripe-dashboard-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId }),
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button type="button" onClick={handleClick} className="text-sm underline">
      Tableau de bord Stripe →
    </button>
  );
}
