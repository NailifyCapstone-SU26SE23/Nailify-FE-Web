import { Modal } from "antd";
import {
  BarChart3,
  CircleDollarSign,
  Copy,
  Eye,
  LoaderCircle,
  PencilLine,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import {
  getAdminNailVariantCreateRoute,
  getAdminNailVariantDetailRoute,
  ROUTES,
} from "../../../../shared/constants/routes";
import { formatDurationLabel } from "../../../../shared/utils/formatDuration";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  assignProceduresToVariant,
  deleteAdminNailVariant,
  fetchAdminNailDesignDetail,
  fetchAdminNailVariantDetail,
  fetchProceduresByVariant,
  updateAdminNailDesign,
  updateAdminNailVariant,
} from "../services/nailDesignManagementService";

const DESIGN_PREVIEW_IMAGE =
  "https://i0.wp.com/greenweddingshoes.com/wp-content/uploads/2025/12/red-cat-eye-christmas-holiday-nails-with-bow.webp?fit=1024%2C9999";

function SectionCard({
  title,
  subtitle,
  icon,
  children,
  sectionId,
  sectionRef,
  highlighted = false,
}) {
  return (
    <article
      id={sectionId}
      ref={sectionRef}
      className={`scroll-mt-6 rounded-[22px] border bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] transition-all duration-300 md:p-5 ${highlighted
        ? "border-[#ea4f93] shadow-[0_18px_38px_rgba(236,72,153,0.18)] ring-4 ring-[#ffd8e8]"
        : "border-[#f8d3e2]"
        }`}
    >
      <div className="flex items-start gap-3 border-b border-[#f8deea] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#fff0f6_0%,#fff8e9_100%)] text-[#ea4f93]">
          {icon}
        </div>
        <div>
          <h3 className="font-extrabold text-[#432744]">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-[#c694ad]">{subtitle}</p> : null}
        </div>
      </div>
      <div className="pt-4">{children}</div>
    </article>
  );
}

SectionCard.propTypes = {
  children: PropTypes.node,
  highlighted: PropTypes.bool,
  icon: PropTypes.node.isRequired,
  sectionId: PropTypes.string,
  sectionRef: PropTypes.shape({ current: PropTypes.any }),
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
};

function Pill({ children, tone = "default" }) {
  const toneMap = {
    default: "border-[#f4c6da] bg-white text-[#8c7085]",
    pink: "border-[#ffd1e3] bg-[#fff0f7] text-[#ea4f93]",
    purple: "border-[#ead8ff] bg-[#f5ecff] text-[#8b5cf6]",
    blue: "border-[#dce7ff] bg-[#eef4ff] text-[#4a72d8]",
    green: "border-[#d7f3e0] bg-[#eaf9ee] text-[#2fa25f]",
    yellow: "border-[#f8e3b3] bg-[#fff4df] text-[#d9871c]",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

Pill.propTypes = {
  children: PropTypes.node,
  tone: PropTypes.string,
};

function SkillStars({ count }) {
  return (
    <div className="flex gap-1 text-[#ea4f93]">
      {[1, 2, 3, 4, 5].map((starNumber) => (
        <span key={starNumber} className={starNumber <= count ? "opacity-100" : "opacity-20"}>
          ★
        </span>
      ))}
    </div>
  );
}

SkillStars.propTypes = {
  count: PropTypes.number.isRequired,
};

function getHeroTagTone(index) {
  if (index < 2) {
    return "pink";
  }

  return index % 3 === 0 ? "purple" : "default";
}

function getProfileValueTone(index) {
  if (index % 4 === 0) {
    return "pink";
  }
  if (index % 4 === 1) {
    return "purple";
  }
  if (index % 4 === 2) {
    return "green";
  }

  return "yellow";
}

function getComparisonValueTone(label) {
  return label === "Premium vs Market" ? "text-[#2fa25f]" : "text-[#432744]";
}

function isHexColor(value) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(String(value || "").trim());
}

function extractVariantColors(colorJson) {
  const rawValue = String(colorJson || "").trim();

  if (!rawValue) {
    return [];
  }

  const parsedColors = [];

  const collectColors = (value) => {
    if (!value) {
      return;
    }

    if (typeof value === "string") {
      const normalized = value.trim();

      if (isHexColor(normalized)) {
        parsedColors.push(normalized);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collectColors);
      return;
    }

    if (typeof value === "object") {
      Object.values(value).forEach(collectColors);
    }
  };

  try {
    collectColors(JSON.parse(rawValue));
  } catch {
    collectColors(rawValue);
  }

  return [...new Set(parsedColors)];
}

function formatApiValue(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "N/A";
  }

  const normalized = String(value).trim();
  return normalized || "N/A";
}

function parseVariantColorConfig(colorJson) {
  const rawValue = String(colorJson || "").trim();

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function getColorGradientStops(colorConfig) {
  if (!colorConfig) {
    return [];
  }

  if (Array.isArray(colorConfig)) {
    return colorConfig;
  }

  if (Array.isArray(colorConfig.gradient)) {
    return colorConfig.gradient;
  }

  if (Array.isArray(colorConfig.gradient?.stops)) {
    return colorConfig.gradient.stops;
  }

  if (Array.isArray(colorConfig.gradientStops)) {
    return colorConfig.gradientStops;
  }

  return [];
}

function buildFingerColorStyle(colorConfig, fingerIndex) {
  if (!colorConfig) {
    return { backgroundColor: "#f3f4f6" };
  }

  if (typeof colorConfig === "string") {
    return { backgroundColor: colorConfig };
  }

  if (Array.isArray(colorConfig)) {
    const color = String(colorConfig[fingerIndex - 1] || colorConfig[fingerIndex] || colorConfig[0] || "#f3f4f6").trim();
    return { backgroundColor: color || "#f3f4f6" };
  }

  const gradientStops = getColorGradientStops(colorConfig);
  if (gradientStops.length > 1) {
    return { background: `linear-gradient(to bottom, ${gradientStops.join(", ")})` };
  }

  if (colorConfig.mode === "perFinger" && Array.isArray(colorConfig.fingers)) {
    const finger = colorConfig.fingers.find((item) => Number(item?.fingerIndex) === Number(fingerIndex));

    if (finger) {
      const fingerStops = getColorGradientStops(finger);
      if (fingerStops.length > 1) {
        return { background: `linear-gradient(to bottom, ${fingerStops.join(", ")})` };
      }

      if (finger.mode === "gradient" && finger.primaryColor && finger.secondaryColor) {
        return { background: `linear-gradient(to bottom, ${finger.primaryColor}, ${finger.secondaryColor})` };
      }

      if (finger.color || finger.primaryColor) {
        return { backgroundColor: finger.color || finger.primaryColor };
      }
    }
  }

  if (colorConfig.color) {
    return { backgroundColor: colorConfig.color };
  }

  if (colorConfig.primaryColor) {
    return { backgroundColor: colorConfig.primaryColor };
  }

  return { backgroundColor: "#f3f4f6" };
}

function getFingerAlignmentClass(fingerName) {
  switch (fingerName) {
    case "Thumb":
      return "translate-y-8 -rotate-[14deg] hover:translate-y-6 hover:-rotate-[8deg]";
    case "Index":
      return "translate-y-2 -rotate-[4deg] hover:translate-y-0 hover:-rotate-[2deg]";
    case "Middle":
      return "-translate-y-3 hover:-translate-y-5";
    case "Ring":
      return "translate-y-0 rotate-[2deg] hover:-translate-y-2 hover:rotate-0";
    case "Pinky":
      return "translate-y-6 rotate-[10deg] hover:translate-y-4 hover:rotate-[6deg]";
    default:
      return "";
  }
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
    return typeof configJson === "string" ? JSON.parse(configJson) : configJson;
  } catch {
    return {};
  }
}

function NailVariantHandPreview({ variantDetail, compact = false, showShapeOverlay = true }) {
  const colorConfig = useMemo(
    () => parseVariantColorConfig(variantDetail?.colorJson),
    [variantDetail?.colorJson],
  );
  const fingerDefinitions = [
    { fingerIndex: 1, label: "Thumb" },
    { fingerIndex: 2, label: "Index" },
    { fingerIndex: 3, label: "Middle" },
    { fingerIndex: 4, label: "Ring" },
    { fingerIndex: 5, label: "Pinky" },
  ];
  const shapeMaskStyle = variantDetail?.nailShape?.imageUrl
    ? {
      maskImage: `url(${variantDetail.nailShape.imageUrl})`,
      WebkitMaskImage: `url(${variantDetail.nailShape.imageUrl})`,
      maskSize: "cover",
      WebkitMaskSize: "cover",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }
    : {};
  const outerClassName = compact
    ? "rounded-[18px] border border-[#f7d7e5] bg-[radial-gradient(circle_at_top,#fffdfd_0%,#fff6fb_58%,#fff2f8_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
    : "rounded-[24px] border border-[#f7d7e5] bg-[radial-gradient(circle_at_top,#fffdfd_0%,#fff6fb_58%,#fff2f8_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]";
  const deckClassName = compact
    ? "flex min-h-[180px] flex-wrap items-center justify-center gap-3"
    : "flex min-h-[300px] flex-wrap items-center justify-center gap-5 lg:gap-6";
  const fingerClassName = compact ? "flex flex-col items-center gap-2" : "flex flex-col items-center gap-3.5";
  const fingerGlowClassName = compact
    ? "absolute -inset-1 rounded-t-[24px] rounded-b-[12px] bg-gradient-to-t from-[#ea4f93]/15 to-[#ffb8d9]/5 opacity-25 blur-sm transition duration-500 group-hover:opacity-50 group-hover:blur-md"
    : "absolute -inset-1 rounded-t-[36px] rounded-b-[18px] bg-gradient-to-t from-[#ea4f93]/15 to-[#ffb8d9]/5 opacity-30 blur-md transition duration-500 group-hover:opacity-60 group-hover:blur-lg";
  const nailShellClassName = compact
    ? "relative overflow-hidden rounded-t-[18px] rounded-b-[10px] border border-[#fcd5e6] bg-gradient-to-b from-[#fff6f9] to-[#ffeef5] shadow-[0_8px_18px_rgba(236,72,153,0.06)] transition-all duration-300 group-hover:scale-105 group-hover:border-[#ea4f93]"
    : "relative overflow-hidden rounded-t-[32px] rounded-b-[14px] border-2 border-[#fcd5e6] bg-gradient-to-b from-[#fff6f9] to-[#ffeef5] shadow-[0_12px_28px_rgba(236,72,153,0.06)] transition-all duration-300 group-hover:scale-105 group-hover:border-[#ea4f93]";
  const glossClassName = compact
    ? "pointer-events-none absolute left-1.5 top-1 h-10 w-1 rounded-full bg-white/45 blur-[0.6px]"
    : "pointer-events-none absolute left-2.5 top-1.5 h-20 w-1.5 animate-pulse rounded-full bg-white/45 blur-[0.7px]";
  const componentSizeClassName = compact ? "pointer-events-none absolute h-7 w-7 object-contain drop-shadow-[0_4px_8px_rgba(234,79,147,0.18)]" : "pointer-events-none absolute h-11 w-11 object-contain drop-shadow-[0_4px_8px_rgba(234,79,147,0.18)]";
  const labelClassName = compact
    ? "rounded-full border border-[#fce6f3] bg-white/90 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)]"
    : "rounded-full border border-[#fce6f3] bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)]";

  return (
    <div className={outerClassName}>
      <div className={deckClassName}>
        {fingerDefinitions.map((finger) => {
          const colorStyle = buildFingerColorStyle(colorConfig, finger.fingerIndex);
          const fingerComponents = (variantDetail?.nailComponents || []).filter((item) => {
            const componentFingerIndex = Number(item?.fingerIndex);

            return componentFingerIndex === -1 || componentFingerIndex === finger.fingerIndex;
          });

          return (
            <div
              key={finger.label}
              className={`${fingerClassName} transition-all duration-500 ease-out ${getFingerAlignmentClass(finger.label)}`}
            >
              <div className="relative group">
                <div className={fingerGlowClassName} />

                <div 
                  className={nailShellClassName}
                  style={compact ? { width: '48px', height: '63px' } : { width: '96px', height: '126px' }}
                >
                  <div 
                    className="absolute" 
                    style={{
                      left: '14%',
                      top: '37.2%',
                      width: '72%',
                      height: '49.37%',
                      ...shapeMaskStyle
                    }}
                  >
                    <div className="absolute inset-0 h-full w-full" style={colorStyle} />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 mix-blend-overlay" />
                    <div className={glossClassName} />

                    {variantDetail?.nailSurface?.name && (() => {
                      const surfaceName = String(variantDetail.nailSurface.name || "").toLowerCase();

                      if (surfaceName.includes("matte")) {
                        return <div className="pointer-events-none absolute inset-0 h-full w-full bg-white/12 backdrop-blur-[0.5px]" />;
                      }

                      if (
                        surfaceName.includes("chrome") ||
                        surfaceName.includes("metallic") ||
                        surfaceName.includes("mirror") ||
                        surfaceName.includes("cat eye")
                      ) {
                        return (
                          <div className="pointer-events-none absolute inset-0 h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_50%,rgba(0,0,0,0.15)_100%)] mix-blend-overlay" />
                        );
                      }

                      return (
                        <div className="pointer-events-none absolute inset-0 h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_100%)]" />
                      );
                    })()}

                    {fingerComponents.map((componentItem, index) => {
                      const component = componentItem?.component;

                      if (!component?.imageUrl) {
                        return null;
                      }

                      const config = parseComponentConfig(componentItem.configJson);
                      const scale = Number.isFinite(Number(config?.scale)) ? Number(config.scale) : 0.25;
                      const rotation = Number.isFinite(Number(config?.rotation)) ? Number(config.rotation) : 0;
                      const left = 50 + Number(componentItem?.posX || 0) * 100;
                      const top = 50 + Number(componentItem?.posY || 0) * 100;

                      return (
                        <img
                          key={`${componentItem?.nailComponentId || index}-${finger.fingerIndex}`}
                          crossOrigin="anonymous"
                          src={component.imageUrl}
                          alt={component.name || "component"}
                          className="pointer-events-none absolute object-contain drop-shadow-[0_4px_8px_rgba(234,79,147,0.18)]"
                          referrerPolicy="no-referrer"
                          style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            width: `${scale * 100}%`,
                            height: `${scale * 100}%`,
                            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                          }}
                        />
                      );
                    })}
                  </div>

                  {showShapeOverlay && variantDetail?.nailShape?.imageUrl ? (
                    <div 
                      className="pointer-events-none absolute"
                      style={{
                        left: '14%',
                        top: '37.2%',
                        width: '72%',
                        height: '49.37%',
                      }}
                    >
                      <img
                        crossOrigin="anonymous"
                        src={variantDetail.nailShape.imageUrl}
                        alt="shape mask"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {!compact ? <span className={labelClassName}>{finger.label}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

NailVariantHandPreview.propTypes = {
  compact: PropTypes.bool,
  showShapeOverlay: PropTypes.bool,
  variantDetail: PropTypes.shape({
    colorJson: PropTypes.string,
    nailComponents: PropTypes.arrayOf(
      PropTypes.shape({
        configJson: PropTypes.string,
        fingerIndex: PropTypes.number,
        nailComponentId: PropTypes.number,
        posX: PropTypes.number,
        posY: PropTypes.number,
        component: PropTypes.shape({
          imageUrl: PropTypes.string,
          name: PropTypes.string,
        }),
      }),
    ),
    nailShape: PropTypes.shape({
      imageUrl: PropTypes.string,
    }),
    nailSurface: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
};

const CUSTOMER_PROFILE_OPTIONS = {
  "Skin Tone": ["Fair", "Light Medium", "Medium", "Tan", "Deep"],
  "Skin Undertone": ["Warm", "Cool", "Neutral"],
  "Category": ["Nude", "Pink", "Red", "Black", "Chrome", "White", "Pastel", "Neon"],
  "Age Group": ["Teen", "20s", "30s", "40+"],
  "Style / Personality": [
    "Elegant",
    "Cute",
    "Minimal",
    "Sexy",
    "Luxury",
    "Feminine",
    "Bold",
    "Soft Girl",
    "Korean Style",
  ],
  "Vibe Level": ["Subtle", "Soft", "Moderate", "Eye-catching", "Luxury Statement"],
  Occasion: ["Daily", "Office", "Wedding", "Party", "Holiday", "Valentine", "Birthday", "Photoshoot"],
  "Hand Shape": ["Slim Fingers", "Short Fingers", "Wide Hands", "Long Fingers"],
  Audience: ["Female", "Male", "Unisex", "Gay"],
};

const DESIGN_COMPONENT_OPTIONS = {
  "Design Status": ["Active", "Draft", "Archived"],
  "Try-On Ready": ["Yes", "No"],
  Complexity: ["Basic", "Intermediate", "Advanced", "Expert"],
  "Est. Duration": ["45 min", "1h", "1h15m", "1h30m", "2h"],
  "Nail Shape": ["Almond", "Square", "Round", "Oval", "Coffin", "Stiletto"],
  "Nail Length": ["Short", "Medium", "Long"],
};

const COMPONENT_VALUE_OPTIONS = {
  "Primary Finish": ["Glossy", "Matte", "Chrome", "Glitter", "Jelly", "Velvet"],
  "Main Pattern": ["French Tip", "Floral", "Marble", "Stone", "Pearl", "Gold Line", "Sticker", "Cat Eye", "Ombre"],
  "Color Direction": ["Nude", "Pink", "Red", "Black", "Chrome", "White", "Pastel", "Rose Gold"],
  "Nail Shape": ["Almond", "Square", "Round", "Oval", "Coffin", "Stiletto"],
  "Nail Length": ["Short", "Medium", "Long"],
  Complexity: ["Simple", "Medium", "Complex", "Premium Art"],
  "Collection Mood": ["Bridal", "Luxury", "Minimal", "Romantic", "Bold", "Soft Girl"],
  Occasion: ["Daily", "Office", "Wedding", "Party", "Holiday", "Photoshoot"],
};

const VARIANT_LEVEL_OPTIONS = ["Basic", "Intermediate", "Advanced", "Expert", "Premium"];
const SKILL_LEVEL_LABELS = {
  1: "1★ Junior",
  2: "2★ Developing",
  3: "3★ Intermediate",
  4: "4★ Advanced",
  5: "5★ Expert",
};
const DETAIL_MODAL_STYLES = {
  body: { padding: 0 },
  content: { borderRadius: 24, overflow: "hidden" },
};

function InputLabel({ children }) {
  return (
    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#c694ad]">
      {children}
    </span>
  );
}

InputLabel.propTypes = {
  children: PropTypes.node,
};

function EditInput({ value, onChange, className = "", disabled = false }) {
  return (
    <input
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`h-11 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4] disabled:cursor-not-allowed disabled:bg-[#f9f1f5] disabled:text-[#b2879f] ${className}`}
    />
  );
}

EditInput.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

function EditTextarea({ value, onChange, rows = 3, disabled = false }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      className="w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 py-3 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4] disabled:cursor-not-allowed disabled:bg-[#f9f1f5] disabled:text-[#b2879f]"
    />
  );
}

EditTextarea.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  rows: PropTypes.number,
  value: PropTypes.string.isRequired,
};

function EditSelect({ value, onChange, options, disabled = false }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4] disabled:cursor-not-allowed disabled:bg-[#f9f1f5] disabled:text-[#b2879f]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

EditSelect.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string.isRequired,
};

function SkillLevelSlider({ value, onChange }) {
  const progress = ((value - 1) / 4) * 100;

  return (
    <div className="pt-2">
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        onChange={onChange}
        className="skill-level-slider h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(90deg, #ea4f93 0%, #f59f61 55%, #f7d85f 100%) 0 / ${progress}% 100% no-repeat, #f6d5e3`,
        }}
      />
    </div>
  );
}

SkillLevelSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
};

const PRICING_DICT = {
  "Total Material Cost": "Tổng Chi phí Nguyên liệu",
  "Est. Service Cost": "Chi phí Dịch vụ Ước tính",
  "Estimated Profit Margin": "Lợi nhuận Biên Ước tính",
  "Final Price": "Giá Cuối cùng",
  "Avg Competitor Price": "Giá Đối thủ Trung bình",
  "Premium vs Market": "Cao cấp so với Thị trường",
  "Base Gel": "Gel Nền",
  "Top Coat": "Gel Bóng",
  "Nail Polish": "Sơn Móng",
  "Charms & Stones": "Charm & Đá",
  "Manicure Work": "Công Làm Móng",
  "Design Service": "Dịch vụ Thiết kế",
};

export function NailDesignManagementDetailPage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const heroSectionRef = useRef(null);
  const customerProfileRef = useRef(null);
  const designComponentsRef = useRef(null);
  const designVariantsRef = useRef(null);
  const pricingRef = useRef(null);
  const skillsRef = useRef(null);
  const quickSummaryRef = useRef(null);
  const customerPreviewRef = useRef(null);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [initialDesign, setInitialDesign] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingDeleteVariant, setPendingDeleteVariant] = useState(null);
  const [highlightedSection, setHighlightedSection] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingVariants, setIsSavingVariants] = useState(false);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  const [selectedVariantDetail, setSelectedVariantDetail] = useState(null);
  const [variantProcedureDraft, setVariantProcedureDraft] = useState([]);
  const [isLoadingVariantDetail, setIsLoadingVariantDetail] = useState(false);
  const [isLoadingVariantProcedures, setIsLoadingVariantProcedures] = useState(false);
  const [isSavingVariantProcedures, setIsSavingVariantProcedures] = useState(false);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDesignDetail = async () => {
      setIsLoading(true);
      setError("");
      setIsNotFound(false);

      try {
        const detail = await fetchAdminNailDesignDetail(designId);

        if (!isMounted) {
          return;
        }

        setInitialDesign(detail);
        setFormValues(detail);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setInitialDesign(null);
        setFormValues(null);

        const statusCode = loadError && typeof loadError === "object" ? loadError.response?.status : undefined;

        if (statusCode === 404) {
          setIsNotFound(true);
        } else {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load nail design detail.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDesignDetail();

    return () => {
      isMounted = false;
    };
  }, [designId]);

  if (isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)] px-4 py-10">
        <div className="flex items-center gap-3 rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 text-sm text-[#b38a9f] shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          {language === "vi" ? "Đang tải thông tin thiết kế mẫu móng..." : "Loading nail design detail..."}
        </div>
      </section>
    );
  }

  if (isNotFound) {
    return <Navigate to={ROUTES.adminNailDesigns} replace />;
  }

  if (!formValues) {
    return (
      <section className="flex min-h-full items-center justify-center bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)] px-4 py-10">
        <div className="rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 text-sm font-medium text-[#d14c84] shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          {error || "Failed to load nail design detail."}
        </div>
      </section>
    );
  }

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleBooleanChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value === "true",
    }));
  };

  const handleCustomerProfileToggle = (label, option) => () => {
    setFormValues((current) => {
      const currentValues = current.customerProfile[label] ?? [];
      const hasOption = currentValues.includes(option);

      return {
        ...current,
        customerProfile: {
          ...current.customerProfile,
          [label]: hasOption
            ? currentValues.filter((value) => value !== option)
            : [...currentValues, option],
        },
      };
    });
  };

  const handleDesignComponentChange = (index) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      designComponents: current.designComponents.map((entry, entryIndex) =>
        entryIndex === index ? [entry[0], nextValue] : entry,
      ),
    }));
  };

  const handleVariantFieldChange = (index, field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? {
            ...variant,
            [field]: nextValue,
          }
          : variant,
      ),
    }));
  };

  const handleSkillFieldChange = (index, field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      skills: current.skills.map((skill, skillIndex) => {
        if (skillIndex !== index) {
          return skill;
        }

        if (field === "title") {
          return [nextValue, skill[1], skill[2], skill[3]];
        }

        if (field === "subtitle") {
          return [skill[0], nextValue, skill[2], skill[3]];
        }

        if (field === "score") {
          const score = Number.parseInt(nextValue, 10);
          const normalizedScore = Number.isNaN(score) ? 1 : Math.min(5, Math.max(1, score));

          return [skill[0], skill[1], normalizedScore, SKILL_LEVEL_LABELS[normalizedScore]];
        }

        return [skill[0], skill[1], skill[2], nextValue];
      }),
    }));
  };

  const handleStartEdit = () => {
    setFlashMessage("");
    setIsEditing(true);
  };

  const scrollToSection = (sectionRef, options = {}) => {
    if (options.startEdit && !isEditing) {
      setFlashMessage("");
      setIsEditing(true);
    }

    if (options.sectionKey) {
      setHighlightedSection(options.sectionKey);
      window.setTimeout(() => {
        setHighlightedSection((current) => (current === options.sectionKey ? "" : current));
      }, 2200);
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const handleCancelEdit = () => {
    setShowCancelConfirm(false);
    setFormValues(initialDesign);
    setPendingDeleteVariant(null);
    setFlashMessage("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setShowSaveConfirm(false);
    setError("");

    const initialVariants = Array.isArray(initialDesign?.variants) ? initialDesign.variants : [];
    const currentVariants = Array.isArray(formValues?.variants) ? formValues.variants : [];
    const designNameChanged =
      String(initialDesign?.name || "").trim() !== String(formValues?.heroTitle || "").trim();
    const designDescriptionChanged =
      String(initialDesign?.description || "").trim()
      !== String(formValues?.heroSubtitle || "").trim();
    const variantsToUpdate = currentVariants.filter((variant) => {
      const initialVariant = initialVariants.find(
        (item) => Number(item?.nailVariantId || 0) === Number(variant?.nailVariantId || 0),
      );

      if (!initialVariant) {
        return false;
      }

      return (
        String(initialVariant.name || "").trim() !== String(variant.name || "").trim()
        || String(initialVariant.imageUrl || "").trim() !== String(variant.imageUrl || "").trim()
        || String(initialVariant.colorJson || "").trim() !== String(variant.colorJson || "").trim()
      );
    });

    if (!designNameChanged && !designDescriptionChanged && !variantsToUpdate.length) {
      setFlashMessage("No API-backed changes detected. Other edits on this screen remain local only.");
      setIsEditing(false);
      return;
    }

    setIsSavingVariants(true);

    try {
      if (designNameChanged || designDescriptionChanged) {
        await updateAdminNailDesign(designId, {
          name: formValues?.heroTitle,
          description: formValues?.heroSubtitle,
          categoryIds: formValues?.categoryIds,
          nailVariantIds: currentVariants.map((variant) => variant.nailVariantId),
          existingImageUrls: formValues?.imageUrl ? [formValues.imageUrl] : [],
        });
      }

      await Promise.all(
        variantsToUpdate.map((variant) =>
          updateAdminNailVariant(variant.nailVariantId, {
            name: variant.name,
            nailShapeId: variant.nailShapeId,
            nailSurfaceId: variant.nailSurfaceId,
            nailDesignId: variant.nailDesignId || Number(designId || 0),
            imageUrl: variant.imageUrl,
            colorJson: variant.colorJson,
          }),
        ),
      );

      const refreshedDetail = await fetchAdminNailDesignDetail(designId);
      setInitialDesign(refreshedDetail);
      setFormValues(refreshedDetail);
      const successMessages = [];

      if (designNameChanged || designDescriptionChanged) {
        successMessages.push("nail design updated");
      }

      if (variantsToUpdate.length === 1) {
        successMessages.push("1 variant updated");
      } else if (variantsToUpdate.length > 1) {
        successMessages.push(`${variantsToUpdate.length} variants updated`);
      }

      setFlashMessage(
        successMessages.length
          ? `${successMessages.join(" and ")} successfully.`
          : "Changes saved successfully.",
      );
      setIsEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update nail design.",
      );
    } finally {
      setIsSavingVariants(false);
    }
  };

  const handleDeleteVariant = async () => {
    if (!pendingDeleteVariant?.nailVariantId) {
      return;
    }

    setError("");
    setIsDeletingVariant(true);

    try {
      await deleteAdminNailVariant(pendingDeleteVariant.nailVariantId);

      const refreshedDetail = await fetchAdminNailDesignDetail(designId);
      setInitialDesign(refreshedDetail);
      setFormValues(refreshedDetail);
      setFlashMessage(`Deleted variant "${pendingDeleteVariant.name}".`);
      setPendingDeleteVariant(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete nail variant.",
      );
    } finally {
      setIsDeletingVariant(false);
    }
  };

  const handleViewVariant = (variant) => {
    if (!variant?.nailVariantId) {
      setError("Variant ID is required.");
      return;
    }

    setError("");
    navigate(getAdminNailVariantDetailRoute(designId, variant.nailVariantId));
  };

  const updateVariantProcedureDraft = (index, field, value) => {
    setVariantProcedureDraft((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            [field]: field === "stepOrder" ? value : value,
          }
          : item,
      ),
    );
  };

  const addVariantProcedureDraft = () => {
    setVariantProcedureDraft((current) => [
      ...current,
      {
        procedureId: "",
        name: "",
        description: "",
        duration: 0,
        durationLabel: "--",
        status: "--",
        createAt: "",
        isRequired: false,
        stepOrder: current.length + 1,
      },
    ]);
  };

  const removeVariantProcedureDraft = (index) => {
    setVariantProcedureDraft((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSaveVariantProcedures = async () => {
    if (!selectedVariantDetail?.nailVariantId) {
      return;
    }

    setError("");
    setIsSavingVariantProcedures(true);

    try {
      await assignProceduresToVariant(
        selectedVariantDetail.nailVariantId,
        variantProcedureDraft.map((item, index) => ({
          procedureId: item.procedureId,
          stepOrder: Number(item.stepOrder || index + 1),
        })),
      );

      const refreshedProcedures = await fetchProceduresByVariant(selectedVariantDetail.nailVariantId);
      setVariantProcedureDraft(refreshedProcedures);
      setFlashMessage(`Updated procedure steps for "${selectedVariantDetail.name}".`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to assign procedures to variant.",
      );
    } finally {
      setIsSavingVariantProcedures(false);
    }
  };

  const summaryRows = [
    [language === "vi" ? "Trạng thái Thiết kế" : "Design Status", formValues.designStatus === "Active" ? (language === "vi" ? "Hoạt động" : "Active") : formValues.designStatus],
    [language === "vi" ? "Có thể Thử móng" : "Try-On Ready", formValues.tryOnReady ? (language === "vi" ? "Có" : "Yes") : (language === "vi" ? "Không" : "No")],
    [language === "vi" ? "Độ phức tạp" : "Complexity", formValues.complexity === "Medium" ? (language === "vi" ? "Trung bình" : "Medium") : formValues.complexity === "High" ? (language === "vi" ? "Cao" : "High") : (language === "vi" ? "Thấp" : "Low")],
    [language === "vi" ? "Thời gian Dự kiến" : "Est. Duration", formatDurationLabel(formValues.estimatedDuration)],
    [language === "vi" ? "Dáng móng" : "Nail Shape", formValues.nailShape],
    [language === "vi" ? "Độ dài móng" : "Nail Length", formValues.nailLength],
    [language === "vi" ? "Giá Đề xuất" : "Suggested Price", formValues.suggestedPrice],
  ];
  const apiCategoryRows = Array.isArray(formValues.categories) ? formValues.categories : [];

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <style>
        {`
          .skill-level-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 9999px;
            background: #ea4f93;
            border: 3px solid #fff7fb;
            box-shadow: 0 4px 12px rgba(234, 79, 147, 0.28);
          }

          .skill-level-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 9999px;
            background: #ea4f93;
            border: 3px solid #fff7fb;
            box-shadow: 0 4px 12px rgba(234, 79, 147, 0.28);
          }

          .skill-level-slider::-moz-range-track {
            height: 8px;
            border-radius: 9999px;
            background: transparent;
          }
        `}
      </style>

      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-[#c694ad]">
              {language === "vi" ? "Thiết kế Mẫu móng / " : "Nail Designs / "}<span className="text-[#ea4f93]">{formValues.breadcrumbsLabel}</span>
            </p>
            <h2 className="mt-1 text-[1.7rem] font-extrabold text-[#432744]">
              {language === "vi" ? "Chi tiết Thiết kế Mẫu móng" : "Nail Design Detail"}
            </h2>
            <p className="mt-1 text-sm text-[#c694ad]">
              {language === "vi" 
                ? "Xem và chỉnh sửa chi tiết thiết kế, quy trình và gợi ý AI. Giá cả được giữ cố định." 
                : "View and edit design details, workflow, and AI recommendation profile. Pricing stays locked."
              }
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-[#eaf9ee] px-4 py-2 text-xs font-bold text-[#2fa25f]">
              {formValues.designStatus === "Active" ? (language === "vi" ? "Hoạt động" : "Active") : (language === "vi" ? "Ngừng hoạt động" : "Inactive")}
            </span>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaveConfirm(true)}
                  disabled={isSavingVariants || isDeletingVariant}
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
                >
                  {isSavingVariants ? (language === "vi" ? "Đang lưu..." : "Saving...") : (language === "vi" ? "Lưu Thay Đổi" : "Save Changes")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isSavingVariants || isDeletingVariant}
                  className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#7e6075]"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
                >
                  <PencilLine size={13} className="mr-1.5 inline" />
                  {language === "vi" ? "Chỉnh sửa Thiết kế" : "Edit Design"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFlashMessage(language === "vi" ? "Hoàn thành mô phỏng nhân bản. Một thiết kế bản sao sẽ được tạo trong quy trình thực tế." : "Mock duplicate completed. A cloned design would be created in a real flow.")
                  }
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
                >
                  <Copy size={13} className="mr-1.5 inline" />
                  {language === "vi" ? "Nhân bản Thiết kế" : "Duplicate Design"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {flashMessage ? (
        <div className="rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
          {flashMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <article
            ref={heroSectionRef}
            id="hero-section"
            className={`scroll-mt-6 rounded-[22px] border bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] transition-all duration-300 md:p-5 ${highlightedSection === "hero"
              ? "border-[#ea4f93] shadow-[0_18px_38px_rgba(236,72,153,0.18)] ring-4 ring-[#ffd8e8]"
              : "border-[#f8d3e2]"
              }`}
          >
            <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-[18px] bg-[#f6edf2]">
                <img
                  crossOrigin="anonymous"
                  src={formValues.previewImage || DESIGN_PREVIEW_IMAGE}
                  alt={formValues.heroTitle}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-3">
                  <Pill tone={formValues.tryOnReady ? "green" : "pink"}>
                    {formValues.tryOnReady ? "Try-On Ready" : "No Try-On"}
                  </Pill>
                </div>
              </div>

              <div>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={formValues.heroTitle}
                      onChange={handleChange("heroTitle")}
                      className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-xl font-extrabold text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                    />
                    <textarea
                      value={formValues.heroSubtitle}
                      onChange={handleChange("heroSubtitle")}
                      rows={4}
                      className="w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 py-3 text-sm text-[#7c6678] outline-none transition focus:border-[#ef6bb4]"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="mt-2 text-4xl font-extrabold leading-tight text-[#432744]">
                      {formValues.heroTitle}
                    </h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[#7c6678]">
                      {formatApiValue(formValues.heroSubtitle)}
                    </p>
                  </>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(formValues.categoryNames?.length
                    ? formValues.categoryNames
                    : [formValues.designStatus || "N/A"]).map(
                      (tag, index) => (
                        <Pill
                          key={`${tag}-${getHeroTagTone(index)}`}
                          tone={getHeroTagTone(index)}
                        >
                          {tag}
                        </Pill>
                      ),
                    )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    [language === "vi" ? "Điểm Phổ biến" : "Popularity Score", formValues.popularityScore],
                    [language === "vi" ? "Tỷ lệ Đặt lịch" : "Booking Rate", formValues.bookingRate],
                    [language === "vi" ? "Đánh giá Khách hàng" : "Customer Rating", formValues.customerRating],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[18px] bg-[#fff3f8] px-4 py-4">
                      <p className="text-xs font-semibold text-[#c694ad]">{label}</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <SectionCard
            title={language === "vi" ? "Ánh xạ Chi tiết API" : "API Detail Mapping"}
            subtitle={language === "vi" ? "Các trường được ánh xạ trực tiếp từ GET /api/NailDesigns/{id}." : "Fields mapped directly from GET /api/NailDesigns/{id}."}
            icon={<Eye size={18} />}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">{language === "vi" ? "Tên" : "Name"}</p>
                <p className="mt-3 text-sm font-extrabold text-[#432744]">{formatApiValue(formValues.name)}</p>
              </div>
              <div className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">{language === "vi" ? "Trạng thái" : "Status"}</p>
                <p className="mt-3 text-sm font-extrabold text-[#432744]">
                  {formValues.status === "Active" ? (language === "vi" ? "Hoạt động" : "Active") : (language === "vi" ? "Ngừng hoạt động" : "Inactive")}
                </p>
              </div>
              <div className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">{language === "vi" ? "Biến thể" : "Variants"}</p>
                <p className="mt-3 text-sm font-extrabold text-[#432744]">{formatApiValue(formValues.variantCount)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 ">
              <div className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">{language === "vi" ? "Mô tả" : "Description"}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6d5669]">
                  {formatApiValue(formValues.description)}
                </p>
              </div>

            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">{language === "vi" ? "Danh mục" : "Categories"}</p>
                  <Pill tone="purple">{apiCategoryRows.length} {language === "vi" ? "danh mục" : "item(s)"}</Pill>
                </div>
                <div className="mt-4 space-y-3">
                  {apiCategoryRows.length ? apiCategoryRows.map((category) => (
                    <div key={category.id || category.categoryId} className="rounded-[16px] border border-[#f1d7e3] bg-white p-4">
                      <p className="text-sm font-bold text-[#432744]">{formatApiValue(category.name)}</p>
                      <p className="mt-1 text-xs text-[#8c7085]">{language === "vi" ? "Loại danh mục: " : "Category Type: "}{formatApiValue(category.categoryTypeName)}</p>
                      <p className="mt-1 text-xs text-[#8c7085]">{language === "vi" ? "Trạng thái: " : "Status: "}{category.status === "Active" ? (language === "vi" ? "Hoạt động" : "Active") : (language === "vi" ? "Ngừng hoạt động" : "Inactive")}</p>
                    </div>
                  )) : (
                    <div className="rounded-[16px] border border-dashed border-[#f3c9dd] bg-white px-4 py-4 text-sm text-[#8c7085]">
                      N/A
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">{language === "vi" ? "Khoảng giá" : "Price Range"}</p>
                <p className="mt-3 text-sm font-extrabold text-[#432744]">
                  {formatApiValue(formValues.suggestedPrice === "0 VND" ? null : `${formValues.suggestedPrice}`)}
                </p>
                <p className="mt-2 text-xs text-[#8c7085]">
                  Min: {formatApiValue(formValues.minPrice ? `${formValues.minPrice.toLocaleString("vi-VN")} VND` : null)}
                </p>
                <p className="mt-1 text-xs text-[#8c7085]">
                  Max: {formatApiValue(formValues.maxPrice ? `${formValues.maxPrice.toLocaleString("vi-VN")} VND` : null)}
                </p>

              </div>
            </div>

          </SectionCard>

          <SectionCard
            title={language === "vi" ? "Hồ sơ Phù hợp Khách hàng" : "Customer Matching Profile"}

            icon={<Sparkles size={18} />}
            sectionId="customer-profile-section"
            sectionRef={customerProfileRef}
            highlighted={highlightedSection === "customer-profile"}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(formValues.customerProfile).map(([label, values]) => (
                <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                    {label}
                  </p>
                  {isEditing ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(CUSTOMER_PROFILE_OPTIONS[label] ?? []).map((option, index) => {
                          const active = values.includes(option);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={handleCustomerProfileToggle(label, option)}
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${active
                                ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93]"
                                : `text-[#8c7085] ${index % 3 === 0 ? "border-[#ead8ff] bg-[#f9f4ff]" : index % 3 === 1 ? "border-[#d7f3e0] bg-[#effcf4]" : "border-[#f8e3b3] bg-[#fff8e8]"}`
                                }`}
                            >
                              <span className="text-xs">{active ? "−" : "+"}</span>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-[#b2879f]">
                        {values.length > 0 
                          ? (language === "vi" ? `Đã chọn ${values.length} thẻ` : `Selected ${values.length} tags`) 
                          : (language === "vi" ? "Chọn một hoặc nhiều thẻ" : "Select one or more tags")
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {values.map((value, index) => (
                        <Pill key={value} tone={getProfileValueTone(index)}>
                          {value}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={language === "vi" ? "Thành phần Thiết kế" : "Design Components"}
            subtitle={language === "vi" ? "Cấu trúc cốt lõi và phong cách thiết kế" : "Core structure and styling decisions"}
            icon={<Settings2 size={18} />}
            sectionId="design-components-section"
            sectionRef={designComponentsRef}
            highlighted={highlightedSection === "design-components"}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {formValues.designComponents.map(([label, value], index) => (
                <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                    {label}
                  </p>
                  {isEditing ? (
                    <div className="mt-3 text-left">
                      <EditSelect
                        value={value}
                        onChange={handleDesignComponentChange(index)}
                        options={COMPONENT_VALUE_OPTIONS[label] ?? [value]}
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-extrabold text-[#432744]">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={language === "vi" ? "Biến thể Thiết kế" : "Design Variants"}
            subtitle={language === "vi" ? "Các biến thể có các phụ kiện và bề mặt móng khác nhau" : "Design variations have different accessories"}
            icon={<Copy size={18} />}
            sectionId="design-variants-section"
            sectionRef={designVariantsRef}
            highlighted={highlightedSection === "design-variants"}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => navigate(getAdminNailVariantCreateRoute(designId))}
                className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
              >
                <Plus size={13} className="mr-1.5 inline" />
                {language === "vi" ? "Thêm Biến thể Móng" : "Add Nail Variant"}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {formValues.variants.map((variant, index) => (
                <div
                  key={variant.id || variant.nailVariantId || `${variant.name}-${index}`}
                  className="rounded-[20px] border border-[#f7d7e5] bg-white p-3 shadow-[0_10px_20px_rgba(236,72,153,0.05)]"
                >
                  <div className="overflow-hidden rounded-[16px] bg-[#f6edf2]">
                    <NailVariantHandPreview
                      variantDetail={variant}
                      compact
                    />
                  </div>
                  {isEditing ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <InputLabel>{language === "vi" ? "Tên Biến thể" : "Variant Name"}</InputLabel>
                        <EditInput
                          value={variant.name}
                          onChange={handleVariantFieldChange(index, "name")}
                        />
                      </div>
                      <div>
                        <InputLabel>{language === "vi" ? "Mô tả" : "Description"}</InputLabel>
                        <EditTextarea
                          disabled
                          value={variant.description}
                          onChange={handleVariantFieldChange(index, "description")}
                          rows={3}
                        />
                        <p className="mt-1 text-[11px] text-[#b2879f]">
                          {language === "vi" 
                            ? "Mô tả được kết xuất từ bề mặt và phụ kiện, không được API này lưu trữ." 
                            : "Description is derived from surface and accessories, not persisted by this API."
                          }
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <InputLabel>{language === "vi" ? "Cấp độ" : "Level"}</InputLabel>
                          <EditSelect
                            disabled
                            value={variant.level}
                            onChange={handleVariantFieldChange(index, "level")}
                            options={VARIANT_LEVEL_OPTIONS}
                          />
                        </div>
                        <div>
                          <InputLabel>{language === "vi" ? "Thời gian" : "Duration"}</InputLabel>
                          <EditInput
                            className="disabled:cursor-not-allowed disabled:bg-[#f9f1f5] disabled:text-[#b2879f]"
                            disabled
                            value={variant.duration}
                            onChange={handleVariantFieldChange(index, "duration")}
                          />
                        </div>
                      </div>
                      <div>
                        <InputLabel>{language === "vi" ? "URL Hình ảnh" : "Image URL"}</InputLabel>
                        <EditInput
                          value={variant.imageUrl}
                          onChange={handleVariantFieldChange(index, "imageUrl")}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="mt-3 font-extrabold text-[#432744]">{variant.name}</h4>
                      <p className="mt-1 text-sm text-[#8c7085]">{variant.description}</p>
                    </>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="pink">{variant.materialDelta}</Pill>
                    <Pill tone="yellow">{variant.priceDelta}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="blue">{variant.level}</Pill>
                    <Pill tone="green">{formatDurationLabel(variant.duration)}</Pill>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleViewVariant(variant)}
                      className="flex-1 rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-2 text-xs font-bold text-[#ea4f93]"
                    >
                      {language === "vi" ? "Xem" : "View"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          setPendingDeleteVariant(variant);
                          return;
                        }

                        scrollToSection(designVariantsRef, {
                          startEdit: true,
                          sectionKey: "design-variants",
                        });
                      }}
                      disabled={isSavingVariants || isDeletingVariant}
                      className={`flex-1 rounded-full border px-3 py-2 text-xs font-bold ${isEditing
                        ? "border-[#f3b1c7] bg-[#fff2f6] text-[#d14c84]"
                        : "border-[#f4c6da] bg-white text-[#8c7085]"
                        }`}
                    >
                      {isEditing ? (language === "vi" ? "Xóa" : "Delete") : (language === "vi" ? "Sửa" : "Edit")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={language === "vi" ? "Chi tiết Giá & Chi phí" : "Pricing & Cost Breakdown"}
            subtitle=""
            icon={<CircleDollarSign size={18} />}
            sectionId="pricing-section"
            sectionRef={pricingRef}
            highlighted={highlightedSection === "pricing"}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="font-bold text-[#432744]">{language === "vi" ? "Chi phí Nguyên liệu" : "Material Costs"}</p>
                    <div className="mt-4 space-y-3">
                      {formValues.pricing.materialCosts.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-[#8c7085]">{language === "vi" ? (PRICING_DICT[label] || label) : label}</span>
                          <span className="font-semibold text-[#432744]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-[#432744]">{language === "vi" ? "Giá Dịch vụ" : "Service Pricing"}</p>
                    <div className="mt-4 space-y-3">
                      {formValues.pricing.servicePricing.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-[#8c7085]">{language === "vi" ? (PRICING_DICT[label] || label) : label}</span>
                          <span className="font-semibold text-[#432744]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="font-bold text-[#432744]">{language === "vi" ? "Tóm tắt" : "Summary"}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    {formValues.pricing.summary.map(([label, value], index) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-[#8c7085]">{language === "vi" ? (PRICING_DICT[label] || label) : label}</span>
                        <span
                          className={`font-semibold ${index >= 3 ? "text-[#ea4f93]" : "text-[#432744]"}`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="font-bold text-[#432744]">{language === "vi" ? "So sánh Giá" : "Price Comparison"}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    {formValues.pricing.comparison.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-[#8c7085]">{language === "vi" ? (PRICING_DICT[label] || label) : label}</span>
                        <span className={`font-semibold ${getComparisonValueTone(label)}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard
            title={language === "vi" ? "Tóm tắt Nhanh" : "Quick Summary"}
            subtitle=""
            icon={<Sparkles size={18} />}
            sectionId="quick-summary-section"
            sectionRef={quickSummaryRef}
            highlighted={highlightedSection === "quick-summary"}
          >
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <InputLabel>{language === "vi" ? "Trạng thái Thiết kế" : "Design Status"}</InputLabel>
                  <EditSelect
                    value={formValues.designStatus}
                    onChange={handleChange("designStatus")}
                    options={DESIGN_COMPONENT_OPTIONS["Design Status"]}
                  />
                </div>
                <div>
                  <InputLabel>{language === "vi" ? "Có thể Thử móng" : "Try-On Ready"}</InputLabel>
                  <select
                    value={String(formValues.tryOnReady)}
                    onChange={handleBooleanChange("tryOnReady")}
                    className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                  >
                    <option value="true">{language === "vi" ? "Có" : "Yes"}</option>
                    <option value="false">{language === "vi" ? "Không" : "No"}</option>
                  </select>
                </div>
                <div>
                  <InputLabel>{language === "vi" ? "Độ phức tạp" : "Complexity"}</InputLabel>
                  <EditSelect
                    value={formValues.complexity}
                    onChange={handleChange("complexity")}
                    options={DESIGN_COMPONENT_OPTIONS.Complexity}
                  />
                </div>
                <div>
                  <InputLabel>{language === "vi" ? "Thời gian Dự kiến" : "Est. Duration"}</InputLabel>
                  <EditSelect
                    value={formValues.estimatedDuration}
                    onChange={handleChange("estimatedDuration")}
                    options={DESIGN_COMPONENT_OPTIONS["Est. Duration"]}
                  />
                </div>
                <div>
                  <InputLabel>{language === "vi" ? "Dáng móng" : "Nail Shape"}</InputLabel>
                  <EditSelect
                    value={formValues.nailShape}
                    onChange={handleChange("nailShape")}
                    options={DESIGN_COMPONENT_OPTIONS["Nail Shape"]}
                  />
                </div>
                <div>
                  <InputLabel>{language === "vi" ? "Độ dài móng" : "Nail Length"}</InputLabel>
                  <EditSelect
                    value={formValues.nailLength}
                    onChange={handleChange("nailLength")}
                    options={DESIGN_COMPONENT_OPTIONS["Nail Length"]}
                  />
                </div>
                <div className="rounded-[16px] border border-dashed border-[#f3c9dd] bg-[#fff8fb] px-4 py-3 text-xs text-[#8c7085]">
                  {language === "vi" ? "Giá gợi ý vẫn được khóa trong chế độ chỉnh sửa." : "Suggested price remains locked in edit mode."}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {summaryRows.map(([label, value], index) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-[#8c7085]">{label}</span>
                    <span className={`font-semibold ${index === 6 ? "text-[#ea4f93]" : "text-[#432744]"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={language === "vi" ? "Hiệu suất" : "Performance"} subtitle="" icon={<BarChart3 size={18} />}>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["342", language === "vi" ? "Tổng Lượt Đặt" : "Total Bookings"],
                ["218", language === "vi" ? "Yêu thích" : "Favorites"],
                ["4.6★", language === "vi" ? "Đánh giá TB" : "Avg Rating"],
                ["61%", language === "vi" ? "Tỷ lệ quay lại" : "Repeat Rate"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[18px] bg-[#fff3f8] px-4 py-4 text-center">
                  <p className="text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                  <p className="mt-1 text-xs text-[#c694ad]">{label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={language === "vi" ? "Hành động Nhanh" : "Quick Actions"} subtitle="" icon={<Settings2 size={18} />}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  scrollToSection(heroSectionRef, { startEdit: true, sectionKey: "hero" })
                }
                className={`w-full rounded-full px-4 py-2.5 text-left text-xs font-bold text-white transition ${highlightedSection === "hero"
                  ? "bg-[image:var(--gradient-accent)] shadow-[0_14px_26px_rgba(236,72,153,0.28)] ring-4 ring-[#ffd8e8]"
                  : "bg-[image:var(--gradient-accent)]"
                  }`}
              >
                <PencilLine size={13} className="mr-1.5 inline" />
                {language === "vi" ? "Chỉnh sửa Thiết kế" : "Edit Design"}
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(getAdminNailVariantCreateRoute(designId))
                }
                className={`w-full rounded-full border px-4 py-2.5 text-left text-xs font-bold transition ${highlightedSection === "design-variants"
                  ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93] shadow-[0_12px_24px_rgba(236,72,153,0.16)] ring-4 ring-[#ffd8e8]"
                  : "border-[#f4c6da] bg-white text-[#7e6075]"
                  }`}
              >
                <Copy size={13} className="mr-1.5 inline" />
                {language === "vi" ? "Thêm Biến thể" : "Add Variant"}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(pricingRef, { sectionKey: "pricing" })}
                className={`w-full rounded-full border px-4 py-2.5 text-left text-xs font-bold transition ${highlightedSection === "pricing"
                  ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93] shadow-[0_12px_24px_rgba(236,72,153,0.16)] ring-4 ring-[#ffd8e8]"
                  : "border-[#f4c6da] bg-white text-[#7e6075]"
                  }`}
              >
                <CircleDollarSign size={13} className="mr-1.5 inline" />
                {language === "vi" ? "Cập nhật Giá" : "Update Price"}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(heroSectionRef, { sectionKey: "hero" })}
                className={`w-full rounded-full border px-4 py-2.5 text-left text-xs font-bold transition ${highlightedSection === "hero"
                  ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93] shadow-[0_12px_24px_rgba(236,72,153,0.16)] ring-4 ring-[#ffd8e8]"
                  : "border-[#f4c6da] bg-white text-[#7e6075]"
                  }`}
              >
                <Upload size={13} className="mr-1.5 inline" />
                {language === "vi" ? "Tải lên tài nguyên" : "Upload Media"}
              </button>
              <button
                type="button"
                onClick={() =>
                  scrollToSection(quickSummaryRef, {
                    startEdit: true,
                    sectionKey: "quick-summary",
                  })
                }
                className={`w-full rounded-full border px-4 py-2.5 text-left text-xs font-bold transition ${highlightedSection === "quick-summary"
                  ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93] shadow-[0_12px_24px_rgba(236,72,153,0.16)] ring-4 ring-[#ffd8e8]"
                  : "border-[#f4c6da] bg-white text-[#7e6075]"
                  }`}
              >
                <Trash2 size={13} className="mr-1.5 inline" />
                {language === "vi" ? "Lưu trữ Thiết kế" : "Archive Design"}
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title={language === "vi" ? "Xem trước Khách hàng" : "Customer Preview"}
            subtitle={language === "vi" ? "Cách khách hàng thấy thiết kế này" : "How customers see this design"}
            icon={<Eye size={18} />}
            sectionId="customer-preview-section"
            sectionRef={customerPreviewRef}
            highlighted={highlightedSection === "customer-preview"}
          >
            <div className="overflow-hidden rounded-[18px] bg-[#f6edf2]">
              <img
                crossOrigin="anonymous"
                src={formValues.previewImage || DESIGN_PREVIEW_IMAGE}
                alt={formValues.heroTitle}
                className="h-44 w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="mt-3 font-extrabold text-[#432744]">{formValues.heroTitle}</h4>
            <p className="mt-1 text-lg font-extrabold text-[#ea4f93]">{formValues.suggestedPrice}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Elegant", "Pearl", "Wedding", "Luxury"].map((tag, index) => (
                <Pill key={tag} tone={index % 2 === 0 ? "pink" : "purple"}>
                  {tag}
                </Pill>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white"
            >
              {language === "vi" ? "Thử móng Ảo" : "Try On Virtually"}
            </button>
          </SectionCard>
        </aside>
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={language === "vi" ? "Lưu Thay Đổi Thiết Kế" : "Save Design Changes"}
        subtitle={language === "vi" ? "Các thay đổi về mẫu móng và biến thể được đồng bộ hóa với máy chủ khi được các API hiện tại hỗ trợ." : "Nail design and variant edits are synced to backend when supported by the current APIs."}
        description={language === "vi" ? "Xác nhận cập nhật thiết kế móng hiện tại và bất kỳ biến thể nào đã thay đổi với các giá trị được API hỗ trợ mới nhất." : "Confirm to update the current nail design and any changed variants with the latest API-supported values."}
        confirmText={language === "vi" ? "Lưu Thay Đổi" : "Save Changes"}
        cancelText={language === "vi" ? "Xem lại" : "Review Again"}
        confirmIcon={Sparkles}
        width={520}
        loading={isSavingVariants}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[formValues.name || (language === "vi" ? "Chi tiết thiết kế" : "Design detail"), formValues.designStatus || (language === "vi" ? "Đang chờ trạng thái" : "Status pending"), formValues.complexity || (language === "vi" ? "Đang chờ độ phức tạp" : "Complexity pending")]}
        details={[
          { label: language === "vi" ? "Giá Đề xuất" : "Suggested Price", value: formValues.suggestedPrice || (language === "vi" ? "Chưa nhập giá" : "No price entered") },
          { label: language === "vi" ? "Thời Gian Dự Kiến" : "Est. Duration", value: formValues.estimatedDuration || (language === "vi" ? "Chưa nhập thời gian" : "No duration entered") },
        ]}
        warnings={[language === "vi" ? "Màn hình này hiện sẽ lưu các thay đổi thiết kế qua PUT /api/NailDesigns/{id} và các thay đổi biến thể qua PUT /api/NailVariants/{id}." : "This screen now persists design edits through PUT /api/NailDesigns/{id} and variant edits through PUT /api/NailVariants/{id}."]}
      />

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title={language === "vi" ? "Hủy Các Thay Đổi Thiết Kế" : "Discard Design Edits"}
        subtitle={language === "vi" ? "Bạn sắp rời khỏi chế độ chỉnh sửa mà không lưu." : "You are about to leave edit mode without saving."}
        description={language === "vi" ? "Các bản cập nhật chưa lưu cho thiết kế móng này sẽ bị hủy." : "Unsaved updates to this nail design will be discarded."}
        confirmText={language === "vi" ? "Hủy Thay Đổi" : "Discard Changes"}
        cancelText={language === "vi" ? "Tiếp tục Chỉnh sửa" : "Keep Editing"}
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: language === "vi" ? "Chế độ Chỉnh sửa" : "Editing Mode", value: language === "vi" ? "Chi tiết thiết kế móng" : "Nail design detail" },
          { label: language === "vi" ? "Kết quả" : "Result", value: language === "vi" ? "Khôi phục về các giá trị đã tải gần nhất" : "Revert to last loaded values" },
        ]}
        warnings={[language === "vi" ? "Các chỉnh sửa không có giá hiện tại chưa được lưu trên màn hình này sẽ bị mất. Giá cả vẫn là chỉ đọc." : "Current unsaved non-pricing edits on this screen will be lost. Pricing remains read-only."]}
      />

      <ActionConfirmModal
        open={Boolean(pendingDeleteVariant)}
        intent="danger"
        title={language === "vi" ? "Xóa Biến Thể" : "Delete Variant"}
        subtitle={language === "vi" ? "Hành động này sẽ gọi DELETE /api/NailVariants/{id}." : "This action will call DELETE /api/NailVariants/{id}."}
        description={language === "vi" ? `Bạn sắp xóa biến thể ${pendingDeleteVariant?.name ?? "này"}.` : `You are about to delete ${pendingDeleteVariant?.name ?? "this variant"}.`}
        confirmText={language === "vi" ? "Xóa Biến Thể" : "Delete Variant"}
        cancelText={language === "vi" ? "Giữ lại Biến thể" : "Keep Variant"}
        confirmIcon={Trash2}
        loading={isDeletingVariant}
        onConfirm={handleDeleteVariant}
        onCancel={() => setPendingDeleteVariant(null)}
        item={
          pendingDeleteVariant
            ? {
              title: pendingDeleteVariant.name,
              image: pendingDeleteVariant.imageUrl || formValues.previewImage || DESIGN_PREVIEW_IMAGE,
              meta: pendingDeleteVariant.level,
              note: pendingDeleteVariant.description || (language === "vi" ? "Biến thể đã chọn sẽ bị xóa khỏi thiết kế này." : "Selected variant will be removed from this design."),
            }
            : null
        }
        warnings={[language === "vi" ? "Hành động này sẽ xóa vĩnh viễn biến thể khỏi máy chủ nếu cuộc gọi API thành công." : "This permanently removes the variant from backend if the API call succeeds."]}
      />

      <Modal
        open={Boolean(selectedVariantDetail)}
        onCancel={isLoadingVariantDetail ? undefined : () => setSelectedVariantDetail(null)}
        footer={null}
        closable={false}
        centered
        width={760}
        styles={DETAIL_MODAL_STYLES}
        mask={{ closable: !isLoadingVariantDetail }}
        keyboard={!isLoadingVariantDetail}
      >
        <div className="overflow-hidden">
          <div className="bg-[linear-gradient(135deg,#fff0f6_0%,#fff8e9_100%)] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#ea4f93]">
                  <Eye size={20} />
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b25784]">
                    {language === "vi" ? "Chi Tiết Biến Thể" : "Variant Detail"}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-[#432744]">
                    {selectedVariantDetail?.name || (language === "vi" ? "Biến thể" : "Variant")}
                  </h3>
                  <p className="mt-1 text-sm text-[#9c7089]">
                    {language === "vi" ? "Dữ liệu được tải từ GET /api/NailVariants/{id}." : "Data loaded from `GET /api/NailVariants/{id}`."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVariantDetail(null)}
                disabled={isLoadingVariantDetail}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f3c9dd] bg-white/80 text-[#a35d84] transition disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close variant detail modal"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {isLoadingVariantDetail && selectedVariantDetail?.isPlaceholder ? (
            <div className="flex items-center gap-3 px-6 py-8 text-sm text-[#8c7085]">
              <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
              {language === "vi" ? "Đang tải chi tiết biến thể móng..." : "Loading nail variant detail..."}
            </div>
          ) : (
            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[20px] bg-[#f6edf2] lg:col-span-2">
                  <NailVariantHandPreview
                    variantDetail={selectedVariantDetail}
                    showShapeOverlay={false}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [language === "vi" ? "Giá cả" : "Price", selectedVariantDetail?.priceLabel || "N/A"],
                    [language === "vi" ? "Thời gian thực hiện" : "Duration", selectedVariantDetail?.durationLabel || "N/A"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-bold text-[#432744]">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                    {language === "vi" ? "Mô tả" : "Description"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6d5669]">
                    {formatApiValue(selectedVariantDetail?.description)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="font-bold text-[#432744]">{language === "vi" ? "Dáng Móng" : "Nail Shape"}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{language === "vi" ? "Tên" : "Name"}</span>
                      <span className="font-semibold text-[#432744]">
                        {formatApiValue(selectedVariantDetail?.nailShape?.name)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{language === "vi" ? "Giá" : "Price"}</span>
                      <span className="font-semibold text-[#432744]">
                        {selectedVariantDetail?.nailShape?.priceLabel || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{language === "vi" ? "Thời gian" : "Duration"}</span>
                      <span className="font-semibold text-[#432744]">
                        {selectedVariantDetail?.nailShape?.durationLabel || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="font-bold text-[#432744]">{language === "vi" ? "Bề Mặt Móng" : "Nail Surface"}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{language === "vi" ? "Tên" : "Name"}</span>
                      <span className="font-semibold text-[#432744]">
                        {formatApiValue(selectedVariantDetail?.nailSurface?.name)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{language === "vi" ? "Giá" : "Price"}</span>
                      <span className="font-semibold text-[#432744]">
                        {selectedVariantDetail?.nailSurface?.priceLabel || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{language === "vi" ? "Thời gian" : "Duration"}</span>
                      <span className="font-semibold text-[#432744]">
                        {selectedVariantDetail?.nailSurface?.durationLabel || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <p className="font-bold text-[#432744]">{language === "vi" ? "Xem trước Màu sắc" : "Color Preview"}</p>
                {extractVariantColors(selectedVariantDetail?.colorJson).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {extractVariantColors(selectedVariantDetail?.colorJson).length > 1 ? (
                      <div className="w-[170px] rounded-[18px] border border-[#f4d4e2] bg-white p-3 shadow-[0_8px_20px_rgba(236,72,153,0.05)]">
                        <div
                          className="h-16 rounded-[14px] border border-white shadow-inner"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${extractVariantColors(selectedVariantDetail?.colorJson).join(", ")})`,
                          }}
                        />
                        <p className="mt-3 text-center text-[11px] font-bold text-[#6d5669]">{language === "vi" ? "Phối màu Gradient" : "Gradient Mix"}</p>
                      </div>
                    ) : null}
                    {extractVariantColors(selectedVariantDetail?.colorJson).map((color) => (
                      <div
                        key={color}
                        className="w-[110px] rounded-[18px] border border-[#f4d4e2] bg-white p-3 shadow-[0_8px_20px_rgba(236,72,153,0.05)]"
                      >
                        <div
                          className="h-16 rounded-[14px] border border-white shadow-inner"
                          style={{ backgroundColor: color }}
                        />
                        <p className="mt-3 text-center text-[11px] font-bold text-[#6d5669]">{color}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="mt-4 overflow-x-auto rounded-[16px] bg-[#fff] p-4 text-xs leading-6 text-[#6d5669]">
                    {selectedVariantDetail?.colorJson || "N/A"}
                  </pre>
                )}
              </div>

              <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-[#432744]">{language === "vi" ? "Quy Trình Thực Hiện" : "Procedure Steps"}</p>

                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addVariantProcedureDraft}
                      disabled={isLoadingVariantProcedures || isSavingVariantProcedures}
                      className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                    >
                      <Plus size={13} className="mr-1.5 inline" />
                      {language === "vi" ? "Thêm Bước" : "Add Step"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveVariantProcedures()}
                      disabled={isLoadingVariantProcedures || isSavingVariantProcedures}
                      className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
                    >
                      <Save size={13} className="mr-1.5 inline" />
                      {isSavingVariantProcedures ? (language === "vi" ? "Đang lưu..." : "Saving...") : (language === "vi" ? "Lưu Các Bước" : "Save Steps")}
                    </button>
                  </div>
                </div>

                {isLoadingVariantProcedures ? (
                  <div className="mt-4 flex items-center gap-3 text-sm text-[#8c7085]">
                    <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                    {language === "vi" ? "Đang tải cấu hình quy trình..." : "Loading procedure configuration..."}
                  </div>
                ) : variantProcedureDraft.length ? (
                  <div className="mt-4 space-y-3">
                    {variantProcedureDraft.map((item, index) => (
                      <div
                        key={`${item.procedureId || "draft"}-${index}`}
                        className="rounded-[18px] border border-[#f1d7e3] bg-white p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-[110px_minmax(0,1fr)_auto]">
                          <label className="space-y-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                              {language === "vi" ? "Thứ tự bước" : "Step Order"}
                            </span>
                            <EditInput
                              value={String(item.stepOrder || index + 1)}
                              onChange={(event) =>
                                updateVariantProcedureDraft(index, "stepOrder", event.target.value)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeVariantProcedureDraft(index)}
                            disabled={isSavingVariantProcedures}
                            className="self-end rounded-full border border-[#f3b1c7] bg-[#fff2f6] px-4 py-2 text-xs font-bold text-[#d14c84]"
                          >
                            {language === "vi" ? "Xóa" : "Remove"}
                          </button>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c694ad]">{language === "vi" ? "Tên" : "Name"}</p>
                            <p className="mt-1 font-semibold text-[#432744]">{item.name || "--"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c694ad]">{language === "vi" ? "Thời gian" : "Duration"}</p>
                            <p className="mt-1 font-semibold text-[#432744]">{item.durationLabel || "--"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c694ad]">{language === "vi" ? "Trạng thái" : "Status"}</p>
                            <p className="mt-1 font-semibold text-[#432744]">{item.status || "--"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c694ad]">{language === "vi" ? "Bắt buộc" : "Required"}</p>
                            <p className="mt-1 font-semibold text-[#432744]">{item.isRequired ? (language === "vi" ? "Có" : "Yes") : (language === "vi" ? "Không" : "No")}</p>
                          </div>
                        </div>
                        {item.description ? (
                          <p className="mt-3 text-sm leading-6 text-[#6d5669]">{item.description}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[16px] border border-dashed border-[#f3c9dd] bg-white px-4 py-4 text-sm text-[#8c7085]">
                    {language === "vi" ? "Chưa có quy trình nào được cấu hình cho biến thể này. Thêm hàng và lưu để gọi POST /api/Procedures/assign/{nailVariantId}." : "No procedures configured for this variant yet. Add rows and save to call POST /api/Procedures/assign/{nailVariantId}."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
