'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: (active) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/deposit',
    label: 'Deposit',
    icon: (active) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (active) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      >
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient fade effect at top */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />

      {/* Main nav container */}
      <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] px-4 pb-safe">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center py-3 px-6 group"
              >
                {/* Active indicator - gold accent line */}
                <span
                  className={`
                    absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full
                    transition-all duration-300 ease-out
                    ${isActive ? 'w-8 bg-[#D4AF37]' : 'w-0 bg-transparent'}
                  `}
                />

                {/* Icon container with glow effect */}
                <span
                  className={`
                    relative transition-all duration-300
                    ${isActive ? 'text-[#C41E3A]' : 'text-[#a1a1a1] group-hover:text-[#d4d4d4]'}
                  `}
                >
                  {item.icon(isActive)}

                  {/* Subtle glow behind active icon */}
                  {isActive && (
                    <span className="absolute inset-0 blur-lg bg-[#C41E3A]/30 -z-10" />
                  )}
                </span>

                {/* Label */}
                <span
                  className={`
                    mt-1 text-[9px] font-display font-medium tracking-[0.15em] uppercase
                    transition-all duration-300
                    ${isActive ? 'text-[#C41E3A]' : 'text-[#6a6a6a] group-hover:text-[#a1a1a1]'}
                  `}
                >
                  {item.label}
                </span>

                {/* Tap feedback ripple */}
                <span className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
