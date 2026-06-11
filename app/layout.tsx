import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "JAADPOS | نظام نقاط بيع سحابي",
  description: "نظام SaaS Online POS للمطاعم والكافيهات في السعودية مع فواتير ضريبية أساسية وQR وتقارير VAT."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={ibmPlexSansArabic.variable}>{children}</body>
    </html>
  );
}
