import { Input, Modal, Checkbox } from "antd";
import { Canvas, FabricImage, Rect } from "fabric";
import { Grid, Hand, Maximize2, Move, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import womanHandImg from "../../../../shared/assets/images/womanHand.png";
import manHandImg from "../../../../shared/assets/images/manHand.png";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const HAND_SLOT_CONFIG = {
  woman: [
    { label: "Thumb", index: 0, left: "-2%", top: "28.8%", width: "26.2%", rotate: "-55deg" },
    { label: "Index", index: 1, left: "9.6%", top: "-2.3%", width: "32.7%", rotate: "-20deg" },
    { label: "Middle", index: 2, left: "27.5%", top: "-12.7%", width: "38.8%", rotate: "0deg" },
    { label: "Ring", index: 3, left: "45.5%", top: "-6.9%", width: "37.6%", rotate: "7deg" },
    { label: "Pinky", index: 4, left: "62.3%", top: "10.7%", width: "27.1%", rotate: "9deg" },
  ],
  man: [
    { label: "Thumb", index: 0, left: "-2%", top: "28.8%", width: "26.2%", rotate: "-55deg" },
    { label: "Index", index: 1, left: "9.6%", top: "-2.3%", width: "32.7%", rotate: "-20deg" },
    { label: "Middle", index: 2, left: "27.5%", top: "-12.7%", width: "38.8%", rotate: "0deg" },
    { label: "Ring", index: 3, left: "45.5%", top: "-6.9%", width: "37.6%", rotate: "7deg" },
    { label: "Pinky", index: 4, left: "62.3%", top: "10.7%", width: "27.1%", rotate: "9deg" },
  ],
};

const NAIL_LABELS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
const DEFAULT_SHAPE_RATIO = 0.42;
const SMALL_FINGER_HEIGHTS = [62, 62, 62, 62, 62];
const LARGE_FINGER_HEIGHTS = [280, 280, 280, 280, 280];
const FABRIC_CROSS_ORIGIN_OPTIONS = { crossOrigin: "anonymous" };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function useShapeAspectRatio(shapeImageUrl) {
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_SHAPE_RATIO);

  useEffect(() => {
    if (!shapeImageUrl) {
      return undefined;
    }

    let isCancelled = false;
    const image = new window.Image();
    image.referrerPolicy = "no-referrer";
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (isCancelled) return;
      const nextRatio = image.naturalWidth && image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : DEFAULT_SHAPE_RATIO;
      setAspectRatio(clamp(nextRatio, 0.24, 0.82));
    };
    image.onerror = () => {
      if (!isCancelled) {
        setAspectRatio(DEFAULT_SHAPE_RATIO);
      }
    };
    image.src = shapeImageUrl;

    return () => {
      isCancelled = true;
    };
  }, [shapeImageUrl]);

  return shapeImageUrl ? aspectRatio : DEFAULT_SHAPE_RATIO;
}

function getNailMetrics(index, aspectRatio, large = false) {
  const normalizedRatio = 0.5;
  const fingerHeights = large ? LARGE_FINGER_HEIGHTS : SMALL_FINGER_HEIGHTS;
  const nailHeight = fingerHeights[index] ?? fingerHeights[2];
  const nailWidth = Math.round(nailHeight * normalizedRatio);

  const frameWidth = clamp(nailWidth + (large ? 120 : 36), large ? 220 : 72, large ? 320 : 112);
  const frameHeight = clamp(nailHeight + (large ? 144 : 54), large ? 280 : 112, large ? 392 : 156);

  return {
    nailHeight,
    nailWidth,
    frameWidth,
    frameHeight,
  };
}

function getPlacementRenderScale(scale, nailWidth, imageWidth) {
  const normalizedScale = Number(scale) || 0.8;
  const naturalImageWidth = Number(imageWidth) || 500;
  return (normalizedScale * nailWidth) / naturalImageWidth;
}

