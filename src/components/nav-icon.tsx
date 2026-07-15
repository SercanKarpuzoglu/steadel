import {
  BarChart3,
  Bell,
  CircleHelp,
  LayoutDashboard,
  Mail,
  Megaphone,
  PackageX,
  Settings,
  ShieldCheck,
  Store,
  TriangleAlert,
  Zap,
} from "lucide-react";

/* Icon size tokens (ui-ux-pro-max: consistent sizing, no emoji as UI): */
export const ICON_SM = "h-4 w-4";
export const ICON_MD = "h-5 w-5";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  stores: Store,
  automations: Zap,
  reports: BarChart3,
  settings: Settings,
  help: CircleHelp,
  admin: ShieldCheck,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = NAV_ICONS[name];
  return <Icon className={className ?? ICON_SM} aria-hidden="true" />;
}

/** Alert-feed icon by alert type. */
export function AlertTypeIcon({ type }: { type: string }) {
  const Icon = type.includes("out_of_stock")
    ? PackageX
    : type.includes("low_stock")
      ? TriangleAlert
      : type.includes("ads")
        ? Megaphone
        : type.includes("report")
          ? Mail
          : Bell;
  return <Icon className={`${ICON_SM} shrink-0 text-ink-soft`} aria-hidden="true" />;
}
