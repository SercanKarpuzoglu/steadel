import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  /** URL segment used to resolve the active item + breadcrumb label. */
  seg: string;
  label: string;
  icon: ReactNode;
};

const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operate",
    items: [
      {
        href: "/admin",
        seg: "overview",
        label: "Overview",
        icon: (
          <svg viewBox="0 0 24 24" {...s}>
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
        ),
      },
      {
        href: "/admin/customers",
        seg: "customers",
        label: "Customers",
        icon: (
          <svg viewBox="0 0 24 24" {...s}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        href: "/admin/billing",
        seg: "billing",
        label: "Billing & Revenue",
        icon: (
          <svg viewBox="0 0 24 24" {...s}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Monitor",
    items: [
      {
        href: "/admin/live",
        seg: "live",
        label: "Live activity",
        icon: (
          <svg viewBox="0 0 24 24" {...s}>
            <path d="M3 12h4l3 8 4-16 3 8h4" />
          </svg>
        ),
      },
      {
        href: "/admin/reports",
        seg: "reports",
        label: "Reports",
        icon: (
          <svg viewBox="0 0 24 24" {...s}>
            <path d="M3 3v18h18" />
            <path d="M7 14l4-4 3 3 5-6" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/admin/operations",
        seg: "operations",
        label: "Operations",
        icon: (
          <svg viewBox="0 0 24 24" {...s}>
            <path d="M12 2v3m0 14v3m10-10h-3M5 12H2m15.07-7.07l-2.12 2.12M6.34 17.66l-2.12 2.12m14.85 0l-2.12-2.12M6.34 6.34L4.22 4.22" />
            <circle cx="12" cy="12" r="3.2" />
          </svg>
        ),
      },
      {
        href: "/admin/audit",
        seg: "audit",
        label: "Audit log",
        icon: (
          <svg viewBox="0 0 24 24" {...s}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M9 13h6M9 17h6" />
          </svg>
        ),
      },
      {
        href: "/admin/access",
        seg: "access",
        label: "Access",
        icon: (
          <svg viewBox="0 0 24 24" {...s}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ),
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
