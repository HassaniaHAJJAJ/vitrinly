"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutSeller } from "./login/actions";

export function DashboardNav({
  shopName,
  logoUrl,
  shopSlug,
}: {
  shopName: string;
  logoUrl?: string | null;
  shopSlug?: string | null;
}) {
  const pathname = usePathname();

  const isCommandes = pathname === "/dashboard";
  const isProduits = pathname.startsWith("/dashboard/produits");
  const isBoutique = pathname.startsWith("/dashboard/boutique");

  return (
    <div className="mb-6 border-b pb-4">
      <div className="mb-3 flex items-center gap-3">
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={shopName}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover"
          />
        )}
        <h1 className="text-xl font-semibold">{shopName}</h1>
        <div className="ml-auto flex items-center gap-3">
          {shopSlug && (
            <Link
              href={`/boutique/${shopSlug}`}
              target="_blank"
              className="text-sm text-gray-500 underline"
            >
              Voir ma boutique ↗
            </Link>
          )}
          <form action={logoutSeller}>
            <button type="submit" className="text-sm text-gray-400 underline">
              Déconnexion
            </button>
          </form>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/dashboard"
          className={`rounded px-3 py-1.5 text-sm ${
            isCommandes ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Commandes
        </Link>
        <Link
          href="/dashboard/produits"
          className={`rounded px-3 py-1.5 text-sm ${
            isProduits ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Mes produits
        </Link>
        <Link
          href="/dashboard/boutique"
          className={`rounded px-3 py-1.5 text-sm ${
            isBoutique ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Ma boutique
        </Link>
      </div>
    </div>
  );
}
