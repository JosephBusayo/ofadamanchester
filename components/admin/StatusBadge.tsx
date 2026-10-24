import { STATUS_LABELS, type OrderStatus } from "@/lib/admin/order-status";
import styles from "./Admin.module.css";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${styles.status} ${styles[`status_${status}`] ?? ""}`}>{STATUS_LABELS[status]}</span>;
}
