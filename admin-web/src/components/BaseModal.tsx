import type { MouseEvent, ReactNode } from "react";
import "./BaseModal.css";

type BaseModalProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}>;

function BaseModal({
  isOpen,
  title,
  description,
  onClose,
  children,
  maxWidth = "560px",
}: BaseModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="base-modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="base-modal"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="base-modal-title"
        aria-describedby="base-modal-description"
      >
        <div className="base-modal__header">
          <div>
            <h3 id="base-modal-title">{title}</h3>
            <p id="base-modal-description">{description}</p>
          </div>

          <button type="button" className="base-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="base-modal__body">{children}</div>
      </div>
    </div>
  );
}

export default BaseModal;