function normalizeGradientStops(gradientStops, primaryColor, secondaryColor) {
  const normalizedStops = (Array.isArray(gradientStops) ? gradientStops : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (normalizedStops.length >= 2) {
    return normalizedStops;
  }

  return [
    String(primaryColor || "#f7bdd7").trim() || "#f7bdd7",
    String(secondaryColor || primaryColor || "#fce7f3").trim() || "#fce7f3",
  ];
}

function getColorStyle(colorConfig) {
  if (colorConfig?.mode === "gradient") {
    const gradientFormula = normalizeGradientStops(
      colorConfig?.gradientStops,
      colorConfig?.primaryColor,
      colorConfig?.secondaryColor,
    )
      .map((color, index, stops) => `${color} ${((index / Math.max(stops.length - 1, 1)) * 100).toFixed(2)}%`)
      .join(", ");

    return {
      backgroundImage: `linear-gradient(135deg, ${gradientFormula})`,
    };
  }

  return { backgroundColor: colorConfig?.primaryColor || "#f7bdd7" };
}

function getShapeInsets(width, shapeImageUrl) {
  if (!shapeImageUrl) {
    return { framePadding: 0, innerInset: 0 };
  }

  return width > 120
    ? { framePadding: 16, innerInset: 22 }
    : { framePadding: 4, innerInset: 7 };
}

function getContentMetrics(width, height, shapeImageUrl) {
  const { innerInset } = getShapeInsets(width, shapeImageUrl);

  return {
    innerInset,
    contentLeft: innerInset,
    contentTop: innerInset,
    contentWidth: Math.max(width - (innerInset * 2), 1),
    contentHeight: Math.max(height - (innerInset * 2), 1),
  };
}

function renderSurfaceEffects(finish) {
  const name = String(finish || "").trim().toLowerCase();

  // 🪞 CHROME - Ultra metallic mirror
  if (name.includes("chrome") || name.includes("mirror") || name.includes("tráng gương") || name.includes("metallic")) {
    return (
      <>
        {/* Silver metallic base sheen */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(200,210,220,0.4) 35%, rgba(80,90,100,0.35) 65%, rgba(255,255,255,0.6) 100%)`,
        }} />
        {/* Primary chrome streak */}
        <div className="pointer-events-none absolute" style={{
          top: '5%', left: '15%', width: '30%', height: '65%',
          background: `linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.45) 50%, transparent 100%)`,
          filter: 'blur(3px)', borderRadius: '50%',
        }} />
        {/* Center bright line */}
        <div className="pointer-events-none absolute" style={{
          top: '8%', left: '35%', width: '8%', height: '55%',
          background: `linear-gradient(to bottom, rgba(255,255,255,1.0) 0%, rgba(255,255,255,0.3) 70%, transparent 100%)`,
          filter: 'blur(1px)', borderRadius: '50%',
        }} />
        {/* Right edge reflection */}
        <div className="pointer-events-none absolute" style={{
          top: '15%', right: '8%', width: '22%', height: '50%',
          background: `radial-gradient(ellipse, rgba(220,230,240,0.54) 0%, transparent 70%)`,
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
    return (
      <>
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
            opacity: 0.63,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(45deg,
              hsl(320,100%,70%) 0%,
              transparent 25%,
              hsl(190,100%,65%) 45%,
              transparent 65%,
              hsl(270,100%,70%) 90%)`,
            opacity: 0.38,
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            top: '5%', left: '10%', width: '50%', height: '45%',
            background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 45%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
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
    return (
      <>
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.12) 100%)',
        }} />
        <div className="pointer-events-none absolute" style={{
          top: 0, bottom: 0,
          left: '50%',
          width: '52%',
          transform: 'translateX(-50%) rotate(0deg)',
          background: `linear-gradient(to right,
            transparent 0%,
            rgba(255,255,255,0.2) 25%,
            rgba(255,255,255,0.6) 50%,
            rgba(255,255,255,0.2) 75%,
            transparent 100%)`,
          filter: 'blur(5px)',
        }} />
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{
          height: '28%',
          background: `linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 100%)`,
        }} />
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
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(0.5px)',
        }} />
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 100%)',
        }} />
      </>
    );
  }

  // 🧪 JELLY - Border inset translucent sheen
  if (name.includes("jelly")) {
    return (
      <span className="pointer-events-none absolute inset-[6%] rounded-[inherit] border border-white/35 bg-white/12" />
    );
  }

  // GLITTER - Sparkles
  if (name.includes("glitter")) {
    return (
      <>
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(255,255,255,0.95)_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_22%,rgba(255,255,255,0.75)_0_1px,transparent_1.6px),radial-gradient(circle_at_46%_68%,rgba(255,255,255,0.85)_0_1px,transparent_1.5px),radial-gradient(circle_at_78%_74%,rgba(255,255,255,0.9)_0_1px,transparent_1.8px)] opacity-85" />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.12)_55%,transparent_100%)]" />
      </>
    );
  }

  // GLOSSY (Default) - Natural shine
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(180,180,200,0.1) 40%, rgba(80,80,120,0.15) 75%, rgba(40,40,80,0.2) 100%)',
      }} />
      <div className="pointer-events-none absolute" style={{
        top: '5%', left: '8%', width: '55%', height: '60%',
        background: `radial-gradient(ellipse at 28% 25%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.22) 40%, transparent 72%)`,
        filter: `blur(8px)`,
        transform: 'rotate(-12deg)',
      }} />
      <div className="pointer-events-none absolute" style={{
        top: '10%', left: '18%', width: '16%', height: '52%',
        background: `linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.25) 45%, transparent 100%)`,
        filter: `blur(2px)`,
        borderRadius: '50%',
      }} />
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{
        height: '32%',
        background: `linear-gradient(to bottom, rgba(255,255,255,0.27) 0%, transparent 100%)`,
      }} />
      <div className="pointer-events-none absolute" style={{
        top: '18%', right: '8%', width: '22%', height: '42%',
        background: `radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)`,
        filter: `blur(4px)`,
      }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
        height: '35%',
        background: 'linear-gradient(to top, rgba(60,40,80,0.28) 0%, rgba(60,40,80,0.08) 60%, transparent 100%)',
      }} />
      <div className="pointer-events-none absolute inset-y-0 right-0" style={{
        width: '20%',
        background: 'linear-gradient(to left, rgba(60,40,80,0.15) 0%, transparent 100%)',
      }} />
    </>
  );
}

