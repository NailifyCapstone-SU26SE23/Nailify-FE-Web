import { Modal } from "antd";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { TimePicker } from "../../../../shared/components/ui/TimePicker";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  STAFF_CREATE_STATUS_OPTIONS,
  STAFF_DAYS_OF_WEEK,
  STAFF_EMPLOYMENT_TYPES,
  STAFF_FORM_MODAL_STYLES,
  STAFF_UPDATE_CHECKLIST,
  STAFF_ROLE_OPTIONS,
  STAFF_SALON_OPTIONS,
  STAFF_SPECIALTIES,
  createEmptyStaffForm,
  fetchMockStaffFormById,
  getStaffCreateStatusOption,
  getStaffInitials,
  getStaffRoleOption,
  submitMockStaffUpdate,
} from "../services/mockStaff";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-xl border border-rose-100 bg-[#fff6f9] px-4 py-3";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-rose-200";
const selectClassName =
  "w-full rounded-xl border border-rose-100 bg-[#fff6f9] px-4 py-3 text-[13px] text-slate-700 outline-none";

const readOnlyInputClassName = `${inputClassName} cursor-not-allowed text-slate-500`;

function StaffUpdateLoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[20px] bg-white/65 p-8 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-rose-500" />
        <p className="mt-4 text-sm text-slate-600">Loading staff data...</p>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, title, value, tone = "text-rose-500" }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white px-4 py-3 shadow-[0_10px_20px_rgba(226,93,143,0.06)]">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl bg-[#fff3f8] p-2 ${tone}`}>
          <Icon size={14} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</p>
          <p className="text-[12px] font-bold text-slate-700">{value}</p>
        </div>
      </div>
    </div>
  );
}

InfoChip.propTypes = {
  icon: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  tone: PropTypes.string,
  value: PropTypes.string.isRequired,
};

