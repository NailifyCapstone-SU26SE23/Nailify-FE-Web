import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Form, Select } from "antd";
import { Clock3, X, ChevronLeft, ChevronRight, Sunrise, Sun, Moon } from "lucide-react";

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
                <h3 className="mt-3 text-lg font-black">Set Operating Hours</h3>
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
                          className={`w-full flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition-all ${
                            selectedSalonId
                              ? "border-[#f0b7cf] bg-white hover:bg-[#fff9fb] hover:border-[#ea4f93]"
                              : "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center ${
                              selectedSalonId
                                ? "bg-gradient-to-r from-[#fde7ef] to-[#fff5fb] text-[#ea4f93]"
                                : "bg-slate-200 text-slate-400"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="flex-1">
                            <h5
                              className={`text-[13px] font-extrabold ${
                                selectedSalonId
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
                          className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold transition-all ${
                            selectedSlots[activePeriod].includes(slot)
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
            </Form>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-rose-500 transition hover:bg-rose-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-500 bg-[linear-gradient(135deg,#ec4899_0%,#db2777_100%)] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_16px_28px_rgba(219,39,119,0.18)] transition hover:opacity-95"
          >
            <Clock3 size={14} />
            Update Hours
          </button>
        </div>
      </div>
    </Modal>
  );
}