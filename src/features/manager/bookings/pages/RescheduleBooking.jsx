import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  CalendarDays,
  FileText,
  MoreVertical,
  Sunrise,
  Sun,
  Sunset,
  User,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Alert, DatePicker, Modal, Input, Form, Dropdown } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

import { loadAuthSession } from "../../../core/auth/model/authStorage";
import { notificationSignalRService } from "../../../core/notifications/services/notificationSignalRService";
import {
  fetchBookingsBySalonId,
  managerApproveReschedule,
  managerRejectReschedule,
  managerSuggestTime,
  fetchUserById,
} from "../services/bookingsService";

const getManagerSalonId = () => {
  const session = loadAuthSession();
  return session?.user?.salonId || session?.salonId;
};

// ---------- Formatting helpers ----------
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const normalized = String(dateString).trim();
  const datePart = normalized.includes("T") ? normalized.split("T")[0] : normalized;
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return "N/A";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) return "N/A";
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// ---------- Time-slot generation ----------
const PERIODS = [
  { key: "morning", label: "Morning", icon: Sunrise, start: "08:00", end: "11:30" },
  { key: "afternoon", label: "Afternoon", icon: Sun, start: "12:00", end: "17:30" },
  { key: "evening", label: "Evening", icon: Sunset, start: "18:00", end: "20:30" },
];

