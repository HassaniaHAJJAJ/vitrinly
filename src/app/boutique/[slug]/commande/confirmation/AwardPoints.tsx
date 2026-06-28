"use client";

import { useEffect } from "react";
import { awardOrderPoints } from "./award-points-action";

export function AwardPoints({ orderId, shopId, shopSlug }: { orderId: string; shopId: string; shopSlug: string }) {
  useEffect(() => {
    awardOrderPoints(orderId, shopId, shopSlug);
  }, [orderId, shopId, shopSlug]);
  return null;
}
