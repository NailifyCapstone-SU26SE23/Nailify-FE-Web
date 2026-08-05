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
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Select } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffSaveResultModal } from "../components/StaffSaveResultModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  STAFF_UPDATE_CHECKLIST,
  STAFF_ROLE_OPTIONS,
  createEmptyStaffForm,
  getStaffInitials,
  getStaffRoleOption,
} from "../services/mockStaff";
import { fetchUserById } from "../../../manager/bookings/services/bookingsService";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";
import { updateUser } from "../services/staffManagementService";

const inputWrapperClassName =
  "flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 transition-all duration-300 hover:border-rose-200 hover:bg-[#fff5f9] focus-within:border-rose-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,79,147,0.15)]";
const inputClassName =
  "w-full min-w-0 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-rose-300 font-medium";

function StaffUpdateLoadingState() {
  const { language } = useLanguage();
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[20px] bg-white/65 p-8 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-rose-500" />
        <p className="mt-4 text-sm text-slate-600">
          {language === "vi" ? "Đang tải dữ liệu nhân viên..." : "Loading staff data..."}
        </p>
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

// Define status options with only Active and Inactive
const UPDATED_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "bg-emerald-100 text-emerald-600" },
  { value: "INACTIVE", label: "Inactive", color: "bg-rose-100 text-rose-600" },
];

