import {
  ArrowLeft,
  Mail,
  Phone,
  Save,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  fetchNailArtistById,
  fetchNailArtistSkills,
  fetchSkillTypes,
  updateUser,
  assignNailArtistSkills,
} from "../services/nailArtistsService";
import { fetchUserById } from "../../bookings/services/bookingsService";

// ── Design tokens ─────────────────────────────────────────────────────────────
const inputWrapper =
  "flex items-center gap-2.5 rounded-[14px] border border-[#f0e6ed] bg-[#fdf8fb] px-4 py-3 transition-all duration-200 hover:border-[#dda0c4] focus-within:border-[#ea4f93] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.1)]";
const inputClass =
  "w-full min-w-0 bg-transparent text-[13.5px] font-medium text-slate-700 outline-none placeholder:text-[#c0a0b4]";
const labelClass =
  "block text-[10.5px] font-bold uppercase tracking-[0.13em] text-slate-400 mb-1.5";
const sectionCard =
  "rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#f5edf2]";
const readOnlyClass = `${inputClass} cursor-not-allowed text-slate-400`;

// ── Rank calculation ───────────────────────────────────────────────────────────
const RANK_THRESHOLDS = [
  { label: "Beginner",     minAvg: 0, bg: "bg-slate-100 text-slate-500 border-slate-200" },
  { label: "Intermediate", minAvg: 2, bg: "bg-amber-50 text-amber-600 border-amber-200" },
  { label: "Advanced",     minAvg: 3, bg: "bg-pink-50 text-[#ea4f93] border-pink-200" },
  { label: "Pro Artist",   minAvg: 4, bg: "bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] text-white border-0" },
];

function getRank(ratings) {
  const vals = Object.values(ratings).map(Number).filter(v => !isNaN(v) && v > 0);
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

// ── Skill rating card ──────────────────────────────────────────────────────────
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

// ── Skeleton ───────────────────────────────────────────────────────────────────
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

// ── Loading full page skeleton ─────────────────────────────────────────────────
function PageLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1300px] animate-pulse">
      <div className="mb-5 h-16 rounded-[24px] bg-white shadow-sm" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-[24px] bg-white p-5 shadow-sm">
              <div className="mb-4 h-4 w-32 rounded-full bg-pink-100" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-12 rounded-[14px] bg-[#fdf8fb]" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <div className="h-64 rounded-[24px] bg-white shadow-sm" />
          <div className="h-32 rounded-[24px] bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}

// ── Status toggle ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "Active", label: "Active", active: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  { value: "Inactive", label: "Inactive", active: "bg-rose-100 text-rose-600 border-rose-200" },
];

