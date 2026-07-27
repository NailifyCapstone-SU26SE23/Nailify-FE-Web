import {
  ArrowLeft,
  Camera,
  Eye,
  Image,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getAdminNailDesignDetailRoute,
  getAdminNailVariantDetailRoute,
  getAdminNailVariantTryOnRoute,
  ROUTES,
} from "../../../../shared/constants/routes";
import {
  assignProceduresToVariant,
  fetchAdminNailVariantDetail,
  fetchProceduresByVariant,
  fetchAdminNailVariantReferences,
  updateAdminNailVariant,
} from "../services/nailDesignManagementService";
import {
  buildColorJsonFromTryOn,
  createVariantNailComponents,
  findShapeId,
  findSurfaceId,
} from "../utils/variantTryOnUtils";
import { fetchAdminProcedures } from "../../procedures-management/services/proceduresManagementService";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseShaderParam(shaderParam) {
  const rawValue = String(shaderParam || "").trim();
  if (!rawValue) return {};
  try {
    return JSON.parse(rawValue);
  } catch {
    return {};
  }
}

function NailSurface3DLayer({ surface }) {
  if (!surface) return null;
  const config = parseShaderParam(surface.shaderParam);

  const textureType = String(config?.texture?.type || "").toLowerCase();
  const isMatte = textureType.includes("matte") || config?.shine?.enabled === false;
  const hasChrome = Boolean(config?.metalness?.enabled || config?.mirrorEffect?.enabled);
  const hasRainbow = Boolean(config?.iridescence?.enabled || config?.holographic?.enabled);

  const roughness = clamp(Number(config?.texture?.roughness ?? (isMatte ? 0.8 : 0.1)), 0, 1);
  const metalness = hasChrome ? clamp(Number(config?.metalness?.intensity || 0.9), 0, 1) : 0;
  const clearcoat = isMatte ? 0 : clamp(Number(config?.shine?.opacity || 1), 0, 1);
  const iridescence = hasRainbow ? clamp(Number(config?.iridescence?.intensity || 0.8), 0, 1) : 0;

  return (
    <div className="absolute inset-0 h-full w-full pointer-events-none mix-blend-screen">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={isMatte ? 0.6 : 0.2} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <directionalLight position={[-5, -10, 5]} intensity={0.5} />
        <Environment preset="studio" />

        {/* Generic convex sphere providing 3D curvature. CSS shapeMask clips it to exact nail shape. */}
        <mesh scale={[1.4, 2.8, 0.6]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial
            color={new THREE.Color(0x000000)} // Black base becomes 100% transparent via CSS mix-blend-screen
            roughness={roughness}
            metalness={metalness}
            clearcoat={clearcoat}
            iridescence={iridescence}
            transparent={true}
            depthWrite={false}
          />
        </mesh>
      </Canvas>
    </div>
  );
}


function isHexColor(value) {
  return /^#(?:[0-9a-f]{3}){1,2}$/i.test(String(value || "").trim());
}

function extractVariantColors(colorJson) {
  const rawValue = String(colorJson || "").trim();
  const parsedColors = [];

  const collectColors = (value) => {
    if (Array.isArray(value)) {
      value.forEach(collectColors);
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value).forEach(collectColors);
      return;
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      if (isHexColor(normalized)) {
        parsedColors.push(normalized);
      }
    }
  };

  try {
    collectColors(JSON.parse(rawValue));
  } catch {
    collectColors(rawValue);
  }

  return [...new Set(parsedColors)];
}