export function StaffUpdatePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { staffId } = useParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [formData, setFormData] = useState(createEmptyStaffForm);
  const [salons, setSalons] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const mapApiRoleToForm = (apiRole) => {
      switch (apiRole) {
        case "Staff_Artist":
          return "NAIL_ARTIST";
        case "Salon_Manager":
          return "SALON_MANAGER";
        case "Receptionist":
          return "RECEPTIONIST";
        default:
          return apiRole || "NAIL_ARTIST";
      }
    };

    const mapApiStatusToForm = (apiStatus) => {
      switch (apiStatus) {
        case "Active":
          return "ACTIVE";
        case "Inactive":
          return "INACTIVE";
        default:
          return "ACTIVE";
      }
    };

    const loadStaff = async () => {
      console.log("=== StaffUpdatePage: Loading staff ===");
      console.log("staffId from params:", staffId);
      setIsLoading(true);
      setIsNotFound(false);

      try {
        const [userData, salonsData] = await Promise.all([
          fetchUserById(staffId),
          fetchAdminSalons({ pageSize: 100 }),
        ]);

        if (!isMounted) {
          return;
        }

        setSalons(salonsData.items || []);

        const matchingSalon = salonsData?.items?.find(
          (salon) => salon.salonId === userData.salonId || salon.id === userData.salonId
        );

        const fullName = userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.fullName || userData.name || "Unnamed Staff";

        const baseForm = createEmptyStaffForm();

        let nailArtistId = userData.staffId || userData.nailArtistId || userData.id;
        console.log("StaffUpdatePage: Determined nailArtistId:", nailArtistId);

        const staffForm = {
          ...baseForm,
          staffId: nailArtistId,
          id: userData.userId || userData.id || "",
          userId: userData.userId || userData.id || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          fullName,
          email: userData.email || "",
          phone: userData.phone || "",
          avatarUrl: userData.avatarUrl || null,
          role: mapApiRoleToForm(userData.role),
          status: mapApiStatusToForm(userData.status),
          salonId: userData.salonId || "",
          assignedSalon: matchingSalon?.name || "",
        };

        console.log("StaffUpdatePage mapped staffForm:", staffForm);

        if (userData.avatarUrl) {
          setImagePreview(userData.avatarUrl);
        }

        setFormData(staffForm);
        setIsLoading(false);
      } catch (error) {
        console.error("StaffUpdatePage load error:", error);
        if (!isMounted) {
          return;
        }
        setIsNotFound(true);
        setIsLoading(false);
      }
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
    () => UPDATED_STATUS_OPTIONS.find((option) => option.value === formData.status),
    [formData.status],
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
    setFormData((current) => {
      const newFormData = { ...current, [field]: value };

      if (field === "fullName") {
        const nameParts = value.split(' ');
        newFormData.firstName = nameParts[0] || "";
        newFormData.lastName = nameParts.slice(1).join(' ') || "";
      }

      if (field === "firstName" || field === "lastName") {
        newFormData.fullName = `${newFormData.firstName || ""} ${newFormData.lastName || ""}`.trim();
      }

      return newFormData;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);

    try {
      const mapFormStatusToApi = (formStatus) => {
        switch (formStatus) {
          case "ACTIVE":
            return "Active";
          case "INACTIVE":
            return "Inactive";
          default:
            return "Active";
        }
      };

      let firstName = formData.firstName;
      let lastName = formData.lastName;
      if (!firstName && !lastName && formData.fullName) {
        const nameParts = formData.fullName.split(' ');
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(' ') || "";
      }

      const selectedSalon = salons.find(s => s.id === formData.salonId);

      const userUpdateData = {
        email: formData.email,
        firstName,
        lastName,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
        role: formData.role,
        salonId: selectedSalon?.salonId || selectedSalon?.id || formData.salonId,
        status: mapFormStatusToApi(formData.status),
        imageFile: formData.imageFile,
      };

      console.log("Updating user with data:", userUpdateData);
      await updateUser(formData.userId, userUpdateData);

      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: true,
        message: language === "vi"
          ? `${formData.fullName} đã được cập nhật thành công.`
          : `${formData.fullName} has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      setIsSaving(false);
      setShowSaveModal(false);
      setSaveResult({
        success: false,
        message: error?.response?.data?.message || error?.message || (language === "vi" ? "Cập nhật nhân viên thất bại." : "Failed to update staff member."),
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
            <h1 className="text-[28px] font-bold tracking-tight text-[#cf3d74]">
              {language === "vi" ? "Cập nhật Nhân viên" : "Update Staff"}
            </h1>
            <p className="text-[12px] font-medium text-slate-400">
              {language === "vi" ? `Cập nhật thông tin cho #${formData.staffId || staffId}` : `Update staff information for #${formData.staffId || staffId}`}
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
            {language === "vi" ? "Hủy bỏ" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={14} />
            {language === "vi" ? "Cập nhật" : "Update Staff"}
          </button>
        </div>
      </header>

      {isLoading ? (
        <StaffUpdateLoadingState />
      ) : (
        <>
          <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoChip 
              icon={Users} 
              title={language === "vi" ? "Nhóm hiện tại" : "Current Team"} 
              value={language === "vi" ? "84 hồ sơ hoạt động" : "84 Active Profiles"} 
            />
            <InfoChip
              icon={BriefcaseBusiness}
              title={language === "vi" ? "Chi nhánh phân bổ" : "Assigned Salon"}
              value={formData.assignedSalon || (language === "vi" ? "Chưa rõ" : "-")}
              tone="text-sky-500"
            />
            <InfoChip
              icon={ShieldCheck}
              title={language === "vi" ? "Vai trò" : "Role"}
              value={selectedRole ? (language === "vi" ? { Staff_Artist: "Nhân viên làm móng", Manager: "Quản lý", Receptionist: "Lễ tân" }[selectedRole.value] || selectedRole.label : selectedRole.label) : "-"}
              tone="text-violet-500"
            />
            <InfoChip
              icon={Sparkles}
              title={language === "vi" ? "Trạng thái" : "Status"}
              value={selectedStatus ? (language === "vi" ? { ACTIVE: "Hoạt động", INACTIVE: "Ngừng hoạt động" }[selectedStatus.value] || selectedStatus.label : selectedStatus.label) : "-"}
              tone="text-emerald-500"
            />
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <section className="rounded-[28px] bg-white/65 p-6 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
                <h2 className="mb-6 text-[20px] font-bold text-slate-800">
                  {language === "vi" ? "Thông tin Nhân viên" : "Staff Details"}
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <span className="text-[13px] font-semibold text-slate-600">
                      {language === "vi" ? "Họ và tên" : "Full Name"} <span className="text-rose-500">*</span>
                    </span>
                    <div className={inputWrapperClassName}>
                      <User size={14} className="shrink-0 text-rose-300" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(event) => handleInputChange("fullName", event.target.value)}
                        placeholder={language === "vi" ? "Nhập họ và tên" : "Enter full name"}
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
                      {language === "vi" ? "Số điện thoại" : "Phone Number"} <span className="text-rose-500">*</span>
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
                      {language === "vi" ? "Vai trò" : "Role"}
                    </span>
                    <Select
                      value={formData.role}
                      onChange={(value) => handleInputChange("role", value)}
                      options={STAFF_ROLE_OPTIONS.map((option) => {
                        const roleLabelMap = { Staff_Artist: "Nhân viên làm móng", Manager: "Quản lý", Receptionist: "Lễ tân" };
                        return {
                          value: option.value,
                          label: language === "vi" ? roleLabelMap[option.value] || option.label : option.label,
                        };
                      })}
                      className="w-full"
                      size="large"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[13px] font-semibold text-slate-600">
                      {language === "vi" ? "Chi nhánh phân bổ" : "Assigned Salon"}
                    </span>
                    <Select
                      value={formData.salonId}
                      onChange={(value) => {
                        const selectedSalon = salons.find(s => s.id === value);
                        handleInputChange("salonId", value);
                        handleInputChange("assignedSalon", selectedSalon?.name || "");
                      }}
                      options={salons.map((salon) => ({
                        value: salon.id,
                        label: salon.name,
                      }))}
                      className="w-full"
                      size="large"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[13px] font-semibold text-slate-600">
                      {language === "vi" ? "Trạng thái" : "Status"}
                    </span>
                    <Select
                      value={formData.status}
                      onChange={(value) => handleInputChange("status", value)}
                      options={UPDATED_STATUS_OPTIONS.map((option) => ({
                        value: option.value,
                        label: language === "vi" ? (option.value === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động") : option.label,
                      }))}
                      className="w-full"
                      size="large"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <span className="text-[13px] font-semibold text-slate-600">
                      {language === "vi" ? "Ảnh đại diện" : "Avatar"}
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
                            <User size={28} />
                          </div>
                          <div className="text-center">
                            <p className="text-base font-semibold text-slate-700">{language === "vi" ? "Nhấn vào đây để tải ảnh đại diện lên" : "Click to upload staff avatar"}</p>
                            <p className="text-xs text-slate-400 mt-1">{language === "vi" ? "Chấp nhận PNG, JPG lên đến 5MB" : "PNG, JPG up to 5MB"}</p>
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
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-[#fff4f8] to-[#fffdfd] p-6 shadow-[0_20px_40px_rgba(226,93,143,0.08)]">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-xl bg-rose-100 p-2 text-rose-500">
                    <User size={14} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-800">{language === "vi" ? "Xem trước hồ sơ" : "Profile Preview"}</h3>
                    <p className="text-[11px] font-medium text-slate-400">
                      {language === "vi" ? "Bản cập nhật tóm tắt cho thành viên này" : "Updated summary for this team member"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-rose-100 bg-white p-4 text-center shadow-[0_10px_20px_rgba(226,93,143,0.06)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-300 text-[20px] font-bold text-white">
                    {getStaffInitials(formData.fullName || "NS")}
                  </div>
                  <h4 className="mt-3 text-[15px] font-bold text-slate-800">
                    {formData.fullName || (language === "vi" ? "Thành viên nhân viên" : "Staff Member")}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {selectedRole ? (language === "vi" ? { Staff_Artist: "Nhân viên làm móng", Manager: "Quản lý", Receptionist: "Lễ tân" }[selectedRole.value] || selectedRole.label : selectedRole.label) : (language === "vi" ? "Vai trò" : "Role")} · #{formData.staffId}
                  </p>
                  <p className="mt-4 text-[11px] font-medium text-slate-400">
                    {language === "vi" ? "Chi nhánh phân bổ:" : "Assigned Salon:"}{" "}
                    <span className="font-bold text-rose-400">{formData.assignedSalon || (language === "vi" ? "Chưa có" : "None")}</span>
                  </p>
                </div>
              </section>

              <section className="rounded-[28px] bg-white/65 p-6 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
                <h3 className="mb-4 text-[14px] font-bold text-slate-800">{language === "vi" ? "Danh sách cập nhật" : "Update Checklist"}</h3>
                <div className="space-y-3">
                  {STAFF_UPDATE_CHECKLIST.map((item) => {
                    const checklistMap = {
                      "Confirm Personal Information changes": "Xác nhận các thay đổi thông tin cá nhân",
                      "Update Work Schedule if necessary": "Cập nhật lịch làm việc nếu cần thiết",
                      "Verify Branch assignment details": "Xác minh chi tiết phân bổ chi nhánh",
                      "Ensure credentials are secure": "Đảm bảo thông tin đăng nhập an toàn",
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
              </section>
            </aside>
          </form>
        </>
      )}

      <ActionConfirmModal
        open={showCancelModal}
        intent="warning"
        title={language === "vi" ? "Hủy Cập Nhật Nhân Viên" : "Cancel Staff Update"}
        subtitle={language === "vi" ? "Bạn đang thoát khỏi phiên chỉnh sửa mà không lưu." : "You are leaving this edit session without saving."}
        description={language === "vi" ? "Các thay đổi gần đây trên hồ sơ nhân viên này sẽ bị hủy bỏ nếu bạn thoát lúc này." : "Recent changes to this staff profile will be discarded if you leave now."}
        confirmText={language === "vi" ? "Có, Hủy bỏ" : "Leave Page"}
        cancelText={language === "vi" ? "Tiếp tục sửa" : "Keep Editing"}
        confirmIcon={X}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        details={[
          { label: language === "vi" ? "Chế độ sửa" : "Editing Mode", value: language === "vi" ? "Cập nhật hồ sơ nhân viên" : "Update staff profile" },
          { label: language === "vi" ? "Bước tiếp theo" : "Next Step", value: language === "vi" ? "Quay lại danh sách nhân viên" : "Return to staff list" },
        ]}
        warnings={
          language === "vi"
            ? ["Vai trò, salon và hồ sơ thay đổi sẽ không được lưu.", "Bản ghi nhân viên hiện tại sẽ giữ nguyên cho đến khi xác nhận cập nhật thành công."]
            : ["Role, salon assignment, and profile changes will not be saved.", "The current staff record will remain unchanged until you confirm the update."]
        }
      />

      <ActionConfirmModal
        open={showSaveModal}
        intent="success"
        title={language === "vi" ? "Lưu Thay Đổi Nhân Viên" : "Save Staff Changes"}
        subtitle={language === "vi" ? "Thao tác này sẽ lưu các cập nhật vào cơ sở dữ liệu." : "This will update the profile in the database."}
        description={language === "vi" ? "Xác nhận áp dụng những thay đổi mới nhất cho nhân viên này." : "Confirm to apply the latest changes to this staff member."}
        confirmText={language === "vi" ? "Cập nhật" : "Update Staff"}
        cancelText={language === "vi" ? "Xem lại" : "Review Again"}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => !isSaving && setShowSaveModal(false)}
        highlights={[formData.fullName || (language === "vi" ? "Nhân viên" : "Staff profile"), language === "vi" ? { Staff_Artist: "Nhân viên làm móng", Manager: "Quản lý", Receptionist: "Lễ tân" }[formData.role] || formData.role : formData.role, language === "vi" ? (formData.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động") : formData.status]}
        details={[
          { label: language === "vi" ? "Chi nhánh phân bổ" : "Assigned Salon", value: formData.assignedSalon || (language === "vi" ? "Chưa chọn chi nhánh" : "No salon selected") },
        ]}
      />

      <StaffSaveResultModal
        result={saveResult}
        successTitle={language === "vi" ? "Cập Nhật Thành Công" : "Update Successful"}
        failureTitle={language === "vi" ? "Cập Nhật Thất Bại" : "Update Failed"}
        successDescription={language === "vi" ? "Hồ sơ nhân viên đã được cập nhật thành công." : "The staff member has been updated successfully."}
        failureDescription={language === "vi" ? "Không thể cập nhật hồ sơ nhân viên." : "Unable to update the staff member."}
        onFailureClose={handleCloseResultModal}
        onSuccessComplete={handleSuccessComplete}
      />
    </section>
  );
}
