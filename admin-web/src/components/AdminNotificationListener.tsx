import React, { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getAdminToken } from "../utils/adminSession";
import ToastContainer, { type ToastItem } from "./ToastContainer";

type AdminAlertPayload = {
  title?: unknown;
  message?: unknown;
};

const normalizeAlertText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const AdminNotificationListener: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const SOCKET_URL = API_URL.replace("/api", "");

  const addToast = useCallback(
    (message: string, tone: ToastItem["tone"] = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, tone }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000);
    },
    [],
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
    });

    socket.on("admin_alert", (data: AdminAlertPayload) => {
      const title = normalizeAlertText(data.title);
      const message = normalizeAlertText(data.message);
      const toastMessage = [title, message].filter(Boolean).join(": ");

      if (toastMessage) {
        addToast(toastMessage, "info");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [addToast, SOCKET_URL]);

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
};

export default AdminNotificationListener;
