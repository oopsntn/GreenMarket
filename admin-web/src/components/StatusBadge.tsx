import "./StatusBadge.css";

type StatusBadgeVariant =
  | "active"
  | "disabled"
  | "locked"
  | "pending"
  | "suspended"
  | "rejected"
  | "paused"
  | "expired"
  | "required"
  | "optional"
  | "positive"
  | "negative"
  | "slot"
  | "role"
  | "type"
  | "success"
  | "processing";

type StatusBadgeProps = Readonly<{
  label: string;
  variant: StatusBadgeVariant;
}>;

function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${variant}`}>{label}</span>
  );
}

export default StatusBadge;
