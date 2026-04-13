import "./ErrorState.css";

type ErrorStateProps = Readonly<{
  title?: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}>;

function ErrorState({
  title = "Đã xảy ra lỗi",
  description = "Hệ thống chưa thể tải dữ liệu lúc này. Vui lòng thử lại.",
  actionLabel = "Thử lại",
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
