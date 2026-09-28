import { useEffect, useState, useRef } from "react";
import {
  MapPin,
  Phone,
  Percent,
  Clock3,
  Camera,
  Upload,
  X,
  Pencil,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { fetchManagerSalonDetail, updateManagerSalon, uploadManagerSalonImage } from "../services/managerSalonService";
import { useAuth } from "../../../core/auth/hooks/useAuth";
import { SalonOffDatesManager } from "../components/SalonOffDatesManager";
import { SalonOperatingHoursManager } from "../components/SalonOperatingHoursManager";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { Input, InputNumber } from "antd";

const SALON_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" rx="28" fill="#fde7ef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8f365c" font-family="Arial, sans-serif" font-size="30" font-weight="700">Salon</text></svg>'
)}`;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

function PremiumCard({ className = "", children, noHover = false, padded = true, allowOverflow = false }) {
  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={`relative ${allowOverflow ? "overflow-visible" : "overflow-hidden"} rounded-[28px] border border-[#f1e7ed] bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${padded ? "p-6" : ""} ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.06)]" : ""} ${className}`}
    >
      {children}
    </motion.article>
  );
}

function InfoItem({ icon: Icon, label, value, valueClassName = "text-[#2d1b35]" }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -2 }}
      className="group rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] p-5 transition-all duration-300 hover:border-[#f0b7cf] hover:bg-white hover:shadow-[0_12px_24px_-10px_rgba(234,79,147,0.18)]"
    >
      <div className="mb-3 flex items-center gap-2">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fde7ef] text-[#ea4f93] transition-colors duration-300 group-hover:bg-[#ea4f93] group-hover:text-white">
            <Icon size={14} />
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a88a9f]">
          {label}
        </span>
      </div>
      <p className={`text-[14px] font-medium break-all ${valueClassName}`}>{value}</p>
    </motion.div>
  );
}

