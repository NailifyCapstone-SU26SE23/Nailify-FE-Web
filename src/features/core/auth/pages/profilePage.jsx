import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import {
  Building2,
  Camera,
  CheckCircle2,
  Clock3,
  LockKeyhole,
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
  changeProfilePassword,
} from "../services/profileService";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const { Title, Text, Paragraph } = Typography;

const PRIMARY = "#ea4f93";
const PRIMARY_SOFT = "#fff0f6";
const TEXT_DARK = "#2b182b";
const TEXT_MUTED = "#8f6b80";

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
      return role || "—";
  }
}

function formatTimeValue(value) {
  if (!value) return "--";
  const directMatch = String(value).match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (directMatch) return directMatch[1];
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

const cardStyle = {
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.7)",
  boxShadow: "0 12px 40px rgba(236,72,153,0.08)",
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(16px)",
  overflow: "hidden",
};

function ProfileField({
  label,
  value,
  icon: Icon,
  children,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/50 p-4 transition-all duration-300 hover:bg-white/70 hover:shadow-[0_8px_24px_rgba(236,72,153,0.1)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-[#fff0f6] text-[#ea4f93] shadow-sm">
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c08aa4]">
            {label}
          </p>
          {children ? (
            <div className="mt-1.5">{children}</div>
          ) : (
            <p className="mt-1 break-words text-[15px] font-bold text-[#2b182b]">
              {value || "—"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isOldPasswordVisible, setIsOldPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const [form] = Form.useForm();

  const hydrateForm = useCallback((nextProfile) => {
    const values = {
      email: nextProfile?.email || "",
      firstName: nextProfile?.firstName || "",
      lastName: nextProfile?.lastName || "",
      phone: nextProfile?.phone || "",
      imageFile: null,
    };
    setFormValues(values);
    form.setFieldsValue(values);
    setAvatarPreview(nextProfile?.avatarUrl || "");
  }, [form]);

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
  }, [hydrateForm, t]);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      formValues.email !== (profile.email || "") ||
      formValues.firstName !== (profile.firstName || "") ||
      formValues.lastName !== (profile.lastName || "") ||
      formValues.phone !== (profile.phone || "") ||
      Boolean(formValues.imageFile)
    );
  }, [formValues, profile]);

  const handleInputChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleImageChange = (file) => {
    setFormValues((current) => ({ ...current, imageFile: file }));
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result || "");
    reader.readAsDataURL(file);
    return false; // prevent auto upload
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

  const handleDeactivateAccount = () => {
    Modal.confirm({
      title: t("profile.confirmDeactivate"),
      okText: language === "vi" ? "Xác nhận" : "Confirm",
      cancelText: language === "vi" ? "Hủy" : "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
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
      },
    });
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword) {
      setPasswordError(language === "vi" ? "Vui lòng nhập mật khẩu cũ." : "Please enter your old password.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(
        language === "vi"
          ? "Mật khẩu mới phải từ 6 ký tự trở lên."
          : "New password must be at least 6 characters.",
      );
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(
        language === "vi" ? "Mật khẩu xác nhận không trùng khớp." : "Confirm password does not match.",
      );
      return;
    }

    try {
      setIsResettingPassword(true);
      setPasswordError("");
      await changeProfilePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      toast.success(
        language === "vi" ? "Cập nhật mật khẩu mới thành công!" : "Password updated successfully!",
      );
      setIsChangePasswordOpen(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const errorMessage =
        err.message ||
        (language === "vi" ? "Đổi mật khẩu thất bại." : "Failed to change password.");
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", minHeight: 420, alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" tip={t("profile.loadingProfile")} />
      </div>
    );
  }

  const initials = (profile?.fullName || "NU")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  return (
    <div style={{ padding: 16, position: "relative" }}>
      {/* Soft background */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-10%",
            top: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,212,228,0.45), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-5%",
            top: "35%",
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(224,195,252,0.35), transparent 70%)",
            filter: "blur(90px)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {error && (
          <Alert
            message={t("profile.profileError")}
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16, borderRadius: 16 }}
          />
        )}
        {successMessage && (
          <Alert
            message={t("profile.profileUpdated")}
            description={successMessage}
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16, borderRadius: 16 }}
          />
        )}

        {/* Header Card */}
        <Card style={{ ...cardStyle, marginBottom: 24 }} bodyStyle={{ padding: 0 }}>
          <div
            style={{
              padding: "32px 40px",
              background:
                "linear-gradient(135deg, rgba(255,242,247,0.9) 0%, rgba(255,249,252,0.9) 50%, rgba(250,245,249,0.9) 100%)",
            }}
          >
            <Row gutter={[24, 24]} align="middle" justify="space-between">
              <Col xs={24} lg={14}>
                <Space size={24} align="start" wrap>
                  <div style={{ position: "relative" }}>
                    <Avatar
                      size={120}
                      src={avatarPreview || undefined}
                      style={{
                        background: avatarPreview
                          ? undefined
                          : "linear-gradient(135deg, #ff8ebb, #ea4f93)",
                        fontSize: 36,
                        fontWeight: 800,
                        border: "4px solid rgba(255,255,255,0.9)",
                        boxShadow: "0 16px 32px rgba(236,72,153,0.2)",
                      }}
                    >
                      {!avatarPreview && initials}
                    </Avatar>
                  </div>
                  <div>
                    <Tag
                      color="magenta"
                      style={{
                        borderRadius: 20,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontSize: 11,
                      }}
                    >
                      {formatRoleLabel(profile?.role, t)}
                    </Tag>
                    <Title level={2} style={{ margin: "12px 0 8px", color: TEXT_DARK, fontWeight: 800 }}>
                      {profile?.fullName || user?.fullName || "Nailify User"}
                    </Title>
                    <Space split={<Divider type="vertical" />} size="middle">
                      <Text type="secondary" style={{ color: TEXT_MUTED }} className="flex items-center">
                        <Mail size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                        {profile?.email}
                      </Text>
                      <Text type="secondary" style={{ color: TEXT_MUTED }} className="flex items-center">
                        <Shield size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                        {profile?.status}
                      </Text>
                    </Space>
                  </div>
                </Space>
              </Col>
              <Col xs={24} lg={10}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.8)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "#c08aa4",
                      textTransform: "uppercase",
                    }}
                  >
                    {t("profile.role")}
                  </Text>
                  <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: TEXT_DARK }}>
                    {formatRoleLabel(profile?.role, t)}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t("profile.accessLevel")}
                  </Text>
                </Card>
              </Col>
            </Row>
          </div>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Left column */}
          <Col xs={24} xl={15}>
            {/* Profile details */}
            <Card
              style={{ ...cardStyle, marginBottom: 24 }}
              title={
                <Space>
                  <UserRound size={22} color={PRIMARY} />
                  <span className="font-bold">{t("profile.profileDetails")}</span>
                </Space>
              }
              extra={
                isEditing ? (
                  <Space>
                    <Button icon={<X size={16} />} onClick={handleCancelEdit}>
                      {t("profile.cancel")}
                    </Button>
                    <Button
                      type="primary"
                      icon={<Save size={16} />}
                      loading={isSaving}
                      disabled={!hasChanges}
                      onClick={handleSaveProfile}
                      style={{
                        background: `linear-gradient(90deg, #ff8ebb, ${PRIMARY})`,
                        border: "none",
                      }}
                      className="!text-white"
                    >
                      {isSaving ? t("profile.saving") : t("profile.saveChanges")}
                    </Button>
                  </Space>
                ) : (
                  <Space>
                    <Button
                      icon={<LockKeyhole size={16} />}
                      onClick={() => setIsChangePasswordOpen(true)}
                      style={{ color: PRIMARY, borderColor: "#f8c8db" }}
                    >
                      {language === "vi" ? "Đổi mật khẩu" : "Change Password"}
                    </Button>
                    <Button
                      type="default"
                      icon={<PencilLine size={16} />}
                      onClick={() => setIsEditing(true)}
                      style={{ color: PRIMARY, borderColor: "#f3d5e2" }}
                    >
                      {t("profile.editProfile")}
                    </Button>
                  </Space>
                )
              }
            >
              <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24, color: TEXT_MUTED }}>
                {t("profile.profileDetailsDesc")}
              </Paragraph>

              {isEditing ? (
                <Form layout="vertical" form={form} initialValues={formValues}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label={t("profile.firstName")} name="firstName">
                        <Input
                          size="large"
                          value={formValues.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder={t("profile.enterFirstName")}
                          style={{ borderRadius: 12 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label={t("profile.lastName")} name="lastName">
                        <Input
                          size="large"
                          value={formValues.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder={t("profile.enterLastName")}
                          style={{ borderRadius: 12 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label={t("profile.email")} name="email">
                        <Input
                          size="large"
                          type="email"
                          value={formValues.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder={t("profile.enterEmail")}
                          style={{ borderRadius: 12 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label={t("profile.phone")} name="phone">
                        <Input
                          size="large"
                          value={formValues.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder={t("profile.enterPhone")}
                          style={{ borderRadius: 12 }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleImageChange}
                  >
                    <div
                      style={{
                        border: `2px dashed ${PRIMARY}40`,
                        borderRadius: 16,
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background: PRIMARY_SOFT,
                        transition: "all 0.2s",
                      }}
                    >
                      <Space size={16}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: `linear-gradient(135deg, #ff8ebb, ${PRIMARY})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                          }}
                        >
                          <Camera size={22} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: TEXT_DARK }}>
                            {t("profile.updatePhoto")}
                          </div>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {t("profile.updatePhotoDesc")}
                          </Text>
                        </div>
                      </Space>
                      <Button type="link" style={{ color: PRIMARY, fontWeight: 600 }}>
                        {t("profile.browseFiles")}
                      </Button>
                    </div>
                  </Upload>
                </Form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ProfileField label={t("profile.firstName")} value={profile?.firstName} icon={UserRound} />
                  <ProfileField label={t("profile.lastName")} value={profile?.lastName} icon={UserRound} />
                  <ProfileField label={t("profile.email")} value={profile?.email} icon={Mail} />
                  <ProfileField label={t("profile.phone")} value={profile?.phone} icon={Phone} />
                  <ProfileField label={t("profile.status")} icon={CheckCircle2}>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                      {profile?.status || "—"}
                    </span>
                  </ProfileField>
                  <ProfileField label={t("profile.role")} icon={Shield}>
                    <span className="inline-flex items-center rounded-full bg-[#fff0f6] px-3 py-1 text-xs font-bold text-[#ea4f93]">
                      {formatRoleLabel(profile?.role, t)}
                    </span>
                  </ProfileField>
                </div>
              )}
            </Card>

            {/* Operating hours */}
            <Card
              style={cardStyle}
              title={
                <Space>
                  <Clock3 size={20} color={PRIMARY} />
                  <span style={{ fontWeight: 800, color: TEXT_DARK }}>{t("profile.operatingHours")}</span>
                </Space>
              }
            >
              {salon?.operatingHours?.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {salon.operatingHours.map((slot, index) => (
                    <div
                      key={`${slot.dayOfWeek}-${slot.dayName}-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(243,213,226,0.5)",
                      }}
                    >
                      <Space>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: PRIMARY,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          }}
                        >
                          <Clock3 size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: TEXT_DARK }}>{slot.dayName}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {slot.isClosed
                              ? t("profile.closed")
                              : `${formatTimeValue(slot.openTime)} - ${formatTimeValue(slot.closeTime)}`}
                          </Text>
                        </div>
                      </Space>
                      <Tag color={slot.isClosed ? "purple" : "success"}>
                        {slot.isClosed ? t("profile.closed") : "Open"}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    border: "1px dashed #f5d7e5",
                    borderRadius: 14,
                    color: TEXT_MUTED,
                  }}
                >
                  {t("profile.noOperatingHours")}
                </div>
              )}
            </Card>
          </Col>

          {/* Right column */}
          <Col xs={24} xl={9}>
            {/* Salon assignment */}
            <Card
              style={{ ...cardStyle, marginBottom: 24 }}
              title={
                <Space>
                  <Building2 size={22} color={PRIMARY} />
                  <span style={{ fontWeight: 800, color: TEXT_DARK }}>{t("profile.salonAssignment")}</span>
                </Space>
              }
            >
              <Paragraph type="secondary" style={{ marginTop: -8, color: TEXT_MUTED }}>
                {t("profile.salonAssignmentDesc")}
              </Paragraph>

              {salon ? (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {salon.imageUrl && (
                    <div style={{ borderRadius: 16, overflow: "hidden", position: "relative" }}>
                      <img
                        src={salon.imageUrl}
                        alt={salon.name}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        style={{ width: "100%", height: 180, objectFit: "cover" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "16px 20px",
                          background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
                        }}
                      >
                        <Tag style={{ marginBottom: 4 }}>{t("profile.assignedBranch")}</Tag>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{salon.name}</div>
                      </div>
                    </div>
                  )}
                  <Descriptions column={1} size="small">
                    <Descriptions.Item
                      label={
                        <Space>
                          <Building2 size={14} /> {t("profile.salonName")}
                        </Space>
                      }
                    >
                      {salon.name}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <MapPin size={14} /> {t("profile.address")}
                        </Space>
                      }
                    >
                      {salon.address}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <Phone size={14} /> {t("profile.phone")}
                        </Space>
                      }
                    >
                      {salon.phone}
                    </Descriptions.Item>
                  </Descriptions>
                </Space>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 16px",
                    border: "2px dashed #f5d7e5",
                    borderRadius: 16,
                    background: PRIMARY_SOFT,
                  }}
                >
                  <Building2 size={32} color={PRIMARY} style={{ marginBottom: 12 }} />
                  <Title level={5} style={{ margin: 0, color: TEXT_DARK }}>
                    {t("profile.unassignedAccount")}
                  </Title>
                  <Text type="secondary">{t("profile.unassignedAccountDesc")}</Text>
                </div>
              )}
            </Card>

            {/* System actions */}
            <Card
              style={cardStyle}
              title={
                <Space>
                  <Shield size={20} color={PRIMARY} />
                  <span style={{ fontWeight: 800, color: TEXT_DARK }}>{t("profile.systemActions")}</span>
                </Space>
              }
            >
              <Paragraph type="secondary" style={{ marginTop: -8, color: TEXT_MUTED }}>
                {t("profile.systemActionsDesc")}
              </Paragraph>
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <Button
                  block
                  size="large"
                  icon={<Building2 size={16} />}
                  onClick={() => navigate(getDashboardRouteByRole(role))}
                  style={{ borderRadius: 14, height: 48 }}
                >
                  {t("profile.returnToDashboard")}
                </Button>
                <Button
                  block
                  size="large"
                  danger
                  type="primary"
                  icon={<Trash2 size={16} />}
                  loading={isDeactivating}
                  onClick={handleDeactivateAccount}
                  style={{ borderRadius: 14, height: 48 }}
                >
                  {isDeactivating ? t("profile.deactivating") : t("profile.deactivateAccount")}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Change Password Modal */}
      <Modal
        open={isChangePasswordOpen}
        title={
          <Space>
            <LockKeyhole size={22} color={PRIMARY} />
            <span>{language === "vi" ? "Đổi mật khẩu" : "Change Password"}</span>
          </Space>
        }
        onCancel={() => {
          setIsChangePasswordOpen(false);
          setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
          setPasswordError("");
        }}
        footer={null}
        centered
        destroyOnClose
        styles={{
          content: { borderRadius: 20 },
        }}
      >
        <Paragraph type="secondary" style={{ marginBottom: 20 }}>
          {language === "vi"
            ? "Nhập mật khẩu cũ, mật khẩu mới và xác nhận để cập nhật mật khẩu của bạn."
            : "Enter your old password, new password and confirm to update."}
        </Paragraph>

        {passwordError && (
          <Alert type="error" message={passwordError} showIcon style={{ marginBottom: 16, borderRadius: 12 }} />
        )}

        <Form layout="vertical">
          <Form.Item label={language === "vi" ? "Mật khẩu cũ" : "Old Password"} required>
            <Input.Password
              size="large"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm((c) => ({ ...c, oldPassword: e.target.value }))}
              placeholder={language === "vi" ? "Nhập mật khẩu cũ" : "Enter old password"}
              visibilityToggle={{
                visible: isOldPasswordVisible,
                onVisibleChange: setIsOldPasswordVisible,
              }}
              iconRender={(visible) => (visible ? <EyeOff size={16} /> : <Eye size={16} />)}
              style={{ borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item label={language === "vi" ? "Mật khẩu mới" : "New Password"} required>
            <Input.Password
              size="large"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))}
              placeholder={language === "vi" ? "Nhập mật khẩu mới" : "Enter new password"}
              visibilityToggle={{
                visible: isNewPasswordVisible,
                onVisibleChange: setIsNewPasswordVisible,
              }}
              iconRender={(visible) => (visible ? <EyeOff size={16} /> : <Eye size={16} />)}
              style={{ borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item label={language === "vi" ? "Xác nhận mật khẩu mới" : "Confirm New Password"} required>
            <Input.Password
              size="large"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((c) => ({ ...c, confirmPassword: e.target.value }))}
              placeholder={language === "vi" ? "Nhập lại mật khẩu mới" : "Re-enter new password"}
              visibilityToggle={{
                visible: isConfirmPasswordVisible,
                onVisibleChange: setIsConfirmPasswordVisible,
              }}
              iconRender={(visible) => (visible ? <EyeOff size={16} /> : <Eye size={16} />)}
              style={{ borderRadius: 12 }}
            />
          </Form.Item>
        </Form>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
          <Button
            onClick={() => {
              setIsChangePasswordOpen(false);
              setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
              setPasswordError("");
            }}
          >
            {language === "vi" ? "Hủy" : "Cancel"}
          </Button>
          <Button
            type="primary"
            loading={isResettingPassword}
            onClick={handleChangePassword}
            style={{
              background: `linear-gradient(90deg, #ff8ebb, ${PRIMARY})`,
              border: "none",
            }}
          >
            {isResettingPassword
              ? language === "vi"
                ? "Đang xử lý..."
                : "Processing..."
              : language === "vi"
                ? "Xác nhận đổi"
                : "Confirm Change"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}