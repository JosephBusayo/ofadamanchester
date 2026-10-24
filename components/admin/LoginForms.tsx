"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  confirmEnrolAction,
  signInAction,
  startEnrolAction,
  verifyCodeAction,
  type EnrolState,
} from "@/app/admin/login/actions";
import styles from "./Admin.module.css";

export function PasswordForm() {
  const [state, action, pending] = useActionState(signInAction, {});
  return (
    <form action={action} className={styles.stack}>
      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input className={styles.input} name="email" type="email" autoComplete="username" required />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Password</span>
        <input className={styles.input} name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function CodeInput() {
  return (
    <label className={styles.field}>
      <span className={styles.label}>6-digit code</span>
      <input
        className={styles.input}
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        autoFocus
      />
    </label>
  );
}

export function CodeForm() {
  const [state, action, pending] = useActionState(verifyCodeAction, {});
  return (
    <form action={action} className={styles.stack}>
      <CodeInput />
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}

export function EnrolForm() {
  const [enrol, setEnrol] = useState<EnrolState | null>(null);
  const [starting, start] = useTransition();
  const [state, action, pending] = useActionState(confirmEnrolAction, {});
  const started = useRef(false);

  // Enrol exactly once — a second enrolment would invalidate the QR code being shown
  // (React runs effects twice in development).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start(async () => setEnrol(await startEnrolAction()));
  }, []);

  if (starting || !enrol) return <p>Preparing your QR code…</p>;
  if (enrol.error || !enrol.qr) return <p className={styles.error}>{enrol.error ?? "Something went wrong."}</p>;

  return (
    <form action={action} className={styles.stack}>
      {/* Supabase returns the QR as an SVG data URI. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.qr} src={enrol.qr} alt="QR code to scan with your authenticator app" />
      <p className={styles.hint}>Can&apos;t scan? Enter this key in the app instead:</p>
      <p className={styles.secret}>{enrol.secret}</p>
      <input type="hidden" name="factorId" value={enrol.factorId} />
      <CodeInput />
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={pending}>
        {pending ? "Checking…" : "Turn on two-factor"}
      </button>
    </form>
  );
}
