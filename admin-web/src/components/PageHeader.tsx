import type { ReactNode } from "react";
import "./PageHeader.css";

type PageHeaderProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onActionClick?: () => void;
  actionType?: "button" | "submit";
  actions?: ReactNode;
};

function PageHeader({
  title,
  description,
  actionLabel,
  onActionClick,
  actionType = "button",
  actions,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {actions ? (
        <div className="page-header__actions">{actions}</div>
      ) : actionLabel ? (
        <div className="page-header__actions">
          <button
            className="page-header__action-btn"
            type={actionType}
            onClick={onActionClick}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default PageHeader;
