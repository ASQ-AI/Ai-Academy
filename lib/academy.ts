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

  if (!user || !user.email) {
    // Temporary public access: while PUBLIC_MODE is "true", anyone visiting
    // without a session is treated as a read-only guest instead of being
    // blocked. Set PUBLIC_MODE back to "false" (or remove it) in Vercel to
    // require real sign-in again — no code changes needed.
    if (process.env.PUBLIC_MODE === "true") {
      return {
        userId: "00000000-0000-0000-0000-000000000000",
        email: "guest@ai-academy.local",
        displayName: "زائر",
        isAdmin: false,
      };
    }
    return null;
  }

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

/** Keep the people table in sync with who just signed in, without touching joined_at again. */
export async function upsertPerson(userId: string, email: string, name: string) {
  const db = createSupabaseServiceClient();
  const { data: existing } = await db
    .from("people")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    await db.from("people").update({ email, name }).eq("id", userId);
  } else {
    await db.from("people").insert({ id: userId, email, name });
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
      })),
    };
  });
}
