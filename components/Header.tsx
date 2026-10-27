"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNav, orderCta } from "@/content/site";
import { CartButton } from "./CartButton";
import { Logo } from "./Logo";

/** Header that reads the current path (for aria-current and closing the mobile menu). */
export function HeaderWithPathname() {
  return <Header pathname={usePathname()} />;
}

/**
 * The layout renders `<Header pathname="" />` as the Suspense fallback on routes whose
 * path is only known at request time (e.g. /order/[id]), so the shell still prerenders.
 */
export function Header({ pathname }: { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync menu with route changes
    setMenuOpen(false);
  }, [pathname]);

  // Lock page scroll and allow Escape while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="relative z-40 bg-bg">
      {/* Tablet + desktop: links | logo | cart + order */}
      <div className="hidden h-24 grid-cols-[1fr_auto_1fr] items-center gap-6 px-8 tablet:grid">
        <nav aria-label="Main" className="flex items-center gap-[30px]">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="text-base font-semibold leading-4 text-ink transition-opacity hover:opacity-60"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Logo className="h-[58px]" priority />

        <div className="flex items-center justify-end gap-3">
          <CartButton />
          <OrderButton />
        </div>
      </div>

      {/* Phone: logo | cart + menu */}
      <div className="flex h-24 items-center justify-between px-3.5 tablet:hidden">
        <Logo className="h-11" priority />
        <div className="flex items-center gap-2">
          <CartButton />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex size-12 items-center justify-center"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
    </header>
  );
}

function OrderButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href={orderCta.href}
      className={`inline-flex items-center justify-center gap-3 rounded-full bg-primary px-[22px] py-[14px] text-base font-semibold leading-4 text-on-primary transition-colors hover:bg-primary-light ${className}`}
    >
      <span>{orderCta.label}</span>
      <b aria-hidden className="font-black">
        →
      </b>
    </Link>
  );
}

function MobileMenu({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  return (
    <div className="tablet:hidden" aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[9998] bg-black/35 transition-opacity duration-200 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        id="mobile-menu"
        aria-label="Menu"
        inert={!open}
        className={`fixed inset-0 z-[9999] flex flex-col bg-bg px-[22px] pb-8 pt-4 transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between">
          <Logo className="h-11" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex size-12 items-center justify-center"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 4l16 16M20 4L4 20" stroke="var(--primary)" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav aria-label="Mobile" className="mt-8 flex flex-col">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="block border-b border-ink/10 py-3 font-wordmark text-[40px] leading-[44px] tracking-[-1.2px] text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <OrderButton className="h-[54px] w-full text-lg leading-[18px]" />
        </div>
      </aside>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6h18M3 12h18M3 18h18" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
