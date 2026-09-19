import {
  Mail,
  Phone,
  Save,
  User,
  X,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Select, Rate } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  STAFF_ONBOARDING_CHECKLIST,
  STAFF_ROLE_OPTIONS,
  createEmptyStaffForm,
  getStaffInitials,
  getStaffRoleOption,
} from "../services/mockStaff";
import { createUser, fetchSalonStaff } from "../services/staffManagementService";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";
import { fetchSkillTypes, assignNailArtistSkills } from "../../../manager/staff-artist-management/services/nailArtistsService";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 transition-all duration-300 hover:border-rose-200 hover:bg-[#fff5f9] focus-within:border-rose-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-rose-300 font-medium";

export function StaffCreatePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const location = useLocation();
  const [formData, setFormData] = useState({
    ...createEmptyStaffForm(),
    firstName: "",
    lastName: "",
    password: "",
    salonId: location.state?.selectedSalonId || "",
    avatarUrl: "",
    imageFile: null,
  });
  const [salons, setSalons] = useState([]);
  const [skillTypes, setSkillTypes] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // Load salons and skills on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const salonList = await fetchAdminSalons({ pageSize: 100 });
        const fetchedSalons = salonList.items || [];
        setSalons(fetchedSalons);
        
        if (!location.state?.selectedSalonId && fetchedSalons.length > 0) {
          setFormData(prev => ({ ...prev, salonId: fetchedSalons[0].id }));
        }
      } catch (err) {
        console.error("Failed to load salons", err);
      }
      try {
        const skillsData = await fetchSkillTypes({ pageSize: 100 });
        setSkillTypes(skillsData.items || []);
      } catch (err) {
        console.error("Failed to fetch skill types", err);
      }
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

      if (formData.role === "Staff_Artist") {
        let targetArtistId = createdUser?.staffId || createdUser?.nailArtistId;

        // Fetch staff list to get the real staffId if it's missing from the POST /Users response
        if (!targetArtistId) {
          try {
            const staffList = await fetchSalonStaff(formData.salonId || salons[0]?.id, { pageSize: 1000 });
            const found = staffList.items.find(s => s.email === formData.email || s.userId === (createdUser?.userId || createdUser?.id));
            if (found) {
              targetArtistId = found.staffId || found.nailArtistId || found.id;
            }
          } catch (e) {
            console.error("Failed to fetch staff list for staffId", e);
          }
        }

        if (!targetArtistId) targetArtistId = createdUser?.id;

        const skillsPayload = Object.entries(selectedSkills)
          .filter(([_, level]) => level > 0)
          .map(([skillTypeId, level]) => ({ skillTypeId, level }));
        
        if (skillsPayload.length > 0 && targetArtistId) {
          try {
            await assignNailArtistSkills(targetArtistId, skillsPayload);
            console.log("Assigned skills successfully.");
          } catch (err) {
            console.error("Failed to assign skills:", err);
          }
        }
      }

      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: true,
        message: language === "vi"
          ? `${formData.firstName || formData.fullName} đã được thêm thành công.`
          : `${formData.firstName || formData.fullName} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error creating staff:", error);
      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: false,
        message: error?.response?.data?.message || error?.message || (t("adminStaffManagement.staffAddFailed")),
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
        selectedSalonId: formData.salonId || salons[0]?.id,
      },
    });
  }, [navigate, saveResult?.message]);

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigate(ROUTES.adminStaff, {
      state: {
        selectedSalonId: formData.salonId,
      },
    });
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      <header className="mb-4 flex flex-col gap-4 rounded-lg bg-white/70 px-4 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur sm:mb-5  sm:px-5  lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-[#cf3d74] sm:text-2xl lg:text-[28px]">
            {t("adminStaffManagement.addNewStaff")}
          </h1>
          <p className="text-[11px] font-medium text-slate-400 sm:text-[12px]">
            {language === "vi" ? "Tạo hồ sơ nhân viên mới, phân công chi nhánh, vai trò và lịch làm việc" : "Create a new staff profile, assign salon, role, and weekly schedule"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            {t("adminStaffManagement.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {t("adminStaffManagement.saveStaff")}
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="space-y-4 lg:col-span-2 lg:space-y-5">
          <div className="rounded-[28px] bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur border border-rose-50">
            <h2 className="mb-6 text-[20px] font-bold text-slate-800 flex items-center gap-2">
              <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              {t("adminStaffManagement.staffDetails")}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  {t("adminStaffManagement.firstName")} <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(event) => handleInputChange("firstName", event.target.value)}
                    placeholder={t("adminStaffManagement.enterFirstName")}
                    className={inputClassName}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  {t("adminStaffManagement.lastName")} <span className="text-rose-500">*</span>
                </span>
                <div className={inputWrapperClassName}>
                  <User size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(event) => handleInputChange("lastName", event.target.value)}
                    placeholder={t("adminStaffManagement.enterLastName")}
                    className={inputClassName}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  {language === "vi" ? "Email" : "Email"} <span className="text-rose-500">*</span>
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
                  {t("adminStaffManagement.phoneNumber")} <span className="text-rose-500">*</span>
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
                  {t("adminStaffManagement.role")}
                </span>
                <Select
                  value={formData.role}
                  onChange={(value) => handleInputChange("role", value)}
                  options={[
                    { value: "Manager", label: t("adminStaffManagement.manager") || (language === "vi" ? "Quản lý" : "Manager") },
                    { value: "Receptionist", label: t("adminStaffManagement.receptionist") || (language === "vi" ? "Lễ tân" : "Receptionist") },
                    { value: "Staff_Artist", label: t("adminStaffManagement.staffArtist") || (language === "vi" ? "Nhân viên làm móng" : "Staff Artist") }
                  ]}
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  {t("adminStaffManagement.assignedSalon")}
                </span>
                <Select
                  value={salons.length > 0 ? (formData.salonId || undefined) : undefined}
                  loading={salons.length === 0}
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
                  showSearch
                  optionFilterProp="label"
                  placeholder={language === "vi" ? "Đang tải chi nhánh..." : "Loading salons..."}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  {t("adminStaffManagement.avatar")}
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
                        <p className="text-base font-semibold text-slate-700">{t("adminStaffManagement.clickUploadAvatar")}</p>
                        <p className="text-xs text-slate-400 mt-1">{t("adminStaffManagement.uploadFormat")}</p>
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

          {formData.role === "Staff_Artist" && (
            <div className="rounded-[28px] bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur border border-rose-50 mt-5">
              <h2 className="mb-6 text-[20px] font-bold text-slate-800 flex items-center gap-2">
                <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
                {language === "vi" ? "Kỹ năng & Chuyên môn" : "Skills & Specialties"}
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                {skillTypes.map((skill) => (
                  <div key={skill.skillTypeId || skill.id} className="space-y-2 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-4 rounded-2xl border border-rose-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-bold text-slate-700">
                        {skill.name}
                      </span>
                      {selectedSkills[skill.skillTypeId || skill.id] > 0 && (
                        <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          Level {selectedSkills[skill.skillTypeId || skill.id]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Rate
                        value={selectedSkills[skill.skillTypeId || skill.id] || 0}
                        onChange={(value) => {
                          setSelectedSkills(prev => ({
                            ...prev,
                            [skill.skillTypeId || skill.id]: value
                          }));
                        }}
                        className="text-rose-400"
                        allowClear
                      />
                    </div>
                    {skill.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-medium">
                        {skill.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:space-y-5">
          <div className="rounded-[28px] bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur border border-rose-50">
            <h2 className="mb-6 text-[20px] font-bold text-slate-800 flex items-center gap-2">
              <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]"></div>
              {t("adminStaffManagement.profilePreview")}
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
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-300 text-[28px] font-bold text-white">
                        {getStaffInitials(formData.fullName || formData.firstName + " " + formData.lastName || "NS")}
                      </div>
                    )}
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-1">
                    {formData.fullName || formData.firstName + " " + formData.lastName || (language === "vi" ? "Nhân viên mới" : "New Staff Member")}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {selectedRole ? (t("adminStaffManagement." + (selectedRole.value === "Staff_Artist" ? "staffArtist" : selectedRole.value === "Manager" ? "manager" : "receptionist"))) : (t("adminStaffManagement.role"))} · #{formData.staffId || "NF-NEW"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 text-center">
                    {language === "vi" ? "Chi nhánh phân bổ:" : "Assigned Salon:"}{" "}
                    <span className="font-bold text-rose-400">{formData.assignedSalon || (language === "vi" ? "Chưa chọn" : "None")}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#fffafc] to-[#fff8fb] p-6 shadow-[0_2px_12px_rgba(226,93,143,0.05)]">
                <h3 className="mb-3 text-[15px] font-bold text-slate-700">{language === "vi" ? "Danh sách cần chuẩn bị" : "Onboarding Checklist"}</h3>
                <div className="space-y-3">
                  {STAFF_ONBOARDING_CHECKLIST.map((item) => {
                    const checklistMap = {
                      "Complete personal information": "Hoàn tất thông tin cá nhân",
                      "Assign salon and role": "Phân công chi nhánh và vai trò",
                      "Select specialties": "Chọn chuyên môn",
                      "Set weekly working schedule": "Thiết lập lịch làm việc hàng tuần",
                      "Review and save profile": "Xem lại và lưu hồ sơ",
                    };
                    return (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white px-4 py-3"
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                        <p className="text-[11px] font-semibold text-slate-600">{language === "vi" ? checklistMap[item] || item : item}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>

      <ActionConfirmModal
        open={showCancelModal}
        intent="warning"
        title={language === "vi" ? "Hủy Tạo Nhân Viên" : "Cancel Staff Creation"}
        subtitle={language === "vi" ? "Bạn đang thoát khỏi biểu mẫu nhân viên mà không lưu." : "You are leaving this staff form without saving."}
        description={language === "vi" ? "Hồ sơ nhân viên mới vẫn chưa được lưu. Chỉ rời khỏi trang nếu bạn muốn hủy bản nháp." : "The new staff profile has not been saved yet. Leave this page only if you want to discard the draft."}
        confirmText={language === "vi" ? "Có, Hủy bỏ" : "Leave Page"}
        cancelText={language === "vi" ? "Tiếp tục sửa" : "Keep Editing"}
        confirmIcon={X}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        details={[
          { label: language === "vi" ? "Trạng thái nháp" : "Draft Status", value: language === "vi" ? "Chưa lưu lại" : "Not saved yet" },
          { label: language === "vi" ? "Bước tiếp theo" : "Next Step", value: language === "vi" ? "Quay lại danh sách nhân viên" : "Return to staff list" },
        ]}
        warnings={
          language === "vi"
            ? ["Tên nhân viên, phân công, lịch trình và chuyên môn đã nhập sẽ bị mất.", "Bạn sẽ cần tạo lại hồ sơ nếu mở lại sau này."]
            : ["Staff details, assignment, schedule, and specialties entered here will be lost.", "You will need to re-create the profile if you open the create screen again."]
        }
      />

      <ActionConfirmModal
        open={showSaveModal}
        intent="success"
        title={language === "vi" ? "Lưu Nhân Viên Mới" : "Save New Staff Member"}
        subtitle={language === "vi" ? "Thao tác này sẽ tạo hồ sơ và lưu vào hệ thống." : "This will create the profile and save to database."}
        description={language === "vi" ? "Xác nhận tạo hồ sơ nhân viên này và phân bổ cho salon được chọn." : "Confirm to create this staff profile and assign it to the selected salon."}
        confirmText={language === "vi" ? "Lưu nhân viên" : "Save Staff"}
        cancelText={language === "vi" ? "Xem lại" : "Review Again"}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        highlights={[formData.fullName || formData.firstName + " " + formData.lastName || (language === "vi" ? "Nhân viên mới" : "New staff member"), language === "vi" ? { Staff_Artist: "Nhân viên làm móng", Manager: "Quản lý", Receptionist: "Lễ tân" }[formData.role] || formData.role : formData.role]}
        details={[
          { label: t("adminStaffManagement.assignedSalon"), value: formData.assignedSalon || (language === "vi" ? "Chưa chọn chi nhánh" : "No salon selected") },
        ]}
      />

      <StaffSaveResultModal
        result={saveResult}
        successTitle={language === "vi" ? "Tạo Thành Công" : "Create Successful"}
        failureTitle={language === "vi" ? "Tạo Thất Bại" : "Create Failed"}
        successDescription={language === "vi" ? "Hồ sơ nhân viên đã được thêm thành công." : "The staff member has been created successfully."}
        failureDescription={language === "vi" ? "Không thể tạo hồ sơ nhân viên này." : "Unable to create the staff member."}
        onFailureClose={handleCloseResultModal}
        onSuccessComplete={handleSuccessComplete}
        redirectMessage={language === "vi" ? "Đang chuyển hướng đến danh sách nhân viên..." : "Redirecting to staff list..."}
      />
    </section>
  );
}

