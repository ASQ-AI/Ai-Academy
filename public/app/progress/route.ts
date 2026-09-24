import { identity, denied, fail } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();

    const { lessonId, answerIndex } = (await req.json()) as {
      lessonId?: string;
      answerIndex?: number;
    };
    if (typeof lessonId !== "string" || !Number.isInteger(answerIndex)) {
      return Response.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    const db = createSupabaseServiceClient();
    const { data: lesson } = await db
      .from("lessons")
      .select("answer, courses(published)")
      .eq("id", lessonId)
      .maybeSingle();

    const courseInfo = (lesson as unknown as { courses: { published: boolean } | null }) || null;
    const published = courseInfo?.courses?.published;
    if (!lesson || (!published && !user.isAdmin)) {
      return Response.json({ error: "الدرس غير متاح" }, { status: 404 });
    }

    if (answerIndex !== lesson.answer) {
      return Response.json({ correct: false });
    }

    await db
      .from("progress")
      .upsert(
        { user_id: user.userId, lesson_id: lessonId },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      );

    return Response.json({ correct: true });
  } catch (e) {
    return fail(e);
  }
}
