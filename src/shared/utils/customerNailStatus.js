import { Calendar, CheckCircle2, Clock3, XCircle } from "lucide-react";

const CUSTOMER_NAIL_STATUS_CONFIG = {
  Draft: {
    en: "Draft",
    vi: "Bản nháp",
    tone: "bg-[#f3f4f6] text-[#6b7280]",
    icon: Clock3,
  },
  Pending: {
    en: "Pending",
    vi: "Đang chờ",
    tone: "bg-[#fff0dd] text-[#db8520]",
    icon: Clock3,
  },
  PendingReview: {
    en: "Pending Review",
    vi: "Chờ duyệt",
    tone: "bg-[#fff0dd] text-[#db8520]",
    icon: Clock3,
  },
  Assigned: {
    en: "Assigned",
    vi: "Đã giao",
    tone: "bg-[#e0f2fe] text-[#0369a1]",
    icon: Calendar,
  },
  Reviewed: {
    en: "Reviewed",
    vi: "Đã đánh giá",
    tone: "bg-[#eaf9ee] text-[#2fa25f]",
    icon: CheckCircle2,
  },
  Quoted: {
    en: "Quoted",
    vi: "Đã báo giá",
    tone: "bg-[#eaf9ee] text-[#2fa25f]",
    icon: CheckCircle2,
  },
  Approved: {
    en: "Approved",
    vi: "Đã duyệt",
    tone: "bg-[#eaf9ee] text-[#2fa25f]",
    icon: CheckCircle2,
  },
  Rejected: {
    en: "Rejected",
    vi: "Đã từ chối",
    tone: "bg-[#ffe6ec] text-[#e1447f]",
    icon: XCircle,
  },
};

const FALLBACK_STATUS_CONFIG = {
  en: "Draft",
  vi: "Bản nháp",
  tone: "bg-[#f3f4f6] text-[#6b7280]",
  icon: Clock3,
};

export function getCustomerNailStatusMeta(status, language = "en") {
  const config = CUSTOMER_NAIL_STATUS_CONFIG[status] || FALLBACK_STATUS_CONFIG;
  const locale = language === "vi" ? "vi" : "en";

  return {
    label: config[locale] || status || config.en,
    tone: config.tone,
    Icon: config.icon,
  };
}
