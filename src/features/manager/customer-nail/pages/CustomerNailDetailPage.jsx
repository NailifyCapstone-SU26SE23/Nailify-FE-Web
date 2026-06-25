import { Spin, Alert, Modal, Input, message } from "antd";
import {
  Palette,
  Heart,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Image as ImageIcon,
  AlertTriangle,
  Mail,
  Phone,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchCustomerNailById, approveCustomerNail, fetchSalonStaff, assignReviewer, managerApproveQuote, managerReject } from "../services/customerNailsService";

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[18px] border border-[#f8deea] bg-white p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

function getStatusTone(status) {
  switch (status) {
    case "Approved":
    case "Reviewed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Rejected":
      return "bg-[#ffe6ec] text-[#e1447f]";
    case "Pending":
    case "PendingReview":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Draft":
      return "bg-[#f3f4f6] text-[#6b7280]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatVND(amount) {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDuration(duration) {
  if (duration === null || duration === undefined || duration === "") return "N/A";
  return `${duration} mins`;
}

function getStaffDisplayName(staff) {
  const fullName = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ").trim();
  return fullName || staff?.fullName || staff?.name || "Unknown Staff";
}

function getStaffInitials(staff) {
  return getStaffDisplayName(staff)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function InfoTile({ label, value, valueClassName = "text-[#3f2240]" }) {
  return (
    <div className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-[#fffafb] to-[#fff3f8] p-4 shadow-[0_8px_20px_rgba(236,72,153,0.04)]">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
        {label}
      </p>
      <p className={`text-sm font-semibold ${valueClassName}`}>{value || "N/A"}</p>
    </div>
  );
}

InfoTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  valueClassName: PropTypes.string,
};

function ActionButton({
  onClick,
  disabled,
  icon: Icon,
  children,
  className,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(236,72,153,0.18)] transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string.isRequired,
};

export function CustomerNailDetailPage() {
  const { customerNailId } = useParams();
  const navigate = useNavigate();
  const [nail, setNail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // 'auth', 'notfound', 'network', 'unknown'
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isAssignRequiredModalOpen, setIsAssignRequiredModalOpen] = useState(false);
  const [finalPrice, setFinalPrice] = useState('');
  const [finalDuration, setFinalDuration] = useState('');

  const loadCustomerNailDetail = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError("");
        setErrorType("");
      }

      console.log("[Page] Loading nail detail for ID:", customerNailId);
      const data = await fetchCustomerNailById(customerNailId);

      console.log("[Page] Successfully loaded:", data);
      setNail(data);

      // Nếu có approvedArtistId, fetch thông tin staff được assign
      if (data?.approvedArtistId) {
        try {
          const salonId = "484c3aef-3ae1-4ad6-8aba-6b0bc6df586d"; // TODO: Lấy từ context/param
          const staffList = await fetchSalonStaff(salonId);
          const assignedStaff = staffList.find(
            (staff) => staff.staffId === data.approvedArtistId
          );
          if (assignedStaff) {
            setNail((prev) => ({
              ...prev,
              assignedStaff: assignedStaff,
            }));
          }
        } catch (err) {
          console.error("[Page] Error loading assigned staff:", err);
          // Không throw error, chỉ log vì đây là optional
        }
      }
    } catch (err) {
      console.error("[Page] Error loading nail:", err);

      const errorMessage = err.message || "Failed to load customer nail detail.";

      // Determine error type for better UX
      if (
        errorMessage.includes("Token") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("đăng nhập")
      ) {
        setErrorType("auth");
        setError("Token không hợp lệ! Vui lòng đăng nhập lại.");
      } else if (errorMessage.includes("not found")) {
        setErrorType("notfound");
        setError(`Customer nail "${customerNailId}" không tồn tại.`);
      } else if (
        errorMessage.includes("connect") ||
        errorMessage.includes("network")
      ) {
        setErrorType("network");
        setError("Không thể kết nối đến server. Kiểm tra kết nối internet.");
      } else {
        setErrorType("unknown");
        setError(errorMessage);
      }
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [customerNailId]);

  useEffect(() => {
    if (customerNailId) {
      Promise.resolve().then(() => loadCustomerNailDetail());
    }
  }, [customerNailId, loadCustomerNailDetail]);

  useEffect(() => {
    if (!customerNailId) return undefined;

    const intervalId = window.setInterval(() => {
      loadCustomerNailDetail({ silent: true });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [customerNailId, loadCustomerNailDetail]);

  const handleApprove = async () => {
    if (!nail?.assignedStaff && !nail?.approvedArtistId) {
      setIsAssignRequiredModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await approveCustomerNail(customerNailId);
      message.success("Customer nail approved successfully!");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error approving nail:", err);
      message.error(err.message || "Failed to approve customer nail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAssignModal = async () => {
    try {
      setIsLoadingStaff(true);
      setIsAssignModalOpen(true);
      setSelectedStaff(null);
      const staff = await fetchSalonStaff("484c3aef-3ae1-4ad6-8aba-6b0bc6df586d");
      setStaffList(staff);
    } catch (err) {
      console.error("[Page] Error loading salon staff:", err);
      message.error(err.message || "Failed to load salon staff.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedStaff) {
      message.error("Please select a staff member.");
      return;
    }
    try {
      setIsSubmitting(true);
      await assignReviewer(customerNailId, selectedStaff.staffId);
      message.success("Staff assigned successfully!");
      setIsAssignModalOpen(false);
      setSelectedStaff(null);
      // Update nail object with assigned staff
      setNail((prev) => ({
        ...prev,
        status: "Assigned",
        assignedStaff: selectedStaff,
        approvedArtistId: selectedStaff.staffId,
      }));
    } catch (err) {
      console.error("[Page] Error assigning reviewer:", err);
      message.error(err.message || "Failed to assign staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerApproveQuote = async () => {
    if (!finalPrice) {
      message.error("Please enter a final price.");
      return;
    }
    try {
      setIsSubmitting(true);
      await managerApproveQuote(customerNailId, parseFloat(finalPrice), parseFloat(finalDuration) || 0);
      message.success("Quote approved successfully!");
      setIsApproveModalOpen(false);
      setFinalPrice("");
      setFinalDuration("");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error approving quote:", err);
      message.error(err.message || "Failed to approve quote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerReject = async () => {
    if (!rejectReason.trim()) {
      message.error("Please enter a reject reason.");
      return;
    }
    try {
      setIsSubmitting(true);
      await managerReject(customerNailId, rejectReason.trim());
      message.success("Customer nail rejected successfully!");
      setIsRejectModalOpen(false);
      setRejectReason("");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error rejecting customer nail:", err);
      message.error(err.message || "Failed to reject customer nail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error states
  if (error) {
    return (
      <div className="flex min-h-full flex-col gap-4">
        <button
          onClick={() => navigate(ROUTES.managerCustomerNails)}
          className="inline-flex items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] transition hover:bg-[#fff7fb] w-fit"
        >
          <ChevronLeft size={14} />
          Back to Customer Nails
        </button>

        <div className="min-h-full">
          <Alert
            message={
              errorType === "auth"
                ? "Session Expired"
                : errorType === "notfound"
                ? "Not Found"
                : errorType === "network"
                ? "Connection Error"
                : "Error Loading Customer Nail Detail"
            }
            description={error}
            type={
              errorType === "auth"
                ? "warning"
                : errorType === "network"
                ? "error"
                : "error"
            }
            showIcon
            icon={
              errorType === "auth" ? (
                <AlertTriangle size={20} />
              ) : undefined
            }
            action={
              errorType === "auth" ? (
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="text-xs font-semibold text-[#ea4f93] hover:underline"
                >
                  Go to Login
                </button>
              ) : (
                <button
                  onClick={loadCustomerNailDetail}
                  className="text-xs font-semibold text-[#ea4f93] hover:underline"
                >
                  Retry
                </button>
              )
            }
          />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spin size="large" tip="Loading customer nail detail..." />
      </div>
    );
  }

  // No data state
  if (!nail) {
    return (
      <div className="flex min-h-full flex-col gap-4">
        <button
          onClick={() => navigate(ROUTES.managerCustomerNails)}
          className="inline-flex items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] transition hover:bg-[#fff7fb] w-fit"
        >
          <ChevronLeft size={14} />
          Back to Customer Nails
        </button>

        <Alert
          message="No Data"
          description="Customer nail data is empty"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  const assignedStaffName = getStaffDisplayName(nail?.assignedStaff);
  const selectedStaffName = getStaffDisplayName(selectedStaff);

  return (
    <div className="flex min-h-full flex-col gap-5">
      {/* Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(ROUTES.managerCustomerNails)}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] transition hover:bg-[#fff7fb]"
        >
          <ChevronLeft size={14} />
          Back to Customer Nails
        </button>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${
          isRefreshing
            ? "bg-[#fff0f8] text-[#ea4f93]"
            : "bg-[#f8f4f7] text-[#9b7b8f]"
        }`}>
          <span className={`h-2.5 w-2.5 rounded-full ${isRefreshing ? "bg-[#ea4f93]" : "bg-[#d4b7c7]"}`} />
          {isRefreshing ? "Refreshing..." : "Auto refresh every 3s"}
        </div>
      </div>

      <Card className="p-0">
        {/* Header */}
        <div className="border-b border-[#f6dce7] bg-[linear-gradient(135deg,#fff0f8_0%,#fffafb_55%,#fff5fb_100%)] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {nail?.imageUrl ? (
                <img
                  src={nail.imageUrl}
                  alt={nail.name}
                  className="h-24 w-24 rounded-[24px] border-4 border-white object-cover shadow-[0_16px_32px_rgba(236,72,153,0.18)]"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#ff9ac2] via-[#ea4f93] to-[#c63d79] text-2xl font-black text-white shadow-[0_16px_32px_rgba(234,79,147,0.22)]">
                  <Palette size={34} />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-[#402542]">
                    {nail?.name || "Untitled Design"}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${getStatusTone(
                      nail?.status
                    )}`}
                  >
                    {nail?.status === "Approved" ? (
                      <CheckCircle2 size={14} />
                    ) : nail?.status === "Rejected" ? (
                      <XCircle size={14} />
                    ) : (
                      <Calendar size={14} />
                    )}
                    {nail?.status || "Draft"}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm text-[#9c6f87]">
                  Review custom design details, inspect the requested colors, assign a staff artist,
                  and complete manager actions from one place.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${nail?.basedOnNailVariantId !== null ? "bg-[#e7ecff] text-[#4755b8]" : "bg-[#fef3c7] text-[#d97706]"}`}>
                    {nail?.basedOnNailVariantId !== null ? "Preset" : "Custom Design"}
                  </span>
                  {nail?.isFavorite ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffe6f1] px-3 py-1.5 text-[11px] font-bold text-[#ea4f93]">
                      <Heart size={12} fill="currentColor" />
                      Favorite
                    </span>
                  ) : null}
                  {nail?.isPublic ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-3 py-1.5 text-[11px] font-bold text-[#6b7280]">
                      <Eye size={12} />
                      Public
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)] backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
                  Price
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#ea4f93]">
                  {formatVND(nail?.price)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)] backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
                  Duration
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#402542]">
                  {formatDuration(nail?.duration)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)] backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
                  Created
                </p>
                <p className="mt-1 text-sm font-bold text-[#402542]">
                  {formatDate(nail?.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <SectionHeading
              title="Design Information"
              subtitle="High-level summary of the requested customer nail design."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoTile label="Nail Shape" value={nail?.nailShape?.name || "Custom Shape"} />
              <InfoTile label="Nail Surface" value={nail?.nailSurface?.name || "Custom Surface"} />
              <InfoTile label="Price" value={formatVND(nail?.price)} valueClassName="text-[#ea4f93]" />
              <InfoTile label="Duration" value={formatDuration(nail?.duration)} />
            </div>
          </div>

          {/* Custom Color */}
          {nail?.customColor && (
            <div className="space-y-4">
              <SectionHeading
                title="Custom Color"
                subtitle="Preview the requested color configuration for this custom design."
              />
              <div className="rounded-[24px] border border-[#f4d6e4] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-5 shadow-[0_10px_26px_rgba(236,72,153,0.05)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  {(() => {
                    try {
                      const colorData =
                        typeof nail.customColor === "string"
                          ? JSON.parse(nail.customColor)
                          : nail.customColor;

                      if (colorData?.mode === "solid" && colorData?.color) {
                        return (
                          <>
                            <div
                              className="h-16 w-16 rounded-[18px] border-4 border-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                              style={{ backgroundColor: colorData.color }}
                            />
                            <div>
                              <p className="text-sm font-bold text-[#3f2240]">
                                Solid Color
                              </p>
                              <p className="mt-1 text-xs text-[#c08aa4]">
                                {colorData.color}
                              </p>
                            </div>
                          </>
                        );
                      } else if (
                        colorData?.mode === "gradient" &&
                        colorData?.gradient
                      ) {
                        return (
                          <>
                            <div
                              className="h-16 w-16 rounded-[18px] border-4 border-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                              style={{
                                background: `linear-gradient(to right, ${colorData.gradient.join(
                                  ", "
                                )})`,
                              }}
                            />
                            <div>
                              <p className="text-sm font-bold text-[#3f2240]">
                                Gradient Color
                              </p>
                              <p className="mt-1 text-xs text-[#c08aa4]">
                                {colorData.gradient.join(" → ")}
                              </p>
                            </div>
                          </>
                        );
                      } else if (
                        colorData?.mode === "perFinger" &&
                        Array.isArray(colorData?.fingers)
                      ) {
                        return (
                          <>
                            <div className="flex flex-wrap gap-3">
                              {colorData.fingers.map((finger, index) => (
                                <div key={finger.fingerIndex || index} className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/70 bg-white/70 p-2 shadow-[0_8px_18px_rgba(236,72,153,0.06)]">
                                  <div
                                    className="h-10 w-8 rounded-[10px] border-2 border-white shadow-md"
                                    style={{ backgroundColor: finger.color || "#ccc" }}
                                  />
                                  <span className="text-[10px] font-bold text-[#c08aa4]">
                                    {finger.fingerIndex}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#3f2240]">
                                Per-Finger Color
                              </p>
                              <p className="mt-1 text-xs text-[#c08aa4]">
                                {colorData.fingers.length} fingers
                              </p>
                            </div>
                          </>
                        );
                      }
                    } catch (e) {
                      console.error("Failed to parse custom color:", e);
                    }

                    return (
                      <div className="flex items-center gap-2 text-xs text-[#c08aa4]">
                        <ImageIcon size={12} />
                        <span>Color configuration unavailable</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Reject Reason */}
          {nail?.rejectReason && (
            <div className="space-y-4">
              <SectionHeading
                title="Reject Reason"
                subtitle="Latest manager feedback for this request."
              />
              <div className="rounded-[24px] border border-[#f4b8cb] bg-[linear-gradient(180deg,#fff1f5_0%,#ffe7ef_100%)] p-5 shadow-[0_10px_24px_rgba(225,68,127,0.08)]">
                <p className="text-sm text-[#e1447f]">{nail.rejectReason}</p>
              </div>
            </div>
          )}

          {/* Approve/Reject Buttons - Only show when status is PendingReview */}
          {nail?.status === "PendingReview" && (
            <div className="space-y-4">
              <SectionHeading
                title="Review Actions"
                subtitle="Approve the submission or reject it with a clear reason."
              />
              <div className="rounded-[24px] border border-[#f4d6e4] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-5">
                <div className="flex flex-col gap-3 md:flex-row">
                  <ActionButton
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  icon={CheckCircle2}
                  className="flex-1 bg-[#2fa25f] hover:bg-[#2a9255]"
                  >
                    Approve
                  </ActionButton>
                  <ActionButton
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isSubmitting}
                  icon={XCircle}
                  className="flex-1 bg-[#e1447f] hover:bg-[#d63e75]"
                  >
                    Reject
                  </ActionButton>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Staff Info - Show if staff already assigned */}
          {nail?.status === "Assigned" && nail?.assignedStaff && (
            <div className="space-y-4">
              <SectionHeading
                title="Assigned Staff"
                subtitle="Current artist or reviewer handling this customer nail request."
              />
              <div className="rounded-[24px] border border-[#caecd5] bg-[linear-gradient(180deg,#f3fff7_0%,#eaf9ee_100%)] p-5 shadow-[0_10px_24px_rgba(47,162,95,0.08)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8bd5a8] to-[#2fa25f] text-lg font-bold text-white shadow-[0_10px_20px_rgba(47,162,95,0.18)]">
                      {getStaffInitials(nail.assignedStaff)}
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-[#246c48]">
                        {assignedStaffName}
                      </p>
                      <p className="mt-1 text-sm text-[#3b8d5f]">
                        {nail.assignedStaff.role || "Staff Artist"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoTile
                      label="Email"
                      value={nail.assignedStaff.email || "N/A"}
                      valueClassName="text-[#246c48]"
                    />
                    <InfoTile
                      label="Phone"
                      value={nail.assignedStaff.phone || nail.assignedStaff.phoneNumber || "N/A"}
                      valueClassName="text-[#246c48]"
                    />
                    <InfoTile
                      label="Staff ID"
                      value={nail.assignedStaff.staffId || nail.assignedStaff.id || "N/A"}
                      valueClassName="text-[#246c48]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assign Staff Button - Only show if status is PendingReview and no staff assigned */}
          {nail?.status === "PendingReview" && !nail?.assignedStaff && (
            <div className="space-y-4">
              <SectionHeading
                title="Assign Staff"
                subtitle="Choose a staff artist so the review can continue with the right owner."
              />
              <div className="rounded-[24px] border border-[#f4d6e4] bg-[linear-gradient(180deg,#fffafb_0%,#fff6fa_100%)] p-5">
                <ActionButton
                onClick={handleOpenAssignModal}
                disabled={isSubmitting}
                icon={UserRound}
                className="w-fit bg-[#ea4f93] hover:bg-[#df4588]"
                >
                  Assign Staff
                </ActionButton>
              </div>
            </div>
          )}

          {/* Confirm/Reject Buttons - Only show when status is Reviewed */}
          {nail?.status === "Reviewed" && (
            <div className="space-y-4">
              <SectionHeading
                title="Review Actions"
                subtitle="Finalize the quoted design by confirming or rejecting it."
              />
              <div className="rounded-[24px] border border-[#f4d6e4] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-5">
                <div className="flex flex-col gap-3 md:flex-row">
                  <ActionButton
                  onClick={() => setIsApproveModalOpen(true)}
                  disabled={isSubmitting}
                  icon={CheckCircle2}
                  className="flex-1 bg-[#2fa25f] hover:bg-[#2a9255]"
                  >
                    Confirm
                  </ActionButton>
                  <ActionButton
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isSubmitting}
                  icon={XCircle}
                  className="flex-1 bg-[#e1447f] hover:bg-[#d63e75]"
                  >
                    Reject
                  </ActionButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        title={null}
        open={isRejectModalOpen}
        onOk={handleManagerReject}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectReason("");
        }}
        confirmLoading={isSubmitting}
        okText="Reject"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: "#e1447f", color: "#fff", borderRadius: 9999, fontWeight: 700 } }}
        cancelButtonProps={{ style: { borderRadius: 9999, fontWeight: 700 } }}
        centered
        destroyOnClose
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "hidden" },
          body: { padding: 0 },
          mask: { backdropFilter: "blur(6px)" },
        }}
      >
        <div className="bg-[linear-gradient(135deg,#fff0f5_0%,#ffe7ef_100%)] px-6 pb-10 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e1447f] text-white">
              <XCircle size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#402542]">Reject Customer Nail</h3>
              <p className="mt-1 text-sm text-[#b35f82]">
                Give the customer a clear reason so the next revision is easier to handle.
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-6 space-y-4 rounded-[28px] bg-white px-6 pb-6 pt-6">
          <div className="rounded-2xl border border-[#f7d8e4] bg-[#fffafb] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
              Reject Reason
            </p>
            <p className="mb-3 text-sm text-[#6f5568]">
              Explain what needs to be adjusted before this request can move forward.
            </p>
          </div>
          <Input.TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reject reason"
            rows={5}
            className="mt-2"
          />
        </div>
      </Modal>

      {/* Approve Quote Modal */}
      <Modal
        title={null}
        open={isApproveModalOpen}
        onOk={handleManagerApproveQuote}
        onCancel={() => {
          setIsApproveModalOpen(false);
          setFinalPrice("");
          setFinalDuration("");
        }}
        confirmLoading={isSubmitting}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: "#2fa25f", color: "#fff", borderRadius: 9999, fontWeight: 700 } }}
        cancelButtonProps={{ style: { borderRadius: 9999, fontWeight: 700 } }}
        centered
        destroyOnClose
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "hidden" },
          body: { padding: 0 },
          mask: { backdropFilter: "blur(6px)" },
        }}
      >
        <div className="bg-[linear-gradient(135deg,#eefbf2_0%,#e6f8ec_100%)] px-6 pb-10 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2fa25f] text-white">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#31543f]">Confirm Quote</h3>
              <p className="mt-1 text-sm text-[#5d8b70]">
                Enter the final approved quote details for this custom design.
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-6 space-y-4 rounded-[28px] bg-white px-6 pb-6 pt-6">
          <div className="rounded-2xl border border-[#d8efdf] bg-[#f8fffa] p-4">
            <p className="text-sm text-[#496455]">
              Provide the final price and expected duration that the customer will see.
            </p>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">
              Final Price
            </p>
            <Input
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder="Enter final price"
            />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">
              Final Duration (minutes)
            </p>
            <Input
              type="number"
              value={finalDuration}
              onChange={(e) => setFinalDuration(e.target.value)}
              placeholder="Enter final duration"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={null}
        open={isAssignRequiredModalOpen}
        footer={null}
        centered
        destroyOnClose
        onCancel={() => setIsAssignRequiredModalOpen(false)}
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "hidden" },
          body: { padding: 0 },
          mask: { backdropFilter: "blur(6px)" },
        }}
      >
        <div className="bg-[linear-gradient(135deg,#fff8ec_0%,#fff0dd_100%)] px-6 pb-10 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#db8520] text-white">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#5a3821]">Assign Staff First</h3>
              <p className="mt-1 text-sm text-[#9a6a40]">
                You need to assign a staff artist before approving this customer nail request.
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-6 rounded-[28px] bg-white px-6 pb-6 pt-6">
          <div className="rounded-2xl border border-[#f5ddbd] bg-[#fffaf2] p-4">
            <p className="text-sm text-[#6f5568]">
              Please assign the appropriate staff artist so the request can be reviewed and handled correctly.
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsAssignRequiredModalOpen(false)}
              className="flex-1 rounded-full border border-[#f4c1d8] bg-white px-5 py-3 text-sm font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAssignRequiredModalOpen(false);
                handleOpenAssignModal();
              }}
              className="flex-1 rounded-full bg-[#ea4f93] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.18)] transition hover:bg-[#df4588]"
            >
              Assign Staff Now
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        title={null}
        open={isAssignModalOpen}
        onOk={handleAssignReviewer}
        onCancel={() => {
          setIsAssignModalOpen(false);
          setSelectedStaff(null);
        }}
        confirmLoading={isSubmitting}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{
          style: { backgroundColor: "#ea4f93", color: "#fff", borderRadius: 9999, fontWeight: 700 },
          disabled: !selectedStaff,
        }}
        cancelButtonProps={{ style: { borderRadius: 9999, fontWeight: 700 } }}
        width={760}
        centered
        destroyOnClose
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "hidden" },
          body: { padding: 0 },
          mask: { backdropFilter: "blur(6px)" },
        }}
      >
        <div className="bg-[linear-gradient(135deg,#fff0f8_0%,#fff5fb_100%)] px-6 pb-10 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ea4f93] text-white">
              <UserRound size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#402542]">Assign Staff Artist</h3>
              <p className="mt-1 text-sm text-[#b06484]">
                Choose the best staff artist to take ownership of this request.
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-6 rounded-[28px] bg-white px-6 pb-6 pt-6">
          <div className="mb-4 rounded-2xl border border-[#f6d8e6] bg-[#fffafb] p-4">
            <p className="text-sm text-[#6f5568]">
              Browse the available staff below. The selected profile will be assigned immediately
              after confirmation.
            </p>
            {selectedStaff ? (
              <p className="mt-2 text-sm font-semibold text-[#ea4f93]">
                Selected: {selectedStaffName}
              </p>
            ) : null}
          </div>
          {isLoadingStaff ? (
            <div className="flex items-center justify-center py-8">
              <Spin tip="Loading staff..." />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {staffList.length === 0 ? (
                <p className="text-sm text-[#c08aa4]">No staff available.</p>
              ) : (
                staffList.map((staff) => (
                  <div
                    key={staff.staffId}
                    onClick={() => setSelectedStaff(staff)}
                    className={`cursor-pointer rounded-[24px] border p-4 transition ${
                      selectedStaff?.staffId === staff.staffId
                        ? "border-[#ea4f93] bg-[linear-gradient(180deg,#fff0f8_0%,#fff7fb_100%)] shadow-[0_14px_28px_rgba(234,79,147,0.12)]"
                        : "border-[#f4c7da] bg-white hover:border-[#ea4f93] hover:shadow-[0_12px_24px_rgba(236,72,153,0.08)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        selectedStaff?.staffId === staff.staffId
                          ? "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]"
                          : "bg-gradient-to-br from-[#d8c4ff] to-[#8b5cf6]"
                      }`}>
                        {getStaffInitials(staff)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-extrabold text-[#3f2240]">
                            {getStaffDisplayName(staff)}
                          </p>
                          {staff.role ? (
                            <span className="inline-flex rounded-full bg-[#fce7f3] px-2.5 py-1 text-[10px] font-bold text-[#ea4f93]">
                              {staff.role}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                            <Mail size={12} className="text-[#c08aa4]" />
                            <span>{staff.email || "No email"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                            <Phone size={12} className="text-[#c08aa4]" />
                            <span>{staff.phone || staff.phoneNumber || "No phone"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                            <BriefcaseBusiness size={12} className="text-[#c08aa4]" />
                            <span>{staff.specialty || staff.role || "Staff Artist"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                            <UserRound size={12} className="text-[#c08aa4]" />
                            <span>ID: {staff.staffId || staff.id || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
