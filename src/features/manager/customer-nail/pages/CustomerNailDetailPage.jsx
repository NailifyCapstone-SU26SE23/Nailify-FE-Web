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
  UserPlus,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchCustomerNailById, fetchSalonStaff, assignReviewer, managerApproveQuote, managerReject, getManagerSalonId } from "../services/customerNailsService";
import { fetchNailArtistSkills } from "../../staff-artist-management/services/nailArtistsService";
import { ProcedureBuilderSection } from "../../../staff/customer-nail/components/ProcedureBuilderSection";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { fetchUserById } from "../../bookings/services/bookingsService";


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
      <h3 className="text-lg font-serif font-bold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#a988a0]">{subtitle}</p> : null}
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

// 🎨 Parse & render surface effects from config JSON (Backend format)
function renderSurfaceEffects(surfaceName, effectsConfigJson) {
  const name = (surfaceName || "glossy").toLowerCase();

  let config = {};
  try {
    config = typeof effectsConfigJson === 'string'
      ? JSON.parse(effectsConfigJson)
      : effectsConfigJson || {};
  } catch (e) {
    config = {};
  }

  // 🪞 CHROME - Ultra metallic mirror
  if (name.includes("chrome") || name.includes("mirror") || name.includes("tráng gương")) {
    const reflectivity = config.reflectivity || 0.9;
    const metallic = config.metallic || 1.0;
    return (
      <>
        {/* Silver metallic base sheen */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: `linear-gradient(135deg, rgba(255,255,255,${metallic * 0.7}) 0%, rgba(200,210,220,${metallic * 0.4}) 35%, rgba(80,90,100,${metallic * 0.35}) 65%, rgba(255,255,255,${metallic * 0.6}) 100%)`,
        }} />
        {/* Primary chrome streak */}
        <div className="pointer-events-none absolute" style={{
          top: '5%', left: '15%', width: '30%', height: '65%',
          background: `linear-gradient(to bottom, rgba(255,255,255,${reflectivity}) 0%, rgba(255,255,255,${reflectivity * 0.5}) 50%, transparent 100%)`,
          filter: 'blur(3px)', borderRadius: '50%',
        }} />
        {/* Center bright line */}
        <div className="pointer-events-none absolute" style={{
          top: '8%', left: '35%', width: '8%', height: '55%',
          background: `linear-gradient(to bottom, rgba(255,255,255,${metallic}) 0%, rgba(255,255,255,${metallic * 0.3}) 70%, transparent 100%)`,
          filter: 'blur(1px)', borderRadius: '50%',
        }} />
        {/* Right edge reflection */}
        <div className="pointer-events-none absolute" style={{
          top: '15%', right: '8%', width: '22%', height: '50%',
          background: `radial-gradient(ellipse, rgba(220,230,240,${reflectivity * 0.6}) 0%, transparent 70%)`,
          filter: 'blur(4px)',
        }} />
        {/* Bottom dark shadow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
          height: '35%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)',
        }} />
      </>
    );
  }

  // 🌈 HOLOGRAPHIC - Visible rainbow prism
  if (name.includes("holographic") || name.includes("holo")) {
    const intensity = config.intensity || 0.85;
    return (
      <>
        {/* Full rainbow - solid gradient, không dùng rgba */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(160deg,
              hsl(0,100%,65%) 0%,
              hsl(30,100%,60%) 15%,
              hsl(55,100%,60%) 28%,
              hsl(130,80%,55%) 42%,
              hsl(200,100%,60%) 57%,
              hsl(260,90%,65%) 72%,
              hsl(300,90%,65%) 85%,
              hsl(340,100%,65%) 100%)`,
            opacity: intensity * 0.75,
          }}
        />
        {/* Iridescent shimmer - diagonal cross */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(45deg,
              hsl(320,100%,70%) 0%,
              transparent 25%,
              hsl(190,100%,65%) 45%,
              transparent 65%,
              hsl(270,100%,70%) 90%)`,
            opacity: intensity * 0.45,
          }}
        />
        {/* White specular highlight */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: '5%', left: '10%', width: '50%', height: '45%',
            background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 45%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
        {/* Bottom depth */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: '25%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 100%)',
          }}
        />
      </>
    );
  }

  // 😺 CAT EYE - Magnetic vertical streak
  if (name.includes("cat") || name.includes("cateye") || name.includes("cat-eye")) {
    const streak = config.streak || 0.8;
    const angle = config.angle || 90;
    return (
      <>
        {/* Base dark shimmer */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.12) 100%)',
        }} />
        {/* Magnetic cat eye streak */}
        <div className="pointer-events-none absolute" style={{
          top: 0, bottom: 0,
          left: '50%',
          width: `${streak * 65}%`,
          transform: `translateX(-50%) rotate(${angle === 90 ? 0 : angle}deg)`,
          background: `linear-gradient(to right,
            transparent 0%,
            rgba(255,255,255,${streak * 0.25}) 25%,
            rgba(255,255,255,${streak * 0.75}) 50%,
            rgba(255,255,255,${streak * 0.25}) 75%,
            transparent 100%)`,
          filter: 'blur(5px)',
        }} />
        {/* Glossy top shine */}
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{
          height: '28%',
          background: `linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 100%)`,
        }} />
        {/* Bottom shadow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
          height: '25%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 100%)',
        }} />
      </>
    );
  }

  // 🎭 MATTE - Soft flat finish (no shine)
  if (name.includes("matte") || name.includes("nhám")) {
    return (
      <>
        {/* Matte flat overlay - removes shine, adds softness */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(0.5px)',
        }} />
        {/* Very subtle ambient highlight, no bright spots */}
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 100%)',
        }} />
      </>
    );
  }

  // ✨ GLOSSY (Default) - Natural shine
  const shine = config.shine || 0.45;
  const blur = config.blur || 0;
  const effectiveBlur = Math.max(4, blur * 20);

  return (
    <>
      {/* 1️⃣ Dark base gradient - tạo 3D depth, visible trên nền trắng */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(180,180,200,0.1) 40%, rgba(80,80,120,0.15) 75%, rgba(40,40,80,0.2) 100%)',
      }} />
      {/* 2️⃣ Main gloss blob - top left */}
      <div className="pointer-events-none absolute" style={{
        top: '5%', left: '8%', width: '55%', height: '60%',
        background: `radial-gradient(ellipse at 28% 25%, rgba(255,255,255,${shine * 0.92}) 0%, rgba(255,255,255,${shine * 0.5}) 40%, transparent 72%)`,
        filter: `blur(${effectiveBlur}px)`,
        transform: 'rotate(-12deg)',
      }} />
      {/* 3️⃣ Sharp specular line */}
      <div className="pointer-events-none absolute" style={{
        top: '10%', left: '18%', width: '16%', height: '52%',
        background: `linear-gradient(to bottom, rgba(255,255,255,${shine}) 0%, rgba(255,255,255,${shine * 0.55}) 45%, transparent 100%)`,
        filter: `blur(${Math.max(1.5, effectiveBlur * 0.25)}px)`,
        borderRadius: '50%',
      }} />
      {/* 4️⃣ Top edge sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{
        height: '32%',
        background: `linear-gradient(to bottom, rgba(255,255,255,${shine * 0.6}) 0%, transparent 100%)`,
      }} />
      {/* 5️⃣ Right subtle reflection */}
      <div className="pointer-events-none absolute" style={{
        top: '18%', right: '8%', width: '22%', height: '42%',
        background: `radial-gradient(ellipse, rgba(255,255,255,${shine * 0.45}) 0%, transparent 70%)`,
        filter: `blur(${Math.max(3, effectiveBlur * 0.55)}px)`,
      }} />
      {/* 6️⃣ Bottom shadow - critical for 3D depth on white nails */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
        height: '35%',
        background: 'linear-gradient(to top, rgba(60,40,80,0.28) 0%, rgba(60,40,80,0.08) 60%, transparent 100%)',
      }} />
      {/* 7️⃣ Right edge shadow for curved look */}
      <div className="pointer-events-none absolute inset-y-0 right-0" style={{
        width: '20%',
        background: 'linear-gradient(to left, rgba(60,40,80,0.15) 0%, transparent 100%)',
      }} />
    </>
  );
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
    return "0 VND";
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
    const parsed = typeof customColor === 'string'
      ? (() => {
        const normalized = customColor.trim();

        if (!normalized) {
          return null;
        }

        if (normalized.startsWith('{') || normalized.startsWith('[')) {
          return JSON.parse(normalized);
        }

        return {
          mode: 'solid',
          color: normalized,
        };
      })()
      : customColor;

    if (!parsed) {
      return { backgroundColor: '#f3f4f6' };
    }

    if (parsed.mode === 'solid' && parsed.color) {
      return { backgroundColor: parsed.color };
    }
    if (parsed.mode === 'gradient') {
      const gradientStops = Array.isArray(parsed.gradient)
        ? parsed.gradient
        : Array.isArray(parsed.gradient?.stops)
          ? parsed.gradient.stops
          : [];

      if (gradientStops.length > 0) {
        return { background: `linear-gradient(to top, ${gradientStops.join(', ')})` };
      }
    }
    if (parsed.mode === 'perFinger' && Array.isArray(parsed.fingers)) {
      const finger = parsed.fingers.find(f => Number(f.fingerIndex) === Number(fingerIndex));
      if (finger) {
        if (finger.gradient && finger.gradient.enabled && Array.isArray(finger.gradient.stops)) {
          return { background: `linear-gradient(to top, ${finger.gradient.stops.join(', ')})` };
        }
        // Support both finger.color and finger.primaryColor
        const solidColor = finger.color || finger.primaryColor || '#f3f4f6';
        if (finger.mode === 'gradient' && finger.primaryColor && finger.secondaryColor) {
          return { background: `linear-gradient(to top, ${finger.primaryColor}, ${finger.secondaryColor})` };
        }
        return { backgroundColor: solidColor };
      }
    }

  } catch (e) {
    console.error("Error parsing finger color style:", e);
  }
  return { backgroundColor: '#f3f4f6' };
}

