import "./LoadingState.css";

type LoadingStateProps = Readonly<{
  title?: string;
  description?: string;
}>;

function LoadingState({
  title = "Đang tải dữ liệu...",
  description = "Vui lòng chờ trong khi hệ thống lấy dữ liệu mới nhất.",
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
