import { useState, useEffect } from "react";
import { Clock3, Pencil, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { updateManagerSalonOperatingHours } from "../services/managerSalonService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const DAYS_OF_WEEK = [
  { key: 0, label: "Sunday", labelVi: "Chủ nhật" },
  { key: 1, label: "Monday", labelVi: "Thứ hai" },
  { key: 2, label: "Tuesday", labelVi: "Thứ ba" },
  { key: 3, label: "Wednesday", labelVi: "Thứ tư" },
  { key: 4, label: "Thursday", labelVi: "Thứ năm" },
  { key: 5, label: "Friday", labelVi: "Thứ sáu" },
  { key: 6, label: "Saturday", labelVi: "Thứ bảy" },
];

function PremiumCard({ className = "", children, noHover = false }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-lg border border-[#f1e7ed] bg-white p-6 shadow-[0_8px_30px_rgba(234,79,147,0.05)] transition-all duration-300 ${!noHover ? "hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(234,79,147,0.08)]" : ""} ${className}`}
    >
      {children}
    </motion.article>
  );
}

const defaultHours = DAYS_OF_WEEK.map((day) => ({
  dayOfWeek: day.key,
  dayName: day.label,
  openTime: "08:00:00",
  closeTime: "20:00:00",
  isClosed: false,
}));

export function SalonOperatingHoursManager({ salonId, initialHours, onReload }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hoursData, setHoursData] = useState([]);

  const { language } = useLanguage();
  const isVi = language === "vi";

  useEffect(() => {
    if (initialHours && initialHours.length > 0) {
      setHoursData(initialHours);
    } else {
      setHoursData(defaultHours);
    }
  }, [initialHours]);

  const getDayInfo = (dayOfWeek) => {
    return hoursData.find((h) => h.dayOfWeek === dayOfWeek) || defaultHours.find((h) => h.dayOfWeek === dayOfWeek);
  };

  const handleHourChange = (dayOfWeek, field, value) => {
    setHoursData((prev) =>
      prev.map((h) => {
        if (h.dayOfWeek === dayOfWeek) {
          if (field === "isClosed") {
            return { ...h, isClosed: value };
          }
          const timeVal = value.length === 5 ? `${value}:00` : value;
          return { ...h, [field]: timeVal };
        }
        return h;
      })
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = hoursData.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime || "00:00:00",
        closeTime: h.closeTime || "00:00:00",
        isClosed: h.isClosed,
      }));

      await updateManagerSalonOperatingHours(salonId, payload);
      toast.success(isVi ? "Cập nhật giờ hoạt động thành công." : "Operating hours updated successfully.");
      setIsEditing(false);
      if (onReload) onReload();
    } catch (error) {
      toast.error(error.message || (isVi ? "Lỗi khi cập nhật giờ hoạt động." : "Failed to update operating hours."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (initialHours && initialHours.length > 0) {
      setHoursData(initialHours);
    } else {
      setHoursData(defaultHours);
    }
  };

  const formatTime = (time) => {
    if (!time) return "--:--";
    return time.slice(0, 5);
  };

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-[#2d1b35]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0f6]">
              <Clock3 size={18} className="text-[#ea4f93]" />
            </div>
            {isVi ? "Giờ hoạt động" : "Operating Hours"}
          </h2>
          {/* <p className="mt-1.5 pl-11.5 text-[13px] text-[#a88a9f]">
            {isVi ? "Quản lý lịch làm việc hàng tuần cho salon." : "Manage the weekly schedule for your salon."}
          </p> */}
        </div>

        {!isEditing ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 self-start rounded-full border border-[#ea4f93] bg-[#fde7ef] px-4 py-2 text-[13px] font-bold text-[#ea4f93] transition-colors hover:bg-[#ea4f93] hover:text-white sm:self-auto"
          >
            <Pencil size={15} />
            {isVi ? "Chỉnh sửa" : "Edit Hours"}
          </motion.button>
        ) : (
          <div className="flex gap-2 self-start sm:self-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-full border border-[#f1e7ed] bg-white px-4 py-2 text-[13px] font-bold text-[#a88a9f] transition-colors hover:bg-[#fff8fb] hover:text-[#ea4f93]"
            >
              <X size={15} />
              {isVi ? "Hủy" : "Cancel"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#d63a7f] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-70"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save size={15} />
              )}
              {isVi ? "Lưu" : "Save"}
            </motion.button>
          </div>
        )}
      </div>

      <PremiumCard noHover>
        <div className="divide-y divide-[#f3e8ed]">
          {DAYS_OF_WEEK.map((day) => {
            const info = getDayInfo(day.key);

            return (
              <div key={day.key} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                {/* Day name */}
                <div className="min-w-[110px]">
                  <span className="text-[14px] font-semibold text-[#2d1b35]">
                    {isVi ? day.labelVi : day.label}
                  </span>
                </div>

                {/* Content */}
                {!isEditing ? (
                  info.isClosed ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fff1f1] px-3 py-1 text-[12px] font-semibold text-[#d64545]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                      {isVi ? "Đóng cửa" : "Closed"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 text-[14px] font-medium text-[#2d1b35]">
                      <Clock3 size={14} className="text-[#ea4f93]" />
                      <span>{formatTime(info.openTime)}</span>
                      <span className="text-[#b9a3b0]">–</span>
                      <span>{formatTime(info.closeTime)}</span>
                    </div>
                  )
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Closed toggle */}
                    <button
                      type="button"
                      onClick={() => handleHourChange(day.key, "isClosed", !info.isClosed)}
                      className="group flex items-center gap-2.5"
                    >
                      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-200 ${info.isClosed ? "bg-[#ea4f93]" : "bg-[#e8dce3]"}`}>
                        <span className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${info.isClosed ? "translate-x-6" : "translate-x-1"}`} />
                      </span>
                      <span className={`text-[13px] font-medium transition-colors ${info.isClosed ? "text-[#ea4f93]" : "text-[#a88a9f]"}`}>
                        {isVi ? "Đóng cửa" : "Closed"}
                      </span>
                    </button>

                    {/* Time inputs */}
                    {!info.isClosed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={formatTime(info.openTime)}
                          onChange={(e) => handleHourChange(day.key, "openTime", e.target.value)}
                          className="rounded-xl border border-[#f0e3e9] bg-[#fffafd] px-3 py-1.5 text-[13px] font-medium text-[#2d1b35] outline-none transition-colors hover:border-[#efb8d0] focus:border-[#ea4f93]"
                        />
                        <span className="text-[13px] font-medium text-[#b9a3b0]">{isVi ? "đến" : "to"}</span>
                        <input
                          type="time"
                          value={formatTime(info.closeTime)}
                          onChange={(e) => handleHourChange(day.key, "closeTime", e.target.value)}
                          className="rounded-xl border border-[#f0e3e9] bg-[#fffafd] px-3 py-1.5 text-[13px] font-medium text-[#2d1b35] outline-none transition-colors hover:border-[#efb8d0] focus:border-[#ea4f93]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PremiumCard>
    </div>
  );
}