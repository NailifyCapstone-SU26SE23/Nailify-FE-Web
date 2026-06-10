import { Modal } from "antd";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  STAFF_ROLE_OPTIONS,
  STAFF_SPECIALTIES,
  getStaffById,
  getStaffInitials,
  submitMockStaffUpdate,
  STAFF_STATUS_STYLES,
} from "../services/mockStaffArtists";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-xl border border-pink-100 bg-[#fff6f9] px-4 py-3";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-pink-200";
const selectClassName =
  "w-full rounded-xl border border-pink-100 bg-[#fff6f9] px-4 py-3 text-[13px] text-slate-700 outline-none";

function InfoChip({ icon: Icon, title, value, tone = "text-pink-500" }) {
  return (
    <div className="rounded-2xl border border-pink-100 bg-white px-4 py-3 shadow-[0_10px_20px_rgba(236,72,153,0.06)]">
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
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const staff = getStaffById(staffId);
    if (staff) {
      // In a real app, we'd fetch more detailed info including email/phone
      setFormData({
        ...staff,
        email: `${staff.name.toLowerCase().replace(" ", ".")}@nailify.com`,
        phone: "+1 (555) 000-0000",
      });
    } else {
      navigate(ROUTES.managerStaffArtists);
    }
  }, [staffId, navigate]);

  const handleInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleSkill = (skill) => {
    setFormData((current) => ({
      ...current,
      skills: current.skills.includes(skill)
        ? current.skills.filter((item) => item !== skill)
        : [...current.skills, skill],
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
    navigate(ROUTES.managerStaffArtists, {
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
    navigate(ROUTES.managerStaffArtists);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  if (!formData) return null;

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      <header className="mb-5 flex flex-col gap-4 rounded-[28px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(236,72,153,0.06)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.managerStaffArtists}
            className="inline-flex shrink-0 rounded-xl border border-pink-100 bg-white p-2 text-pink-500 transition hover:bg-pink-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-[#ea4f93]">Update Artist</h1>
            <p className="text-[12px] font-medium text-slate-400">
              Edit profile information, role, and skills for {formData.name}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <Trash2 size={14} />
            Remove
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-[11px] font-bold text-pink-500 transition hover:bg-pink-50"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-4 py-2 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </header>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoChip icon={Users} title="Current Role" value={formData.role} />
        <InfoChip
          icon={Star}
          title="Rating"
          value={`${formData.rating.toFixed(1)} / 5.0`}
          tone="text-amber-500"
        />
        <InfoChip
          icon={ShieldCheck}
          title="Current Status"
          value={formData.status}
          tone="text-violet-500"
        />
        <InfoChip
          icon={BriefcaseBusiness}
          title="Revenue (MTD)"
          value={formData.stats.revenue}
          tone="text-emerald-500"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_45px_rgba(236,72,153,0.04)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[#fff3f8] p-2 text-pink-500">
                  <User size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Basic Information</h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Full Name
                  </label>
                  <div className={inputWrapperClassName}>
                    <input
                      type="text"
                      placeholder="e.g. Mia Chen"
                      className={inputClassName}
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Professional Role
                  </label>
                  <select
                    className={selectClassName}
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                  >
                    {STAFF_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </label>
                  <div className={inputWrapperClassName}>
                    <Mail size={14} className="text-pink-300" />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      className={inputClassName}
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Phone Number
                  </label>
                  <div className={inputWrapperClassName}>
                    <Phone size={14} className="text-pink-300" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className={inputClassName}
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_45px_rgba(236,72,153,0.04)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[#fff3f8] p-2 text-pink-500">
                  <Sparkles size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Skills & Specialties</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {STAFF_SPECIALTIES.map((skill) => {
                  const isSelected = formData.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full px-4 py-2 text-[12px] font-bold transition-all ${
                        isSelected
                          ? "bg-[#ea4f93] text-white shadow-lg shadow-pink-200"
                          : "bg-[#fff6f9] text-pink-400 hover:bg-pink-50"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_45px_rgba(236,72,153,0.04)]">
            <h2 className="mb-5 text-lg font-bold text-slate-800">Profile Preview</h2>
            <div className="flex flex-col items-center py-4 text-center">
              <div className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${formData.avatarTone} text-2xl font-black text-white`}>
                {getStaffInitials(formData.name)}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{formData.name}</h3>
              <p className="text-sm font-medium text-slate-400">{formData.role}</p>
              
              <div className="mt-1 flex items-center justify-center gap-1 text-[#fbbf24]">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-bold text-[#ea4f93]">{formData.rating.toFixed(1)}</span>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-pink-50 px-2.5 py-0.5 text-[10px] font-bold text-pink-500"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_45px_rgba(236,72,153,0.04)]">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-bold text-slate-800">Status</h2>
               <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${STAFF_STATUS_STYLES[formData.status]}`}>
                 {formData.status}
               </span>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed">
               Artist status is updated automatically based on bookings and schedule. 
               You can manually override this in the management dashboard.
             </p>
          </div>
        </div>
      </div>

      <Modal
        title="Cancel Changes?"
        open={showCancelModal}
        onOk={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        okText="Yes, Cancel"
        cancelText="Keep Editing"
        okButtonProps={{ className: "bg-pink-500 hover:bg-pink-600 text-white border-pink-500" }}
      >
        <p className="py-4 text-slate-600">
          Are you sure you want to cancel? All unsaved changes for <span className="font-bold">{formData.name}</span> will be lost.
        </p>
      </Modal>

      <Modal
        title="Save Changes?"
        open={showSaveModal}
        onOk={handleConfirmSave}
        onCancel={() => setShowSaveModal(false)}
        confirmLoading={isSaving}
        okText="Save Changes"
        okButtonProps={{ className: "bg-pink-500 hover:bg-pink-600 text-white border-pink-500" }}
      >
        <p className="py-4 text-slate-600">
          Ready to save the updated profile for <span className="font-bold text-pink-500">{formData.name}</span>?
        </p>
      </Modal>

      <Modal
        title="Remove Artist?"
        open={showDeleteModal}
        onOk={() => {
          setShowDeleteModal(false);
          navigate(ROUTES.managerStaffArtists);
        }}
        onCancel={() => setShowDeleteModal(false)}
        okText="Remove Artist"
        okType="danger"
        okButtonProps={{ className: "bg-rose-500 hover:bg-rose-600 text-white border-rose-500" }}
      >
        <p className="py-4 text-slate-600">
          Are you sure you want to remove <span className="font-bold text-rose-500">{formData.name}</span> from the system? This action cannot be undone.
        </p>
      </Modal>

      <StaffSaveResultModal
        result={saveResult}
        successTitle="Profile Updated!"
        failureTitle="Update Failed"
        successDescription="Artist profile has been successfully updated."
        failureDescription="There was an error updating the artist profile."
        onFailureClose={handleCloseResultModal}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}
