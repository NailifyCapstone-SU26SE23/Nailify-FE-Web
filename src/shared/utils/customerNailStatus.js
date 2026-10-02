import { Calendar, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { CUSTOMER_NAIL_STATUS } from "./statusFormatters";

const STATUS_ICONS = {
  PendingReview: Clock3,
  Assigned: Calendar,
  Reviewed: CheckCircle2,
  Quoted: CheckCircle2,
  Approved: CheckCircle2,
  Rejected: XCircle,
};

const FALLBACK_STATUS_CONFIG = {
  en: "Draft",
  vi: "Bản nháp",
  tone: "bg-gray-100 text-gray-600 border-gray-200",
  icon: Clock3,
};

export function getCustomerNailStatusMeta(status, language = "en") {
  const config = CUSTOMER_NAIL_STATUS[status];
  const locale = language === "vi" ? "vi" : "en";

  if (!config) {
    return {
      label: FALLBACK_STATUS_CONFIG[locale] || status || FALLBACK_STATUS_CONFIG.en,
      tone: FALLBACK_STATUS_CONFIG.tone,
      Icon: FALLBACK_STATUS_CONFIG.icon,
    };
  }

  return {
    label: config[locale] || status || config.en,
    tone: `border ${config.tone}`,
    Icon: STATUS_ICONS[status] || Clock3,
  };
}
