import styles from "./DocPage.module.css";

export function DocPage({
  eyebrow,
  title,
  updated,
  notice,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {updated && <p className={styles.updated}>Last updated {updated}</p>}
      {notice && <div className={styles.notice}>{notice}</div>}
      <div className={styles.prose}>{children}</div>
    </article>
  );
}

export { styles as docStyles };
