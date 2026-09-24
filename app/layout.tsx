import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أكاديمية AI | التعلم المؤسسي",
  description: "أكاديمية تفاعلية لإدارة المسارات التعليمية ومتابعة تقدم المتعلمين",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
