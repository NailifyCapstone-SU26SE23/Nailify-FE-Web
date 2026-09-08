import {
  Calendar,
  Clock3,
  Eye,
  MapPin,
  Phone,
  Save,
  UserRound,
  X,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { TimePicker } from "../../../../shared/components/ui/TimePicker";
import { SalonSaveResultModal } from "../components/SalonSaveResultModal";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import HolidayClosureModal from "../components/HolidayClosureModal";
import { ROUTES, getAdminSalonDetailRoute } from "../../../../shared/constants/routes";
import {
  SALON_DAYS_OF_WEEK,
  SALON_STATUS_OPTIONS,
  createEmptySalonForm,
  getSalonStatusStyle,
  validateSalonForm,
} from "../services/mockSalon";
import { updateSalon } from "../services/salonsService";
import { fetchAdminSalonDetail, mapSalonOperatingHours } from "../services/salonManagementService";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-[16px] border border-[#f5cbdc] bg-[#fff8fb] px-4 py-3.5 transition-all duration-300 hover:border-[#eba2c6] hover:bg-[#fff5f9] focus-within:border-[#ea4f93] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.2)]";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[14px] text-[#3f2034] outline-none placeholder:text-[#c8b0bf] font-medium";
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const normalizeSalonStatusValue = (status) => {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  if (normalizedStatus === "CLOSED" || normalizedStatus === "INACTIVE" || normalizedStatus === "MAINTENANCE" || normalizedStatus === "UNDER MAINTENANCE") {
    return "Closed";
  }

  return "Open";
};

const getSalonStatusLabel = (status, language) => {
  if (language !== "vi") {
    return status;
  }

  return { Open: "Mở cửa", Closed: "Đóng cửa" }[status] || status;
};

function PremiumCard({ className = "", children, noHover = false, padded = true }) {
  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={`relative overflow-hidden rounded-[28px] border border-[#f1e7ed] bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${padded ? "p-6" : ""} ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.06)]" : ""} ${className}`}
    >
      {children}
    </motion.article>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-[16px] font-bold text-[#2d1b35]">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-[11px] text-[#a88a9f] leading-relaxed">{subtitle}</p> : null}
    </div>
  );
}

function SalonUpdateLoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#ea4f93]" />
        <p className="mt-4 text-[14px] font-medium text-[#a88a9f]">Loading salon data...</p>
      </div>
    </div>
  );
}

