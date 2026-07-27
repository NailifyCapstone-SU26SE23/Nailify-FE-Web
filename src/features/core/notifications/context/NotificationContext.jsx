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
  // Stable ref for the notification handler to avoid stale closures in SignalR callbacks
  const handleIncomingNotificationRef = useRef(null);

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
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl pointer-events-auto flex ring-1 ring-gray-100 p-4 items-start gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] cursor-pointer`}
        onClick={() => toast.dismiss(t.id)}
      >
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-100 to-rose-100 flex items-center justify-center border border-pink-200/50 shadow-inner">
            <span className="text-lg">🔔</span>
          </div>
        </div>
        <div className="flex-1 w-0">
          <p className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight">
            {notificationItem.title}
          </p>
          <p className="mt-1.5 text-[13px] text-gray-500 leading-snug line-clamp-2">
            {notificationItem.message}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
      </div>
    ), { duration: 5000 });
  };

  // Keep the ref always pointing to the latest version to avoid stale closures
  handleIncomingNotificationRef.current = handleIncomingNotification;

  // Setup connection monitoring effect
  useEffect(() => {
    const checkAuthAndConnect = async () => {
      const session = loadAuthSession();
      const token = session?.accessToken || session?.token || null;

      // User logged out
      if (!token && currentTokenRef.current) {
        console.log("NotificationContext: User logged out. Disconnecting SignalR.");
        currentTokenRef.current = null;
        await notificationSignalRService.stopConnection();
        setConnectionStatus("disconnected");
        setNotifications([]); // Clear notifications on logout
        return;
      }

      // User logged in, token changed, or need to reconnect after disconnect
      if (token && token !== currentTokenRef.current) {
        if (isConnectingRef.current) return;
        
        console.log("NotificationContext: Connecting SignalR...");
        currentTokenRef.current = token;
        isConnectingRef.current = true;
        setConnectionStatus("connecting");
        
        try {
            const conn = await notificationSignalRService.startConnection({
                // Use ref to always call the LATEST version of the handler (avoids stale closure)
                onNotificationReceived: (notification) => {
                    handleIncomingNotificationRef.current?.(notification);
                },
                onReconnected: () => {
                    console.log("NotificationContext: SignalR reconnected.");
                    setConnectionStatus("connected");
                },
                // Reset token ref so the polling loop can attempt to reconnect
                onDisconnected: () => {
                    console.warn("NotificationContext: SignalR disconnected — will retry.");
                    setConnectionStatus("disconnected");
                    currentTokenRef.current = null;
                }
            });

            if (conn) {
                console.log("NotificationContext: SignalR connection established ✅");
                // Re-set the ref in case the StrictMode cleanup had nulled it while we were awaiting
                currentTokenRef.current = token;
                setConnectionStatus("connected");
            } else {
                // startConnection returned null — silent failure, allow retry
                console.error("NotificationContext: SignalR connection failed (returned null). Will retry.");
                setConnectionStatus("disconnected");
                currentTokenRef.current = null;
            }
        } catch (error) {
            console.error("SignalR Connection failed:", error);
            setConnectionStatus("disconnected");
            currentTokenRef.current = null; // allow retry
        } finally {
            isConnectingRef.current = false;
        }
      }
    };

    // Initial check
    checkAuthAndConnect();

    // Check periodically to handle login/logout events cleanly
    const intervalId = setInterval(checkAuthAndConnect, 5000);

    return () => {
      clearInterval(intervalId);
      // NotificationProvider lives at the app root and never truly unmounts during normal usage.
      // Stopping the connection here would abort an in-progress negotiation in React StrictMode
      // (double-invoke) and cause a reconnect loop. Logout disconnection is handled inside
      // checkAuthAndConnect when it detects the token is gone.
      currentTokenRef.current = null;
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
