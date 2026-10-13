import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CodeFreelance — Платформаи фриланс барои Тоҷикистон",
    template: "%s | CodeFreelance",
  },
  description:
    "CodeFreelance — бозори фриланс барои мизоҷон ва мутахассисон дар Тоҷикистон.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tg" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cf-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
        <Header />
        <main className="page-shell min-h-[calc(100vh-10rem)] animate-fade-in">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
