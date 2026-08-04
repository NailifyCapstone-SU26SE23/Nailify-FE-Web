import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Form, Select, Spin } from "antd";
import { Clock3, X, ChevronLeft, ChevronRight, Sunrise, Sun, Moon, Check, AlertCircle } from "lucide-react";
import { fetchSalonById, updateSalonOperatingHours } from "../services/salonsService";

const TIME_SLOTS = {
  morning: {
    label: "Morning",
    icon: Sunrise,
    slots: [
      "07:00 - 07:30",
      "07:30 - 08:00",
      "08:00 - 08:30",
      "08:30 - 09:00",
      "09:00 - 09:30",
      "09:30 - 10:00",
      "10:00 - 10:30",
      "10:30 - 11:00",
      "11:00 - 11:30",
      "11:30 - 12:00",
    ],
  },
  afternoon: {
    label: "Afternoon",
    icon: Sun,
    slots: [
      "12:00 - 12:30",
      "12:30 - 13:00",
      "13:00 - 13:30",
      "13:30 - 14:00",
      "14:00 - 14:30",
      "14:30 - 15:00",
      "15:00 - 15:30",
      "15:30 - 16:00",
      "16:00 - 16:30",
      "16:30 - 17:00",
    ],
  },
  evening: {
    label: "Evening",
    icon: Moon,
    slots: [
      "17:00 - 17:30",
      "17:30 - 18:00",
      "18:00 - 18:30",
      "18:30 - 19:00",
      "19:00 - 19:30",
      "19:30 - 20:00",
      "20:00 - 20:30",
      "20:30 - 21:00",
    ],
  },
};

