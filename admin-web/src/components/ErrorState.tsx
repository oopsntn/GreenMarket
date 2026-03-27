import "./ErrorState.css";

type ErrorStateProps = Readonly<{
  title?: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}>;

function ErrorState({
  title = "Something went wrong",
  description = "The system could not load data at the moment. Please try again.",
  actionLabel = "Try Again",
  onActionClick,
}: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-state__icon">!</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onActionClick && (
        <button type="button" onClick={onActionClick}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorState;
