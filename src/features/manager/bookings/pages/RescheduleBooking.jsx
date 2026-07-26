import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
  ChevronLeft,
  CalendarDays,
  FileText,
  AlertCircle
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Alert, DatePicker, Modal, Input, Form } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import toast from "react-hot-toast";

import { loadAuthSession } from "../../../core/auth/model/authStorage";
import {
  fetchBookingsBySalonId,
  managerApproveReschedule,
  managerRejectReschedule,
  managerSuggestTime,
  fetchUserById
} from "../services/bookingsService";
import { TimePicker } from "../../../../shared/components/ui/TimePicker";

const getManagerSalonId = () => {
  const session = loadAuthSession();
  return session?.user?.salonId || session?.salonId;
};

// Formatting helpers
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

export function RescheduleBooking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve' | 'reject', bookingId: string }
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Suggest modal state
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedBookingForSuggest, setSelectedBookingForSuggest] = useState(null);
  const [suggestForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const salonId = getManagerSalonId();
      if (!salonId) {
        throw new Error("No salon ID found in session.");
      }

      // Fetch all bookings for this salon
      const result = await fetchBookingsBySalonId(salonId, { pageNumber: 1, pageSize: 1000 });
      let allBookings = [];
      if (result?.items) {
        allBookings = result.items;
      } else if (Array.isArray(result)) {
        allBookings = result;
      }

      // Filter: only keep ReschedulePending and RescheduleSuggested
      const filtered = allBookings.filter(
        (b) => b.status === "ReschedulePending" || b.status === "RescheduleSuggested"
      );

      // Fetch customer details for each booking if customer data is missing phone
      const enrichedBookings = await Promise.all(
        filtered.map(async (b) => {
          let phone = b.customerPhone || b.phone || b.customer?.phone || b.customer?.phoneNumber || "";
          let email = b.customerEmail || b.email || b.customer?.email || "";
          const customerName = b.customerName || (b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : "Unknown Customer");

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

  // Handle Approve / Reject Reschedule
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsActionLoading(true);
    const { type, bookingId } = confirmAction;

    try {
      if (type === "approve") {
        await managerApproveReschedule(bookingId);
        toast.success("Reschedule request approved successfully!");
      } else {
        await managerRejectReschedule(bookingId);
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

  // Open approve confirmation modal
  const openApproveModal = (bookingId) => {
    setConfirmAction({ type: "approve", bookingId });
    setIsConfirmModalOpen(true);
  };

  // Open reject confirmation modal
  const openRejectModal = (bookingId) => {
    setConfirmAction({ type: "reject", bookingId });
    setIsConfirmModalOpen(true);
  };

  // Open suggest new time modal
  const openSuggestModal = (booking) => {
    setSelectedBookingForSuggest(booking);
    suggestForm.setFieldsValue({
      suggestedDate: booking.suggestedDate ? dayjs(booking.suggestedDate) : dayjs(booking.bookingDate),
      suggestedTime: booking.suggestedTime ? booking.suggestedTime.slice(0, 5) : booking.startTime?.slice(0, 5) || "09:00",
      reason: "",
    });
    setIsSuggestModalOpen(true);
  };

  // Submit suggestion
  const handleSuggestSubmit = async (values) => {
    if (!selectedBookingForSuggest) return;
    setIsActionLoading(true);

    try {
      const formattedDate = values.suggestedDate.format("YYYY-MM-DD");
      // Add seconds if not present
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

  // Filters logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.phone?.includes(searchQuery) ||
        b.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.id && String(b.id).toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" || b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "ReschedulePending").length;
    const suggested = bookings.filter((b) => b.status === "RescheduleSuggested").length;

    return { total, pending, suggested };
  }, [bookings]);

  return (
    <section className="flex min-h-[100dvh] flex-col gap-6 bg-[#f9fafb] p-4 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <article className="relative overflow-hidden rounded-[28px] border-none bg-gradient-to-br from-[#fff3f8] via-[#fffafb] to-[#fff5fb] p-6 shadow-[0_20px_40px_-15px_rgba(234,79,147,0.12)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_10px_24px_rgba(234,79,147,0.35)]">
                <Clock size={26} />
              </div>
              <div>
                <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#ea4f93] shadow-[0_6px_14px_rgba(234,79,147,0.08)] backdrop-blur">
                  Manager portal
                </span>
                <h1 className="text-2xl font-extrabold text-[#2d1b35] mt-1.5 tracking-tight">Reschedule Requests</h1>
                <p className="text-xs text-[#a88a9f] mt-0.5">Approve, reject, or suggest new times for customer reschedule requests</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 w-full lg:w-[450px]">
              {[
                { label: "Total Requests", value: stats.total, color: "text-[#2d1b35] bg-white" },
                { label: "Pending Manager", value: stats.pending, color: "text-[#db8520] bg-[#fffcf5] border-[#fdeacc]" },
                { label: "Awaiting Customer", value: stats.suggested, color: "text-[#6366f1] bg-[#f5f6ff] border-[#e0e3ff]" },
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
              {/* Status Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "All", label: "All Requests", count: bookings.length },
                  { value: "ReschedulePending", label: "Pending Actions", count: stats.pending },
                  { value: "RescheduleSuggested", label: "Awaiting Customer", count: stats.suggested },
                ].map((tab) => {
                  const isActive = statusFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setStatusFilter(tab.value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                        isActive
                          ? "border-[#ea4f93] bg-[#ea4f93] text-white shadow-[0_10px_20px_rgba(234,79,147,0.22)]"
                          : "border-[#f3d7e4] bg-white text-[#7f6478] hover:border-[#f0b7cf] hover:bg-[#fff7fb] hover:text-[#ea4f93]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          isActive ? "bg-white/20 text-white" : "bg-[#fff0f6] text-[#c86d98]"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-full lg:w-72">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a88a9f]"
                />
                <input
                  type="text"
                  placeholder="Search customer, phone, service..."
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
                <p className="mt-4 text-xs font-semibold text-[#a88a9f]">Loading reschedule requests...</p>
              </div>
            ) : error ? (
              <div className="p-6">
                <Alert message="Error" description={error} type="error" showIcon />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f8] text-[#ea4f93] mb-4">
                  <CalendarDays size={24} />
                </div>
                <p className="text-sm font-bold text-[#5b4256]">No reschedule requests found</p>
                <p className="mt-1 text-xs text-[#a88a9f] max-w-xs">There are no requests matching your criteria at this moment.</p>
              </div>
            ) : (
              <table className="w-full min-w-[900px] table-fixed text-left">
                <colgroup>
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[200px]" />
                  <col className="w-[180px]" />
                  <col className="w-[160px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#f5e2ec] bg-[#fff8fb] text-[11px] font-bold text-[#a88a9f] uppercase tracking-wider">
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Current Schedule</th>
                    <th className="px-5 py-3.5">Reschedule Request</th>
                    <th className="px-5 py-3.5">Status & Reason</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7e7ee]">
                  {filteredBookings.map((b) => {
                    const initials = b.customerName
                      ? b.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "CU";
                    const isPending = b.status === "ReschedulePending";

                    return (
                      <tr key={b.id} className="transition-colors hover:bg-[#fffcfd]">
                        {/* Customer Column */}
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

                        {/* Current Schedule Column */}
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
                            <p className="text-[10px] text-[#a88a9f] mt-0.5">Service: {b.serviceName || "Nail Service"}</p>
                          </div>
                        </td>

                        {/* Reschedule Request Column */}
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

                        {/* Status & Reason Column */}
                        <td className="px-5 py-4 align-top">
                          <div>
                            {isPending ? (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                Pending Action
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                                Awaiting Customer
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

                        {/* Actions Column */}
                        <td className="px-5 py-4 align-middle text-center">
                          {isPending ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => openApproveModal(b.id)}
                                className="flex h-8 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
                              >
                                <CheckCircle size={14} />
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(b.id)}
                                className="flex h-8 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm"
                              >
                                <XCircle size={14} />
                                Reject
                              </button>
                              <button
                                onClick={() => openSuggestModal(b)}
                                className="flex h-8 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
                              >
                                <Clock size={14} />
                                Suggest
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#a88a9f] italic">
                              Manager suggested alternative time
                            </span>
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

      {/* Confirmation Modal */}
      <Modal
        open={isConfirmModalOpen}
        onCancel={() => !isActionLoading && setIsConfirmModalOpen(false)}
        footer={null}
        closable={!isActionLoading}
        centered
        width={380}
        styles={{
          content: { padding: 0, borderRadius: 24, overflow: "hidden" },
          mask: { backdropFilter: "blur(4px)" },
        }}
      >
        <div className="p-6 text-center">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4 ${
              confirmAction?.type === "approve" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}
          >
            {confirmAction?.type === "approve" ? <CheckCircle size={24} /> : <XCircle size={24} />}
          </div>
          <h3 className="text-base font-extrabold text-[#2d1b35]">
            {confirmAction?.type === "approve" ? "Approve Reschedule" : "Reject Reschedule"}
          </h3>
          <p className="mt-2 text-xs text-[#a88a9f] leading-relaxed">
            Are you sure you want to {confirmAction?.type} this booking reschedule request? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              disabled={isActionLoading}
              onClick={() => setIsConfirmModalOpen(false)}
              className="h-10 min-w-[90px] rounded-xl border border-[#f1e7ed] bg-white text-xs font-bold text-[#7f6478] hover:bg-[#fff9fb] transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isActionLoading}
              onClick={handleConfirmAction}
              className={`h-10 min-w-[90px] rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                confirmAction?.type === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
              }`}
            >
              {isActionLoading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Suggest Time Modal */}
      <Modal
        open={isSuggestModalOpen}
        onCancel={() => !isActionLoading && setIsSuggestModalOpen(false)}
        footer={null}
        closable={!isActionLoading}
        centered
        width={420}
        styles={{
          content: { padding: 24, borderRadius: 24 },
          mask: { backdropFilter: "blur(4px)" },
        }}
        title={
          <div className="flex items-center gap-2 border-b border-[#f5e2ec] pb-3">
            <CalendarDays size={18} className="text-[#ea4f93]" />
            <span className="text-sm font-black text-[#2d1b35]">Suggest Alternative Time</span>
          </div>
        }
      >
        <Form form={suggestForm} layout="vertical" onFinish={handleSuggestSubmit} className="mt-4">
          <Form.Item
            name="suggestedDate"
            label={<span className="text-xs font-bold text-[#7f6478]">Suggested Date</span>}
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker
              className="h-10 w-full rounded-xl border border-[#f3d7e4] text-xs"
              minDate={dayjs()}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="suggestedTime"
            label={<span className="text-xs font-bold text-[#7f6478]">Suggested Time</span>}
            rules={[{ required: true, message: "Please select a time" }]}
          >
            <TimePicker className="h-10 w-full rounded-xl border border-[#f3d7e4] text-xs" format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="reason"
            label={<span className="text-xs font-bold text-[#7f6478]">Reason for suggestion</span>}
            rules={[{ required: true, message: "Please provide a reason" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g. Salon is fully booked at requested slot, suggesting a later hour."
              className="rounded-xl border border-[#f3d7e4] text-xs placeholder:text-[#c8b0bf]"
            />
          </Form.Item>

          <div className="mt-6 flex justify-end gap-3 border-t border-[#f5e2ec] pt-4">
            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => setIsSuggestModalOpen(false)}
              className="h-10 px-4 rounded-xl border border-[#f1e7ed] bg-white text-xs font-bold text-[#7f6478] hover:bg-[#fff9fb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="h-10 px-5 rounded-xl bg-[#ea4f93] text-xs font-bold text-white shadow-md shadow-[#ea4f93]/15 hover:bg-[#d93a7e]"
            >
              {isActionLoading ? "Submitting..." : "Send Suggestion"}
            </button>
          </div>
        </Form>
      </Modal>
    </section>
  );
}
