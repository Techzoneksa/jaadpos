import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JAADPOS | نظام نقاط بيع سحابي",
  description: "نظام SaaS Online POS للمطاعم والكافيهات في السعودية مع فواتير ضريبية أساسية وQR وتقارير VAT."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
