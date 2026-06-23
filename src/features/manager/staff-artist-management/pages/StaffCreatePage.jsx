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
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  STAFF_ROLE_OPTIONS,
  STAFF_SPECIALTIES,
  createEmptyStaffForm,
  getStaffInitials,
  submitMockStaffCreate,
  STAFF_STATUS_STYLES,
} from "../services/mockStaffArtists";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-xl border border-pink-100 bg-[#fff6f9] px-4 py-3";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-pink-200";
const selectClassName =
  "w-full rounded-xl border border-pink-100 bg-[#fff6f9] px-4 py-3 text-[13px] text-slate-700 outline-none";

// ── Skill categories (Artist-specific) ───────────────────────────────────────
const SKILL_CATEGORIES = [
  {
    key: "precision",
    label: "Precision",
    sublabel: "Độ chính xác",
    levels: [
      "Sơn lem, viền không đều",
      "Ít lem nhưng vẫn sai form nhỏ",
      "Sơn khá gọn, viền tương đối chuẩn",
      "Gần như không lỗi, đường nét sắc",
      "Hoàn hảo, chi tiết cực nhỏ vẫn chuẩn",
    ],
  },
  {
    key: "color",
    label: "Color",
    sublabel: "Màu sắc",
    levels: [
      "Chọn màu chưa hợp, dễ lệch tone",
      "Biết phối màu cơ bản",
      "Phối màu ổn, làm được ombre đơn giản",
      "Blend màu mượt, hiểu tone da",
      "Master phối màu, tạo style riêng",
    ],
  },
  {
    key: "form",
    label: "Form",
    sublabel: "Form móng",
    levels: [
      "Form lệch, không cân đối",
      "Form lệch, không cân đối (cải thiện)",
      "Form ổn (square, oval…)",
      "Form đẹp, có apex, C-curve",
      "Form chuẩn salon cao cấp",
    ],
  },
  {
    key: "material",
    label: "Material",
    sublabel: "Vật liệu",
    levels: [
      "Không kiểm soát được gel/bột",
      "Làm được nhưng hay lỗi (bong, bọt khí)",
      "Kiểm soát vật liệu ổn",
      "Xử lý tốt nhiều loại vật liệu",
      "Master vật liệu, xử lý mọi tình huống",
    ],
  },
  {
    key: "design",
    label: "Design",
    sublabel: "Thẩm mỹ",
    levels: [
      "Làm theo mẫu, không sáng tạo",
      "Copy mẫu đơn giản",
      "Có gu thẩm mỹ cơ bản",
      "Thiết kế đẹp, hợp trend",
      "Sáng tạo cao, có style riêng",
    ],
  },
  {
    key: "speed",
    label: "Speed",
    sublabel: "Tốc độ",
    levels: [
      ">120 phút – Rất chậm",
      "90–120 phút – Chậm",
      "60–90 phút – Trung bình",
      "40–60 phút – Nhanh",
      "<40 phút – Rất nhanh",
    ],
  },
];

// Pink-themed level colors (replaces rose from file 2)
const LEVEL_COLORS = [
  { bar: "bg-pink-200", text: "text-pink-400", badge: "bg-pink-50 text-pink-400" },
  { bar: "bg-pink-300", text: "text-pink-400", badge: "bg-pink-100 text-pink-500" },
  { bar: "bg-pink-400", text: "text-pink-500", badge: "bg-pink-100 text-pink-600" },
  { bar: "bg-[#ea4f93]", text: "text-[#ea4f93]", badge: "bg-pink-100 text-[#ea4f93]" },
  { bar: "bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93]", text: "text-[#ea4f93]", badge: "bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] text-white" },
];

const RANK_THRESHOLDS = [
  { label: "Beginner", minAvg: 0, color: "bg-slate-100 text-slate-500 border-slate-200" },
  { label: "Intermediate", minAvg: 2, color: "bg-amber-50 text-amber-600 border-amber-200" },
  { label: "Advanced", minAvg: 3, color: "bg-pink-50 text-pink-600 border-pink-200" },
  { label: "Pro Artist", minAvg: 4, color: "bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] text-white border-0" },
];

function getRank(skills) {
  const values = Object.values(skills);
  if (values.length === 0) return RANK_THRESHOLDS[0];
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return [...RANK_THRESHOLDS].reverse().find((r) => avg >= r.minAvg) ?? RANK_THRESHOLDS[0];
}

// ── SkillRatingRow component ──────────────────────────────────────────────────
function SkillRatingRow({ category, value, onChange }) {
  const color = LEVEL_COLORS[(value ?? 1) - 1];
  const description = category.levels[(value ?? 1) - 1];

  return (
    <div className="rounded-2xl border border-pink-100 bg-white px-4 py-3 shadow-[0_4px_12px_rgba(236,72,153,0.05)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <span className="text-[12px] font-black text-slate-700">{category.label}</span>
          <span className="ml-1.5 text-[10px] font-semibold text-slate-400">{category.sublabel}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${color.badge}`}>
          Level {value ?? 1}
        </span>
      </div>

      {/* Level bars */}
      <div className="mb-2 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((level) => {
          const active = (value ?? 1) >= level;
          const levelColor = LEVEL_COLORS[level - 1];
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className="group flex flex-1 flex-col items-center gap-1 transition"
            >
              <div
                className={`h-2 w-full rounded-full transition-all ${
                  active ? levelColor.bar : "bg-pink-100"
                }`}
              />
              <span
                className={`text-[9px] font-bold transition ${
                  active ? levelColor.text : "text-slate-300"
                }`}
              >
                {level}
              </span>
            </button>
          );
        })}
      </div>

      {/* Description */}
      <p className={`text-[11px] font-semibold ${color.text}`}>{description}</p>
    </div>
  );
}

SkillRatingRow.propTypes = {
  category: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    sublabel: PropTypes.string.isRequired,
    levels: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

// ── InfoChip ──────────────────────────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────────
export function StaffCreatePage() {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formData, setFormData] = useState(() => ({
    ...createEmptyStaffForm(),
    skillRatings: { precision: 1, color: 1, form: 1, material: 1, design: 1, speed: 1 },
  }));

  const rank = useMemo(() => getRank(formData.skillRatings ?? {}), [formData.skillRatings]);

  const handleInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSkillChange = (key, level) => {
    setFormData((current) => ({
      ...current,
      skillRatings: { ...current.skillRatings, [key]: level },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    const result = await submitMockStaffCreate(formData);
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

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 rounded-[28px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(236,72,153,0.06)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.managerStaffArtists}
            className="inline-flex shrink-0 rounded-xl border border-pink-100 bg-white p-2 text-pink-500 transition hover:bg-pink-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-[#ea4f93]">Add New Artist</h1>
            <p className="text-[12px] font-medium text-slate-400">
              Create a new staff artist profile, assign role, and skills
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            Save Artist
          </button>
        </div>
      </header>

      {/* Info chips */}
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoChip icon={Users} title="Total Artists" value="18 Active" />
        <InfoChip
          icon={BriefcaseBusiness}
          title="Role"
          value={formData.role}
          tone="text-sky-500"
        />
        <InfoChip
          icon={ShieldCheck}
          title="Status"
          value={formData.status}
          tone="text-violet-500"
        />
        <InfoChip
          icon={Star}
          title="Rating"
          value="New Artist"
          tone="text-amber-500"
        />
      </div>

      {/* Body */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Basic Information */}
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

            {/* Skills & Specialties — skill rating Level 1–5 */}
            <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_45px_rgba(236,72,153,0.04)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#fff3f8] p-2 text-pink-500">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Skills & Specialties</h2>
                    <p className="text-[11px] font-medium text-slate-400">
                      Đánh giá kỹ năng theo từng hạng mục (Level 1–5)
                    </p>
                  </div>
                </div>
                {/* Rank badge */}
                <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black ${rank.color}`}>
                  {rank.label}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {SKILL_CATEGORIES.map((cat) => (
                  <SkillRatingRow
                    key={cat.key}
                    category={cat}
                    value={formData.skillRatings?.[cat.key] ?? 1}
                    onChange={(level) => handleSkillChange(cat.key, level)}
                  />
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Profile Preview */}
          <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_45px_rgba(236,72,153,0.04)]">
            <h2 className="mb-5 text-lg font-bold text-slate-800">Profile Preview</h2>
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-2xl font-black text-pink-500">
                {getStaffInitials(formData.name) || "?"}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{formData.name || "Artist Name"}</h3>
              <p className="text-sm font-medium text-slate-400">{formData.role}</p>

              {/* Rank badge */}
              <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black ${rank.color}`}>
                {rank.label}
              </span>

              {/* Skill mini bars */}
              <div className="mt-4 w-full space-y-1.5">
                {SKILL_CATEGORIES.map((cat) => {
                  const level = formData.skillRatings?.[cat.key] ?? 1;
                  return (
                    <div key={cat.key} className="flex items-center gap-2">
                      <span className="w-16 text-left text-[9px] font-bold text-slate-400">
                        {cat.label}
                      </span>
                      <div className="flex flex-1 gap-0.5">
                        {[1, 2, 3, 4, 5].map((l) => (
                          <div
                            key={l}
                            className={`h-1.5 flex-1 rounded-full ${
                              level >= l
                                ? "bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93]"
                                : "bg-pink-100"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="w-4 text-right text-[9px] font-bold text-pink-400">
                        {level}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_45px_rgba(236,72,153,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Status</h2>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${STAFF_STATUS_STYLES[formData.status]}`}>
                {formData.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Set the initial availability for the artist. This can be changed later from the dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
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
          Are you sure you want to cancel? All unsaved information will be lost.
        </p>
      </Modal>

      {/* Save Modal */}
      <Modal
        title="Save New Artist?"
        open={showSaveModal}
        onOk={handleConfirmSave}
        onCancel={() => setShowSaveModal(false)}
        confirmLoading={isSaving}
        okText="Save Artist"
        okButtonProps={{ className: "bg-pink-500 hover:bg-pink-600 text-white border-pink-500" }}
      >
        <p className="py-4 text-slate-600">
          Ready to add <span className="font-bold text-pink-500">{formData.name}</span> to the team?
        </p>
      </Modal>

      <StaffSaveResultModal
        result={saveResult}
        successTitle="Artist Created!"
        failureTitle="Creation Failed"
        successDescription="New artist profile has been successfully added."
        failureDescription="There was an error creating the artist profile."
        onFailureClose={handleCloseResultModal}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}