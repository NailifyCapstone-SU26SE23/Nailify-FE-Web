import {
  ArrowLeft,
  Camera,
  Eye,
  Image,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
} from "lucide-react";
import manHandImg from "../../../../shared/assets/images/manHand.png";
import womanHandImg from "../../../../shared/assets/images/womanHand.png";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState, useRef } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
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

function NailSurface3DLayer({ surface, handType = "tips" }) {
  if (!surface) return null;
  const config = parseShaderParam(surface.shaderParam);

  const textureType = String(config?.texture?.type || "").toLowerCase();
  const isMatte = textureType.includes("matte") || config?.shine?.enabled === false;
  const hasChrome = Boolean(config?.metalness?.enabled || config?.mirrorEffect?.enabled);
  const hasRainbow = Boolean(config?.iridescence?.enabled || config?.holographic?.enabled);

  const roughness = clamp(Number(config?.texture?.roughness ?? (isMatte ? 0.8 : 0.05)), 0, 1);
  const metalness = hasChrome ? clamp(Number(config?.metalness?.intensity || 0.9), 0, 1) : 0;
  const clearcoat = isMatte ? 0 : clamp(Number(config?.shine?.opacity || 1.2), 0, 1.5);
  const iridescence = hasRainbow ? clamp(Number(config?.iridescence?.intensity || 0.8), 0, 1) : 0;

  return (
    <div className="absolute inset-0 h-full w-full pointer-events-none mix-blend-screen">
      <Canvas
        key={handType}
        camera={{ position: [0, 0, 5], fov: 40 }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={isMatte ? 0.6 : 0.3} />
        {/* Strong front directional light to guarantee specular gloss line in center */}
        <directionalLight position={[0, 0, 8]} intensity={2.2} />
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

/**
 * Replicates the exact canvas layout used by Set Up Try-On (BuilderView.jsx canvas: 320×420).
 * This is the single source of truth for converting saved dec.x/dec.y/dec.scale
 * (which are all relative to the canvas layout) to CSS % positions in any container.
 *
 * Canvas context is translated to (centerX, centerY + h*0.16) before drawing.
 * destRect is { x: -nailWidth/2, y: nailBottom - totalHeight, w: nailWidth, h: totalHeight }
 * in translated space.
 *
 * Returns absolute canvas pixel coordinates of the dest area origin and dimensions.
 */
function getBuilderCanvasLayout(canvasW = 320, canvasH = 420, length = 1.0) {
  const fingerLength = Math.min(canvasW * 0.36, canvasH * 0.32);
  const nailWidth = fingerLength * 2.0;
  const nailHeight = fingerLength * 1.2 * length;
  const nailBottom = fingerLength * 0.75;
  const totalHeight = nailHeight * 1.5;
  const originX = canvasW / 2;                      // ctx.translate x
  const originY = canvasH / 2 + canvasH * 0.16;    // ctx.translate y
  return {
    // Absolute pixel coords of dest rectangle on canvas
    destX: originX - nailWidth / 2,
    destY: originY + nailBottom - totalHeight,
    destW: nailWidth,
    destH: totalHeight,
    canvasW,
    canvasH,
  };
}

/**
 * Converts saved (posX, posY, scale, rotation) from DB into CSS % values
 * that exactly replicate what NailDecorationOverlay shows in Set Up Try-On.
 *
 * posX = dec.x  (offset from destH center, in units of destW)
 * posY = dec.y  (offset from destH center, in units of destH)
 * scale = dec.scale (fraction of destW)
 *
 * The returned left/top are % of canvas, which maps 1:1 to % of the nail card
 * when the card uses the same 320×420 aspect ratio as the canvas.
 */
function componentStyleFromDecoration(posX, posY, scale, rotation) {
  const layout = getBuilderCanvasLayout();
  const { destX, destY, destW, destH, canvasW, canvasH } = layout;

  // Center of dest area in canvas pixels
  const cx = destX + destW / 2;
  const cy = destY + destH / 2;

  // Decoration center in canvas pixels
  const decCX = cx + Number(posX || 0) * destW;
  const decCY = cy + Number(posY || 0) * destH;

  // Convert to % of canvas (= % of nail card)
  const leftPct = (decCX / canvasW) * 100;
  const topPct = (decCY / canvasH) * 100;
  const widthPct = (destW * Number(scale || 0.2)) / canvasW * 100;
  const heightPct = (destH * Number(scale || 0.2)) / canvasH * 100;

  return { leftPct, topPct, widthPct, heightPct };
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

// Default coordinates for nails on the hand images
const DEFAULT_COORDINATES = {
  woman: {
    1: { left: 17.8, top: 35.8, width: 7.7, height: 11.4, rotation: -46 }, // Thumb
    2: { left: 38.5, top: 11.5, width: 8.9, height: 14.4, rotation: -2 }, // Index
    3: { left: 52.7, top: 8.8, width: 10.1, height: 16.2, rotation: 0 }, // Middle
    4: { left: 65.5, top: 13.0, width: 9.5, height: 14.7, rotation: 0 }, // Ring
    5: { left: 81.4, top: 23.5, width: 6.8, height: 11.1, rotation: 9 }, // Pinky
  },
  man: {
    1: { left: 14.4, top: 43.2, width: 7.4, height: 17.5, rotation: -54 }, // Thumb
    2: { left: 26.9, top: 10.6, width: 9.8, height: 24.3, rotation: -19 }, // Index
    3: { left: 46.8, top: 4.6, width: 10.1, height: 23.4, rotation: -2 }, // Middle
    4: { left: 63.5, top: 11.2, width: 10.4, height: 22.5, rotation: 4 }, // Ring
    5: { left: 75.2, top: 23.6, width: 8.0, height: 17.4, rotation: 4 }, // Pinky
  }
};

function NailVariantHandPreview({ variantDetail }) {
  const [viewMode, setViewMode] = useState("tips"); // "tips" or "hand"
  const [handType, setHandType] = useState("woman"); // "woman" or "man"
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [coords, setCoords] = useState(DEFAULT_COORDINATES);
  const [selectedFinger, setSelectedFinger] = useState(1);
  const [showCalibration, setShowCalibration] = useState(false);
  const [clickToPlace, setClickToPlace] = useState(false);
  const handContainerRef = useRef(null);
  const handImgRef = useRef(null);

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

  const handleMouseDown = (e) => {
    if (viewMode !== "hand") return;
    if (clickToPlace) return; // let click handler manage this
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleHandClick = (e) => {
    if (!clickToPlace || !handImgRef.current) return;
    e.stopPropagation();
    // Compute position relative to the inner hand image element
    const rect = handImgRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords(prev => ({
      ...prev,
      [handType]: {
        ...prev[handType],
        [selectedFinger]: {
          ...prev[handType][selectedFinger],
          left: parseFloat(xPct.toFixed(2)),
          top: parseFloat(yPct.toFixed(2)),
        }
      }
    }));
    // Auto-advance to next finger
    if (selectedFinger < 5) setSelectedFinger(f => f + 1);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (direction) => {
    setZoom(prev => {
      const next = direction === "in" ? prev + 0.15 : prev - 0.15;
      return Math.min(3, Math.max(0.5, next));
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const currentHandImg = handType === "woman" ? womanHandImg : manHandImg;
  const handDimensions = handType === "woman"
    ? { width: 325, height: 488 }
    : { width: 400, height: 400 };

  return (
    <div className="rounded-[24px] border border-[#f7d7e5] bg-[radial-gradient(circle_at_top,#fffdfd_0%,#fff6fb_58%,#fff2f8_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      {/* View Switch Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#fce6f3] pb-4">
        <div className="flex rounded-full bg-[#ffeef5]/60 p-1 border border-[#fce6f3]">
          <button
            onClick={() => setViewMode("tips")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 ${viewMode === "tips" ? "bg-[#ea4f93] text-white shadow-sm" : "text-[#ea4f93] hover:text-[#d14c84]"}`}
          >
            Individual Nails
          </button>
          <button
            onClick={() => setViewMode("hand")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${viewMode === "hand" ? "bg-[#ea4f93] text-white shadow-sm" : "text-[#ea4f93] hover:text-[#d14c84]"}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            View on Hand
          </button>
        </div>

        {viewMode === "hand" && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Gender Switch */}
            <div className="flex rounded-full bg-white p-1 border border-[#fcd5e6]">
              <button
                onClick={() => setHandType("woman")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${handType === "woman" ? "bg-[#ea4f93] text-white" : "text-[#c694ad] hover:text-[#ea4f93]"}`}
              >
                Woman
              </button>
              <button
                onClick={() => setHandType("man")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${handType === "man" ? "bg-[#ea4f93] text-white" : "text-[#c694ad] hover:text-[#ea4f93]"}`}
              >
                Man
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex rounded-full bg-white border border-[#fcd5e6] overflow-hidden">
              <button
                onClick={() => handleZoom("in")}
                title="Zoom In"
                className="px-2.5 py-1 text-[#ea4f93] hover:bg-[#ffeef5] transition border-r border-[#fcd5e6]"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom("out")}
                title="Zoom Out"
                className="px-2.5 py-1 text-[#ea4f93] hover:bg-[#ffeef5] transition border-r border-[#fcd5e6]"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                title="Reset Zoom/Pan"
                className="px-2.5 py-1 text-[#ea4f93] hover:bg-[#ffeef5] transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Calibration Toggle */}
            <button
              onClick={() => setShowCalibration(!showCalibration)}
              title="Calibration sliders"
              className={`p-1.5 rounded-full border transition ${showCalibration ? "bg-[#ea4f93] border-[#ea4f93] text-white shadow-sm" : "bg-white border-[#fcd5e6] text-[#ea4f93] hover:bg-[#ffeef5]"}`}
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {viewMode === "tips" ? (
        <div className="flex min-h-[300px] flex-wrap items-center justify-center gap-5 lg:gap-6">
          {fingerDefinitions.map((finger) => {
            const colorStyle = buildFingerColorStyle(colorConfig, finger.fingerIndex);

            return (
              <div
                key={finger.label}
                className={`flex flex-col items-center gap-3.5 transition-all duration-500 ease-out ${getFingerAlignmentClass(finger.label)}`}
              >
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-t-[36px] rounded-b-[18px] bg-gradient-to-t from-[#ea4f93]/15 to-[#ffb8d9]/5 opacity-30 blur-md transition duration-500 group-hover:opacity-60 group-hover:blur-lg" />

                  {/* Nail card — large w-24 h-48 format */}
                  <div className="relative h-48 w-24 overflow-hidden rounded-t-[32px] rounded-b-[14px] border-2 border-[#fcd5e6] bg-gradient-to-b from-[#fff6f9] to-[#ffeef5] shadow-[0_12px_28px_rgba(236,72,153,0.06)] transition-all duration-300 group-hover:scale-105 group-hover:border-[#ea4f93]">
                    <div className="absolute inset-0 h-full w-full" style={shapeMaskStyle}>
                      <div className="absolute inset-0 h-full w-full" style={colorStyle} />

                      {(variantDetail?.nailComponents || []).filter((item) => {
                        const componentFingerIndex = Number(item?.fingerIndex);
                        return componentFingerIndex === -1 || componentFingerIndex === finger.fingerIndex;
                      }).map((componentItem, index) => {
                        const component = componentItem?.component;
                        if (!component?.imageUrl) return null;

                        const config = parseComponentConfig(componentItem.configJson);
                        const scale = Number.isFinite(Number(config?.scale)) ? Number(config.scale) : 0.2;
                        const rotation = Number.isFinite(Number(config?.rotation)) ? Number(config.rotation) : 0;

                        // Apply 2.5x scaling multiplier to make the accessories legible on the card
                        const displaySizePercent = scale * 2.5 * 100;

                        return (
                          <img
                            key={`${componentItem?.nailComponentId || index}-${finger.fingerIndex}`}
                            crossOrigin="anonymous"
                            src={component.imageUrl}
                            alt={component.name || "component"}
                            className="pointer-events-none absolute object-contain drop-shadow-[0_6px_10px_rgba(234,79,147,0.18)]"
                            referrerPolicy="no-referrer"
                            style={{
                              left: `${50 + Number(componentItem?.posX || 0) * 100}%`,
                              top: `${50 + Number(componentItem?.posY || 0) * 100}%`,
                              width: `${displaySizePercent}%`,
                              height: `${displaySizePercent}%`,
                              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
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
      ) : (
        <div className="space-y-4">
          <div
            ref={handContainerRef}
            className={`relative h-[520px] w-full overflow-hidden rounded-[20px] border border-[#fcd5e6] flex items-center justify-center ${clickToPlace ? 'cursor-crosshair bg-[#ffeef5]/60' : 'cursor-grab bg-[#ffeef5]/35'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleHandClick}
          >
            <div
              ref={handImgRef}
              className="relative select-none origin-center"
              style={{
                width: `${handDimensions.width}px`,
                height: `${handDimensions.height}px`,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              {/* Hand Image */}
              <img
                src={currentHandImg}
                alt="Hand preview"
                draggable="false"
                className="w-full h-full object-cover select-none pointer-events-none"
              />

              {/* Click-to-place crosshair for selected finger */}
              {clickToPlace && (() => {
                const coord = coords[handType][selectedFinger];
                const fingerLabel = fingerDefinitions.find(f => f.fingerIndex === selectedFinger)?.label;
                return (
                  <div
                    className="absolute pointer-events-none"
                    style={{ left: `${coord.left}%`, top: `${coord.top}%`, transform: 'translate(-50%,-50%)' }}
                  >
                    <div className="w-6 h-6 border-2 border-[#ea4f93] rounded-full bg-[#ea4f93]/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[#ea4f93] rounded-full" />
                    </div>
                    <span className="absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap rounded-full bg-[#ea4f93] px-2 py-0.5 text-[9px] font-bold text-white">
                      {fingerLabel}
                    </span>
                  </div>
                );
              })()}

              {fingerDefinitions.map((finger) => {
                const coord = coords[handType][finger.fingerIndex];
                const colorStyle = buildFingerColorStyle(colorConfig, finger.fingerIndex);

                return (
                  <div
                    key={finger.label}
                    className="absolute"
                    style={{
                      left: `${coord.left}%`,
                      top: `${coord.top}%`,
                      width: `${coord.width}%`,
                      height: `${coord.height}%`,
                      transform: `translate(-50%, -50%) rotate(${coord.rotation}deg)`,
                    }}
                  >
                    <div className="relative w-full h-full overflow-hidden">
                      <div className="absolute inset-0 h-full w-full" style={shapeMaskStyle}>
                        <div className="absolute inset-0 h-full w-full" style={colorStyle} />

                        {(variantDetail?.nailComponents || []).filter((item) => {
                          const componentFingerIndex = Number(item?.fingerIndex);
                          return componentFingerIndex === -1 || componentFingerIndex === finger.fingerIndex;
                        }).map((componentItem, index) => {
                          const component = componentItem?.component;
                          if (!component?.imageUrl) return null;

                          const config = parseComponentConfig(componentItem.configJson);
                          const scale = Number.isFinite(Number(config?.scale)) ? Number(config.scale) : 0.2;
                          const rotation = Number.isFinite(Number(config?.rotation)) ? Number(config.rotation) : 0;

                          // Apply 2.5x scaling multiplier to make accessories legible on the hand fingertips
                          const displaySizePercent = scale * 2.5 * 100;

                          return (
                            <img
                              key={`${componentItem?.nailComponentId || index}-${finger.fingerIndex}-hand`}
                              crossOrigin="anonymous"
                              src={component.imageUrl}
                              alt={component.name || "component"}
                              className="pointer-events-none absolute object-contain"
                              referrerPolicy="no-referrer"
                              style={{
                                left: `${50 + Number(componentItem?.posX || 0) * 100}%`,
                                top: `${50 + Number(componentItem?.posY || 0) * 100}%`,
                                width: `${displaySizePercent}%`,
                                height: `${displaySizePercent}%`,
                                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                              }}
                            />
                          );
                        })}

                        <NailSurface3DLayer surface={variantDetail?.nailSurface} handType={handType} />
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
                );
              })}
            </div>
          </div>

          {/* Calibration Panel */}
          {showCalibration && (
            <div className="rounded-[20px] border border-[#f7d7e5] bg-white p-5 space-y-4 shadow-sm">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#ea4f93]">Calibrate Nail Positions</h4>
                  <p className="text-[10px] text-[#c694ad]">
                    {clickToPlace
                      ? `Click on the fingernail in the image to place nail ${fingerDefinitions.find(f => f.fingerIndex === selectedFinger)?.label}. (${selectedFinger}/5)`
                      : 'Enable Click-to-Place then click each fingertip in the image. Or use sliders.'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setClickToPlace(v => !v);
                      if (!clickToPlace) setSelectedFinger(1);
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition ${clickToPlace ? 'bg-[#ea4f93] border-[#ea4f93] text-white shadow-sm' : 'bg-white border-[#fcd5e6] text-[#ea4f93] hover:bg-[#ffeef5]'
                      }`}
                  >
                    {clickToPlace ? '✓ Click-to-Place ON' : 'Click-to-Place'}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(coords, null, 2));
                      toast.success("Coordinates copied! Paste into DEFAULT_COORDINATES to save.");
                    }}
                    className="rounded-full bg-[#432744] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#2e1a30] transition"
                  >
                    Copy Config
                  </button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap border-t border-[#fce6f3] pt-3">
                {fingerDefinitions.map(fd => (
                  <button
                    key={fd.fingerIndex}
                    onClick={() => setSelectedFinger(fd.fingerIndex)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${selectedFinger === fd.fingerIndex ? 'bg-[#ea4f93] border-[#ea4f93] text-white shadow-sm' : 'bg-white border-[#fcd5e6] text-[#ea4f93] hover:bg-[#ffeef5]'}`}
                  >
                    {fd.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 border-t border-[#fce6f3] pt-4">
                {["left", "top", "width", "height", "rotation"].map(prop => {
                  const min = prop === "rotation" ? -90 : 0;
                  const max = prop === "rotation" ? 100 : 100;
                  const step = prop === "rotation" ? 1 : 0.1;
                  const value = coords[handType][selectedFinger][prop];
                  return (
                    <div key={prop} className="flex flex-col gap-1.5 rounded-[12px] bg-[#fffafb] p-3 border border-[#fdf0f5]">
                      <span className="text-[10px] font-bold text-[#c694ad] uppercase flex justify-between">
                        <span>{prop}</span>
                        <span className="text-[#ea4f93] font-extrabold">{value}{prop === "rotation" ? "°" : "%"}</span>
                      </span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setCoords(prev => ({
                            ...prev,
                            [handType]: {
                              ...prev[handType],
                              [selectedFinger]: {
                                ...prev[handType][selectedFinger],
                                [prop]: val
                              }
                            }
                          }));
                        }}
                        className="w-full h-1 bg-[#fcd5e6] rounded-lg appearance-none cursor-pointer accent-[#ea4f93]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NailVariantDetailPage() {
  const { designId, variantId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
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
          setError(loadError instanceof Error ? loadError.message : (t("adminNailsDesignManagement.failedToLoadNailVariantDetail")));
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
      setError(saveError instanceof Error ? saveError.message : (t("adminNailsDesignManagement.failedToSaveProcedureSteps")));
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
        throw new Error(t("adminNailsDesignManagement.nailShapeAndSurfaceReferencesA"));
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
          {t("adminNailsDesignManagement.loadingNailVariantDetail")}
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
          {error || (t("adminNailsDesignManagement.failedToLoadNailVariantDetail"))}
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4 ">
      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-[#c694ad]">
              {t("adminNailsDesignManagement.nailDesigns")}<span className="text-[#ea4f93]">{t("adminNailsDesignManagement.variantDetail")}</span>
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#432744]">{variant.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#8c7085]">{variant.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(getAdminNailDesignDetailRoute(designId))}
              className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#8c7085]"
            >
              <ArrowLeft size={14} className="mr-1.5 inline" />
              {t("adminNailsDesignManagement.backToDesign")}
            </button>
            <button
              type="button"
              onClick={() => openTryOn(undefined)}
              className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <Sparkles size={14} className="mr-1.5 inline" />
              {t("adminNailsDesignManagement.setUpTryOn")}
            </button>
            <button
              type="button"
              onClick={() => openTryOn("image")}
              className="rounded-full bg-[#4a72d8] px-4 py-2 text-xs font-bold text-white"
            >
              <Image size={14} className="mr-1.5 inline" />
              {t("adminNailsDesignManagement.photoTryOn")}
            </button>
            <button
              type="button"
              onClick={() => openTryOn("live")}
              className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
            >
              <Camera size={14} className="mr-1.5 inline" />
              {t("adminNailsDesignManagement.liveTryOn")}
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
          <p className="text-sm font-semibold text-green-700 px-4 py-2 border border-green-400 rounded-full bg-green-100">
            {t("adminNailsDesignManagement.youHaveUnsavedTryonChanges")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(getAdminNailVariantDetailRoute(designId, variantId), { replace: true })}
              disabled={isSavingTryOn}
              className="rounded-full border border-[#f4bfd2] bg-white px-4 py-2 text-xs font-bold text-[#d14c84]"
            >
              {t("adminNailsDesignManagement.cancel")}
            </button>
            <button
              onClick={handleSaveTryOn}
              disabled={isSavingTryOn}
              className="rounded-full bg-[#d14c84] px-4 py-2 text-xs font-bold text-white shadow"
            >
              {isSavingTryOn ? (t("adminNailsDesignManagement.saving")) : (t("adminNailsDesignManagement.saveChanges"))}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <DetailCard title={t("adminNailsDesignManagement.variantOverview")}>
            <div className="space-y-5">
              <NailVariantHandPreview variantDetail={variant} />

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [t("adminNailsDesignManagement.price"), variant.priceLabel],
                  [t("adminNailsDesignManagement.duration"), variant.durationLabel],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">{label}</p>
                    <p className="mt-2 text-sm font-bold text-[#432744]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[#c694ad]">{t("adminNailsDesignManagement.nailShape")}</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      [t("adminNailsDesignManagement.name"), variant.nailShape?.name],
                      [t("adminNailsDesignManagement.price"), variant.nailShape?.priceLabel],
                      [t("adminNailsDesignManagement.duration"), variant.nailShape?.durationLabel],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[16px] border border-[#f3dce7] bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">{label}</p>
                        <p className="mt-1 text-sm font-bold text-[#432744]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[#c694ad]">{t("adminNailsDesignManagement.nailSurface")}</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      [t("adminNailsDesignManagement.name"), variant.nailSurface?.name],
                      [t("adminNailsDesignManagement.price"), variant.nailSurface?.priceLabel],
                      [t("adminNailsDesignManagement.duration"), variant.nailSurface?.durationLabel],
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
                      <Pill tone="pink">{item.component?.name }</Pill>
                      <Pill tone="blue">{item.component?.componentType }</Pill>
                      <Pill tone="yellow">{item.component?.priceLabel }</Pill>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                      <span>Finger: <b>{item.fingerIndex}</b></span>
                      <span>Pos X: <b>{item.posX}</b></span>
                      <span>Pos Y: <b>{item.posY}</b></span>
                      <span className="break-all">Config: <b>{item.configJson }</b></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8c7085]">This variant has no accessory components.</p>
            )}
          </DetailCard> */}

          <DetailCard title={t("adminNailsDesignManagement.procedureSteps")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#8c7085]">{t("adminNailsDesignManagement.stepOrderIsInitializedFromTheC")}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addProcedureDraft}
                  disabled={isSavingProcedures}
                  className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                >
                  <Plus size={13} className="mr-1.5 inline" />
                  {t("adminNailsDesignManagement.addStep")}
                </button>
                <button
                  type="button"
                  onClick={() => void saveProcedureSteps()}
                  disabled={isSavingProcedures}
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
                >
                  <Save size={13} className="mr-1.5 inline" />
                  {isSavingProcedures ? (t("adminNailsDesignManagement.saving")) : (t("adminNailsDesignManagement.saveSteps"))}
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
                          {t("adminNailsDesignManagement.stepOrder")}
                        </span>
                        <input
                          value={String(item.stepOrder || index + 1)}
                          onChange={(event) => updateProcedureDraft(index, "stepOrder", event.target.value)}
                          className="w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 py-3 text-sm font-semibold text-[#432744] outline-none focus:border-[#ea4f93]"
                        />
                      </label>
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                          {t("adminNailsDesignManagement.procedure")}
                        </span>
                        <select
                          value={item.procedureId || ""}
                          onChange={(e) => updateProcedureDraft(index, "procedureId", e.target.value)}
                          className="w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 py-3 text-sm font-semibold text-[#432744] outline-none focus:border-[#ea4f93]"
                        >
                          <option value="">{t("adminNailsDesignManagement.selectAProcedure")}</option>
                          {availableProcedures.map((proc) => (
                            <option key={proc.id || proc.procedureId} value={proc.id || proc.procedureId}>
                              {proc.name}
                            </option>
                          ))}
                        </select>
                        <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                          <span>{t("adminNailsDesignManagement.duration")}: <b>{item.durationLabel || item.duration}</b></span>
                          <span>{t("adminNailsDesignManagement.status")}: <b>{item.status}</b></span>
                          <span>{t("adminNailsDesignManagement.required")}: <b>{item.isRequired ? (t("adminNailsDesignManagement.yes")) : (t("adminNailsDesignManagement.no"))}</b></span>
                        </div>
                      </div>
                    </div>
                    {item.description ? <p className="mt-3 text-sm leading-6 text-[#6d5669]">{item.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[16px] border border-dashed border-[#f3c9dd] bg-[#fffafb] px-4 py-4 text-sm text-[#8c7085]">
                {t("adminNailsDesignManagement.noProceduresConfiguredForThisV1")}
              </div>
            )}
          </DetailCard>
        </div>

        <aside className="space-y-4">
          <DetailCard title={t("adminNailsDesignManagement.tryon")}>
            <div className="space-y-3">
              {[
                [t("adminNailsDesignManagement.setUpTryOn"), t("adminNailsDesignManagement.tuneNailShapeColorFinishAndLay"), undefined, Eye],
                [t("adminNailsDesignManagement.photoTryOn"), t("adminNailsDesignManagement.applyThisVariantOnAnUploadedHa"), "image", Image],
                [t("adminNailsDesignManagement.liveTryOn"), t("adminNailsDesignManagement.applyThisVariantUsingTheCamera"), "live", Camera],
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

          <DetailCard title={t("adminNailsDesignManagement.colorPreview")}>
            {colors.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {colors.length > 1 ? (
                  <div className="w-full rounded-[18px] border border-[#f4d4e2] bg-[#fffafb] p-3">
                    <div
                      className="h-16 rounded-[14px] border border-white shadow-inner"
                      style={{ backgroundImage: `linear-gradient(135deg, ${colors.join(", ")})` }}
                    />
                    <p className="mt-3 text-center text-[11px] font-bold text-[#6d5669]">{t("adminNailsDesignManagement.gradientMix")}</p>
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
                {variant.colorJson}
              </pre>
            )}
          </DetailCard>
        </aside>
      </div>
    </section>
  );
}

