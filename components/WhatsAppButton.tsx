import { site, whatsappButton } from "@/content/site";

/** Floating "chat on WhatsApp" button, bottom-right on every shop page. */
export function WhatsAppButton() {
  const href = `${site.whatsapp.href}?text=${encodeURIComponent(whatsappButton.message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={whatsappButton.label}
      title={whatsappButton.label}
      className="fixed bottom-4 right-4 z-50 flex size-14 items-center justify-center rounded-full border-2 border-on-primary bg-primary text-on-primary shadow-[0_4px_0_var(--ink)] transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none tablet:bottom-6 tablet:right-6 tablet:size-16"
    >
      <svg viewBox="0 0 24 24" className="size-7 tablet:size-8" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.31l-.35-.2-3.57.93.96-3.48-.23-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.45-9.43a9.43 9.43 0 0 1 9.44 9.44c0 5.2-4.24 9.43-9.45 9.43Zm8.04-17.47A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.6 23.3l5.7-1.5a11.33 11.33 0 0 0 5.74 1.47h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.9-3.33-8.05Z" />
      </svg>
    </a>
  );
}
