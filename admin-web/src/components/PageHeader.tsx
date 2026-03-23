import "./PageHeader.css";

type PageHeaderProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onActionClick?: () => void;
  actionType?: "button" | "submit";
};

function PageHeader({
  title,
  description,
  actionLabel,
  onActionClick,
  actionType = "button",
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {actionLabel && (
        <button
          className="page-header__action-btn"
          type={actionType}
          onClick={onActionClick}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default PageHeader;
