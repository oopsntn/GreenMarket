import "./EmptyState.css";

type EmptyStateProps = Readonly<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}>;

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">?</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="empty-state__action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;
