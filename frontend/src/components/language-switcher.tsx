"use client";

import { Languages } from "lucide-react";
import { useLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Toggle between Arabic and English. Shows the name of the OTHER language so the
 * label is the action ("العربية" when in English, "English" when in Arabic).
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next: Locale = locale === "ar" ? "en" : "ar";
  const label = next === "ar" ? "العربية" : "English";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      title={label}
      aria-label={label}
      className={cn(
        "glass-clear inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg",
        className,
      )}
    >
      <Languages size={15} />
      <span>{label}</span>
    </button>
  );
}
