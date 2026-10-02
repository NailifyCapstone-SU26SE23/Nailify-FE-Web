export const ARTIST_BREAK_STATUS = {
  Pending: { vi: "Chờ duyệt", en: "Pending", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Approved: { vi: "Đã xác nhận", en: "Approved", tone: "bg-green-100 text-green-600 border-green-200" },
  Rejected: { vi: "Đã từ chối", en: "Rejected", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const BOOKING_PROCEDURE_STATUS = {
  Pending: { vi: "Chờ xử lý", en: "Pending", tone: "bg-slate-100 text-slate-600 border-slate-200" },
  InProgress: { vi: "Đang thực hiện", en: "In Progress", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  Completed: { vi: "Đã hoàn thành", en: "Completed", tone: "bg-green-100 text-green-600 border-green-200" },
  Skipped: { vi: "Đã bỏ qua", en: "Skipped", tone: "bg-gray-100 text-gray-500 border-gray-200" },
};

export const BOOKING_STATUS = {
  Pending: { vi: "Chờ xác nhận", en: "Pending", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Approved: { vi: "Đã xác nhận", en: "Approved", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  Rejected: { vi: "Từ chối", en: "Rejected", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  Cancelled: { vi: "Đã hủy", en: "Cancelled", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  CheckedIn: { vi: "Đã Check-in", en: "Checked In", tone: "bg-cyan-100 text-cyan-600 border-cyan-200" },
  InProgress: { vi: "Đang thực hiện", en: "In Progress", tone: "bg-indigo-100 text-indigo-600 border-indigo-200" },
  ServiceCompleted: { vi: "Đã hoàn thành dịch vụ", en: "Service Completed", tone: "bg-teal-100 text-teal-600 border-teal-200" },
  Completed: { vi: "Đã hoàn thành", en: "Completed", tone: "bg-green-100 text-green-600 border-green-200" },
  Repaired: { vi: "Đã bảo hành", en: "Repaired", tone: "bg-purple-100 text-purple-600 border-purple-200" },
  ReschedulePending: { vi: "Chờ duyệt đổi lịch", en: "Reschedule Pending", tone: "bg-orange-100 text-orange-600 border-orange-200" },
  RescheduleSuggested: { vi: "Chờ khách duyệt", en: "Reschedule Suggested", tone: "bg-yellow-100 text-yellow-600 border-yellow-200" },
};

export const CUSTOMER_NAIL_STATUS = {
  Draft: { vi: "Bản nháp", en: "Draft", tone: "bg-slate-100 text-slate-600 border-slate-200" },
  PendingReview: { vi: "Chờ duyệt", en: "Pending Review", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Assigned: { vi: "Đã giao", en: "Assigned", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  Reviewed: { vi: "Đã đánh giá", en: "Reviewed", tone: "bg-indigo-100 text-indigo-600 border-indigo-200" },
  Quoted: { vi: "Đã báo giá", en: "Quoted", tone: "bg-purple-100 text-purple-600 border-purple-200" },
  Approved: { vi: "Đã xác nhận", en: "Approved", tone: "bg-green-100 text-green-600 border-green-200" },
  Rejected: { vi: "Đã từ chối", en: "Rejected", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const NAIL_ARTIST_TRANSFER_STATUS = {
  Scheduled: { vi: "Đã lên lịch", en: "Scheduled", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  Completed: { vi: "Đã hoàn thành", en: "Completed", tone: "bg-green-100 text-green-600 border-green-200" },
  Cancelled: { vi: "Đã hủy", en: "Cancelled", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const PAYMENT_TYPE = {
  BookingDeposit: { vi: "Đặt cọc lịch hẹn", en: "Booking Deposit", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  BookingRemaining: { vi: "Thanh toán phần còn lại", en: "Booking Remaining", tone: "bg-green-100 text-green-600 border-green-200" },
  WalletDeposit: { vi: "Nạp tiền vào ví", en: "Wallet Deposit", tone: "bg-indigo-100 text-indigo-600 border-indigo-200" },
  WalletWithdrawal: { vi: "Rút tiền từ ví", en: "Wallet Withdrawal", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  1: { vi: "Đặt cọc lịch hẹn", en: "Booking Deposit", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  2: { vi: "Thanh toán phần còn lại", en: "Booking Remaining", tone: "bg-green-100 text-green-600 border-green-200" },
  3: { vi: "Nạp tiền vào ví", en: "Wallet Deposit", tone: "bg-indigo-100 text-indigo-600 border-indigo-200" },
  4: { vi: "Rút tiền từ ví", en: "Wallet Withdrawal", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const WAITLIST_STATUS = {
  Waiting: { vi: "Đang chờ", en: "Waiting", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Notified: { vi: "Đã thông báo", en: "Notified", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  Confirmed: { vi: "Đã xác nhận", en: "Confirmed", tone: "bg-green-100 text-green-600 border-green-200" },
  Expired: { vi: "Hết hạn", en: "Expired", tone: "bg-gray-100 text-gray-600 border-gray-200" },
  Cancelled: { vi: "Đã hủy", en: "Cancelled", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const TRANSACTION_STATUS = {
  Pending: { vi: "Chờ xử lý", en: "Pending", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Paid: { vi: "Đã thanh toán", en: "Paid", tone: "bg-green-100 text-green-600 border-green-200" },
  Refunded: { vi: "Đã hoàn tiền", en: "Refunded", tone: "bg-purple-100 text-purple-600 border-purple-200" },
  Overdue: { vi: "Quá hạn", en: "Overdue", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  Cancelled: { vi: "Đã hủy", en: "Cancelled", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const PAYMENT_METHOD = {
  "Chuyển khoản": { vi: "Chuyển khoản", en: "Bank Transfer", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  "Tiền mặt": { vi: "Tiền mặt", en: "Cash", tone: "bg-green-100 text-green-600 border-green-200" },
  "Nạp tiền vào ví": { vi: "Nạp tiền vào ví", en: "Wallet Deposit", tone: "bg-purple-100 text-purple-600 border-purple-200" },
  "Rút tiền từ ví": { vi: "Rút tiền từ ví", en: "Wallet Withdrawal", tone: "bg-rose-100 text-rose-600 border-rose-200" },
}

export const WALLET_STATUS = {
  Active: { vi: "Hoạt động", en: "Active", tone: "bg-green-100 text-green-600 border-green-200" },
  Frozen: { vi: "Tạm đóng băng", en: "Frozen", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Locked: { vi: "Bị khóa", en: "Locked", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  1: { vi: "Hoạt động", en: "Active", tone: "bg-green-100 text-green-600 border-green-200" },
  2: { vi: "Tạm đóng băng", en: "Frozen", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  3: { vi: "Bị khóa", en: "Locked", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const WALLET_TRANSACTION_STATUS = {
  Pending: { vi: "Chờ xử lý", en: "Pending", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Completed: { vi: "Thành công", en: "Completed", tone: "bg-green-100 text-green-600 border-green-200" },
  Failed: { vi: "Thất bại", en: "Failed", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  Cancelled: { vi: "Đã hủy", en: "Cancelled", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const WALLET_TRANSACTION_TYPE = {
  BookingRefund: { vi: "Hoàn tiền lịch hẹn", en: "Booking Refund", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  BookingPayment: { vi: "Thanh toán lịch hẹn", en: "Booking Payment", tone: "bg-green-100 text-green-600 border-green-200" },
  Deposit: { vi: "Nạp tiền vào ví", en: "Deposit", tone: "bg-purple-100 text-purple-600 border-purple-200" },
  Withdrawal: { vi: "Rút tiền từ ví", en: "Withdrawal", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const WITHDRAWAL_STATUS = {
  Pending: { vi: "Chờ xử lý", en: "Pending", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Approved: { vi: "Đã xác nhận", en: "Approved", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  Rejected: { vi: "Đã từ chối", en: "Rejected", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  Completed: { vi: "Đã hoàn thành", en: "Completed", tone: "bg-green-100 text-green-600 border-green-200" },
  1: { vi: "Chờ xử lý", en: "Pending", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  2: { vi: "Đã xác nhận", en: "Approved", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  3: { vi: "Đã từ chối", en: "Rejected", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  4: { vi: "Đã hoàn thành", en: "Completed", tone: "bg-green-100 text-green-600 border-green-200" },
};

export const SALON_STATUS_FILTER = {
  All: { vi: "Tất cả", en: "All", tone: "bg-slate-100 text-slate-600 border-slate-200" },
  Open: { vi: "Mở cửa", en: "Open", tone: "bg-green-100 text-green-600 border-green-200" },
  Closed: { vi: "Đóng cửa", en: "Closed", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  Active: { vi: "Hoạt động", en: "Active", tone: "bg-green-100 text-green-600 border-green-200" },
  Inactive: { vi: "Ngừng hoạt động", en: "Inactive", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const CHAIR_STATUS = {
  Active: { vi: "Hoạt động", en: "Active", tone: "bg-green-100 text-green-600 border-green-200" },
  Inactive: { vi: "Ngừng hoạt động", en: "Inactive", tone: "bg-rose-100 text-rose-600 border-rose-200" },
  Maintenance: { vi: "Bảo trì", en: "Maintenance", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Booked: { vi: "Đang đặt", en: "Booked", tone: "bg-blue-100 text-blue-600 border-blue-200" },
};

export const USER_STATUS = {
  Active: { vi: "Hoạt động", en: "Active", tone: "bg-green-100 text-green-600 border-green-200" },
  Inactive: { vi: "Ngừng hoạt động", en: "Inactive", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const BASIC_STATUS = {
  Active: { vi: "Hoạt động", en: "Active", tone: "bg-green-100 text-green-600 border-green-200" },
  Inactive: { vi: "Ngừng hoạt động", en: "Inactive", tone: "bg-rose-100 text-rose-600 border-rose-200" },
};

export const CUSTOMER_NAIL_REQUEST_STATUS = {
  PendingReview: { vi: "Chờ xét duyệt", en: "Pending Review", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Assigned: { vi: "Đã phân công", en: "Assigned", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  Reviewed: { vi: "Đã xem xét", en: "Reviewed", tone: "bg-blue-100 text-blue-600 border-blue-200" },
  Quoted: { vi: "Đã báo giá", en: "Quoted", tone: "bg-green-100 text-green-600 border-green-200" },
  Approved: { vi: "Đã duyệt", en: "Approved", tone: "bg-green-100 text-green-600 border-green-200" },
  Rejected: { vi: "Đã từ chối", en: "Rejected", tone: "bg-rose-100 text-rose-600 border-rose-200" },
}

export const BREAK_STATUS = {
  Pending: { vi: "Chờ duyệt", en: "Pending", tone: "bg-amber-100 text-amber-600 border-amber-200" },
  Approved: { vi: "Đã duyệt", en: "Approved", tone: "bg-green-100 text-green-600 border-green-200" },
  Rejected: { vi: "Đã từ chối", en: "Rejected", tone: "bg-rose-100 text-rose-600 border-rose-200" },
}

/**
 * Get the formatted status label based on current language
 * @param {string|number} status - The status key/value
 * @param {object} statusConfig - The config object (e.g., BOOKING_STATUS)
 * @param {string} language - Current language ("vi" or "en")
 * @returns {string} - The translated label
 */
export const getStatusLabel = (status, statusConfig, language = "en") => {
  const config = statusConfig[status];
  if (!config) return String(status);
  return language === "vi" ? config.vi : config.en;
};

/**
 * Get the full status formatting object (label and tone)
 * @param {string|number} status - The status key/value
 * @param {object} statusConfig - The config object
 * @param {string} language - Current language
 * @returns {{ label: string, tone: string }}
 */
export const getStatusMeta = (status, statusConfig, language = "en") => {
  const config = statusConfig[status];
  if (!config) {
    return {
      label: String(status),
      tone: "bg-gray-100 text-gray-600 border-gray-200"
    };
  }
  return {
    label: language === "vi" ? config.vi : config.en,
    tone: config.tone
  };
};
