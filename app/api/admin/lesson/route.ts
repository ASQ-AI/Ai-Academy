import { identity, denied, forbidden, fail } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();
    if (!user.isAdmin) return forbidden();

    const v = (await req.json()) as Record<string, unknown>;
    const str = (x: unknown, max = 3000) =>
      typeof x === "string" ? x.trim().slice(0, max) : "";

    const title = str(v.title, 120);
    const lead = str(v.lead);
    const example = str(v.example);
    const question = str(v.question, 500);
    const points = Array.isArray(v.points)
      ? v.points.map((p) => str(p, 500)).filter(Boolean).slice(0, 8)
      : [];
    const options = Array.isArray(v.options)
      ? v.options.map((o) => str(o, 300)).filter(Boolean).slice(0, 5)
      : [];
    const answer = Number(v.answer);
    const minutes = Number(v.minutes);
    const courseId = typeof v.courseId === "string" ? v.courseId : "";

    if (
      !courseId ||
      !title ||
      !lead ||
      !question ||
      !example ||
      !points.length ||
      options.length < 2 ||
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer >= options.length ||
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > 120
    ) {
      return Response.json(
        { error: "أكمل بيانات الدرس والسؤال والإجابة الصحيحة." },
        { status: 400 },
      );
    }

    const db = createSupabaseServiceClient();
    const { data: course } = await db
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .maybeSingle();
    if (!course) return Response.json({ error: "المسار غير موجود" }, { status: 404 });

    const { data: maxRow } = await db
      .from("lessons")
      .select("position")
      .eq("course_id", courseId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = maxRow ? Number(maxRow.position) + 1 : 0;

    const id = crypto.randomUUID();
    const { error } = await db.from("lessons").insert({
      id,
      course_id: courseId,
      position: nextPos,
      title,
      minutes,
      lead,
      points,
      example,
      question,
      options,
      answer,
      reason: "",
    });
    if (error) throw error;

    return Response.json({ id }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
