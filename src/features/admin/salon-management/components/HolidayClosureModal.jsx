import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "antd";
import { Calendar, X, ChevronLeft } from "lucide-react";
import { Form, Select, Input } from "antd";

const COLORS = [
  "#fbbf24", // amber-400
  "#f97316", // orange-500
  "#3b82f6", // blue-500
  "#14b8a6", // teal-500
  "#6366f1", // indigo-500
  "#a855f7", // violet-500
  "#ef4444", // red-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#8b5cf6", // purple-500
];

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

const MonthCard = ({ monthIndex, year, color, onClick, selected }) => {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const firstDay = getFirstDayOfMonth(year, monthIndex);
  const days = [];

  // Add empty cells for days before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`cursor-pointer rounded-[20px] border-2 p-4 transition-all duration-300 ${
        selected
          ? "border-amber-500 bg-amber-50 shadow-md"
          : "border-amber-100 bg-white hover:border-amber-300"
      }`}
      style={{ borderColor: selected ? color : undefined }}
    >
      <h4
        className="mb-3 text-center text-xs font-extrabold uppercase tracking-wider"
        style={{ color }}
      >
        {MONTH_NAMES[monthIndex]}
      </h4>
      <div className="grid grid-cols-7 gap-1 text-[10px]">
        {WEEK_DAYS.map((day, i) => (
          <div
            key={i}
            className="text-center font-bold text-slate-400"
          >
            {day}
          </div>
        ))}
        {days.map((day, i) => (
          <div
            key={i}
            className={`text-center ${
              day !== null ? "font-semibold text-slate-700" : "text-transparent"
            }`}
            style={{ color: day === 1 ? "#dc2626" : undefined }}
          >
            {day}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const MonthView = ({ monthIndex, year, color, onBack, onSelectDay, selectedDays = [] }) => {
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
          className="flex items-center gap-1 text-xs font-extrabold text-amber-700 hover:text-amber-900"
        >
          <ChevronLeft size={16} />
          Back to Year
        </motion.button>
        <h3
          className="text-lg font-extrabold"
          style={{ color }}
        >
          {MONTH_NAMES[monthIndex]} {year}
        </h3>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEK_DAYS.map((day, i) => (
          <div
            key={i}
            className="text-center text-xs font-extrabold text-amber-600"
          >
            {day}
          </div>
        ))}
        {days.map((day, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => day && onSelectDay(day)}
            disabled={day === null}
            className={`aspect-square rounded-xl text-sm font-bold transition-all ${
              day === null
                ? "invisible"
                : selectedDays.includes(day)
                ? "bg-amber-500 text-white shadow-md"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            {day}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

const YearCalendar = ({ year, onSelectMonth, selectedMonthIndex }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-5xl font-extrabold text-slate-800 tracking-tight">
        {year}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {MONTH_NAMES.map((_, index) => (
          <MonthCard
            key={index}
            monthIndex={index}
            year={year}
            color={COLORS[index % COLORS.length]}
            onClick={() => onSelectMonth(index)}
            selected={selectedMonthIndex === index}
          />
        ))}
      </div>
    </div>
  );
};

export default function HolidayClosureModal({
  open,
  onCancel,
  salonOptions,
}) {
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [currentYear] = useState(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [form] = Form.useForm();

  const handleSelectDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <Modal
      open={open}
      centered
      onCancel={onCancel}
      footer={null}
      closable={false}
      width={800}
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
      <div className="flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 text-white bg-[linear-gradient(135deg,#f59e0b_0%,#ea580c_100%)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/16 text-white">
                <Calendar size={20} />
              </div>
              <div>
                <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] bg-white/18 text-white">
                  Schedule
                </span>
                <h3 className="mt-3 text-lg font-black">Holiday Closure</h3>
                <p className="mt-1 text-sm text-white/78">
                  Schedule temporary salon closures
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <div className="rounded-[22px] border border-amber-100 bg-[#fffaf2] p-4">
              <Form form={form} layout="vertical">
                <Form.Item label="Select Salon" className="mb-3">
                  <Select
                    placeholder="Choose a salon..."
                    options={salonOptions}
                    showSearch
                    optionFilterProp="label"
                    className="w-full"
                    value={selectedSalonId}
                    onChange={setSelectedSalonId}
                  />
                </Form.Item>

                {selectedSalonId && (
                  <div className="space-y-3">
                    <AnimatePresence mode="wait">
                      {selectedMonthIndex === null ? (
                        <YearCalendar
                          key="year"
                          year={currentYear}
                          selectedMonthIndex={selectedMonthIndex}
                          onSelectMonth={setSelectedMonthIndex}
                        />
                      ) : (
                        <MonthView
                          key="month"
                          monthIndex={selectedMonthIndex}
                          year={currentYear}
                          color={COLORS[selectedMonthIndex % COLORS.length]}
                          selectedDays={selectedDays}
                          onBack={() => setSelectedMonthIndex(null)}
                          onSelectDay={handleSelectDay}
                        />
                      )}
                    </AnimatePresence>

                    {selectedDays.length > 0 && (
                      <div className="mt-4 rounded-[16px] bg-amber-50 p-3">
                        <p className="text-xs font-bold text-amber-800 mb-2">
                          Selected Days:
                        </p>
                        <p className="text-sm text-amber-700">
                          {selectedDays.sort((a, b) => a - b).join(", ")}
                        </p>
                      </div>
                    )}

                    <Form.Item label="Reason" className="mb-0 mt-4">
                      <Input placeholder="e.g., Christmas Holiday" />
                    </Form.Item>
                  </div>
                )}
              </Form>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-amber-700 transition hover:bg-amber-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onCancel();
              form.resetFields();
              setSelectedDays([]);
              setSelectedMonthIndex(null);
              setSelectedSalonId(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-500 bg-[linear-gradient(135deg,#f59e0b_0%,#ea580c_100%)] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_16px_28px_rgba(234,88,12,0.18)] transition hover:opacity-95"
          >
            <Calendar size={14} />
            Schedule Closure
          </button>
        </div>
      </div>
    </Modal>
  );
}
