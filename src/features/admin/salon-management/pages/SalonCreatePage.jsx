import {
  MapPin,
  Phone,
  Save,
  X,
  Upload,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { SalonSaveResultModal } from "../components/SalonSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  createSalon,
} from "../services/salonsService";

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

export function SalonCreatePage() {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formData, setFormData] = useState({
    salonName: "",
    address: "",
    phone: "",
  });
  const [formError, setFormError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
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
    if (!formData.salonName.trim()) {
      setFormError("Salon name is required");
      return;
    }
    if (!formData.address.trim()) {
      setFormError("Address is required");
      return;
    }
    if (!formData.phone.trim()) {
      setFormError("Phone number is required");
      return;
    }
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      if (!formData.salonName.trim()) {
        setSaveResult({
          success: false,
          message: "Salon name is required",
        });
        setShowSaveModal(false);
        return;
      }

      await createSalon({
        salonName: formData.salonName,
        address: formData.address,
        phone: formData.phone,
        staffAmount: "",
        status: "ACTIVE",
        operatingHours: {},
        salonId: "",
      }, selectedImage);

      setSaveResult({
        success: true,
        message: `${formData.salonName.trim()} has been created successfully.`,
      });
    } catch (error) {
      setSaveResult({
        success: false,
        message: error.message || "Failed to create salon. Please try again.",
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
    navigate(ROUTES.adminSalons, { replace: true });
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto w-full min-w-0 max-w-[1300px]"
    >
      <style>{`
        .nailify-display { font-family: "Cormorant Garamond", serif; }
      `}</style>
      <motion.header
        variants={fadeInUp}
        className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0">
          <h1 className="nailify-display text-[32px] font-semibold text-[#3f2034]">
            Add New Salon
          </h1>
          <p className="mt-1 text-sm text-[#a6869a]">
            Create a new salon branch in the system
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f1e7ed] bg-white px-5 py-2.5 text-[12px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff8fb]"
          >
            <X size={16} />
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] px-6 py-2.5 text-[12px] font-bold text-white shadow-[0_12px_24px_rgba(234,79,147,0.32)] transition-all duration-300 hover:opacity-95"
          >
            <Save size={16} />
            Create Salon
          </motion.button>
        </div>
      </motion.header>

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
                title="Salon Details"
                subtitle="Fill in the basic salon information"
              />
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-5 md:grid-cols-2"
            >
              <motion.label variants={fadeInUp} className="space-y-2.5 md:col-span-2">
                <span className="text-[13px] font-semibold text-[#2d1b35]">
                  Salon Name <span className="text-[#ea4f93]">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93]">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  <input
                    type="text"
                    value={formData.salonName}
                    onChange={(event) => handleInputChange("salonName", event.target.value)}
                    placeholder="Enter salon name"
                    className={inputClassName}
                    required
                  />
                </div>
              </motion.label>

              <motion.label variants={fadeInUp} className="space-y-2.5">
                <span className="text-[13px] font-semibold text-[#2d1b35]">
                  Phone Number <span className="text-[#ea4f93]">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <Phone size={14} className="shrink-0 text-[#ea4f93]" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => handleInputChange("phone", event.target.value)}
                    placeholder="Enter phone number"
                    className={inputClassName}
                    required
                  />
                </div>
              </motion.label>

              <motion.label variants={fadeInUp} className="space-y-2.5 md:col-span-2">
                <span className="text-[13px] font-semibold text-[#2d1b35]">
                  Address <span className="text-[#ea4f93]">*</span>
                </span>
                <div className={`${inputWrapperClassName} items-start`}>
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[#ea4f93]" />
                  <textarea
                    value={formData.address}
                    onChange={(event) => handleInputChange("address", event.target.value)}
                    placeholder="Full address including city and zip code"
                    className={`${inputClassName} resize-none`}
                    rows={3}
                    required
                  />
                </div>
              </motion.label>

              <motion.label variants={fadeInUp} className="space-y-2 md:col-span-2">
                <span className="text-[13px] font-semibold text-[#2d1b35]">
                  Salon Image
                </span>
                <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[#f0b7cf] bg-[#fff8fb] px-6 py-8 cursor-pointer transition-all duration-300 hover:border-[#ea4f93] hover:bg-[#fff5f9] hover:shadow-[0_8px_24px_rgba(234,79,147,0.12)]">
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
                        <p className="text-base font-semibold text-[#2d1b35]">Click to upload salon image</p>
                        <p className="text-xs text-[#a88a9f] mt-1">PNG, JPG up to 5MB</p>
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
              </motion.label>
            </motion.div>
          </PremiumCard>
        </div>

        <aside className="space-y-6">
          <PremiumCard>
            <div className="mb-6">
              <SectionHeading
                title="Quick Actions"
                subtitle="Fast access to frequently used functions"
              />
            </div>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCancel}
                className="flex w-full items-center justify-center gap-2.5 rounded-[16px] border border-[#fecdd3] bg-[#fff0f0] px-4 py-3.5 text-[13px] font-bold text-[#d14c84] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(209,76,132,0.15)]"
              >
                <X size={16} />
                Discard Changes
              </motion.button>
            </div>
          </PremiumCard>

          <PremiumCard>
            <div className="mb-6">
              <SectionHeading
                title="Preview"
                subtitle="Summary of salon details"
              />
            </div>
            <div className="space-y-4">
              <div className="rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#2d1b35]">Salon Summary</h3>
                </div>
                <div className="space-y-3 text-[13px] text-[#5b4256]">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-[#2d1b35]">Name:</span>
                    <span className="text-right font-medium text-[#2d1b35]">{formData.salonName || "Not set"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-[#2d1b35]">Phone:</span>
                    <span className="text-right font-medium text-[#2d1b35]">{formData.phone || "Not set"}</span>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>
        </aside>
      </form>

      <ActionConfirmModal
        open={showCancelModal}
        intent="warning"
        title="Cancel Salon Creation"
        subtitle="You are leaving this form without saving."
        description="All unsaved salon details will be discarded if you cancel now."
        confirmText="Yes, Cancel"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        details={[
          { label: "Draft Status", value: "Not saved yet" },
          { label: "Next Step", value: "Return to salon list" },
        ]}
        warnings={[
          "Salon name, address, and phone number in this draft will be lost.",
          "You will need to re-enter the information if you start again later.",
        ]}
      />

      <ActionConfirmModal
        open={showSaveModal}
        intent="success"
        title="Save New Salon"
        subtitle="This will create the salon in the system."
        description="Confirm to add this branch and make it available in salon management."
        confirmText="Save Salon"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        highlights={[formData.salonName || "New salon"]}
        details={[
          { label: "Address", value: formData.address || "No address entered" },
        ]}
      />

      <SalonSaveResultModal
        result={saveResult}
        successTitle="Create Successful"
        failureTitle="Create Failed"
        successDescription="The salon has been created successfully."
        failureDescription="Unable to create the salon."
        onFailureClose={handleCloseResultModal}
        onSuccessComplete={handleSuccessComplete}
      />
    </motion.section>
  );
}
