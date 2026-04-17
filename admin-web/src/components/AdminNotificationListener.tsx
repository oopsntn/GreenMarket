import React, { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getAdminToken } from "../utils/adminSession";
import ToastContainer, { type ToastItem } from "./ToastContainer";

const AdminNotificationListener: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const SOCKET_URL = API_URL.replace("/api", "");

  const addToast = useCallback((message: string, tone: "positive" | "negative" | "neutral" = "neutral") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, tone }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Admin connected to notification socket");
    });

    socket.on("admin_alert", (data: any) => {
      console.log("New Admin Alert:", data);
      addToast(`🔔 ${data.title}: ${data.message}`, "neutral");
      
      // Play a subtle sound if desired
      // const audio = new Audio('/notification-sound.mp3');
      // audio.play().catch(() => {});
    });

    socket.on("connect_error", (err) => {
      console.error("Admin socket connect_error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [addToast, SOCKET_URL]);

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
};

export default AdminNotificationListener;
