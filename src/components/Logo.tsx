import { SITE } from "@/config/site";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="10" fill="#059669" />
      <path d="M11 12h16l-14 16h16" stroke="#fff" strokeWidth="4.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 12l3-3" stroke="#6ee0a3" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[19px] sm:text-[22px] font-extrabold tracking-tight">
        <span className="text-navy-900 dark:text-white">{SITE.nameParts[0]}</span>
        <span className="text-brand-600">{SITE.nameParts[1]}</span>
      </span>
    </span>
  );
}
