import { identity, denied, fail, coursesFor, upsertPerson } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await identity();
    if (!user) return denied();

    const db = createSupabaseServiceClient();
    // Run the sign-in bookkeeping write in parallel with the reads below
    // instead of waiting for it first — it doesn't touch level/level_score,
    // so no read here depends on it having landed yet.
    const [, { data: progressRows }, { data: personRow }, tracks] = await Promise.all([
      upsertPerson(user.userId, user.email, user.displayName),
      db.from("progress").select("lesson_id").eq("user_id", user.userId),
      db.from("people").select("level, level_score, assessed_at").eq("id", user.userId).maybeSingle(),
      coursesFor(user.isAdmin),
    ]);

    const result: Record<string, unknown> = {
      user: {
        name: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin,
        level: (personRow as { level: string | null } | null)?.level || null,
        levelScore: (personRow as { level_score: number | null } | null)?.level_score ?? null,
        assessedAt: (personRow as { assessed_at: string | null } | null)?.assessed_at || null,
      },
      tracks,
      completed: (progressRows || []).map((r) => r.lesson_id as string),
    };

    if (user.isAdmin) {
      const [{ data: people }, { data: allProgress }] = await Promise.all([
        db.from("people").select("*").order("joined_at", { ascending: false }),
        db.from("progress").select("user_id"),
      ]);
      const counts: Record<string, number> = {};
      (allProgress || []).forEach((p) => {
        counts[p.user_id as string] = (counts[p.user_id as string] || 0) + 1;
      });
      result.people = (people || []).map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        joined_at: p.joined_at,
        completed: counts[p.id as string] || 0,
      }));
    }

    return Response.json(result);
  } catch (e) {
    return fail(e);
  }
}
