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

export function SalonOffDatesManager({ salonId }) {
  const [offDates, setOffDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { language } = useLanguage();
  const isVi = language === "vi";

  // Form State
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
      setFormData({
        startDate: "",
        endDate: "",
        description: "",
      });
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
    
    // Convert local datetime to UTC for API
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

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#2d1b35] flex items-center gap-2">
            <CalendarX2 size={24} className="text-[#ea4f93]" />
            {isVi ? "Lịch nghỉ Salon" : "Salon Off Dates"}
          </h2>
          <p className="text-[13px] text-[#a88a9f]">{isVi ? "Quản lý các ngày nghỉ của salon." : "Manage your salon's registered days off."}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-full bg-[#fde7ef] px-4 py-2 text-[13px] font-bold text-[#ea4f93] transition-colors hover:bg-[#ea4f93] hover:text-white"
        >
          <Plus size={16} />
          {isVi ? "Thêm lịch nghỉ" : "Add Off Date"}
        </motion.button>
      </div>

      <PremiumCard noHover>
        {isLoading ? (
          <div className="py-8 text-center text-[#a88a9f]">{isVi ? "Đang tải..." : "Loading..."}</div>
        ) : offDates.length === 0 ? (
          <div className="py-8 text-center text-[#a88a9f]">{isVi ? "Không có lịch nghỉ nào." : "No off dates registered."}</div>
        ) : (
          <div className="space-y-3">
            {offDates.map((off) => (
              <div
                key={off.salonOffDateId || off.id}
                className="flex items-center justify-between rounded-[16px] bg-[#fff8fb] px-5 py-4 transition-colors hover:bg-[#fde7ef]/50"
              >
                <div>
                  <p className="text-[14px] font-bold text-[#2d1b35]">
                    {new Date(off.startDate).toLocaleDateString()} {new Date(off.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                    {" - "} 
                    {new Date(off.endDate).toLocaleDateString()} {new Date(off.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {off.description && (
                    <p className="mt-1 text-[13px] text-[#a88a9f]">{off.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(off)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#ea4f93] shadow-sm transition-colors hover:bg-[#ea4f93] hover:text-white"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(off.salonOffDateId || off.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition-colors hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl"
            >
              <button
                onClick={handleCloseModal}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#fde7ef] text-[#ea4f93] transition-colors hover:bg-[#ea4f93] hover:text-white"
              >
                <X size={16} />
              </button>

              <h3 className="mb-6 text-[20px] font-bold text-[#2d1b35]">
                {currentOffDate ? (isVi ? "Chỉnh sửa lịch nghỉ" : "Edit Off Date") : (isVi ? "Thêm lịch nghỉ" : "Add Off Date")}
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-[#a88a9f]">{isVi ? "Thời gian bắt đầu" : "Start Date & Time"}</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] px-4 py-3 text-[14px] font-medium text-[#2d1b35] outline-none transition-all focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-[#a88a9f]">{isVi ? "Thời gian kết thúc" : "End Date & Time"}</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] px-4 py-3 text-[14px] font-medium text-[#2d1b35] outline-none transition-all focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-[#a88a9f]">{isVi ? "Mô tả" : "Description"}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder={isVi ? "Ví dụ: Nghỉ lễ, Sửa chữa..." : "E.g., Holiday, Renovation..."}
                    className="w-full resize-none rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] px-4 py-3 text-[14px] font-medium text-[#2d1b35] outline-none transition-all focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#d6376f] py-3 text-[14px] font-bold text-white shadow-lg disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                  ) : (
                    <>
                      <Save size={18} />
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
