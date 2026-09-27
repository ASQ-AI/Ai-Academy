import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseServiceClient } from "./supabase/service";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "asq-ai@opentech.ae")
  .trim()
  .toLowerCase();

export type Identity = {
  userId: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
};

/** Who is making this request, based on the Supabase auth session cookie. */
export async function identity(): Promise<Identity | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const email = user.email.trim().toLowerCase();
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    email;

  return {
    userId: user.id,
    email,
    displayName,
    isAdmin: email === ADMIN_EMAIL,
  };
}

export function denied() {
  return Response.json(
    { error: "يلزم تسجيل الدخول للوصول إلى الأكاديمية." },
    { status: 401 },
  );
}

export function forbidden() {
  return Response.json(
    { error: "هذه العملية مخصصة لإدارة الأكاديمية." },
    { status: 403 },
  );
}

export function fail(e: unknown) {
  console.error("Academy request failed", e);
  return Response.json(
    { error: "تعذر إكمال الطلب الآن. حاول مرة أخرى." },
    { status: 500 },
  );
}

/**
 * Keep the people table in sync with who just signed in, without touching
 * joined_at again. A single upsert (one round trip instead of a select then
 * an update/insert) — on conflict it only overwrites email/name, so an
 * existing row's joined_at (and level/level_score/assessed_at) are left as-is,
 * and a brand-new row still gets its joined_at default.
 */
export async function upsertPerson(userId: string, email: string, name: string) {
  const db = createSupabaseServiceClient();
  await db.from("people").upsert({ id: userId, email, name }, { onConflict: "id" });
}

export type PlatformSettings = {
  siteName: string;
  navHome: string;
  navTracks: string;
  navCoach: string;
  navPlanner: string;
  navAssessment: string;
  navProgress: string;
  navTemplates: string;
  navSimulation: string;
  navAdmin: string;
};

const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: "أكاديمية AI",
  navHome: "الرئيسية",
  navTracks: "المسارات التعليمية",
  navCoach: "المدرب الشخصي",
  navPlanner: "مخطط الوكلاء",
  navAssessment: "تقييم تحديد المستوى",
  navProgress: "تقدمي وإنجازاتي",
  navTemplates: "مكتبة القوالب",
  navSimulation: "مختبر المحاكاة",
  navAdmin: "إدارة الأكاديمية",
};

type SettingsRow = {
  site_name: string | null;
  nav_home: string | null;
  nav_tracks: string | null;
  nav_coach: string | null;
  nav_planner: string | null;
  nav_assessment: string | null;
  nav_progress: string | null;
  nav_templates: string | null;
  nav_simulation: string | null;
  nav_admin: string | null;
};

/**
 * The platform's display name and sidebar menu labels, editable from Academy
 * Management. Falls back to the original defaults if the settings table
 * hasn't been created yet (migration not applied) or has no row yet, so
 * nothing breaks before that SQL is run.
 */