export default function SetOperatingHoursModal({
  open,
  onCancel,
  salonOptions,
}) {
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState({
    morning: [...TIME_SLOTS.morning.slots],
    afternoon: [...TIME_SLOTS.afternoon.slots],
    evening: [...TIME_SLOTS.evening.slots],
  });
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationModal, setNotificationModal] = useState(null);

  useEffect(() => {
    if (open && selectedSalonId) {
      void loadOperatingHours(selectedSalonId);
    } else if (!open) {
      setSelectedSalonId(null);
      setActivePeriod(null);
      setSelectedSlots({
        morning: [...TIME_SLOTS.morning.slots],
        afternoon: [...TIME_SLOTS.afternoon.slots],
        evening: [...TIME_SLOTS.evening.slots],
      });
      setNotificationModal(null);
    }
  }, [open, selectedSalonId]);

  const loadOperatingHours = async (salonId) => {
    if (!salonId) return;
    setIsLoadingHours(true);
    try {
      const salon = await fetchSalonById(salonId);
      const operatingHours = salon.operatingHours || [];

      // Find the first day that has operating hours, or default to Monday (1)
      const dayOfWeekToUse = 1;
      const dayRanges = operatingHours.filter(
        (item) => Number(item.dayOfWeek) === dayOfWeekToUse
      );

      // If no ranges exist, default to all open
      if (dayRanges.length === 0) {
        setSelectedSlots({
          morning: [...TIME_SLOTS.morning.slots],
          afternoon: [...TIME_SLOTS.afternoon.slots],
          evening: [...TIME_SLOTS.evening.slots],
        });
        return;
      }

      const newSelected = {
        morning: [...TIME_SLOTS.morning.slots],
        afternoon: [...TIME_SLOTS.afternoon.slots],
        evening: [...TIME_SLOTS.evening.slots],
      };

      // Helper to convert "HH:mm" or "HH:mm:ss" to minutes
      const toMin = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      dayRanges.forEach((range) => {
        if (range.isClosed) {
          const rStart = toMin(range.openTime);
          const rEnd = toMin(range.closeTime);

          // Remove overlapping slots
          Object.keys(newSelected).forEach((period) => {
            newSelected[period] = newSelected[period].filter((slot) => {
              const [sStartStr, sEndStr] = slot.split(" - ");
              const sStart = toMin(sStartStr);
              const sEnd = toMin(sEndStr);

              // Overlap check
              const isOverlapping = sStart < rEnd && sEnd > rStart;
              return !isOverlapping;
            });
          });
        }
      });

      setSelectedSlots(newSelected);
    } catch (error) {
      console.error("Failed to load salon operating hours", error);
    } finally {
      setIsLoadingHours(false);
    }
  };

  const handleToggleSlot = (period, slot) => {
    setSelectedSlots((prev) => {
      const current = prev[period];
      return {
        ...prev,
        [period]: current.includes(slot)
          ? current.filter((s) => s !== slot)
          : [...current, slot],
      };
    });
  };

  const handleUpdateHours = async () => {
    if (!selectedSalonId) return;
    setIsSubmitting(true);
    try {
      const allSlots = [
        ...TIME_SLOTS.morning.slots,
        ...TIME_SLOTS.afternoon.slots,
        ...TIME_SLOTS.evening.slots,
      ];

      const slotStatuses = allSlots.map((slot) => {
        const [start, end] = slot.split(" - ");
        let isOpen = false;
        if (TIME_SLOTS.morning.slots.includes(slot)) {
          isOpen = selectedSlots.morning.includes(slot);
        } else if (TIME_SLOTS.afternoon.slots.includes(slot)) {
          isOpen = selectedSlots.afternoon.includes(slot);
        } else if (TIME_SLOTS.evening.slots.includes(slot)) {
          isOpen = selectedSlots.evening.includes(slot);
        }

        return {
          start,
          end,
          isClosed: !isOpen,
        };
      });

      const ranges = [];
      let currentRange = null;

      for (const slot of slotStatuses) {
        if (!currentRange) {
          currentRange = { ...slot };
        } else if (currentRange.isClosed === slot.isClosed) {
          currentRange.end = slot.end;
        } else {
          ranges.push(currentRange);
          currentRange = { ...slot };
        }
      }
      if (currentRange) {
        ranges.push(currentRange);
      }

      // Payload for days 0 to 6
      const payload = [];
      for (let day = 0; day <= 6; day++) {
        for (const r of ranges) {
          payload.push({
            dayOfWeek: day,
            openTime: r.start,
            closeTime: r.end,
            isClosed: r.isClosed,
          });
        }
      }

      await updateSalonOperatingHours(selectedSalonId, payload);

      setNotificationModal({
        type: "success",
        message: "Operating hours updated successfully.",
      });

      // Auto-close success modal after 2 seconds
      setTimeout(() => {
        setNotificationModal(null);
        onCancel(); // Close the set operating hours modal
      }, 2000);
    } catch (error) {
      console.error(error);
      setNotificationModal({
        type: "error",
        message: error.message || "Failed to update operating hours.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      centered
      onCancel={onCancel}
      footer={null}
      closable={false}
      width={480}
      styles={{
        body: { padding: 0 },
        content: { padding: 0, overflow: "hidden", borderRadius: 28 },
        mask: {
          backgroundColor: "rgba(47, 13, 33, 0.26)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <div>
        <div className="px-6 py-5 text-white bg-[linear-gradient(135deg,#ec4899_0%,#db2777_100%)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/16 text-white">
                <Clock3 size={20} />
              </div>
              <div>
                <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] bg-white/18 text-white">
                  Hours
                </span>
                <h3 className="mt-3 text-lg font-bold">Set Operating Hours</h3>
                <p className="mt-1 text-sm text-white/78">
                  Update opening and closing hours for a salon
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="rounded-[20px] border border-rose-100 bg-[#fff7fb] p-3">
            <Form layout="vertical">
              <Form.Item label="Select Salon" className="mb-3">
                <Select
                  placeholder="Choose a salon..."
                  options={salonOptions}
                  showSearch
                  optionFilterProp="label"
                  className="w-full"
                  value={selectedSalonId}
                  onChange={(value) => setSelectedSalonId(value)}
                />
              </Form.Item>

              {!selectedSalonId && (
                <div className="mb-3 flex items-center gap-2 rounded-[14px] bg-[#fef3c7] px-4 py-3 text-[11px] font-semibold text-[#92400e]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.588c.571 1.014-.15 2.298-1.295 2.298H3.033C1.888 16.985 1.167 15.701 1.738 14.687L8.257 3.099zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-7a1 1 0 00-1 1v2a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Please select a salon first!
                </div>
              )}

              <Spin spinning={isLoadingHours} tip="Loading operating hours...">
                <AnimatePresence mode="wait">
                  {!activePeriod ? (
                    <motion.div
                      key="period-selector"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      <h4 className="text-[13px] font-bold text-[#2d1b35] mb-2">
                        Select Time Period
                      </h4>
                      {Object.entries(TIME_SLOTS).map(
                        ([key, { label, icon: Icon }]) => (
                          <motion.button
                            key={key}
                            whileHover={selectedSalonId ? { scale: 1.02 } : {}}
                            whileTap={selectedSalonId ? { scale: 0.98 } : {}}
                            type="button"
                            onClick={() => {
                              if (selectedSalonId) {
                                setActivePeriod(key);
                              }
                            }}
                            disabled={!selectedSalonId}
                            className={`w-full flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition-all ${selectedSalonId
                                ? "border-[#f0b7cf] bg-white hover:bg-[#fff9fb] hover:border-[#ea4f93]"
                                : "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                              }`}
                          >
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center ${selectedSalonId
                                  ? "bg-gradient-to-r from-[#fde7ef] to-[#fff5fb] text-[#ea4f93]"
                                  : "bg-slate-200 text-slate-400"
                                }`}
                            >
                              <Icon size={18} />
                            </div>
                            <div className="flex-1">
                              <h5
                                className={`text-[13px] font-extrabold ${selectedSalonId
                                    ? "text-[#2d1b35]"
                                    : "text-slate-400"
                                  }`}
                              >
                                {label}
                              </h5>
                              <p className="text-[10px] text-[#a88a9f]">
                                {key === "morning" && "07:00 - 12:00"}
                                {key === "afternoon" && "12:00 - 17:00"}
                                {key === "evening" && "17:00 - 21:00"}
                              </p>
                            </div>
                            <ChevronRight
                              size={14}
                              className={
                                selectedSalonId
                                  ? "text-[#a88a9f]"
                                  : "text-slate-300"
                              }
                            />
                          </motion.button>
                        )
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="slots-view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setActivePeriod(null)}
                          className="h-8 w-8 rounded-full border border-[#f0b7cf] bg-white flex items-center justify-center text-[#ea4f93] transition-all hover:bg-[#fff9fb]"
                        >
                          <ChevronLeft size={14} />
                        </motion.button>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = TIME_SLOTS[activePeriod].icon;
                            return <Icon size={18} className="text-[#ea4f93]" />;
                          })()}
                          <h4 className="text-[14px] font-extrabold text-[#2d1b35]">
                            {TIME_SLOTS[activePeriod].label} Slots
                          </h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {TIME_SLOTS[activePeriod].slots.map((slot) => (
                          <motion.button
                            key={slot}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => handleToggleSlot(activePeriod, slot)}
                            className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold transition-all ${selectedSlots[activePeriod].includes(slot)
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-400 border border-gray-200"
                              }`}
                          >
                            <Clock3 size={14} />
                            {slot}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Spin>
            </Form>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#f5e3ed] bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting || isLoadingHours}
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-[#f5cbdc] bg-white px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#b95d88] transition hover:bg-[#fff5f8] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || isLoadingHours || !selectedSalonId}
            onClick={handleUpdateHours}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ec4899_0%,#db2777_100%)] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_16px_28px_rgba(219,39,119,0.18)] transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Spin size="small" className="mr-1" />
            ) : (
              <Clock3 size={14} />
            )}
            {isSubmitting ? "Updating..." : "Update Hours"}
          </button>
        </div>

        {/* Custom success/error overlay */}
        <AnimatePresence>
          {notificationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
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

                {notificationModal.type !== "success" && (
                  <button
                    type="button"
                    onClick={() => setNotificationModal(null)}
                    className="mt-6 w-full rounded-full py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md bg-[#d14c84] shadow-[0_12px_24px_rgba(209,76,132,0.25)] transition-all active:scale-[0.98]"
                  >
                    Close
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}