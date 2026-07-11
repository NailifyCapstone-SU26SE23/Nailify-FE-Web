import {
  ArrowLeft,
  Lock,
  Mail,
  Phone,
  Save,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  createNailArtist,
  fetchSkillTypes,
  createUser,
  assignNailArtistSkills,
} from "../services/nailArtistsService";
import { loadAuthSession } from "../../../core/auth/model/authStorage";

// ── Design tokens ─────────────────────────────────────────────────────────────
const inputWrapper =
  "flex items-center gap-2.5 rounded-[14px] border border-[#f0e6ed] bg-[#fdf8fb] px-4 py-3 transition-all duration-200 hover:border-[#dda0c4] focus-within:border-[#ea4f93] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.1)]";
const inputClass =
  "w-full min-w-0 bg-transparent text-[13.5px] font-medium text-slate-700 outline-none placeholder:text-[#c0a0b4]";
const labelClass =
  "block text-[10.5px] font-bold uppercase tracking-[0.13em] text-slate-400 mb-1.5";
const sectionCard =
  "rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#f5edf2]";

// ── Rank calculation from average skill ratings ────────────────────────────────
const RANK_THRESHOLDS = [
  { label: "Beginner",     minAvg: 0, bg: "bg-slate-100 text-slate-500 border-slate-200" },
  { label: "Intermediate", minAvg: 2, bg: "bg-amber-50 text-amber-600 border-amber-200" },
  { label: "Advanced",     minAvg: 3, bg: "bg-pink-50 text-[#ea4f93] border-pink-200" },
  { label: "Pro Artist",   minAvg: 4, bg: "bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] text-white border-0" },
];

function getRank(ratings) {
  const vals = Object.values(ratings).map(Number).filter(v => !isNaN(v));
  if (!vals.length) return RANK_THRESHOLDS[0];
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  return [...RANK_THRESHOLDS].reverse().find(r => avg >= r.minAvg) ?? RANK_THRESHOLDS[0];
}

const LEVEL_COLORS = [
  "bg-pink-100",
  "bg-pink-200",
  "bg-pink-300",
  "bg-pink-400",
  "bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93]",
];

