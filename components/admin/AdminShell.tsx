import Link from "next/link";
import { signOutAction } from "@/app/admin/login/actions";
import styles from "./Admin.module.css";

const NAV = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/", label: "View shop ↗" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <Link href="/admin" className={styles.brand}>
          OFADA<small>ADMIN</small>
        </Link>
        <nav className={styles.nav} aria-label="Admin">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction}>
          <button type="submit" className={styles.signOut}>
            Sign out
          </button>
        </form>
      </header>
      <main className={styles.page}>{children}</main>
    </div>
  );
}
