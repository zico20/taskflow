"use client";

import Link from "next/link";
import { LayoutGrid, Info } from "lucide-react";
import { DemoBoard } from "@/components/demo/demo-board";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/lib/i18n";

// Public, no-auth demo. Fully client-side — nothing is saved.
export default function DemoPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-bg">
              <LayoutGrid size={16} />
            </span>
            <span className="font-semibold">TaskFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-fg-muted hover:bg-bg-muted hover:text-fg"
            >
              {t("landing.nav.login")}
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-bg hover:bg-accent-hover"
            >
              {t("demo.signupToSave")}
            </Link>
          </div>
        </div>
      </header>

      {/* Trial banner */}
      <div className="border-b border-accent/30 bg-accent/10">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 text-sm">
          <Info size={16} className="shrink-0 text-accent" />
          <span className="text-fg-muted">{t("demo.banner")}</span>
          <Link
            href="/signup"
            className="ms-auto hidden shrink-0 text-accent hover:text-accent-hover sm:inline"
          >
            {t("demo.bannerCta")}
          </Link>
        </div>
      </div>

      {/* Board */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-5 w-1.5 rounded-full bg-accent" />
          <div>
            <h1 className="text-lg font-semibold">{t("demo.title")}</h1>
            <p className="text-xs text-fg-subtle">{t("demo.subtitle")}</p>
          </div>
        </div>
        {/* The board itself is LTR (the app's English UI). */}
        <div dir="ltr">
          <DemoBoard />
        </div>
      </main>
    </div>
  );
}
