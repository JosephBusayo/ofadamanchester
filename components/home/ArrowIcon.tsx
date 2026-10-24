// Rounded arrow used on the outline pill buttons (same path as the Framer template).
export function ArrowIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none" aria-hidden>
      <path
        d="M19.55 10.31l-.75.75a1.27 1.27 0 0 0 0 1.81l4.84 4.87H8.26C7.56 17.74 7 18.24 7 18.94V20c0 .7.56 1.33 1.26 1.33H23.7l-4.9 4.86a1.24 1.24 0 0 0 0 1.75l.75.75c.49.49 1.29.49 1.78 0l8.3-8.3c.24-.24.37-.56.37-.9 0-.34-.13-.65-.37-.89l-8.3-8.3a1.26 1.26 0 0 0-1.78 0z"
        fill="currentColor"
      />
    </svg>
  );
}
