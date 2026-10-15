export const ICON_PATHS = {
  clock: "M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
  user: "M16 19v-1a4 4 0 00-8 0v1m4-8a3 3 0 100-6 3 3 0 000 6z",
  shield: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z",
  check: "M5 13l4 4L19 7",
  phone: "M3 5a2 2 0 012-2h2l2 5-2 1a12 12 0 006 6l1-2 5 2v2a2 2 0 01-2 2A16 16 0 013 5z",
  pin: "M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11zm0-8a3 3 0 100-6 3 3 0 000 6z",
  calendar:
    "M8 3v4M16 3v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  arrow: "M5 12h14m-6-6l6 6-6 6",
  mail: "M3 7l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35",
  chat: "M4 5h16v11H8l-4 3V5z",
  trash: "M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13h8l1-13",
  card: "M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 3h18",
  heart: "M12 20s-7-4.35-7-9.5A4.5 4.5 0 0112 7.2a4.5 4.5 0 017 3.3C19 15.65 12 20 12 20z",
  star: "M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8L6.7 19l1-5.9L3.5 9.2l5.9-.9L12 3z",
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d={ICON_PATHS[name]}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
