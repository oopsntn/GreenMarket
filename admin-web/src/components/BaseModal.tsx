import type { ReactNode } from "react";
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

  return (
    <div className="base-modal-backdrop">
      <div className="base-modal" style={{ maxWidth }}>
        <div className="base-modal__header">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
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
