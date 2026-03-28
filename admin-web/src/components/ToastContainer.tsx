import Toast, { type ToastTone } from "./Toast";
import "./Toast.css";

export type ToastItem = {
  id: number;
  message: string;
  tone?: ToastTone;
};

type ToastContainerProps = Readonly<{
  toasts: ToastItem[];
  onClose: (id: number) => void;
}>;

function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
