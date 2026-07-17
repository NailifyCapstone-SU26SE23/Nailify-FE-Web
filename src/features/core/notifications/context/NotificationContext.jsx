import { createContext, useContext, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { notificationSignalRService } from "../services/notificationSignalRService";
import { loadAuthSession } from "../../auth/model/authStorage";

const NotificationContext = createContext(null);

const STORAGE_KEY = "nailify_notifications";

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Failed to load notifications from localStorage:", e);
      return [];
    }
  });

  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  
  // Track the current token to detect login/logout
  const currentTokenRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Save to localStorage when notifications state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Failed to save notifications to localStorage:", e);
    }
  }, [notifications]);

  // Handle incoming notification
  const handleIncomingNotification = (rawNotification) => {
    console.log("NotificationContext: Processing raw notification:", rawNotification);
    
    let notificationItem = {
      id: rawNotification?.id || rawNotification?.notificationId || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: rawNotification?.title || rawNotification?.Title || "Thông báo mới",
      message: rawNotification?.message || rawNotification?.Message || rawNotification?.content || (typeof rawNotification === "string" ? rawNotification : JSON.stringify(rawNotification)),
      createdAt: rawNotification?.createdAt || rawNotification?.timestamp || new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => {
      // Avoid duplicate notifications by ID
      if (prev.some((n) => n.id === notificationItem.id)) {
        return prev;
      }
      return [notificationItem, ...prev];
    });

    // Display a beautiful real-time toast
    toast(
      (t) => (
        <div className="flex flex-col gap-1">
          <p className="font-extrabold text-sm text-[#3f2b3f]">{notificationItem.title}</p>
          <p className="text-xs text-[#69708a]">{notificationItem.message}</p>
        </div>
      ),
      {
        icon: "🔔",
        duration: 5000,
        style: {
          borderRadius: "16px",
          background: "#fff",
          color: "#3f2b3f",
          border: "1px solid #f1cddd",
          boxShadow: "0 12px 28px rgba(63, 43, 63, 0.12)",
        },
      }
    );
  };

  // Setup connection monitoring effect
  useEffect(() => {
    const checkAuthAndConnect = () => {
      const session = loadAuthSession();
      const token = session?.accessToken || session?.token || null;

      // User logged out
      if (!token && currentTokenRef.current) {
        console.log("NotificationContext: User logged out. Disconnecting SignalR.");
        currentTokenRef.current = null;
        notificationSignalRService.stopConnection();
        setConnectionStatus("disconnected");
        setNotifications([]); // Clear notifications on logout
        return;
      }

      // User logged in or token refreshed
      if (token && token !== currentTokenRef.current) {
        console.log("NotificationContext: User session detected. Connecting/Reconnecting SignalR.");
        currentTokenRef.current = token;
        
        if (isConnectingRef.current) return;
        isConnectingRef.current = true;

        setConnectionStatus("connecting");
        
        notificationSignalRService.stopConnection();
        notificationSignalRService.startConnection({
          onNotificationReceived: (notification) => {
            handleIncomingNotification(notification);
          },
          onReconnected: () => {
            setConnectionStatus("connected");
          },
          onDisconnected: () => {
            setConnectionStatus("disconnected");
          }
        });

        setConnectionStatus("connected");
        isConnectingRef.current = false;
      }
    };

    // Initial check
    checkAuthAndConnect();

    // Check periodically to handle login/logout events cleanly
    const intervalId = setInterval(checkAuthAndConnect, 2000);

    return () => {
      clearInterval(intervalId);
      notificationSignalRService.stopConnection();
    };
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("Đã đánh dấu tất cả là đã đọc");
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("Đã xóa tất cả thông báo");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionStatus,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        // Helper to manually mock receiving a notification for testing
        receiveMockNotification: (title, message) => {
          handleIncomingNotification({ title, message });
        }
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
