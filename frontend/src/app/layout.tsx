import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Providers } from "@/components/providers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  createT,
  dirFor,
  normalizeLocale,
} from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE)?.value);
  const t = createT(locale);
  return {
    title: `${t("common.appName")} — ${t("common.tagline")}`,
    description: t("landing.hero.subtitle"),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cookie is the source of truth for first paint; default = Arabic/RTL.
  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE)?.value) || DEFAULT_LOCALE;
  const dir = dirFor(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`dark ${inter.variable} ${arabic.variable}`}
    >
      <body className="font-sans">
        {/* Apply the saved theme before first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('taskflow-theme');var e=document.documentElement;if(t==='light'){e.classList.add('light');e.classList.remove('dark');}else{e.classList.add('dark');e.classList.remove('light');}}catch(_){}`,
          }}
        />
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
