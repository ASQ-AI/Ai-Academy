import { identity, denied, forbidden, fail } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const str = (x: unknown, max = 3000) =>
  typeof x === "string" ? x.trim().slice(0, max) : "";

export async function POST(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();
    if (!user.isAdmin) return forbidden();

    const v = (await req.json()) as Record<string, unknown>;
    const category = str(v.category, 60);
    const title = str(v.title, 120);
    const body = str(v.body, 4000);
    if (!category || !title || !body) {
      return Response.json(
        { error: "أكمل التصنيف والعنوان ونص القالب." },
        { status: 400 },
      );
    }

    const db = createSupabaseServiceClient();
    const id = crypto.randomUUID();
    const { error } = await db.from("templates").insert({ id, category, title, body });
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

    const v = (await req.json()) as Record<string, unknown>;
    const id = str(v.id, 100);
    const category = str(v.category, 60);
    const title = str(v.title, 120);
    const body = str(v.body, 4000);
    if (!id || !category || !title || !body) {
      return Response.json(
        { error: "أكمل التصنيف والعنوان ونص القالب." },
        { status: 400 },
      );
    }

    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("templates")
      .update({ category, title, body })
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data || !data.length) {
      return Response.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();
    if (!user.isAdmin) return forbidden();

    const v = (await req.json()) as Record<string, unknown>;
    const id = str(v.id, 100);
    if (!id) {
      return Response.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    const db = createSupabaseServiceClient();
    const { error } = await db.from("templates").delete().eq("id", id);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
