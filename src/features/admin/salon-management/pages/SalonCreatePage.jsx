import { Modal } from "antd";
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
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TimePicker } from "../../components/TimePicker";
import { SalonSaveResultModal } from "../components/SalonSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  SALON_DAYS_OF_WEEK,
  SALON_FORM_MODAL_STYLES,
  SALON_STATUS_OPTIONS,
  createEmptySalonForm,
  getSalonStatusStyle,
  submitMockSalonCreate,
} from "../services/mockSalon";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-xl border border-rose-100 bg-[#fff6f9] px-4 py-3";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-rose-200";

export function SalonCreatePage() {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formData, setFormData] = useState(createEmptySalonForm);

  const handleInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);

    const result = await submitMockSalonCreate(formData);

    setIsSaving(false);
    setShowSaveModal(false);
    setSaveResult(result);
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
        <div className="space-y-4 lg:col-span-2 lg:space-y-5">
          <div className="rounded-[20px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
            <h2 className="mb-4 text-[16px] font-bold text-slate-800 sm:text-[18px]">
              Salon Details
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
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

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
                  Salon ID <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <span className="text-[12px] font-bold text-rose-300">#</span>
                  <input
                    type="text"
                    value={formData.salonId}
                    onChange={(event) => handleInputChange("salonId", event.target.value)}
                    placeholder="e.g., NY-003"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[12px] font-semibold text-slate-500">
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

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
                  Manager <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={(event) => handleInputChange("manager", event.target.value)}
                    placeholder="Manager's full name"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
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

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
                  Staff Amount <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <Users size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.staffAmount}
                    onChange={(event) => handleInputChange("staffAmount", event.target.value)}
                    placeholder="Number of staff members"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <div className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
                  Status <span className="text-rose-500">*</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SALON_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange("status", option.value)}
                      className={`rounded-xl px-3 py-2.5 text-center text-[11px] font-bold transition ${
                        formData.status === option.value
                          ? option.color
                          : "bg-[#fff2f6] text-slate-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
            <h2 className="mb-4 text-[16px] font-bold text-slate-800 sm:text-[18px]">
              Operating Hours
            </h2>

            <div className="space-y-3">
              {SALON_DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.key}
                  className="flex flex-col gap-3 rounded-xl border border-rose-100 bg-[#fff6f9] px-4 py-3 sm:flex-row sm:items-center"
                >
                  <div className="w-full sm:w-24">
                    <span className="text-[12px] font-bold text-slate-600">{day.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Clock size={12} className="shrink-0 text-rose-300" />
                    <TimePicker
                      value={formData.operatingHours[day.key].open}
                      onChange={(value) => handleHoursChange(day.key, "open", value)}
                      placeholder="Open time"
                      className="w-full min-w-[6.5rem] sm:w-24"
                    />
                    <span className="text-[11px] text-slate-400">to</span>
                    <TimePicker
                      value={formData.operatingHours[day.key].close}
                      onChange={(value) => handleHoursChange(day.key, "close", value)}
                      placeholder="Close time"
                      className="w-full min-w-[6.5rem] sm:w-24"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:space-y-5">
          <div className="rounded-[20px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
            <h2 className="mb-4 text-[16px] font-bold text-slate-800 sm:text-[18px]">Actions</h2>

            <div className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-bold text-emerald-600 transition hover:bg-emerald-100"
              >
                <Plus size={14} />
                Add Another Salon
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-600 transition hover:bg-amber-100"
              >
                <Calendar size={14} />
                Set Holiday Schedule
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[12px] font-bold text-blue-600 transition hover:bg-blue-100"
              >
                <Users size={14} />
                Assign Staff Members
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-bold text-rose-600 transition hover:bg-rose-100"
              >
                <X size={14} />
                Discard Changes
              </button>
            </div>
          </div>

          <div className="rounded-[20px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
            <h2 className="mb-4 text-[16px] font-bold text-slate-800 sm:text-[18px]">Preview</h2>

            <div className="space-y-3">
              <div className="rounded-xl border border-rose-100 bg-[#fff6f9] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-bold text-slate-700">Salon Summary</h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${getSalonStatusStyle(formData.status)}`}
                  >
                    {formData.status}
                  </span>
                </div>

                <div className="space-y-2 text-[12px] text-slate-600">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">Name:</span>
                    <span className="text-right">{formData.salonName || "Not set"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">ID:</span>
                    <span className="text-right">{formData.salonId || "Not set"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">Manager:</span>
                    <span className="text-right">{formData.manager || "Not set"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">Staff:</span>
                    <span className="text-right">{formData.staffAmount || "0"} members</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-[#fff6f9] p-4">
                <h3 className="mb-2 text-[14px] font-bold text-slate-700">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white p-2 text-center">
                    <div className="text-[10px] font-semibold text-slate-400">Capacity</div>
                    <div className="text-[16px] font-bold text-slate-700">85%</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center">
                    <div className="text-[10px] font-semibold text-slate-400">Revenue</div>
                    <div className="text-[16px] font-bold text-slate-700">$12.5K</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>

      <div className="mt-4 rounded-[20px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:mt-5 sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
        <h2 className="mb-4 text-[16px] font-bold text-slate-800 sm:text-[18px]">
          Additional Information
        </h2>

        <label className="block space-y-2">
          <span className="text-[12px] font-semibold text-slate-500">Description</span>
          <textarea
            value={formData.description}
            onChange={(event) => handleInputChange("description", event.target.value)}
            placeholder="Add any additional notes or description about this salon..."
            className="w-full rounded-xl border border-rose-100 bg-[#fff6f9] px-4 py-3 text-[13px] text-slate-700 outline-none placeholder:text-rose-200"
            rows={4}
          />
        </label>
      </div>

      <Modal
        title="Confirm Cancel"
        open={showCancelModal}
        onOk={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        okText="Yes, Cancel"
        cancelText="No, Continue Editing"
        okButtonProps={{
          className: "bg-rose-500 hover:bg-rose-600 text-white border-rose-500",
        }}
        cancelButtonProps={{
          className: "border-rose-200 text-rose-500 hover:text-rose-600",
        }}
        styles={SALON_FORM_MODAL_STYLES}
      >
        <div className="py-4">
          <p className="mb-2 text-slate-700">Are you sure you want to cancel?</p>
          <p className="text-sm text-slate-500">All unsaved changes will be lost.</p>
        </div>
      </Modal>

      <Modal
        title="Confirm Save"
        open={showSaveModal}
        onOk={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        okText="Yes, Save Salon"
        cancelText="No, Continue Editing"
        confirmLoading={isSaving}
        closable={!isSaving}
        maskClosable={!isSaving}
        okButtonProps={{
          className: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500",
        }}
        cancelButtonProps={{
          className: "border-emerald-200 text-emerald-500 hover:text-emerald-600",
          disabled: isSaving,
        }}
        styles={SALON_FORM_MODAL_STYLES}
      >
        <div className="py-4">
          <p className="mb-2 text-slate-700">Are you sure you want to save this salon?</p>
          <p className="text-sm text-slate-500">
            The salon will be added to the system and available for management.
          </p>
        </div>
      </Modal>

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
