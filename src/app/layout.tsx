import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import CreateProjectModal from "@/components/CreateProjectModal";
import { I18nProvider, type SessionUser } from "@/i18n/I18nProvider";
import { getLang } from "@/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { SITE } from "@/config/site";

// Noto Sans: cyrillic-ext covers Tajik letters ғ ӣ қ ӯ ҳ ҷ
const noto = Noto_Sans({ subsets: ["latin", "cyrillic", "cyrillic-ext"], weight: ["400", "500", "600", "700", "800"], variable: "--font-noto", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${SITE.name} — Платформаи фриланс барои Тоҷикистон`, template: `%s | ${SITE.name}` },
  description: `${SITE.name} — бозори фриланс барои мизоҷон ва мутахассисон дар Тоҷикистон.`,
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#059669" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const u = await getCurrentUser();
  const user: SessionUser = u ? { id: u.id, name: u.name, role: u.role as "CLIENT" | "FREELANCER", avatarUrl: u.avatarUrl } : null;
  return (
    <html lang={lang === "tj" ? "tg" : lang} className={noto.variable} suppressHydrationWarning>
      <body className="font-sans">
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('cf-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();` }} />
        <I18nProvider lang={lang} user={user}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:shadow">Skip to content</a>
          <Header />
          <main id="main" className="page-shell min-h-[calc(100vh-10rem)] animate-fade-in">{children}</main>
          <Footer />
          <BottomNavigation />
          <CreateProjectModal />
        </I18nProvider>
      </body>
    </html>
  );
}
