import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, X, Loader2, Check } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Notification {
  notificationId: number;
  title: string;
  message: string;
  type: string;
  metaData: any;
  isRead: boolean;
  createdAt: string;
}

const NotificationCenter: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const SOCKET_URL = API_URL.replace('/api', '');

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getMyNotifications();
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications();

      // Initialize Socket.io
      const socket = io(SOCKET_URL, {
        auth: { token },
      });

      socket.on('connect', () => {
        console.log('Connected to notification socket');
      });

      socket.on('new_notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Browser Notification (Optional)
        if (Notification.permission === 'granted') {
          new Notification(notification.title, { body: notification.message });
        }
      });

      socketRef.current = socket;

      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Refresh notifications when opening
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours} giờ trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm group"
        title="Thông báo"
      >
        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-[60]">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Thông báo</h4>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Đánh dấu hết
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Đang tải...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <Bell className="w-8 h-8 text-slate-200" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Chưa có thông báo</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">Chúng tôi sẽ báo cho bạn khi có tin mới.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div
                    key={n.notificationId}
                    onClick={() => !n.isRead && handleMarkAsRead(n.notificationId)}
                    className={cn(
                      "p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer group",
                      !n.isRead ? "bg-emerald-50/30" : "bg-white"
                    )}
                  >
                    <div className="shrink-0 mt-1">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className={cn(
                          "text-sm font-black uppercase tracking-tight leading-tight",
                          !n.isRead ? "text-slate-900" : "text-slate-500"
                        )}>
                          {n.title}
                        </h5>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
                      </div>
                      <p className={cn(
                        "text-xs font-medium mt-1.5 leading-relaxed",
                        !n.isRead ? "text-slate-600" : "text-slate-400"
                      )}>
                        {n.message}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 block">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 text-center">
            <button className="text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
