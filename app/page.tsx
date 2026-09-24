import { redirect } from "next/navigation";
import Script from "next/script";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Temporary public access: while PUBLIC_MODE is "true" in Vercel's
  // environment variables, visitors without a session are let in as guests
  // instead of being redirected to /login. Set PUBLIC_MODE back to "false"
  // (or remove it) to require sign-in again.
  if (!user && process.env.PUBLIC_MODE !== "true") redirect("/login");

  return (
    <>
      <div className="app">
        <aside className="sidebar" id="sidebar">
          <div className="brand">
            <span className="brand-mark">
              A<span>✦</span>
            </span>
            <div>
              <strong>أكاديمية AI</strong>
              <small>مساحة التعلم الذكية</small>
            </div>
          </div>
          <nav aria-label="التنقل الرئيسي">
            <button className="nav active" data-view="home">
              <span>⌂</span> الرئيسية
            </button>
            <button className="nav" data-view="tracks">
              <span>▦</span> المسارات التعليمية
            </button>
            <button className="nav" data-view="coach">
              <span>✧</span> المدرب الشخصي
            </button>
            <button className="nav" data-view="progress">
              <span>◷</span> تقدمي وإنجازاتي
            </button>
            <button className="nav" data-view="admin" hidden>
              <span>⚙</span> إدارة الأكاديمية
            </button>
          </nav>
          <div className="side-bottom">
            <div className="daily">
              <span>✦ تحدي اليوم</span>
              <p>اكتب طلبًا واضحًا يتضمن الهدف والسياق وشكل النتيجة.</p>
              <button id="challengeBtn">جرّب التحدي ←</button>
            </div>
            <small>تجربة تعليمية تفاعلية · Opentech</small>
          </div>
        </aside>
        <div className="main-wrap">
          <header className="topbar">
            <button id="menuBtn" className="menu-btn" aria-label="فتح القائمة" aria-expanded="false">
              ☰
            </button>
            <span className="top-title">أكاديمية AI</span>
            <div className="top-actions">
              <span className="date" id="date"></span>
              <span className="account-name" id="accountName"></span>
              <span className="avatar" aria-label="ملف المتعلم">
                م
              </span>
              <button id="signOutBtn" className="textlink" type="button">
                تسجيل الخروج
              </button>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            <div className="card empty">جارٍ تحميل الأكاديمية…</div>
          </main>
        </div>
      </div>
      <div id="toast" role="status" aria-live="polite"></div>
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
