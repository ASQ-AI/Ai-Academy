import { redirect } from "next/navigation";
import Script from "next/script";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/academy";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const [{ data: { user } }, settings] = await Promise.all([
    supabase.auth.getUser(),
    getSettings(),
  ]);
  if (!user) redirect("/login");

  return (
    <>
      <div className="app">
        <aside className="sidebar" id="sidebar">
          <div className="brand">
            <span className="brand-mark">
              A<span>✦</span>
            </span>
            <div>
              <strong>{settings.siteName}</strong>
              <small>مساحة التعلم الذكية</small>
            </div>
          </div>
          <nav aria-label="التنقل الرئيسي">
            <button className="nav active" data-view="home">
              <span>⌂</span> {settings.navHome}
            </button>
            <button className="nav" data-view="tracks">
              <span>▦</span> {settings.navTracks}
            </button>
            <button className="nav" data-view="coach">
              <span>✧</span> {settings.navCoach}
            </button>
            <button className="nav" data-view="planner">
              <span>◈</span> {settings.navPlanner}
            </button>
            <button className="nav" data-view="assessment">
              <span>◎</span> {settings.navAssessment}
            </button>
            <button className="nav" data-view="progress">
              <span>◷</span> {settings.navProgress}
            </button>
            <button className="nav" data-view="admin" hidden>
              <span>⚙</span> {settings.navAdmin}
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
            <span className="top-title">{settings.siteName}</span>
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