// ── Skill rating slider ────────────────────────────────────────────────────────
function SkillRatingCard({ skill, value, onChange }) {
  const normalized = Math.max(0, Math.min(5, Number(value) || 0));
  const LEVEL_LABELS = { 0: "Not rated", 1: "Beginner", 2: "Foundation", 3: "Intermediate", 4: "Advanced", 5: "Expert" };

  return (
    <div className="rounded-[18px] border border-[#f0e6ed] bg-[#fdf8fb] p-4 transition-all duration-200 hover:border-[#dda0c4] hover:shadow-[0_4px_16px_rgba(234,79,147,0.08)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black text-slate-700">{skill.name || skill.title}</p>
          {skill.description && (
            <p className="mt-0.5 truncate text-[10px] text-slate-400">{skill.description}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-[#fff0f7] px-2 py-0.5 text-[10px] font-bold text-[#ea4f93]">
          {LEVEL_LABELS[normalized]}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => {
          const active = normalized >= level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(skill.id, level === normalized ? 0 : level)}
              className="group flex flex-1 flex-col items-center gap-1 transition-transform active:scale-95"
            >
              <div
                className={`h-2 w-full rounded-full transition-all duration-200 ${
                  active ? LEVEL_COLORS[level - 1] : "bg-pink-100"
                }`}
              />
              <span className={`text-[8.5px] font-bold transition ${active ? "text-[#ea4f93]" : "text-slate-300"}`}>
                {level}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

SkillRatingCard.propTypes = {
  skill: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkillSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse rounded-[18px] border border-[#f0e6ed] bg-[#fdf8fb] p-4">
          <div className="mb-3 h-3 w-24 rounded-full bg-pink-100" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-2 flex-1 rounded-full bg-pink-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sidebar preview ────────────────────────────────────────────────────────────
function ProfilePreview({ firstName, lastName, role, skillRatings, skillTypes }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const rank = getRank(skillRatings);

  return (
    <div className={sectionCard}>
      <h3 className="mb-4 text-[13px] font-bold text-slate-700">Profile Preview</h3>
      <div className="flex flex-col items-center py-3 text-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-xl font-black text-[#ea4f93]">
          {initials}
        </div>
        <p className="text-[15px] font-bold text-slate-800">
          {[firstName, lastName].filter(Boolean).join(" ") || "New Artist"}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400">{role || "Staff Artist"}</p>
        <span className={`mt-2 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${rank.bg}`}>
          {rank.label}
        </span>

        {skillTypes.length > 0 && (
          <div className="mt-4 w-full space-y-1.5">
            {skillTypes.slice(0, 4).map((s) => {
              const level = Number(skillRatings[s.id] ?? 0);
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-16 text-left text-[9px] font-bold text-slate-400 truncate">
                    {s.name || s.title}
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
                  <span className="w-4 text-right text-[9px] font-bold text-pink-400">{level}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

ProfilePreview.propTypes = {
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  role: PropTypes.string,
  skillRatings: PropTypes.objectOf(PropTypes.number).isRequired,
  skillTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

// ── Main page ──────────────────────────────────────────────────────────────────
export function StaffCreatePage() {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const [skillTypes, setSkillTypes] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "Nail Artist",
    avatarUrl: "",
    imageFile: null,
    skillRatings: {},
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [formError, setFormError] = useState("");

  // Load skill types from API
  useEffect(() => {
    let mounted = true;
    setLoadingSkills(true);
    fetchSkillTypes({ pageNumber: 1, pageSize: 100 })
      .then((data) => {
        if (!mounted) return;
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setSkillTypes(items);
        const defaultRatings = {};
        items.forEach((s) => { defaultRatings[s.id] = 0; });
        setFormData((prev) => ({ ...prev, skillRatings: defaultRatings }));
      })
      .catch(() => {
        if (mounted) setSkillTypes([]);
      })
      .finally(() => {
        if (mounted) setLoadingSkills(false);
      });
    return () => { mounted = false; };
  }, []);

  const rank = useMemo(() => getRank(formData.skillRatings), [formData.skillRatings]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  const handleSkillChange = (skillId, level) => {
    setFormData((prev) => ({
      ...prev,
      skillRatings: { ...prev.skillRatings, [skillId]: level },
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, imageFile: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageFile: null, avatarUrl: "" }));
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!formData.firstName.trim()) return setFormError("First name is required.");
    if (!formData.email.trim()) return setFormError("Email is required.");
    if (!formData.password.trim()) return setFormError("Password is required.");
    if (formData.password.length < 6) return setFormError("Password must be at least 6 characters.");
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
        role: "NAIL_ARTIST",
        salonId,
        imageFile: formData.imageFile,
      });

      // 2. Create nail artist profile
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
          .filter((s) => Number(formData.skillRatings[s.id] ?? 0) > 0)
          .map((s) => ({
            skillTypeId: s.id,
            level: Math.floor(Number(formData.skillRatings[s.id])),
          }));
        if (skills.length > 0) {
          await assignNailArtistSkills(nailArtistId, skills);
        }
      }

      setSaveResult({
        success: true,
        message: `${formData.firstName} ${formData.lastName} has been added successfully.`,
      });
    } catch (err) {
      setSaveResult({
        success: false,
        message: err?.response?.data?.message || err?.message || "Failed to create staff artist.",
      });
    } finally {
      setIsSaving(false);
      setShowSaveModal(false);
    }
  };

  const handleSuccessComplete = useCallback(() => {
    navigate(ROUTES.managerStaffArtists, { state: { flashMessage: saveResult?.message } });
  }, [navigate, saveResult?.message]);

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 rounded-[24px] bg-white/80 px-5 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-[#f5edf2] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.managerStaffArtists}
            className="inline-flex shrink-0 items-center justify-center rounded-[12px] border border-[#f0e6ed] bg-white p-2 text-[#ea4f93] transition hover:bg-[#fff0f7] active:scale-95"
          >
            <ArrowLeft size={17} />
          </Link>
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-slate-800">Add New Artist</h1>
            <p className="text-[11.5px] font-medium text-slate-400">
              Create a new nail artist profile and assign skill ratings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#f0e6ed] bg-white px-4 py-2 text-[11.5px] font-bold text-slate-500 transition hover:bg-[#fdf8fb] active:scale-95"
          >
            <X size={13} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-4 py-2 text-[11.5px] font-bold text-white shadow-[0_6px_20px_rgba(234,79,147,0.3)] transition hover:opacity-90 active:scale-95"
          >
            <Save size={13} />
            Save Artist
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {formError && (
        <div className="mb-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] font-semibold text-red-600">
          {formError}
        </div>
      )}

      {/* Body */}
      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3">
        {/* Left column — main form */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Basic Info */}
          <div className={sectionCard}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="rounded-[10px] bg-[#fff0f7] p-2 text-[#ea4f93]">
                <User size={16} />
              </div>
              <h2 className="text-[15px] font-bold text-slate-800">Basic Information</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>First Name <span className="text-[#ea4f93]">*</span></label>
                <div className={inputWrapper}>
                  <input
                    type="text"
                    placeholder="Minh"
                    className={inputClass}
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Last Name</label>
                <div className={inputWrapper}>
                  <input
                    type="text"
                    placeholder="Nguyen"
                    className={inputClass}
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address <span className="text-[#ea4f93]">*</span></label>
                <div className={inputWrapper}>
                  <Mail size={13} className="shrink-0 text-[#dda0c4]" />
                  <input
                    type="email"
                    placeholder="artist@nailify.com"
                    className={inputClass}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <div className={inputWrapper}>
                  <Phone size={13} className="shrink-0 text-[#dda0c4]" />
                  <input
                    type="tel"
                    placeholder="+84 912 345 678"
                    className={inputClass}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Password <span className="text-[#ea4f93]">*</span></label>
                <div className={inputWrapper}>
                  <Lock size={13} className="shrink-0 text-[#dda0c4]" />
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    className={inputClass}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Job Title / Role</label>
                <div className={inputWrapper}>
                  <input
                    type="text"
                    placeholder="e.g. Senior Nail Artist"
                    className={inputClass}
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Avatar Upload */}
          <div className={sectionCard}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="rounded-[10px] bg-[#fff0f7] p-2 text-[#ea4f93]">
                <Upload size={16} />
              </div>
              <h2 className="text-[15px] font-bold text-slate-800">Profile Photo</h2>
            </div>

            {imagePreview ? (
              <div className="relative w-fit">
                <img
                  src={imagePreview}
                  alt="Avatar preview"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="h-36 w-36 rounded-[20px] object-cover shadow-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] text-white shadow-md transition hover:scale-110 active:scale-95"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-[#f0b7cf] bg-[#fdf8fb] py-8 transition-all duration-200 hover:border-[#ea4f93] hover:bg-[#fff5f9]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] text-white">
                  <Upload size={22} />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-slate-700">Click to upload photo</p>
                  <p className="text-[11px] text-slate-400">PNG, JPG up to 5MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Skills & Specialties */}
          <div className={sectionCard}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-[10px] bg-[#fff0f7] p-2 text-[#ea4f93]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-800">Skills &amp; Specialties</h2>
                  <p className="text-[10.5px] text-slate-400">Rate each skill from 1 (Beginner) to 5 (Expert)</p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-[10.5px] font-black ${rank.bg}`}>
                {rank.label}
              </span>
            </div>

            {loadingSkills ? (
              <SkillSkeleton />
            ) : skillTypes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Sparkles size={28} className="text-pink-200" />
                <p className="text-[12px] font-semibold text-slate-400">No skill types found.</p>
                <p className="text-[11px] text-slate-300">Ask admin to create skill types first.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {skillTypes.map((skill) => (
                  <SkillRatingCard
                    key={skill.id}
                    skill={skill}
                    value={Number(formData.skillRatings[skill.id] ?? 0)}
                    onChange={handleSkillChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          <ProfilePreview
            firstName={formData.firstName}
            lastName={formData.lastName}
            role={formData.role}
            skillRatings={formData.skillRatings}
            skillTypes={skillTypes}
          />

          {/* Summary card */}
          <div className={sectionCard}>
            <h3 className="mb-3 text-[13px] font-bold text-slate-700">Summary</h3>
            <dl className="space-y-2.5 text-[12px]">
              {[
                { label: "Name", value: [formData.firstName, formData.lastName].filter(Boolean).join(" ") || "—" },
                { label: "Email", value: formData.email || "—" },
                { label: "Role", value: formData.role || "—" },
                { label: "Skills rated", value: `${Object.values(formData.skillRatings).filter(v => v > 0).length} / ${skillTypes.length}` },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-3">
                  <dt className="font-semibold text-slate-400">{item.label}</dt>
                  <dd className="text-right font-semibold text-slate-700 max-w-[140px] truncate">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Actions */}
          <div className={sectionCard}>
            <h3 className="mb-3 text-[13px] font-bold text-slate-700">Actions</h3>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-[12px] font-bold text-white shadow-[0_6px_20px_rgba(234,79,147,0.28)] transition hover:opacity-90 active:scale-[0.98]"
              >
                <Save size={13} />
                Save Artist
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#f0e6ed] py-2.5 text-[12px] font-bold text-slate-500 transition hover:bg-[#fdf8fb] active:scale-[0.98]"
              >
                <X size={13} />
                Discard
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Cancel confirm modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
            <h2 className="text-[16px] font-bold text-slate-800">Discard changes?</h2>
            <p className="mt-1.5 text-[12.5px] text-slate-500">
              All unsaved information for this artist will be lost.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-full border border-[#f0e6ed] py-2 text-[12px] font-bold text-slate-600 transition hover:bg-[#fdf8fb]"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => { setShowCancelModal(false); navigate(ROUTES.managerStaffArtists); }}
                className="flex-1 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] py-2 text-[12px] font-bold text-white transition hover:opacity-90"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save confirm modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
            <h2 className="text-[16px] font-bold text-slate-800">Save new artist?</h2>
            <p className="mt-1.5 text-[12.5px] text-slate-500">
              Ready to add{" "}
              <span className="font-bold text-[#ea4f93]">
                {[formData.firstName, formData.lastName].filter(Boolean).join(" ")}
              </span>{" "}
              to your team?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => !isSaving && setShowSaveModal(false)}
                disabled={isSaving}
                className="flex-1 rounded-full border border-[#f0e6ed] py-2 text-[12px] font-bold text-slate-600 transition hover:bg-[#fdf8fb] disabled:opacity-50"
              >
                Review
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2 text-[12px] font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <StaffSaveResultModal
        result={saveResult}
        successTitle="Artist Created"
        failureTitle="Creation Failed"
        successDescription="The new artist profile has been added successfully."
        failureDescription="An error occurred while creating the artist profile."
        onFailureClose={() => setSaveResult(null)}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}