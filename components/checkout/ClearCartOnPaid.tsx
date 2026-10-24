"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Empties the cart once the confirmation page knows the order is paid. */
export function ClearCartOnPaid({ paid }: { paid: boolean }) {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (paid && ready) clear();
  }, [paid, ready, clear]);
  return null;
}
