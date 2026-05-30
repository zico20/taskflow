"use client";

import Link from "next/link";
import { LayoutGrid, Info } from "lucide-react";
import { DemoBoard } from "@/components/demo/demo-board";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Backdrop } from "@/components/backdrop";
import { useT } from "@/lib/i18n";

// Public, no-auth demo. Fully client-side — nothing is saved.
export default function DemoPage() {
  const t = useT();
  return (
    <div className="relative min-h-screen bg-bg text-fg">
      <Backdrop />
      {/* Top bar */}
      <header className="glass-bar sticky top-0 z-30 border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-subtle text-bg shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              <LayoutGrid size={16} />
            </span>
            <span className="font-semibold">TaskFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-fg-muted hover:bg-bg-muted hover:text-fg"
            >
              {t("landing.nav.login")}
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-gradient-to-b from-accent-hover to-accent text-bg shadow-[0_4px_14px_-4px_rgb(var(--accent)/0.5),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-[1.07] px-4 py-1.5 text-sm font-semibold transition"
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
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6">
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
