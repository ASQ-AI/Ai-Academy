import type { Metadata } from "next";
import { getSettings } from "@/lib/academy";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `${settings.siteName} | التعلم المؤسسي`,
    description: "أكاديمية تفاعلية لإدارة المسارات التعليمية ومتابعة تقدم المتعلمين",
    icons: { icon: "/favicon.svg" },
  };
}

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
