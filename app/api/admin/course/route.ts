import { identity, denied, forbidden, fail } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();
    if (!user.isAdmin) return forbidden();

    const v = (await req.json()) as { title?: string; description?: string; level?: string };
    const title = (v.title || "").trim();
    const description = (v.description || "").trim();
    if (title.length < 3 || title.length > 100 || description.length > 300) {
      return Response.json({ error: "أدخل عنوانًا ووصفًا مناسبين." }, { status: 400 });
    }

    const db = createSupabaseServiceClient();
    const id = crypto.randomUUID();
    const { error } = await db.from("courses").insert({
      id,
      title,
      description,
      icon: "✦",
      level: v.level === "متوسط" ? "متوسط" : "مبتدئ",
      published: false,
    });
    if (error) throw error;

    return Response.json({ id }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();
    if (!user.isAdmin) return forbidden();

    const v = (await req.json()) as { id?: string; published?: boolean };
    if (typeof v.id !== "string" || typeof v.published !== "boolean") {
      return Response.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    const db = createSupabaseServiceClient();

    if (v.published) {
      const { count } = await db
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", v.id);
      if (!count) {
        return Response.json({ error: "أضف درسًا قبل نشر المسار." }, { status: 400 });
      }
    }

    const { data, error } = await db
      .from("courses")
      .update({ published: v.published })
      .eq("id", v.id)
      .select("id");
    if (error) throw error;
    if (!data || !data.length) {
      return Response.json({ error: "المسار غير موجود" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