export function SalonUpdatePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { salonId } = useParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [formData, setFormData] = useState(createEmptySalonForm);
  const [formError, setFormError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showHolidayClosureModal, setShowHolidayClosureModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSalon = async () => {
      setIsLoading(true);
      setIsNotFound(false);
      try {
        const salon = await fetchAdminSalonDetail(salonId);

        if (!isMounted) {
          return;
        }

        setFormData({
          ...createEmptySalonForm(),
          salonName: salon.name || "",
          salonId: (salon.id || salon.salonId || salonId || "").toString().trim(),
          address: salon.address || "",
          manager: "",
          phone: salon.phone || "",
          staffAmount: "",
          status: normalizeSalonStatusValue(salon.status),
          operatingHours: mapSalonOperatingHours(salon.operatingHours),
          depositConfig: salon.depositConfig || "",
        });
        // Set image preview if available
        if (salon.image) {
          setImagePreview(salon.image);
        }
      } catch (error) {
        console.error("Failed to load salon:", error);
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadSalon();

    return () => {
      isMounted = false;
    };
  }, [salonId]);

  const handleInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
    if (formError) setFormError("");
  };

  const handleHoursChange = (day, field, value) => {
    setFormData((current) => ({
      ...current,
      operatingHours: {
        ...current.operatingHours,
        [day]: {
          ...current.operatingHours[day],
          [field]: value,
        },
      },
    }));
    if (formError) setFormError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");
    const validationError = validateSalonForm(formData, { requireSalonId: false });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const validationError = validateSalonForm(formData, { requireSalonId: false });
      if (validationError) {
        setSaveResult({
          success: false,
          message: validationError === "Salon name is required"
            ? (t("adminSalonManagement.salonNameIsRequired"))
            : validationError,
        });
        setShowSaveModal(false);
        return;
      }

      await updateSalon(salonId, formData, selectedImage);

      setSaveResult({
        success: true,
        message: language === "vi"
          ? `${formData.salonName.trim()} đã được cập nhật thành công.`
          : `${formData.salonName.trim()} has been updated successfully.`,
      });
    } catch (error) {
      setSaveResult({
        success: false,
        message: error.message || (t("adminSalonManagement.failedToUpdateSalonPleaseTryAg")),
      });
    } finally {
      setIsSaving(false);
      setShowSaveModal(false);
    }
  };

  const handleCloseResultModal = () => {
    setSaveResult(null);
  };

  const handleSuccessComplete = useCallback(() => {
    navigate(ROUTES.adminSalons, {
      state: {
        flashMessage: saveResult?.message,
      },
    });
  }, [navigate, saveResult?.message]);

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigate(getAdminSalonDetailRoute(salonId), { replace: true });
  };

  if (isNotFound) {
    return <Navigate to={ROUTES.adminSalons} replace />;
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto w-full min-w-0 max-w-[1300px]"
    >

      <header className="mb-6 flex flex-col gap-5">
        <motion.div variants={fadeInUp} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className=" text-[32px] font-semibold text-[#3f2034]">
              {t("adminSalonManagement.updateSalon")}
            </h1>
            <p className="mt-1 text-sm text-[#a6869a]">
              {language === "vi" ? `Cập nhật thông tin cho chi nhánh ${formData.salonName || ""}` : `Update salon information for ${formData.salonName || "Salon"}`}
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f1e7ed] bg-white px-5 py-2.5 text-[12px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff8fb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={16} />
              {t("adminSalonManagement.cancel")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] px-6 py-2.5 text-[12px] font-bold text-white shadow-[0_12px_24px_rgba(234,79,147,0.32)] transition-all duration-300 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {t("adminSalonManagement.updateSalon")}
            </motion.button>
          </div>
        </motion.div>
      </header>

      {isLoading ? (
        <SalonUpdateLoadingState />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
            {formError && (
              <motion.div
                variants={fadeInUp}
                className="lg:col-span-3 mb-2 rounded-[16px] bg-[#fff0f0] border border-[#fecdd3] px-4 py-3 text-[#d14c84] text-[13px] font-semibold"
              >
                {formError}
              </motion.div>
            )}
            <div className="space-y-6 lg:col-span-2">
              <PremiumCard>
                <div className="mb-6">
                  <SectionHeading
                    title={t("adminSalonManagement.salonDetails")}
                    subtitle={t("adminSalonManagement.updateTheBasicInformationForTh")}
                  />
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-5 md:grid-cols-2"
                >
                  <label className="space-y-2.5">
                    <span className="text-[13px] font-semibold text-[#2d1b35]">
                      {t("adminSalonManagement.salonName")} <span className="text-[#ea4f93]">*</span>
                    </span>
                    <div className={inputWrapperClassName}>
                      <UserRound size={14} className="shrink-0 text-[#ea4f93]" />
                      <input
                        type="text"
                        value={formData.salonName}
                        onChange={(event) => handleInputChange("salonName", event.target.value)}
                        placeholder={t("adminSalonManagement.enterSalonName")}
                        className={inputClassName}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2.5">
                    <span className="text-[13px] font-semibold text-[#2d1b35]">
                      {t("adminSalonManagement.phoneNumber")} <span className="text-[#ea4f93]">*</span>
                    </span>
                    <div className={inputWrapperClassName}>
                      <Phone size={14} className="shrink-0 text-[#ea4f93]" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(event) => handleInputChange("phone", event.target.value)}
                        placeholder={t("adminSalonManagement.enterPhoneNumber")}
                        className={inputClassName}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2.5 md:col-span-2">
                    <span className="text-[13px] font-semibold text-[#2d1b35]">
                      {t("adminSalonManagement.address")} <span className="text-[#ea4f93]">*</span>
                    </span>
                    <div className={`${inputWrapperClassName} items-start`}>
                      <MapPin size={14} className="mt-0.5 shrink-0 text-[#ea4f93]" />
                      <textarea
                        value={formData.address}
                        onChange={(event) => handleInputChange("address", event.target.value)}
                        placeholder={t("adminSalonManagement.fullAddressIncludingCityAndZip")}
                        className={`${inputClassName} resize-none`}
                        rows={3}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2.5">
                    <span className="text-[13px] font-semibold text-[#2d1b35]">
                      {language === "vi" ? "Phần trăm cọc" : "Deposit Config"} <span className="text-[#ea4f93]">*</span>
                    </span>
                    <div className={inputWrapperClassName}>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fecdd3] text-[10px] font-bold text-[#ea4f93]">%</div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.depositConfig}
                        onChange={(event) => handleInputChange("depositConfig", event.target.value)}
                        placeholder="e.g. 20"
                        className={inputClassName}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[13px] font-semibold text-[#2d1b35]">
                      {t("adminSalonManagement.salonImage")}
                    </span>
                    <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[#f0b7cf] bg-[#fff8fb] px-6 py-8 cursor-pointer transition-all duration-300 hover:border-[#ea4f93] hover:bg-[#fff5fb] hover:shadow-[0_8px_24px_rgba(234,79,147,0.12)]">
                      {imagePreview ? (
                        <div className="relative w-full">
                          <img
                            crossOrigin="anonymous"
                            src={imagePreview}
                            alt="Preview"
                            className="h-40 w-full object-cover rounded-[16px] shadow-lg"
                            referrerPolicy="no-referrer"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] text-white shadow-lg"
                          >
                            <X size={16} />
                          </motion.button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-3 cursor-pointer">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] text-white shadow-lg">
                            <Upload size={28} />
                          </div>
                          <div className="text-center">
                            <p className="text-base font-semibold text-[#2d1b35]">{t("adminSalonManagement.clickToUploadSalonImage")}</p>
                            <p className="text-xs text-[#a88a9f] mt-1">{t("adminSalonManagement.pngJpgUpTo5mb")}</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </label>

                  <div className="space-y-2 md:col-span-2">
                    <span className="text-[13px] font-semibold text-[#2d1b35]">
                      {t("adminSalonManagement.status")} <span className="text-[#ea4f93]">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {SALON_STATUS_OPTIONS.map((option) => {
                        return (
                          <motion.button
                            key={option.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => handleInputChange("status", option.value)}
                            className={`rounded-[16px] px-4 py-3.5 text-[14px] font-bold transition-all duration-300 ${formData.status === option.value
                              ? `${option.color} shadow-lg`
                              : "bg-[#fff8fb] text-[#a88a9f] hover:text-[#2d1b35] hover:bg-[#fff5fb] border border-[#f1e7ed]"
                              }`}
                          >
                            {getSalonStatusLabel(option.value, language)}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </PremiumCard>

              <PremiumCard>
                <div className="mb-6">
                  <SectionHeading
                    title={t("adminSalonManagement.operatingHours")}
                    subtitle={t("adminSalonManagement.setTheOpeningAndClosingHoursFo")}
                  />
                </div>

                <div className="space-y-3">
                  {SALON_DAYS_OF_WEEK.map((day) => {
                    const daysMap = { Monday: "Thứ hai", Tuesday: "Thứ ba", Wednesday: "Thứ tư", Thursday: "Thứ năm", Friday: "Thứ sáu", Saturday: "Thứ bảy", Sunday: "Chủ nhật" };
                    return (
                      <motion.div
                        key={day.key}
                        variants={fadeInUp}
                        className="flex flex-col gap-3 rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] px-5 py-4 sm:flex-row sm:items-center transition-all duration-300 hover:border-[#f0b7cf] hover:shadow-[0_4px_16px_rgba(234,79,147,0.08)]"
                      >
                        <div className="w-full sm:w-28">
                          <span className="text-[13px] font-bold text-[#2d1b35]">{language === "vi" ? daysMap[day.key] || day.label : day.label}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Clock3 size={14} className="shrink-0 text-[#ea4f93]" />
                          <TimePicker
                            value={formData.operatingHours[day.key].open}
                            onChange={(value) => handleHoursChange(day.key, "open", value)}
                            placeholder={t("adminSalonManagement.openTime")}
                            className="w-full min-w-[7rem] sm:w-28"
                          />
                          <span className="text-sm text-[#a88a9f] font-semibold">{t("adminSalonManagement.to")}</span>
                          <TimePicker
                            value={formData.operatingHours[day.key].close}
                            onChange={(value) => handleHoursChange(day.key, "close", value)}
                            placeholder={t("adminSalonManagement.closeTime")}
                            className="w-full min-w-[7rem] sm:w-28"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </PremiumCard>
            </div>

            <aside className="space-y-6">
              <PremiumCard>
                <div className="mb-6">
                  <SectionHeading
                    title={t("adminSalonManagement.quickActions")}
                    subtitle={t("adminSalonManagement.additionalActionsForSalonManag")}
                  />
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate(getAdminSalonDetailRoute(salonId))}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#f1e7ed] bg-[#fff8fb] px-4 py-3 text-[13px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb] hover:shadow-[0_4px_16px_rgba(234,79,147,0.08)]"
                  >
                    <Eye size={16} />
                    {t("adminSalonManagement.viewSalonDetails")}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowHolidayClosureModal(true)}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#f1e7ed] bg-[#fff8fb] px-4 py-3 text-[13px] font-bold text-[#2d1b35] transition-all duration-300 hover:bg-[#fff5fb] hover:shadow-[0_4px_16px_rgba(234,79,147,0.08)]"
                  >
                    <Calendar size={16} />
                    {t("adminSalonManagement.setHolidaySchedule")}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleCancel}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#fecdd3] bg-[#fff0f0] px-4 py-3 text-[13px] font-bold text-[#d14c84] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(209,76,132,0.15)]"
                  >
                    <X size={16} />
                    {t("adminSalonManagement.discardChanges")}
                  </motion.button>
                </div>
              </PremiumCard>

              <PremiumCard>
                <div className="mb-6">
                  <SectionHeading
                    title={t("adminSalonManagement.preview")}
                    subtitle={t("adminSalonManagement.summaryOfTheSalonInformation")}
                  />
                </div>

                <div className="space-y-4">
                  <div className="rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] p-5">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h3 className="text-[15px] font-bold text-[#2d1b35]">{t("adminSalonManagement.salonSummary")}</h3>
                      <span
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold ${getSalonStatusStyle(formData.status)}`}
                      >
                        {getSalonStatusLabel(formData.status, language)}
                      </span>
                    </div>

                    <div className="space-y-3 text-[13px] text-[#5b4256]">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-[#2d1b35]">{t("adminSalonManagement.name")}</span>
                        <span className="text-right font-medium text-[#2d1b35]">{formData.salonName || (t("adminSalonManagement.notSet"))}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-[#2d1b35]">{language === "vi" ? "Phần trăm cọc" : "Deposit Config"}</span>
                        <span className="text-right font-medium text-[#2d1b35]">{formData.depositConfig ? `${formData.depositConfig}%` : (t("adminSalonManagement.notSet"))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            </aside>
          </form>

          <PremiumCard className="mt-6">
            <div className="mb-6">
              <SectionHeading
                title={t("adminSalonManagement.additionalInformation")}
                subtitle={t("adminSalonManagement.addAnyExtraDetailsAboutTheSalo")}
              />
            </div>

            <label className="block space-y-2.5">
              <span className="text-[13px] font-semibold text-[#2d1b35]">{t("adminSalonManagement.description")}</span>
              <textarea
                value={formData.description}
                onChange={(event) => handleInputChange("description", event.target.value)}
                placeholder={t("adminSalonManagement.addAnyAdditionalNotesOrDescrip")}
                className="w-full rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] px-4 py-3.5 text-[14px] text-[#2d1b35] outline-none placeholder:text-[#a88a9f] font-medium transition-all duration-300 focus:border-[#ea4f93] focus:bg-white focus:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]"
                rows={4}
              />
            </label>
          </PremiumCard>
        </>
      )}

      <ActionConfirmModal
        open={showCancelModal}
        intent="warning"
        title={t("adminSalonManagement.cancelSalonUpdate")}
        subtitle={t("adminSalonManagement.youAreLeavingThisEditingSessio")}
        description={t("adminSalonManagement.unsavedChangesToThisSalonWillB")}
        confirmText={t("adminSalonManagement.yesCancel")}
        cancelText={t("adminSalonManagement.keepEditing")}
        confirmIcon={X}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        details={[
          { label: t("adminSalonManagement.editingMode"), value: t("adminSalonManagement.updateExistingSalon") },
          { label: t("adminSalonManagement.nextStep"), value: t("adminSalonManagement.returnToSalonDetails") },
        ]}
        warnings={
          language === "vi"
            ? ["Các chỉnh sửa gần đây về thông tin và giờ hoạt động sẽ bị mất.", "Chi nhánh sẽ giữ nguyên trạng thái cũ cho đến khi bạn xác nhận cập nhật thành công."]
            : ["Recent edits to branch info and operating hours will be lost.", "The salon will remain unchanged until you confirm an update."]
        }
      />

      <ActionConfirmModal
        open={showSaveModal}
        intent="success"
        title={t("adminSalonManagement.saveSalonChanges")}
        subtitle={t("adminSalonManagement.thisWillCreateTheSalonInTheSys")}
        description={t("adminSalonManagement.confirmToApplyYourEditsAndRefr")}
        confirmText={t("adminSalonManagement.updateSalon")}
        cancelText={t("adminSalonManagement.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        highlights={[formData.salonName || (t("adminSalonManagement.salonRecord")), getSalonStatusLabel(formData.status, language)]}
        details={[
          { label: t("adminSalonManagement.address"), value: formData.address || (t("adminSalonManagement.noAddressEntered")) },
        ]}
      />

      <SalonSaveResultModal
        result={saveResult}
        successTitle={t("adminSalonManagement.updateSuccessful")}
        failureTitle={t("adminSalonManagement.updateFailed")}
        successDescription={t("adminSalonManagement.theSalonHasBeenUpdatedSuccessf")}
        failureDescription={t("adminSalonManagement.unableToUpdateTheSalon")}
        onFailureClose={handleCloseResultModal}
        onSuccessComplete={handleSuccessComplete}
      />

      <HolidayClosureModal
        open={showHolidayClosureModal}
        onCancel={() => setShowHolidayClosureModal(false)}
        salonOptions={[{ value: salonId, label: formData.salonName || (t("adminSalonManagement.thisSalon")) }]}
      />
    </motion.section>
  );
}