function normalizeComponentPosition(value, fallbackPercent = 50) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallbackPercent;
  // posX/posY are offset from center normalized by destW/destH.
  // Multiply by 50: offset of 1.0 = full nail width away from center
  return Math.max(0, Math.min(100, 50 + numericValue * 50));
}

function parseComponentConfig(configJson) {
  if (!configJson) {
    return {};
  }

  try {
    return typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
  } catch {
    return {};
  }
}

function getFingerName(fingerIndex) {
  switch (Number(fingerIndex)) {
    case 1:
      return "Thumb";
    case 2:
      return "Index";
    case 3:
      return "Middle";
    case 4:
      return "Ring";
    case 5:
      return "Pinky";
    default:
      return `Finger ${fingerIndex}`;
  }
}

function renderNailTip(style, shapeName, sizeClass = "w-12 h-20") {
  const name = String(shapeName || "").toLowerCase();
  let clipPathId = "clip-nail-default";
  if (name.includes("almond")) clipPathId = "clip-nail-almond";
  else if (name.includes("coffin")) clipPathId = "clip-nail-coffin";
  else if (name.includes("stiletto")) clipPathId = "clip-nail-stiletto";
  else if (name.includes("square")) clipPathId = "clip-nail-square";

  return (
    <div className={`relative ${sizeClass} drop-shadow-[0_8px_16px_rgba(234,79,147,0.12)] transition-transform duration-300 group-hover/card:scale-105`}>
      <div
        className="w-full h-full relative"
        style={{
          clipPath: `url(#${clipPathId})`,
          ...style
        }}
      >
        {/* Shading/Depth Highlights */}
        {/* Left reflection line */}
        <div className="absolute inset-y-0 left-0 w-[25%] bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
        {/* Right side shadow */}
        <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-black/15 to-transparent pointer-events-none" />
        {/* Under shadow */}
        <div className="absolute bottom-0 inset-x-0 h-[15%] bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        {/* Gloss highlight strip */}
        <div className="absolute top-[8%] left-[25%] w-[8%] h-[65%] rounded-full bg-white/45 blur-[0.5px] rotate-[-4deg] pointer-events-none" />
      </div>
    </div>
  );
}

