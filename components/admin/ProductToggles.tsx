"use client";

import { useState, useTransition } from "react";
import { setProductFlagAction } from "@/app/admin/settings/actions";
import styles from "./Admin.module.css";

/** In stock / Out of stock buttons + "on menu" switch for one menu item. Optimistic, rolls back on failure. */
export function ProductToggles({ slug, name, soldOut, active }: { slug: string; name: string; soldOut: boolean; active: boolean }) {
  const [state, setState] = useState({ soldOut, active });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const flip = (field: "sold_out" | "is_active", value?: boolean) => {
    const prev = state;
    const next =
      field === "sold_out"
        ? { ...state, soldOut: value ?? !state.soldOut }
        : { ...state, active: value ?? !state.active };
    if (next.soldOut === prev.soldOut && next.active === prev.active) return;
    setState(next);
    setError("");
    start(async () => {
      const r = await setProductFlagAction(slug, field, field === "sold_out" ? next.soldOut : next.active);
      if (!r.ok) {
        setState(prev);
        setError(r.message);
      }
    });
  };

  return (
    <div className={styles.row}>
      <div>
        <strong style={{ opacity: state.active ? 1 : 0.5 }}>{name}</strong>
        <div className={styles.hint}>
          {!state.active ? "Hidden from the menu" : state.soldOut ? "Customers see OUT OF STOCK — can't be ordered" : "Available to order"}
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={styles.btnRow} style={{ alignItems: "center", gap: 18 }}>
        <div className={styles.btnRow} role="group" aria-label={`${name} stock`} style={{ gap: 6 }}>
          <button
            type="button"
            aria-pressed={!state.soldOut}
            className={`${styles.btn} ${!state.soldOut ? styles.btnPrimary : ""}`}
            style={{ minHeight: 40, padding: "0 16px", fontSize: 14 }}
            disabled={pending}
            onClick={() => flip("sold_out", false)}
          >
            In stock
          </button>
          <button
            type="button"
            aria-pressed={state.soldOut}
            className={`${styles.btn} ${state.soldOut ? styles.btnPrimary : ""}`}
            style={{ minHeight: 40, padding: "0 16px", fontSize: 14 }}
            disabled={pending}
            onClick={() => flip("sold_out", true)}
          >
            Out of stock
          </button>
        </div>
        <label className={styles.btnRow} style={{ alignItems: "center", gap: 8 }}>
          <span className={styles.hint}>On menu</span>
          <button
            type="button"
            role="switch"
            aria-checked={state.active}
            aria-label={`${name} on menu`}
            className={styles.toggle}
            disabled={pending}
            onClick={() => flip("is_active")}
          />
        </label>
      </div>
    </div>
  );
}
