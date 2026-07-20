import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "antd";
import { Calendar, X, ChevronLeft, Check, AlertCircle, Clock, CalendarCheck2, History, Trash2, CalendarDays, Pencil, PenOff } from "lucide-react";
import { Form, Select, Input, message } from "antd";
import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../../../core/auth/model/authStorage";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

// Month tile for the year view. Deliberately shows only the month name —
// twelve full mini day-grids at once was the source of the clutter, and the
// per-month rainbow coloring didn't encode any real information.
const MonthCard = ({ monthIndex, year, onClick, selected, hasSelectedDays }) => {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  const todayStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const targetMonthStart = new Date(year, monthIndex, 1);
  const isPastMonth = targetMonthStart < todayStart;

  return (
    <motion.button
      type="button"
      whileHover={!isPastMonth ? { y: -3 } : undefined}
      whileTap={!isPastMonth ? { scale: 0.97 } : undefined}
      onClick={onClick}
      disabled={isPastMonth}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-5 text-center transition-all duration-200 ${
        selected
          ? "border-[#ea4f93] bg-[#fff0f6] shadow-[0_10px_20px_rgba(235,90,153,0.12)]"
          : isPastMonth
          ? "border-[#f5eef2] bg-[#fcf9fb] opacity-45 cursor-not-allowed"
          : "border-[#f5e3ed] bg-white hover:border-[#eba2c6] hover:bg-[#fffbfc]"
      }`}
    >
      {isCurrentMonth && (
        <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[#ea4f93]" title="Current month" />
      )}
      <span className="nailify-display text-lg font-semibold text-[#3f2034]">
        {MONTH_NAMES[monthIndex]}
      </span>
      {hasSelectedDays && (
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#c9799f]">
          Days selected
        </span>
      )}
    </motion.button>
  );
};

const MonthView = ({ monthIndex, year, onBack, onSelectDay, selectedDays = [] }) => {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const firstDay = getFirstDayOfMonth(year, monthIndex);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-extrabold text-[#c95b90] hover:text-[#ea4f93]"
        >
          <ChevronLeft size={16} />
          Back to Year
        </motion.button>
        <h3 className="nailify-display text-xl font-semibold text-[#3f2034]">
          {MONTH_NAMES[monthIndex]} {year}
        </h3>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEK_DAYS.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-extrabold uppercase text-[#c9799f]">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) {
            return (
              <button key={i} disabled className="aspect-square invisible" />
            );
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const targetDate = new Date(year, monthIndex, day);
          targetDate.setHours(0, 0, 0, 0);
          const isPast = targetDate < today;

          return (
            <motion.button
              key={i}
              type="button"
              whileHover={!isPast ? { scale: 1.08 } : undefined}
              whileTap={!isPast ? { scale: 0.92 } : undefined}
              onClick={() => onSelectDay(day)}
              disabled={isPast}
              className={`aspect-square rounded-xl text-sm font-bold transition-all ${
                selectedDays.includes(day)
                  ? "bg-[#ea4f93] text-white shadow-[0_6px_14px_rgba(235,90,153,0.28)]"
                  : isPast
                  ? "bg-[#f5ebf1] text-[#bda3b3] cursor-not-allowed opacity-50"
                  : "bg-[#fff6fa] text-[#7a5b6e] hover:bg-[#ffe3f0]"
              }`}
            >
              {day}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

const YearCalendar = ({ year, onSelectMonth, selectedMonthIndex, selectedDays }) => {
  return (
    <div className="space-y-4">
      <h2 className="nailify-display text-center text-4xl font-semibold text-[#3f2034]">
        {year}
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {MONTH_NAMES.map((_, index) => (
          <MonthCard
            key={index}
            monthIndex={index}
            year={year}
            onClick={() => onSelectMonth(index)}
            selected={selectedMonthIndex === index}
            hasSelectedDays={selectedMonthIndex === index && selectedDays.length > 0}
          />
        ))}
      </div>
    </div>
  );
};

function getAuthHeaders() {
  const session = loadAuthSession();
  const token = session?.accessToken || session?.token;
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

// --- Ledger helpers -------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Classifies a closure relative to "today" so the ledger can visually
// separate what's live/upcoming from what's already over.
const getClosureStatus = (startStr, endStr) => {
  const today = startOfDay(new Date());
  const start = startOfDay(startStr);
  const end = startOfDay(endStr);

  if (today > end) return "past";
  if (today >= start && today <= end) return "ongoing";
  return "upcoming";
};

const STATUS_META = {
  ongoing: {
    label: "Ongoing",
    icon: Clock,
    dot: "bg-[#16975f]",
    badge: "bg-[#e8fdf2] text-[#16975f]",
    ring: "ring-2 ring-[#bdf0d6]",
  },
  upcoming: {
    label: "Upcoming",
    icon: CalendarCheck2,
    dot: "bg-[#ea4f93]",
    badge: "bg-[#fff0f6] text-[#c95b90]",
    ring: "",
  },
  past: {
    label: "Ended",
    icon: History,
    dot: "bg-[#d9c3d0]",
    badge: "bg-[#f6eef3] text-[#a6869a]",
    ring: "",
  },
};

const formatDateRange = (startStr, endStr) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const options = { day: "numeric", month: "short", year: "numeric" };
  const startFormatted = start.toLocaleDateString("en-US", options);
  const endFormatted = end.toLocaleDateString("en-US", options);
  return startFormatted === endFormatted ? startFormatted : `${startFormatted} - ${endFormatted}`;
};

const formatDayCount = (startStr, endStr) => {
  const start = startOfDay(startStr);
  const end = startOfDay(endStr);
  const days = Math.round((end - start) / MS_PER_DAY) + 1;
  return days <= 1 ? "1 day" : `${days} days`;
};

export default function HolidayClosureModal({
  open,
  onCancel,
  salonOptions,
}) {
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationModal, setNotificationModal] = useState(null);
  const [form] = Form.useForm();
  const scrollRef = useRef(null);

  const baseYear = new Date().getFullYear();
  const yearOptions = [
    { value: baseYear, label: String(baseYear) },
    { value: baseYear + 1, label: String(baseYear + 1) },
    { value: baseYear + 2, label: String(baseYear + 2) },
  ];

  const [offDatesList, setOffDatesList] = useState([]);
  const [isLoadingOffDates, setIsLoadingOffDates] = useState(false);
  const [editingClosureId, setEditingClosureId] = useState(null);
  // Tracks the id currently being deleted so only that row shows a spinner —
  // the rest of the ledger stays interactive instead of graying out entirely.
  const [deletingId, setDeletingId] = useState(null);
  // The closure pending a delete confirmation, shown in a custom on-brand
  // dialog rather than antd's generic Modal.confirm.
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);

  const editingClosure = editingClosureId
    ? offDatesList.find((item) => (item.salonOffDateId || item.id) === editingClosureId)
    : null;

  const handleSelectDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleClearSelectedDays = () => {
    setSelectedDays([]);
  };

  const fetchOffDates = async (salonId) => {
    if (!salonId) {
      setOffDatesList([]);
      return;
    }
    setIsLoadingOffDates(true);
    try {
      const response = await axiosClient.get(`/SalonOffDates/salons/${salonId}`, {
        headers: getAuthHeaders(),
      });
      const data = response?.data?.data ?? response?.data ?? [];
      setOffDatesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch salon off dates:", err);
    } finally {
      setIsLoadingOffDates(false);
    }
  };

  const deleteOffDate = async (id) => {
    try {
      setDeletingId(id);
      await axiosClient.delete(`/SalonOffDates/${id}`, {
        headers: getAuthHeaders(),
      });
      setNotificationModal({
        type: "success",
        message: "Holiday closure removed successfully.",
      });
      setOffDatesList((prev) => prev.filter((item) => (item.salonOffDateId || item.id) !== id));
      if (editingClosureId === id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || "Failed to remove holiday closure.";
      setNotificationModal({
        type: "error",
        message: errMsg,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Confirms before deleting — the old version removed a closure the instant
  // "Remove" was clicked, which is an easy misclick with no way back.
  const handleDeleteOffDate = (offDate) => {
    setConfirmDeleteTarget(offDate);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTarget) return;
    const id = confirmDeleteTarget.salonOffDateId || confirmDeleteTarget.id;
    setConfirmDeleteTarget(null);
    await deleteOffDate(id);
  };

  const handleEditOffDate = (offDate) => {
    const id = offDate.salonOffDateId || offDate.id;

    // Toggle off if the same row's Edit button is clicked again.
    if (editingClosureId === id) {
      handleCancelEdit();
      return;
    }

    setEditingClosureId(id);

    const start = new Date(offDate.startDate);
    const end = new Date(offDate.endDate);

    const year = start.getUTCFullYear();
    const month = start.getUTCMonth();

    setCurrentYear(year);
    setSelectedMonthIndex(month);

    const days = [];
    let current = new Date(Date.UTC(year, month, start.getUTCDate()));
    const limit = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    while (current <= limit) {
      days.push(current.getUTCDate());
      current.setUTCDate(current.getUTCDate() + 1);
    }

    setSelectedDays(days);
    form.setFieldsValue({ reason: offDate.description || "" });

    // Scroll the panel back to the calendar/form so the loaded closure is
    // immediately visible instead of leaving the user looking at the ledger
    // with no obvious sign anything changed.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleCancelEdit = () => {
    setEditingClosureId(null);
    form.resetFields();
    setSelectedDays([]);
    setSelectedMonthIndex(null);
  };

  useEffect(() => {
    if (selectedSalonId) {
      void fetchOffDates(selectedSalonId);
    } else {
      setOffDatesList([]);
    }
    // Switching salons mid-edit would apply changes to the wrong salon's
    // closure, so drop out of edit mode whenever the salon changes.
    handleCancelEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSalonId]);

  useEffect(() => {
    if (notificationModal?.type === "success") {
      const timer = setTimeout(() => {
        setNotificationModal(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notificationModal]);

  const handleScheduleClosure = async () => {
    if (!selectedSalonId) {
      message.error("Please select a salon first.");
      return;
    }
    if (selectedDays.length === 0) {
      message.error("Please select at least one day off.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasPastDay = selectedDays.some((day) => {
      const d = new Date(currentYear, selectedMonthIndex, day);
      d.setHours(0, 0, 0, 0);
      return d < today;
    });

    if (hasPastDay) {
      message.error("Cannot schedule closures for days in the past.");
      return;
    }

    try {
      const values = await form.validateFields();
      const reason = values.reason || "";

      setIsSubmitting(true);

      if (editingClosureId) {
        // Delete the old closure first so we can schedule the new ones
        await axiosClient.delete(`/SalonOffDates/${editingClosureId}`, {
          headers: getAuthHeaders(),
        });
      }

      // Group selected days into contiguous ranges
      const ranges = [];
      const sortedDays = [...selectedDays].sort((a, b) => a - b);
      let start = sortedDays[0];
      let end = sortedDays[0];

      for (let i = 1; i < sortedDays.length; i++) {
        if (sortedDays[i] === end + 1) {
          end = sortedDays[i];
        } else {
          ranges.push({ start, end });
          start = sortedDays[i];
          end = sortedDays[i];
        }
      }
      ranges.push({ start, end });

      // Call API for each range in parallel
      const requests = ranges.map((range) => {
        const startDate = new Date(Date.UTC(currentYear, selectedMonthIndex, range.start, 0, 0, 0)).toISOString();
        const endDate = new Date(Date.UTC(currentYear, selectedMonthIndex, range.end, 23, 59, 59)).toISOString();

        return axiosClient.post(
          `/SalonOffDates/salons/${selectedSalonId}`,
          {
            startDate,
            endDate,
            description: reason,
          },
          {
            headers: getAuthHeaders(),
          }
        );
      });

      await Promise.all(requests);

      // Show success modal
      setNotificationModal({
        type: "success",
        message: editingClosureId
          ? "Holiday closure updated successfully."
          : "Holiday closure scheduled successfully for the selected dates.",
      });

      // Reset form and state
      setEditingClosureId(null);
      form.resetFields();
      setSelectedDays([]);
      setSelectedMonthIndex(null);
      void fetchOffDates(selectedSalonId);
    } catch (err) {
      console.error(err);
      if (err.name !== "FieldsValidationError") {
        const errMsg = err.response?.data?.message || err.message || "Failed to schedule holiday closure.";
        setNotificationModal({
          type: "error",
          message: errMsg,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort chronologically, but ongoing/upcoming closures lead the list so the
  // most actionable information (what's affecting bookings right now or
  // soon) doesn't get buried under a long history of past closures.
  const sortedOffDates = [...offDatesList].sort((a, b) => {
    const statusRank = { ongoing: 0, upcoming: 1, past: 2 };
    const aStatus = getClosureStatus(a.startDate, a.endDate);
    const bStatus = getClosureStatus(b.startDate, b.endDate);
    if (statusRank[aStatus] !== statusRank[bStatus]) {
      return statusRank[aStatus] - statusRank[bStatus];
    }
    return new Date(a.startDate) - new Date(b.startDate);
  });

  return (
    <Modal
      open={open}
      centered
      onCancel={onCancel}
      footer={null}
      closable={false}
      width={720}
      styles={{
        body: { padding: 0 },
        content: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 28,
          maxHeight: "85vh",
        },
        mask: {
          backgroundColor: "rgba(47, 13, 33, 0.26)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <style>{`
        .nailify-display { font-family: "Cormorant Garamond", "Times New Roman", serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="flex flex-col max-h-[85vh] bg-[#fffbfc]">
        {/* Header — matches the brand accent gradient used across Nailify */}
        <div className="px-6 py-5 text-white bg-[image:var(--gradient-accent)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/18 text-white">
                <Calendar size={20} />
              </div>
              <div>
                <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] bg-white/20 text-white">
                  Schedule
                </span>
                <h3 className="nailify-display mt-3 text-2xl font-semibold">Holiday Closure</h3>
                <p className="mt-1 text-sm text-white/85">
                  Schedule temporary salon closures
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white transition hover:bg-white/25 disabled:opacity-50"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="no-scrollbar flex-1 overflow-y-auto px-6 py-5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="space-y-5">
            {/* Editing banner — makes it unmistakable that the form below is
                modifying an existing closure rather than creating a new one. */}
            <AnimatePresence>
              {editingClosureId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ea4f93]/30 bg-[#fff0f6] px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#ea4f93] shadow-sm">
                        <Pencil size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#c9799f]">
                          Editing closure
                        </p>
                        <p className="text-xs font-bold text-[#3f2034] truncate">
                          {editingClosure
                            ? formatDateRange(editingClosure.startDate, editingClosure.endDate)
                            : "Loading…"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#ea4f93]/30 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#c95b90] transition hover:bg-[#fff5f8]"
                    >
                      <PenOff size={11} />
                      Stop editing
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-[22px] border border-[#f5cbdc] bg-[#fff6fa] p-4">
              <Form form={form} layout="vertical">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Form.Item label="Select Salon" className="mb-3">
                    <Select
                      placeholder="Choose a salon..."
                      options={salonOptions}
                      showSearch
                      optionFilterProp="label"
                      className="w-full"
                      value={selectedSalonId}
                      onChange={setSelectedSalonId}
                      disabled={!!editingClosureId}
                    />
                  </Form.Item>

                  <Form.Item label="Select Year" className="mb-3">
                    <Select
                      options={yearOptions}
                      className="w-full"
                      value={currentYear}
                      onChange={setCurrentYear}
                      disabled={!!editingClosureId}
                    />
                  </Form.Item>
                </div>

                {selectedSalonId && (
                  <div className="space-y-3">
                    <AnimatePresence mode="wait">
                      {selectedMonthIndex === null ? (
                        <YearCalendar
                          key="year"
                          year={currentYear}
                          selectedMonthIndex={selectedMonthIndex}
                          selectedDays={selectedDays}
                          onSelectMonth={setSelectedMonthIndex}
                        />
                      ) : (
                        <MonthView
                          key="month"
                          monthIndex={selectedMonthIndex}
                          year={currentYear}
                          selectedDays={selectedDays}
                          onBack={() => setSelectedMonthIndex(null)}
                          onSelectDay={handleSelectDay}
                        />
                      )}
                    </AnimatePresence>

                    {selectedDays.length > 0 && (
                      <div className="rounded-2xl border border-[#f5cbdc] bg-white p-3.5">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#a6869a]">
                            Selected days — tap to remove
                          </p>
                          <button
                            type="button"
                            onClick={handleClearSelectedDays}
                            className="text-[10px] font-extrabold uppercase tracking-wider text-[#c9799f] hover:text-[#ea4f93]"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[...selectedDays].sort((a, b) => a - b).map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleSelectDay(day)}
                              className="inline-flex items-center gap-1 rounded-full bg-[#fff0f6] px-2.5 py-1 text-xs font-bold text-[#c95b90] transition hover:bg-[#ffe3f0]"
                            >
                              {MONTH_NAMES[selectedMonthIndex]?.slice(0, 3)} {day}
                              <X size={10} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Form.Item
                      label="Reason"
                      name="reason"
                      className="mb-0 mt-4"
                      rules={[{ required: true, message: "Please input a reason" }]}
                    >
                      <Input placeholder="e.g., Christmas Holiday" />
                    </Form.Item>
                  </div>
                )}
              </Form>
            </div>

            {/* Current closures ledger list */}
            {selectedSalonId && (
              <div className="rounded-[22px] border border-[#f5cbdc] bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="nailify-display text-lg font-semibold text-[#3f2034] flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff0f6] text-[11px] font-extrabold text-[#ea4f93]">
                      L
                    </span>
                    Scheduled Closures Ledger
                  </h4>
                  {offDatesList.length > 0 && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a6869a]">
                      {offDatesList.length} {offDatesList.length === 1 ? "entry" : "entries"}
                    </span>
                  )}
                </div>

                {isLoadingOffDates ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="animate-pulse rounded-2xl bg-[#fdf2f7] h-14" />
                    ))}
                  </div>
                ) : sortedOffDates.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-[#fdf2f7] space-y-3">
                    {sortedOffDates.map((offDate) => {
                      const id = offDate.salonOffDateId || offDate.id;
                      const status = getClosureStatus(offDate.startDate, offDate.endDate);
                      const meta = STATUS_META[status];
                      const StatusIcon = meta.icon;
                      const isDeleting = deletingId === id;
                      const isEditingThis = editingClosureId === id;

                      return (
                        <div
                          key={id}
                          className={`relative rounded-2xl p-3 transition-all ${
                            status === "past" && !isEditingThis ? "opacity-60" : ""
                          } ${isDeleting ? "opacity-40 pointer-events-none" : ""} ${
                            isEditingThis
                              ? "bg-[#fff0f6] ring-2 ring-[#ea4f93]/40"
                              : ""
                          }`}
                        >
                          {/* Timeline dot */}
                          <div
                            className={`absolute -left-[31px] top-4 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ${meta.dot} ${meta.ring}`}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-bold text-[#3f2034]">
                                  {formatDateRange(offDate.startDate, offDate.endDate)}
                                </p>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${meta.badge}`}
                                >
                                  <StatusIcon size={10} />
                                  {meta.label}
                                </span>
                                <span className="text-[10px] font-semibold text-[#a6869a]">
                                  {formatDayCount(offDate.startDate, offDate.endDate)}
                                </span>
                              </div>
                              {offDate.description && (
                                <p className="text-[11px] text-[#8c7484] mt-1 truncate">
                                  {offDate.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleEditOffDate(offDate)}
                                className={`inline-flex h-6 px-2.5 items-center justify-center gap-1 rounded-full border text-[10px] font-extrabold transition-colors disabled:opacity-50 ${
                                  isEditingThis
                                    ? "border-[#ea4f93] bg-[#ea4f93] text-white hover:bg-[#e0428a]"
                                    : "border-[#f5cbdc] bg-white text-[#b95d88] hover:bg-[#fff5f8]"
                                }`}
                              >
                                <Pencil size={10} />
                                {isEditingThis ? "Editing" : "Edit"}
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteOffDate(offDate)}
                                className="inline-flex h-6 px-2.5 items-center justify-center gap-1 rounded-full border border-[#ffe0e6] bg-white text-[10px] font-extrabold text-[#d14c84] hover:bg-[#fff0f3] active:scale-[0.98] transition-colors disabled:opacity-50"
                              >
                                {isDeleting ? "Removing..." : "Remove"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#a6869a] font-bold">
                    No holiday closures scheduled for this salon yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#f5e3ed] bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={editingClosureId ? handleCancelEdit : onCancel}
            className="inline-flex items-center justify-center rounded-full border border-[#f5cbdc] bg-white px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#b95d88] transition hover:bg-[#fff5f8] disabled:opacity-50"
          >
            {editingClosureId ? "Cancel Edit" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleScheduleClosure}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_16px_28px_rgba(235,90,153,0.2)] transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="h-3 w-3 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                {editingClosureId ? "Updating..." : "Scheduling..."}
              </>
            ) : (
              <>
                <Calendar size={14} />
                {editingClosureId ? "Update Closure" : "Schedule Closure"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delete confirmation — custom-built to match the brand look instead
          of antd's default Modal.confirm styling. */}
      <AnimatePresence>
        {confirmDeleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDeleteTarget(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#291723]/55 backdrop-blur-md p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-[#fcecf4] bg-white shadow-2xl"
            >
              {/* Soft rose header strip, echoing the modal's main gradient
                  header without competing with it */}
              <div className="relative flex flex-col items-center pt-8 pb-5 px-6 text-center bg-gradient-to-b from-[#fff0f6] to-white">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#d14c84] shadow-[0_10px_24px_rgba(209,76,132,0.22)] ring-8 ring-[#fff0f6]">
                  <Trash2 size={26} strokeWidth={2.2} />
                </div>
                <h4 className="nailify-display text-xl font-semibold text-[#3f2034]">
                  Remove this closure?
                </h4>
                <p className="mt-1.5 px-2 text-[13px] leading-relaxed text-[#8c7484]">
                  The salon will be bookable again on these dates.
                </p>
              </div>

              {/* Closure summary card */}
              <div className="mx-6 mb-6 rounded-2xl border border-[#f5e3ed] bg-[#fffbfc] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0f6] text-[#ea4f93]">
                    <CalendarDays size={16} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-[#3f2034]">
                      {formatDateRange(confirmDeleteTarget.startDate, confirmDeleteTarget.endDate)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#c9799f]">
                      {formatDayCount(confirmDeleteTarget.startDate, confirmDeleteTarget.endDate)}
                    </p>
                    {confirmDeleteTarget.description && (
                      <p className="mt-1.5 text-[12px] text-[#8c7484] truncate">
                        {confirmDeleteTarget.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTarget(null)}
                  className="flex-1 rounded-full border border-[#f5cbdc] bg-white py-2.5 text-xs font-black uppercase tracking-wider text-[#b95d88] transition hover:bg-[#fff5f8] active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-full bg-[#d14c84] py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_12px_24px_rgba(209,76,132,0.25)] transition hover:bg-[#c23e75] active:scale-[0.98]"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#291723]/50 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-[#fcecf4] bg-white p-6 shadow-2xl text-center"
            >
              {notificationModal.type === "success" ? (
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8fdf2] text-[#16975f] shadow-inner">
                  <Check size={28} strokeWidth={3} />
                </div>
              ) : (
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f3] text-[#d14c84] shadow-inner">
                  <AlertCircle size={28} strokeWidth={3} />
                </div>
              )}

              <h4 className="nailify-display text-xl font-semibold text-[#3f2034]">
                {notificationModal.type === "success" ? "Success" : "Something went wrong"}
              </h4>
              <p className="mt-2 px-2 text-sm leading-relaxed text-[#8c7484]">
                {notificationModal.message}
              </p>

              <button
                type="button"
                onClick={() => {
                  setNotificationModal(null);
                }}
                className={`mt-6 w-full rounded-full py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.98] ${
                  notificationModal.type === "success"
                    ? "bg-[#16975f] shadow-[0_12px_24px_rgba(22,151,95,0.25)]"
                    : "bg-[#d14c84] shadow-[0_12px_24px_rgba(209,76,132,0.25)]"
                }`}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}