function Pill({ children, tone = "default" }) {
  const toneMap = {
    default: "border-[#f4c6da] bg-white text-[#8c7085]",
    pink: "border-[#ffd1e3] bg-[#fff0f7] text-[#ea4f93]",
    purple: "border-[#ead8ff] bg-[#f5ecff] text-[#8b5cf6]",
    blue: "border-[#dce7ff] bg-[#eef4ff] text-[#4a72d8]",
    yellow: "border-[#f8e3b3] bg-[#fff4df] text-[#d9871c]",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

function DetailCard({ title, children }) {
  return (
    <article className="rounded-[20px] border border-[#f7d7e5] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
      <h2 className="font-extrabold text-[#432744]">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  );
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
    return { backgroundColor: "#f9c2d8" };
  }

  if (typeof colorConfig === "string") {
    return { backgroundColor: colorConfig };
  }

  if (Array.isArray(colorConfig)) {
    const color = String(colorConfig[fingerIndex - 1] || colorConfig[fingerIndex] || colorConfig[0] || "#f9c2d8").trim();
    return { backgroundColor: color || "#f9c2d8" };
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

  if (colorConfig.mode === "gradient" && colorConfig.primaryColor && colorConfig.secondaryColor) {
    return { background: `linear-gradient(to bottom, ${colorConfig.primaryColor}, ${colorConfig.secondaryColor})` };
  }

  if (colorConfig.color) {
    return { backgroundColor: colorConfig.color };
  }

  if (colorConfig.primaryColor) {
    return { backgroundColor: colorConfig.primaryColor };
  }

  return { backgroundColor: "#f9c2d8" };
}

function normalizeComponentPosition(value, fallbackPercent = 50) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallbackPercent;
  }

  if (Math.abs(numericValue) <= 1) {
    return Math.max(0, Math.min(100, 50 + numericValue * 100));
  }

  return Math.max(0, Math.min(100, numericValue));
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

function getFingerAlignmentClass(fingerName) {
  switch (fingerName) {
    case "Thumb":
      return "translate-y-8 -rotate-[14deg] md:translate-y-10";
    case "Index":
      return "translate-y-2 -rotate-[4deg]";
    case "Middle":
      return "-translate-y-3";
    case "Ring":
      return "rotate-[2deg]";
    case "Pinky":
      return "translate-y-6 rotate-[10deg] md:translate-y-8";
    default:
      return "";
  }
}

function NailVariantHandPreview({ variantDetail }) {
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

  return (
    <div className="rounded-[24px] border border-[#f7d7e5] bg-[radial-gradient(circle_at_top,#fffdfd_0%,#fff6fb_58%,#fff2f8_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex min-h-[300px] flex-wrap items-center justify-center gap-5 lg:gap-6">
        {fingerDefinitions.map((finger) => {
          const colorStyle = buildFingerColorStyle(colorConfig, finger.fingerIndex);

          return (
            <div
              key={finger.label}
              className={`flex flex-col items-center gap-3.5 transition-all duration-500 ease-out ${getFingerAlignmentClass(finger.label)}`}
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-t-[36px] rounded-b-[18px] bg-gradient-to-t from-[#ea4f93]/15 to-[#ffb8d9]/5 opacity-30 blur-md" />
                <div className="relative h-48 w-24 overflow-hidden rounded-t-[32px] rounded-b-[14px] border-2 border-[#fcd5e6] bg-gradient-to-b from-[#fff6f9] to-[#ffeef5] shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
                  <div className="absolute inset-0 h-full w-full" style={shapeMaskStyle}>
                    <div className="absolute inset-0 h-full w-full" style={colorStyle} />

                    {(variantDetail?.nailComponents || []).filter((item) => {
                      const componentFingerIndex = Number(item?.fingerIndex);
                      return componentFingerIndex === -1 || componentFingerIndex === finger.fingerIndex;
                    }).map((componentItem, index) => {
                      const component = componentItem?.component;
                      if (!component?.imageUrl) {
                        return null;
                      }

                      const config = parseComponentConfig(componentItem.configJson);
                      const scale = Number.isFinite(Number(config?.scale)) ? Number(config.scale) : 1;
                      const rotation = Number.isFinite(Number(config?.rotation)) ? Number(config.rotation) : 0;
                      const left = normalizeComponentPosition(componentItem?.posX, 50);
                      const top = normalizeComponentPosition(componentItem?.posY, 50);

                      return (
                        <img
                          key={`${componentItem?.nailComponentId || index}-${finger.fingerIndex}`}
                          crossOrigin="anonymous"
                          src={component.imageUrl}
                          alt={component.name || "component"}
                          className="pointer-events-none absolute h-12 w-12 object-contain drop-shadow-[0_6px_10px_rgba(234,79,147,0.18)]"
                          referrerPolicy="no-referrer"
                          style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            transform: `translate(-50%, -50%) scale(${Math.max(1, scale * 1.25)}) rotate(${rotation}deg)`,
                          }}
                        />
                      );
                    })}

                    <NailSurface3DLayer surface={variantDetail?.nailSurface} />
                  </div>

                  {variantDetail?.nailShape?.imageUrl ? (
                    <img
                      crossOrigin="anonymous"
                      src={variantDetail.nailShape.imageUrl}
                      alt="shape mask"
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
              </div>

              <span className="rounded-full border border-[#fce6f3] bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)]">
                {finger.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NailVariantDetailPage() {
  const { designId, variantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [variant, setVariant] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [availableProcedures, setAvailableProcedures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProcedures, setIsSavingProcedures] = useState(false);
  const [isSavingTryOn, setIsSavingTryOn] = useState(false);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);
  const colors = extractVariantColors(variant?.colorJson);

  const pendingTryOnConfig = location.state?.tryOnConfig;

  useEffect(() => {
    let isMounted = true;

    const loadVariant = async () => {
      setIsLoading(true);
      setError("");
      setIsNotFound(false);

      try {
        const [detail, loadedProcedures, availableProcsResp] = await Promise.all([
          fetchAdminNailVariantDetail(variantId),
          fetchProceduresByVariant(variantId),
          fetchAdminProcedures({ pageSize: 100 }),
        ]);

        if (isMounted) {
          setVariant(detail);
          setProcedures(loadedProcedures);
          setAvailableProcedures(availableProcsResp?.items || []);
          setError("");
        }
      } catch (loadError) {
        if (!isMounted) return;

        const statusCode = loadError && typeof loadError === "object" ? loadError.response?.status : undefined;
        if (statusCode === 404) {
          setIsNotFound(true);
        } else {
          setError(loadError instanceof Error ? loadError.message : "Failed to load nail variant detail.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadVariant();

    return () => {
      isMounted = false;
    };
  }, [variantId]);

  const updateProcedureDraft = (index, field, value) => {
    setProcedures((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "procedureId") {
          const selectedProc = availableProcedures.find((p) => p.id === value || p.procedureId === value);
          if (selectedProc) {
            return {
              ...item,
              procedureId: selectedProc.id || selectedProc.procedureId,
              name: selectedProc.name,
              description: selectedProc.description,
              durationLabel: selectedProc.durationLabel || selectedProc.duration,
              status: selectedProc.status,
              isRequired: selectedProc.isRequired,
            };
          }
          return { ...item, procedureId: value };
        }

        return { ...item, [field]: value };
      }),
    );
  };

  const addProcedureDraft = () => {
    setProcedures((current) => [
      ...current,
      {
        procedureId: "",
        name: "",
        description: "",
        duration: 0,
        durationLabel: "--",
        status: "--",
        isRequired: false,
        stepOrder: current.length + 1,
      },
    ]);
  };

  const saveProcedureSteps = async () => {
    if (!variant?.nailVariantId) return;

    setIsSavingProcedures(true);
    setError("");

    try {
      await assignProceduresToVariant(
        variant.nailVariantId,
        procedures.map((item, index) => ({
          procedureId: item.procedureId,
          stepOrder: Number(item.stepOrder || index + 1),
        })),
      );
      setProcedures(await fetchProceduresByVariant(variant.nailVariantId));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save procedure steps.");
    } finally {
      setIsSavingProcedures(false);
    }
  };

  const openTryOn = (mode) => {
    navigate(getAdminNailVariantTryOnRoute(designId, variantId, mode), {
      state: {
        returnTo: getAdminNailVariantDetailRoute(designId, variantId),
      },
    });
  };

  const handleSaveTryOn = async () => {
    if (!pendingTryOnConfig) return;
    setIsSavingTryOn(true);
    setError("");

    try {
      const references = await fetchAdminNailVariantReferences();
      const nailShapeId = findShapeId(references.shapes, pendingTryOnConfig);
      const nailSurfaceId = findSurfaceId(references.surfaces, pendingTryOnConfig);

      if (!nailShapeId || !nailSurfaceId) {
        throw new Error("Nail shape and surface references are required before saving.");
      }

      await updateAdminNailVariant(variantId, {
        name: variant.name,
        nailShapeId,
        nailSurfaceId,
        nailDesignId: variant.nailDesignId || Number(designId || 0),
        imageUrl: variant.imageUrl,
        colorJson: buildColorJsonFromTryOn(pendingTryOnConfig),
      });

      await createVariantNailComponents(variantId, pendingTryOnConfig);

      // clear state and reload variant
      navigate(getAdminNailVariantDetailRoute(designId, variantId), { replace: true });

      const [detail, loadedProcedures] = await Promise.all([
        fetchAdminNailVariantDetail(variantId),
        fetchProceduresByVariant(variantId),
      ]);
      setVariant(detail);
      setProcedures(loadedProcedures);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Try-On setup");
    } finally {
      setIsSavingTryOn(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center bg-[#fff7fb] px-4 py-10">
        <div className="flex items-center gap-3 rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 text-sm text-[#b38a9f]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          Loading nail variant detail...
        </div>
      </section>
    );
  }

  if (isNotFound) {
    return <Navigate to={ROUTES.adminNailDesigns} replace />;
  }

  if (!variant) {
    return (
      <section className="flex min-h-full items-center justify-center bg-[#fff7fb] px-4 py-10">
        <div className="rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 text-sm font-medium text-[#d14c84]">
          {error || "Failed to load nail variant detail."}
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[#fff7fb]">
      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-[#c694ad]">
              Nail Designs / <span className="text-[#ea4f93]">Variant Detail</span>
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#432744]">{variant.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#8c7085]">{variant.description || "--"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(getAdminNailDesignDetailRoute(designId))}
              className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#8c7085]"
            >
              <ArrowLeft size={14} className="mr-1.5 inline" />
              Back to Design
            </button>
            <button
              type="button"
              onClick={() => openTryOn(undefined)}
              className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <Sparkles size={14} className="mr-1.5 inline" />
              Set Up Try On
            </button>
            <button
              type="button"
              onClick={() => openTryOn("image")}
              className="rounded-full bg-[#4a72d8] px-4 py-2 text-xs font-bold text-white"
            >
              <Image size={14} className="mr-1.5 inline" />
              Photo Try On
            </button>
            <button
              type="button"
              onClick={() => openTryOn("live")}
              className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
            >
              <Camera size={14} className="mr-1.5 inline" />
              Live Try On
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[18px] border border-[#f4bfd2] bg-[#fff1f6] px-5 py-3 text-sm font-semibold text-[#d14c84]">
          {error}
        </div>
      ) : null}

      {pendingTryOnConfig && !error ? (
        <div className="flex items-center justify-between rounded-[18px] border border-[#f4bfd2] bg-[#fff1f6] px-5 py-3">
          <p className="text-sm font-semibold text-green-700 px-4 py-2 border border-green-400 rounded-full bg-green-100">You have unsaved Try-On changes.</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(getAdminNailVariantDetailRoute(designId, variantId), { replace: true })}
              disabled={isSavingTryOn}
              className="rounded-full border border-[#f4bfd2] bg-white px-4 py-2 text-xs font-bold text-[#d14c84]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTryOn}
              disabled={isSavingTryOn}
              className="rounded-full bg-[#d14c84] px-4 py-2 text-xs font-bold text-white shadow"
            >
              {isSavingTryOn ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <DetailCard title="Variant Overview">
            <div className="space-y-5">
              <NailVariantHandPreview variantDetail={variant} />

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Price", variant.priceLabel || "--"],
                  ["Duration", variant.durationLabel || "--"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">{label}</p>
                    <p className="mt-2 text-sm font-bold text-[#432744]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[#c694ad]">Nail Shape</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      ["Name", variant.nailShape?.name || "--"],
                      ["Price", variant.nailShape?.priceLabel || "--"],
                      ["Duration", variant.nailShape?.durationLabel || "--"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[16px] border border-[#f3dce7] bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">{label}</p>
                        <p className="mt-1 text-sm font-bold text-[#432744]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[#c694ad]">Nail Surface</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      ["Name", variant.nailSurface?.name || "--"],
                      ["Price", variant.nailSurface?.priceLabel || "--"],
                      ["Duration", variant.nailSurface?.durationLabel || "--"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[16px] border border-[#f3dce7] bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">{label}</p>
                        <p className="mt-1 text-sm font-bold text-[#432744]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DetailCard>

          {/* <DetailCard title="Accessories / Components">
            {variant.nailComponents?.length ? (
              <div className="space-y-3">
                {variant.nailComponents.map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[#f1d7e3] bg-[#fffafb] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="pink">{item.component?.name || "--"}</Pill>
                      <Pill tone="blue">{item.component?.componentType || "--"}</Pill>
                      <Pill tone="yellow">{item.component?.priceLabel || "--"}</Pill>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                      <span>Finger: <b>{item.fingerIndex}</b></span>
                      <span>Pos X: <b>{item.posX}</b></span>
                      <span>Pos Y: <b>{item.posY}</b></span>
                      <span className="break-all">Config: <b>{item.configJson || "--"}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8c7085]">This variant has no accessory components.</p>
            )}
          </DetailCard> */}

          <DetailCard title="Procedure Steps">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#8c7085]">Step order is initialized from the current variant procedure response.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addProcedureDraft}
                  disabled={isSavingProcedures}
                  className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                >
                  <Plus size={13} className="mr-1.5 inline" />
                  Add Step
                </button>
                <button
                  type="button"
                  onClick={() => void saveProcedureSteps()}
                  disabled={isSavingProcedures}
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
                >
                  <Save size={13} className="mr-1.5 inline" />
                  {isSavingProcedures ? "Saving..." : "Save Steps"}
                </button>
              </div>
            </div>

            {procedures.length ? (
              <div className="mt-4 space-y-3">
                {procedures.map((item, index) => (
                  <div key={`${item.procedureId || "draft"}-${index}`} className="rounded-[18px] border border-[#f1d7e3] bg-[#fffafb] p-4">
                    <div className="grid gap-3 md:grid-cols-[110px_minmax(0,1fr)]">
                      <label className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                          Step Order
                        </span>
                        <input
                          value={String(item.stepOrder || index + 1)}
                          onChange={(event) => updateProcedureDraft(index, "stepOrder", event.target.value)}
                          className="w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 py-3 text-sm font-semibold text-[#432744] outline-none focus:border-[#ea4f93]"
                        />
                      </label>
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                          Procedure
                        </span>
                        <select
                          value={item.procedureId || ""}
                          onChange={(e) => updateProcedureDraft(index, "procedureId", e.target.value)}
                          className="w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 py-3 text-sm font-semibold text-[#432744] outline-none focus:border-[#ea4f93]"
                        >
                          <option value="">Select a procedure</option>
                          {availableProcedures.map((proc) => (
                            <option key={proc.id || proc.procedureId} value={proc.id || proc.procedureId}>
                              {proc.name}
                            </option>
                          ))}
                        </select>
                        <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                          <span>Duration: <b>{item.durationLabel || item.duration || "--"}</b></span>
                          <span>Status: <b>{item.status || "--"}</b></span>
                          <span>Required: <b>{item.isRequired ? "Yes" : "No"}</b></span>
                        </div>
                      </div>
                    </div>
                    {item.description ? <p className="mt-3 text-sm leading-6 text-[#6d5669]">{item.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[16px] border border-dashed border-[#f3c9dd] bg-[#fffafb] px-4 py-4 text-sm text-[#8c7085]">
                No procedures configured for this variant yet.
              </div>
            )}
          </DetailCard>
        </div>

        <aside className="space-y-4">
          <DetailCard title="Try-On">
            <div className="space-y-3">
              {[
                ["Set Up Try On", "Tune nail shape, color, finish, and layers.", undefined, Eye],
                ["Photo Try On", "Apply this variant on an uploaded hand image.", "image", Image],
                ["Live Try On", "Apply this variant using the camera.", "live", Camera],
              ].map(([label, note, mode, Icon]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openTryOn(mode)}
                  className="flex w-full items-center gap-3 rounded-[16px] border border-[#f4c6da] bg-[#fffafb] p-4 text-left transition hover:border-[#ea4f93]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f7] text-[#ea4f93]">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-[#432744]">{label}</span>
                    <span className="mt-1 block text-xs text-[#8c7085]">{note}</span>
                  </span>
                </button>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Color Preview">
            {colors.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {colors.length > 1 ? (
                  <div className="w-full rounded-[18px] border border-[#f4d4e2] bg-[#fffafb] p-3">
                    <div
                      className="h-16 rounded-[14px] border border-white shadow-inner"
                      style={{ backgroundImage: `linear-gradient(135deg, ${colors.join(", ")})` }}
                    />
                    <p className="mt-3 text-center text-[11px] font-bold text-[#6d5669]">Gradient Mix</p>
                  </div>
                ) : null}
                {colors.map((color) => (
                  <div key={color} className="w-[110px] rounded-[18px] border border-[#f4d4e2] bg-[#fffafb] p-3">
                    <div className="h-16 rounded-[14px] border border-white shadow-inner" style={{ backgroundColor: color }} />
                    <p className="mt-3 text-center text-[11px] font-bold text-[#6d5669]">{color}</p>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="overflow-x-auto rounded-[16px] bg-[#fffafb] p-4 text-xs leading-6 text-[#6d5669]">
                {variant.colorJson || "--"}
              </pre>
            )}
          </DetailCard>
        </aside>
      </div>
    </section>
  );
}

