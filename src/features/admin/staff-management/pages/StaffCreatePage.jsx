import {
  Mail,
  Phone,
  Save,
  User,
  X,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  STAFF_ONBOARDING_CHECKLIST,
  STAFF_ROLE_OPTIONS,
  createEmptyStaffForm,
  getStaffInitials,
  getStaffRoleOption,
} from "../services/mockStaff";
import { createUser } from "../services/staffManagementService";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 transition-all duration-300 hover:border-rose-200 hover:bg-[#fff5f9] focus-within:border-rose-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-rose-300 font-medium";

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
  const [salons, setSalons] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  // Load salons on mount
  useEffect(() => {
    const loadData = async () => {
      const salonList = await fetchAdminSalons({ pageSize: 100 });
      setSalons(salonList.items || []);
    };
    loadData();
  }, []);

  const selectedRole = useMemo(
    () => getStaffRoleOption(formData.role),
    [formData.role],
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
          <div className="rounded-[28px] bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur border border-rose-50">
            <h2 className="mb-6 text-[20px] font-bold text-slate-800 flex items-center gap-2">
              <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Staff Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  Role
                </span>
                <Select
                  value={formData.role}
                  onChange={(value) => handleInputChange("role", value)}
                  options={STAFF_ROLE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  Assigned Salon
                </span>
                <Select
                  value={formData.salonId}
                  onChange={(value) => {
                    const selectedSalon = salons.find(s => s.id === value) || { name: value };
                    handleInputChange("salonId", value);
                    handleInputChange("assignedSalon", selectedSalon.name);
                  }}
                  options={salons.map((salon) => ({
                    value: salon.id,
                    label: salon.name,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
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
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:space-y-5">
          <div className="rounded-[28px] bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur border border-rose-50">
            <h2 className="mb-6 text-[20px] font-bold text-slate-800 flex items-center gap-2">
              <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              Profile Preview
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-6 shadow-[0_2px_12px_rgba(226,93,143,0.05)]">
                <div className="flex flex-col items-center justify-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full overflow-hidden border-4 border-rose-100 shadow-lg mb-4">
                    {imagePreview ? (
                      <img crossOrigin="anonymous"
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
                  <p className="text-[11px] font-medium text-slate-400 text-center">
                    Assigned Salon:{" "}
                    <span className="font-bold text-rose-400">{formData.assignedSalon}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-6 shadow-[0_2px_12px_rgba(226,93,143,0.05)]">
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

