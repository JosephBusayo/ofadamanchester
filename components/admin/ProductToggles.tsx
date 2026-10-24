"use client";

import { useState, useTransition } from "react";
import { setProductFlagAction } from "@/app/admin/settings/actions";
import styles from "./Admin.module.css";

/** Sold-out and hidden switches for one menu item. Optimistic, rolls back on failure. */
export function ProductToggles({ slug, name, soldOut, active }: { slug: string; name: string; soldOut: boolean; active: boolean }) {
  const [state, setState] = useState({ soldOut, active });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const flip = (field: "sold_out" | "is_active") => {
    const prev = state;
    const next = field === "sold_out" ? { ...state, soldOut: !state.soldOut } : { ...state, active: !state.active };
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
          {!state.active ? "Hidden from the menu" : state.soldOut ? "Shown as SOLD OUT" : "Available"}
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={styles.btnRow} style={{ alignItems: "center", gap: 18 }}>
        <label className={styles.btnRow} style={{ alignItems: "center", gap: 8 }}>
          <span className={styles.hint}>In stock</span>
          <button
            type="button"
            role="switch"
            aria-checked={!state.soldOut}
            aria-label={`${name} in stock`}
            className={styles.toggle}
            disabled={pending}
            onClick={() => flip("sold_out")}
          />
        </label>
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
