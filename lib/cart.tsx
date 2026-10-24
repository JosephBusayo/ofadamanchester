"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Cart state persisted in localStorage. Lines hold only slugs + quantities — prices are
// always recalculated from the menu (and on the server at checkout). The drawer UI is phase 4.
export type CartLine = {
  key: string;
  productSlug: string;
  qty: number;
  optionSlugs: Record<string, string>;
  extras: Record<string, number>;
};

type CartContextValue = {
  lines: CartLine[];
  /** false until the saved cart has been read from storage (avoids an "empty" flash). */
  ready: boolean;
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addLine: (line: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
};

const MAX_QTY = 20;

const STORAGE_KEY = "ofada-cart-v2";

const CartContext = createContext<CartContextValue | null>(null);

// Same product with the same options + extras merges into one line.
function lineKey(line: Omit<CartLine, "key" | "qty">) {
  const sorted = (o: Record<string, string | number>) =>
    Object.entries(o)
      .filter(([, v]) => v !== 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
  return `${line.productSlug}|${sorted(line.optionSlugs)}|${sorted(line.extras)}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once on mount
      if (saved) setLines(JSON.parse(saved));
    } catch {
      // Storage unavailable or corrupt — start with an empty cart.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage full or blocked — the cart still works for this visit.
    }
  }, [lines, hydrated]);

  const addLine = useCallback((line: Omit<CartLine, "key">) => {
    const key = lineKey(line);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + line.qty) } : l));
      }
      return [...prev, { ...line, key }];
    });
    setIsOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty < 1
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);

  const removeLine = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready: hydrated,
      count: lines.reduce((n, l) => n + l.qty, 0),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      addLine,
      setQty,
      removeLine,
      clear,
    }),
    [lines, hydrated, isOpen, addLine, setQty, removeLine, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
