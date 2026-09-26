import { identity, denied, forbidden, fail, getSettings, updateSettings } from "@/lib/academy";

export const dynamic = "force-dynamic";

/**
 * Public on purpose: the platform name and menu labels are cosmetic text,
 * not sensitive data, and the login page (before anyone is signed in) needs
 * them too so the brand name is consistent everywhere.
 */
export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json({ settings });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();
    if (!user.isAdmin) return forbidden();

    const body = (await req.json()) as Record<string, unknown>;
    const settings = await updateSettings(body);

    return Response.json({ settings });
  } catch (e) {
    return fail(e);
  }
}
