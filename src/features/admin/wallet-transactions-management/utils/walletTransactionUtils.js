export const WALLET_TRANSACTION_TYPES = [
  "Deposit",
  "Withdraw",
  "BookingPayment",
  "BookingRefund",
  "ConvertToPoints",
];

export const WALLET_TRANSACTION_STATUSES = [
  "Pending",
  "Completed",
  "Failed",
  "Cancelled",
];

export const WALLET_REFERENCE_TYPES = [
  "Booking",
  "Withdrawal",
  "PayOs",
  "PointsConversion",
];

const typeLabels = {
  Deposit: { en: "Deposit", vi: "Nạp tiền" },
  Withdraw: { en: "Withdraw", vi: "Rút tiền" },
  BookingPayment: { en: "Booking Payment", vi: "Thanh toán lịch hẹn" },
  BookingRefund: { en: "Booking Refund", vi: "Hoàn tiền lịch hẹn" },
  ConvertToPoints: { en: "Convert to Points", vi: "Chuyển thành điểm" },
};

const statusLabels = {
  Pending: { en: "Pending", vi: "Chờ xử lý" },
  Completed: { en: "Completed", vi: "Đã hoàn tất" },
  Failed: { en: "Failed", vi: "Thất bại" },
  Cancelled: { en: "Cancelled", vi: "Đã hủy" },
};

const referenceTypeLabels = {
  Booking: { en: "Booking", vi: "Lịch hẹn" },
  Withdrawal: { en: "Withdrawal", vi: "Rút tiền" },
  PayOs: { en: "PayOS", vi: "PayOS" },
  PointsConversion: { en: "Points Conversion", vi: "Đổi điểm" },
};

const statusColors = {
  Pending: "gold",
  Completed: "green",
  Failed: "red",
  Cancelled: "default",
};

const typeColors = {
  Deposit: "green",
  Withdraw: "volcano",
  BookingPayment: "blue",
  BookingRefund: "purple",
  ConvertToPoints: "cyan",
};

export function getWalletTransactionTypeLabel(type, language = "en") {
  return typeLabels[type]?.[language] || type || "-";
}

export function getWalletTransactionStatusLabel(status, language = "en") {
  return statusLabels[status]?.[language] || status || "-";
}

export function getWalletReferenceTypeLabel(referenceType, language = "en") {
  return referenceTypeLabels[referenceType]?.[language] || referenceType || "-";
}

export function getWalletTransactionStatusColor(status) {
  return statusColors[status] || "default";
}

export function getWalletTransactionTypeColor(type) {
  return typeColors[type] || "default";
}