export function ManagerSalonPage() {
  const { user } = useAuth();
  const salonId = user?.salonId;
  const [salon, setSalon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { language } = useLanguage();
  const isVi = language === "vi";

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    status: "Open",
    depositConfig: 0,
    latitude: 0,
    longitude: 0,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const loadData = async () => {
    if (!salonId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await fetchManagerSalonDetail(salonId);
      setSalon(data);
      setFormData({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        status: data.status || "Open",
        depositConfig: data.depositConfig || 0,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      });
      setPreviewImage(data.imageUrl || SALON_PLACEHOLDER_IMAGE);
    } catch (error) {
      toast.error(error.message || (isVi ? "Lỗi khi tải chi tiết salon." : "Failed to load salon details."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salonId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateManagerSalon(salonId, formData);
      if (selectedImage) {
        await uploadManagerSalonImage(salonId, selectedImage);
      }
      toast.success(isVi ? "Cập nhật salon thành công!" : "Salon updated successfully!");
      setIsEditing(false);
      loadData();
    } catch (error) {
      toast.error(error.message || (isVi ? "Lỗi khi cập nhật salon." : "Failed to update salon."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#ea4f93]" />
          <p className="mt-4 text-[14px] font-medium text-[#a88a9f]">{isVi ? "Đang tải thông tin chi tiết salon..." : "Loading salon details..."}</p>
        </div>
      </div>
    );
  }

  if (!salonId) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <p className="text-[14px] font-medium text-[#a88a9f]">{isVi ? "Không có salon được gán cho quản lý này." : "No salon assigned to this manager."}</p>
      </div>
    );
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto w-full min-w-0 p-6"
    >
      <header className="mb-6 flex flex-col gap-5">
        <motion.div variants={fadeInUp} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className=" text-[32px] font-bold text-[#3f2034]">{isVi ? "Quản lý salon" : "Salon Management"}</h1>
            <p className="mt-1 text-sm text-[#a6869a]">{isVi ? "Quản lý thông tin và cài đặt salon" : "Manage your salon details and settings"}</p>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#d6376f] px-6 py-2.5 text-[12px] font-bold text-white shadow-[0_12px_24px_rgba(234,79,147,0.32)] transition-all duration-300 hover:opacity-95"
              >
                <Pencil size={16} />
                {isVi ? "Chỉnh sửa salon" : "Edit Salon"}
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: salon.name || "",
                      address: salon.address || "",
                      phone: salon.phone || "",
                      status: salon.status || "Open",
                      depositConfig: salon.depositConfig || 0,
                      latitude: salon.latitude || 0,
                      longitude: salon.longitude || 0,
                    });
                    setPreviewImage(salon.imageUrl || SALON_PLACEHOLDER_IMAGE);
                    setSelectedImage(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f1e7ed] bg-white px-5 py-2.5 text-[12px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff8fb]"
                >
                  <X size={16} />
                  {isVi ? "Hủy" : "Cancel"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] px-6 py-2.5 text-[12px] font-bold text-white shadow-[0_12px_24px_rgba(16,185,129,0.32)] transition-all duration-300 hover:opacity-95 disabled:opacity-60"
                >
                  {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" /> : <Save size={16} />}
                  {isVi ? "Lưu thay đổi" : "Save Changes"}
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </header>

      <PremiumCard padded={false} allowOverflow className="mb-6">
        {/* Thay doi o day */}
        <div className="rounded-t-lg h-[140px] w-full bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center relative">
          <div className="rounded-t-lg absolute inset-0 bg-gradient-to-r from-[#eb5b92]/80 to-[#cf3d74]/80 mix-blend-multiply" />
        </div>
        <div className="rounded-lg bg-white px-8 pb-8">
          <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative">
              <img
                src={previewImage}
                alt={isVi ? "Ảnh salon" : "Salon"}
                className="h-32 w-32 shrink-0 rounded-full border-4 border-white bg-white object-cover shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#ea4f93] text-white shadow-lg transition-transform hover:scale-110">
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
            {!isEditing && (
              <div className="mb-2">
                <h2 className="text-[24px] font-bold tracking-tight text-[#2d1b35]">{salon?.name}</h2>
                <p className="text-[14px] font-medium text-[#a88a9f]">{salon?.address}</p>
              </div>
            )}
          </div>
        </div>
      </PremiumCard>

      {!isEditing ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="rounded-lg border border-[#f1e7ed] bg-white/80 p-6 shadow-[0_8px_30px_rgba(234,79,147,0.05)]"
        >
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {/* Address */}
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0f6]">
                <MapPin size={16} className="text-[#ea4f93]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#b095a8]">
                  {isVi ? "Địa chỉ" : "Address"}
                </p>
                <p className="mt-1 text-[14px] font-semibold leading-6 text-[#2d1b35]">
                  {salon?.address || "-"}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0f6]">
                <Phone size={16} className="text-[#ea4f93]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#b095a8]">
                  {isVi ? "Số điện thoại" : "Phone"}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[#2d1b35]">
                  {salon?.phone || "-"}
                </p>
              </div>
            </div>

            {/* Deposit */}
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0f6]">
                <Percent size={16} className="text-[#ea4f93]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#b095a8]">
                  {isVi ? "Cấu hình cọc" : "Deposit Config"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[18px] font-bold text-[#2d1b35]">
                    {((salon?.depositConfig || 0) * 100).toFixed(0)}%
                  </span>
                  <span className="rounded-full bg-[#fff0f6] px-2 py-0.5 text-[10px] font-semibold text-[#ea4f93]">
                    {isVi ? "Tiền cọc" : "Deposit"}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0f6]">
                <Clock3 size={16} className="text-[#ea4f93]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#b095a8]">
                  {isVi ? "Trạng thái" : "Status"}
                </p>
                <div className="mt-1">
                  {salon?.status === "Open" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf3] px-3 py-1 text-[12px] font-semibold text-[#168a4b]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                      {isVi ? "Hoạt động" : "Open"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1f1] px-3 py-1 text-[12px] font-semibold text-[#d64545]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                      {isVi ? "Đóng cửa" : "Closed"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <PremiumCard noHover>
          <div className="space-y-7">
            {/* Header */}
            <div>
              <h3 className="text-[16px] font-bold text-[#2d1b35]">
                {isVi ? "Thông tin chi nhánh" : "Salon Information"}
              </h3>
              <p className="mt-1.5 text-[13px] text-[#a88a9f]">
                {isVi
                  ? "Cập nhật thông tin và cấu hình hoạt động của chi nhánh."
                  : "Update salon information and operational settings."}
              </p>
            </div>

            {/* Basic Information */}
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
                  {isVi ? "Tên chi nhánh" : "Salon Name"}
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={isVi ? "Nhập tên chi nhánh" : "Enter salon name"}
                  size="large"
                  className="!rounded-[14px] !border-[#f0e3e9] !bg-[#fffafd] !px-4 !py-2.5 !text-[14px] !font-medium !text-[#2d1b35] !shadow-none hover:!border-[#efb8d0] focus:!border-[#ea4f93]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
                  {isVi ? "Số điện thoại" : "Phone"}
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={isVi ? "Nhập số điện thoại" : "Enter phone number"}
                  size="large"
                  prefix={<Phone size={16} className="mr-1 text-[#ea4f93]" />}
                  className="!rounded-[14px] !border-[#f0e3e9] !bg-[#fffafd] !px-4 !py-2.5 !text-[14px] !font-medium !text-[#2d1b35] !shadow-none hover:!border-[#efb8d0] focus:!border-[#ea4f93]"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
                  {isVi ? "Địa chỉ" : "Address"}
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={isVi ? "Nhập địa chỉ" : "Enter address"}
                  size="large"
                  prefix={<MapPin size={16} className="mr-1 text-[#ea4f93]" />}
                  className="!rounded-[14px] !border-[#f0e3e9] !bg-[#fffafd] !px-4 !py-2.5 !text-[14px] !font-medium !text-[#2d1b35] !shadow-none hover:!border-[#efb8d0] focus:!border-[#ea4f93]"
                />
              </div>
            </div>

            <div className="h-px bg-[#f3e8ed]" />

            {/* Settings */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
                    {isVi ? "Cấu hình cọc (%)" : "Deposit Config (%)"}
                  </label>
                  <span className="text-[15px] font-bold text-[#ea4f93]">
                    {Math.round((formData.depositConfig || 0) * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <InputNumber
                    min={0}
                    max={100}
                    value={Math.round((formData.depositConfig || 0) * 100)}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        depositConfig: (value || 0) / 100,
                      }))
                    }
                    addonAfter="%"
                    size="large"
                    className="!w-[110px] !rounded-[14px] !border-[#f0e3e9] !bg-[#fffafd]"
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={(formData.depositConfig || 0) * 100}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          depositConfig: Number(e.target.value) / 100,
                        }))
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#f1e6ec] accent-[#ea4f93]"
                    />
                    <div className="mt-1.5 flex justify-between text-[10px] font-medium text-[#b9a3b0]">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
                  {isVi ? "Trạng thái" : "Status"}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      status: prev.status === "Open" ? "Closed" : "Open",
                    }))
                  }
                  className="group flex items-center gap-3"
                >
                  <span
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-200 ${formData.status === "Open" ? "bg-[#ea4f93]" : "bg-[#dcd0d6]"
                      }`}
                  >
                    <span
                      className={`absolute h-5 w-5 rounded-full bg-white shadow-[0_2px_5px_rgba(45,27,53,0.15)] transition-transform duration-200 ${formData.status === "Open" ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </span>
                  <span
                    className={`text-[14px] font-semibold transition-colors ${formData.status === "Open" ? "text-[#ea4f93]" : "text-[#a88a9f]"
                      }`}
                  >
                    {formData.status === "Open"
                      ? isVi
                        ? "Hoạt động"
                        : "Open"
                      : isVi
                        ? "Đóng cửa"
                        : "Closed"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </PremiumCard>
      )}

      <SalonOperatingHoursManager salonId={salonId} initialHours={salon?.operatingHours} onReload={loadData} />

      <SalonOffDatesManager salonId={salonId} />
    </motion.section>
  );
}
