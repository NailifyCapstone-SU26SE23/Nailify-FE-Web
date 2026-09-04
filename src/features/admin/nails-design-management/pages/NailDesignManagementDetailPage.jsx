import { Modal } from "antd";
import {
  Copy,
  Eye,
  LoaderCircle,
  PencilLine,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
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
  fetchAdminCategories,
  fetchAdminNailDesignDetail,
  fetchAdminNailDesignSummary,
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

const DETAIL_MODAL_STYLES = {
  body: { padding: 0 },
  content: { borderRadius: 24, overflow: "hidden" },
};

const EMPTY_SUMMARY = {
  totalBookings: 0,
  totalFavorites: 0,
  averageRating: 0,
  ratingCount: 0,
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

export function NailDesignManagementDetailPage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const heroSectionRef = useRef(null);
  const designVariantsRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [initialDesign, setInitialDesign] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [designImageFile, setDesignImageFile] = useState(null);
  const [designImagePreviewUrl, setDesignImagePreviewUrl] = useState("");
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
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDesignDetail = async () => {
      setIsLoading(true);
      setError("");
      setIsNotFound(false);

      try {
        const [detail, categoryResponse, summaryResponse] = await Promise.all([
          fetchAdminNailDesignDetail(designId),
          fetchAdminCategories({ pageNumber: 1, pageSize: 100 }),
          fetchAdminNailDesignSummary(designId).catch(() => EMPTY_SUMMARY),
        ]);

        if (!isMounted) {
          return;
        }

        setInitialDesign(detail);
        setFormValues(detail);
        setCategoryRecords(categoryResponse.items);
        setSummary(summaryResponse);
        setDesignImageFile(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setInitialDesign(null);
        setFormValues(null);
        setSummary(EMPTY_SUMMARY);

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

  useEffect(() => {
    if (!designImageFile) {
      setDesignImagePreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(designImageFile);
    setDesignImagePreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [designImageFile]);

  if (isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)] px-4 py-10">
        <div className="flex items-center gap-3 rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 text-sm text-[#b38a9f] shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          {t("adminNailsDesignManagement.loadingNailDesignDetail")}
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

  const toggleCategory = (categoryId) => {
    setFormValues((current) => {
      const currentCategoryIds = Array.isArray(current?.categoryIds) ? current.categoryIds : [];
      const nextCategoryIds = currentCategoryIds.includes(categoryId)
        ? currentCategoryIds.filter((value) => value !== categoryId)
        : [...currentCategoryIds, categoryId];
      const nextCategoryNames = categoryRecords
        .filter((category) => nextCategoryIds.includes(category.categoryId))
        .map((category) => category.name);

      return {
        ...current,
        categoryIds: nextCategoryIds,
        categoryNames: nextCategoryNames,
        categories: categoryRecords.filter((category) => nextCategoryIds.includes(category.categoryId)),
      };
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const scrollToSection = (sectionRef, options = {}) => {
    if (options.startEdit) {
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
    setDesignImageFile(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setError("");

    const initialVariants = Array.isArray(initialDesign?.variants) ? initialDesign.variants : [];
    const currentVariants = Array.isArray(formValues?.variants) ? formValues.variants : [];
    const designNameChanged =
      String(initialDesign?.name || "").trim() !== String(formValues?.heroTitle || "").trim();
    const designDescriptionChanged =
      String(initialDesign?.description || "").trim()
      !== String(formValues?.heroSubtitle || "").trim();
    const initialCategoryIds = Array.isArray(initialDesign?.categoryIds)
      ? initialDesign.categoryIds.map(Number).filter(Boolean).sort((a, b) => a - b)
      : [];
    const currentCategoryIds = Array.isArray(formValues?.categoryIds)
      ? formValues.categoryIds.map(Number).filter(Boolean).sort((a, b) => a - b)
      : [];
    const categoriesChanged = initialCategoryIds.join(",") !== currentCategoryIds.join(",");
    const imagesChanged = Boolean(designImageFile);
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

    if (!designNameChanged && !designDescriptionChanged && !categoriesChanged && !imagesChanged && !variantsToUpdate.length) {
      toast.error("No API-backed changes detected. Other edits on this screen remain local only.");
      setIsEditing(false);
      return;
    }

    setIsSavingVariants(true);

    try {
      if (designNameChanged || designDescriptionChanged || categoriesChanged || imagesChanged) {
        const designDetail = await updateAdminNailDesign(designId, {
          name: formValues?.heroTitle,
          description: formValues?.heroSubtitle,
          categoryIds: formValues?.categoryIds,
          nailVariantIds: currentVariants.map((variant) => variant.nailVariantId),
          existingImageUrls: formValues?.imageUrl ? [formValues.imageUrl] : [],
          image: designImageFile,
        });
        toast.success(
          language === "vi"
            ? `Lưu các thay đổi cơ bản thành công. Vẫn giữ lại #${designDetail.id}.`
            : `Saved basic changes successfully. Kept #${designDetail.id}.`
        );
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
      setDesignImageFile(null);

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
      toast.success(`Deleted variant "${pendingDeleteVariant.name}".`);
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
      toast.success(`Updated procedure steps for "${selectedVariantDetail.name}".`);
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
              {t("adminNailsDesignManagement.nailDesigns")}<span className="text-[#ea4f93]">{formValues.breadcrumbsLabel}</span>
            </p>
            <h2 className="mt-1 text-[1.7rem] font-extrabold text-[#432744]">
              {t("adminNailsDesignManagement.nailDesignDetail")}
            </h2>
            <p className="mt-1 text-sm text-[#c694ad]">
              {t("adminNailsDesignManagement.viewAndEditDesignDetailsWorkfl")
              }
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-[#eaf9ee] px-4 py-2 text-xs font-bold text-[#2fa25f]">
              {formValues.designStatus === "Active" ? t("adminNailsDesignManagement.active") : t("adminNailsDesignManagement.inactive")}
            </span>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSavingVariants || isDeletingVariant}
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
                >
                  {isSavingVariants ? t("adminNailsDesignManagement.saving") : t("adminNailsDesignManagement.saveChanges")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)} // Just exit edit mode without resetting
                  disabled={isSavingVariants || isDeletingVariant}
                  className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#7e6075]"
                >
                  {t("adminNailsDesignManagement.cancel")}
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
                  {t("adminNailsDesignManagement.editDesign")}
                </button>

              </>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
          {error}
        </div>
      ) : null}

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
            <div className="lg:order-2">
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
                  <div className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c694ad]">
                      {t("adminNailsDesignManagement.category")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categoryRecords.length ? (
                        categoryRecords.map((category) => (
                          <button
                            key={category.categoryId}
                            type="button"
                            onClick={() => toggleCategory(category.categoryId)}
                            className={`rounded-full border px-4 py-2 text-xs font-bold transition ${formValues.categoryIds?.includes(category.categoryId)
                              ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93]"
                              : "border-[#f4c6da] bg-white text-[#8c7085] hover:border-[#ef6bb4]"
                              }`}
                          >
                            {category.name}
                          </button>
                        ))
                      ) : (
                        <span className="text-sm text-[#b2879f]">{t("adminNailsDesignManagement.loading")}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="mt-2 text-4xl font-extrabold leading-tight text-[#432744]">
                    {formValues.heroTitle}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#7c6678]">
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
              <div className="mt-5 grid grid-cols-4 gap-3">
                {[
                  [t("adminNailsDesignManagement.totalBookings"), summary.totalBookings],
                  [t("adminNailsDesignManagement.favorites"), summary.totalFavorites],
                  [t("adminNailsDesignManagement.avgRating"), `${summary.averageRating.toFixed(2)}★`],
                  [t("adminNailsDesignManagement.ratingCount"), summary.ratingCount],

                ].map(([label, value]) => (
                  <div key={label} className="rounded-[18px] bg-[#fff3f8] px-4 py-4">
                    <p className="text-xs font-semibold text-[#c694af]">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="aspect-[4/3] overflow-hidden rounded-[18px] border border-[#f7d7e5] bg-[#f6edf2]">
                <img
                  crossOrigin="anonymous"
                  src={designImagePreviewUrl || formValues.previewImage || DESIGN_PREVIEW_IMAGE}
                  alt={formValues.heroTitle}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => document.getElementById("edit-design-image-input")?.click()}
                    className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                  >
                    <Upload size={13} className="mr-1.5 inline" />
                    {t("adminNailsDesignManagement.chooseDesignImages")}
                  </button>
                ) : null}
              </div>
              {isEditing ? (
                <>
                  <input
                    id="edit-design-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => setDesignImageFile(event.target.files?.[0] ?? null)}
                  />
                  <p className="text-center text-xs text-[#b2879f]">
                    {designImageFile ? designImageFile.name : t("adminNailsDesignManagement.noDesignImagesSelected")}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </article>
        <SectionCard
          title={
            <div className="flex items-center justify-between w-full" style={{ width: '100%' }}>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Copy size={18} />
                <span>{t("adminNailsDesignManagement.designVariants")}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(getAdminNailVariantCreateRoute(designId))}
                className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] whitespace-nowrap flex-shrink-0 ml-210"
              >
                <Plus size={13} className="mr-1.5 inline" />
                {t("adminNailsDesignManagement.addNailVariant")}
              </button>
            </div>
          }
          subtitle={t("adminNailsDesignManagement.designVariationsHaveDifferentA")}
          icon={null}
          sectionId="design-variants-section"
          sectionRef={designVariantsRef}
          highlighted={highlightedSection === "design-variants"}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {formValues.variants.map((variant, index) => (
              <div
                key={variant.id || variant.nailVariantId || `${variant.name}-${index}`}
                className="rounded-[20px] border border-[#f7d7e5] bg-white p-3 shadow-[0_10px_20px_rgba(236,72,153,0.05)] cursor-pointer transition-all duration-200 hover:shadow-[0_16px_32px_rgba(236,72,153,0.12)] hover:border-[#ea4f93]"
                onClick={() => handleViewVariant(variant)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleViewVariant(variant);
                  }
                }}
              >
                <div className="overflow-hidden rounded-[16px] bg-[#f6edf2]">
                  <NailVariantHandPreview
                    variantDetail={variant}
                    compact
                  />
                </div>
                <h4 className="mt-3 font-extrabold text-[#432744]">{variant.name}</h4>
                <p className="mt-1 text-sm text-[#8c7085]">{variant.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="yellow">{variant.priceDelta}</Pill>
                  <Pill tone="green">{formatDurationLabel(variant.duration)}</Pill>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title={t("adminNailsDesignManagement.discardDesignEdits")}
        subtitle={t("adminNailsDesignManagement.youAreAboutToLeaveEditModeWith")}
        description={t("adminNailsDesignManagement.unsavedUpdatesToThisNailDesign")}
        confirmText={t("adminNailsDesignManagement.discardChanges")}
        cancelText={t("adminNailsDesignManagement.keepEditing")}
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: t("adminNailsDesignManagement.editingMode"), value: t("adminNailsDesignManagement.nailDesignDetail1") },
          { label: t("adminNailsDesignManagement.result"), value: t("adminNailsDesignManagement.revertToLastLoadedValues") },
        ]}
        warnings={[t("adminNailsDesignManagement.currentUnsavedNonpricingEditsO")]}
      />

      <ActionConfirmModal
        open={Boolean(pendingDeleteVariant)}
        intent="danger"
        title={t("adminNailsDesignManagement.deleteVariant")}
        subtitle={t("adminNailsDesignManagement.thisActionWillCallDeleteApinai")}
        description={language === "vi" ? `Bạn sắp xóa biến thể ${pendingDeleteVariant?.name ?? "này"}.` : `You are about to delete ${pendingDeleteVariant?.name ?? "this variant"}.`}
        confirmText={t("adminNailsDesignManagement.deleteVariant")}
        cancelText={t("adminNailsDesignManagement.keepVariant")}
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
              note: pendingDeleteVariant.description || (t("adminNailsDesignManagement.selectedVariantWillBeRemovedFr")),
            }
            : null
        }
        warnings={[t("adminNailsDesignManagement.thisPermanentlyRemovesTheVaria")]}
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
                    {t("adminNailsDesignManagement.variantDetail")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-[#432744]">
                    {selectedVariantDetail?.name || (t("adminNailsDesignManagement.variant"))}
                  </h3>
                  <p className="mt-1 text-sm text-[#9c7089]">
                    {t("adminNailsDesignManagement.dataLoadedFromGetApinailvarian")}
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
              {t("adminNailsDesignManagement.loadingNailVariantDetail")}
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
                    [t("adminNailsDesignManagement.price"), selectedVariantDetail?.priceLabel || "N/A"],
                    [t("adminNailsDesignManagement.duration"), selectedVariantDetail?.durationLabel || "N/A"],
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
                    {t("adminNailsDesignManagement.description")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6d5669]">
                    {formatApiValue(selectedVariantDetail?.description)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="font-bold text-[#432744]">{t("adminNailsDesignManagement.nailShape")}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{t("adminNailsDesignManagement.name")}</span>
                      <span className="font-semibold text-[#432744]">
                        {formatApiValue(selectedVariantDetail?.nailShape?.name)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{t("adminNailsDesignManagement.price")}</span>
                      <span className="font-semibold text-[#432744]">
                        {selectedVariantDetail?.nailShape?.priceLabel || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{t("adminNailsDesignManagement.duration")}</span>
                      <span className="font-semibold text-[#432744]">
                        {selectedVariantDetail?.nailShape?.durationLabel || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="font-bold text-[#432744]">{t("adminNailsDesignManagement.nailSurface")}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{t("adminNailsDesignManagement.name")}</span>
                      <span className="font-semibold text-[#432744]">
                        {formatApiValue(selectedVariantDetail?.nailSurface?.name)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{t("adminNailsDesignManagement.price")}</span>
                      <span className="font-semibold text-[#432744]">
                        {selectedVariantDetail?.nailSurface?.priceLabel || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8c7085]">{t("adminNailsDesignManagement.duration")}</span>
                      <span className="font-semibold text-[#432744]">
                        {selectedVariantDetail?.nailSurface?.durationLabel || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <p className="font-bold text-[#432744]">{t("adminNailsDesignManagement.colorPreview")}</p>
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
                        <p className="mt-3 text-center text-[11px] font-bold text-[#6d5669]">{t("adminNailsDesignManagement.gradientMix")}</p>
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
                    <p className="font-bold text-[#432744]">{t("adminNailsDesignManagement.procedureSteps")}</p>

                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addVariantProcedureDraft}
                      disabled={isLoadingVariantProcedures || isSavingVariantProcedures}
                      className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                    >
                      <Plus size={13} className="mr-1.5 inline" />
                      {t("adminNailsDesignManagement.addStep")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveVariantProcedures()}
                      disabled={isLoadingVariantProcedures || isSavingVariantProcedures}
                      className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
                    >
                      <Save size={13} className="mr-1.5 inline" />
                      {isSavingVariantProcedures ? (t("adminNailsDesignManagement.saving")) : (t("adminNailsDesignManagement.saveSteps"))}
                    </button>
                  </div>
                </div>

                {isLoadingVariantProcedures ? (
                  <div className="mt-4 flex items-center gap-3 text-sm text-[#8c7085]">
                    <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                    {t("adminNailsDesignManagement.loadingProcedureConfiguration")}
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
                              {t("adminNailsDesignManagement.stepOrder")}
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
                            {t("adminNailsDesignManagement.remove")}
                          </button>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c694ad]">{t("adminNailsDesignManagement.name")}</p>
                            <p className="mt-1 font-semibold text-[#432744]">{item.name}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c694ad]">{t("adminNailsDesignManagement.duration")}</p>
                            <p className="mt-1 font-semibold text-[#432744]">{item.durationLabel}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c694ad]">{t("adminNailsDesignManagement.status")}</p>
                            <p className="mt-1 font-semibold text-[#432744]">{item.status}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c694ad]">{t("adminNailsDesignManagement.required")}</p>
                            <p className="mt-1 font-semibold text-[#432744]">{item.isRequired ? (t("adminNailsDesignManagement.yes")) : (t("adminNailsDesignManagement.no"))}</p>
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
                    {t("adminNailsDesignManagement.noProceduresConfiguredForThisV")}
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
