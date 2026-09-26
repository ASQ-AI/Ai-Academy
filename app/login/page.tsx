import { getSettings } from "@/lib/academy";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getSettings();
  return <LoginForm siteName={settings.siteName} />;
}
