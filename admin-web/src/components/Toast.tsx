import "./Toast.css";

export type ToastTone = "success" | "error" | "info";

type ToastProps = Readonly<{
  message: string;
  tone?: ToastTone;
  onClose: () => void;
}>;

function Toast({ message, tone = "success", onClose }: ToastProps) {
  return (
    <div className={`toast toast--${tone}`}>
      <span className="toast__message">{message}</span>

      <button type="button" className="toast__close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default Toast;
