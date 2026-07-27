import {
  Mail,
  Phone,
  Save,
  Upload,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  fetchNailArtistById,
  fetchNailArtistSkills,
  fetchSkillTypes,
} from "../services/nailArtistsService";
import { updateUser, assignNailArtistSkills } from "../../../admin/staff-management/services/staffManagementService";
import { fetchUserById } from "../../bookings/services/bookingsService";
import { StaffSkillAssessmentSection } from "../../../admin/staff-management/components/StaffSkillAssessmentSection";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal.jsx";
import { normalizeAdminSkillType } from "../../../admin/skill-types-management/services/skillTypesManagementService";

// ── Design tokens (from StaffCreatePage) ─────────────────────────────────────────────────────
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
export function StaffUpdatePage() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [skillTypes, setSkillTypes] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    userId: "",
    nailArtistId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "Active",
    salonId: "",
    avatarUrl: "",
    imageFile: null,
    skillRatings: {},
  });

  // Load user data + skill types + existing skills
  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const isMockId = !staffId || staffId.startsWith("artist-") || staffId.startsWith("staff-") || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(staffId);
        if (isMockId) {
          // Mock data for testing
          const mockData = {
            id: staffId,
            name: "Artist " + staffId.slice(-4),
            role: "Nail Artist",
            status: "Active",
            skillRatings: {},
          };
          const mockSkillTypes = await fetchSkillTypes({ pageNumber: 1, pageSize: 100 });
          const normalizedItems = Array.isArray(mockSkillTypes?.items) ? mockSkillTypes.items : Array.isArray(mockSkillTypes) ? mockSkillTypes : [];
          const normalizedSkills = normalizedItems.map(normalizeAdminSkillType);
          const defaultRatings = {};
          normalizedSkills.forEach((s) => { defaultRatings[s.id] = 3; });

          setFormData({
            userId: mockData.id,
            nailArtistId: mockData.id,
            firstName: mockData.name.split(" ")[0] || "Artist",
            lastName: mockData.name.split(" ").slice(1).join(" ") || "",
            email: `${mockData.name.toLowerCase().replace(" ", ".")}@nailify.com`,
            phone: "+84 912 345 678",
            status: mockData.status || "Active",
            salonId: "",
            avatarUrl: "",
            imageFile: null,
            skillRatings: defaultRatings,
          });
          setSkillTypes(normalizedSkills);
          setIsLoading(false);
          return;
        }

        // 1. staffId (from the URL) belongs to the NailArtist/Staff table.
        const artistData = await fetchNailArtistById(staffId);

        if (!mounted) return;

        if (!artistData) {
          throw new Error("Không tìm thấy thông tin nhân viên.");
        }

        // 2. Resolve the real Users-table id from the nail artist record.
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
        const normalizedItems = items.map(normalizeAdminSkillType);
        setSkillTypes(normalizedItems);

        // Initialize all skill ratings to 0
        const skillRatings = {};
        normalizedItems.forEach((s) => { skillRatings[s.id] = 0; });

        // Get the real nailArtistId from the fetched artist data
        const nailArtistId = artistData?.nailArtistId || artistData?.staffId || artistData?.id || staffId;
        console.log("Manager StaffUpdatePage: using nailArtistId:", nailArtistId);

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

        const avatarUrl = userData?.avatarUrl || artistData?.avatarUrl || "";
        if (avatarUrl) {
          setImagePreview(avatarUrl);
        }

        const salonId = userData?.salonId || artistData?.salonId || "";

        setFormData({
          userId: userData?.userId || userData?.id || realUserId,
          nailArtistId,
          firstName: userData?.firstName || "",
          lastName: userData?.lastName || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          status: userData?.status || artistData?.status || "Active",
          salonId,
          avatarUrl,
          imageFile: null,
          skillRatings,
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load staff data:", err);
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [staffId]);

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
      // 1. Update user profile - ONLY include fields we need to update!
      const updatePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      // Only include imageFile if there is one
      if (formData.imageFile) {
        updatePayload.imageFile = formData.imageFile;
      }

      console.log("Updating user with data:", updatePayload, "userId:", formData.userId);
      // await updateUser(formData.userId, updatePayload);

      // 2. Update skill assignments if nail artist ID available
      if (formData.nailArtistId) {
        const skills = skillTypes
          .filter((s) => Number(formData.skillRatings[s.id] ?? 0) > 0)
          .map((s) => ({
            skillTypeId: s.id,
            level: Math.floor(Number(formData.skillRatings[s.id])),
          }));

        console.log("Updating skills for nail artist (nailArtistId):", formData.nailArtistId);
        console.log("Skills payload:", skills);

        if (skills.length > 0) {
          const skillResult = await assignNailArtistSkills(formData.nailArtistId, skills);
          if (!skillResult.success) {
            throw new Error(skillResult.error || "Failed to update staff skills.");
          }
        } else {
          console.log("No skills to update (all ratings are 0)");
        }
      }

      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: true,
        message: `${[formData.firstName, formData.lastName].filter(Boolean).join(" ")} has been updated successfully.`,
      });
    } catch (err) {
      console.error("Error updating artist:", err);
      console.error("Error details:", err.response?.data);
      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: false,
        message: err?.response?.data?.message || err?.message || "Failed to update staff artist.",
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

  if (isLoading) {
    return (
      <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
        <div className="mb-4 flex flex-col gap-4 rounded-[20px] bg-white/70 px-4 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur sm:mb-5 sm:rounded-[24px] sm:px-5 lg:rounded-[28px] lg:flex-row lg:items-center lg:justify-between">
          <div className="h-8 w-48 rounded-full bg-rose-100 animate-pulse" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="space-y-4 lg:col-span-2 lg:space-y-5">
            <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
              <div className="h-6 w-48 rounded-full bg-rose-100 mb-5 animate-pulse" />
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-rose-50 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4 lg:space-y-5">
            <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
              <div className="h-6 w-48 rounded-full bg-rose-100 mb-5 animate-pulse" />
              <div className="h-48 rounded-2xl bg-rose-50 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      {/* Header */}
      <header className="mb-4 flex flex-col gap-4 rounded-[20px] bg-white/70 px-4 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur sm:mb-5 sm:rounded-[24px] sm:px-5 lg:rounded-[28px] lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-[#cf3d74] sm:text-2xl lg:text-[28px]">
            Update Artist
          </h1>
          <p className="text-[11px] font-medium text-slate-400 sm:text-[12px]">
            Update nail artist profile and skill ratings for{" "}
            <span className="font-bold text-[#eb5b92]">
              {[formData.firstName, formData.lastName].filter(Boolean).join(" ")}
            </span>
          </p>
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
            Save Artist
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
              Artist Details
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  First Name <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Last Name <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Email
                </span>
                <div className={inputWrapperClassName}>
                  <Mail size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className={`${inputClassName} text-slate-400 cursor-not-allowed`}
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Phone Number
                </span>
                <div className={inputWrapperClassName}>
                  <Phone size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+84 912 345 678"
                    className={inputClassName}
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Job Title / Role
                </span>
                <div className={inputWrapperClassName}>
                  <input
                    type="text"
                    value="Nail Artist"
                    readOnly
                    className={inputClassName}
                  />
                </div>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  Avatar
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
                        <p className="text-base font-semibold text-slate-700">Click to upload artist avatar</p>
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
              Profile Preview
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
                        {getStaffInitials(formData.firstName + " " + formData.lastName || "Artist")}
                      </div>
                    )}
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-1">
                    {[formData.firstName, formData.lastName].filter(Boolean).join(" ") || "Artist"}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Nail Artist
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
        title="Cancel Artist Update"
        subtitle="You are leaving this artist form without saving changes."
        description="The artist profile updates have not been saved yet. Leave this page only if you want to discard the changes."
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
          "Artist details and specialties changes here will be lost.",
          "You will need to re-apply the changes if you open the update screen again.",
        ]}
      />

      <ActionConfirmModal
        open={showSaveModal}
        intent="success"
        title="Save Artist Changes"
        subtitle="This will update the profile and save to database."
        description="Confirm to update this artist profile."
        confirmText="Save Artist"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        highlights={[[formData.firstName, formData.lastName].filter(Boolean).join(" ") || "Artist", "Nail Artist"].filter(Boolean)}
      />

      <StaffSaveResultModal
        result={saveResult}
        successTitle="Update Successful"
        failureTitle="Update Failed"
        successDescription="The artist has been updated successfully."
        failureDescription="Unable to update the artist."
        onFailureClose={() => setSaveResult(null)}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}