export async function getSettings(): Promise<PlatformSettings> {
  try {
    const db = createSupabaseServiceClient();
    const { data } = await db
      .from("settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle();
    const row = data as SettingsRow | null;
    if (!row) return DEFAULT_SETTINGS;
    return {
      siteName: row.site_name || DEFAULT_SETTINGS.siteName,
      navHome: row.nav_home || DEFAULT_SETTINGS.navHome,
      navTracks: row.nav_tracks || DEFAULT_SETTINGS.navTracks,
      navCoach: row.nav_coach || DEFAULT_SETTINGS.navCoach,
      navPlanner: row.nav_planner || DEFAULT_SETTINGS.navPlanner,
      navAssessment: row.nav_assessment || DEFAULT_SETTINGS.navAssessment,
      navProgress: row.nav_progress || DEFAULT_SETTINGS.navProgress,
      navTemplates: row.nav_templates || DEFAULT_SETTINGS.navTemplates,
      navSimulation: row.nav_simulation || DEFAULT_SETTINGS.navSimulation,
      navAdmin: row.nav_admin || DEFAULT_SETTINGS.navAdmin,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Trim to a safe length and fall back to the default when left blank. */
function cleanLabel(value: unknown, fallback: string, max = 60): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return fallback;
  return s.slice(0, max);
}

export async function updateSettings(input: Record<string, unknown>): Promise<PlatformSettings> {
  const next: PlatformSettings = {
    siteName: cleanLabel(input.siteName, DEFAULT_SETTINGS.siteName, 60),
    navHome: cleanLabel(input.navHome, DEFAULT_SETTINGS.navHome, 40),
    navTracks: cleanLabel(input.navTracks, DEFAULT_SETTINGS.navTracks, 40),
    navCoach: cleanLabel(input.navCoach, DEFAULT_SETTINGS.navCoach, 40),
    navPlanner: cleanLabel(input.navPlanner, DEFAULT_SETTINGS.navPlanner, 40),
    navAssessment: cleanLabel(input.navAssessment, DEFAULT_SETTINGS.navAssessment, 40),
    navProgress: cleanLabel(input.navProgress, DEFAULT_SETTINGS.navProgress, 40),
    navTemplates: cleanLabel(input.navTemplates, DEFAULT_SETTINGS.navTemplates, 40),
    navSimulation: cleanLabel(input.navSimulation, DEFAULT_SETTINGS.navSimulation, 40),
    navAdmin: cleanLabel(input.navAdmin, DEFAULT_SETTINGS.navAdmin, 40),
  };
  const db = createSupabaseServiceClient();
  await db.from("settings").upsert(
    {
      id: "main",
      site_name: next.siteName,
      nav_home: next.navHome,
      nav_tracks: next.navTracks,
      nav_coach: next.navCoach,
      nav_planner: next.navPlanner,
      nav_assessment: next.navAssessment,
      nav_progress: next.navProgress,
      nav_templates: next.navTemplates,
      nav_simulation: next.navSimulation,
      nav_admin: next.navAdmin,
    },
    { onConflict: "id" },
  );
  return next;
}

export type TemplateItem = {
  id: string;
  category: string;
  title: string;
  body: string;
};

type TemplateRow = {
  id: string;
  category: string;
  title: string;
  body: string;
  created_at: string;
};

/**
 * The work-templates library, managed entirely by the admin and visible to
 * every signed-in employee. Falls back to an empty list if the table hasn't
 * been created yet, so bootstrap never breaks before that SQL is run.
 */
export async function templatesFor(): Promise<TemplateItem[]> {
  try {
    const db = createSupabaseServiceClient();
    const { data } = await db
      .from("templates")
      .select("*")
      .order("category", { ascending: true })
      .order("created_at", { ascending: true });
    return ((data as TemplateRow[]) || []).map((t) => ({
      id: t.id,
      category: t.category,
      title: t.title,
      body: t.body,
    }));
  } catch {
    return [];
  }
}

type LessonRow = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  minutes: number;
  lead: string;
  points: string[];
  example: string;
  question: string;
  options: string[];
  answer: number;
  reason: string | null;
  diagram: string | null;
};

type CourseRow = {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  published: boolean;
  created_at: string;
};

export async function coursesFor(admin: boolean) {
  const db = createSupabaseServiceClient();
  const [{ data: courseRows }, { data: lessonRows }] = await Promise.all([
    db.from("courses").select("*").order("created_at", { ascending: true }),
    db.from("lessons").select("*").order("position", { ascending: true }),
  ]);

  const courses = ((courseRows as CourseRow[]) || []).filter(
    (c) => admin || c.published,
  );
  const lessons = (lessonRows as LessonRow[]) || [];

  return courses.map((c) => {
    const courseLessons = lessons.filter((l) => l.course_id === c.id);
    const duration = courseLessons.reduce((n, l) => n + Number(l.minutes), 0);
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      icon: c.icon,
      level: c.level,
      published: c.published,
      duration: `${duration} دقيقة`,
      lessons: courseLessons.map((l) => ({
        id: l.id,
        title: l.title,
        minutes: l.minutes,
        lead: l.lead,
        points: l.points,
        example: l.example,
        question: l.question,
        options: l.options,
        answer: l.answer,
        reason: l.reason || "",
        diagram: l.diagram || "",
      })),
    };
  });
}
