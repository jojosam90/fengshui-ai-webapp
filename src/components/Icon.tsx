const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9",
  bazi: "M4 4h16v16H4zM9 4v16M15 4v16M4 12h16",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2",
  master: "M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4-3 5v2H9v-2c-1.5-1-3-2.5-3-5a6 6 0 0 1 6-6zM9 20h6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6",
  back: "M15 5l-7 7 7 7",
  send: "M4 12 20 4l-6 16-3-7-7-1z",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5 13 13l-4.5 2.5L11 11z",
  yinyang: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  grid: "M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  chevron: "M9 5l7 7-7 7",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5.5M12 7.6v.4",
};

export default function Icon({ name, className = "h-6 w-6" }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