function NailShell({
  finish,
  shape,
  index,
  isActive,
  colorStyle,
  shapeImageUrl,
  width,
  height, fingerLabel,
  children,
}) {
  const { framePadding, innerInset } = getShapeInsets(width, shapeImageUrl);
  const maskStyle = shapeImageUrl
    ? {
      maskImage: `url(${shapeImageUrl})`,
      WebkitMaskImage: `url(${shapeImageUrl})`,
      maskSize: "cover",
      WebkitMaskSize: "cover",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }
    : {};

  return (
    <div className={`flex flex-col items-center gap-2 ${isActive ? "scale-[1.03]" : ""}`}>
      <div
        className={`relative flex items-center justify-center overflow-visible ${isActive ? "drop-shadow-[0_18px_30px_rgba(236,72,153,0.16)]" : "drop-shadow-[0_14px_22px_rgba(236,72,153,0.10)]"}`}
        style={{ width, height }}
      >
        {shapeImageUrl ? (
          <>
            <div
              className="absolute bg-[linear-gradient(180deg,#ffd5e6_0%,#f6a8c9_100%)]"
              style={{
                inset: framePadding,
                ...maskStyle,
              }}
            />
            <div
              className="absolute bg-[linear-gradient(180deg,#fff7fb_0%,#fff1f8_100%)]"
              style={{
                inset: innerInset,
                ...maskStyle,
              }}
            />
            {isActive ? (
              <div
                className="absolute bg-[#ef6aac]/18 blur-[8px]"
                style={{
                  inset: Math.max(4, framePadding - 4),
                  ...maskStyle,
                }}
              />
            ) : null}
          </>
        ) : null}

        <div
          className={shapeImageUrl
            ? "absolute"
            : `relative overflow-hidden rounded-t-[1.9rem] rounded-b-[0.9rem] border-2 border-[#f7cadd] bg-[linear-gradient(180deg,#fff7fb_0%,#fff1f8_100%)]`}
          style={shapeImageUrl ? { inset: innerInset, ...maskStyle } : { width, height }}
        >
          <div className="absolute inset-0" style={colorStyle} />
          {renderSurfaceEffects(finish)}

          {shapeImageUrl ? (
            <img
              src={shapeImageUrl}
              alt={`${shape} shape`}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-multiply"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}

        </div>
        <div className="absolute inset-0 z-10">{children}</div>
      </div>

      <span className="rounded-full border border-[#fce6f3] bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)]">
        {fingerLabel ?? NAIL_LABELS[index]}
      </span>
    </div>
  );
}

NailShell.propTypes = {
  finish: PropTypes.string.isRequired,
  shape: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  colorStyle: PropTypes.shape({}).isRequired,
  shapeImageUrl: PropTypes.string,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  children: PropTypes.node,
  fingerLabel: PropTypes.string
};

function FabricNailCanvas({
  fingerIndex,
  finish,
  shape,
  isActive,
  colorStyle,
  shapeImageUrl,
  components,
  selectedPlacementKey,
  onSelectNail,
  onSelectPlacement,
  onPlacementChange,
  large = false, fingerLabel
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const pointerDownRef = useRef(null);
  const aspectRatio = useShapeAspectRatio(shapeImageUrl);
  const metrics = useMemo(
    () => getNailMetrics(fingerIndex, aspectRatio, large),
    [aspectRatio, fingerIndex, large],
  );
  const width = metrics.frameWidth;
  const height = metrics.frameHeight;
  const contentMetrics = useMemo(
    () => getContentMetrics(width, height, shapeImageUrl),
    [height, shapeImageUrl, width],
  );

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      preserveObjectStacking: true,
      selection: false,
      backgroundColor: "transparent",
    });

    fabricCanvasRef.current = canvas;

    const rect = new Rect({
      left: 0,
      top: 0,
      width,
      height,
      fill: "transparent",
      selectable: false,
      evented: false,
    });
    canvas.add(rect);
    canvas.sendObjectToBack(rect);

    const applyBounds = (target) => {
      if (!target) return;
      const objectWidth = (target.width || 0) * (target.scaleX || 1);
      const objectHeight = (target.height || 0) * (target.scaleY || 1);
      const halfWidth = objectWidth / 2;
      const halfHeight = objectHeight / 2;
      const horizontalInset = large ? 12 : 4;
      const verticalInset = large ? 12 : 4;
      const isArt = target.data?.isArt;

      if (!isArt) {
        // Gem/Charm must stay strictly inside the visible nail bounds
        const marginX = contentMetrics.contentWidth * 0.05;
        const marginY = contentMetrics.contentHeight * 0.05;

        target.set({
          left: clamp(
            target.left || 0,
            contentMetrics.contentLeft + marginX + halfWidth,
            contentMetrics.contentLeft + contentMetrics.contentWidth - marginX - halfWidth,
          ),
          top: clamp(
            target.top || 0,
            contentMetrics.contentTop + marginY + halfHeight,
            contentMetrics.contentTop + contentMetrics.contentHeight - marginY - halfHeight,
          ),
        });
      } else {
        // Art can move around within the canvas
        target.set({
          left: clamp(
            target.left || 0,
            halfWidth - horizontalInset,
            width - halfWidth + horizontalInset,
          ),
          top: clamp(
            target.top || 0,
            halfHeight - verticalInset,
            height - halfHeight + verticalInset,
          ),
        });
      }
    };

    const syncObject = (target) => {
      if (!target?.data?.placementKey) return;
      applyBounds(target);
      onPlacementChange(target.data.placementKey, {
        posX: Number((((target.left || 0) - contentMetrics.contentLeft) / contentMetrics.contentWidth - 0.5).toFixed(4)),
        posY: Number((((target.top || 0) - contentMetrics.contentTop) / contentMetrics.contentHeight - 0.5).toFixed(4)),
        scale: Number(((target.scaleX * (target.width || 500)) / contentMetrics.contentWidth).toFixed(3)),
        rotation: Number((target.angle || 0).toFixed(2)),
      });
    };

    canvas.on("object:moving", ({ target }) => applyBounds(target));
    canvas.on("object:scaling", ({ target }) => applyBounds(target));
    canvas.on("object:modified", ({ target }) => syncObject(target));

    canvas.on("selection:created", ({ selected }) => {
      onSelectPlacement(selected?.[0]?.data?.placementKey || "");
    });
    canvas.on("selection:updated", ({ selected }) => {
      onSelectPlacement(selected?.[0]?.data?.placementKey || "");
    });
    canvas.on("selection:cleared", () => onSelectPlacement(""));

    canvas.on("mouse:down", ({ e, target }) => {
      pointerDownRef.current = {
        x: e?.clientX ?? 0,
        y: e?.clientY ?? 0,
      };
      if (target?.data?.placementKey) {
        onSelectPlacement(target.data.placementKey);
      }
    });

    canvas.on("mouse:up", ({ e }) => {
      const pointer = pointerDownRef.current;
      pointerDownRef.current = null;
      if (!pointer) return;

      const deltaX = Math.abs((e?.clientX ?? 0) - pointer.x);
      const deltaY = Math.abs((e?.clientY ?? 0) - pointer.y);
      if (deltaX < 5 && deltaY < 5) {
        onSelectNail(fingerIndex);
      }
    });

    return () => {
      fabricCanvasRef.current = null;
      canvas.dispose();
    };
  }, [contentMetrics, fingerIndex, height, metrics, onPlacementChange, onSelectNail, onSelectPlacement, width]);

  useEffect(() => {
    let isCancelled = false;

    const renderObjects = async () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      canvas.getObjects().forEach((object) => {
        if (object.type !== "rect") {
          canvas.remove(object);
        }
      });

      const isClippedType = (type) => {
        const t = String(type || "").toLowerCase().trim();
        return t === "sticker" || t === "art" || t === "1" || t === "3";
      };

      const sortedComponents = [...components].sort((left, right) => {
        const zLeft = Number(left.zIndex || 0);
        const zRight = Number(right.zIndex || 0);
        if (zLeft !== zRight) return zLeft - zRight;

        const isLeftArt = isClippedType(left.componentType || left.type);
        const isRightArt = isClippedType(right.componentType || right.type);
        if (isLeftArt && !isRightArt) return -1;
        if (!isLeftArt && isRightArt) return 1;
        return 0;
      });

      for (const component of sortedComponents) {
        if (!component.imageUrl) continue;

        try {
          const image = await FabricImage.fromURL(component.imageUrl, FABRIC_CROSS_ORIGIN_OPTIONS);
          if (isCancelled) return;

          const isArt = isClippedType(component.componentType || component.type);

          image.set({
            left: contentMetrics.contentLeft + ((Number(component.posX ?? 0) + 0.5) * contentMetrics.contentWidth),
            top: contentMetrics.contentTop + ((Number(component.posY ?? 0) + 0.5) * contentMetrics.contentHeight),
            originX: "center",
            originY: "center",
            angle: Number(component.rotation) || 0,
            scaleX: getPlacementRenderScale(component.scale, contentMetrics.contentWidth, image.width),
            scaleY: getPlacementRenderScale(component.scale, contentMetrics.contentWidth, image.width),
            selectable: large,
            evented: large,
            transparentCorners: false,
            cornerColor: "#ea4f93",
            cornerStrokeColor: "#ffffff",
            borderColor: "#ea4f93",
            borderDashArray: large ? [6, 4] : undefined,
            cornerStyle: "circle",
            cornerSize: large ? 12 : 8,
            borderScaleFactor: large ? 2 : 1.35,
            padding: large ? 10 : 4,
            data: {
              placementKey: component.key,
              isArt,
            },
          });

          const widthLimit = isArt ? (contentMetrics.contentWidth * 1.42) : (contentMetrics.contentWidth * 3.0);
          if ((image.getScaledWidth() || 0) > widthLimit) {
            const ratio = widthLimit / image.getScaledWidth();
            image.scale((image.scaleX || 1) * ratio);
          }

          if (isArt && shapeImageUrl) {
            try {
              const clipImage = await FabricImage.fromURL(shapeImageUrl, FABRIC_CROSS_ORIGIN_OPTIONS);
              const scaleRatio = Math.max(
                contentMetrics.contentWidth / clipImage.width,
                contentMetrics.contentHeight / clipImage.height
              );
              const cropX = ((clipImage.width * scaleRatio) - contentMetrics.contentWidth) / 2 / scaleRatio;
              const cropY = ((clipImage.height * scaleRatio) - contentMetrics.contentHeight) / 2 / scaleRatio;

              clipImage.set({
                left: contentMetrics.contentLeft,
                top: contentMetrics.contentTop,
                scaleX: scaleRatio,
                scaleY: scaleRatio,
                cropX: Math.max(0, cropX),
                cropY: Math.max(0, cropY),
                width: contentMetrics.contentWidth / scaleRatio,
                height: contentMetrics.contentHeight / scaleRatio,
                originX: "left",
                originY: "top",
                absolutePositioned: true,
              });
              image.set({ clipPath: clipImage });
            } catch (clipErr) {
              console.error("Failed to load clip path shape image:", clipErr);
            }
          }

          canvas.add(image);
          if (large && component.key === selectedPlacementKey) {
            canvas.setActiveObject(image);
            image.setCoords();
          }
        } catch (error) {
          console.error("Unable to load nail component image:", error);
        }
      }

      canvas.renderAll();
    };

    renderObjects();

    return () => {
      isCancelled = true;
    };
  }, [components, contentMetrics, large, metrics.nailHeight, metrics.nailWidth, selectedPlacementKey, shapeImageUrl]);

  return (
    <NailShell
      finish={finish}
      shape={shape}
      index={fingerIndex}
      isActive={isActive}
      colorStyle={colorStyle}
      shapeImageUrl={shapeImageUrl}
      width={width}
      height={height} fingerLabel={fingerLabel}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </NailShell>
  );
}

