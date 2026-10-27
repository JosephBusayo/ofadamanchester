"use client";

import { useSyncExternalStore } from "react";
import { useCart } from "@/lib/cart";

const noopSubscribe = () => () => {};

export function CartButton({ className = "" }: { className?: string }) {
  const cart = useCart();
  // The header hydrates inside a Suspense boundary, possibly after the cart has loaded from
  // storage. Render the server's empty state during hydration so the HTML matches.
  const hydrating = useSyncExternalStore(noopSubscribe, () => false, () => true);
  const count = hydrating ? 0 : cart.count;
  const { open } = cart;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={count ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
      className={`relative flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink text-ink transition-colors hover:bg-ink hover:text-on-primary ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-none text-on-primary">
          {count}
        </span>
      )}
    </button>
  );
}
