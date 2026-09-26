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
