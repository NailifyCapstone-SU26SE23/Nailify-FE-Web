import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Plus,
  Save,
  User,
  Users,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { TimePicker } from "../../../../shared/components/ui/TimePicker";
import { SalonSaveResultModal } from "../components/SalonSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  SALON_DAYS_OF_WEEK,
  SALON_STATUS_OPTIONS,
  createEmptySalonForm,
  getSalonStatusStyle,
  validateSalonForm,
} from "../services/mockSalon";
import { createSalon, uploadSalonImage } from "../services/salonsService";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 transition-all duration-300 hover:border-rose-200 hover:bg-[#fff5f9] focus-within:border-rose-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-rose-300 font-medium";

export function SalonCreatePage() {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formData, setFormData] = useState(createEmptySalonForm);
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
          message: validationError,
        });
        setShowSaveModal(false);
        return;
      }

      const createdSalon = await createSalon(formData, selectedImage);

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
    navigate(ROUTES.adminSalons);
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      <header className="mb-4 flex flex-col gap-4 rounded-[20px] bg-white/70 px-4 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur sm:mb-5 sm:rounded-[24px] sm:px-5 lg:rounded-[28px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminSalons}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-[#cf3d74] sm:text-2xl lg:text-[28px]">
              Add New Salon
            </h1>
            <p className="text-[11px] font-medium text-slate-400 sm:text-[12px]">
              Create a new salon branch in the system
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            Save Salon
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {formError && (
          <div className="lg:col-span-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-600 text-[13px] font-semibold">
            {formError}
          </div>
        )}
        <div className="space-y-4 lg:col-span-2 lg:space-y-5">
          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Salon Details
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Salon Name <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.salonName}
                    onChange={(event) => handleInputChange("salonName", event.target.value)}
                    placeholder="Enter salon name"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Phone Number <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <Phone size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => handleInputChange("phone", event.target.value)}
                    placeholder="+1 (XXX) XXX-XXXX"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  Address <span className="text-rose-500">*</span>
                </span>
                <div className={`${inputWrapperClassName} items-start`}>
                  <MapPin size={14} className="mt-0.5 shrink-0 text-rose-300" />
                  <textarea
                    value={formData.address}
                    onChange={(event) => handleInputChange("address", event.target.value)}
                    placeholder="Full address including city and zip code"
                    className={`${inputClassName} resize-none`}
                    rows={3}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  Salon Image
                </span>
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-gradient-to-br from-[#fffafc] to-[#fff5f9] px-6 py-8 cursor-pointer transition-all duration-300 hover:border-rose-300 hover:bg-gradient-to-br hover:from-[#fff8fb] hover:to-[#fff1f6] hover:shadow-[0_8px_24px_rgba(226,93,143,0.12)]">
                  {imagePreview ? (
                    <div className="relative w-full">
                      <img
                        crossOrigin="anonymous"
                        src={imagePreview}
                        alt="Preview"
                        className="h-40 w-full object-cover rounded-2xl shadow-lg"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] text-white shadow-lg transition-transform duration-200 hover:scale-110"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-3 cursor-pointer">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] text-white shadow-lg transition-transform duration-200 hover:scale-105">
                        <Upload size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-slate-700">Click to upload salon image</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
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
                <span className="text-[13px] font-semibold text-slate-600">
                  Status <span className="text-rose-500">*</span>
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {SALON_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange("status", option.value)}
                      className={`rounded-2xl px-4 py-3.5 text-center text-sm font-bold transition-all duration-300 transform hover:scale-[1.02] ${formData.status === option.value
                          ? `${option.color} shadow-lg`
                          : "bg-[#fff5f9] text-slate-400 hover:text-slate-600 hover:bg-[#fff0f5] border border-rose-100"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Operating Hours
            </h2>

            <div className="space-y-3.5">
              {SALON_DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.key}
                  className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-[#fffafc] to-[#fff8fb] px-5 py-4 sm:flex-row sm:items-center transition-all duration-300 hover:border-rose-200 hover:shadow-[0_4px_16px_rgba(226,93,143,0.08)]"
                >
                  <div className="w-full sm:w-28">
                    <span className="text-[13px] font-bold text-slate-700">{day.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Clock size={14} className="shrink-0 text-rose-400" />
                    <TimePicker
                      value={formData.operatingHours[day.key].open}
                      onChange={(value) => handleHoursChange(day.key, "open", value)}
                      placeholder="Open time"
                      className="w-full min-w-[7rem] sm:w-28"
                    />
                    <span className="text-sm text-slate-400 font-semibold">to</span>
                    <TimePicker
                      value={formData.operatingHours[day.key].close}
                      onChange={(value) => handleHoursChange(day.key, "close", value)}
                      placeholder="Close time"
                      className="w-full min-w-[7rem] sm:w-28"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:space-y-5">
          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Actions
            </h2>

            <div className="space-y-3.5">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3.5 text-[13px] font-bold text-emerald-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-emerald-200 hover:shadow-[0_4px_16px_rgba(16,185,129,0.15)] hover:scale-[1.02]"
              >
                <Plus size={16} />
                Add Another Salon
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-3.5 text-[13px] font-bold text-amber-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-100 hover:to-amber-200 hover:shadow-[0_4px_16px_rgba(245,158,11,0.15)] hover:scale-[1.02]"
              >
                <Calendar size={16} />
                Set Holiday Schedule
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3.5 text-[13px] font-bold text-blue-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:shadow-[0_4px_16px_rgba(59,130,246,0.15)] hover:scale-[1.02]"
              >
                <Users size={16} />
                Assign Staff Members
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 px-4 py-3.5 text-[13px] font-bold text-rose-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-rose-100 hover:to-rose-200 hover:shadow-[0_4px_16px_rgba(244,63,94,0.15)] hover:scale-[1.02]"
              >
                <X size={16} />
                Discard Changes
              </button>
            </div>
          </div>

          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Preview
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-5 shadow-[0_2px_12px_rgba(226,93,143,0.05)]">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-slate-700">Salon Summary</h3>
                  <span
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold ${getSalonStatusStyle(formData.status)}`}
                  >
                    {formData.status}
                  </span>
                </div>

                <div className="space-y-3 text-[13px] text-slate-600">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-slate-700">Name:</span>
                    <span className="text-right font-medium text-slate-800">{formData.salonName || "Not set"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-5 shadow-[0_2px_12px_rgba(226,93,143,0.05)]">
                <h3 className="mb-3 text-[15px] font-bold text-slate-700">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Capacity</div>
                    <div className="text-[18px] font-bold text-slate-800 mt-1">85%</div>
                  </div>
                  <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Revenue</div>
                    <div className="text-[18px] font-bold text-slate-800 mt-1">$12.5K</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>

      <div className="mt-4 rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:mt-5 sm:p-6 lg:p-7 border border-rose-50">
        <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
          <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
          Additional Information
        </h2>

        <label className="block space-y-2.5">
          <span className="text-[13px] font-semibold text-slate-600">Description</span>
          <textarea
            value={formData.description}
            onChange={(event) => handleInputChange("description", event.target.value)}
            placeholder="Add any additional notes or description about this salon..."
            className="w-full rounded-2xl border border-rose-100 bg-gradient-to-r from-[#fffafc] to-[#fff8fb] px-4 py-3.5 text-[14px] text-slate-800 outline-none placeholder:text-rose-300 font-medium transition-all duration-300 focus:border-rose-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]"
            rows={4}
          />
        </label>
      </div>

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
          "Branch profile, manager contact, and operating hours in this draft will be lost.",
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
        highlights={[formData.salonName || "New salon", formData.status]}
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
    </section>
  );
}
