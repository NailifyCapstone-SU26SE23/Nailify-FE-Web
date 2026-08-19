import { motion } from "framer-motion";
import dayjs from "dayjs";
import {
  CheckCheck,
  Trash2,
  X,
  BellOff,
  Wifi,
  WifiOff
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

export function NotificationDropdown({ isOpen, onClose }) {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    receiveMockNotification // for debugging / user testing
  } = useNotifications();

  if (!isOpen) return null;

  // Simple formatting helper
  const formatTime = (isoString) => {
    const date = dayjs(isoString);
    if (!date.isValid()) return "";
    const now = dayjs();

    if (now.diff(date, "minute") < 1) {
      return isVi ? "Vừa xong" : "Just now";
    }
    if (now.diff(date, "hour") < 1) {
      return isVi ? `${now.diff(date, "minute")} phút trước` : `${now.diff(date, "minute")} minutes ago`;
    }
    if (now.isSame(date, "day")) {
      return date.format("HH:mm");
    }
    if (now.isSame(date, "year")) {
      return date.format("HH:mm DD/MM");
    }
    return date.format("DD/MM/YYYY");
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return { text: isVi ? "Kết nối trực tuyến" : "Connected", color: "text-emerald-500", icon: Wifi };
      case "connecting":
        return { text: isVi ? "Đang kết nối..." : "Connecting...", color: "text-amber-500 animate-pulse", icon: WifiOff };
      case "disconnected":
      default:
        return { text: isVi ? "Ngoại tuyến" : "Disconnected", color: "text-rose-500", icon: WifiOff };
    }
  };

  const status = getStatusText();
  const StatusIcon = status.icon;

  return (
    <>
      {/* Click-outside backdrop wrapper */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.95 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border border-[#f1e7ed] bg-white shadow-[0_24px_60px_rgba(63,43,63,0.16)] z-50 overflow-hidden flex flex-col max-h-[500px]"
      >
        {/* Header */}
        <div className="border-b border-[#f7dfeb] px-5 py-4 bg-[#fff9fc] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#3f2b3f] text-base">{isVi ? "Thông báo" : "Notifications"}</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-[#ea4f93] text-white text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full shadow-[0_4px_10px_rgba(234,79,147,0.3)]">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <StatusIcon size={12} className={status.color} />
              <span className={`text-[10px] font-semibold ${status.color}`}>
                {status.text}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={markAllAsRead}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#ea4f93] hover:bg-[#fff0f5] transition"
                  title={isVi ? "Đánh dấu đã đọc tất cả" : "Mark all as read"}
                >
                  <CheckCheck size={16} />
                </button>
                <button
                  onClick={clearAll}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title={isVi ? "Xóa tất cả thông báo" : "Delete all notifications"}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}

            {/* Quick action helper to test/mock notifications */}
            <button
              onClick={() => receiveMockNotification(isVi ? "Thông báo thử nghiệm" : "Test notification", isVi ? "Đây là tin nhắn thông báo demo thời gian thực!" : "This is a real-time demo notification message!")}
              className="text-[9px] border border-dashed border-[#ea4f93] text-[#ea4f93] px-2 py-0.5 rounded-lg hover:bg-[#fff0f5] transition"
              title={isVi ? "Test notification receipt" : "Test notification receipt"}
            >
              {isVi ? "Thử nghiệm" : "Test"}
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#faf3f7] min-h-0">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-6">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
                <BellOff size={22} />
              </div>
              <p className="text-sm font-bold text-slate-700">{isVi ? "Hộp thư trống" : "Empty inbox"}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                {isVi ? "Bạn sẽ nhận được thông báo thời gian thực khi có sự kiện mới." : "You will receive real-time notifications when new events occur."}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isRead && markAsRead(item.id)}
                className={`group relative p-4 flex gap-3 transition cursor-pointer ${item.isRead
                  ? "bg-white hover:bg-[#fff9fc]"
                  : "bg-[#fffcfd] hover:bg-[#fff9fc]"
                  }`}
              >
                {/* Unread indicator dot */}
                {!item.isRead && (
                  <span className="absolute top-4 left-2.5 h-2 w-2 rounded-full bg-[#ea4f93]" />
                )}

                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs truncate ${item.isRead ? "font-semibold text-slate-700" : "font-extrabold text-[#3f2b3f]"}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium mt-0.5">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed break-words font-medium">
                    {item.message}
                  </p>
                  {item.type === "AppointmentNextStep" && item.data?.appointmentId && (
                    <Link
                      to={`/thanh-toan-thanh-cong/${item.data.appointmentId}`}
                      onClick={onClose} // Close dropdown when navigating
                      className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-[#ea4f93] to-[#f387b0] text-white text-[10px] font-bold rounded-xl hover:shadow-[0_4px_12px_rgba(234,79,147,0.4)] transition duration-300"
                    >
                      {isVi ? "Xem chi tiết đơn hàng" : "View order details"}
                    </Link>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                  className="h-6 w-6 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition"
                  title={isVi ? "Xóa thông báo" : "Delete notification"}
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}
