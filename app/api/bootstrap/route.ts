import { identity, denied, fail, coursesFor, upsertPerson } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await identity();
    if (!user) return denied();

    await upsertPerson(user.userId, user.email, user.displayName);

    const db = createSupabaseServiceClient();
    const [{ data: progressRows }, tracks] = await Promise.all([
      db.from("progress").select("lesson_id").eq("user_id", user.userId),
      coursesFor(user.isAdmin),
    ]);

    const result: Record<string, unknown> = {
      user: { name: user.displayName, email: user.email, isAdmin: user.isAdmin },
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
