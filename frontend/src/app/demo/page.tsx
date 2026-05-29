"use client";

import Link from "next/link";
import { LayoutGrid, Info } from "lucide-react";
import { DemoBoard } from "@/components/demo/demo-board";

// Public, no-auth demo. Fully client-side — nothing is saved.
export default function DemoPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-bg text-fg">
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
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-fg-muted hover:bg-bg-muted hover:text-fg"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-bg hover:bg-accent-hover"
            >
              سجّل لحفظ شغلك
            </Link>
          </div>
        </div>
      </header>

      {/* Trial banner */}
      <div className="border-b border-accent/30 bg-accent/10">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 text-sm">
          <Info size={16} className="shrink-0 text-accent" />
          <span className="text-fg-muted">
            أنت في الوضع التجريبي — جرّب السحب والإفلات وأضف مهام بحرية. التغييرات{" "}
            <span className="font-medium text-fg">لا تُحفظ</span> بعد إغلاق الصفحة.
          </span>
          <Link
            href="/signup"
            className="ms-auto hidden shrink-0 text-accent hover:text-accent-hover sm:inline"
          >
            أنشئ حساباً لتحفظ لوحاتك ←
          </Link>
        </div>
      </div>

      {/* Board */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-5 w-1.5 rounded-full bg-accent" />
          <div>
            <h1 className="text-lg font-semibold">لوحة تجريبية</h1>
            <p className="text-xs text-fg-subtle">
              اسحب المهام بين الأعمدة، أو أضف مهمة جديدة.
            </p>
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
