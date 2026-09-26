import { identity, denied, fail } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  ASSESSMENT_QUESTIONS,
  LEVEL_TRACK_PREFERENCE,
  levelForScore,
  publicQuestions,
} from "@/lib/assessment";

export const dynamic = "force-dynamic";

type PersonAssessmentRow = {
  level: string | null;
  level_score: number | null;
  assessed_at: string | null;
};

export async function GET() {
  try {
    const user = await identity();
    if (!user) return denied();

    const db = createSupabaseServiceClient();
    const { data } = await db
      .from("people")
      .select("level, level_score, assessed_at")
      .eq("id", user.userId)
      .maybeSingle();
    const row = (data as PersonAssessmentRow | null) || null;

    return Response.json({
      questions: publicQuestions(),
      result: row?.level
        ? {
            level: row.level,
            score: row.level_score,
            assessedAt: row.assessed_at,
            trackPreference: LEVEL_TRACK_PREFERENCE[row.level as keyof typeof LEVEL_TRACK_PREFERENCE] || [],
          }
        : null,
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();

    const body = (await req.json()) as { answers?: unknown };
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length !== ASSESSMENT_QUESTIONS.length) {
      return Response.json(
        { error: `يلزم الإجابة على كل الأسئلة العشرة (${ASSESSMENT_QUESTIONS.length}).` },
        { status: 400 },
      );
    }

    let score = 0;
    ASSESSMENT_QUESTIONS.forEach((q, i) => {
      if (Number(answers[i]) === q.answer) score += 1;
    });
    const level = levelForScore(score);

    const db = createSupabaseServiceClient();
    await db
      .from("people")
      .update({ level, level_score: score, assessed_at: new Date().toISOString() })
      .eq("id", user.userId);

    return Response.json({
      score,
      level,
      trackPreference: LEVEL_TRACK_PREFERENCE[level],
    });
  } catch (e) {
    return fail(e);
  }
}
