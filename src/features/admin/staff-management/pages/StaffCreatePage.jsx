import {
  CalendarDays,
  Mail,
  Phone,
  Save,
  User,
  X,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { TimePicker } from "../../../../shared/components/ui/TimePicker";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { StaffSkillAssessmentSection } from "../components/StaffSkillAssessmentSection";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  STAFF_CREATE_STATUS_OPTIONS,
  STAFF_DAYS_OF_WEEK,
  STAFF_EMPLOYMENT_TYPES,
  STAFF_ONBOARDING_CHECKLIST,
  STAFF_ROLE_OPTIONS,
  STAFF_SALON_OPTIONS,
  createEmptyStaffForm,
  getStaffCreateStatusOption,
  getStaffInitials,
  getStaffRoleOption,
} from "../services/mockStaff";
import { createUser, assignNailArtistSkills } from "../services/staffManagementService";
import { createNailArtist } from "../../../manager/staff-artist-management/services/nailArtistsService";
import { fetchAdminSkillTypes } from "../../skill-types-management/services/skillTypesManagementService";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 transition-all duration-300 hover:border-rose-200 hover:bg-[#fff5f9] focus-within:border-rose-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-rose-300 font-medium";
const selectClassName =
  "w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 text-[14px] text-slate-800 outline-none font-medium transition-all duration-300 hover:border-rose-200 hover:bg-[#fff5f9] focus:border-rose-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]";

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

export function StaffCreatePage() {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formData, setFormData] = useState({
    ...createEmptyStaffForm(),
    firstName: "",
    lastName: "",
    password: "",
    salonId: "",
    avatarUrl: "",
    imageFile: null,
  });
  const [skillTypes, setSkillTypes] = useState([]);
  const [salons, setSalons] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Load skill types and salons on mount
  useEffect(() => {
    const loadData = async () => {
      const [skillResponse, salonList] = await Promise.all([
        fetchAdminSkillTypes({ pageNumber: 1, pageSize: 100 }),
        fetchAdminSalons({ pageSize: 100 }),
      ]);
      console.log("Loaded skill types:", skillResponse.items);
      setSkillTypes(skillResponse.items);
      setSalons(salonList.items || []);
    };
    loadData();
  }, []);

  const selectedRole = useMemo(
    () => getStaffRoleOption(formData.role),
    [formData.role],
  );
  const selectedStatus = useMemo(
    () => getStaffCreateStatusOption(formData.status),
    [formData.status],
  );

  // Get specialties from skill ratings using skill types
  const specialties = useMemo(() => {
    return skillTypes
      .filter(skill => Number(formData.skillRatings[skill.id] ?? 0) >= 3)
      .map(skill => skill.name || skill.title);
  }, [skillTypes, formData.skillRatings]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        handleInputChange("avatarUrl", e.target.result);
        handleInputChange("imageFile", file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    handleInputChange("avatarUrl", "");
    handleInputChange("imageFile", null);
  };

  const handleInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSkillRatingChange = (skillKey, rating) => {
    setFormData((current) => ({
      ...current,
      skillRatings: {
        ...current.skillRatings,
        [skillKey]: rating,
      },
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
    try {
      // Step 1: Create user
      const userData = {
        email: formData.email,
        password: formData.password || "password123", // Default password
        firstName: formData.firstName || formData.fullName.split(" ")[0] || "",
        lastName: formData.lastName || formData.fullName.split(" ").slice(1).join(" ") || "",
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
        imageFile: formData.imageFile,
        role: formData.role,
        salonId: formData.salonId || salons[0]?.id || "",
      };
      
      console.log("StaffCreatePage - userData to send:", userData);
      console.log("StaffCreatePage - available salons:", salons);
      
      const createdUser = await createUser(userData);
      
      console.log("Created user:", createdUser);
      
      // Step 2: If role is Nail Artist, create nail artist record first, then assign skills
      if (formData.role === "NAIL_ARTIST" && createdUser?.userId) {
        // Check if createdUser already has staffId
        console.log("createdUser has staffId?", createdUser.staffId);
        console.log("createdUser full:", createdUser);
        
        let nailArtistId = createdUser.staffId;
        
        // If no staffId from createdUser, create nail artist profile
        if (!nailArtistId) {
          const nailArtistData = {
            userId: createdUser.userId,
            salonId: formData.salonId || salons[0]?.id || "",
          };
          
          console.log("Creating nail artist with data:", nailArtistData);
          
          const createdNailArtist = await createNailArtist(nailArtistData);
          
          console.log("Created nail artist (full):", createdNailArtist);
          
          nailArtistId = createdNailArtist?.staffId || createdNailArtist?.nailArtistId || createdNailArtist?.id;
          console.log("Got nail artist ID from create response:", nailArtistId);
        } else {
          console.log("Using staffId from createdUser directly as nail artist ID:", nailArtistId);
        }
        
        // Now assign skills using nail artist ID
        const skills = skillTypes
          .filter(skill => Number(formData.skillRatings[skill.id] ?? 0) > 0)
          .map(skill => ({
            skillTypeId: skill.id,
            level: Math.floor(Number(formData.skillRatings[skill.id] ?? 0)),
          }));
        
        console.log("Final skills payload to send:", skills);
        
        if (skills.length > 0 && nailArtistId) {
          console.log("Assigning skills to artist ID (final):", nailArtistId);
          await assignNailArtistSkills(nailArtistId, skills);
        } else {
          console.log("No skills to assign or no nail artist ID found");
        }
      }

      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: true,
        message: `${formData.firstName || formData.fullName} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error creating staff:", error);
      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: false,
        message: error?.response?.data?.message || error?.message || "Failed to create staff member.",
      });
    }
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

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      <header className="mb-4 flex flex-col gap-4 rounded-[20px] bg-white/70 px-4 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur sm:mb-5 sm:rounded-[24px] sm:px-5 lg:rounded-[28px] lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-[#cf3d74] sm:text-2xl lg:text-[28px]">
            Add New Staff
          </h1>
          <p className="text-[11px] font-medium text-slate-400 sm:text-[12px]">
            Create a new staff profile, assign salon, role, and weekly schedule
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
            Save Staff
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="space-y-4 lg:col-span-2 lg:space-y-5">
          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Staff Details
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
                    onChange={(event) => handleInputChange("firstName", event.target.value)}
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
                    onChange={(event) => handleInputChange("lastName", event.target.value)}
                    placeholder="Enter last name"
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
                    onChange={(event) => handleInputChange("email", event.target.value)}
                    placeholder="staff@nailify.com"
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
                    placeholder="+1 (555) 123-4567"
                    className={inputClassName}
                    required
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Role
                </span>
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

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  Assigned Salon
                </span>
                <select
                  value={formData.salonId || formData.assignedSalon}
                  onChange={(event) => {
                    const selectedSalon = salons.find(s => s.id === event.target.value) || { name: event.target.value };
                    handleInputChange("salonId", event.target.value);
                    handleInputChange("assignedSalon", selectedSalon.name);
                  }}
                  className={selectClassName}
                >
                  {salons.map((salon) => (
                    <option key={salon.id} value={salon.id}>
                      {salon.name}
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="space-y-2 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  Avatar
                </span>
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-gradient-to-br from-[#fffafc] to-[#fff5f9] px-6 py-8 cursor-pointer transition-all duration-300 hover:border-rose-300 hover:bg-gradient-to-br hover:from-[#fff8fb] hover:to-[#fff1f6] hover:shadow-[0_8px_24px_rgba(226,93,143,0.12)]">
                  {imagePreview ? (
                    <div className="relative w-full flex items-center justify-center">
                      <img
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
                        <p className="text-base font-semibold text-slate-700">Click to upload staff avatar</p>
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

          {formData.role === "NAIL_ARTIST" && (
            <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
              <StaffSkillAssessmentSection
                ratings={formData.skillRatings}
                specialties={specialties}
                onRatingChange={handleSkillRatingChange}
                skillTypes={skillTypes}
              />
            </div>
          )}

          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Weekly Schedule
            </h2>

            <div className="space-y-3.5">
              {STAFF_DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.key}
                  className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-[#fffafc] to-[#fff8fb] px-5 py-4 sm:flex-row sm:items-center transition-all duration-300 hover:border-rose-200 hover:shadow-[0_4px_16px_rgba(226,93,143,0.08)]"
                >
                  <div className="w-full sm:w-28">
                    <span className="text-[13px] font-bold text-slate-700">{day.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CalendarDays size={14} className="shrink-0 text-rose-400" />
                    <TimePicker
                      value={formData.schedule[day.key].start}
                      onChange={(value) => handleScheduleChange(day.key, "start", value)}
                      placeholder="Start"
                      disabled={!formData.schedule[day.key].enabled}
                      className="w-full min-w-[7rem] sm:w-28"
                    />
                    <span className="text-sm text-slate-400 font-semibold">to</span>
                    <TimePicker
                      value={formData.schedule[day.key].end}
                      onChange={(value) => handleScheduleChange(day.key, "end", value)}
                      placeholder="End"
                      disabled={!formData.schedule[day.key].enabled}
                      className="w-full min-w-[7rem] sm:w-28"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Additional Information
            </h2>

            <label className="block space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Notes</span>
              <textarea
                value={formData.notes}
                onChange={(event) => handleInputChange("notes", event.target.value)}
                placeholder="Add onboarding notes, certifications, or internal remarks..."
                className="w-full rounded-2xl border border-rose-100 bg-gradient-to-r from-[#fffafc] to-[#fff8fb] px-4 py-3.5 text-[14px] text-slate-800 outline-none placeholder:text-rose-300 font-medium transition-all duration-300 focus:border-rose-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]"
                rows={4}
              />
            </label>
          </div>
        </div>

        <aside className="space-y-4 lg:space-y-5">
          <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur sm:p-6 lg:p-7 border border-rose-50">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 sm:text-[20px] flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Profile Preview
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-5 shadow-[0_2px_12px_rgba(226,93,143,0.05)]">
                <div className="flex flex-col items-center justify-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full overflow-hidden border-4 border-rose-100 shadow-lg mb-4">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-300 text-[28px] font-black text-white">
                        {getStaffInitials(formData.fullName || formData.firstName + " " + formData.lastName || "NS")}
                      </div>
                    )}
                  </div>
                  <h3 className="text-[15px] font-black text-slate-800 mb-1">
                    {formData.fullName || formData.firstName + " " + formData.lastName || "New Staff Member"}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {selectedRole?.label ?? "Role"} · #{formData.staffId || "NF-NEW"}
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
                  <p className="text-[11px] font-medium text-slate-400 text-center">
                    Assigned Salon:{" "}
                    <span className="font-bold text-rose-400">{formData.assignedSalon}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-5 shadow-[0_2px_12px_rgba(226,93,143,0.05)]">
                <h3 className="mb-3 text-[15px] font-bold text-slate-700">Onboarding Checklist</h3>
                <div className="space-y-3">
                  {STAFF_ONBOARDING_CHECKLIST.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white px-4 py-3"
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <p className="text-[11px] font-semibold text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>

      <ActionConfirmModal
        open={showCancelModal}
        intent="warning"
        title="Cancel Staff Creation"
        subtitle="You are leaving this staff form without saving."
        description="The new staff profile has not been saved yet. Leave this page only if you want to discard the draft."
        confirmText="Leave Page"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        details={[
          { label: "Draft Status", value: "Not saved yet" },
          { label: "Next Step", value: "Return to staff list" },
        ]}
        warnings={[
          "Staff details, assignment, schedule, and specialties entered here will be lost.",
          "You will need to re-create the profile if you open the create screen again.",
        ]}
      />

      <ActionConfirmModal
        open={showSaveModal}
        intent="success"
        title="Save New Staff Member"
        subtitle="This will create the profile and save to database."
        description="Confirm to create this staff profile and assign it to the selected salon."
        confirmText="Save Staff"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        highlights={[formData.fullName || formData.firstName + " " + formData.lastName || "New staff member", formData.role || "Role pending"]}
        details={[
          { label: "Assigned Salon", value: formData.assignedSalon || "No salon selected" },
        ]}
      />

      <StaffSaveResultModal
        result={saveResult}
        successTitle="Create Successful"
        failureTitle="Create Failed"
        successDescription="The staff member has been created successfully."
        failureDescription="Unable to create the staff member."
        onFailureClose={handleCloseResultModal}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}
