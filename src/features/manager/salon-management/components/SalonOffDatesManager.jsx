import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, CalendarX2, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  fetchManagerSalonOffDates,
  createManagerSalonOffDate,
  updateManagerSalonOffDate,
  deleteManagerSalonOffDate,
} from "../services/managerSalonService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { Tooltip } from "antd";

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

export function SalonOffDatesManager({ salonId }) {
  const [offDates, setOffDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { language } = useLanguage();
  const isVi = language === "vi";

  const [currentOffDate, setCurrentOffDate] = useState(null);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    description: "",
  });

  const loadData = async () => {
    if (!salonId) return;
    try {
      setIsLoading(true);
      const data = await fetchManagerSalonOffDates(salonId);
      setOffDates(data || []);
    } catch (error) {
      toast.error(error.message || (isVi ? "Lỗi khi tải lịch nghỉ." : "Failed to load off dates."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salonId]);

  const handleOpenModal = (offDate = null) => {
    if (offDate) {
      setCurrentOffDate(offDate);
      setFormData({
        startDate: offDate.startDate ? new Date(offDate.startDate).toISOString().slice(0, 16) : "",
        endDate: offDate.endDate ? new Date(offDate.endDate).toISOString().slice(0, 16) : "",
        description: offDate.description || "",
      });
    } else {
      setCurrentOffDate(null);
      setFormData({ startDate: "", endDate: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentOffDate(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.startDate || !formData.endDate) {
      toast.error(isVi ? "Vui lòng chọn ngày bắt đầu và kết thúc." : "Please select start and end dates.");
      return;
    }

    const startUTC = new Date(formData.startDate).toISOString();
    const endUTC = new Date(formData.endDate).toISOString();

    const payload = {
      startDate: startUTC,
      endDate: endUTC,
      description: formData.description,
    };

    try {
      setIsSaving(true);
      if (currentOffDate) {
        await updateManagerSalonOffDate(currentOffDate.salonOffDateId || currentOffDate.id, payload);
        toast.success(isVi ? "Cập nhật lịch nghỉ thành công." : "Off date updated successfully.");
      } else {
        await createManagerSalonOffDate(salonId, payload);
        toast.success(isVi ? "Thêm lịch nghỉ thành công." : "Off date added successfully.");
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      toast.error(error.message || (isVi ? "Lỗi khi lưu lịch nghỉ." : "Failed to save off date."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isVi ? "Bạn có chắc chắn muốn xóa lịch nghỉ này không?" : "Are you sure you want to delete this off date?")) return;
    try {
      await deleteManagerSalonOffDate(id);
      toast.success(isVi ? "Xóa lịch nghỉ thành công." : "Off date deleted successfully.");
      loadData();
    } catch (error) {
      toast.error(error.message || (isVi ? "Lỗi khi xóa lịch nghỉ." : "Failed to delete off date."));
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-[#2d1b35]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0f6]">
              <CalendarX2 size={18} className="text-[#ea4f93]" />
            </div>
            {isVi ? "Lịch nghỉ Salon" : "Salon Off Dates"}
          </h2>

        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 self-start rounded-full border border-[#ea4f93] bg-[#fde7ef] px-4 py-2 text-[13px] font-bold text-[#ea4f93] transition-colors hover:bg-[#ea4f93] hover:text-white sm:self-auto"
        >
          <Plus size={15} />
          {isVi ? "Thêm lịch nghỉ" : "Add Off Date"}
        </motion.button>
      </div>

      <PremiumCard noHover>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#a88a9f]">
            <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#ea4f93]/30 border-t-[#ea4f93]" />
            <p className="text-[13px] font-medium">{isVi ? "Đang tải..." : "Loading..."}</p>
          </div>
        ) : offDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f6]">
              <CalendarX2 size={22} className="text-[#ea4f93]" />
            </div>
            <p className="text-[14px] font-semibold text-[#2d1b35]">
              {isVi ? "Chưa có lịch nghỉ" : "No off dates yet"}
            </p>
            <p className="mt-1 text-[13px] text-[#a88a9f]">
              {isVi ? "Thêm lịch nghỉ để tạm dừng nhận booking." : "Add off dates to temporarily pause bookings."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f3e8ed]">
            {offDates.map((off) => (
              <div
                key={off.salonOffDateId || off.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-semibold text-[#2d1b35]">
                    <span>{formatDateTime(off.startDate)}</span>
                    <span className="text-[#b9a3b0]">→</span>
                    <span>{formatDateTime(off.endDate)}</span>
                  </div>
                  {off.description && (
                    <p className="mt-1.5 truncate text-[13px] text-[#a88a9f]">{off.description}</p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Tooltip title={isVi ? "Sửa" : "Edit"}>
                    <button
                      onClick={() => handleOpenModal(off)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f1e7ed] bg-white text-[#ea4f93] transition-colors hover:border-[#ea4f93] hover:bg-[#ea4f93] hover:text-white"
                    >
                      <Pencil size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip title={isVi ? "Xóa" : "Delete"}>
                    <button
                      onClick={() => handleDelete(off.salonOffDateId || off.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f1e7ed] bg-white text-[#d64545] transition-colors hover:border-[#d64545] hover:bg-[#d64545] hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#f1e7ed] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
            >
              <button
                onClick={handleCloseModal}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0f6] text-[#ea4f93] transition-colors hover:bg-[#ea4f93] hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="mb-6">
                <h3 className="text-[17px] font-bold text-[#2d1b35]">
                  {currentOffDate
                    ? isVi ? "Chỉnh sửa lịch nghỉ" : "Edit Off Date"
                    : isVi ? "Thêm lịch nghỉ" : "Add Off Date"}
                </h3>
                <p className="mt-1 text-[13px] text-[#a88a9f]">
                  {isVi ? "Chọn khoảng thời gian salon tạm dừng hoạt động." : "Select the period the salon will be closed."}
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
                    {isVi ? "Thời gian bắt đầu" : "Start Date & Time"}
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-[#f0e3e9] bg-[#fffafd] px-4 py-2.5 text-[14px] font-medium text-[#2d1b35] outline-none transition-colors hover:border-[#efb8d0] focus:border-[#ea4f93]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
                    {isVi ? "Thời gian kết thúc" : "End Date & Time"}
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-[#f0e3e9] bg-[#fffafd] px-4 py-2.5 text-[14px] font-medium text-[#2d1b35] outline-none transition-colors hover:border-[#efb8d0] focus:border-[#ea4f93]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
                    {isVi ? "Mô tả" : "Description"}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder={isVi ? "Ví dụ: Nghỉ lễ, Sửa chữa..." : "E.g., Holiday, Renovation..."}
                    className="w-full resize-none rounded-xl border border-[#f0e3e9] bg-[#fffafd] px-4 py-2.5 text-[14px] font-medium text-[#2d1b35] outline-none transition-colors hover:border-[#efb8d0] focus:border-[#ea4f93]"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#d63a7f] py-3 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <Save size={16} />
                      {isVi ? "Lưu" : "Save Off Date"}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}