const copyToClipboard = (text) => {
  if (!text || text === "N/A") return;
  navigator.clipboard.writeText(text);
  toast.success(`Copied color code: ${text}`);
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
  const { t, language } = useLanguage();
  const { customerNailId } = useParams();
  const navigate = useNavigate();
  const [nail, setNail] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [assignedStaffSkills, setAssignedStaffSkills] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const lastFetchedArtistIdRef = useRef(null);


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
      let assignedStaff = null;

      // Nếu có approvedArtist, lấy trực tiếp từ data để tránh call API fetchSalonStaff liên tục
      if (data?.approvedArtist) {
        assignedStaff = data.approvedArtist;
        const artistId = assignedStaff.nailArtistId || assignedStaff.staffId || assignedStaff.staffArtistId || assignedStaff.userId || assignedStaff.id;

        if (artistId && lastFetchedArtistIdRef.current !== artistId) {
          try {
            const skills = await fetchNailArtistSkills(artistId);
            setAssignedStaffSkills(skills || []);
            lastFetchedArtistIdRef.current = artistId;
          } catch (err) {
            console.error("[Page] Error loading staff skills:", err);
          }
        }
      } else {
        lastFetchedArtistIdRef.current = null;
        setAssignedStaffSkills([]);
      }
      // Pre-populate procedures to match Staff view
      const proceduresList = data?.customerNail?.nailProcedures || data?.nailProcedures || data?.customerNailProcedures || [];
      if (proceduresList.length > 0) {
        const loadedProcedures = proceduresList.map(p => {
          const finalName = p.name || p.procedureName || p.note;
          return {
            id: p.nailProcedureId,
            procedureId: p.procedureId,
            name: finalName,
            estimatedMinutes: p.estimatedMinutes || p.procedureDuration || 15,
            stepOrder: p.stepOrder,
            isCommon: p.isCustomStep ? false : (p.procedureType === "Common" || p.procedureType === 1),
            isCustomStep: p.isCustomStep,
            procedureType: p.procedureType || (p.isCustomStep ? "ModelSpecific" : "Common"),
            note: (p.name || p.procedureName) ? (p.note || p.procedureDescription || "") : "Bước kỹ thuật thực hiện"
          };
        }).sort((a, b) => a.stepOrder - b.stepOrder);
        setProcedures(loadedProcedures);
      }

      setNail({
        ...data,
        assignedStaff: assignedStaff
      });

      // Fetch customer details if available
      const userId = data?.customerNail?.userId || data?.userId;
      if (userId) {
        try {
          const customerData = await fetchUserById(userId);
          setCustomer(customerData);
        } catch (err) {
          console.error("[Page] Error loading customer details:", err);
        }
      }

    } catch (err) {
      console.error("[Page] Error loading nail:", err);

      const errorMessage = err.message || "Failed to load customer nail detail.";

      // Determine error type for better UX
      if (
        errortoast.includes("Token") ||
        errortoast.includes("Unauthorized") ||
        errortoast.includes("đăng nhập")
      ) {
        setErrorType("auth");
        setError("Token không hợp lệ! Vui lòng đăng nhập lại.");
      } else if (errortoast.includes("not found")) {
        setErrorType("notfound");
        setError(`Customer nail "${customerNailId}" không tồn tại.`);
      } else if (
        errortoast.includes("connect") ||
        errortoast.includes("network")
      ) {
        setErrorType("network");
        setError("Không thể kết nối đến server. Kiểm tra kết nối internet.");
      } else {
        setErrorType("unknown");
        setError(errorMessage);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [customerNailId]);

  useEffect(() => {
    if (customerNailId) {
      Promise.resolve().then(() => loadCustomerNailDetail());
    }
  }, [customerNailId, loadCustomerNailDetail]);

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

      const artistsWithSkills = await Promise.all(
        artists.map(async (member) => {
          const artistId = member.staffId || member.staffArtistId || member.userId || member.id;
          try {
            const skills = await fetchNailArtistSkills(artistId);
            return { ...member, skills };
          } catch (e) {
            console.error(`Failed to fetch skills for artist ${artistId}:`, e);
            return { ...member, skills: [] };
          }
        })
      );
      setStaffList(artistsWithSkills);
    } catch (err) {
      console.error("[Page] Error loading salon staff:", err);
      toast.error(err.message || "Failed to load salon staff.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedStaff) {
      toast.error("Please select a staff member.");
      return;
    }
    try {
      setIsSubmitting(true);
      const staffKey = selectedStaff.staffId || selectedStaff.staffArtistId || selectedStaff.userId || selectedStaff.id;
      await assignReviewer(nail?.customerNailRequestId || customerNailId, staffKey);
      toast.success("Staff assigned successfully!");
      setIsAssignModalOpen(false);
      if (selectedStaff.skills) {
        setAssignedStaffSkills(selectedStaff.skills);
        lastFetchedArtistIdRef.current = staffKey;
      } else {
        try {
          const skills = await fetchNailArtistSkills(staffKey);
          setAssignedStaffSkills(skills || []);
          lastFetchedArtistIdRef.current = staffKey;
        } catch (e) {
          console.error(e);
        }
      }
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
      toast.error(err.message || "Failed to assign staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerApproveQuote = async () => {
    if (!finalPrice) {
      toast.error("Please enter a final price.");
      return;
    }
    try {
      setIsSubmitting(true);
      await managerApproveQuote(nail?.customerNailRequestId || customerNailId, parseFloat(finalPrice), parseFloat(finalDuration) || 0);
      toast.success("Quote approved successfully!");
      setIsApproveModalOpen(false);
      setFinalPrice("");
      setFinalDuration("");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error approving quote:", err);
      toast.error(err.message || "Failed to approve quote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a reject reason.");
      return;
    }
    try {
      setIsSubmitting(true);
      await managerReject(nail?.customerNailRequestId || customerNailId, rejectReason.trim());
      toast.success("Customer nail rejected successfully!");
      setIsRejectModalOpen(false);
      setRejectReason("");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error rejecting customer nail:", err);
      toast.error(err.message || "Failed to reject customer nail.");
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

    const hasZeroIndex = (nail?.customerNailComponents || []).some(comp => Number(comp.fingerIndex) === 0);
    const hasFiveIndex = (nail?.customerNailComponents || []).some(comp => Number(comp.fingerIndex) === 5);
    const isZeroIndexed = hasZeroIndex || (!hasFiveIndex);

    const components = (nail?.customerNailComponents || []).filter(comp => {
      const compIdx = Number(comp.fingerIndex);
      return isZeroIndexed ? compIdx === (fingerIndex - 1) : compIdx === fingerIndex;
    });

    const isFingerSelectedWithAccessory = selectedComponentId !== null && components.some(comp => {
      const globalIdx = (nail?.customerNailComponents || []).findIndex(c => c.customerNailComponentId === comp.customerNailComponentId);
      const globalId = comp.customerNailComponentId || globalIdx;
      return selectedComponentId === globalId;
    });

    const maskStyle = nail?.nailShape?.imageUrl ? {
      maskImage: `url(${nail.nailShape.imageUrl})`,
      WebkitMaskImage: `url(${nail.nailShape.imageUrl})`,
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
    } : {};

    // 🎨 Hand proportions - wider to match real almond nail shape
    const fingerMetrics = {
      Thumb: { height: 205, width: 140, lift: 30, rotate: -8, hoverLift: -6 },
      Index: { height: 235, width: 130, lift: 10, rotate: -3, hoverLift: -8 },
      Middle: { height: 255, width: 135, lift: 0, rotate: 0, hoverLift: -10 },
      Ring: { height: 235, width: 130, lift: 6, rotate: 3, hoverLift: -8 },
      Pinky: { height: 190, width: 110, lift: 26, rotate: 7, hoverLift: -6 },
    };
    const { height, width, lift, rotate } = fingerMetrics[fingerName] || fingerMetrics.Middle;

    // Default realistic blush-pink base when no custom color
    const baseColorStyle = nail?.customColor
      ? colorStyle
      : { background: 'linear-gradient(to bottom, #fff0f3 0%, #ffd6db 45%, #fecdd3 100%)' };

    return (
      <div
        className="group relative flex flex-col items-center gap-2 transition-all duration-700 ease-out"
        style={{
          marginBottom: lift,
          transform: `rotate(${rotate}deg)`,
        }}
      >
        {/* Container with hover lift */}
        <div
          className="relative transition-transform duration-700 ease-out group-hover:-translate-y-3"
          style={{ height, width }}
        >
          {/* 🌟 Soft realistic shadow beneath nail */}
          <div className="absolute -bottom-3 left-1/2 h-4 w-[75%] -translate-x-1/2 rounded-full bg-gradient-radial from-[#ea4f93]/25 via-[#ea4f93]/10 to-transparent blur-lg opacity-60 transition-opacity duration-700 group-hover:opacity-90" />

          {/* 💅 Main nail card (Showcase Display Slot) */}
          <div
            className={`relative h-full w-full transition-all duration-500 rounded-[32px] ${isFingerSelectedWithAccessory
              ? "border border-[#ea4f93] bg-gradient-to-b from-[#fff2f6] to-[#fffbfc] shadow-[0_20px_40px_rgba(236,72,153,0.15)] ring-2 ring-[#ea4f93]/20 scale-[1.02]"
              : "bg-gradient-to-b from-white/60 to-[#fffafc]/40 shadow-[0_12px_24px_rgba(236,72,153,0.02)] hover:bg-white/80"
              }`}
          >

            {/* Base color & texture layer - masked to nail shape */}
            <div
              className="absolute inset-0 h-full w-full"
              style={nail?.nailShape?.imageUrl ? maskStyle : {
                width: '60%',
                height: '80%',
                left: '20%',
                top: '10%',
                position: 'absolute',
                clipPath: 'url(#clip-nail-default)'
              }}
            >
              {/* Layer 1: Base color */}
              <div className="absolute inset-0 h-full w-full" style={baseColorStyle} />

              {/* Layer 2: Surface Effects - inside mask, clipped to nail shape */}
              {renderSurfaceEffects(nail?.nailSurface?.name, nail?.nailSurface?.shaderParam)}
            </div>

            {/* Layer 4: Shape mask overlay with depth */}
            {nail?.nailShape?.imageUrl && (
              <img
                src={nail.nailShape.imageUrl}
                alt="shape mask"
                className="pointer-events-none absolute inset-0 h-full w-full object-contain mix-blend-multiply opacity-85 transition-opacity duration-500 group-hover:opacity-90"
              />
            )}

            {/* Layer 5: Components / ornaments with premium target indicators */}
            {components.map((comp, idx) => {
              const item = comp.component || comp.customerComponent;
              if (!item?.imageUrl) return null;

              const config = parseComponentConfig(comp.configJson);
              const scale = Number.isFinite(Number(config?.scale)) ? Number(config.scale) : 0.25;
              const rotation = Number.isFinite(Number(config?.rotation)) ? Number(config.rotation) : 0;
              const left = normalizeComponentPosition(comp.posX, 50);
              const top = normalizeComponentPosition(comp.posY, 50);
              const sizePercent = Math.max(10, Math.min(100, scale * 100));

              const globalIdx = (nail?.customerNailComponents || []).findIndex(c => c.customerNailComponentId === comp.customerNailComponentId);
              const globalId = comp.customerNailComponentId || globalIdx;
              const isSelected = selectedComponentId !== null && (
                selectedComponentId === comp.customerNailComponentId ||
                (comp.customerNailComponentId === null && globalIdx === selectedComponentId)
              );

              return (
                <div
                  key={comp.customerNailComponentId || idx}
                  className="absolute pointer-events-auto cursor-pointer transition-all duration-300"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${isSelected ? sizePercent * 1.15 : sizePercent}%`,
                    height: `${isSelected ? sizePercent * 1.15 : sizePercent}%`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                    zIndex: isSelected ? 50 : 30,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedComponentId(prev => prev === globalId ? null : globalId);
                    const element = document.getElementById(`component-card-${globalId}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  {/* High-fidelity selection indicator */}
                  {isSelected && (
                    <>
                      {/* Rotating dash focus ring */}
                      <div className="absolute -inset-2.5 rounded-full border border-dashed border-[#ea4f93] animate-[spin_10s_linear_infinite] opacity-90" />
                      {/* Glowing focus aura */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ea4f93]/25 to-[#f472b6]/25 blur-sm scale-110" />
                      {/* Target dots */}
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ea4f93] shadow-[0_0_8px_#ea4f93]" />
                      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ea4f93] shadow-[0_0_8px_#ea4f93]" />
                    </>
                  )}

                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`h-full w-full object-contain transition-all duration-300 ${isSelected
                      ? "drop-shadow-[0_0_12px_rgba(234,79,147,0.85)] scale-110"
                      : "drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)] hover:scale-110"
                      }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Finger label with interactive state */}
        <span
          className={`rounded-full border-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm transition-all duration-500 ${isFingerSelectedWithAccessory
            ? "border-[#ea4f93] bg-[#ea4f93] text-white shadow-[0_12px_28px_rgba(236,72,153,0.2)] scale-105"
            : "border-[#fce6f3] bg-white/95 text-[#c08aa4] shadow-[0_8px_20px_rgba(236,72,153,0.08)] group-hover:scale-105 group-hover:border-[#ea4f93] group-hover:bg-[#ea4f93] group-hover:text-white"
            }`}
        >
          {fingerName}
        </span>
      </div>
    );
  };
  return (
    <div className="flex min-h-full flex-col gap-6">
      <Card className="p-0 border-none shadow-[0_20px_50px_rgba(236,72,153,0.06)] overflow-hidden rounded-[32px]">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#fff2f7] via-[#fff9fc] to-[#FAF5F9] p-8 border-b border-[#f3e3ec]/50">
          {/* Decorative background glow blobs */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-radial from-[#ffd4e4]/30 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-radial from-[#f3e8ff]/30 to-transparent blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between z-10">
            {/* Left side: Info & Image */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {nail?.imageUrl ? (
                <div className="relative group">
                  <img
                    src={nail.imageUrl}
                    alt={nail.name}
                    className="h-28 w-28 rounded-[32px] border-4 border-white object-cover shadow-[0_20px_45px_rgba(236,72,153,0.15)] transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
                </div>
              ) : (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[32px] bg-gradient-to-br from-[#ff9ac2] via-[#ea4f93] to-[#c63d79] text-3xl font-bold text-white shadow-[0_20px_45px_rgba(234,79,147,0.2)]">
                  <Palette size={38} />
                </div>
              )}

              <div className="text-center sm:text-left">
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                  <h2 className="text-3xl font-bold tracking-tight text-[#3f2240]">
                    {nail?.name || "Untitled Design"}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${getStatusTone(
                      nail?.status
                    )}`}
                  >
                    {nail?.status === "Approved" ? (
                      <CheckCircle2 size={12} />
                    ) : nail?.status === "Rejected" ? (
                      <XCircle size={12} />
                    ) : (
                      <Calendar size={12} />
                    )}
                    {nail?.status || "Draft"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap justify-center sm:justify-start items-center gap-3">
                  {customer ? (
                    <>
                      <img
                        src={customer.avatarUrl || "https://ui-avatars.com/api/?name=" + customer.firstName}
                        alt="Customer"
                        className="h-8 w-8 rounded-full border border-pink-200 object-cover shadow-sm"
                      />
                      <div className="text-sm text-left">
                        <p className="font-bold text-[#402542]">{customer.firstName} {customer.lastName}</p>
                        <p className="text-xs text-[#8f6b80]">{customer.email} • {customer.phone || "No phone"}</p>
                      </div>
                    </>
                  ) : (
                    <p className="max-w-xl text-xs font-medium leading-relaxed text-[#8f6b80]">
                      {language === "vi" ? "Xem chi tiết thiết kế, kiểm tra màu sắc được yêu cầu, chỉ định nghệ sĩ, hoàn thành hành động của quản lý" : "Review custom design details, inspect the requested colors, assign a staff artist, and complete manager actions from one place."}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${nail?.basedOnNailVariantId !== null ? "bg-[#eef2ff] text-[#4f46e5] border border-blue-100" : "bg-[#fffbeb] text-[#d97706] border border-amber-100"}`}>
                    {nail?.basedOnNailVariantId !== null ? language === "vi" ? "Mẫu có sẵn" : "Preset template" : language === "vi" ? "Thiết kế độc đáo" : "Custom Unique Design"}
                  </span>
                  {nail?.isFavorite ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f5] border border-pink-100 px-3 py-1 text-[10px] font-extrabold text-[#ea4f93] uppercase tracking-wider shadow-sm">
                      <Heart size={11} fill="currentColor" />
                      {language === "vi" ? "Yêu thích" : "Favorite"}
                    </span>
                  ) : null}
                  {nail?.isPublic ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f9fafb] border border-gray-100 px-3 py-1 text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider shadow-sm">
                      <Eye size={11} />
                      {language === "vi" ? "Công khai" : "Public"}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right side: Stats Cards & Actions */}
            <div className="flex flex-col gap-3 lg:w-auto lg:min-w-[420px]">
              {/* Stats Grid */}
              <div className="grid gap-3 grid-cols-3">
                {/* Price card */}
                <div className="rounded-2xl border border-amber-100 bg-[#fffdfa] p-4 shadow-[0_10px_25px_rgba(217,119,6,0.03)] flex flex-col justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#d97706]">
                    Price
                  </span>
                  <span className="mt-2 text-base font-bold text-[#d97706] truncate">
                    {formatVND(nail?.price, nail?.status)}
                  </span>
                </div>
                {/* Duration card */}
                <div className="rounded-2xl border border-purple-100 bg-[#fbfaff] p-4 shadow-[0_10px_25px_rgba(139,92,246,0.03)] flex flex-col justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#7c3aed]">
                    Duration
                  </span>
                  <span className="mt-2 text-base font-bold text-[#7c3aed] truncate">
                    {formatDuration(nail?.duration, nail?.status)}
                  </span>
                </div>
                {/* Created Date card */}
                <div className="rounded-2xl border border-pink-100 bg-[#fffafc] p-4 shadow-[0_10px_25px_rgba(236,72,153,0.03)] flex flex-col justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#db2777]">
                    {language === "vi" ? "Ngày tạo" : "Created"}
                  </span>
                  <span className="mt-2 text-[11px] font-bold text-[#db2777] leading-snug">
                    {formatDate(nail?.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {((nail?.status === "Pending" || nail?.status === "PendingReview") || nail?.status === "Reviewed") && (
                <div className="flex gap-2">
                  {(nail?.status === "Pending" || nail?.status === "PendingReview") && (
                    <ActionButton
                      onClick={handleOpenAssignModal}
                      disabled={isSubmitting}
                      icon={UserPlus}
                      className="flex-1 bg-[#ea4f93] hover:bg-[#df4588] shadow-md shadow-pink-500/20 py-2.5 text-sm"
                    >
                      {language === "vi" ? "Chỉ định thợ" : "Assign Staff Artist"}
                    </ActionButton>
                  )}

                  {nail?.status === "Reviewed" && (
                    <>
                      <ActionButton
                        onClick={() => {
                          setFinalPrice(nail?.price || "");
                          setFinalDuration(nail?.duration || "");
                          setIsApproveModalOpen(true);
                        }}
                        disabled={isSubmitting}
                        icon={CheckCircle2}
                        className="flex-1 bg-[#2fa25f] hover:bg-[#2a9255] shadow-md shadow-green-500/20 py-2.5 text-sm"
                      >
                        {language === "vi" ? "Xác nhận báo giá" : "Confirm Quote"}
                      </ActionButton>
                      <ActionButton
                        onClick={() => setIsRejectModalOpen(true)}
                        disabled={isSubmitting}
                        icon={XCircle}
                        className="flex-1 bg-[#e1447f] hover:bg-[#d63e75] shadow-md shadow-red-500/20 py-2.5 text-sm"
                      >
                        {language === "vi" ? "Từ chối báo giá" : "Reject Quote"}
                      </ActionButton>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Custom Design Live Preview */}
          <div className="space-y-4">
            <SectionHeading
              title={language === "vi" ? "Xem trước thiết kế trực tiếp" : "Custom Design Live Preview"}
              subtitle={language === "vi" ? "Xem trước thiết kế trực tiếp hiển thị hình dạng móng, màu sắc, kết cấu bề mặt và phụ kiện ở vị trí tay thực tế." : "Interactive 3D preview showing nail shape, color blend, surface texture, and accessories in realistic hand positioning."}
            />

            <div className="relative rounded-[24px] border border-[#fdf7f9] bg-[radial-gradient(ellipse_at_top,#fffdfd_0%,#fdfafb_58%,#f9f5f7_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_20px_50px_rgba(236,72,153,0.03)]">
              <div className="flex min-h-[360px] flex-wrap items-center justify-center gap-5 lg:gap-6">
                {renderNailPreview(1, language === "vi" ? "Ngón cái" : "Thumb")}
                {renderNailPreview(2, language === "vi" ? "Ngón trỏ" : "Index")}
                {renderNailPreview(3, language === "vi" ? "Ngón giữa" : "Middle")}
                {renderNailPreview(4, language === "vi" ? "Ngón áp út" : "Ring")}
                {renderNailPreview(5, language === "vi" ? "Ngón út" : "Pinky")}
              </div>

              <div className="absolute right-6 top-6 flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-lg backdrop-blur-sm">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">{language === "vi" ? "Thông tin thiết kế" : "Design Info"}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-[#fff0f8] px-2 py-1 text-[10px] font-bold text-[#ea4f93]">
                    {nail?.nailShape?.name}
                  </span>
                  <span className="rounded-lg bg-[#fff0f8] px-2 py-1 text-[10px] font-bold text-[#ea4f93]">
                    {nail?.nailSurface?.name}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#9c6f87]">
                  {(nail?.customerNailComponents || []).length} add-ons
                </span>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <SectionHeading
              title={language === "vi" ? "Thông tin thiết kế" : "Design Information"}
              subtitle={language === "vi" ? "Tóm tắt thông tin về thiết kế móng khách yêu cầu." : "High-level summary of the requested customer nail design."}
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
                    {language === "vi" ? "Kiểu móng" : "Nail Shape"}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">{language === "vi" ? "Kiểu móng" : "Nail Shape"}</p>
                  <p className="mt-1 text-sm font-extrabold text-[#3f2240]">{nail?.nailShape?.name || language === "vi" ? "Kiểu móng tùy chỉnh" : "Custom Shape"}</p>
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
                    {language === "vi" ? "Bề mặt móng" : "Nail Surface"}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">{language === "vi" ? "Bề mặt móng" : "Nail Surface"}</p>
                  <p className="mt-1 text-sm font-extrabold text-[#3f2240]">{nail?.nailSurface?.name}</p>
                </div>
              </div>

              {/* Price Tile */}
              <div className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-white to-[#fff9fb] p-5 shadow-[0_10px_24px_rgba(236,72,153,0.04)] flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-[#fef3c7] flex items-center justify-center text-[#d97706] font-bold text-lg shrink-0">
                  VND
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">{language === "vi" ? "Tổng tiền" : "Total Amount"}</p>
                  <p className="mt-1 text-sm font-extrabold text-green-700">{formatVND(nail?.price, nail?.status)}</p>
                </div>
              </div>

              {/* Duration Tile */}
              <div className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-white to-[#fff9fb] p-5 shadow-[0_10px_24px_rgba(236,72,153,0.04)] flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-[#e0f2fe] flex items-center justify-center text-[#0369a1] font-bold text-lg shrink-0">
                  ⏱
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">{language === "vi" ? "Tổng thời gian" : "Total Duration"}</p>
                  <p className="mt-1 text-sm font-extrabold text-[#3f2240]">{formatDuration(nail?.duration, nail?.status)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Components / Accessories */}
          {Array.isArray(nail?.customerNailComponents) && nail.customerNailComponents.length > 0 && (
            <div className="space-y-4">
              <SectionHeading
                title={language === "vi" ? "Phụ kiện" : "Components & Ornaments"}
                subtitle={language === "vi" ? "Các phụ kiện trang trí cho bộ móng." : "Individual stickers, gems, and 3D decors requested. Click any card to highlight it on the nail preview."}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nail.customerNailComponents.map((itemComponent, idx) => {
                  const comp = itemComponent.component || itemComponent.customerComponent;
                  if (!comp) return null;

                  const globalId = itemComponent.customerNailComponentId || idx;
                  const isCardSelected = selectedComponentId === globalId;

                  return (
                    <div
                      key={itemComponent.customerNailComponentId || idx}
                      id={`component-card-${globalId}`}
                      onClick={() => setSelectedComponentId(prev => prev === globalId ? null : globalId)}
                      className={`rounded-2xl border p-4 flex items-center justify-between gap-3.5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4af37] hover:shadow-md ${isCardSelected
                        ? "border-[#d4af37] bg-[#fefdfa] shadow-[0_12px_28px_rgba(212,175,55,0.12)] scale-[1.02]"
                        : "border-[#eee8d9] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.02)]"
                        }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {comp.imageUrl ? (
                          <img
                            src={comp.imageUrl}
                            alt={comp.name}
                            className="h-14 w-14 rounded-xl border border-[#d4af37]/20 bg-[#fdfdfd] object-contain p-1 shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 text-xs font-bold shrink-0">
                            Decor
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#3f2240] truncate font-serif">{comp.name || "Custom Accessory"}</p>
                          <p className="mt-0.5 text-xs text-[#a18560]">
                            Type: {comp.componentType || "Sticker/Gem"} • Finger: {itemComponent.fingerIndex}
                          </p>
                          {comp.price ? (
                            <p className="mt-1 text-xs text-[#d4af37] font-semibold">+{formatVND(comp.price)}</p>
                          ) : null}
                        </div>
                      </div>
                      {isCardSelected && (
                        <span className="rounded-full bg-[#d4af37] p-1.5 text-white shadow-sm shrink-0 animate-pulse">
                          <Sparkles size={12} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Color */}
          {nail?.customColor && (
            <div className="space-y-4">
              {/* Hidden SVG Defs for 3D Nail Shapes */}
              <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                <defs>
                  <clipPath id="clip-nail-almond" clipPathUnits="objectBoundingBox">
                    <path d="M 0.22,1 C 0.16,0.65 0.22,0.18 0.5,0.02 C 0.78,0.18 0.84,0.65 0.78,1 Z" />
                  </clipPath>
                  <clipPath id="clip-nail-coffin" clipPathUnits="objectBoundingBox">
                    <path d="M 0.22,1 C 0.2,0.7 0.3,0.2 0.32,0.12 L 0.68,0.12 C 0.7,0.2 0.8,0.7 0.78,1 Z" />
                  </clipPath>
                  <clipPath id="clip-nail-stiletto" clipPathUnits="objectBoundingBox">
                    <path d="M 0.25,1 C 0.22,0.7 0.32,0.2 0.5,0.02 C 0.68,0.2 0.78,0.7 0.75,1 Z" />
                  </clipPath>
                  <clipPath id="clip-nail-square" clipPathUnits="objectBoundingBox">
                    <path d="M 0.22,1 L 0.22,0.15 C 0.22,0.08 0.28,0.02 0.35,0.02 L 0.65,0.02 C 0.72,0.02 0.78,0.08 0.78,0.15 L 0.78,1 Z" />
                  </clipPath>
                  <clipPath id="clip-nail-default" clipPathUnits="objectBoundingBox">
                    <path d="M 0.22,1 C 0.16,0.65 0.22,0.18 0.5,0.02 C 0.78,0.18 0.84,0.65 0.78,1 Z" />
                  </clipPath>
                </defs>
              </svg>

              <SectionHeading
                title={language === "vi" ? "Màu sắc tùy chỉnh" : "Custom Color"}
                subtitle={language === "vi" ? "Xem cấu hình màu sắc được yêu cầu cho thiết kế tùy chỉnh này." : "Preview the requested color configuration for this custom design."}
              />
              <div className="rounded-[28px] border border-[#f4d6e4] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-6 shadow-[0_10px_26px_rgba(236,72,153,0.05)]">
                <div className="w-full">
                  {(() => {
                    try {
                      const colorData =
                        typeof nail.customColor === "string"
                          ? (() => {
                            const normalized = nail.customColor.trim();

                            if (!normalized) {
                              return null;
                            }

                            if (normalized.startsWith("{") || normalized.startsWith("[")) {
                              return JSON.parse(normalized);
                            }

                            return {
                              mode: "solid",
                              color: normalized,
                            };
                          })()
                          : nail.customColor;

                      if (colorData?.mode === "solid" && colorData?.color) {
                        return (
                          <div
                            onClick={() => copyToClipboard(colorData.color)}
                            className="group/card flex flex-col gap-5 sm:flex-row sm:items-center cursor-pointer rounded-3xl border border-[#f5cee1]/60 bg-white/50 p-5 transition-all duration-300 hover:bg-white hover:border-[#ea4f93] hover:shadow-[0_12px_28px_rgba(236,72,153,0.06)]"
                          >
                            <div className="relative flex items-center justify-center p-3 rounded-2xl bg-white/40 border border-white/60 shadow-inner w-24 h-32 shrink-0 transition-all duration-300 group-hover/card:bg-white/90">
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-[#ea4f93]/10" />
                              {renderNailTip({ backgroundColor: colorData.color }, nail?.nailShape?.name, "w-14 h-22")}
                            </div>
                            <div>
                              <span className="inline-flex rounded-full bg-[#ffe6f1] px-2.5 py-1 text-[10px] font-bold text-[#ea4f93] uppercase tracking-wider">
                                {language === "vi" ? "Màu sắc" : "Solid Color"}
                              </span>
                              <h4 className="mt-2.5 text-base font-extrabold text-[#3f2240] flex items-center gap-2">
                                <span className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-full border border-[#f5cee1] shadow-sm">
                                  <span className="h-3 w-3 rounded-full border border-white shadow-sm inline-block shrink-0" style={{ backgroundColor: colorData.color }} />
                                  <span className="font-mono text-sm font-extrabold text-[#5c3b5d]">{colorData.color}</span>
                                </span>
                                <span className="text-[10px] font-medium text-[#c08aa4] opacity-0 group-hover/card:opacity-100 transition-opacity">{language === "vi" ? "Bấm để sao chép" : "(Click to copy)"}</span>
                              </h4>
                              <div className="mt-2 h-3.5 w-48 rounded-full border border-white/80 bg-[#fff5f9] shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                                <div className="h-full w-full rounded-full" style={{ backgroundColor: colorData.color }} />
                              </div>
                              <p className="mt-2.5 text-xs text-[#c08aa4]">{language === "vi" ? "Màu sắc đơn sắc được áp dụng trên tất cả các ngón tay." : "Single solid tone applied across all fingers."}</p>
                            </div>
                          </div>
                        );
                      } else if (colorData?.mode === "gradient") {
                        const gradientStops = Array.isArray(colorData?.gradient)
                          ? colorData.gradient
                          : Array.isArray(colorData?.gradient?.stops)
                            ? colorData.gradient.stops
                            : [];

                        if (!gradientStops.length) {
                          return null;
                        }

                        const gradientStyle = { background: `linear-gradient(to top, ${gradientStops.join(", ")})` };
                        const stopsLabel = gradientStops.join(" → ");

                        return (
                          <div
                            onClick={() => copyToClipboard(stopsLabel)}
                            className="group/card flex flex-col gap-5 sm:flex-row sm:items-center cursor-pointer rounded-3xl border border-[#f5cee1]/60 bg-white/50 p-5 transition-all duration-300 hover:bg-white hover:border-[#ea4f93] hover:shadow-[0_12px_28px_rgba(236,72,153,0.06)]"
                          >
                            <div className="relative flex items-center justify-center p-3 rounded-2xl bg-white/40 border border-white/60 shadow-inner w-24 h-32 shrink-0 transition-all duration-300 group-hover/card:bg-white/90">
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-[#ea4f93]/10" />
                              {renderNailTip(gradientStyle, nail?.nailShape?.name, "w-14 h-22")}
                            </div>
                            <div>
                              <span className="inline-flex rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-bold text-[#4f46e5] uppercase tracking-wider">
                                {language === "vi" ? "Màu chuyển sắc" : "Linear Gradient"}
                              </span>
                              <h4 className="mt-2.5 text-base font-extrabold text-[#3f2240] flex items-center gap-3 flex-wrap">
                                {gradientStops.map((stop, sidx) => (
                                  <span key={sidx} className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 bg-white/80 px-2 py-0.5 rounded-full border border-[#f5cee1] shadow-sm">
                                      <span className="h-3 w-3 rounded-full border border-white shadow-sm inline-block shrink-0" style={{ backgroundColor: stop }} />
                                      <span className="font-mono text-sm font-extrabold text-[#5c3b5d]">{stop}</span>
                                    </span>
                                    {sidx < gradientStops.length - 1 && <span className="text-xs text-[#a5b4fc] font-bold">→</span>}
                                  </span>
                                ))}
                                <span className="text-[10px] font-medium text-[#c08aa4] opacity-0 group-hover/card:opacity-100 transition-opacity">{language === "vi" ? "Bấm để sao chép" : "(Click to copy)"}</span>
                              </h4>
                              <div className="mt-2 h-3.5 w-48 rounded-full border border-white/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden" style={{ background: `linear-gradient(to right, ${gradientStops.join(", ")})` }} />
                              <p className="mt-2.5 text-xs text-[#c08aa4]">{language === "vi" ? "Chuyển màu mượt mà được áp dụng trên tất cả các ngón tay." : "Smooth color blend applied uniformly across all fingers."}</p>
                            </div>
                          </div>
                        );
                      } else if (
                        colorData?.mode === "perFinger" &&
                        Array.isArray(colorData?.fingers)
                      ) {
                        return (
                          <div className="space-y-6 w-full">
                            <div className="flex items-center justify-between border-b border-[#fcd5e6]/50 pb-2">
                              <div>
                                <span className="inline-flex rounded-full bg-[#fdf2f8] px-3 py-1 text-[10px] font-bold text-[#db2777] uppercase tracking-wider">
                                  {language === "vi" ? "Màu sắc riêng cho từng ngón tay" : "Per-Finger Custom Palette"}
                                </span>
                                <p className="mt-1 text-xs text-[#c08aa4]">{language === "vi" ? "Mỗi ngón tay có thiết kế màu sắc hoặc gradient riêng. Bấm vào thẻ để sao chép mã màu." : "Each finger has its own unique color or gradient design. Click any card to copy its color code."}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                              {colorData.fingers.map((finger, index) => {
                                const fingerName = getFingerName(finger.fingerIndex || index + 1);
                                let fingerStyle = { backgroundColor: '#f3f4f6' };
                                let colorLabel = "N/A";
                                const isGradient = finger.mode === 'gradient' || (finger.gradient && finger.gradient.enabled);
                                let primaryColor = '#faf4f6';
                                let secondaryColor = null;

                                if (finger.mode === 'gradient' && finger.primaryColor && finger.secondaryColor) {
                                  fingerStyle = { background: `linear-gradient(to top, ${finger.primaryColor}, ${finger.secondaryColor})` };
                                  colorLabel = `${finger.primaryColor} → ${finger.secondaryColor}`;
                                  primaryColor = finger.primaryColor;
                                  secondaryColor = finger.secondaryColor;
                                } else if (finger.gradient && finger.gradient.enabled && Array.isArray(finger.gradient.stops) && finger.gradient.stops.length > 0) {
                                  fingerStyle = { background: `linear-gradient(to top, ${finger.gradient.stops.join(', ')})` };
                                  colorLabel = finger.gradient.stops.join(' → ');
                                  primaryColor = finger.gradient.stops[0];
                                  secondaryColor = finger.gradient.stops[1] || finger.gradient.stops[0];
                                } else {
                                  const solidColor = finger.color || finger.primaryColor || '#f3f4f6';
                                  fingerStyle = { backgroundColor: solidColor };
                                  colorLabel = solidColor;
                                  primaryColor = solidColor;
                                }

                                return (
                                  <div
                                    key={finger.fingerIndex || index}
                                    onClick={() => copyToClipboard(colorLabel)}
                                    style={{
                                      background: isGradient
                                        ? `linear-gradient(135deg, ${primaryColor}14 0%, ${(secondaryColor || primaryColor)}0a 100%)`
                                        : `linear-gradient(180deg, ${primaryColor}0d 0%, ${primaryColor}04 100%)`,
                                      borderColor: `${primaryColor}38`,
                                    }}
                                    className="group/card relative flex flex-col items-center gap-4 rounded-3xl border p-5 shadow-[0_8px_20px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] cursor-pointer"
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = primaryColor;
                                      e.currentTarget.style.backgroundColor = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = `${primaryColor}38`;
                                      e.currentTarget.style.background = isGradient
                                        ? `linear-gradient(135deg, ${primaryColor}14 0%, ${(secondaryColor || primaryColor)}0a 100%)`
                                        : `linear-gradient(180deg, ${primaryColor}0d 0%, ${primaryColor}04 100%)`;
                                    }}
                                  >
                                    {/* Mini Nail Preview inside a glowing showcase pedestal */}
                                    <div className="relative flex items-center justify-center p-3 rounded-2xl bg-white/40 border border-white/60 shadow-inner w-20 h-28 shrink-0 transition-all duration-300 group-hover/card:bg-white/90 group-hover/card:shadow-md">
                                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[#ea4f93]/10" />
                                      {renderNailTip(fingerStyle, nail?.nailShape?.name, "w-10 h-16")}
                                    </div>

                                    <div className="text-center min-w-0 w-full">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3f2240]">{fingerName}</p>

                                      {isGradient ? (
                                        <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                                          <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full border border-[#f5cee1] shadow-sm shrink-0">
                                            <span className="h-2 w-2 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: primaryColor }} />
                                            <span className="text-[9px] font-extrabold text-[#5c3b5d] font-mono">{primaryColor}</span>
                                          </span>
                                          <span className="text-[9px] text-[#c08aa4] font-bold">→</span>
                                          <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full border border-[#f5cee1] shadow-sm shrink-0">
                                            <span className="h-2 w-2 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: secondaryColor }} />
                                            <span className="text-[9px] font-extrabold text-[#5c3b5d] font-mono">{secondaryColor}</span>
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="mt-2.5 flex items-center justify-center">
                                          <span className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-full border border-[#f5cee1] shadow-sm">
                                            <span className="h-2 w-2 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: primaryColor }} />
                                            <span className="text-[9px] font-extrabold text-[#5c3b5d] font-mono">{primaryColor}</span>
                                          </span>
                                        </div>
                                      )}

                                      <span className="mt-2 inline-block text-[8px] font-bold text-[#c08aa4] opacity-0 group-hover/card:opacity-100 transition-opacity">Copy Code</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {
                      console.error("Failed to parse custom color:", e);
                    }

                    return (
                      <div className="flex items-center gap-2 text-xs text-[#c08aa4]">
                        <ImageIcon size={12} />
                        <span>{language === "vi" ? "Không thể cấu hình màu" : "Color configuration unavailable"}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Procedure Checklist Builder (Read-Only) */}
          {(nail?.status === "Reviewed" || nail?.status === "Approved") && (
            <div className="space-y-4">
              <SectionHeading
                title={language === "vi" ? "Chi tiết các bước thực hiện" : "Procedure Checklist Builder"}
                subtitle={language === "vi" ? "Các bước kỹ thuật và chi tiết do thợ đánh giá." : "Technical steps and details estimated by the artist."}
              />
              <ProcedureBuilderSection
                nail={nail}
                procedures={procedures}
                setProcedures={setProcedures}
                readOnly={true}
              />
            </div>
          )}

          {/* Reject Reason */}
          {
            nail?.rejectReason && (
              <div className="space-y-4">
                <SectionHeading
                  title={language === "vi" ? "Lý do từ chối" : "Reject Reason"}
                  subtitle={language === "vi" ? "Phản hồi cuối cùng của quản lý cho yêu cầu này." : "Latest manager feedback for this request."}
                />
                <div className="rounded-[24px] border border-[#f4b8cb] bg-[linear-gradient(180deg,#fff1f5_0%,#ffe7ef_100%)] p-5 shadow-[0_10px_24px_rgba(225,68,127,0.08)]">
                  <p className="text-sm text-[#e1447f]">{nail.rejectReason}</p>
                </div>
              </div>
            )
          }


          {/* Assigned Staff Info - Show if staff already assigned */}
          {
            nail?.assignedStaff && (
              <div className="space-y-4">
                <SectionHeading
                  title={language === "vi" ? "Thợ được phân công & Năng lực" : "Assigned Artist & Capabilities"}
                  subtitle={language === "vi" ? "Chi tiết về thợ hiện tại và kỹ năng của họ." : "Current artist details and their skills."}
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

                  {/* Right: Real Skill Matrix */}
                  <div className="rounded-[24px] border border-[#f5cee1] bg-white p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-[#fde7f3] pb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#b87c9b] flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[#ea4f93]" />
                        {language === "vi" ? "Kỹ năng & Năng lực của nghệ sĩ" : "Artist Skills & Capabilities"}
                      </span>
                    </div>

                    {assignedStaffSkills && assignedStaffSkills.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {assignedStaffSkills.map((skill) => (
                          <div key={skill.nailArtistSkillId || skill.skillTypeName} className="flex items-center justify-between rounded-2xl bg-[#fffafb] border border-[#fbe5ee] p-3 shadow-[0_4px_12px_rgba(236,72,153,0.02)]">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#ea4f93]" />
                              <span className="text-xs font-bold text-[#553b4b]">{skill.skillTypeName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-3.5 w-3.5 ${i < skill.level ? 'text-[#ea4f93] fill-[#ea4f93]' : 'text-gray-200 fill-gray-200'}`}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-[#c08aa4]">
                        {language === "vi" ? "Không có dữ liệu kỹ năng cho nghệ sĩ này." : "No skills data available for this artist."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </Card >

      {/* Reject Modal */}
      < Modal
        title={null}
        open={isRejectModalOpen}
        onOk={handleManagerReject}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectReason("");
        }
        }
        confirmLoading={isSubmitting}
        okText={language === "vi" ? "Từ chối" : "Reject"}
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
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
              <h3 className="text-xl font-extrabold text-[#402542]">{language === "vi" ? "Từ chối yêu cầu làm nail của khách hàng" : "Reject Customer Nail"}</h3>
              <p className="mt-1 text-sm text-[#b35f82]">
                {language === "vi" ? "Đưa ra lý do rõ ràng để lần sửa tiếp theo dễ xử lý hơn." : "Give the customer a clear reason so the next revision is easier to handle."}
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-6 space-y-4 rounded-[28px] bg-white px-6 pb-6 pt-6">
          <div className="rounded-2xl border border-[#f7d8e4] bg-[#fffafb] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
              {language === "vi" ? "Lý do từ chối" : "Reject Reason"}
            </p>
            <p className="mb-3 text-sm text-[#6f5568]">
              {language === "vi" ? "Giải thích những gì cần điều chỉnh trước khi yêu cầu này có thể tiếp tục." : "Explain what needs to be adjusted before this request can move forward."}
            </p>
          </div>
          <Input.TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={language === "vi" ? "Nhập lý do từ chối" : "Enter reject reason"}
            rows={5}
            className="mt-2"
          />
        </div>
      </Modal >

      {/* Approve Quote Modal */}
      < Modal
        title={null}
        open={isApproveModalOpen}
        onOk={handleManagerApproveQuote}
        onCancel={() => {
          setIsApproveModalOpen(false);
          setFinalPrice("");
          setFinalDuration("");
        }}
        confirmLoading={isSubmitting}
        okText={language === "vi" ? "Xác nhận" : "Confirm"}
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
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
              <h3 className="text-xl font-extrabold text-[#31543f]">{language === "vi" ? "Xác nhận báo giá" : "Confirm Quote"}</h3>
              <p className="mt-1 text-sm text-[#5d8b70]">
                {language === "vi" ? "Nhập chi tiết báo giá cuối cùng đã được phê duyệt cho thiết kế tùy chỉnh này." : "Enter the final approved quote details for this custom design."}
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-6 space-y-4 rounded-[28px] bg-white px-6 pb-6 pt-6">
          <div className="rounded-2xl border border-[#d8efdf] bg-[#f8fffa] p-4">
            <p className="text-sm text-[#496455]">
              {language === "vi" ? "Cung cấp giá cuối cùng và thời lượng dự kiến mà khách hàng sẽ thấy." : "Provide the final price and expected duration that the customer will see."}
            </p>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">
              {language === "vi" ? "Giá cuối cùng" : "Final Price"}
            </p>
            <Input
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder={language === "vi" ? "Nhập giá cuối cùng" : "Enter final price"}
            />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">
              {language === "vi" ? "Thời lượng cuối cùng (phút)" : "Final Duration (minutes)"}
            </p>
            <Input
              type="number"
              value={finalDuration}
              onChange={(e) => setFinalDuration(e.target.value)}
              placeholder={language === "vi" ? "Nhập thời lượng" : "Enter final duration"}
            />
          </div>
        </div>
      </Modal >

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
              <h3 className="text-xl font-extrabold text-[#5a3821]">{language === "vi" ? "Giao nhiệm vụ cho nghệ sĩ" : "Assign Staff First"}</h3>
              <p className="mt-1 text-sm text-[#9a6a40]">
                {language === "vi" ? "Bạn cần giao nhiệm vụ cho nghệ sĩ trước khi phê duyệt yêu cầu làm nail của khách hàng." : "You need to assign a staff artist before approving this customer nail request."}
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-6 rounded-[28px] bg-white px-6 pb-6 pt-6">
          <div className="rounded-2xl border border-[#f5ddbd] bg-[#fffaf2] p-4">
            <p className="text-sm text-[#6f5568]">
              {language === "vi" ? "Vui lòng giao nhiệm vụ cho nghệ sĩ phù hợp để yêu cầu được xem xét và xử lý đúng cách." : "Please assign the appropriate staff artist so the request can be reviewed and handled correctly."}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsAssignRequiredModalOpen(false)}
              className="flex-1 rounded-full border border-[#f4c1d8] bg-white px-5 py-3 text-sm font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
            >
              {language === "vi" ? "Đóng" : "Close"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAssignRequiredModalOpen(false);
                handleOpenAssignModal();
              }}
              className="flex-1 rounded-full bg-[#ea4f93] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.18)] transition hover:bg-[#df4588]"
            >
              {language === "vi" ? "Chỉ định thợ ngay" : "Assign Staff Now"}
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
        okText={language === "vi" ? "Xác nhận" : "Confirm"}
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
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
              <h3 className="text-xl font-extrabold text-[#402542]">{language === "vi" ? "Giao nhiệm vụ cho nghệ sĩ" : "Assign Staff Artist"}</h3>
              <p className="mt-1 text-sm text-[#b06484]">
                {language === "vi" ? "Chọn nghệ sĩ phù hợp nhất để chịu trách nhiệm cho yêu cầu này." : "Choose the best staff artist to take ownership of this request."}
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-6 rounded-[28px] bg-white px-6 pb-6 pt-6">
          <div className="mb-4 rounded-2xl border border-[#f6d8e6] bg-[#fffafb] p-4">
            <p className="text-sm text-[#6f5568]">
              {language === "vi" ? "Duyệt qua các nghệ sĩ có sẵn bên dưới. Hồ sơ được chọn sẽ được giao ngay sau khi xác nhận." : "Browse the available staff below. The selected profile will be assigned immediately after confirmation."}
            </p>
            {selectedStaff ? (
              <p className="mt-2 text-sm font-semibold text-[#ea4f93]">
                {language === "vi" ? "Đã chọn: " : "Selected: "}{selectedStaffName}
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
                <p className="text-sm text-[#c08aa4]">{language === "vi" ? "Không có nghệ sĩ nào" : "No staff available."}</p>
              ) : (
                staffList.map((staff) => {
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

                          {/* Real skills display */}
                          {staff.skills && staff.skills.length > 0 ? (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {staff.skills.map((sk) => (
                                <span
                                  key={sk.nailArtistSkillId || sk.skillTypeName}
                                  className="inline-flex items-center gap-0.5 rounded-full bg-[#fdf2f8] border border-[#fbe5ee] px-2 py-0.5 text-[9px] font-extrabold text-[#db2777] shadow-[0_2px_6px_rgba(219,39,119,0.02)]"
                                >
                                  {sk.skillTypeName}: {sk.level}★
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2.5 text-[9px] italic text-[#c08aa4]">
                              {language === "vi" ? "Không có kỹ năng nào" : "No skills registered"}
                            </div>
                          )}

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
    </div >
  );
}

