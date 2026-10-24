import "server-only";

import { redirect } from "next/navigation";
import { getUserDb, isSupabaseConfigured } from "@/lib/supabase/server";

export type AdminStage = "signed-out" | "not-admin" | "needs-mfa-setup" | "needs-mfa-code" | "ok";

function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Where the current visitor is in the admin sign-in flow. */
export async function adminStage(): Promise<{ stage: AdminStage; email?: string }> {
  if (!isSupabaseConfigured()) return { stage: "signed-out" };
  const db = await getUserDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user?.email) return { stage: "signed-out" };
  const email = user.email.toLowerCase();
  if (!allowedEmails().includes(email)) return { stage: "not-admin", email };

  // Two-factor (authenticator app) is mandatory for the admin.
  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") return { stage: "ok", email };
  return { stage: aal?.nextLevel === "aal2" ? "needs-mfa-code" : "needs-mfa-setup", email };
}

/**
 * Call at the top of every admin page and server action. Returns a Supabase client
 * acting as the admin (RLS still applies), or redirects to the login flow.
 */
export async function requireAdmin() {
  const { stage, email } = await adminStage();
  if (stage !== "ok") redirect("/admin/login");
  return { db: await getUserDb(), email: email! };
}
