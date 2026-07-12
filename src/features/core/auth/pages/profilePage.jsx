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
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
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
import { useAuth } from "../hooks/useAuth";

function Card({ className = "", children }) {
  return (
    <article className={`rounded-[24px] border border-[#f6dce7] bg-white shadow-[0_14px_34px_rgba(236,72,153,0.08)] ${className}`}>
      {children}
    </article>
  );
}

function Field({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[18px] border border-[#f5d7e5] bg-[#fff9fb] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#ea4f93] shadow-[0_8px_18px_rgba(236,72,153,0.08)]">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c08aa4]">{label}</p>
          <p className="mt-1 break-words text-sm font-bold text-[#402542]">{value || "--"}</p>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ title, value, note }) {
  return (
    <div className="rounded-[18px] border border-[#f5d7e5] bg-[#fff9fb] p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c08aa4]">{title}</p>
      <p className="mt-2 text-lg font-extrabold text-[#402542]">{value || "--"}</p>
      <p className="mt-1 text-xs text-[#a07c90]">{note}</p>
    </div>
  );
}

function formatRoleLabel(role) {
  switch (String(role || "").toLowerCase()) {
    case "admin":
      return "Admin";
    case "manager":
      return "Salon Manager";
    case "receptionist":
      return "Receptionist";
    case "staff_artist":
    case "staff":
      return "Staff Artist";
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
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
      setError(err?.message || "Failed to load profile.");
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
      setSuccessMessage("Profile updated successfully.");

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
      setError(err?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm("Deactivate this account? You will be signed out immediately.");

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
      setError(err?.message || "Failed to deactivate account.");
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex min-h-[420px] items-center justify-center">
        <Spin size="large" tip="Loading profile..." />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1350px] space-y-5 text-[#402542]">
      {error ? (
        <Alert
          message="Profile Error"
          description={error}
          type="error"
          showIcon
        />
      ) : null}

      {successMessage ? (
        <Alert
          message="Profile Updated"
          description={successMessage}
          type="success"
          showIcon
        />
      ) : null}

      <Card className="overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#fff7fb_0%,#fff0f6_48%,#ffe6f1_100%)] px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={profile?.fullName || "Profile"}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="h-24 w-24 rounded-[28px] border-4 border-white object-cover shadow-[0_18px_30px_rgba(236,72,153,0.12)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#ff8ebb_0%,#ea4f93_100%)] text-3xl font-black text-white shadow-[0_18px_30px_rgba(236,72,153,0.16)]">
                  {(profile?.fullName || "NU")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() || "")
                    .join("")}
                </div>
              )}

              <div>
                <div className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#d94f92] shadow-[0_10px_22px_rgba(236,72,153,0.08)]">
                  {formatRoleLabel(profile?.role)}
                </div>
                <h2 className="mt-3 text-[28px] font-black tracking-tight text-[#402542]">
                  {profile?.fullName || user?.fullName || "Nailify User"}
                </h2>
                <p className="mt-1 text-sm text-[#a07c90]">
                  {profile?.email || "--"} · Status: {profile?.status || "--"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile title="Role" value={formatRoleLabel(profile?.role)} note="Current access level" />
              <InfoTile title="Staff ID" value={profile?.staffId || "--"} note="Only available for staff roles" />
              <InfoTile title="Salon ID" value={profile?.salonId || "--"} note="Assigned branch reference" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-[#402542]">Account Information</h3>
              <p className="mt-1 text-sm text-[#a07c90]">Manage your personal details shared across the workspace.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-2 rounded-full border border-[#f3d5e2] bg-white px-4 py-2 text-xs font-bold text-[#8f7184] transition hover:bg-[#fff7fb]"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!hasChanges || isSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,#ff8ebb_0%,#ea4f93_100%)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={14} />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#f3d5e2] bg-white px-4 py-2 text-xs font-bold text-[#d94f92] transition hover:bg-[#fff7fb]"
                >
                  <PencilLine size={14} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#c08aa4]">First Name</span>
                  <input
                    value={formValues.firstName}
                    onChange={(event) => handleInputChange("firstName", event.target.value)}
                    className="h-12 w-full rounded-[16px] border border-[#f3d5e2] bg-[#fff9fb] px-4 text-sm font-semibold text-[#402542] outline-none transition focus:border-[#ea4f93] focus:bg-white"
                    placeholder="Enter first name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#c08aa4]">Last Name</span>
                  <input
                    value={formValues.lastName}
                    onChange={(event) => handleInputChange("lastName", event.target.value)}
                    className="h-12 w-full rounded-[16px] border border-[#f3d5e2] bg-[#fff9fb] px-4 text-sm font-semibold text-[#402542] outline-none transition focus:border-[#ea4f93] focus:bg-white"
                    placeholder="Enter last name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#c08aa4]">Email</span>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) => handleInputChange("email", event.target.value)}
                    className="h-12 w-full rounded-[16px] border border-[#f3d5e2] bg-[#fff9fb] px-4 text-sm font-semibold text-[#402542] outline-none transition focus:border-[#ea4f93] focus:bg-white"
                    placeholder="Enter email"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#c08aa4]">Phone</span>
                  <input
                    value={formValues.phone}
                    onChange={(event) => handleInputChange("phone", event.target.value)}
                    className="h-12 w-full rounded-[16px] border border-[#f3d5e2] bg-[#fff9fb] px-4 text-sm font-semibold text-[#402542] outline-none transition focus:border-[#ea4f93] focus:bg-white"
                    placeholder="Enter phone number"
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-[18px] border border-dashed border-[#f1bfd7] bg-[#fff8fb] px-4 py-4 transition hover:border-[#ea4f93] hover:bg-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#ea4f93] shadow-[0_8px_18px_rgba(236,72,153,0.08)]">
                    <Camera size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#402542]">Update profile photo</p>
                    <p className="mt-1 text-xs text-[#a07c90]">Upload a new avatar image for your account.</p>
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <span className="rounded-full bg-[linear-gradient(90deg,#ff8ebb_0%,#ea4f93_100%)] px-4 py-2 text-xs font-bold text-white">
                  Choose Image
                </span>
              </label>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name" value={profile?.firstName} icon={UserRound} />
              <Field label="Last Name" value={profile?.lastName} icon={UserRound} />
              <Field label="Email Address" value={profile?.email} icon={Mail} />
              <Field label="Phone Number" value={profile?.phone} icon={Phone} />
              <Field label="Account Status" value={profile?.status} icon={CheckCircle2} />
              <Field label="Role" value={formatRoleLabel(profile?.role)} icon={Shield} />
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-black text-[#402542]">Salon Assignment</h3>
            <p className="mt-1 text-sm text-[#a07c90]">Branch information loaded from your assigned salon.</p>

            {salon ? (
              <div className="mt-5 space-y-4">
                {salon.imageUrl ? (
                  <img
                    src={salon.imageUrl}
                    alt={salon.name}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    className="h-44 w-full rounded-[22px] border border-[#f5d7e5] object-cover"
                  />
                ) : null}

                <Field label="Salon Name" value={salon.name} icon={Building2} />
                <Field label="Address" value={salon.address} icon={MapPin} />
                <Field label="Phone" value={salon.phone} icon={Phone} />
                <Field label="Status" value={salon.status} icon={CheckCircle2} />
              </div>
            ) : (
              <div className="mt-5 rounded-[18px] border border-dashed border-[#efcadd] bg-[#fff9fb] px-4 py-6 text-center text-sm font-semibold text-[#a07c90]">
                This account is not linked to a salon branch.
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-black text-[#402542]">Operating Hours</h3>
            <p className="mt-1 text-sm text-[#a07c90]">The weekly schedule of your current salon branch.</p>

            <div className="mt-5 space-y-3">
              {salon?.operatingHours?.length ? (
                salon.operatingHours.map((slot) => (
                  <div
                    key={`${slot.dayOfWeek}-${slot.dayName}`}
                    className="flex items-center justify-between rounded-[18px] border border-[#f5d7e5] bg-[#fff9fb] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#ea4f93] shadow-[0_8px_18px_rgba(236,72,153,0.08)]">
                        <Clock3 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#402542]">{slot.dayName}</p>
                        <p className="text-xs text-[#a07c90]">
                          {slot.isClosed ? "Closed" : `${formatTimeValue(slot.openTime)} - ${formatTimeValue(slot.closeTime)}`}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${slot.isClosed ? "bg-[#f3e8ff] text-[#7c3aed]" : "bg-[#eaf9ee] text-[#2fa25f]"}`}>
                      {slot.isClosed ? "Closed" : "Open"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#efcadd] bg-[#fff9fb] px-4 py-6 text-center text-sm font-semibold text-[#a07c90]">
                  No operating hours available.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-black text-[#402542]">Account Actions</h3>
            <p className="mt-1 text-sm text-[#a07c90]">Use these actions carefully. Deactivation signs you out immediately.</p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate(getDashboardRouteByRole(role))}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f3d5e2] bg-white px-4 py-3 text-sm font-bold text-[#8f7184] transition hover:bg-[#fff7fb]"
              >
                <Building2 size={16} />
                Back To Dashboard
              </button>

              <button
                type="button"
                onClick={handleDeactivateAccount}
                disabled={isDeactivating}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#f87171_0%,#e11d48_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(225,29,72,0.18)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />
                {isDeactivating ? "Deactivating..." : "Deactivate My Account"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
