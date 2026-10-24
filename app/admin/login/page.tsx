import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CodeForm, EnrolForm, PasswordForm } from "@/components/admin/LoginForms";
import styles from "@/components/admin/Admin.module.css";
import { adminStage } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { signOutAction } from "./actions";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className={styles.auth}>
      <div className={`${styles.card} ${styles.authCard}`}>
        <p className="mb-1 text-sm font-semibold tracking-[0.08em] text-highlight">OFADA ADMIN</p>
        <Suspense fallback={<p>Loading…</p>}>
          <LoginStep />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginStep() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <h1 className={styles.cardTitle}>NOT SET UP YET</h1>
        <p>Add the Supabase keys to <code>.env.local</code> (see CLAUDE.md) to enable the admin.</p>
      </>
    );
  }

  const { stage, email } = await adminStage();
  if (stage === "ok") redirect("/admin");

  if (stage === "not-admin") {
    return (
      <>
        <h1 className={styles.cardTitle}>NO ACCESS</h1>
        <p className="mb-4">{email} isn&apos;t an admin for this shop.</p>
        <form action={signOutAction}>
          <button className={styles.btn} type="submit">
            Sign out
          </button>
        </form>
      </>
    );
  }

  if (stage === "needs-mfa-setup") {
    return (
      <>
        <h1 className={styles.cardTitle}>SET UP TWO-FACTOR</h1>
        <p className="mb-3">
          For security, the admin needs an authenticator app (Google Authenticator, Microsoft Authenticator,
          1Password…). You only do this once.
        </p>
        <EnrolForm />
      </>
    );
  }

  if (stage === "needs-mfa-code") {
    return (
      <>
        <h1 className={styles.cardTitle}>ENTER YOUR CODE</h1>
        <p className="mb-3">Open your authenticator app and enter the 6-digit code for Ofada.</p>
        <CodeForm />
      </>
    );
  }

  return (
    <>
      <h1 className={styles.cardTitle}>SIGN IN</h1>
      <PasswordForm />
    </>
  );
}
