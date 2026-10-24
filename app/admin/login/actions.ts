"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminStage } from "@/lib/admin/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserDb, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthState = { error?: string };
export type EnrolState = AuthState & { factorId?: string; qr?: string; secret?: string };

const TOO_MANY = "Too many attempts — wait a few minutes and try again.";
const codeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app.");

export async function signInAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase isn't set up yet (missing env vars)." };
  if (!(await checkRateLimit("login"))) return { error: TOO_MANY };
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1).max(200) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter your email and password." };

  const db = await getUserDb();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  // Same message for unknown email / wrong password — don't reveal which.
  if (error) return { error: "Email or password is incorrect." };
  redirect("/admin/login");
}

/** Second step: 6-digit code from an already set-up authenticator app. */
export async function verifyCodeAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!(await checkRateLimit("login"))) return { error: TOO_MANY };
  const code = codeSchema.safeParse(form.get("code"));
  if (!code.success) return { error: code.error.issues[0].message };

  const db = await getUserDb();
  const { data: factors } = await db.auth.mfa.listFactors();
  const factor = factors?.totp.find((f) => f.status === "verified");
  if (!factor) return { error: "No authenticator is set up for this account." };
  const { error } = await db.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.data });
  if (error) return { error: "That code didn't work. Codes change every 30 seconds — try the current one." };
  redirect("/admin");
}

/** First sign-in: create an authenticator factor and return its QR code. */
export async function startEnrolAction(): Promise<EnrolState> {
  const { stage } = await adminStage();
  if (stage !== "needs-mfa-setup") return { error: "Two-factor is already set up." };
  const db = await getUserDb();
  // Clear any half-finished enrolments so the owner can retry cleanly.
  const { data: factors } = await db.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status === "unverified") await db.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await db.auth.mfa.enroll({ factorType: "totp", friendlyName: `Ofada admin ${Date.now()}` });
  if (error || !data) return { error: "Couldn't start two-factor setup. Please try again." };
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function confirmEnrolAction(_prev: EnrolState, form: FormData): Promise<EnrolState> {
  if (!(await checkRateLimit("login"))) return { ..._prev, error: TOO_MANY };
  const factorId = String(form.get("factorId") ?? "");
  const code = codeSchema.safeParse(form.get("code"));
  if (!code.success) return { ..._prev, error: code.error.issues[0].message };
  const db = await getUserDb();
  const { error } = await db.auth.mfa.challengeAndVerify({ factorId, code: code.data });
  if (error) return { ..._prev, error: "That code didn't work. Check the time on your phone and try the current code." };
  redirect("/admin");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const db = await getUserDb();
    await db.auth.signOut();
  }
  redirect("/admin/login");
}
