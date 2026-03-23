import "./EmptyState.css";

type EmptyStateProps = Readonly<{
  title: string;
  description: string;
}>;

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">⌕</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default EmptyState;
