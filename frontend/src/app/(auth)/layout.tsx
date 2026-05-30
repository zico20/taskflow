"use client";

import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Backdrop } from "@/components/backdrop";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <Backdrop />
      <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between">
        <Link
          href="/"
          className="glass-clear inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("common.home")}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <Link href="/" className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-subtle text-bg shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <LayoutGrid size={22} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">{t("common.appName")}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t("common.tagline")}</p>
        </Link>
        {children}
      </div>
    </div>
  );
}
