import {
  CalendarDays,
  Lock,
  Mail,
  Phone,
  Save,
  Upload,
  User,
  X,
  Camera,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Star,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  createNailArtist,
  fetchSkillTypes,
  createUser,
  assignNailArtistSkills,
} from "../services/nailArtistsService";
import { loadAuthSession } from "../../../core/auth/model/authStorage";
import { StaffSkillAssessmentSection } from "../../../admin/staff-management/components/StaffSkillAssessmentSection";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal.jsx";
import { normalizeAdminSkillType } from "../../../admin/skill-types-management/services/skillTypesManagementService";

// ── Design tokens (from admin page) ─────────────────────────────────────────────────────
const inputWrapperClassName =
  "flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 transition-all duration-300 hover:border-rose-200 hover:bg-[#fff5f9] focus-within:border-rose-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-rose-300 font-medium";

function InfoChip({ icon: Icon, title, value, tone = "text-rose-500" }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white px-4 py-3 shadow-[0_10px_20px_rgba(226,93,143,0.06)]">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl bg-[#fff2f7] p-2 ${tone}`}>
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

function getStaffInitials(fullName) {
  return fullName
    ?.split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NA";
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function StaffCreatePage() {
  const { t, language } = useLanguage();
  const isVi = language === "vi";
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const [skillTypes, setSkillTypes] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    avatarUrl: "",
    imageFile: null,
    skillRatings: {},
  });

  // Load skill types from API
  useEffect(() => {
    let mounted = true;
    fetchSkillTypes({ pageNumber: 1, pageSize: 100 })
      .then((data) => {
        if (!mounted) return;
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const normalizedItems = items.map(normalizeAdminSkillType);
        setSkillTypes(normalizedItems);
        const defaultRatings = {};
        normalizedItems.forEach((s) => { defaultRatings[s.id] = 0; });
        setFormData((prev) => ({ ...prev, skillRatings: defaultRatings }));
      })
      .catch(() => {
        if (mounted) setSkillTypes([]);
      });
    return () => { mounted = false; };
  }, []);

  // Get specialties from skill ratings using skill types
  const specialties = useMemo(() => {
    return skillTypes
      .filter(skill => Number(formData.skillRatings[skill.id] ?? 0) >= 3)
      .map(skill => skill.name || skill.title);
  }, [skillTypes, formData.skillRatings]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target.result);
        handleInputChange("avatarUrl", ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageFile: null, avatarUrl: "" }));
    setImagePreview(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSkillRatingChange = (skillKey, rating) => {
    setFormData((prev) => ({
      ...prev,
      skillRatings: {
        ...prev.skillRatings,
        [skillKey]: rating,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const session = loadAuthSession();
      const salonId = session?.user?.salonId || session?.salonId || "";

      // 1. Create user account
      const createdUser = await createUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
        role: "Staff_Artist",
        salonId,
        imageFile: formData.imageFile,
      });

      // 2. Create Staff Artist profile
      let nailArtistId = createdUser?.staffId;
      if (!nailArtistId) {
        const nailArtist = await createNailArtist({
          userId: createdUser?.userId || createdUser?.id,
          salonId,
        });
        nailArtistId = nailArtist?.staffId || nailArtist?.nailArtistId || nailArtist?.id;
      }

      // 3. Assign skills
      if (nailArtistId) {
        const skills = skillTypes
          .filter(skill => Number(formData.skillRatings[skill.id] ?? 0) > 0)
          .map(skill => ({
            skillTypeId: skill.id,
            level: Math.floor(Number(formData.skillRatings[skill.id] ?? 0)),
          }));

        if (skills.length > 0) {
          await assignNailArtistSkills(nailArtistId, skills);
        }
      }

      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: true,
        message: `${formData.firstName} ${formData.lastName} has been added successfully.`,
      });
    } catch (err) {
      console.error("Error creating artist:", err);
      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: false,
        message: err?.response?.data?.message || err?.message || "Failed to create staff artist.",
      });
    }
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

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      {/* Header */}
      <header className="mb-4 flex flex-col gap-4 rounded-[20px] bg-white/70 px-4 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur sm:mb-5 sm:rounded-[24px] sm:px-5 lg:rounded-[28px] lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-[#cf3d74] sm:text-2xl lg:text-[28px]">
            {isVi ? "Thêm nhân viên làm móng mới" : "Add New Artist"}
          </h1>
          <p className="text-[11px] font-medium text-slate-400 sm:text-[12px]">
            {isVi ? "Tạo hồ sơ nhân viên làm móng mới và gán đánh giá kỹ năng" : "Create a new Staff Artist profile and assign skill ratings"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            {isVi ? "Hủy" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {isVi ? "Lưu nhân viên" : "Save Staff"}
          </button>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Left column — main form */}
        <div className="space-y-4 lg:col-span-2 lg:space-y-5">
          {/* Staff Details */}
          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {isVi ? "Thông tin nhân viên làm móng" : "Staff Artist Details"}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {isVi ? "Tên nghệ sĩ" : "Artist Name"} <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder={isVi ? "Tên" : "First Name"}
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {isVi ? "Họ" : "Last Name"} <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder={isVi ? "Họ" : "Last Name"}
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Email <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <Mail size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder={"Email"}
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {isVi ? "Số điện thoại" : "Phone Number"} <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <Phone size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+84 *** *** ***"
                    className={inputClassName}
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {isVi ? "Mật khẩu" : "Password"} <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <Lock size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder={isVi ? "Ít nhất 6 ký tự" : "Min. 6 characters"}
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {isVi ? "Vai trò" : "Job Title / Role"}
                </span>
                <div className={inputWrapperClassName}>
                  <input
                    type="text"
                    value="Staff_Artist"
                    readOnly
                    className={inputClassName}
                  />
                </div>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  {isVi ? "Ảnh đại diện" : "Avatar"}
                </span>
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-gradient-to-br from-[#fffafc] to-[#fff5f9] px-6 py-8 cursor-pointer transition-all duration-300 hover:border-rose-300 hover:bg-gradient-to-br hover:from-[#fff8fb] hover:to-[#fff1f6] hover:shadow-[0_8px_24px_rgba(226,93,143,0.12)]">
                  {imagePreview ? (
                    <div className="relative w-full flex items-center justify-center">
                      <img crossOrigin="anonymous"
                        src={imagePreview}
                        alt="Preview"
                        className="h-40 w-40 object-cover rounded-full shadow-lg border-4 border-rose-100"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0 right-1/4 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] text-white shadow-lg transition-transform duration-200 hover:scale-110"
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
                        <p className="text-base font-semibold text-slate-700">{isVi ? "Nhấn để tải ảnh lên" : "Click to upload staff avatar"}</p>
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
            </div>
          </div>

          {/* Skills & Specialties */}
          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <StaffSkillAssessmentSection
              ratings={formData.skillRatings}
              specialties={specialties}
              onRatingChange={handleSkillRatingChange}
              skillTypes={skillTypes}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4 lg:space-y-5">
          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {isVi ? "Xem trước thông tin" : "Profile Preview"}
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-5 shadow-[0_2px_12px_rgba(226,93,143,0.05)]">
                <div className="flex flex-col items-center justify-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full overflow-hidden border-4 border-rose-100 shadow-lg mb-4">
                    {imagePreview ? (
                      <img crossOrigin="anonymous"
                        src={imagePreview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-300 text-[28px] font-bold text-white">
                        {getStaffInitials(formData.firstName + " " + formData.lastName || "New Artist")}
                      </div>
                    )}
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-1">
                    {formData.firstName + " " + formData.lastName || "New Artist"}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {isVi ? "Nhân viên làm móng" : "Staff Artist"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                    {specialties.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold text-rose-500"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>

      {/* Modals */}
      <ActionConfirmModal
        open={showCancelModal}
        intent="warning"
        title="Cancel Artist Creation"
        subtitle="You are leaving this artist form without saving."
        description="The new artist profile has not been saved yet. Leave this page only if you want to discard the draft."
        confirmText="Leave Page"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        details={[
          { label: "Draft Status", value: "Not saved yet" },
          { label: "Next Step", value: "Return to artist list" },
        ]}
        warnings={[
          "Artist details and specialties entered here will be lost.",
          "You will need to re-create the profile if you open the create screen again.",
        ]}
      />

      <ActionConfirmModal
        open={showSaveModal}
        intent="success"
        title="Save New Artist"
        subtitle="This will create the profile and save to database."
        description="Confirm to create this artist profile."
        confirmText="Save Artist"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        highlights={[formData.firstName + " " + formData.lastName || "New Artist", "Staff Artist"]}
      />

      <StaffSaveResultModal
        result={saveResult}
        successTitle="Create Successful"
        failureTitle="Create Failed"
        successDescription="The artist has been created successfully."
        failureDescription="Unable to create the artist."
        onFailureClose={() => setSaveResult(null)}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}