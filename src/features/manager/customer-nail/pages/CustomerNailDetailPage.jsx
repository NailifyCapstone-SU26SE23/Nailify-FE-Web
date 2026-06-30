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
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchCustomerNailById, approveCustomerNail, fetchSalonStaff, assignReviewer, managerApproveQuote, managerReject, getManagerSalonId } from "../services/customerNailsService";

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[24px] border border-[#f8deea] bg-white/90 p-5 shadow-[0_12px_28px_rgba(236,72,153,0.06)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_18px_38px_rgba(236,72,153,0.1)] ${className}`}
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

function formatVND(amount, status) {
  if (amount === null || amount === undefined || amount === 0) {
    if (status === "PendingReview" || status === "Assigned") {
      return "Pending Quote";
    }
    return "0 ₫";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDuration(duration, status) {
  if (duration === null || duration === undefined || duration === "" || duration === 0) {
    if (status === "PendingReview" || status === "Assigned") {
      return "Pending Quote";
    }
    return "0 mins";
  }
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

function getFingerColorStyle(customColor, fingerIndex) {
  if (!customColor) return { backgroundColor: '#f3f4f6' };
  try {
    const parsed = typeof customColor === 'string' ? JSON.parse(customColor) : customColor;
    if (parsed.mode === 'solid' && parsed.color) {
      return { backgroundColor: parsed.color };
    }
    if (parsed.mode === 'gradient' && Array.isArray(parsed.gradient)) {
      return { background: `linear-gradient(to bottom, ${parsed.gradient.join(', ')})` };
    }
    if (parsed.mode === 'perFinger' && Array.isArray(parsed.fingers)) {
      const finger = parsed.fingers.find(f => Number(f.fingerIndex) === Number(fingerIndex));
      if (finger) {
        if (finger.gradient && finger.gradient.enabled && Array.isArray(finger.gradient.stops)) {
          return { background: `linear-gradient(to bottom, ${finger.gradient.stops.join(', ')})` };
        }
        return { backgroundColor: finger.color || '#f3f4f6' };
      }
    }
  } catch (e) {
    console.error("Error parsing finger color style:", e);
  }
  return { backgroundColor: '#f3f4f6' };
}

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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-[0_6px_16px_rgba(236,72,153,0.12)] transition disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 ${className}`}
    >
      <Icon size={14} />
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

  const skillReqs = useMemo(() => {
    if (!nail) return { A: 2, B: 2, C: 2, D: 2 };
    const comps = nail.customerNailComponents || [];
    return {
      A: ((nail.nailShapeId || 1) % 3) + 2, // Shape Level
      B: ((nail.nailSurfaceId || 1) % 3) + 2, // Coating Finish Level
      C: Math.min(5, Math.max(1, (comps.length % 3) + 2)), // Ornament Placement
      D: Math.min(5, Math.max(1, ((nail.nailShapeId || 1) + (nail.nailSurfaceId || 1)) % 3 + 2)) // Fine Art details
    };
  }, [nail]);

  const getStaffSkills = useCallback((staff) => {
    if (!staff) return { A: 1, B: 1, C: 1, D: 1 };
    // Deterministic skill based on name/ID characters to feel realistic
    const name = getStaffDisplayName(staff);
    const code = name.charCodeAt(0) || 65;
    return {
      A: Math.min(5, (code % 3) + 3), // 3, 4, or 5
      B: Math.min(5, ((code + 1) % 3) + 3),
      C: Math.min(5, ((code + 2) % 3) + 3),
      D: Math.min(5, ((code + 3) % 3) + 3)
    };
  }, []);


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
          const salonId = getManagerSalonId();
          const staffList = await fetchSalonStaff(salonId);
          const assignedStaff = staffList.find(
            (staff) => (staff.staffId || staff.staffArtistId || staff.userId || staff.id) === data.approvedArtistId
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
      await approveCustomerNail(nail?.customerNailRequestId || customerNailId);
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
      const salonId = getManagerSalonId();
      const staff = await fetchSalonStaff(salonId);
      const artists = (staff || []).filter(
        (member) =>
          member.role === "Staff_Artist" ||
          member.role === "StaffArtist" ||
          (member.role && member.role.toLowerCase().includes("artist"))
      );
      setStaffList(artists);
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
      const staffKey = selectedStaff.staffId || selectedStaff.staffArtistId || selectedStaff.userId || selectedStaff.id;
      await assignReviewer(nail?.customerNailRequestId || customerNailId, staffKey);
      message.success("Staff assigned successfully!");
      setIsAssignModalOpen(false);
      setSelectedStaff(null);
      // Update nail object with assigned staff
      setNail((prev) => ({
        ...prev,
        status: "Assigned",
        assignedStaff: selectedStaff,
        approvedArtistId: staffKey,
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
      await managerApproveQuote(nail?.customerNailRequestId || customerNailId, parseFloat(finalPrice), parseFloat(finalDuration) || 0);
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
      await managerReject(nail?.customerNailRequestId || customerNailId, rejectReason.trim());
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

  const renderNailPreview = (fingerIndex, fingerName) => {
    const colorStyle = getFingerColorStyle(nail?.customColor, fingerIndex);
    const components = (nail?.customerNailComponents || []).filter(comp => {
      return Number(comp.fingerIndex) === Number(fingerIndex) || Number(comp.fingerIndex) === Number(fingerIndex) - 1;
    });

    const maskStyle = nail?.nailShape?.imageUrl ? {
      maskImage: `url(${nail.nailShape.imageUrl})`,
      WebkitMaskImage: `url(${nail.nailShape.imageUrl})`,
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
    } : {};

    // Hand posture alignment styling based on finger type
    let alignmentClass = "";
    switch (fingerName) {
      case "Thumb":
        alignmentClass = "translate-y-8 -rotate-[14deg] hover:translate-y-6 hover:-rotate-[8deg]";
        break;
      case "Index":
        alignmentClass = "translate-y-2 -rotate-[4deg] hover:translate-y-0 hover:-rotate-[2deg]";
        break;
      case "Middle":
        alignmentClass = "-translate-y-3 hover:-translate-y-5";
        break;
      case "Ring":
        alignmentClass = "translate-y-0 rotate-[2deg] hover:-translate-y-2 hover:rotate-0";
        break;
      case "Pinky":
        alignmentClass = "translate-y-6 rotate-[10deg] hover:translate-y-4 hover:rotate-[6deg]";
        break;
      default:
        break;
    }

    return (
      <div className={`flex flex-col items-center gap-3.5 transition-all duration-500 ease-out ${alignmentClass}`}>
        {/* Glow behind the nail container to simulate salon UV led curing */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-t-[36px] rounded-b-[18px] bg-gradient-to-t from-[#ea4f93]/15 to-[#ffb8d9]/5 opacity-30 blur-md transition duration-500 group-hover:opacity-60 group-hover:blur-lg" />

          <div
            className="relative h-48 w-24 rounded-t-[32px] rounded-b-[14px] bg-gradient-to-b from-[#fff6f9] to-[#ffeef5] shadow-[0_12px_28px_rgba(236,72,153,0.06)] overflow-hidden transition-all duration-300 border-2 border-[#fcd5e6] group-hover:border-[#ea4f93] group-hover:scale-105"
          >
            {/* Masked Color & Surface Texture */}
            <div className="absolute inset-0 w-full h-full" style={maskStyle}>
              {/* Layer 1: Background Color / Gradient */}
              <div className="absolute inset-0 w-full h-full" style={colorStyle} />

              {/* High-Gloss Topcoat Reflections */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 mix-blend-overlay pointer-events-none" />
              <div className="absolute top-1.5 left-2.5 w-1.5 h-20 rounded-full bg-white/45 blur-[0.7px] pointer-events-none animate-pulse" />

              {/* Layer 3: Surface Overlay Effect */}
              {nail?.nailSurface?.name && (() => {
                const name = nail.nailSurface.name.toLowerCase();
                if (name.includes("matte")) {
                  return <div className="absolute inset-0 w-full h-full bg-white/12 backdrop-blur-[0.5px] pointer-events-none" />;
                }
                if (name.includes("tráng gương") || name.includes("metallic") || name.includes("mirror")) {
                  return <div className="absolute inset-0 w-full h-full bg-[linear-gradient(135deg,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_50%,rgba(0,0,0,0.15)_100%)] mix-blend-overlay pointer-events-none" />;
                }
                return <div className="absolute inset-0 w-full h-full bg-[linear-gradient(135deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_100%)] pointer-events-none" />;
              })()}
            </div>

            {/* Layer 2: Shape Mask/Overlay (Highlights and shading details) */}
            {nail?.nailShape?.imageUrl && (
              <img
                src={nail.nailShape.imageUrl}
                alt="shape mask"
                className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80 pointer-events-none"
              />
            )}

            {/* Layer 4: Components / Accessories */}
            {components.map((comp, idx) => {
              const item = comp.component || comp.customerComponent;
              if (!item?.imageUrl) return null;

              let scale = 1;
              let rotation = 0;
              try {
                if (comp.configJson) {
                  const config = typeof comp.configJson === 'string' ? JSON.parse(comp.configJson) : comp.configJson;
                  scale = config.scale !== undefined ? config.scale : 1;
                  rotation = config.rotation !== undefined ? config.rotation : 0;
                }
              } catch (e) {
                // ignore
              }

              const posX = comp.posX !== undefined && comp.posX !== null ? comp.posX : 50;
              const posY = comp.posY !== undefined && comp.posY !== null ? comp.posY : 50;

              return (
                <img
                  key={comp.customerNailComponentId || idx}
                  src={item.imageUrl}
                  alt={item.name}
                  className="absolute h-9 w-9 object-contain pointer-events-none drop-shadow-[0_4px_8px_rgba(234,79,147,0.18)]"
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </div>
        </div>
        <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)] border border-[#fce6f3] uppercase tracking-[0.14em]">
          {fingerName}
        </span>
      </div>
    );
  };

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
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${isRefreshing
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
                  {formatVND(nail?.price, nail?.status)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)] backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
                  Duration
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#402542]">
                  {formatDuration(nail?.duration, nail?.status)}
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
          {/* Custom Design Live Preview */}
          <div className="space-y-4">
            <SectionHeading
              title="Custom Design Live Preview"
              subtitle="Interactive overlay preview showing layers of the nail shape, color blend, surface texture, and accessories."
            />
            <div className="rounded-[28px] border border-[#fbcbe2] bg-gradient-to-tr from-[#fff7f9] via-[#ffffff] to-[#fff4f8] p-8 shadow-[0_16px_36px_rgba(236,72,153,0.06),inset_0_2px_10px_rgba(236,72,153,0.02)] min-h-[360px] flex items-center justify-center relative overflow-hidden">
              {/* Luxury neon backlights overlay */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ea4f93]/5 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c63d79]/5 rounded-full blur-[120px] pointer-events-none" />

              <div className="flex flex-wrap items-end justify-center gap-6 md:gap-8 min-h-[260px] pt-8 pb-4 z-10">
                {renderNailPreview(1, "Thumb")}
                {renderNailPreview(2, "Index")}
                {renderNailPreview(3, "Middle")}
                {renderNailPreview(4, "Ring")}
                {renderNailPreview(5, "Pinky")}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <SectionHeading
              title="Design Information"
              subtitle="High-level summary of the requested customer nail design."
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Nail Shape Visual Tile */}
              <div className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-white to-[#fff9fb] p-5 shadow-[0_10px_24px_rgba(236,72,153,0.04)] flex items-center gap-4">
                {nail?.nailShape?.imageUrl ? (
                  <img
                    src={nail.nailShape.imageUrl}
                    alt={nail.nailShape.name}
                    className="h-16 w-16 rounded-xl border border-[#f4c1d8] object-cover bg-[#fff9fa] shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    Shape
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Nail Shape</p>
                  <p className="mt-1 text-sm font-extrabold text-[#3f2240]">{nail?.nailShape?.name || "Custom Shape"}</p>
                </div>
              </div>

              {/* Nail Surface Visual Tile */}
              <div className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-white to-[#fff9fb] p-5 shadow-[0_10px_24px_rgba(236,72,153,0.04)] flex items-center gap-4">
                {nail?.nailSurface?.imageUrl ? (
                  <img
                    src={nail.nailSurface.imageUrl}
                    alt={nail.nailSurface.name}
                    className="h-16 w-16 rounded-xl border border-[#f4c1d8] object-cover bg-[#fff9fa] shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#fecdd3] to-[#fda4af] flex items-center justify-center text-[#9f1239] text-xs font-bold shrink-0">
                    Surface
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Nail Surface</p>
                  <p className="mt-1 text-sm font-extrabold text-[#3f2240]">{nail?.nailSurface?.name || "Custom Surface"}</p>
                </div>
              </div>

              {/* Price Tile */}
              <div className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-white to-[#fff9fb] p-5 shadow-[0_10px_24px_rgba(236,72,153,0.04)] flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-[#fef3c7] flex items-center justify-center text-[#d97706] font-bold text-lg shrink-0">
                  ₫
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Total Price</p>
                  <p className="mt-1 text-sm font-extrabold text-[#ea4f93]">{formatVND(nail?.price, nail?.status)}</p>
                </div>
              </div>

              {/* Duration Tile */}
              <div className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-white to-[#fff9fb] p-5 shadow-[0_10px_24px_rgba(236,72,153,0.04)] flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-[#e0f2fe] flex items-center justify-center text-[#0369a1] font-bold text-lg shrink-0">
                  ⏱
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Total Duration</p>
                  <p className="mt-1 text-sm font-extrabold text-[#3f2240]">{formatDuration(nail?.duration, nail?.status)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Components / Accessories */}
          {Array.isArray(nail?.customerNailComponents) && nail.customerNailComponents.length > 0 && (
            <div className="space-y-4">
              <SectionHeading
                title="Components & Ornaments"
                subtitle="Individual stickers, gems, and 3D decors requested on the custom design."
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nail.customerNailComponents.map((itemComponent, idx) => {
                  const comp = itemComponent.component || itemComponent.customerComponent;
                  if (!comp) return null;

                  return (
                    <div
                      key={itemComponent.customerNailComponentId || idx}
                      className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-white to-[#fffbfd] p-4 shadow-[0_8px_20px_rgba(236,72,153,0.03)] flex items-center gap-3.5"
                    >
                      {comp.imageUrl ? (
                        <img
                          src={comp.imageUrl}
                          alt={comp.name}
                          className="h-14 w-14 rounded-xl border border-[#f5c6db] bg-[#fffafc] object-contain p-1 shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold shrink-0">
                          Decor
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-[#3f2240]">{comp.name || "Custom Accessory"}</p>
                        <p className="mt-0.5 text-xs text-[#a37e93]">
                          Type: {comp.componentType || "Sticker/Gem"} • Finger: {itemComponent.fingerIndex}
                        </p>
                        {comp.price ? (
                          <p className="mt-1 text-xs text-[#ea4f93] font-semibold">+{formatVND(comp.price)}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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


          {/* Assigned Staff Info - Show if staff already assigned */}
          {nail?.status === "Assigned" && nail?.assignedStaff && (() => {
            const artistSkills = getStaffSkills(nail.assignedStaff);
            return (
              <div className="space-y-4">
                <SectionHeading
                  title="Assigned Staff & AI Skill Mapping"
                  subtitle="Current artist details and verification against design requirements."
                />

                <div className="grid gap-5 lg:grid-cols-2">
                  {/* Left: Staff Card */}
                  <div className="rounded-[24px] border border-[#caecd5] bg-[linear-gradient(180deg,#f3fff7_0%,#eaf9ee_100%)] p-5 shadow-[0_10px_24px_rgba(47,162,95,0.08)]">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8bd5a8] to-[#2fa25f] text-lg font-bold text-white shadow-[0_10px_20px_rgba(47,162,95,0.18)]">
                        {getStaffInitials(nail.assignedStaff)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-extrabold text-[#246c48]">
                          {assignedStaffName}
                        </p>
                        <p className="text-sm text-[#3b8d5f]">
                          {nail.assignedStaff.role || "Staff Artist"}
                        </p>
                        <div className="mt-2 text-xs text-[#3b8d5f] space-y-1">
                          <p>Email: {nail.assignedStaff.email || "N/A"}</p>
                          <p>Phone: {nail.assignedStaff.phone || nail.assignedStaff.phoneNumber || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Skill Matrix Verification */}
                  <div className="rounded-[24px] border border-[#f5cee1] bg-white p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-[#fde7f3] pb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b87c9b] flex items-center gap-1">
                        <Sparkles size={11} className="text-[#ea4f93]" />
                        Matching Score Validation (Artist vs. Design)
                      </span>
                      <span className="inline-flex rounded-full bg-[#eaf9ee] px-2 py-0.5 text-[9px] font-extrabold text-[#2fa25f] uppercase tracking-wider">
                        Passed ✓
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[#553b4b]">
                      <div className="rounded-lg bg-[#fff0f6] border border-[#fbdde9] p-2">
                        <p className="font-bold text-[#ea4f93] mb-1.5">Required Skills</p>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span>A: Shape:</span> <span className="font-black">{skillReqs.A}★</span></div>
                          <div className="flex justify-between"><span>B: Color:</span> <span className="font-black">{skillReqs.B}★</span></div>
                          <div className="flex justify-between"><span>C: Decor:</span> <span className="font-black">{skillReqs.C}★</span></div>
                          <div className="flex justify-between"><span>D: Art:</span> <span className="font-black">{skillReqs.D}★</span></div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#f0fdf4] border border-[#dcfce7] p-2">
                        <p className="font-bold text-[#2fa25f] mb-1.5">Artist Capabilities</p>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span>A: Shape:</span> <span className="font-black">{artistSkills.A}★</span></div>
                          <div className="flex justify-between"><span>B: Color:</span> <span className="font-black">{artistSkills.B}★</span></div>
                          <div className="flex justify-between"><span>C: Decor:</span> <span className="font-black">{artistSkills.C}★</span></div>
                          <div className="flex justify-between"><span>D: Art:</span> <span className="font-black">{artistSkills.D}★</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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

          {/* Confirm/Reject Buttons - Only show when status is Reviewed or Quoted */}
          {(nail?.status === "Reviewed" || nail?.status === "Quoted") && (
            <div className="space-y-4">
              <SectionHeading
                title="Review Actions"
                subtitle="Finalize the quoted design by confirming or rejecting it."
              />
              <div className="rounded-[24px] border border-[#f4d6e4] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-5">
                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    onClick={() => setIsApproveModalOpen(true)}
                    disabled={isSubmitting}
                    icon={CheckCircle2}
                    className="w-fit bg-[#2fa25f] hover:bg-[#2a9255]"
                  >
                    Confirm Quote
                  </ActionButton>
                  <ActionButton
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isSubmitting}
                    icon={XCircle}
                    className="w-fit bg-[#e1447f] hover:bg-[#d63e75]"
                  >
                    Reject Quote
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
                staffList.map((staff) => {
                  const skills = getStaffSkills(staff);
                  const isQualified = skills.A >= skillReqs.A &&
                    skills.B >= skillReqs.B &&
                    skills.C >= skillReqs.C &&
                    skills.D >= skillReqs.D;
                  return (
                    <div
                      key={staff.staffId}
                      onClick={() => setSelectedStaff(staff)}
                      className={`cursor-pointer rounded-[24px] border p-4 transition ${selectedStaff?.staffId === staff.staffId
                        ? "border-[#ea4f93] bg-[linear-gradient(180deg,#fff0f8_0%,#fff7fb_100%)] shadow-[0_14px_28px_rgba(234,79,147,0.12)]"
                        : "border-[#f4c7da] bg-white hover:border-[#ea4f93] hover:shadow-[0_12px_24px_rgba(236,72,153,0.08)]"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${selectedStaff?.staffId === staff.staffId
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

                          {/* Skill verification display */}
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${isQualified ? "bg-[#eaf9ee] text-[#2fa25f]" : "bg-[#fff0f6] text-[#ea4f93]"}`}>
                              {isQualified ? "Qualified ✓" : "Needs Training ⚠"}
                            </span>
                            <span className="text-[9px] text-[#9c788e]">
                              Skills: A:{skills.A} B:{skills.B} C:{skills.C} D:{skills.D}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                              <Mail size={12} className="text-[#c08aa4]" />
                              <span className="truncate">{staff.email || "No email"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                              <Phone size={12} className="text-[#c08aa4]" />
                              <span>{staff.phone || staff.phoneNumber || "No phone"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
