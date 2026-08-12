import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { Alert, Spin } from "antd";
import {
  Building2,
  Camera,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Save,
  Shield,
  Trash2,
  UserRound,
  X,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { setSession } from "../model/authSlice";
import { loadAuthSession } from "../model/authStorage";
import {
  deactivateCurrentProfile,
  fetchCurrentProfile,
  fetchProfileSalonDetail,
  updateCurrentProfile,
} from "../services/profileService";
import { authService } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

function Card({ className = "", children }) {
  return (
    <article className={`relative overflow-hidden rounded-[32px] border border-white/60 bg-white/40 p-1 shadow-[0_8px_32px_rgba(236,72,153,0.08)] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_16px_48px_rgba(236,72,153,0.15)] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 pointer-events-none" />
      <div className="relative z-10 h-full w-full rounded-[28px] bg-white/60 p-6">
        {children}
      </div>
    </article>
  );
}

function Field({ label, value, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/50 bg-white/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white/60 hover:shadow-[0_12px_30px_rgba(236,72,153,0.12)]">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#ea4f93]/15 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:from-[#ea4f93]/25" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-[#fff0f6] text-[#ea4f93] shadow-[inset_0_2px_10px_rgba(255,255,255,1),0_4px_12px_rgba(236,72,153,0.1)] transition-transform duration-300 group-hover:scale-110">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 pt-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c08aa4]">{label}</p>
          <p className="mt-1 break-words text-[15px] font-extrabold text-[#3f2240]">{value || "--"}</p>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ title, value, note }) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/50 bg-white/40 p-5 transition-all duration-300 hover:bg-white/60 hover:shadow-[0_12px_30px_rgba(236,72,153,0.12)]">
      <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-gradient-to-br from-[#ea4f93]/10 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:from-[#ea4f93]/20" />
      <div className="relative">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c08aa4]">{title}</p>
        <p className="mt-2 text-2xl font-black tracking-tight text-[#402542] group-hover:text-[#ea4f93] transition-colors">{value || "--"}</p>
        <p className="mt-1.5 text-[11px] font-medium text-[#a07c90]">{note}</p>
      </div>
    </div>
  );
}

function formatRoleLabel(role, t) {
  switch (String(role || "").toLowerCase()) {
    case "admin":
      return t("superAdmin") || "Admin";
    case "manager":
      return t("salonManager") || "Salon Manager";
    case "receptionist":
      return t("receptionist") || "Receptionist";
    case "staff_artist":
    case "staff":
      return t("nailArtist") || "Staff Artist";
    default:
      return role || "--";
  }
}

function formatTimeValue(value) {
  if (!value) return "--";

  const directMatch = String(value).match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (directMatch) {
    return directMatch[1];
  }

  return String(value);
}

function getDashboardRouteByRole(role) {
  switch (role) {
    case "admin":
      return ROUTES.adminDashboard;
    case "manager":
      return ROUTES.managerDashboard;
    case "receptionist":
      return ROUTES.receptionistDashboard;
    case "staff":
    default:
      return ROUTES.staffDashboard;
  }
}

export function ProfilePage() {
  const { t, language } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [profile, setProfile] = useState(null);
  const [salon, setSalon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    imageFile: null,
  });
  const [avatarPreview, setAvatarPreview] = useState("");

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const hydrateForm = useCallback((nextProfile) => {
    setFormValues({
      email: nextProfile?.email || "",
      firstName: nextProfile?.firstName || "",
      lastName: nextProfile?.lastName || "",
      phone: nextProfile?.phone || "",
      imageFile: null,
    });
    setAvatarPreview(nextProfile?.avatarUrl || "");
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const nextProfile = await fetchCurrentProfile();
      setProfile(nextProfile);
      hydrateForm(nextProfile);

      if (nextProfile.salonId) {
        const nextSalon = await fetchProfileSalonDetail(nextProfile.salonId);
        setSalon(nextSalon);
      } else {
        setSalon(null);
      }
    } catch (err) {
      console.error("Failed to load profile data:", err);
      setError(err?.message || t("profile.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [hydrateForm]);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  const hasChanges = useMemo(() => {
    if (!profile) {
      return false;
    }

    return (
      formValues.email !== (profile.email || "") ||
      formValues.firstName !== (profile.firstName || "") ||
      formValues.lastName !== (profile.lastName || "") ||
      formValues.phone !== (profile.phone || "") ||
      Boolean(formValues.imageFile)
    );
  }, [formValues, profile]);

  const handleInputChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
    if (error) {
      setError("");
    }
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFormValues((current) => ({
      ...current,
      imageFile: file,
    }));

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setAvatarPreview(loadEvent.target?.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleCancelEdit = () => {
    hydrateForm(profile);
    setIsEditing(false);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const updatedProfile = await updateCurrentProfile(formValues);
      setProfile(updatedProfile);
      hydrateForm(updatedProfile);
      setIsEditing(false);
      setSuccessMessage(t("profile.updateSuccess"));

      const session = loadAuthSession();
      dispatch(
        setSession({
          accessToken: session?.accessToken,
          user: {
            ...(session?.user || {}),
            id: updatedProfile.userId || session?.user?.id || "",
            userId: updatedProfile.userId || session?.user?.userId || "",
            staffId: updatedProfile.staffId || session?.user?.staffId || null,
            salonId: updatedProfile.salonId || session?.user?.salonId || null,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            avatarUrl: updatedProfile.avatarUrl,
            fullName: updatedProfile.fullName,
            status: updatedProfile.status,
            role: session?.user?.role || role,
          },
        }),
      );

      if (updatedProfile.salonId) {
        const nextSalon = await fetchProfileSalonDetail(updatedProfile.salonId);
        setSalon(nextSalon);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err?.message || t("profile.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm(t("profile.confirmDeactivate"));

    if (!confirmed) {
      return;
    }

    try {
      setIsDeactivating(true);
      setError("");
      await deactivateCurrentProfile();
      logout();
      navigate(ROUTES.login, { replace: true });
    } catch (err) {
      console.error("Failed to deactivate profile:", err);
      setError(err?.message || t("profile.deactivateFailed"));
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex min-h-[420px] items-center justify-center">
        <Spin size="large" description={t("profile.loadingProfile")} />
      </section>
    );
  }

  return (
    <section className="relative mx-auto w-full max-w-[1350px] text-[#402542] min-h-[80vh] p-2">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#ffd4e4]/40 to-transparent blur-[100px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -right-[5%] top-[40%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-[#e0c3fc]/30 to-transparent blur-[120px] animate-[pulse_12s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 space-y-6">
        {error ? (
          <Alert message={t("profile.profileError")} description={error} type="error" showIcon className="rounded-[20px] border-none shadow-sm" />
        ) : null}

        {successMessage ? (
          <Alert message={t("profile.profileUpdated")} description={successMessage} type="success" showIcon className="rounded-[20px] border-none shadow-sm" />
        ) : null}

        <Card className="!p-0 border-none shadow-[0_20px_50px_rgba(236,72,153,0.08)]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(255,242,247,0.8)_0%,rgba(255,249,252,0.8)_50%,rgba(250,245,249,0.8)_100%)] p-8 sm:p-10">
            {/* Top decorative flares */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ff8ebb]/20 via-transparent to-transparent opacity-70 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#c4b5fd]/20 via-transparent to-transparent opacity-70 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group shrink-0">
                  <div className="absolute -inset-1 rounded-[38px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] opacity-20 blur-xl transition-all duration-500 group-hover:opacity-40 group-hover:blur-2xl" />
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={profile?.fullName || "Profile"}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="relative h-32 w-32 rounded-[32px] border-[4px] border-white/80 object-cover shadow-[0_20px_40px_rgba(236,72,153,0.15)] transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,#ff8ebb_0%,#ea4f93_100%)] text-4xl font-black text-white shadow-[0_20px_40px_rgba(236,72,153,0.25)] transition-transform duration-500 group-hover:scale-105">
                      {(profile?.fullName || "NU")
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() || "")
                        .join("")}
                    </div>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-3.5 py-1.5 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ea4f93] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ea4f93]"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ea4f93]">
                      {formatRoleLabel(profile?.role, t)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-[#2b182b] drop-shadow-sm">
                    {profile?.fullName || user?.fullName || "Nailify User"}
                  </h2>
                  <p className="mt-2 text-base font-medium text-[#8f6b80] flex items-center justify-center sm:justify-start gap-2">
                    <Mail size={14} /> {profile?.email || "--"}
                    <span className="mx-2 opacity-30">•</span>
                    <Shield size={14} /> {profile?.status || "--"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:min-w-[480px]">
                <InfoTile title={t("profile.role")} value={formatRoleLabel(profile?.role, t)} note={t("profile.accessLevel")} />
                {/* <InfoTile title="Staff ID" value={profile?.staffId || "N/A"} note="System Ref" />
                <InfoTile title="Salon ID" value={profile?.salonId || "N/A"} note="Branch Ref" /> */}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_440px]">
          {/* Account Information Panel */}
          <div className="space-y-6">
            <Card className="!p-8">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#2b182b] flex items-center gap-2">
                    <UserRound className="text-[#ea4f93]" size={24} /> {t("profile.profileDetails")}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium text-[#8f6b80]">{t("profile.profileDetailsDesc")}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-white/60 bg-white/40 px-5 text-sm font-bold text-[#8f7184] shadow-sm transition-all hover:bg-white/80 hover:shadow-md"
                      >
                        <X size={16} /> {t("profile.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={!hasChanges || isSaving}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)] transition-all hover:opacity-90 hover:shadow-[0_12px_28px_rgba(236,72,153,0.35)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                      >
                        <Save size={16} /> {isSaving ? t("profile.saving") : t("profile.saveChanges")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsChangePasswordOpen(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[#f8c8db] bg-[#fff8fb] px-6 text-sm font-bold text-[#eb5a99] shadow-sm transition-all hover:bg-[#fff0f7] hover:shadow-[0_8px_20px_rgba(236,72,153,0.15)] hover:-translate-y-0.5"
                      >
                        <LockKeyhole size={16} /> {language === "vi" ? "Đổi mật khẩu" : "Change Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-white/60 bg-white/60 px-6 text-sm font-bold text-[#ea4f93] shadow-sm transition-all hover:bg-white hover:shadow-[0_8px_20px_rgba(236,72,153,0.15)] hover:-translate-y-0.5"
                      >
                        <PencilLine size={16} /> {t("profile.editProfile")}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block group">
                      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c08aa4] group-focus-within:text-[#ea4f93] transition-colors">{t("profile.firstName")}</span>
                      <input
                        value={formValues.firstName}
                        onChange={(event) => handleInputChange("firstName", event.target.value)}
                        className="h-14 w-full rounded-[20px] border-2 border-[#f3d5e2]/60 bg-white/50 px-5 text-[15px] font-bold text-[#2b182b] outline-none transition-all focus:border-[#ea4f93] focus:bg-white focus:shadow-[0_8px_20px_rgba(236,72,153,0.1)]"
                        placeholder={t("profile.enterFirstName")}
                      />
                    </label>

                    <label className="block group">
                      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c08aa4] group-focus-within:text-[#ea4f93] transition-colors">{t("profile.lastName")}</span>
                      <input
                        value={formValues.lastName}
                        onChange={(event) => handleInputChange("lastName", event.target.value)}
                        className="h-14 w-full rounded-[20px] border-2 border-[#f3d5e2]/60 bg-white/50 px-5 text-[15px] font-bold text-[#2b182b] outline-none transition-all focus:border-[#ea4f93] focus:bg-white focus:shadow-[0_8px_20px_rgba(236,72,153,0.1)]"
                        placeholder={t("profile.enterLastName")}
                      />
                    </label>

                    <label className="block group">
                      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c08aa4] group-focus-within:text-[#ea4f93] transition-colors">{t("profile.email")}</span>
                      <input
                        type="email"
                        value={formValues.email}
                        onChange={(event) => handleInputChange("email", event.target.value)}
                        className="h-14 w-full rounded-[20px] border-2 border-[#f3d5e2]/60 bg-white/50 px-5 text-[15px] font-bold text-[#2b182b] outline-none transition-all focus:border-[#ea4f93] focus:bg-white focus:shadow-[0_8px_20px_rgba(236,72,153,0.1)]"
                        placeholder={t("profile.enterEmail")}
                      />
                    </label>

                    <label className="block group">
                      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c08aa4] group-focus-within:text-[#ea4f93] transition-colors">{t("profile.phone")}</span>
                      <input
                        value={formValues.phone}
                        onChange={(event) => handleInputChange("phone", event.target.value)}
                        className="h-14 w-full rounded-[20px] border-2 border-[#f3d5e2]/60 bg-white/50 px-5 text-[15px] font-bold text-[#2b182b] outline-none transition-all focus:border-[#ea4f93] focus:bg-white focus:shadow-[0_8px_20px_rgba(236,72,153,0.1)]"
                        placeholder={t("profile.enterPhone")}
                      />
                    </label>
                  </div>

                  <label className="group flex cursor-pointer items-center justify-between rounded-[24px] border-2 border-dashed border-[#ea4f93]/30 bg-white/40 px-6 py-6 transition-all hover:border-[#ea4f93] hover:bg-white hover:shadow-[0_12px_30px_rgba(236,72,153,0.1)]">
                    <div className="flex items-center gap-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Camera size={24} />
                      </div>
                      <div>
                        <p className="text-base font-black text-[#2b182b]">{t("profile.updatePhoto")}</p>
                        <p className="mt-1 text-sm font-medium text-[#8f6b80]">{t("profile.updatePhotoDesc")}</p>
                      </div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <span className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#ea4f93] shadow-sm transition-colors group-hover:bg-[#fff0f6]">
                      {t("profile.browseFiles")}
                    </span>
                  </label>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("profile.firstName")} value={profile?.firstName} icon={UserRound} />
                  <Field label={t("profile.lastName")} value={profile?.lastName} icon={UserRound} />
                  <Field label={t("profile.email")} value={profile?.email} icon={Mail} />
                  <Field label={t("profile.phone")} value={profile?.phone} icon={Phone} />
                  <Field label={t("profile.status")} value={profile?.status} icon={CheckCircle2} />
                  <Field label={t("profile.role")} value={formatRoleLabel(profile?.role, t)} icon={Shield} />
                </div>
              )}
            </Card>

            <Card className="!p-8">
              <h3 className="text-xl font-black text-[#2b182b] flex items-center gap-2">
                <Clock3 className="text-[#ea4f93]" size={22} /> {t("profile.operatingHours")}
              </h3>

              <div className="mt-6 space-y-3">
                {salon?.operatingHours?.length ? (
                  salon.operatingHours.map((slot, index) => (
                    <div
                      key={`${slot.dayOfWeek}-${slot.dayName}-${index}`}
                      className="group flex items-center justify-between rounded-[20px] border border-white/50 bg-white/40 px-5 py-4 transition-all duration-300 hover:bg-white/70 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#ea4f93] shadow-sm transition-transform duration-300 group-hover:scale-110">
                          <Clock3 size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-[15px] font-black text-[#2b182b]">{slot.dayName}</p>
                          <p className="text-xs font-medium text-[#8f6b80] mt-0.5">
                            {slot.isClosed ? t("profile.closed") : `${formatTimeValue(slot.openTime)} - ${formatTimeValue(slot.closeTime)}`}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] shadow-sm ${slot.isClosed ? "bg-[#f3e8ff] text-[#7c3aed]" : "bg-[#eaf9ee] text-[#2fa25f]"}`}>
                        {slot.isClosed ? t("profile.closed") : "Open"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-[#f5d7e5] bg-white/40 py-6 text-center text-sm font-medium text-[#8f6b80]">
                    {t("profile.noOperatingHours")}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="!p-8">
              <h3 className="text-2xl font-black text-[#2b182b] flex items-center gap-2">
                <Building2 className="text-[#ea4f93]" size={24} /> {t("profile.salonAssignment")}
              </h3>
              <p className="mt-1.5 text-sm font-medium text-[#8f6b80]">{t("profile.salonAssignmentDesc")}</p>

              {salon ? (
                <div className="mt-6 space-y-5">
                  {salon.imageUrl ? (
                    <div className="relative group rounded-[24px] overflow-hidden shadow-md">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                      <img
                        src={salon.imageUrl}
                        alt={salon.name}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute bottom-4 left-5 z-20">
                        <span className="inline-flex rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-bold text-white mb-1 uppercase tracking-wider">{t("profile.assignedBranch")}</span>
                        <p className="text-lg font-black text-white drop-shadow-md truncate">{salon.name}</p>
                      </div>
                    </div>
                  ) : null}

                  <Field label={t("profile.salonName")} value={salon.name} icon={Building2} />
                  <Field label={t("profile.address")} value={salon.address} icon={MapPin} />
                  <Field label={t("profile.phone")} value={salon.phone} icon={Phone} />
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#f5d7e5] bg-white/40 py-10 px-6 text-center shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#fff0f6] text-[#ea4f93] shadow-inner mb-4">
                    <Building2 size={28} />
                  </div>
                  <h4 className="text-lg font-bold text-[#2b182b]">{t("profile.unassignedAccount")}</h4>
                  <p className="mt-2 text-sm font-medium text-[#8f6b80]">{t("profile.unassignedAccountDesc")}</p>
                </div>
              )}
            </Card>



            <Card className="!p-8">
              <h3 className="text-xl font-black text-[#2b182b] flex items-center gap-2">
                <Shield className="text-[#ea4f93]" size={22} /> {t("profile.systemActions")}
              </h3>
              <p className="mt-1.5 text-sm font-medium text-[#8f6b80]">{t("profile.systemActionsDesc")}</p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => navigate(getDashboardRouteByRole(role))}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] border-2 border-white/60 bg-white/60 px-5 text-sm font-bold text-[#2b182b] shadow-sm transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                >
                  <Building2 size={16} /> {t("profile.returnToDashboard")}
                </button>

                <button
                  type="button"
                  onClick={handleDeactivateAccount}
                  disabled={isDeactivating}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-red-500 to-rose-600 px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(225,29,72,0.25)] transition-all hover:opacity-90 hover:shadow-[0_12px_28px_rgba(225,29,72,0.35)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  <Trash2 size={16} />
                  {isDeactivating ? t("profile.deactivating") : t("profile.deactivateAccount")}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/60 bg-white/90 p-8 shadow-[0_32px_64px_rgba(236,72,153,0.18)] backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => {
                setIsChangePasswordOpen(false);
                setPasswordForm({ newPassword: "", confirmPassword: "" });
                setPasswordError("");
                setPasswordSuccess("");
              }}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>

            <div className="mb-6 space-y-2">
              <h3 className="text-2xl font-black text-[#2b182b] flex items-center gap-2">
                <LockKeyhole className="text-[#ea4f93]" size={24} />
                {language === "vi" ? "Đổi mật khẩu" : "Change Password"}
              </h3>
              <p className="text-xs font-medium text-[#8f6b80] leading-relaxed">
                {language === "vi"
                  ? "Nhập mật khẩu mới và xác nhận để cập nhật mật khẩu của bạn."
                  : "Enter your new password and confirm to update."}
              </p>
            </div>

            {passwordError ? (
              <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500">
                {passwordError}
              </div>
            ) : null}

            {passwordSuccess ? (
              <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-600">
                {passwordSuccess}
              </div>
            ) : null}

            <div className="space-y-4">
              {/* New Password Input */}
              <label className="block group">
                <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-[#c08aa4]">
                  {language === "vi" ? "Mật khẩu mới" : "New Password"}
                </span>
                <div className="relative">
                  <input
                    type={isNewPasswordVisible ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(c => ({ ...c, newPassword: e.target.value }))}
                    className="h-12 w-full rounded-[16px] border-2 border-[#f3d5e2]/60 bg-white/50 pl-4 pr-10 text-sm font-bold text-[#2b182b] outline-none transition focus:border-[#ea4f93] focus:bg-white"
                    placeholder={language === "vi" ? "Nhập mật khẩu mới" : "Enter new password"}
                  />
                  <button
                    type="button"
                    onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {isNewPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {/* Confirm Password Input */}
              <label className="block group">
                <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-[#c08aa4]">
                  {language === "vi" ? "Xác nhận mật khẩu mới" : "Confirm New Password"}
                </span>
                <div className="relative">
                  <input
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(c => ({ ...c, confirmPassword: e.target.value }))}
                    className="h-12 w-full rounded-[16px] border-2 border-[#f3d5e2]/60 bg-white/50 pl-4 pr-10 text-sm font-bold text-[#2b182b] outline-none transition focus:border-[#ea4f93] focus:bg-white"
                    placeholder={language === "vi" ? "Nhập lại mật khẩu mới" : "Re-enter new password"}
                  />
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {isConfirmPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setPasswordForm({ newPassword: "", confirmPassword: "" });
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/60 bg-white/40 px-5 text-sm font-bold text-[#8f7184] hover:bg-white/80 transition"
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (passwordForm.newPassword.length < 6) {
                    setPasswordError(language === "vi" ? "Mật khẩu mới phải từ 6 ký tự trở lên." : "New password must be at least 6 characters.");
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    setPasswordError(language === "vi" ? "Mật khẩu xác nhận không trùng khớp." : "Confirm password does not match.");
                    return;
                  }

                  try {
                    setIsResettingPassword(true);
                    setPasswordError("");
                    setPasswordSuccess("");
                    const response = await authService.resetPassword({
                      token: accessToken,
                      newPassword: passwordForm.newPassword,
                      confirmPassword: passwordForm.confirmPassword,
                    });
                    
                    if (response?.isSucceeded) {
                      toast.success(
                        language === "vi"
                          ? "Cập nhật mật khẩu mới thành công!"
                          : "Password updated successfully!"
                      );
                      setIsChangePasswordOpen(false);
                      setPasswordForm({ newPassword: "", confirmPassword: "" });
                    } else {
                      setPasswordError(response?.message || "Reset failed.");
                    }
                  } catch (err) {
                    setPasswordError(err.message || "Failed to reset password.");
                  } finally {
                    setIsResettingPassword(false);
                  }
                }}
                disabled={isResettingPassword}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {isResettingPassword
                  ? (language === "vi" ? "Đang xử lý..." : "Processing...")
                  : (language === "vi" ? "Xác nhận đổi" : "Confirm Change")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
