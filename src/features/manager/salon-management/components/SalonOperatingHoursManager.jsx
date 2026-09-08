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
      className={`relative overflow-hidden rounded-[28px] border border-[#f1e7ed] bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.06)]" : ""} ${className}`}
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
          } else {
            // For time inputs like "08:00", append ":00" to match Timespan format if needed
            const timeVal = value.length === 5 ? `${value}:00` : value;
            return { ...h, [field]: timeVal };
          }
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
    return time.slice(0, 5); // returns HH:mm
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#2d1b35] flex items-center gap-2">
            <Clock3 size={24} className="text-[#ea4f93]" />
            {isVi ? "Giờ hoạt động" : "Operating Hours"}
          </h2>
          <p className="text-[13px] text-[#a88a9f]">{isVi ? "Quản lý lịch làm việc hàng tuần cho salon." : "Manage the weekly schedule for your salon."}</p>
        </div>
        {!isEditing ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-full bg-[#fde7ef] px-4 py-2 text-[13px] font-bold text-[#ea4f93] transition-colors hover:bg-[#ea4f93] hover:text-white"
          >
            <Pencil size={16} />
            {isVi ? "Chỉnh sửa" : "Edit Hours"}
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-full border border-[#f1e7ed] bg-white px-4 py-2 text-[13px] font-bold text-[#ea4f93] transition-colors hover:bg-[#fff8fb]"
            >
              <X size={16} />
              {isVi ? "Hủy" : "Cancel"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-colors hover:opacity-95 disabled:opacity-70"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              ) : (
                <Save size={16} />
              )}
              {isVi ? "Lưu" : "Save"}
            </motion.button>
          </div>
        )}
      </div>

      <PremiumCard noHover>
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const info = getDayInfo(day.key);

            return (
              <div
                key={day.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-[16px] bg-[#fff8fb] px-5 py-4 gap-4"
              >
                <div className="flex items-center gap-4 min-w-[120px]">
                  <span className="text-[14px] font-bold text-[#2d1b35]">{isVi ? day.labelVi : day.label}</span>
                </div>

                {!isEditing ? (
                  info.isClosed ? (
                    <span className="rounded-full bg-[#fdeceb] px-3 py-1 text-[11px] font-bold text-[#c94b4b]">
                      {isVi ? "Đóng cửa" : "Closed"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#a88a9f]">
                      <Clock3 size={14} className="text-[#ea4f93]" />
                      {formatTime(info.openTime)} - {formatTime(info.closeTime)}
                    </span>
                  )
                ) : (
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={info.isClosed}
                        onChange={(e) => handleHourChange(day.key, "isClosed", e.target.checked)}
                        className="h-4 w-4 rounded border-[#f1e7ed] text-[#ea4f93] focus:ring-[#ea4f93]"
                      />
                      <span className="text-[13px] font-medium text-[#a88a9f]">{isVi ? "Đóng cửa" : "Closed"}</span>
                    </label>

                    {!info.isClosed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={formatTime(info.openTime)}
                          onChange={(e) => handleHourChange(day.key, "openTime", e.target.value)}
                          className="rounded-[12px] border border-[#f1e7ed] bg-white px-3 py-1.5 text-[13px] font-medium text-[#2d1b35] outline-none focus:border-[#ea4f93]"
                        />
                        <span className="text-[13px] font-medium text-[#a88a9f]">{isVi ? "đến" : "to"}</span>
                        <input
                          type="time"
                          value={formatTime(info.closeTime)}
                          onChange={(e) => handleHourChange(day.key, "closeTime", e.target.value)}
                          className="rounded-[12px] border border-[#f1e7ed] bg-white px-3 py-1.5 text-[13px] font-medium text-[#2d1b35] outline-none focus:border-[#ea4f93]"
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