export function StaffUpdatePage() {
  const navigate = useNavigate();
  const { staffId } = useParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formData, setFormData] = useState(createEmptyStaffForm);

  useEffect(() => {
    let isMounted = true;

    const loadStaff = async () => {
      setIsLoading(true);
      setIsNotFound(false);

      const staffForm = await fetchMockStaffFormById(staffId);

      if (!isMounted) {
        return;
      }

      if (!staffForm) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      setFormData(staffForm);
      setIsLoading(false);
    };

    loadStaff();

    return () => {
      isMounted = false;
    };
  }, [staffId]);

  const selectedRole = useMemo(
    () => getStaffRoleOption(formData.role),
    [formData.role],
  );
  const selectedStatus = useMemo(
    () => getStaffCreateStatusOption(formData.status),
    [formData.status],
  );

  const handleInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleSpecialty = (specialty) => {
    setFormData((current) => ({
      ...current,
      specialties: current.specialties.includes(specialty)
        ? current.specialties.filter((item) => item !== specialty)
        : [...current.specialties, specialty],
    }));
  };

  const handleScheduleChange = (day, field, value) => {
    setFormData((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        [day]: {
          ...current.schedule[day],
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

    const result = await submitMockStaffUpdate(staffId, formData);

    setIsSaving(false);
    setShowSaveModal(false);
    setSaveResult(result);
  };

  const handleCloseResultModal = () => {
    setSaveResult(null);
  };

  const handleSuccessComplete = useCallback(() => {
    navigate(ROUTES.adminStaff, {
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
    navigate(ROUTES.adminStaff);
  };

  if (isNotFound) {
    return <Navigate to={ROUTES.adminStaff} replace />;
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      <header className="mb-5 flex flex-col gap-4 rounded-[28px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminStaff}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-[#cf3d74]">Update Staff</h1>
            <p className="text-[12px] font-medium text-slate-400">
              Update staff information for #{formData.staffId || staffId}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={14} />
            Update Staff
          </button>
        </div>
      </header>

      {isLoading ? (
        <StaffUpdateLoadingState />
      ) : (
        <>
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoChip icon={Users} title="Current Team" value="84 Active Profiles" />
        <InfoChip
          icon={BriefcaseBusiness}
          title="Assigned Salon"
          value={formData.assignedSalon}
          tone="text-sky-500"
        />
        <InfoChip
          icon={ShieldCheck}
          title="Role"
          value={selectedRole?.label ?? "-"}
          tone="text-violet-500"
        />
        <InfoChip
          icon={Sparkles}
          title="Status"
          value={selectedStatus?.label ?? "-"}
          tone="text-emerald-500"
        />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-[28px] bg-white/65 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
            <h2 className="mb-4 text-[18px] font-bold text-slate-800">Staff Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
                  Full Name <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(event) => handleInputChange("fullName", event.target.value)}
                    placeholder="Enter full name"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
                  Staff ID <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <span className="text-[12px] font-bold text-rose-300">#</span>
                  <input
                    type="text"
                    value={formData.staffId}
                    readOnly
                    className={readOnlyInputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">
                  Email <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <Mail size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleInputChange("email", event.target.value)}
                    placeholder="staff@nailify.com"
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
                    placeholder="+1 (555) 123-4567"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">Role</span>
                <select
                  value={formData.role}
                  onChange={(event) => handleInputChange("role", event.target.value)}
                  className={selectClassName}
                >
                  {STAFF_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">Assigned Salon</span>
                <select
                  value={formData.assignedSalon}
                  onChange={(event) => handleInputChange("assignedSalon", event.target.value)}
                  className={selectClassName}
                >
                  {STAFF_SALON_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">Employment Type</span>
                <select
                  value={formData.employmentType}
                  onChange={(event) => handleInputChange("employmentType", event.target.value)}
                  className={selectClassName}
                >
                  {STAFF_EMPLOYMENT_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">Status</span>
                <select
                  value={formData.status}
                  onChange={(event) => handleInputChange("status", event.target.value)}
                  className={selectClassName}
                >
                  {STAFF_CREATE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">Experience</span>
                <div className={inputWrapperClassName}>
                  <BriefcaseBusiness size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(event) => handleInputChange("experience", event.target.value)}
                    placeholder="e.g. 4 years"
                    className={inputClassName}
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-500">Emergency Contact</span>
                <div className={inputWrapperClassName}>
                  <Phone size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(event) => handleInputChange("emergencyContact", event.target.value)}
                    placeholder="Name and number"
                    className={inputClassName}
                  />
                </div>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[12px] font-semibold text-slate-500">Address</span>
                <div className={`${inputWrapperClassName} items-start`}>
                  <MapPin size={14} className="mt-0.5 shrink-0 text-rose-300" />
                  <textarea
                    value={formData.address}
                    onChange={(event) => handleInputChange("address", event.target.value)}
                    placeholder="Current home address"
                    className={`${inputClassName} resize-none`}
                    rows={3}
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-[28px] bg-white/65 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
            <h2 className="mb-4 text-[18px] font-bold text-slate-800">Skills & Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {STAFF_SPECIALTIES.map((item) => {
                const active = formData.specialties.includes(item);

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSpecialty(item)}
                    className={`rounded-full px-4 py-2 text-[11px] font-bold transition ${
                      active
                        ? "bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] text-white shadow-[0_10px_20px_rgba(226,93,143,0.2)]"
                        : "border border-rose-100 bg-white text-slate-500 hover:bg-rose-50"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-[12px] font-semibold text-slate-500">Notes</span>
              <textarea
                value={formData.notes}
                onChange={(event) => handleInputChange("notes", event.target.value)}
                placeholder="Add performance notes, certifications, or internal remarks"
                className="w-full rounded-xl border border-rose-100 bg-[#fff6f9] px-4 py-3 text-[13px] text-slate-700 outline-none placeholder:text-rose-200"
                rows={4}
              />
            </label>
          </section>

          <section className="rounded-[28px] bg-white/65 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-rose-500" />
              <h2 className="text-[18px] font-bold text-slate-800">Weekly Schedule</h2>
            </div>

            <div className="space-y-3">
              {STAFF_DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.key}
                  className="grid gap-3 rounded-2xl border border-rose-100 bg-white px-4 py-3 md:grid-cols-[1.1fr_120px_120px]"
                >
                  <label className="flex items-center gap-3 text-[12px] font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.schedule[day.key].enabled}
                      onChange={(event) =>
                        handleScheduleChange(day.key, "enabled", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-rose-200 accent-rose-500"
                    />
                    <span>{day.label}</span>
                  </label>

                  <TimePicker
                    value={formData.schedule[day.key].start}
                    onChange={(value) => handleScheduleChange(day.key, "start", value)}
                    placeholder="Start"
                    disabled={!formData.schedule[day.key].enabled}
                  />

                  <TimePicker
                    value={formData.schedule[day.key].end}
                    onChange={(value) => handleScheduleChange(day.key, "end", value)}
                    placeholder="End"
                    disabled={!formData.schedule[day.key].enabled}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-[#fff4f8] to-[#fffdfd] p-5 shadow-[0_20px_40px_rgba(226,93,143,0.08)]">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-xl bg-rose-100 p-2 text-rose-500">
                <User size={14} />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-slate-800">Profile Preview</h3>
                <p className="text-[11px] font-medium text-slate-400">
                  Updated summary for this team member
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-rose-100 bg-white p-4 text-center shadow-[0_10px_20px_rgba(226,93,143,0.06)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-300 text-[20px] font-black text-white">
                {getStaffInitials(formData.fullName || "NS")}
              </div>
              <h4 className="mt-3 text-[15px] font-black text-slate-800">
                {formData.fullName || "Staff Member"}
              </h4>
              <p className="text-[10px] font-semibold text-slate-400">
                {selectedRole?.label ?? "Role"} · #{formData.staffId}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {formData.specialties.slice(0, 3).map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold text-rose-500"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-medium text-slate-400">
                Assigned Salon:{" "}
                <span className="font-bold text-rose-400">{formData.assignedSalon}</span>
              </p>
            </div>
          </section>

          <section className="rounded-[28px] bg-white/65 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
            <h3 className="mb-4 text-[14px] font-black text-slate-800">Update Checklist</h3>
            <div className="space-y-3">
              {STAFF_UPDATE_CHECKLIST.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white px-4 py-3"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <p className="text-[11px] font-semibold text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-white/65 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
            <h3 className="mb-4 text-[14px] font-black text-slate-800">Assigned Summary</h3>
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#fff6f9] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Salon
                </p>
                <p className="mt-1 text-[12px] font-bold text-slate-700">{formData.assignedSalon}</p>
              </div>
              <div className="rounded-2xl bg-[#fff6f9] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Employment Type
                </p>
                <p className="mt-1 text-[12px] font-bold text-slate-700">{formData.employmentType}</p>
              </div>
              <div className="rounded-2xl bg-[#fff6f9] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Primary Contact
                </p>
                <p className="mt-1 text-[12px] font-bold text-slate-700">{formData.phone || "—"}</p>
              </div>
              <div className="rounded-2xl bg-[#fff6f9] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Status
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedStatus?.color ?? ""}`}
                >
                  {selectedStatus?.label}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </form>
        </>
      )}

      <Modal
        open={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        footer={null}
        styles={STAFF_FORM_MODAL_STYLES}
      >
        <div className="py-3">
          <h3 className="text-[18px] font-black text-slate-800">Discard changes?</h3>
          <p className="mt-2 text-[13px] text-slate-500">
            The updates to this staff profile have not been saved yet. Do you want to leave this
            page?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="rounded-full border border-rose-200 bg-white px-4 py-2 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
            >
              Continue Editing
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2 text-[11px] font-bold text-white shadow-[0_10px_20px_rgba(226,93,143,0.22)] transition hover:opacity-95"
            >
              Leave Page
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Confirm Update"
        open={showSaveModal}
        onOk={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        okText="Yes, Update Staff"
        cancelText="Review Again"
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
        styles={STAFF_FORM_MODAL_STYLES}
      >
        <div className="py-4">
          <p className="mb-2 text-slate-700">Are you sure you want to update this staff member?</p>
          <p className="text-sm text-slate-500">
            This will update the profile for{" "}
            <span className="font-semibold text-slate-700">{formData.fullName}</span> and keep it
            assigned to{" "}
            <span className="font-semibold text-slate-700">{formData.assignedSalon}</span>.
          </p>
        </div>
      </Modal>

      <StaffSaveResultModal
        result={saveResult}
        successTitle="Update Successful"
        failureTitle="Update Failed"
        successDescription="The staff member has been updated successfully."
        failureDescription="Unable to update the staff member."
        onFailureClose={handleCloseResultModal}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}
