import BaseModal from "./BaseModal";
import "./ConfirmDialog.css";

type ConfirmDialogProps = Readonly<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "success" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}>;

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      title={title}
      description="Vui lòng xác nhận thao tác này trước khi tiếp tục."
      onClose={onCancel}
      maxWidth="480px"
    >
      <div className="confirm-dialog">
        <p className="confirm-dialog__message">{message}</p>

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-dialog__confirm confirm-dialog__confirm--${tone}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default ConfirmDialog;
