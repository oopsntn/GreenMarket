import "./LoadingState.css";

type LoadingStateProps = Readonly<{
  title?: string;
  description?: string;
}>;

function LoadingState({
  title = "Loading data...",
  description = "Please wait while the system fetches the latest information.",
}: LoadingStateProps) {
  return (
    <div className="loading-state">
      <div className="loading-state__spinner" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default LoadingState;
