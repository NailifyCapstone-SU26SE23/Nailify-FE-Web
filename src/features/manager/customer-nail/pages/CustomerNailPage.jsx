import { Spin, Alert, DatePicker, Pagination, ConfigProvider, Select } from "antd";
import toast from "react-hot-toast";
import { Palette, Heart, Eye, Calendar, CheckCircle2, XCircle, Sparkles, Clock3, ArrowRight, Timer, CircleDollarSign } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchCustomerNails, getManagerSalonId } from "../services/customerNailsService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[24px] border border-[#f8deea] shadow-[0_12px_28px_rgba(236,72,153,0.06)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_18px_38px_rgba(236,72,153,0.1)] ${className}`}
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

// 🎨 Parse & render surface effects from config JSON (Backend format)
function renderSurfaceEffects(surfaceName, effectsConfigJson) {
  const name = (surfaceName || "glossy").toLowerCase();

  // Parse config JSON
  let config = {};
  try {
    config = typeof effectsConfigJson === 'string'
      ? JSON.parse(effectsConfigJson)
      : effectsConfigJson || {};
  } catch (e) {
    console.warn("Failed to parse surface config:", e);
    config = {};
  }

  // 🐛 DEBUG: Log surface config
  console.log("🎨 Surface Debug:", {
    name,
    effectsConfigJson,
    parsedConfig: config
  });

  // 🪞 CHROME / MIRROR - Ultra metallic
  if (name.includes("chrome") || name.includes("mirror") || name.includes("tráng gương")) {
    // Backend format: {"reflectivity":0.9, "metallic":1.0}
    const reflectivity = config.reflectivity || 0.9;
    const metallic = config.metallic || 1.0;

    return (
      <>
        {/* Intense metallic gradient */}
        <div
          className="pointer-events-none absolute inset-0 h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0.15)_40%,rgba(0,0,0,0.25)_65%,rgba(255,255,255,0.5)_100%)] mix-blend-overlay"
          style={{ opacity: reflectivity }}
        />

        {/* Chrome highlight - left side */}
        <div
          className="pointer-events-none absolute left-3 top-4 h-[55%] w-3.5 rounded-full bg-gradient-to-b from-white via-white/85 to-transparent blur-[0.4px]"
          style={{ opacity: metallic * 0.95 }}
        />

        {/* Metallic gleam - center */}
        <div
          className="pointer-events-none absolute left-1/2 top-6 h-[45%] w-[1.5px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/80 via-white/40 to-transparent blur-[0.2px]"
          style={{ opacity: metallic * 0.9 }}
        />

        {/* Mirror reflection - right */}
        <div
          className="pointer-events-none absolute right-2.5 top-8 h-[38%] w-1.5 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[0.7px]"
          style={{ opacity: reflectivity * 0.8 }}
        />
      </>
    );
  }

  // 🌈 HOLOGRAPHIC - Rainbow prism effect
  if (name.includes("holographic") || name.includes("holo")) {
    const intensity = config.intensity || 0.85;
    return (
      <>
        {/* Full rainbow - solid hsl colors with opacity on element */}
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
        {/* Iridescent shimmer */}
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
            filter: 'blur(5px)',
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

  // 😺 CAT EYE - Magnetic stripe effect
  if (name.includes("cat") || name.includes("cateye") || name.includes("cat-eye")) {
    // Backend format: {"streak":0.8,"angle":90}
    const streak = config.streak || 0.8;
    const angle = config.angle || 90;

    return (
      <>
        {/* Base glossy */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-white/8 to-black/10 mix-blend-overlay" />

        {/* Cat eye magnetic stripe */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white to-transparent"
          style={{
            opacity: streak * 0.5,
            filter: `blur(4px)`,
            transform: `translate(-50%, -50%) rotate(${angle}deg)`
          }}
        />

        {/* Side reflections */}
        <div
          className="pointer-events-none absolute left-4 top-6 h-[50%] w-1.5 rounded-full bg-white/40 blur-[0.8px]"
          style={{ opacity: streak * 0.6 }}
        />
        <div
          className="pointer-events-none absolute right-4 top-8 h-[45%] w-1.5 rounded-full bg-white/30 blur-[1px]"
          style={{ opacity: streak * 0.5 }}
        />
      </>
    );
  }

  // 🎭 MATTE - Soft diffused finish
  if (name.includes("matte") || name.includes("nhám")) {
    // Backend format: {"opacity":0.12,"blur":0}
    const opacity = config.opacity || 0.12;
    const blur = config.blur || 0;

    return (
      <>
        {/* Matte diffusion */}
        <div
          className="pointer-events-none absolute inset-0 h-full w-full bg-white/22 backdrop-blur-[1px]"
          style={{ opacity: Math.max(0.8, opacity * 7) }} // Scale up opacity
        />

        {/* Minimal ambient highlight */}
        <div
          className="pointer-events-none absolute left-4 top-8 h-[28%] w-2 rounded-full bg-white/18"
          style={{
            opacity: opacity * 1.5,
            filter: blur > 0 ? `blur(${blur}px)` : 'blur(1.8px)'
          }}
        />
      </>
    );
  }

  // ✨ GLOSSY (Default) - Natural shine
  const shine = config.shine || 0.45;
  const blur = config.blur || 0;
  const effectiveBlur = Math.max(4, blur * 20);

  return (
    <>
      {/* 1️⃣ Dark base gradient - 3D depth, visible trên nền trắng */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(180,180,200,0.1) 40%, rgba(80,80,120,0.15) 75%, rgba(40,40,80,0.2) 100%)',
      }} />
      {/* 2️⃣ Main gloss blob */}
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
      {/* 5️⃣ Right reflection */}
      <div className="pointer-events-none absolute" style={{
        top: '18%', right: '8%', width: '22%', height: '42%',
        background: `radial-gradient(ellipse, rgba(255,255,255,${shine * 0.45}) 0%, transparent 70%)`,
        filter: `blur(${Math.max(3, effectiveBlur * 0.55)}px)`,
      }} />
      {/* 6️⃣ Bottom shadow - depth on white nails */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
        height: '35%',
        background: 'linear-gradient(to top, rgba(60,40,80,0.28) 0%, rgba(60,40,80,0.08) 60%, transparent 100%)',
      }} />
      {/* 7️⃣ Right edge shadow */}
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
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatVND(amount, status) {
  if (amount === null || amount === undefined || amount === 0) {
    if (status === "PendingReview" || status === "Assigned") {
      return "Pending Quote";
    }
    return "0 VND";
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
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

function getCardColorStyle(customColor) {
  if (!customColor) return { backgroundColor: '#fdf2f8' };
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
      return { backgroundColor: '#fdf2f8' };
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
      const firstFinger = parsed.fingers[0];
      if (firstFinger) {
        const allIdentical = parsed.fingers.every(f =>
          f.mode === firstFinger.mode &&
          f.color === firstFinger.color &&
          f.primaryColor === firstFinger.primaryColor &&
          f.secondaryColor === firstFinger.secondaryColor
        );

        if (allIdentical) {
          if (firstFinger.mode === 'gradient' && firstFinger.primaryColor && firstFinger.secondaryColor) {
            return { background: `linear-gradient(to top, ${firstFinger.primaryColor}, ${firstFinger.secondaryColor})` };
          } else if (firstFinger.gradient && firstFinger.gradient.enabled && Array.isArray(firstFinger.gradient.stops)) {
            return { background: `linear-gradient(to top, ${firstFinger.gradient.stops.join(', ')})` };
          }
          const solidColor = firstFinger.color || firstFinger.primaryColor;
          if (solidColor) return { backgroundColor: solidColor };
        }
      }

      // Support extracting the primary color of each finger or solid colors
      const colors = parsed.fingers.map(f => {
        if (f.mode === 'gradient' && f.primaryColor) {
          return f.primaryColor;
        }
        return f.color || f.primaryColor;
      }).filter(Boolean);

      if (colors.length > 0) {
        if (colors.length === 1) return { backgroundColor: colors[0] };
        return { background: `linear-gradient(to right, ${colors.join(', ')})` };
      }
    }
  } catch {
    return { backgroundColor: '#fdf2f8' };
  }
  return { backgroundColor: '#fdf2f8' };
}

function StatCard({ title, value, note, icon: Icon, toneClassName }) {
  return (
    <div className="group/stat rounded-[24px] border border-[#f6dce7] bg-white/95 p-5 shadow-[0_8px_30px_rgba(236,72,153,0.04)] backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-[#ea4f93] hover:shadow-[0_20px_35px_rgba(236,72,153,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#c08aa4]">{title}</p>
          <p className="mt-2.5 text-3xl font-bold text-[#402542]">{value}</p>
          <p className="mt-1.5 text-xs text-[#a07c90] group-hover/stat:text-[#ea4f93] transition-colors">{note}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover/stat:scale-110 group-hover/stat:rotate-6 ${toneClassName}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  note: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  toneClassName: PropTypes.string.isRequired,
};

function CustomerNailCard({ nail }) {
  const initials = nail.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "CN";
  const isPreset = nail.basedOnNailVariantId !== null;
  const cardColorStyle = getCardColorStyle(nail.customColor);

  const maskStyle = nail.nailShape?.imageUrl ? {
    maskImage: `url(${nail.nailShape.imageUrl})`,
    WebkitMaskImage: `url(${nail.nailShape.imageUrl})`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  } : {};

  const getStatusMessage = (status) => {
    switch (status) {
      case "PendingReview": return "Ready for manager review";
      case "Reviewed":
      case "Quoted": return "Ready for final decision";
      case "Approved": return "Approved for customer";
      case "Rejected": return "Needs revision";
      case "Assigned": return "Assigned to artist";
      default: return "Open request";
    }
  };

  const renderMiniPalette = () => {
    if (!nail.customColor) return null;
    try {
      const parsed = typeof nail.customColor === 'string'
        ? JSON.parse(nail.customColor)
        : nail.customColor;

      if (!parsed) return null;

      if (parsed.mode === 'solid' && parsed.color) {
        return (
          <div className="flex items-center gap-1.5 mt-2 bg-[#fff5f8]/80 px-2.5 py-1 rounded-full border border-[#fde8f1] w-fit">
            <span className="h-3 w-3 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: parsed.color }} />
            <span className="text-[10px] font-extrabold text-[#ea4f93] font-mono">{parsed.color}</span>
          </div>
        );
      }

      if (parsed.mode === 'gradient') {
        const stops = Array.isArray(parsed.gradient) ? parsed.gradient : (parsed.gradient?.stops || []);
        if (stops.length > 0) {
          return (
            <div className="flex items-center gap-1.5 mt-2 bg-[#fff5f8]/80 px-2.5 py-1 rounded-full border border-[#fde8f1] w-fit">
              <span className="h-3 w-3 rounded-full border border-white shadow-sm shrink-0" style={{ background: `linear-gradient(to right, ${stops.join(', ')})` }} />
              <span className="text-[10px] font-extrabold text-[#ea4f93] font-mono">Gradient</span>
            </div>
          );
        }
      }

      if (parsed.mode === 'perFinger' && Array.isArray(parsed.fingers)) {
        return (
          <div className="flex flex-col gap-1 mt-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">Color Theme</p>
            <div className="flex items-center gap-1">
              {parsed.fingers.slice(0, 5).map((finger, idx) => {
                let fingerBg = { backgroundColor: '#f3f4f6' };
                if (finger.mode === 'gradient' && finger.primaryColor && finger.secondaryColor) {
                  fingerBg = { background: `linear-gradient(to top, ${finger.primaryColor}, ${finger.secondaryColor})` };
                } else if (finger.gradient && finger.gradient.enabled && Array.isArray(finger.gradient.stops)) {
                  fingerBg = { background: `linear-gradient(to top, ${finger.gradient.stops.join(', ')})` };
                } else {
                  fingerBg = { backgroundColor: finger.color || finger.primaryColor || '#f3f4f6' };
                }
                return (
                  <div
                    key={idx}
                    className="h-3.5 w-3.5 rounded-full border border-white shadow-[0_2px_4px_rgba(0,0,0,0.06)] shrink-0 transition-transform duration-300 hover:scale-125"
                    style={fingerBg}
                    title={`Finger ${finger.fingerIndex || idx + 1}`}
                  />
                );
              })}
              <span className="text-[9px] font-extrabold text-[#ea4f93] ml-1">Per Finger</span>
            </div>
          </div>
        );
      }
    } catch (e) {
      console.warn("Failed to render mini palette:", e);
    }
    return null;
  };

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-[#fdf7f9] bg-white shadow-[0_8px_30px_rgba(236,72,153,0.04)] transition-all duration-500 hover:-translate-y-1 hover:rotate-1 hover:shadow-[0_20px_50px_rgba(236,72,153,0.15)]">
      {/* 🎨 TOP: Large Nail Preview */}
      <div className="relative h-[260px] w-full overflow-hidden bg-gradient-to-b from-[#fffbfd] to-[#fff5f9] perspective-1000">
        {/* Soft shadow beneath nail */}
        <div className="absolute -bottom-4 left-1/2 h-6 w-[70%] -translate-x-1/2 rounded-full bg-pink-200/50 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {nail.imageUrl ? (
          <img
            src={nail.imageUrl}
            alt={nail.name}
            className="pointer-events-none h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:-rotate-2"
          />
        ) : nail.nailShape?.imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center p-5 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-2 border border-gray-200 border-1 rounded-t-[24px]">
            <div className="relative h-full w-full max-w-[130px]">
              {/* Base color layer */}
              <div className="absolute inset-0 h-full w-full" style={{ ...maskStyle, ...cardColorStyle }} />
              {/* Surface Effects */}
              <div className="absolute inset-0 h-full w-full overflow-hidden" style={maskStyle}>
                {renderSurfaceEffects(nail.nailSurface?.name, nail.nailSurface?.shaderParam)}
              </div>
              {/* Shape mask overlay */}
              <img
                src={nail.nailShape.imageUrl}
                alt={nail.name}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain mix-blend-multiply opacity-85"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d4af37] to-[#c5a059] text-4xl font-serif text-white shadow-inner">
            {initials}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
          <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold shadow-sm backdrop-blur-md bg-white/90 ${getStatusTone(nail.status)}`}>
            {nail.status === "Approved" ? <CheckCircle2 size={10} /> : nail.status === "Rejected" ? <XCircle size={10} /> : <Calendar size={10} />}
            {nail.status || "Draft"}
          </span>
          <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold shadow-sm backdrop-blur-md bg-white/90 ${isPreset ? "text-[#4755b8]" : "text-[#d97706]"}`}>
            {isPreset ? "Preset" : "Custom"}
          </span>
        </div>
      </div>

      {/* 📝 BOTTOM: Info Section */}
      <div className="flex flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-1 text-lg font-serif font-bold text-[#3f2240] transition-colors duration-300 group-hover:text-[#ea4f93]">
              {nail.name || "Untitled Design"}
            </h4>
            <p className="mt-0.5 text-[11px] font-medium text-[#a988a0]">
              {nail.nailShape?.name || "Custom Shape"} • {nail.nailSurface?.name || "Custom Surface"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {nail.isFavorite && <Heart size={16} className="fill-[#d4af37] text-[#d4af37]" />}
            {nail.isPublic && <Eye size={16} className="text-[#a988a0]" />}
          </div>
        </div>

        <div className="mt-2">{renderMiniPalette()}</div>

        <div className="mt-4 flex items-center justify-between border-t border-[#fdf0f5] pt-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#c08aa4]">Price</p>
            <p className="mt-0.5 text-xs font-bold text-[#d4af37]">{formatVND(nail.price, nail.status)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#c08aa4]">Duration</p>
            <p className="mt-0.5 text-xs font-bold text-[#3f2240]">{formatDuration(nail.duration, nail.status)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

CustomerNailCard.propTypes = {
  nail: PropTypes.shape({
    customerNailId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    imageUrl: PropTypes.string,
    price: PropTypes.number,
    duration: PropTypes.number,
    createdAt: PropTypes.string,
    status: PropTypes.string,
    isFavorite: PropTypes.bool,
    isPublic: PropTypes.bool,
    rejectReason: PropTypes.string,
    nailShape: PropTypes.shape({ name: PropTypes.string }),
    nailSurface: PropTypes.shape({ name: PropTypes.string }),
  }).isRequired,
};

export function CustomerNailPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [nails, setNails] = useState([]);
  const [allNails, setAllNails] = useState([]); // for statistics calculations
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [metaData, setMetaData] = useState(null);
  const itemsPerPage = 12; // Masonry grid layout

  const seenPendingReviewIdsRef = useRef(new Set());
  const hasInitializedPendingReviewRef = useRef(false);

  const normalizeStatusKey = useCallback((status) => {
    return String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "");
  }, []);

  const isPendingReviewStatus = useCallback((status) => {
    return normalizeStatusKey(status) === "pendingreview";
  }, [normalizeStatusKey]);

  // Load global stats background fetch
  const loadStats = useCallback(async () => {
    try {
      const salonId = getManagerSalonId();
      const response = await fetchCustomerNails({ salonId, pageSize: 1000 });
      const items = response?.items || response || [];
      setAllNails(items);
    } catch (e) {
      console.warn("Failed to load global stats:", e);
    }
  }, []);

  const loadCustomerNails = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError("");

      const salonId = getManagerSalonId();

      // Set up parameters for /api/CustomerNailRequests
      const fetchParams = {
        salonId,
        status: filterStatus === "all" ? undefined : filterStatus,
      };

      // Since the API doesn't support date filtering, if date filter is active,
      // we fetch all items to filter client-side. Otherwise, we fetch paginated items.
      if (!selectedDate) {
        fetchParams.pageNumber = currentPage;
        fetchParams.pageSize = itemsPerPage;
      } else {
        fetchParams.pageSize = 1000;
      }

      const response = await fetchCustomerNails(fetchParams);

      let nextNails = [];
      let responseMetaData = null;

      if (response && response.items) {
        nextNails = response.items;
        responseMetaData = response.metaData;
      } else {
        nextNails = response || [];
      }

      setNails(nextNails);
      setMetaData(responseMetaData);

      // Notification check for new requests
      const pendingNails = nextNails.filter((item) => isPendingReviewStatus(item?.status));
      const pendingIds = pendingNails
        .map((item) => String(item?.customerNailId || item?.id || "").trim())
        .filter(Boolean);

      if (!hasInitializedPendingReviewRef.current) {
        pendingIds.forEach((id) => seenPendingReviewIdsRef.current.add(id));
        hasInitializedPendingReviewRef.current = true;
        return;
      }

      let newCount = 0;
      pendingNails.forEach((item) => {
        const id = String(item?.customerNailId || item?.id || "").trim();
        if (!id) return;
        if (seenPendingReviewIdsRef.current.has(id)) return;

        seenPendingReviewIdsRef.current.add(id);
        newCount++;
      });
      if (newCount > 0) {
        toast.success(`You have ${newCount} new request(s) awaiting review!`, {
          icon: '🔔',
          style: { borderRadius: '12px', background: '#3f2240', color: '#fff' }
        });
      }
    } catch (err) {
      console.error("Failed to load customer nails:", err);
      setError(err.message || "Failed to load customer nails.");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [currentPage, filterStatus, selectedDate, isPendingReviewStatus]);

  // Load nails on status, date, or page change
  useEffect(() => {
    loadCustomerNails();
  }, [loadCustomerNails]);

  // Load statistics independently on mount or initial list changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset page when filters change to prevent out of bounds
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, selectedDate]);

  // Filter nails by date
  const filteredNails = useMemo(() => {
    if (!selectedDate) {
      return nails;
    }

    return nails.filter(nail => {
      if (!nail.createdAt) return false;
      const nailDate = dayjs(nail.createdAt);
      return nailDate.isSame(selectedDate, "day");
    });
  }, [nails, selectedDate]);

  // Calculate paginated nails
  const paginatedNails = useMemo(() => {
    if (metaData && !selectedDate) {
      return filteredNails;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNails.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNails, currentPage, metaData, selectedDate]);

  // Calculate total items for pagination
  const totalItems = useMemo(() => {
    if (metaData && !selectedDate) {
      return metaData.totalItems || 0;
    }
    return filteredNails.length;
  }, [metaData, selectedDate, filteredNails.length]);

  const summaryStats = useMemo(() => {
    const activeNailsList = allNails.length > 0 ? allNails : nails;
    const pendingReviewCount = activeNailsList.filter((nail) => isPendingReviewStatus(nail.status)).length;
    const approvedCount = activeNailsList.filter((nail) => nail.status === "Approved").length;
    const reviewedCount = activeNailsList.filter((nail) => nail.status === "Reviewed").length;
    const rejectedCount = activeNailsList.filter((nail) => nail.status === "Rejected").length;

    return [
      {
        label: language === "vi" ? "Tổng yêu cầu thiết kế" : "Total Designs",
        value: activeNailsList.length,
        note: language === "vi" ? "Tất cả yêu cầu khách hàng" : "all customer requests",
        icon: Sparkles,
        color: "#ea4f93",
      },
      {
        label: language === "vi" ? "Chờ đánh giá" : "Pending Review",
        value: pendingReviewCount,
        note: language === "vi" ? "Cần sự chú ý của quản lý" : "needs manager attention",
        icon: Clock3,
        color: "#db8520",
      },
      {
        label: language === "vi" ? "Đã đánh giá" : "Reviewed",
        value: reviewedCount,
        note: language === "vi" ? "Chờ hành động cuối cùng" : "waiting for final action",
        icon: Calendar,
        color: "#4755b8",
      },
      {
        label: language === "vi" ? "Đã duyệt" : "Approved",
        value: approvedCount,
        note: language === "vi" ? "Xác nhận bởi quản lý" : "confirmed by manager",
        icon: CheckCircle2,
        color: "#2fa25f",
      },
      {
        label: language === "vi" ? "Đã từ chối" : "Rejected",
        value: rejectedCount,
        note: language === "vi" ? "Đã từ chối" : "sent back with feedback",
        icon: XCircle,
        color: "#e1447f",
      },
    ];
  }, [isPendingReviewStatus, allNails, nails, language]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="min-h-full">
        <Alert
          message={t("manager.common.error")}
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spin size="large" tip={t("manager.common.loading")} />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ea4f93',
          borderRadius: 16,
        },
      }}
    >
      <div className="flex min-h-full flex-col gap-5">
        <TopMetricsRow metrics={summaryStats} />

        <Card className="p-0">
          <div className="flex flex-col gap-4 border-b border-[#f6dce7] p-6 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              title={language === "vi" ? "Tất cả mẫu móng của khách hàng" : "All Customer Nails"}
              subtitle={language === "vi" ? `${totalItems} thiết kế${selectedDate ? " (lọc theo ngày)" : " có sẵn trong không gian làm việc hiện tại"}` : `${totalItems} designs${selectedDate ? " (filtered by selected date)" : " available in the current salon workspace"}`}
            />
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Select
                value={filterStatus}
                onChange={(value) => setFilterStatus(value)}
                className="h-9 min-w-[160px]"
                popupClassName="custom-select-pink-popup"
                options={[
                  { value: "all", label: language === "vi" ? "Tất cả trạng thái" : "All Status" },
                  { value: "Draft", label: "Draft" },
                  { value: "PendingReview", label: language === "vi" ? "Chờ duyệt" : "Pending Review" },
                  { value: "Assigned", label: language === "vi" ? "Đã phân thợ" : "Assigned" },
                  { value: "Reviewed", label: language === "vi" ? "Đã đánh giá" : "Reviewed" },
                  { value: "Quoted", label: language === "vi" ? "Đã báo giá" : "Quoted" },
                  { value: "Approved", label: language === "vi" ? "Đã duyệt" : "Approved" },
                  { value: "Rejected", label: language === "vi" ? "Đã từ chối" : "Rejected" },
                ]}
              />
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                placeholder={language === "vi" ? "Chọn ngày" : "Filter by date"}
                allowClear
                className="h-9 min-w-[200px] rounded-full border border-[#f5d0e4] bg-white/90 text-xs text-[#5c4158] outline-none transition placeholder:text-[#d198b0] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/20 shadow-sm"
                suffixIcon={<Calendar size={14} className="text-[#c08aa4]" />}
              />
            </div>
          </div>

          <div className="p-6">
            {filteredNails.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#f2c7da] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] py-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f8]">
                  <Palette size={32} className="text-[#ea4f93]" />
                </div>
                <p className="text-sm text-[#c08aa4]">
                  {selectedDate ? t("manager.bookings.noBookings") : t("manager.bookings.noBookings")}
                </p>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="mt-4 rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-6 py-2.5 text-xs font-bold text-[#ea4f93] hover:bg-[#fff0f8]"
                  >
                    {language === "vi" ? "Xóa bộ lọc ngày" : "Clear date filter"}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {paginatedNails.map((nail) => (
                    <div key={nail.customerNailRequestId || nail.customerNailId || nail.id}>
                      <Link
                        to={`${ROUTES.managerCustomerNails}/${nail.customerNailRequestId || nail.customerNailId || nail.id}`}
                        className="block h-full"
                      >
                        <CustomerNailCard nail={nail} />
                      </Link>
                    </div>
                  ))}
                </div>
                {totalItems > itemsPerPage && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      current={currentPage}
                      pageSize={itemsPerPage}
                      total={totalItems}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper={false}
                      showTotal={(total) => language === "vi" ? `Tổng ${total} mục` : `Total ${total} items`}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Modal removed */}
      </div>
    </ConfigProvider>
  );
}

