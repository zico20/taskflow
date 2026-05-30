"use client";

import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-fg-subtle transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("common.home")}
        </Link>
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm animate-fade-in">
        <Link href="/" className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-bg">
            <LayoutGrid size={22} />
          </div>
          <h1 className="text-xl font-semibold text-fg">{t("common.appName")}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t("common.tagline")}</p>
        </Link>
        {children}
      </div>
    </div>
  );
}