function generateSlots(start, end, stepMinutes = 30) {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  while (h < endH || (h === endH && m <= endM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += stepMinutes;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return slots;
}

function periodOfTime(value) {
  if (!value) return null;
  const [h] = value.split(":").map(Number);
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

// ---------- Period + slot picker (used inside Suggest modal) ----------
function TimeSlotSelector({ value, onChange }) {
  const [activePeriod, setActivePeriod] = useState(periodOfTime(value) || "morning");

  useEffect(() => {
    const p = periodOfTime(value);
    if (p) setActivePeriod(p);
  }, [value]);

  const activeSlots = useMemo(() => {
    const period = PERIODS.find((p) => p.key === activePeriod);
    return period ? generateSlots(period.start, period.end) : [];
  }, [activePeriod]);

  return (
    <div>
      {/* Period tabs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {PERIODS.map((p) => {
          const Icon = p.icon;
          const isActive = activePeriod === p.key;
          return (
            <button
              type="button"
              key={p.key}
              onClick={() => setActivePeriod(p.key)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all duration-200 ${isActive
                ? "border-transparent bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_8px_18px_rgba(234,79,147,0.28)]"
                : "border-[#f3d7e4] bg-white text-[#7f6478] hover:border-[#f0b7cf] hover:bg-[#fff7fb]"
                }`}
            >
              <Icon size={16} />
              <span className="text-[11px] font-bold">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Slot grid for the active period */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePeriod}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-4 gap-2 rounded-2xl border border-[#f3d7e4] bg-[#fffafc] p-3 max-h-[168px] overflow-y-auto"
        >
          {activeSlots.map((slot) => {
            const isSelected = value === slot;
            return (
              <button
                type="button"
                key={slot}
                onClick={() => onChange?.(slot)}
                className={`rounded-lg py-1.5 text-[11px] font-bold transition-all duration-150 ${isSelected
                  ? "bg-[#ea4f93] text-white shadow-sm shadow-[#ea4f93]/30"
                  : "bg-white text-[#5c4559] border border-[#f1e7ed] hover:border-[#ea4f93] hover:text-[#ea4f93]"
                  }`}
              >
                {formatTime(`${slot}:00`)}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function RescheduleBooking() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve' | 'reject', booking }
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Suggest modal state
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedBookingForSuggest, setSelectedBookingForSuggest] = useState(null);
  const [suggestForm] = Form.useForm();

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError("");
    try {
      const salonId = getManagerSalonId();
      if (!salonId) {
        throw new Error("No salon ID found in session.");
      }

      const result = await fetchBookingsBySalonId(salonId, { pageNumber: 1, pageSize: 1000 });
      let allBookings = [];
      if (result?.items) {
        allBookings = result.items;
      } else if (Array.isArray(result)) {
        allBookings = result;
      }

      const filtered = allBookings.filter(
        (b) => b.status === "ReschedulePending" || b.status === "RescheduleSuggested"
      );

      const enrichedBookings = await Promise.all(
        filtered.map(async (b) => {
          let phone = b.customerPhone || b.phone || b.customer?.phone || b.customer?.phoneNumber || "";
          let email = b.customerEmail || b.email || b.customer?.email || "";
          const customerName =
            b.customerName || (b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : "Unknown Customer");

          if (b.customerId && !phone) {
            try {
              const customer = await fetchUserById(b.customerId);
              phone = customer?.phone || customer?.phoneNumber || "";
              email = customer?.email || "";
            } catch (err) {
              console.warn("Failed to load customer details for booking:", b.id, err);
            }
          }

          return {
            ...b,
            id: b.bookingId || b.id,
            customerName,
            phone,
            email,
          };
        })
      );

      setBookings(enrichedBookings);
    } catch (err) {
      console.error("Failed to load reschedule requests:", err);
      setError(err.message || "Failed to load reschedule requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = notificationSignalRService.registerListener((arg1, arg2) => {
      if (
        arg1 === "BookingRescheduleRequested" ||
        arg1 === "BookingRescheduleDeclined" ||
        arg1 === "BookingRescheduleAccepted"
      ) {
        console.log("RescheduleBooking: Received booking reschedule event from SignalR:", arg1, arg2);
        loadData(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Handle Approve / Reject Reschedule
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsActionLoading(true);
    const { type, booking } = confirmAction;

    try {
      if (type === "approve") {
        await managerApproveReschedule(booking.id);
        toast.success("Reschedule request approved successfully!");
      } else {
        await managerRejectReschedule(booking.id);
        toast.success("Reschedule request rejected successfully!");
      }
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
      loadData();
    } catch (err) {
      toast.error(err.message || `Failed to ${type} reschedule request.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const openApproveModal = (booking) => {
    setConfirmAction({ type: "approve", booking });
    setIsConfirmModalOpen(true);
  };

  const openRejectModal = (booking) => {
    setConfirmAction({ type: "reject", booking });
    setIsConfirmModalOpen(true);
  };

  const openSuggestModal = (booking) => {
    setSelectedBookingForSuggest(booking);
    suggestForm.setFieldsValue({
      suggestedDate: booking.suggestedDate ? dayjs(booking.suggestedDate) : dayjs(booking.bookingDate),
      suggestedTime: booking.suggestedTime ? booking.suggestedTime.slice(0, 5) : booking.startTime?.slice(0, 5) || "09:00",
      reason: "",
    });
    setIsSuggestModalOpen(true);
  };

  const handleSuggestSubmit = async (values) => {
    if (!selectedBookingForSuggest) return;
    setIsActionLoading(true);

    try {
      const formattedDate = values.suggestedDate.format("YYYY-MM-DD");
      const formattedTime = values.suggestedTime.length === 5 ? `${values.suggestedTime}:00` : values.suggestedTime;

      await managerSuggestTime(selectedBookingForSuggest.id, {
        suggestedDate: formattedDate,
        suggestedTime: formattedTime,
        reason: values.reason,
      });

      toast.success("Alternative time suggested successfully!");
      setIsSuggestModalOpen(false);
      setSelectedBookingForSuggest(null);
      suggestForm.resetFields();
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to submit time suggestion.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.phone?.includes(searchQuery) ||
        b.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.id && String(b.id).toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "All" || b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "ReschedulePending").length;
    const suggested = bookings.filter((b) => b.status === "RescheduleSuggested").length;

    return { total, pending, suggested };
  }, [bookings]);

  const selectedSuggestedTime = Form.useWatch("suggestedTime", suggestForm);

  return (
    <section className="flex min-h-[100dvh] flex-col gap-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <article className="relative overflow-hidden rounded-[28px] border-none bg-gradient-to-br from-[#fff3f8] via-[#fffafb] to-[#fff5fb] p-6 shadow-[0_20px_40px_-15px_rgba(234,79,147,0.12)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_10px_24px_rgba(234,79,147,0.35)]">
                <Clock size={26} />
              </div>
              <div>
                <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#ea4f93] shadow-[0_6px_14px_rgba(234,79,147,0.08)] backdrop-blur">
                  {language === "vi" ? "Portal quản lý" : "Manager portal"}
                </span>
                <h1 className="text-2xl font-extrabold text-[#2d1b35] mt-1.5 tracking-tight">{t("manager.bookings.rescheduleTime") || "Reschedule Requests"}</h1>
                <p className="text-xs text-[#a88a9f] mt-0.5">
                  {language === "vi" ? "Phê duyệt, từ chối hoặc đề xuất thời gian mới cho yêu cầu dời lịch của khách hàng" : "Approve, reject, or suggest new times for customer reschedule requests"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full lg:w-[450px]">
              {[
                { label: language === "vi" ? "Tổng yêu cầu" : "Total Requests", value: stats.total, color: "text-[#2d1b35] bg-white" },
                { label: t("manager.dashboard.statusWaiting"), value: stats.pending, color: "text-[#db8520] bg-[#fffcf5] border-[#fdeacc]" },
                { label: language === "vi" ? "Đang chờ khách hàng" : "Awaiting Customer", value: stats.suggested, color: "text-[#6366f1] bg-[#f5f6ff] border-[#e0e3ff]" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl border border-[#f1e7ed] p-3 text-center shadow-sm backdrop-blur transition-all duration-300 ${s.color}`}
                >
                  <p className="text-[10px] font-bold text-[#bca0ae] uppercase tracking-wider">{s.label}</p>
                  <p className="mt-1 text-xl font-black">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </motion.div>

      {/* Main Board */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <article className="overflow-hidden rounded-[28px] border border-[#f1e7ed] bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)]">
          {/* Filters Bar */}
          <div className="border-b border-[#f5e2ec] bg-gradient-to-b from-[#fff9fb] to-white p-5 lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "All", label: t("manager.common.all"), count: bookings.length },
                  { value: "ReschedulePending", label: t("manager.common.actions") || "Pending Actions", count: stats.pending },
                  { value: "RescheduleSuggested", label: t("manager.dashboard.statusWaiting") || "Awaiting Customer", count: stats.suggested },
                ].map((tab) => {
                  const isActive = statusFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setStatusFilter(tab.value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${isActive
                        ? "border-[#ea4f93] bg-[#ea4f93] text-white shadow-[0_10px_20px_rgba(234,79,147,0.22)]"
                        : "border-[#f3d7e4] bg-white text-[#7f6478] hover:border-[#f0b7cf] hover:bg-[#fff7fb] hover:text-[#ea4f93]"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-[#fff0f6] text-[#c86d98]"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full lg:w-72">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a88a9f]" />
                <input
                  type="text"
                  placeholder={t("manager.bookings.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-[#f3d7e4] bg-white pl-9 pr-4 text-xs text-[#5c4559] outline-none transition-all duration-300 ease-out placeholder:text-[#c8b0bf] hover:border-[#f0b7cf] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/10"
                />
              </div>
            </div>
          </div>

          {/* List Area */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spin size="large" />
                <p className="mt-4 text-xs font-semibold text-[#a88a9f]">{t("manager.common.loading")}</p>
              </div>
            ) : error ? (
              <div className="p-6">
                <Alert message={t("manager.common.error")} description={error} type="error" showIcon />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f8] text-[#ea4f93] mb-4">
                  <CalendarDays size={24} />
                </div>
                <p className="text-sm font-bold text-[#5b4256]">{t("manager.bookings.noBookings") || "No reschedule requests found"}</p>
                <p className="mt-1 text-xs text-[#a88a9f] max-w-xs">
                  {t("manager.bookings.noBookingsDesc") || "There are no requests matching your criteria at this moment."}
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[900px] table-fixed text-left">
                <colgroup>
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[200px]" />
                  <col className="w-[180px]" />
                  <col className="w-[120px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#f5e2ec] bg-[#fff8fb] text-[11px] font-bold text-[#a88a9f] uppercase tracking-wider">
                    <th className="px-5 py-3.5">{t("manager.bookings.customer")}</th>
                    <th className="px-5 py-3.5">{language === "vi" ? "Lịch hẹn hiện tại" : "Current Schedule"}</th>
                    <th className="px-5 py-3.5">{t("manager.bookings.rescheduleTime")}</th>
                    <th className="px-5 py-3.5">{language === "vi" ? "Trạng thái & Lý do" : "Status & Reason"}</th>
                    <th className="px-5 py-3.5 text-center">{t("manager.common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7e7ee]">
                  {filteredBookings.map((b) => {
                    const initials = b.customerName
                      ? b.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "CU";
                    const isPending = b.status === "ReschedulePending";

                    const actionMenuItems = [
                      {
                        key: "approve",
                        label: (
                          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                            <CheckCircle size={14} />
                            {language === "vi" ? "Phê duyệt" : "Approve"}
                          </span>
                        ),
                        onClick: () => openApproveModal(b),
                      },
                      {
                        key: "suggest",
                        label: (
                          <span className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
                            <Clock size={14} />
                            {language === "vi" ? "Đề xuất giờ khác" : "Suggest new time"}
                          </span>
                        ),
                        onClick: () => openSuggestModal(b),
                      },
                      { type: "divider" },
                      {
                        key: "reject",
                        label: (
                          <span className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                            <XCircle size={14} />
                            {language === "vi" ? "Từ chối" : "Reject"}
                          </span>
                        ),
                        onClick: () => openRejectModal(b),
                      },
                    ];

                    return (
                      <tr key={b.id} className="transition-colors hover:bg-[#fffcfd]">
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffc5de] to-[#ea4f93] text-xs font-bold text-white shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-[#2d1b35]">{b.customerName}</p>
                              {b.phone && <p className="text-[10px] text-[#a88a9f] mt-0.5">{b.phone}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-xs text-[#5c4559]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-[#ea4f93]" />
                              <span className="font-semibold">{formatDate(b.bookingDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-[#a88a9f]" />
                              <span>{formatTime(b.startTime)}</span>
                            </div>
                            <p className="text-[10px] text-[#a88a9f] mt-0.5">{t("manager.payments.services") || "Service"}: {b.serviceName || "Nail Service"}</p>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-xs">
                          <div className="flex flex-col gap-1 rounded-xl bg-indigo-50/50 border border-indigo-100 p-2.5">
                            <div className="flex items-center gap-1.5 text-indigo-700">
                              <CalendarDays size={12} />
                              <span className="font-bold">{formatDate(b.suggestedDate || b.bookingDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-600">
                              <Clock size={12} />
                              <span>{formatTime(b.suggestedTime || b.startTime)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div>
                            {isPending ? (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                {t("manager.common.actions") || "Pending Action"}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                                {t("manager.dashboard.statusWaiting") || "Awaiting Customer"}
                              </span>
                            )}

                            {(b.reason || b.rescheduleReason || b.note) && (
                              <div className="mt-2 flex items-start gap-1 text-[11px] text-[#7f6478]">
                                <FileText size={11} className="mt-0.5 shrink-0 text-[#a88a9f]" />
                                <span className="italic break-words line-clamp-3">
                                  "{b.reason || b.rescheduleReason || b.note}"
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle text-center">
                          {isPending ? (
                            <Dropdown menu={{ items: actionMenuItems }} trigger={["click"]} placement="bottomRight">
                              <button
                                onClick={(e) => e.preventDefault()}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#f1e7ed] bg-white text-[#7f6478] transition-colors hover:border-[#f0b7cf] hover:bg-[#fff7fb] hover:text-[#ea4f93]"
                                aria-label="Booking actions"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </Dropdown>
                          ) : (
                            <span className="text-[11px] text-[#a88a9f] italic">Manager suggested alternative time</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </motion.div>

      {/* Approve / Reject Confirmation Modal */}
      <Modal
        open={isConfirmModalOpen}
        onCancel={() => !isActionLoading && setIsConfirmModalOpen(false)}
        footer={null}
        closable={false}
        centered
        width={400}
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "hidden" },
          mask: { backdropFilter: "blur(4px)" },
        }}
      >
        {confirmAction && (
          <div>
            {/* Accent header bar */}
            <div
              className={`h-1.5 w-full ${confirmAction.type === "approve"
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : "bg-gradient-to-r from-rose-400 to-rose-600"
                }`}
            />
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-4 ${confirmAction.type === "approve" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                >
                  {confirmAction.type === "approve" ? <CheckCircle size={26} /> : <AlertTriangle size={26} />}
                </motion.div>
                <h3 className="text-base font-extrabold text-[#2d1b35]">
                  {confirmAction.type === "approve" ? "Approve Reschedule" : "Reject Reschedule"}
                </h3>
                <p className="mt-1.5 text-xs text-[#a88a9f] leading-relaxed max-w-[280px]">
                  {confirmAction.type === "approve"
                    ? "The booking will be moved to the customer's requested time. This cannot be undone."
                    : "The customer will be notified that their reschedule request was declined."}
                </p>
              </div>

              {/* Booking summary card */}
              <div className="mt-5 rounded-2xl border border-[#f1e7ed] bg-[#fbfafc] p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffc5de] to-[#ea4f93] text-white">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#2d1b35]">{confirmAction.booking?.customerName}</p>
                    <p className="text-[10px] text-[#a88a9f]">{confirmAction.booking?.serviceName || "Nail Service"}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-white border border-[#f1e7ed] px-2.5 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#c8b0bf]">Current</p>
                    <p className="mt-0.5 font-semibold text-[#5c4559]">
                      {formatDate(confirmAction.booking?.bookingDate)}
                    </p>
                    <p className="text-[#a88a9f]">{formatTime(confirmAction.booking?.startTime)}</p>
                  </div>
                  <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 px-2.5 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-400">Requested</p>
                    <p className="mt-0.5 font-semibold text-indigo-700">
                      {formatDate(confirmAction.booking?.suggestedDate || confirmAction.booking?.bookingDate)}
                    </p>
                    <p className="text-indigo-500">
                      {formatTime(confirmAction.booking?.suggestedTime || confirmAction.booking?.startTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  disabled={isActionLoading}
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="h-10 flex-1 rounded-xl border border-[#f1e7ed] bg-white text-xs font-bold text-[#7f6478] hover:bg-[#fff9fb] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isActionLoading}
                  onClick={handleConfirmAction}
                  className={`h-10 flex-1 rounded-xl text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 ${confirmAction.type === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/15"
                    }`}
                >
                  {isActionLoading ? "Processing..." : confirmAction.type === "approve" ? "Confirm Approve" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Suggest Time Modal */}
      <Modal
        open={isSuggestModalOpen}
        onCancel={() => !isActionLoading && setIsSuggestModalOpen(false)}
        footer={null}
        closable={!isActionLoading}
        centered
        width={460}
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "hidden" },
          mask: { backdropFilter: "blur(4px)" },
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#fff3f8] via-[#fffafb] to-[#fff5fb] px-6 py-5 border-b border-[#f5e2ec]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_8px_18px_rgba(234,79,147,0.3)]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-[#2d1b35]">Suggest Alternative Time</p>
              <p className="text-[11px] text-[#a88a9f]">
                for {selectedBookingForSuggest?.customerName || "this booking"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <Form form={suggestForm} layout="vertical" onFinish={handleSuggestSubmit}>
            <Form.Item
              name="suggestedDate"
              label={<span className="text-xs font-bold text-[#7f6478]">Suggested Date</span>}
              rules={[{ required: true, message: "Please select a date" }]}
            >
              <DatePicker className="h-10 w-full rounded-xl border border-[#f3d7e4] text-xs" minDate={dayjs()} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item
              name="suggestedTime"
              label={
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-[#7f6478]">Suggested Time</span>
                  {selectedSuggestedTime && (
                    <span className="text-[11px] font-bold text-[#ea4f93]">
                      {formatTime(`${selectedSuggestedTime}:00`)}
                    </span>
                  )}
                </div>
              }
              rules={[{ required: true, message: "Please select a time slot" }]}
            >
              <TimeSlotSelector />
            </Form.Item>

            <Form.Item
              name="reason"
              label={<span className="text-xs font-bold text-[#7f6478]">Reason for suggestion</span>}
              rules={[{ required: true, message: "Please provide a reason" }]}
            >
              <Input.TextArea
                rows={3}
                maxLength={200}
                showCount
                placeholder="e.g. Salon is fully booked at requested slot, suggesting a later hour."
                className="rounded-xl border border-[#f3d7e4] text-xs placeholder:text-[#c8b0bf]"
              />
            </Form.Item>

            <div className="mt-5 flex justify-end gap-3 border-t border-[#f5e2ec] pt-4">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setIsSuggestModalOpen(false)}
                className="h-10 px-4 rounded-xl border border-[#f1e7ed] bg-white text-xs font-bold text-[#7f6478] hover:bg-[#fff9fb] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] text-xs font-bold text-white shadow-md shadow-[#ea4f93]/20 hover:opacity-90 disabled:opacity-60"
              >
                {isActionLoading ? "Submitting..." : "Send Suggestion"}
              </button>
            </div>
          </Form>
        </div>
      </Modal>
    </section>
  );
}