FabricNailCanvas.propTypes = {
  fingerIndex: PropTypes.number.isRequired,
  finish: PropTypes.string.isRequired,
  shape: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  colorStyle: PropTypes.shape({}).isRequired,
  shapeImageUrl: PropTypes.string,
  fingerLabel: PropTypes.string,
  components: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    posX: PropTypes.number.isRequired,
    posY: PropTypes.number.isRequired,
    rotation: PropTypes.number.isRequired,
    scale: PropTypes.number.isRequired,
    zIndex: PropTypes.number,
  })).isRequired,
  selectedPlacementKey: PropTypes.string,
  onSelectNail: PropTypes.func.isRequired,
  onSelectPlacement: PropTypes.func.isRequired,
  onPlacementChange: PropTypes.func.isRequired,
  large: PropTypes.bool,
};

function StaticNailCard({ components, index, colorStyle, shapeImageUrl, compact = true, fingerLabel }) {
  const label = NAIL_LABELS[index];

  const shapeMaskStyle = shapeImageUrl
    ? {
      maskImage: `url(${shapeImageUrl})`,
      WebkitMaskImage: `url(${shapeImageUrl})`,
      maskSize: "cover",
      WebkitMaskSize: "cover",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }
    : {};

  const getFingerAlignmentClass = (label) => {
    if (compact) {
      switch (label) {
        case "Thumb":
          return "translate-y-5 -rotate-12";
        case "Index":
          return "translate-y-1 -rotate-3";
        case "Middle":
          return "translate-y-0 rotate-0";
        case "Ring":
          return "translate-y-0.5 rotate-3";
        case "Pinky":
          return "translate-y-4 rotate-8";
        default:
          return "";
      }
    }
    switch (label) {
      case "Thumb":
        return "translate-y-8 -rotate-12";
      case "Index":
        return "translate-y-2 -rotate-3";
      case "Middle":
        return "translate-y-0 rotate-0";
      case "Ring":
        return "translate-y-1 rotate-3";
      case "Pinky":
        return "translate-y-6 rotate-8";
      default:
        return "";
    }
  };

  const isClippedType = (type) => {
    const t = String(type || "").toLowerCase().trim();
    return t === "sticker" || t === "art" || t === "1" || t === "3";
  };

  return (
    <div className={`flex flex-col items-center transition-all duration-500 ease-out ${compact ? "gap-2" : "gap-3.5"} ${getFingerAlignmentClass(label)}`}>
      <div className="relative group">
        <div className="absolute -inset-1 rounded-t-[36px] rounded-b-[18px] bg-gradient-to-t from-[#ea4f93]/15 to-[#ffb8d9]/5 opacity-30 blur-md transition duration-500 group-hover:opacity-60 group-hover:blur-lg" />

        {/* Nail card — scaled based on compact mode */}
        <div className={`relative overflow-visible border-2 border-[#fcd5e6] bg-gradient-to-b from-[#fff6f9] to-[#ffeef5] shadow-[0_12px_28px_rgba(236,72,153,0.06)] transition-all duration-300 group-hover:scale-105 group-hover:border-[#ea4f93] ${compact ? "h-28 w-14 rounded-t-[20px] rounded-b-[10px]" : "h-48 w-24 rounded-t-[32px] rounded-b-[14px]"
          }`}>

          {/* Masked section for background and Art type components */}
          <div className="absolute inset-0 h-full w-full overflow-hidden" style={shapeMaskStyle}>
            <div className="absolute inset-0 h-full w-full" style={colorStyle} />

            {shapeImageUrl ? (
              <img
                crossOrigin="anonymous"
                src={shapeImageUrl}
                alt="shape mask overlay"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            ) : null}

            {components.map((componentItem, idx) => {
              if (!componentItem.imageUrl || !isClippedType(componentItem.componentType || componentItem.type)) return null;

              const displaySizePercent = (Number(componentItem.scale) || 0.8) * 2.5 * 100;
              const rotation = Number(componentItem.rotation) || 0;

              return (
                <img
                  key={`${componentItem.key}-${idx}`}
                  crossOrigin="anonymous"
                  src={componentItem.imageUrl}
                  alt={componentItem.label}
                  className="pointer-events-none absolute object-contain drop-shadow-[0_6px_10px_rgba(234,79,147,0.18)]"
                  referrerPolicy="no-referrer"
                  style={{
                    left: `${50 + Number(componentItem.posX || 0) * 100}%`,
                    top: `${50 + Number(componentItem.posY || 0) * 100}%`,
                    width: `${displaySizePercent}%`,
                    height: `${displaySizePercent}%`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </div>

          {/* Unmasked section for Gen type components */}
          <div className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
            {components.map((componentItem, idx) => {
              if (!componentItem.imageUrl || isClippedType(componentItem.componentType || componentItem.type)) return null;

              const displaySizePercent = (Number(componentItem.scale) || 0.8) * 2.5 * 100;
              const rotation = Number(componentItem.rotation) || 0;

              return (
                <img
                  key={`${componentItem.key}-${idx}`}
                  crossOrigin="anonymous"
                  src={componentItem.imageUrl}
                  alt={componentItem.label}
                  className="pointer-events-none absolute object-contain drop-shadow-[0_6px_10px_rgba(234,79,147,0.18)]"
                  referrerPolicy="no-referrer"
                  style={{
                    left: `${50 + Number(componentItem.posX || 0) * 100}%`,
                    top: `${50 + Number(componentItem.posY || 0) * 100}%`,
                    width: `${displaySizePercent}%`,
                    height: `${displaySizePercent}%`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
      <span className={`rounded-full border border-[#fce6f3] bg-white/90 font-bold uppercase tracking-[0.14em] text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.06)] ${compact ? "text-[8px] px-2 py-0.5" : "text-[10px] px-3 py-1"
        }`}>
        {fingerLabel ?? label}
      </span>
    </div>
  );
}

export function InteractiveStudioPreview({
  finish,
  shape,
  length,
  shapeImageUrl,
  fingerColorConfigs,
  componentPlacements,
  activeNailIndex,
  selectedPlacementKey,
  activeTemplateName,
  selectedShape,
  selectedNailShapeConfig,
  selectedColor,
  selectedFinish,
  selectedDecorations,
  onSelectNail,
  onSelectPlacement,
  onPlacementChange,
  onRemovePlacements,
  previewRef,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemsToRemove, setSelectedItemsToRemove] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "hand"
  const [handGender, setHandGender] = useState("woman"); // "woman" | "man"
  const aspectRatio = useShapeAspectRatio(shapeImageUrl);
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  const fingerLabels = useMemo(
    () => [
      t("nailFingerThumb"),
      t("nailFingerIndex"),
      t("nailFingerMiddle"),
      t("nailFingerRing"),
      t("nailFingerPinky"),
    ],
    [t, language],
  );

  const openNailEditor = (fingerIndex) => {
    onSelectNail(fingerIndex);
    setIsModalOpen(true);
  };

  const modalFingerIndex = activeNailIndex >= 0 ? activeNailIndex : 3;
  const modalFingerPlacements = useMemo(
    () => componentPlacements.filter((item) => item.fingerIndex === modalFingerIndex),
    [componentPlacements, modalFingerIndex],
  );

  const modalPlacement =
    modalFingerPlacements.find((item) => item.key === selectedPlacementKey)
    || modalFingerPlacements[0]
    || null;

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedItemsToRemove([]);
      return;
    }
    if (activeNailIndex === -1) {
      onSelectNail(3);
    }
  }, [activeNailIndex, isModalOpen, onSelectNail]);

  const renderPlacementInputs = (placement) => {
    if (!placement) {
      return (
        <p className="mt-3 text-[11px] font-semibold text-[#a98c9f]">
          {isVi ? "Chọn một phụ kiện trên móng này để chỉnh sửa tọa độ và kích thước chính xác." : "Select a component on this nail to edit exact coordinates and size."}
        </p>
      );
    }

    return (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          ["X", "posX", 0, 100, 0.5],
          ["Y", "posY", 0, 100, 0.5],
          ["Scale", "scale", 0.2, 2, 0.05],
          ["Rotate", "rotation", -180, 180, 1],
          ["Layer", "zIndex", 1, 30, 1],
        ].map(([label, key, min, max, step]) => (
          <label key={key} className="grid gap-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#a98c9f]">
              <span>{label}</span>
              <span>{placement[key]}</span>
            </div>
            <Input
              type="number"
              min={min}
              max={max}
              step={step}
              value={placement[key]}
              onChange={(event) =>
                onPlacementChange(placement.key, {
                  [key]: Number(event.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
    );
  };

  return (
    <>
      <div ref={previewRef} className="mt-4 rounded-[18px] bg-[linear-gradient(180deg,#fff3f9_0%,#ffeef7_100%)] p-5">
        {/* Toolbar for Display Mode */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-white/70 p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${viewMode === "grid"
                ? "bg-[#ea4f93] text-white"
                : "bg-white border border-[#f2bfd4] text-[#ea4f93] hover:bg-[#fff5fa]"
                }`}
            >
              <Grid size={13} />
              {isVi ? "Lưới" : "Grid"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("hand")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${viewMode === "hand"
                ? "bg-[#ea4f93] text-white"
                : "bg-white border border-[#f2bfd4] text-[#ea4f93] hover:bg-[#fff5fa]"
                }`}
            >
              <Hand size={13} />
              {isVi ? "Bàn tay" : "Hand"}
            </button>
          </div>

          {viewMode === "hand" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#b07d97]">{isVi ? "Mẫu" : "Model"}:</span>
              <button
                type="button"
                onClick={() => setHandGender("woman")}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${handGender === "woman"
                  ? "bg-[#fff1f7] border border-[#f2bfd4] text-[#ea4f93]"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
              >
                👩 {isVi ? "Nữ" : "Female"}
              </button>
              <button
                type="button"
                onClick={() => setHandGender("man")}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${handGender === "man"
                  ? "bg-[#fff1f7] border border-[#f2bfd4] text-[#ea4f93]"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
              >
                👨 {isVi ? "Nam" : "Male"}
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] bg-white/65 px-3 py-2 text-[10px] font-bold text-[#b07d97]">
          <span>{isVi ? "Kiểu bề mặt" : "Surface Mode"}</span>
          <span className="rounded-full bg-[#fff1f7] px-2.5 py-1 text-[#ea4f93]">
            {finish}
          </span>
        </div>

        <div className="rounded-[14px] border border-dashed border-[#f2bfd4] bg-white/75 px-3 py-2 text-[10px] font-bold text-[#b07d97]">
          {isVi ? "Chọn một móng để mở trình chỉnh sửa và chỉnh sửa vị trí phụ kiện tại đó." : "Click a nail to open its editor and edit component position there."}
        </div>

        {viewMode === "hand" ? (
          <div className="mt-4 relative w-full h-[500px] flex items-center justify-center bg-[radial-gradient(circle_at_center,#ffffff_0%,#f7eff3_100%)] rounded-lg border border-[#f1e5e8] overflow-hidden shadow-[0_12px_32px_rgba(138,61,96,0.06)]">
            <div className="relative w-[380px] h-[460px] flex items-center justify-center transition-all duration-500 ease-out">
              <img
                src={handGender === "man" ? manHandImg : womanHandImg}
                alt={`${handGender} hand preview`}
                className="w-full h-full object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
              />
              {HAND_SLOT_CONFIG[handGender].map((slot) => {
                const isSelected = activeNailIndex === slot.index;
                const slotWidthPx = 380 * (parseFloat(slot.width) / 100);
                const metrics = getNailMetrics(slot.index, aspectRatio, false);
                const scale = slotWidthPx / metrics.frameWidth;

                return (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => openNailEditor(slot.index)}
                    className={`absolute cursor-pointer transition-all duration-250 ease-out z-[5] hover:z-[25] hover:drop-shadow-[0_4px_14px_rgba(138,61,96,0.6)] ${isSelected ? "z-[40] drop-shadow-[0_6px_18px_rgba(138,61,96,0.7)]" : ""
                      }`}
                    style={{
                      left: slot.left,
                      top: slot.top,
                      width: slot.width,
                      height: "auto",
                      transform: `rotate(${slot.rotate})`,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    <div
                      className="origin-top center"
                      style={{
                        transform: `scale(${scale})`,
                        width: `${metrics.frameWidth}px`,
                        height: `${metrics.frameHeight}px`
                      }}
                    >
                      <FabricNailCanvas
                        fingerIndex={slot.index} fingerLabel={fingerLabels[slot.index]}
                        finish={finish}
                        shape={shape}
                        isActive={activeNailIndex === -1 ? true : activeNailIndex === slot.index}
                        colorStyle={getColorStyle(fingerColorConfigs[slot.index])}
                        components={componentPlacements.filter((item) => item.fingerIndex === slot.index)}
                        shapeImageUrl={shapeImageUrl}
                        selectedPlacementKey={selectedPlacementKey}
                        onSelectNail={openNailEditor}
                        onSelectPlacement={onSelectPlacement}
                        onPlacementChange={onPlacementChange}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-end justify-center gap-2 overflow-visible px-2 py-8 w-full">
            {Array.from({ length: 5 }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => openNailEditor(index)}
                className="relative isolate flex justify-center overflow-visible bg-transparent p-0 transition-transform hover:scale-105"
              >
                <StaticNailCard
                  index={index} fingerLabel={fingerLabels[index]}
                  colorStyle={getColorStyle(fingerColorConfigs[index])}
                  components={componentPlacements.filter((item) => item.fingerIndex === index)}
                  shapeImageUrl={shapeImageUrl}
                  compact={true}
                />
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 text-center">
          <p className="text-[10px] text-[#aa8c9f]">{isVi ? "Thiết kế hiện tại" : "Current Design"}</p>
          <p className="mt-1 text-sm font-bold text-[#ea4f93]">{activeTemplateName}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold text-[#d2508a]">
            <span>{selectedShape}</span>
            <span>{selectedNailShapeConfig?.name || "--"}</span>
            <span>{selectedColor}</span>
            <span>{selectedFinish}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {selectedDecorations.length > 0 ? (
            selectedDecorations.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#f2bfd4] bg-white px-2.5 py-1 text-[10px] font-bold text-[#ea4f93]"
              >
                {activeNailIndex === -1 ? (isVi ? "Tất cả các ngón" : "All fingers") : fingerLabels[activeNailIndex]}: {item}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-[#f0d7e3] bg-white px-2.5 py-1 text-[10px] font-bold text-[#b48aa0]">
              {activeNailIndex === -1 ? (isVi ? "Tất cả các ngón" : "All fingers") : fingerLabels[activeNailIndex]}: No decoration
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            ["Shape", "Hình dáng", selectedShape],
            ["Surface", "Bề mặt", selectedFinish],
            ["Nail Shape Config", "Cấu hình móng", selectedNailShapeConfig?.name || "--"],
            ["Color", "Màu sắc", selectedColor],
          ].map(([label, labelVi, value]) => (
            <div key={label} className="rounded-[12px] bg-white px-3 py-2 text-center">
              <p className="text-[10px] text-[#a98c9f]">{isVi ? labelVi : label}</p>
              <p className="mt-1 text-xs font-bold text-[#ea4f93]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal
        title={null}
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        width={920}
        centered
        destroyOnClose={false}
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "visible" },
          body: { padding: 0 },
          mask: { backdropFilter: "blur(6px)" },
        }}
      >
        <div className="bg-[linear-gradient(135deg,#fff0f8_0%,#fff5fb_100%)] px-6 pb-10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#402542]">
                {fingerLabels[modalFingerIndex]} {isVi ? "Chỉnh sửa" : "Editor"}
              </h3>
              <p className="mt-1 text-sm text-[#b06484]">
                {isVi ? "Chọn một phụ kiện trên móng này, sau đó kéo nó hoặc chỉnh sửa giá trị chính xác bên dưới." : "Select a component on this nail, then drag it or edit exact values below."}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-[#ea4f93]">
              <Sparkles size={12} />
              {modalFingerPlacements.length} {isVi ? "phụ kiện" : "components"}
            </div>
          </div>
        </div>

        <div className="-mt-6 grid gap-6 rounded-[28px] bg-white px-6 pb-6 pt-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#f6d8e6] bg-[#fffafb] p-4 overflow-visible">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
                {isVi ? "Trình chỉnh sửa móng" : "Live Nail Canvas"}
              </p>
              <div className="mt-4 flex justify-center overflow-visible px-2 py-3">
                <FabricNailCanvas
                  fingerIndex={modalFingerIndex} fingerLabel={fingerLabels[modalFingerIndex]}
                  finish={finish}
                  shape={shape}
                  isActive
                  colorStyle={getColorStyle(fingerColorConfigs[modalFingerIndex])}
                  components={modalFingerPlacements}
                  shapeImageUrl={shapeImageUrl}
                  selectedPlacementKey={selectedPlacementKey}
                  onSelectNail={onSelectNail}
                  onSelectPlacement={onSelectPlacement}
                  onPlacementChange={onPlacementChange}
                  large
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#f2bfd4] bg-white px-4 py-3 text-xs font-bold text-[#ea4f93]"
            >
              <Maximize2 size={14} />
              Close Nail Editor
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#f6d8e6] bg-[#fffafb] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
                  {isVi ? "Phụ kiện trên móng" : "Components On This Nail"}
                </p>
                {selectedItemsToRemove.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onRemovePlacements) onRemovePlacements(selectedItemsToRemove);
                      setSelectedItemsToRemove([]);
                    }}
                    className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={12} />
                    {isVi ? `Xóa ${selectedItemsToRemove.length} mục` : `Delete ${selectedItemsToRemove.length}`}
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {modalFingerPlacements.length > 0 ? (
                  modalFingerPlacements.map((item) => (
                    <div
                      key={item.key}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${modalPlacement?.key === item.key
                        ? "border-[#ea4f93] bg-[#fff0f8]"
                        : "border-[#f5d2e1] bg-white hover:border-[#ea4f93]"
                        }`}
                    >
                      <Checkbox
                        checked={selectedItemsToRemove.includes(item.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItemsToRemove(prev => [...prev, item.key]);
                          } else {
                            setSelectedItemsToRemove(prev => prev.filter(k => k !== item.key));
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => onSelectPlacement(item.key)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.label}
                          className="h-12 w-12 rounded-xl border border-[#f3c8db] bg-white object-contain p-1"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#3f2240]">{item.label}</p>
                          <p className="mt-1 text-xs text-[#9d7188]">
                            X {Number(item.posX).toFixed(1)}% • Y {Number(item.posY).toFixed(1)}% • Scale {Number(item.scale).toFixed(2)}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onRemovePlacements) onRemovePlacements([item.key]);
                          setSelectedItemsToRemove(prev => prev.filter(k => k !== item.key));
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600"
                        title={isVi ? "Xóa" : "Delete"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#9d7188]">
                    {isVi ? "Không có phụ kiện nào được đặt trên móng này." : "No decorations are currently placed on this nail."}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#f6d8e6] bg-white p-4">
              <div className="flex items-center gap-2 text-[#ea4f93]">
                <Move size={14} />
                <p className="text-xs font-bold uppercase tracking-[0.12em]">
                  {isVi ? "Phụ kiện đã chọn" : "Selected Component"}
                </p>
              </div>
              {renderPlacementInputs(modalPlacement)}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

InteractiveStudioPreview.propTypes = {
  finish: PropTypes.string.isRequired,
  shape: PropTypes.string.isRequired,
  length: PropTypes.string.isRequired,
  shapeImageUrl: PropTypes.string,
  fingerColorConfigs: PropTypes.arrayOf(PropTypes.shape({
    mode: PropTypes.string,
    primaryColor: PropTypes.string,
    secondaryColor: PropTypes.string,
    gradientStops: PropTypes.arrayOf(PropTypes.string),
  })).isRequired,
  componentPlacements: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    fingerIndex: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    posX: PropTypes.number.isRequired,
    posY: PropTypes.number.isRequired,
    scale: PropTypes.number.isRequired,
    rotation: PropTypes.number.isRequired,
    zIndex: PropTypes.number,
  })).isRequired,
  activeNailIndex: PropTypes.number.isRequired,
  selectedPlacementKey: PropTypes.string,
  activeTemplateName: PropTypes.string.isRequired,
  selectedShape: PropTypes.string.isRequired,
  selectedNailShapeConfig: PropTypes.shape({
    shapeMethodConfigId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  selectedColor: PropTypes.string.isRequired,
  selectedFinish: PropTypes.string.isRequired,
  selectedDecorations: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectNail: PropTypes.func.isRequired,
  onSelectPlacement: PropTypes.func.isRequired,
  onPlacementChange: PropTypes.func.isRequired,
  previewRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
};
