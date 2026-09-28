export const WITHDRAW_REQUEST_STATUSES = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

export function getWithdrawRequestStatusLabel(status, language = "vi") {
  const translations = {
    [WITHDRAW_REQUEST_STATUSES.PENDING]: {
      vi: "Đang chờ",
      en: "Pending",
    },
    [WITHDRAW_REQUEST_STATUSES.APPROVED]: {
      vi: "Đã duyệt",
      en: "Approved",
    },
    [WITHDRAW_REQUEST_STATUSES.REJECTED]: {
      vi: "Đã từ chối",
      en: "Rejected",
    },
    [WITHDRAW_REQUEST_STATUSES.COMPLETED]: {
      vi: "Hoàn thành",
      en: "Completed",
    },
  };

  return translations[status]?.[language] || status;
}

export function getWithdrawRequestStatusColor(status) {
  switch (status) {
    case WITHDRAW_REQUEST_STATUSES.PENDING:
      return "orange";
    case WITHDRAW_REQUEST_STATUSES.APPROVED:
      return "green";
    case WITHDRAW_REQUEST_STATUSES.REJECTED:
      return "red";
    case WITHDRAW_REQUEST_STATUSES.COMPLETED:
      return "blue";
    default:
      return "default";
  }
}
