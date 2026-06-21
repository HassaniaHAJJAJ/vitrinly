"use client";

import { useState } from "react";
import Link from "next/link";
import { formatOrderNumber } from "@/lib/order-number";

type Order = {
  id: string;
  order_number: number;
  buyer_firstname: string;
  buyer_name: string;
  total_price: number;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processed: "Traitée",
};

export function OrdersList({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");

  const filtered = orders.filter((order) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      formatOrderNumber(order.order_number, order.created_at).toLowerCase().includes(q) ||
      `${order.buyer_firstname} ${order.buyer_name}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par numéro de commande ou nom…"
        className="rounded border px-3 py-2 text-sm"
      />

      {filtered.length === 0 ? (
        <p className="text-gray-500">Aucune commande ne correspond à ta recherche.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((order) => (
            <li key={order.id}>
              <Link
                href={`/dashboard/commandes/${order.id}`}
                className="flex items-center justify-between gap-4 rounded border px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium">
                    {order.buyer_firstname} {order.buyer_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatOrderNumber(order.order_number, order.created_at)} ·{" "}
                    {new Date(order.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-4">
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                      order.status === "processed"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="whitespace-nowrap text-sm font-medium">
                    {order.total_price.toFixed(2)} €
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