// ── Sidebar preview ────────────────────────────────────────────────────────────
function ProfilePreview({ formData, skillTypes }) {
  const initials = [formData.firstName?.[0], formData.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const rank = getRank(formData.skillRatings || {});

  return (
    <div className={sectionCard}>
      <h3 className="mb-4 text-[13px] font-bold text-slate-700">Profile Preview</h3>
      <div className="flex flex-col items-center py-3 text-center">
        {formData.avatarUrl ? (
          <img
            src={formData.avatarUrl}
            alt={formData.firstName}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className="mb-3 h-20 w-20 rounded-full object-cover shadow-md"
          />
        ) : (
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-xl font-black text-[#ea4f93]">
            {initials}
          </div>
        )}
        <p className="text-[15px] font-bold text-slate-800">
          {[formData.firstName, formData.lastName].filter(Boolean).join(" ") || "Artist"}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400">{formData.role || "Staff Artist"}</p>
        <span className={`mt-2 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${rank.bg}`}>
          {rank.label}
        </span>

        {skillTypes.length > 0 && (
          <div className="mt-4 w-full space-y-1.5">
            {skillTypes.slice(0, 4).map((s) => {
              const level = Number((formData.skillRatings || {})[s.id] ?? 0);
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
  formData: PropTypes.object.isRequired,
  skillTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

// ── Main page ──────────────────────────────────────────────────────────────────
export function StaffUpdatePage() {
  // NOTE: this route param is actually the STAFF/NAIL ARTIST id (staffId),
  // not the Users-table userId. The two are different ids in this backend.
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [skillTypes, setSkillTypes] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  const [formData, setFormData] = useState({
    userId: "",
    nailArtistId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    status: "Active",
    avatarUrl: "",
    imageFile: null,
    skillRatings: {},
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formError, setFormError] = useState("");

  // Load user data + skill types + existing skills
  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setLoadingSkills(true);
      try {
        const isMockId = !staffId || staffId.startsWith("artist-") || staffId.startsWith("staff-") || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(staffId);
        if (isMockId) {
          const { getStaffById } = await import("../services/mockStaffArtists");
          const mockData = getStaffById(staffId) || getStaffById("staff-01") || {
            id: staffId,
            name: "Artist " + staffId.slice(-4),
            role: "Nail Artist",
            status: "Active",
            skillRatings: {
              precision: 3,
              color: 3,
              form: 3,
              material: 3,
              design: 3,
              speed: 3,
            }
          };
          
          setFormData({
            userId: mockData.id,
            nailArtistId: mockData.id,
            firstName: mockData.name.split(" ")[0] || "Artist",
            lastName: mockData.name.split(" ").slice(1).join(" ") || "",
            email: `${mockData.name.toLowerCase().replace(" ", ".")}@nailify.com`,
            phone: "+1 (555) 000-0000",
            role: mockData.role || "Staff_Artist",
            status: mockData.status || "Active",
            salonId: "mock-salon-id",
            avatarUrl: "",
            imageFile: null,
            skillRatings: mockData.skillRatings || {
              precision: 3,
              color: 3,
              form: 3,
              material: 3,
              design: 3,
              speed: 3,
            },
          });
          setIsLoading(false);
          setLoadingSkills(false);
          return;
        }

        // 1. staffId (from the URL) belongs to the NailArtist/Staff table.
        //    Fetch that record first so we can resolve the real userId.
        const artistData = await fetchNailArtistById(staffId);

        if (!mounted) return;

        if (!artistData) {
          throw new Error("Không tìm thấy thông tin nhân viên.");
        }

        // 2. Resolve the real Users-table id from the nail artist record.
        //    Adjust this field name if your API uses a different key
        //    (e.g. artistData.user?.id, artistData.accountId, ...).
        const realUserId =
          artistData.userId ||
          artistData.userID ||
          artistData.accountId ||
          artistData.user?.id;

        if (!realUserId) {
          throw new Error("Không tìm thấy userId tương ứng với nhân viên này.");
        }

        // 3. Now fetch the actual user profile + skill types in parallel.
        const [userData, skillTypesData] = await Promise.all([
          fetchUserById(realUserId),
          fetchSkillTypes({ pageNumber: 1, pageSize: 100 }),
        ]);

        if (!mounted) return;

        const items = Array.isArray(skillTypesData?.items)
          ? skillTypesData.items
          : Array.isArray(skillTypesData)
          ? skillTypesData
          : [];

        setSkillTypes(items);

        // Initialize all skill ratings to 0
        const skillRatings = {};
        items.forEach((s) => { skillRatings[s.id] = 0; });

        // staffId (URL param) IS the nailArtistId — no need to re-derive it.
        const nailArtistId = staffId;

        // Load existing skills for this nail artist
        try {
          const existingSkills = await fetchNailArtistSkills(nailArtistId);
          const skillArr = Array.isArray(existingSkills?.items)
            ? existingSkills.items
            : Array.isArray(existingSkills)
            ? existingSkills
            : [];
          skillArr.forEach((s) => {
            const skillTypeId = s.skillTypeId || s.SkillTypeId;
            if (skillTypeId) skillRatings[skillTypeId] = s.level ?? 0;
          });
        } catch (e) {
          console.warn("Failed to load existing skills:", e);
        }

        if (!mounted) return;

        setFormData({
          userId: userData?.userId || userData?.id || realUserId,
          nailArtistId,
          firstName: userData?.firstName || "",
          lastName: userData?.lastName || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          role: userData?.role || artistData?.role || "Staff_Artist",
          status: userData?.status || artistData?.status || "Active",
          salonId: userData?.salonId || artistData?.salonId || "",
          avatarUrl: userData?.avatarUrl || artistData?.avatarUrl || "",
          imageFile: null,
          skillRatings,
        });

        if (userData?.avatarUrl || artistData?.avatarUrl) {
          setImagePreview(userData?.avatarUrl || artistData?.avatarUrl);
        }

        setIsLoading(false);
        setLoadingSkills(false);
      } catch (err) {
        console.error("Failed to load staff data:", err);
        if (!mounted) return;
        setIsNotFound(true);
        setIsLoading(false);
        setLoadingSkills(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [staffId]);

  const rank = useMemo(() => getRank(formData.skillRatings || {}), [formData.skillRatings]);

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
    if (e) e.preventDefault();
    setFormError("");
    if (!formData.firstName.trim()) return setFormError("First name is required.");
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const isMockId = !staffId || staffId.startsWith("artist-") || staffId.startsWith("staff-") || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(staffId);
      if (isMockId) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSaveResult({
          success: true,
          message: `${formData.firstName} ${formData.lastName} has been updated successfully (Offline Demo Mode).`,
        });
        return;
      }

      // 1. Update user profile
      await updateUser(formData.userId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        salonId: formData.salonId,
        status: formData.status,
        imageFile: formData.imageFile,
      });

      // 2. Update skill assignments if nail artist ID available
      if (formData.nailArtistId) {
        const skills = skillTypes
          .filter((s) => Number(formData.skillRatings[s.id] ?? 0) > 0)
          .map((s) => ({
            skillTypeId: s.id,
            level: Math.floor(Number(formData.skillRatings[s.id])),
          }));

        if (skills.length > 0) {
          const skillResult = await assignNailArtistSkills(formData.nailArtistId, skills);
          if (skillResult && !skillResult.success) {
            throw new Error(skillResult.error || "Failed to update skill assignments.");
          }
        }
      }

      setSaveResult({
        success: true,
        message: `${formData.firstName} ${formData.lastName} has been updated successfully.`,
      });
    } catch (err) {
      setSaveResult({
        success: false,
        message: err?.response?.data?.message || err?.message || "Failed to update artist profile.",
      });
    } finally {
      setIsSaving(false);
      setShowSaveModal(false);
    }
  };

  const handleSuccessComplete = useCallback(() => {
    navigate(ROUTES.managerStaffArtists, { state: { flashMessage: saveResult?.message } });
  }, [navigate, saveResult?.message]);

  if (isNotFound) {
    return <Navigate to={ROUTES.managerStaffArtists} replace />;
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

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
            <h1 className="text-[22px] font-black tracking-tight text-slate-800">Update Artist</h1>
            <p className="text-[11.5px] font-medium text-slate-400">
              Edit profile and skill ratings for{" "}
              <span className="font-bold text-[#ea4f93]">
                {[formData.firstName, formData.lastName].filter(Boolean).join(" ")}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white px-4 py-2 text-[11.5px] font-bold text-rose-500 transition hover:bg-rose-50 active:scale-95"
          >
            <Trash2 size={13} />
            Remove
          </button>
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
            Save Changes
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
        {/* Left column */}
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
                    placeholder="First name"
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
                    placeholder="Last name"
                    className={inputClass}
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <div className={`${inputWrapper} bg-[#faf7f9]`}>
                  <Mail size={13} className="shrink-0 text-[#dda0c4]" />
                  <input
                    type="email"
                    className={readOnlyClass}
                    value={formData.email}
                    readOnly
                    title="Email cannot be changed here"
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
                <label className={labelClass}>Job Title / Role</label>
                <div className={`${inputWrapper} bg-[#faf7f9]`}>
                  <input
                    type="text"
                    className={readOnlyClass}
                    value={formData.role}
                    readOnly
                    title="Role is managed by admin"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleInputChange("status", opt.value)}
                      className={`rounded-[12px] py-2.5 text-center text-[12px] font-bold transition-all duration-200 border ${
                        formData.status === opt.value
                          ? `${opt.active} shadow-sm`
                          : "border-[#f0e6ed] bg-[#fdf8fb] text-slate-400 hover:border-[#dda0c4] hover:text-slate-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
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
                  <p className="text-[13px] font-semibold text-slate-700">Click to change photo</p>
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
                  <p className="text-[10.5px] text-slate-400">Update skill ratings (1 Beginner — 5 Expert)</p>
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
          <ProfilePreview formData={formData} skillTypes={skillTypes} />

          {/* Summary */}
          <div className={sectionCard}>
            <h3 className="mb-3 text-[13px] font-bold text-slate-700">Summary</h3>
            <dl className="space-y-2.5 text-[12px]">
              {[
                { label: "Name", value: [formData.firstName, formData.lastName].filter(Boolean).join(" ") || "—" },
                { label: "Status", value: formData.status || "—" },
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
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#f0e6ed] py-2.5 text-[12px] font-bold text-slate-500 transition hover:bg-[#fdf8fb] active:scale-[0.98]"
              >
                <X size={13} />
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-100 py-2.5 text-[12px] font-bold text-rose-500 transition hover:bg-rose-50 active:scale-[0.98]"
              >
                <Trash2 size={13} />
                Remove Artist
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
            <h2 className="text-[16px] font-bold text-slate-800">Discard changes?</h2>
            <p className="mt-1.5 text-[12.5px] text-slate-500">
              Unsaved changes for{" "}
              <span className="font-bold text-[#ea4f93]">
                {[formData.firstName, formData.lastName].filter(Boolean).join(" ")}
              </span>{" "}
              will be lost.
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

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
            <h2 className="text-[16px] font-bold text-slate-800">Save changes?</h2>
            <p className="mt-1.5 text-[12.5px] text-slate-500">
              Update the profile and skills for{" "}
              <span className="font-bold text-[#ea4f93]">
                {[formData.firstName, formData.lastName].filter(Boolean).join(" ")}
              </span>
              ?
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
            <h2 className="text-[16px] font-bold text-rose-600">Remove Artist?</h2>
            <p className="mt-1.5 text-[12.5px] text-slate-500">
              Are you sure you want to remove{" "}
              <span className="font-bold text-rose-500">
                {[formData.firstName, formData.lastName].filter(Boolean).join(" ")}
              </span>{" "}
              from the system? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-full border border-[#f0e6ed] py-2 text-[12px] font-bold text-slate-600 transition hover:bg-[#fdf8fb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); navigate(ROUTES.managerStaffArtists); }}
                className="flex-1 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-2 text-[12px] font-bold text-white transition hover:opacity-90"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <StaffSaveResultModal
        result={saveResult}
        successTitle="Profile Updated"
        failureTitle="Update Failed"
        successDescription="Artist profile and skills have been updated successfully."
        failureDescription="An error occurred while updating the artist profile."
        onFailureClose={() => setSaveResult(null)}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}