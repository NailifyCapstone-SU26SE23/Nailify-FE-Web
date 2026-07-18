import { Spin, Alert, DatePicker, Pagination, ConfigProvider, Modal } from "antd";
import { Palette, Heart, Eye, Calendar, CheckCircle2, XCircle, RefreshCw, Sparkles, Clock3, ArrowRight, Timer, CircleDollarSign } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchCustomerNails } from "../services/customerNailsService";

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
          <p className="mt-2.5 text-3xl font-black text-[#402542]">{value}</p>
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
    <div className="group relative overflow-hidden rounded-[28px] border border-[#f6d4e3]/60 bg-gradient-to-br from-white via-white to-[#fffafc] p-6 shadow-[0_12px_32px_rgba(236,72,153,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#ea4f93] hover:shadow-[0_24px_50px_rgba(236,72,153,0.12)]">
      {/* Horizontal Layout: Preview LEFT | Info RIGHT */}
      <div className="flex gap-6">
        {/* 🎨 LEFT: Large Nail Preview */}
        <div className="relative h-[200px] w-[140px] shrink-0 overflow-hidden rounded-[24px] border border-[#f8dce9] bg-gradient-to-b from-[#fffbfd] to-[#fff5f9] shadow-[0_8px_20px_rgba(236,72,153,0.06)] transition-all duration-500 group-hover:border-[#ea4f93]/40 group-hover:shadow-[0_16px_36px_rgba(236,72,153,0.12)] group-hover:scale-[1.02]">
          {/* Soft shadow beneath */}
          <div className="absolute -bottom-2 left-1/2 h-3 w-[70%] -translate-x-1/2 rounded-full bg-[#ea4f93]/15 blur-md" />
          
          {nail.imageUrl ? (
            <img
              src={nail.imageUrl}
              alt={nail.name}
              className="pointer-events-none h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : nail.nailShape?.imageUrl ? (
            <>
              {/* Base color layer */}
              <div className="absolute inset-0 h-full w-full" style={{ ...maskStyle, ...cardColorStyle }} />
              
              {/* 🎨 Surface Effects from Backend Config - Clipped strictly to nail shape */}
              <div className="absolute inset-0 h-full w-full overflow-hidden" style={maskStyle}>
                {renderSurfaceEffects(nail.nailSurface?.name, nail.nailSurface?.shaderParam)}
              </div>
              
              {/* Shape mask overlay */}
              <img
                src={nail.nailShape.imageUrl}
                alt={nail.name}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-85"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-2xl font-black uppercase text-white shadow-inner">
              {initials}
            </div>
          )}
        </div>

        {/* 📝 RIGHT: Info Section */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header: Title + Icons */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-2 text-xl font-black leading-snug text-[#3f2240] transition-colors duration-300 group-hover:text-[#ea4f93]">
                {nail.name || "Untitled Design"}
              </h4>
              <p className="mt-1 text-xs font-semibold text-[#a988a0]">
                {nail.nailShape?.name || "Custom Shape"} • {nail.nailSurface?.name || "Custom Surface"}
              </p>
              {renderMiniPalette()}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {nail.isFavorite && <Heart size={18} className="fill-[#ea4f93] text-[#ea4f93] transition-transform duration-300 hover:scale-125" />}
              {nail.isPublic && <Eye size={18} className="text-[#9c6f87]" />}
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-3.5 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${
              nail.status === "PendingReview" ? "bg-amber-400 animate-pulse" :
              nail.status === "Approved" ? "bg-emerald-400" :
              nail.status === "Rejected" ? "bg-rose-400" :
              "bg-indigo-400"
            }`} />
            <p className="text-[10px] font-black uppercase tracking-wider text-[#9b7b92]">{getStatusMessage(nail.status)}</p>
          </div>

          {/* Stats with Icons (3 columns) */}
          <div className="mt-4.5 rounded-2xl bg-[#fffbfd]/60 border border-[#fbdde9]/45 p-3 grid grid-cols-3 gap-2.5">
            {/* Price */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/60 shadow-sm">
                <CircleDollarSign size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">Price</p>
                <p className="truncate text-xs font-black text-[#ea4f93]">{formatVND(nail.price, nail.status)}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100/60 shadow-sm">
                <Timer size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">Duration</p>
                <p className="truncate text-xs font-black text-[#3f2240]">{formatDuration(nail.duration, nail.status)}</p>
              </div>
            </div>

            {/* Created */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100/60 shadow-sm">
                <Calendar size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">Created</p>
                <p className="truncate text-xs font-black text-[#3f2240]">{formatDate(nail.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Bottom: Tags + View Details Button */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <div className="flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${getStatusTone(nail.status)}`}>
                {nail.status === "Approved" ? <CheckCircle2 size={10} /> : nail.status === "Rejected" ? <XCircle size={10} /> : <Calendar size={10} />}
                {nail.status || "Draft"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${isPreset ? "bg-[#e7ecff] text-[#4755b8]" : "bg-[#fef3c7] text-[#d97706]"}`}>
                {isPreset ? "Preset" : "Custom"}
              </span>
            </div>

            {/* CTA Div wrapper */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3f2240] to-[#2b162c] px-5 py-2 text-xs font-bold text-white shadow-md transition-all duration-300 group-hover:from-[#ea4f93] group-hover:to-[#ff75b5] group-hover:shadow-[0_10px_20px_rgba(234,79,147,0.25)] group-hover:scale-105">
              View details
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>

          {/* Reject Reason if exists */}
          {nail.rejectReason && (
            <p className="mt-2 truncate text-xs font-medium text-[#e1447f]">
              Rejected: {nail.rejectReason}
            </p>
          )}
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
  const navigate = useNavigate();
  const [nails, setNails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPendingReviewModalOpen, setIsPendingReviewModalOpen] = useState(false);
  const [pendingReviewModalNail, setPendingReviewModalNail] = useState(null);
  const itemsPerPage = 4; // 2 per row, 2 rows max

  const seenPendingReviewIdsRef = useRef(new Set());
  const hasInitializedPendingReviewRef = useRef(false);
  const modalTimerRef = useRef(null);

  const normalizeStatusKey = useCallback((status) => {
    return String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "");
  }, []);

  const isPendingReviewStatus = useCallback((status) => {
    return normalizeStatusKey(status) === "pendingreview";
  }, [normalizeStatusKey]);

  const openPendingReviewModal = useCallback((nail) => {
    setPendingReviewModalNail(nail);
    setIsPendingReviewModalOpen(true);

    if (modalTimerRef.current) {
      window.clearTimeout(modalTimerRef.current);
    }

    modalTimerRef.current = window.setTimeout(() => {
      setIsPendingReviewModalOpen(false);
    }, 3000);
  }, []);

  const loadCustomerNails = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");
      const data = await fetchCustomerNails();
      const nextNails = data || [];
      setNails(nextNails);

      const pendingNails = nextNails.filter((item) => isPendingReviewStatus(item?.status));
      const pendingIds = pendingNails
        .map((item) => String(item?.customerNailId || item?.id || "").trim())
        .filter(Boolean);

      if (!hasInitializedPendingReviewRef.current) {
        pendingIds.forEach((id) => seenPendingReviewIdsRef.current.add(id));
        hasInitializedPendingReviewRef.current = true;
        return;
      }

      pendingNails.forEach((item) => {
        const id = String(item?.customerNailId || item?.id || "").trim();
        if (!id) return;
        if (seenPendingReviewIdsRef.current.has(id)) return;

        seenPendingReviewIdsRef.current.add(id);
        openPendingReviewModal(item);
      });
    } catch (err) {
      console.error("Failed to load customer nails:", err);
      setError(err.message || "Failed to load customer nails.");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [isPendingReviewStatus, openPendingReviewModal]);

  useEffect(() => {
    Promise.resolve().then(() => loadCustomerNails());
  }, [loadCustomerNails]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadCustomerNails({ silent: true });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [loadCustomerNails]);

  useEffect(() => {
    return () => {
      if (modalTimerRef.current) {
        window.clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

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
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNails.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNails, currentPage]);

  const summaryStats = useMemo(() => {
    const pendingReviewCount = nails.filter((nail) => isPendingReviewStatus(nail.status)).length;
    const approvedCount = nails.filter((nail) => nail.status === "Approved").length;
    const reviewedCount = nails.filter((nail) => nail.status === "Reviewed").length;
    const rejectedCount = nails.filter((nail) => nail.status === "Rejected").length;

    return [
      {
        title: "Total Designs",
        value: nails.length,
        note: "all customer requests",
        icon: Sparkles,
        toneClassName: "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]",
      },
      {
        title: "Pending Review",
        value: pendingReviewCount,
        note: "needs manager attention",
        icon: Clock3,
        toneClassName: "bg-gradient-to-br from-[#f5b455] to-[#db8520]",
      },
      {
        title: "Reviewed",
        value: reviewedCount,
        note: "waiting for final action",
        icon: Calendar,
        toneClassName: "bg-gradient-to-br from-[#7c8cff] to-[#4755b8]",
      },
      {
        title: "Approved",
        value: approvedCount,
        note: "confirmed by manager",
        icon: CheckCircle2,
        toneClassName: "bg-gradient-to-br from-[#5dd18d] to-[#2fa25f]",
      },
      {
        title: "Rejected",
        value: rejectedCount,
        note: "sent back with feedback",
        icon: XCircle,
        toneClassName: "bg-gradient-to-br from-[#f089ad] to-[#e1447f]",
      },
    ];
  }, [isPendingReviewStatus, nails]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCurrentPage(1); // Reset page when date changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of the grid when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="min-h-full">
        <Alert
          message="Error Loading Customer Nails"
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
        <Spin size="large" tip="Loading customer nails..." />
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
        <Card className="overflow-hidden border-none bg-gradient-to-br from-[#fff2f9] via-[#fffbfd] to-[#fff6fb] p-0 shadow-[0_18px_45px_rgba(236,72,153,0.08)]">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between relative">
            {/* Soft decorative background glow */}
            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-48 h-20 bg-pink-300/10 rounded-full blur-3xl pointer-events-none" />
            <div className="max-w-2xl relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_10px_22px_rgba(234,79,147,0.25)] transition-transform duration-500 hover:rotate-12">
                  <Palette size={22} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#402542] via-[#8a2f4c] to-[#ea4f93] bg-clip-text text-transparent">Customer Nails</h2>
                  <p className="text-xs font-semibold text-[#b07a94] mt-0.5">Manage customer nail designs and monitor new requests in real time.</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-[#8f6b80] font-medium max-w-xl">
                The page refreshes automatically every 3 seconds so managers can catch new custom design submissions as soon as they arrive.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end relative z-10">
              <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-extrabold transition shadow-sm ${isRefreshing
                ? "bg-white text-[#ea4f93] border border-pink-100 shadow-[0_8px_18px_rgba(234,79,147,0.12)]"
                : "bg-white/80 text-[#9b7b8f] border border-transparent"
                }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? "bg-pink-500 animate-ping" : "bg-emerald-500"}`} />
                <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Refreshing..." : "Auto refresh: Active"}
              </div>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                placeholder="Filter by date"
                allowClear
                className="h-11 min-w-[220px] rounded-full border border-[#f5d0e4] bg-white/90 text-xs text-[#5c4158] outline-none transition placeholder:text-[#d198b0] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/20 shadow-sm"
                suffixIcon={<Calendar size={16} className="text-[#c08aa4]" />}
              />
            </div>
          </div>
          <div className="grid gap-4 border-t border-pink-100/30 bg-white/30 p-6 sm:grid-cols-2 xl:grid-cols-5">
            {summaryStats.map((item) => (
              <StatCard key={item.title} {...item} />
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-[#f6dce7] p-6">
            <SectionHeading
              title="All Customer Nails"
              subtitle={`${filteredNails.length} designs${selectedDate ? " (filtered by selected date)" : " available in the current salon workspace"}`}
            />
          </div>

          <div className="p-6">
            {filteredNails.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#f2c7da] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] py-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f8]">
                  <Palette size={32} className="text-[#ea4f93]" />
                </div>
                <p className="text-sm text-[#c08aa4]">
                  {selectedDate ? "No customer nails found for selected date" : "No customer nails found"}
                </p>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="mt-4 rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-6 py-2.5 text-xs font-bold text-[#ea4f93] hover:bg-[#fff0f8]"
                  >
                    Clear date filter
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  {paginatedNails.map((nail) => (
                    <Link
                      key={nail.customerNailRequestId || nail.customerNailId || nail.id}
                      to={`${ROUTES.managerCustomerNails}/${nail.customerNailRequestId || nail.customerNailId || nail.id}`}
                      className="block"
                    >
                      <CustomerNailCard nail={nail} />
                    </Link>
                  ))}
                </div>
                {filteredNails.length > itemsPerPage && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      current={currentPage}
                      pageSize={itemsPerPage}
                      total={filteredNails.length}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper={false}
                      showTotal={(total) => `Total ${total} items`}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Modal
          open={isPendingReviewModalOpen}
          footer={null}
          closable={false}
          centered
          destroyOnClose
          onCancel={() => setIsPendingReviewModalOpen(false)}
          styles={{
            content: { padding: 0, borderRadius: 28, overflow: "hidden", maxWidth: 460 },
            body: { padding: 0 },
            mask: { backdropFilter: "blur(8px)", background: "rgba(64, 37, 66, 0.28)" },
          }}
        >
          <div className="bg-[linear-gradient(135deg,#fff0f8_0%,#ffeaf4_100%)] px-6 pb-10 pt-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_12px_24px_rgba(234,79,147,0.28)]">
              <Sparkles size={24} />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-xl font-extrabold text-[#402542]">New Pending Review Request</h3>
              <p className="mt-2 text-sm text-[#a46a87]">
                A new customer nail request needs manager attention.
              </p>
            </div>
          </div>
          <div className="-mt-6 rounded-[28px] bg-white px-6 pb-6 pt-6">
            <div className="rounded-[22px] border border-[#f5d4e3] bg-[linear-gradient(180deg,#fffafb_0%,#fff6fa_100%)] p-5 text-center shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Design Name</p>
              <p className="mt-2 text-lg font-extrabold text-[#3f2240]">
                {pendingReviewModalNail?.name || "Untitled Design"}
              </p>
              <p className="mt-2 text-sm text-[#8d6d80]">
                This modal closes automatically in about 3 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const id = pendingReviewModalNail?.customerNailRequestId || pendingReviewModalNail?.customerNailId || pendingReviewModalNail?.id;
                setIsPendingReviewModalOpen(false);
                if (id) {
                  navigate(`${ROUTES.managerCustomerNails}/${id}`);
                }
              }}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#ea4f93] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.18)] transition hover:bg-[#df4588]"
            >
              Open Request
            </button>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
}

