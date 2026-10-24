"use client";

import { useState } from "react";
import { footer } from "@/content/site";

export function NewsletterForm() {
  const [message, setMessage] = useState("");

  return (
    <>
      <form
        aria-label="Newsletter signup"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(footer.newsletter.pendingMessage);
        }}
        className="mt-6 flex h-[54px] w-full max-w-[320px] items-center rounded-full border border-ink pl-[22px] pr-1.5 tablet:h-[60px] tablet:max-w-none"
      >
        <input
          type="email"
          required
          aria-label="Your email"
          placeholder={footer.newsletter.placeholder}
          className="min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink tablet:text-xl"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-light tablet:size-12"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      <div className="mt-3 min-h-5 text-base" role="status">
        {message}
      </div>
    </>
  );
}
