import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="theme-dark flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo on="dark" />
      </Link>
      <div className="w-full max-w-md rounded-lg bg-panel p-8 shadow-xl">
        {children}
      </div>
      <p className="mt-8 max-w-md text-center text-xs text-mist/70">
        EU-hosted in Germany · GDPR-first · No tracking cookies
      </p>
    </div>
  );
}
