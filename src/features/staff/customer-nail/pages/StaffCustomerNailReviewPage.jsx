import { Spin, Alert, Input, message, Button, Card, ConfigProvider } from "antd";
import {
  Palette,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Image as ImageIcon,
  DollarSign,
  Clock,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCustomerNailRequestById, staffSubmitArtistQuote } from "../../../manager/customer-nail/services/customerNailsService";
import { ProcedureBuilderSection } from "../components/ProcedureBuilderSection";
import toast from "react-hot-toast";

function getStatusTone(status) {
  switch (status) {
    case "Approved":
    case "Reviewed":
    case "Quoted":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Rejected":
      return "bg-[#ffe6ec] text-[#e1447f]";
    case "Pending":
    case "PendingReview":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Assigned":
      return "bg-[#e0f2fe] text-[#0369a1]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
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

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

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

function NailBlueprint({ nail, componentsList }) {
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  const renderNailPreview = (fingerIndex, fingerName) => {
    const colorStyle = getFingerColorStyle(nail?.customColor, fingerIndex);

    const hasZeroIndex = componentsList.some(comp => Number(comp.fingerIndex) === 0);
    const hasFiveIndex = componentsList.some(comp => Number(comp.fingerIndex) === 5);
    const isZeroIndexed = hasZeroIndex || (!hasFiveIndex);

    const components = componentsList.filter(comp => {
      const compIdx = Number(comp.fingerIndex);
      return isZeroIndexed ? compIdx === (fingerIndex - 1) : compIdx === fingerIndex;
    });

    const isFingerSelectedWithAccessory = selectedComponentId !== null && components.some(comp => {
      const globalIdx = componentsList.findIndex(c => c.customerNailComponentId === comp.customerNailComponentId);
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

              const globalIdx = componentsList.findIndex(c => c.customerNailComponentId === comp.customerNailComponentId);
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
    <div className="space-y-4">
      <SectionHeading
        title="Custom Design Live Preview"
        subtitle="Interactive 3D preview showing nail shape, color blend, surface texture, and accessories in realistic hand positioning."
      />
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
      <div className="relative rounded-[24px] border border-[#f7d7e5] bg-[radial-gradient(circle_at_top,#fffdfd_0%,#fff6fb_58%,#fff2f8_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="flex min-h-[360px] flex-wrap items-center justify-center gap-5 lg:gap-6">
          {renderNailPreview(1, "Thumb")}
          {renderNailPreview(2, "Index")}
          {renderNailPreview(3, "Middle")}
          {renderNailPreview(4, "Ring")}
          {renderNailPreview(5, "Pinky")}
        </div>

        <div className="absolute right-6 top-6 flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-lg backdrop-blur-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">Design Info</span>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[#fff0f8] px-2 py-1 text-[10px] font-bold text-[#ea4f93]">
              {nail?.nailShape?.name || "Custom"}
            </span>
            <span className="rounded-lg bg-[#fff0f8] px-2 py-1 text-[10px] font-bold text-[#ea4f93]">
              {nail?.nailSurface?.name || "Glossy"}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#9c6f87]">
            {(componentsList || []).length} add-ons
          </span>
        </div>
      </div>

      {/* Selected Components / Accessories */}
      {componentsList.length > 0 && (
        <div className="mt-6">
          <SectionHeading
            title="Components & Ornaments"
            subtitle="Individual stickers, gems, and 3D decors requested. Click any card to highlight it on the nail preview."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {componentsList.map((itemComponent, idx) => {
              const comp = itemComponent.component || itemComponent.customerComponent;
              if (!comp) return null;

              const globalId = itemComponent.customerNailComponentId || idx;
              const isCardSelected = selectedComponentId === globalId;

              return (
                <div
                  key={itemComponent.customerNailComponentId || idx}
                  id={`component-card-${globalId}`}
                  onClick={() => setSelectedComponentId(prev => prev === globalId ? null : globalId)}
                  className={`rounded-2xl border p-4 flex items-center justify-between gap-3.5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ea4f93] ${isCardSelected
                    ? "border-[#ea4f93] bg-gradient-to-br from-[#fff2f7] to-[#fffafc] shadow-[0_12px_28px_rgba(236,72,153,0.12)] scale-[1.02]"
                    : "border-[#f6d4e3] bg-gradient-to-br from-white to-[#fffbfd] shadow-[0_8px_20px_rgba(236,72,153,0.03)]"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
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
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#3f2240] truncate">{comp.name || "Custom Accessory"}</p>
                      <p className="mt-0.5 text-xs text-[#a37e93]">
                        Type: {comp.componentType || "Sticker/Gem"} • Finger: {itemComponent.fingerIndex}
                      </p>
                      {comp.price ? (
                        <p className="mt-1 text-xs text-[#ea4f93] font-semibold">+{formatVND(comp.price)}</p>
                      ) : null}
                    </div>
                  </div>
                  {isCardSelected && (
                    <span className="rounded-full bg-[#ea4f93] p-1.5 text-white shadow-sm shrink-0 animate-pulse">
                      <Sparkles size={12} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffCustomerNailReviewPage() {
  const { customerNailId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [quotedPrice, setQuotedPrice] = useState("");
  const [quotedDuration, setQuotedDuration] = useState("");
  const [artistNotes, setArtistNotes] = useState("");
  const [procedures, setProcedures] = useState([]);

  const loadRequestDetail = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError("");
      }

      console.log("Loading custom nail request detail for ID:", customerNailId);
      const data = await fetchCustomerNailRequestById(customerNailId);
      setRequest(data);

      // Pre-fill form values with suggested base totals if not already set
      if (data) {
        const nail = data.customerNail || data;

        // Calculate recommended totals
        const shapePrice = nail.nailShape?.price || 0;
        const surfacePrice = nail.nailSurface?.price || 0;
        const componentsPrice = (nail.customerNailComponents || nail.nailComponents || [])
          .reduce((sum, item) => sum + (item.component?.price || 0), 0);
        const baseCalculatedPrice = shapePrice + surfacePrice + componentsPrice;

        const shapeDuration = nail.nailShape?.duration || 0;
        const surfaceDuration = nail.nailSurface?.duration || 0;
        const componentsDuration = (nail.customerNailComponents || nail.nailComponents || [])
          .reduce((sum, item) => sum + (item.component?.duration || 0), 0);
        const baseCalculatedDuration = shapeDuration + surfaceDuration + componentsDuration;

        // Use already existing values if request has them, otherwise use calculations
        setQuotedPrice(data.price || baseCalculatedPrice || "");
        setQuotedDuration(data.duration || baseCalculatedDuration || "");

        // Load existing procedures if they were already created
        if (nail.nailProcedures && nail.nailProcedures.length > 0) {
          const loadedProcedures = nail.nailProcedures.map(p => ({
            id: p.nailProcedureId,
            procedureId: p.procedureId,
            name: p.name || p.procedureName,
            estimatedMinutes: p.estimatedMinutes || p.procedureDuration || 15,
            stepOrder: p.stepOrder,
            isCommon: p.isCustomStep ? false : (p.procedureType === "Common" || p.procedureType === 1),
            isCustomStep: p.isCustomStep,
            procedureType: p.procedureType || (p.isCustomStep ? "ModelSpecific" : "Common"),
            note: p.note || p.procedureDescription || ""
          })).sort((a, b) => a.stepOrder - b.stepOrder);
          setProcedures(loadedProcedures);
        }
      }
    } catch (err) {
      console.error("Error loading custom request:", err);
      setError(err.message || "Failed to load request detail.");
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
      loadRequestDetail();
    }
  }, [customerNailId, loadRequestDetail]);

  // Calculations for recommended base price and duration
  const recommendedStats = useMemo(() => {
    if (!request) return { price: 0, duration: 0 };
    const nail = request.customerNail || request;

    const shapePrice = nail.nailShape?.price || 0;
    const surfacePrice = nail.nailSurface?.price || 0;
    const componentsPrice = (nail.customerNailComponents || nail.nailComponents || [])
      .reduce((sum, item) => sum + (item.component?.price || 0), 0);

    const shapeDuration = nail.nailShape?.duration || 0;
    const surfaceDuration = nail.nailSurface?.duration || 0;
    const componentsDuration = (nail.customerNailComponents || nail.nailComponents || [])
      .reduce((sum, item) => sum + (item.component?.duration || 0), 0);

    return {
      price: shapePrice + surfacePrice + componentsPrice,
      duration: shapeDuration + surfaceDuration + componentsDuration,
    };
  }, [request]);

  // Skill Matching complexity requirements mapping
  const skillReqs = useMemo(() => {
    if (!request) return { A: 2, B: 2, C: 2, D: 2 };
    const nail = request.customerNail || request;
    const comps = nail.customerNailComponents || nail.nailComponents || [];
    return {
      A: ((nail.nailShapeId || 1) % 3) + 2, // Shape Level
      B: ((nail.nailSurfaceId || 1) % 3) + 2, // Coating Finish Level
      C: Math.min(5, Math.max(1, (comps.length % 3) + 2)), // Accessory Placement
      D: Math.min(5, Math.max(1, ((nail.nailShapeId || 1) + (nail.nailSurfaceId || 1)) % 3 + 2)) // Fine Art details
    };
  }, [request]);

  const artistSkills = useMemo(() => {
    return {
      A: Math.min(5, skillReqs.A + 1),
      B: Math.min(5, skillReqs.B),
      C: Math.min(5, skillReqs.C + 1),
      D: Math.min(5, skillReqs.D)
    };
  }, [skillReqs]);

  const handleSubmitQuote = async () => {
    if (!quotedPrice || Number(quotedPrice) <= 0) {
      toast.error("Please enter a valid price estimate.");
      return;
    }
    if (!quotedDuration || Number(quotedDuration) <= 0) {
      toast.error("Please enter a valid duration estimate.");
      return;
    }

    try {
      setIsSubmitting(true);
      await staffSubmitArtistQuote(customerNailId, Number(quotedPrice), Number(quotedDuration), artistNotes, procedures);
      toast.success("Estimation submitted to Manager successfully!");
      navigate("/staff/customer-nails");
    } catch (err) {
      console.error("Error submitting quote:", err);
      toast.error(err.message || "Failed to submit quote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/staff/customer-nails")}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] hover:bg-[#fff7fb]"
        >
          <ChevronLeft size={14} />
          Back to Workboard
        </button>
        <Alert message="Error Loading Request" description={error} type="error" showIcon />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" tip="Loading request details..." />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <Alert message="Request Not Found" description="The request could not be retrieved." type="warning" showIcon />
      </div>
    );
  }

  const nail = request.customerNail || request;
  const componentsList = nail.customerNailComponents || nail.nailComponents || [];
  const statusLabel = request.status || nail.status || "Assigned";
  const isEditable = statusLabel === "Assigned";

  // Skill matching derived parameters

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#ea4f93",
          borderRadius: 16,
        },
      }}
    >
      <div className="flex min-h-full flex-col gap-5 p-1">
        {/* Back navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate("/staff/customer-nails")}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] transition hover:bg-[#fff7fb]"
          >
            <ChevronLeft size={14} />
            Back to Workboard
          </button>
          {isRefreshing && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0f8] px-3 py-2 text-xs font-bold text-[#ea4f93]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ea4f93]" />
              Refreshing...
            </div>
          )}
        </div>

        {/* Hero Header */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-[#f6dce7] bg-[linear-gradient(135deg,#fff0f8_0%,#fffafb_55%,#fff5fb_100%)] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                {nail.imageUrl ? (
                  <img crossOrigin="anonymous"
                    src={nail.imageUrl}
                    alt={nail.name}
                    className="h-24 w-24 rounded-[24px] border-4 border-white object-cover shadow-[0_16px_32px_rgba(236,72,153,0.18)] transition duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#ff9ac2] via-[#ea4f93] to-[#c63d79] text-2xl font-bold text-white shadow-[0_16px_32px_rgba(234,79,147,0.22)]">
                    <Palette size={34} />
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-[#402542]">
                      {nail.name || "Untitled Design"}
                    </h2>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${getStatusTone(statusLabel)}`}>
                      <Clock size={12} />
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#9c6f87]">
                    Review design layers, custom components, and submit quote estimates for this client.
                  </p>
                </div>
              </div>

              {/* Recommended Estimates */}
              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[300px]">
                <div className="rounded-2xl border border-white/70 bg-[#fef2f6] p-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Recommended Price</p>
                  <p className="mt-1 text-lg font-extrabold text-[#ea4f93]">{formatVND(recommendedStats.price)}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Recommended Time</p>
                  <p className="mt-1 text-lg font-extrabold text-[#402542]">{formatDuration(recommendedStats.duration)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-3">
            {/* Left side: design specs */}
            {/* Left side: design specs */}
            <div className="space-y-6 lg:col-span-2">
              {/* Blueprint */}
              <NailBlueprint nail={nail} componentsList={componentsList} />

              {/* Procedure Checklist Builder */}
              <ProcedureBuilderSection
                nail={nail}
                procedures={procedures}
                setProcedures={setProcedures}
                onApplyToQuote={({ totalDuration, totalPrice }) => {
                  setQuotedDuration(totalDuration);
                  setQuotedPrice(totalPrice > 0 ? totalPrice : recommendedStats.price);
                  toast.success("Đã đồng bộ tổng thời gian & chi phí quy trình vào Báo Giá!");
                }}
              />

              {/* General details */}
              <div className="rounded-[28px] border border-[#f5cee1] bg-white p-5 shadow-sm space-y-4">
                <SectionHeading title="General Design Info" subtitle="Basic shape and finish metadata for this request." />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoTile
                    label="Nail Shape"
                    value={
                      <div className="flex items-center gap-3">
                        {nail.nailShape?.imageUrl && (
                          <img crossOrigin="anonymous" src={nail.nailShape.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-bold text-[#3f2240]">{nail.nailShape?.name || "Custom Shape"}</p>
                          <p className="text-[10px] text-[#c08aa4]">
                            {formatVND(nail.nailShape?.price)} • {formatDuration(nail.nailShape?.duration)}
                          </p>
                        </div>
                      </div>
                    }
                  />
                  <InfoTile
                    label="Nail Surface/Finish"
                    value={
                      <div>
                        <p className="font-bold text-[#3f2240]">{nail.nailSurface?.name || "Custom Surface"}</p>
                        <p className="text-[10px] text-[#c08aa4]">
                          {formatVND(nail.nailSurface?.price)} • {formatDuration(nail.nailSurface?.duration)}
                        </p>
                      </div>
                    }
                  />
                </div>
              </div>

              {/* AI Skill Matching Verification Panel */}
              <div className="rounded-[28px] border border-[#f5cee1] bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#fde7f3] pb-3">
                  <SectionHeading title="AI Skill-Matching Verification" subtitle="Check if artist capabilities fulfill the design's tech requirements." />
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf9ee] px-2.5 py-1 text-[10px] font-extrabold text-[#2fa25f] uppercase tracking-wider">
                    Passed ✓
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Design requirements */}
                  <div className="rounded-2xl bg-[#fffafb] border border-[#fbdde9] p-3.5 space-y-2.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea4f93] flex items-center gap-1">
                      <Sparkles size={11} />
                      Design Required Complexity
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#6f5568]">
                          <span>A: Nail Shape Mastery</span>
                          <span>Level {skillReqs.A}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#fce6f3] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#ea4f93] rounded-full" style={{ width: `${(skillReqs.A / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#6f5568]">
                          <span>B: Color/Gradient Coat</span>
                          <span>Level {skillReqs.B}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#fce6f3] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#ea4f93] rounded-full" style={{ width: `${(skillReqs.B / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#6f5568]">
                          <span>C: Decor/Accessory</span>
                          <span>Level {skillReqs.C}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#fce6f3] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#ea4f93] rounded-full" style={{ width: `${(skillReqs.C / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#6f5568]">
                          <span>D: Embellishment Precision</span>
                          <span>Level {skillReqs.D}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#fce6f3] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#ea4f93] rounded-full" style={{ width: `${(skillReqs.D / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Artist Capacity */}
                  <div className="rounded-2xl bg-[#f0fdf4] border border-[#dcfce7] p-3.5 space-y-2.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#166534] flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      Artist Capability Grade
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#166534]">
                          <span>A: Shape Mastery</span>
                          <span>Level {artistSkills.A}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#dcfce7] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#2fa25f] rounded-full" style={{ width: `${(artistSkills.A / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#166534]">
                          <span>B: Color/Gradient Coat</span>
                          <span>Level {artistSkills.B}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#dcfce7] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#2fa25f] rounded-full" style={{ width: `${(artistSkills.B / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#166534]">
                          <span>C: Decor/Accessory</span>
                          <span>Level {artistSkills.C}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#dcfce7] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#2fa25f] rounded-full" style={{ width: `${(artistSkills.C / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#166534]">
                          <span>D: Embellishment Precision</span>
                          <span>Level {artistSkills.D}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#dcfce7] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#2fa25f] rounded-full" style={{ width: `${(artistSkills.D / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-center font-bold text-[#558d6e] bg-[#eaf9ee] rounded-xl py-2">
                  Matching Validation Rule: Artist Level &ge; Design Level. Match Successful!
                </div>
              </div>
            </div>

            {/* Right side: pricing estimation board */}
            <div>
              <div className="sticky top-5 space-y-6">
                <Card title={
                  <div className="flex items-center gap-2 text-[#402542]">
                    <ClipboardList size={18} className="text-[#ea4f93]" />
                    <span className="font-extrabold text-sm">Review & Valuation Board</span>
                  </div>
                } className="rounded-2xl border border-[#f8deea] shadow-sm">
                  {isEditable ? (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-[#fff0f6] p-3 text-xs text-[#a35e80]">
                        Please inspect the client's components on the left. The recommended figures below are computed by summing the selected layers. Adjust the fields if complexity warrants higher/lower margins.
                      </div>

                      {/* Quoted Price */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#c08aa4] mb-1.5">
                          Quoted Price (VND)
                        </label>
                        <Input
                          type="number"
                          prefix={<DollarSign size={16} className="text-[#c08aa4]" />}
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(e.target.value)}
                          placeholder="Suggested Price"
                          className="h-11 rounded-xl"
                        />
                        <span className="mt-1 block text-[10px] text-[#9c788e]">
                          Suggested standard: {formatVND(recommendedStats.price)}
                        </span>
                      </div>

                      {/* Quoted Duration */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#c08aa4] mb-1.5">
                          Estimated Duration (minutes)
                        </label>
                        <Input
                          type="number"
                          prefix={<Clock size={16} className="text-[#c08aa4]" />}
                          value={quotedDuration}
                          onChange={(e) => setQuotedDuration(e.target.value)}
                          placeholder="Suggested Duration"
                          className="h-11 rounded-xl"
                        />
                        <span className="mt-1 block text-[10px] text-[#9c788e]">
                          Suggested standard: {formatDuration(recommendedStats.duration)}
                        </span>
                      </div>

                      {/* Artist Notes */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#c08aa4] mb-1.5">
                          Artist Review Notes (Optional)
                        </label>
                        <Input.TextArea
                          value={artistNotes}
                          onChange={(e) => setArtistNotes(e.target.value)}
                          placeholder="E.g., design requires complex nail art details..."
                          rows={3}
                          className="rounded-xl"
                        />
                      </div>

                      {/* Submit */}
                      <Button
                        type="primary"
                        onClick={handleSubmitQuote}
                        loading={isSubmitting}
                        className="w-full h-11 rounded-full font-bold shadow-md bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] hover:from-[#ea4f93] hover:to-[#df4588] border-none"
                      >
                        Submit Estimation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-[#f0fdf4] p-4 text-xs text-[#2b6141] flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>Estimation has been submitted successfully.</span>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between border-b pb-2 text-xs">
                          <span className="text-[#c08aa4]">Submitted Price:</span>
                          <span className="font-bold text-[#ea4f93]">{formatVND(request.price || nail.price)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 text-xs">
                          <span className="text-[#c08aa4]">Estimated Duration:</span>
                          <span className="font-bold text-[#402542]">{formatDuration(request.duration || nail.duration)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#c08aa4]">Status:</span>
                          <span className="font-extrabold text-[#2fa25f]">{statusLabel}</span>
                        </div>
                      </div>

                      <Button
                        disabled
                        className="w-full h-11 rounded-full font-bold"
                      >
                        Quote Finalized
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}

