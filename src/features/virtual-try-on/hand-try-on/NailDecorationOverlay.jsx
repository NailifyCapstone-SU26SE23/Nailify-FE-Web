import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

export function NailDecorationOverlay({ fingerIndex, task }) {
  const [decorations, setDecorations] = useState([]);
  const [layout, setLayout] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(-1);
  const [selectedFinger, setSelectedFinger] = useState(-1);
  const containerRef = useRef(null);

  const refresh = useCallback(() => {
    setDecorations(task.getDecorations(fingerIndex));
    setLayout(task.getCanvasLayout(fingerIndex));
    setSelectedLayer(task.getSelectedLayerIndex());
    setSelectedFinger(task.getSelectedFingerIndex());
  }, [fingerIndex, task]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    document.addEventListener("nail-decorations-changed", handler);

    const interval = setInterval(() => {
      const sl = task.getSelectedLayerIndex();
      const sf = task.getSelectedFingerIndex();
      if (sl !== selectedLayer || sf !== selectedFinger) {
        setSelectedLayer(sl);
        setSelectedFinger(sf);
      }
    }, 100);

    return () => {
      document.removeEventListener("nail-decorations-changed", handler);
      clearInterval(interval);
    };
  }, [refresh, selectedLayer, selectedFinger, task]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setLayout(task.getCanvasLayout(fingerIndex));
    });
    const canvas = document.getElementById(
      `nail-preview-canvas-${fingerIndex}`,
    );
    if (canvas) resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [fingerIndex, task]);

  if (!layout || decorations.length === 0) return null;

  const toPercX = (canvasX) => (canvasX / layout.canvasW) * 100;
  const toPercY = (canvasY) => (canvasY / layout.canvasH) * 100;

  const destXPerc = toPercX(layout.destX);
  const destYPerc = toPercY(layout.destY);
  const destWPerc = toPercX(layout.destW);
  const destHPerc = toPercY(layout.destH);

  const isClippedType = (type) => {
    const t = String(type || "").toLowerCase().trim();
    return t === "sticker" || t === "art" || t === "1" || t === "3";
  };

  const maskContainerStyle = layout.shapeImageUrl
    ? {
        left: `${destXPerc}%`,
        top: `${destYPerc}%`,
        width: `${destWPerc}%`,
        height: `${destHPerc}%`,
        maskImage: `url(${layout.shapeImageUrl})`,
        WebkitMaskImage: `url(${layout.shapeImageUrl})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }
    : {
        left: `${destXPerc}%`,
        top: `${destYPerc}%`,
        width: `${destWPerc}%`,
        height: `${destHPerc}%`,
      };

  const unmaskedContainerStyle = {
    left: `${destXPerc}%`,
    top: `${destYPerc}%`,
    width: `${destWPerc}%`,
    height: `${destHPerc}%`,
  };

  return (
    <div
      ref={containerRef}
      className="decoration-overlay"
      onPointerDown={(e) => {
        if (e.target === containerRef.current) {
          task.deselectLayer(fingerIndex);
          refresh();
        }
      }}
    >
      {/* Layer 1: Masked artwork layer for Stickers & Art */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={maskContainerStyle}
      >
        {decorations.map((dec, idx) => {
          if (!isClippedType(dec.type)) return null;
          const isSelected =
            selectedFinger === fingerIndex && selectedLayer === idx;
          return (
            <img
              key={`masked-${dec.id}`}
              src={dec.imageSrc}
              alt={dec.type}
              draggable={false}
              className="absolute object-contain select-none cursor-pointer pointer-events-auto"
              style={{
                left: `${50 + dec.x * 100}%`,
                top: `${50 + dec.y * 100}%`,
                width: `${dec.scale * 100}%`,
                height: `${dec.scale * 100}%`,
                transform: `translate(-50%, -50%) rotate(${dec.rotation}deg)`,
                zIndex: isSelected ? 10 : idx,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                task.setSelectedLayer(fingerIndex, idx);
                refresh();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          );
        })}
      </div>

      {/* Layer 2: Unmasked artwork layer for Gems & Charms */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={unmaskedContainerStyle}
      >
        {decorations.map((dec, idx) => {
          if (isClippedType(dec.type)) return null;
          const isSelected =
            selectedFinger === fingerIndex && selectedLayer === idx;
          return (
            <img
              key={`unmasked-${dec.id}`}
              src={dec.imageSrc}
              alt={dec.type}
              draggable={false}
              className="absolute object-contain select-none cursor-pointer pointer-events-auto"
              style={{
                left: `${50 + dec.x * 100}%`,
                top: `${50 + dec.y * 100}%`,
                width: `${dec.scale * 100}%`,
                height: `${dec.scale * 100}%`,
                transform: `translate(-50%, -50%) rotate(${dec.rotation}deg)`,
                zIndex: isSelected ? 10 : idx,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                task.setSelectedLayer(fingerIndex, idx);
                refresh();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          );
        })}
      </div>

      {/* Layer 3: Interactive Controls & Selection Box */}
      {decorations.map((dec, idx) => {
        const isSelected =
          selectedFinger === fingerIndex && selectedLayer === idx;
        const centerX = toPercX(
          layout.destX + layout.destW / 2 + dec.x * layout.destW,
        );
        const centerY = toPercY(
          layout.destY + layout.destH / 2 + dec.y * layout.destH,
        );
        const decWPerc = toPercX(layout.destW * dec.scale);
        const decHPerc = toPercY(layout.destH * dec.scale);

        return (
          <DecorationItem
            key={dec.id}
            dec={dec}
            idx={idx}
            fingerIndex={fingerIndex}
            isSelected={isSelected}
            centerX={centerX}
            centerY={centerY}
            widthPerc={decWPerc}
            heightPerc={decHPerc}
            task={task}
            layout={layout}
            onRefresh={refresh}
          />
        );
      })}
    </div>
  );
}

function DecorationItem({
  dec,
  idx,
  fingerIndex,
  isSelected,
  centerX,
  centerY,
  widthPerc,
  heightPerc,
  task,
  layout,
  onRefresh,
}) {
  const itemRef = useRef(null);
  const initialPosRef = useRef({ x: dec.x, y: dec.y });

  const handlePanStart = useCallback(
    (e) => {
      const evt = e.nativeEvent || e;
      if (
        evt.target.closest?.(
          ".decoration-rotate-handle, .decoration-resize-handle",
        )
      )
        return;
      initialPosRef.current = { x: dec.x, y: dec.y };
    },
    [dec.x, dec.y],
  );

  const handlePan = useCallback(
    (e, info) => {
      const evt = e.nativeEvent || e;
      if (
        evt.target.closest?.(
          ".decoration-rotate-handle, .decoration-resize-handle",
        )
      )
        return;
      if (!isSelected || !itemRef.current) return;
      const parent = itemRef.current.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();

      const dxNorm = info.offset.x / parentRect.width;
      const dyNorm = info.offset.y / parentRect.height;

      const newX =
        initialPosRef.current.x + dxNorm * (layout.canvasW / layout.destW);
      const newY =
        initialPosRef.current.y + dyNorm * (layout.canvasH / layout.destH);

      const clampedX = Math.max(-0.12, Math.min(0.12, newX));
      const clampedY = Math.max(-0.38, Math.min(0.32, newY));

      task.updateDecoration(fingerIndex, idx, { x: clampedX, y: clampedY });
      onRefresh();
    },
    [isSelected, fingerIndex, idx, layout, task, onRefresh],
  );

  const handleWheel = useCallback(
    (e) => {
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      task.updateDecoration(fingerIndex, idx, { scale: dec.scale + delta });
      onRefresh();
    },
    [dec.scale, fingerIndex, idx, task, onRefresh],
  );

  const handlePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      task.setSelectedLayer(fingerIndex, idx);
      onRefresh();
    },
    [fingerIndex, idx, task, onRefresh],
  );

  const initialScaleRef = useRef(dec.scale);

  const handleResizePanStart = useCallback(
    (e) => {
      e.stopPropagation();
      initialScaleRef.current = dec.scale;
      initialPosRef.current = { x: dec.x, y: dec.y };
    },
    [dec.scale, dec.x, dec.y],
  );

  const initialRotateRef = useRef({ angle: dec.rotation, startAngle: 0 });

  const getClientCoords = (e) => {
    const evt = e.nativeEvent || e;
    if (evt.touches && evt.touches.length > 0) {
      return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
    }
    return { x: evt.clientX || 0, y: evt.clientY || 0 };
  };

  const handleRotatePanStart = useCallback(
    (e) => {
      e.stopPropagation();
      if (!itemRef.current) return;
      const rect = itemRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const coords = getClientCoords(e);
      const startAngle =
        Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
      initialRotateRef.current = { angle: dec.rotation, startAngle };
    },
    [dec.rotation],
  );

  const handleRotatePan = useCallback(
    (e) => {
      e.stopPropagation();
      if (!itemRef.current) return;
      const rect = itemRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const coords = getClientCoords(e);
      const currentAngle =
        Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
      const angleDelta = currentAngle - initialRotateRef.current.startAngle;
      let newRotation = initialRotateRef.current.angle + angleDelta;
      newRotation = ((newRotation % 360) + 360) % 360;
      task.updateDecoration(fingerIndex, idx, { rotation: newRotation });
      onRefresh();
    },
    [fingerIndex, idx, task, onRefresh],
  );

  const createResizeHandler = (factorX, factorY) => (e, info) => {
    e.stopPropagation();
    if (!itemRef.current) return;
    const parent = itemRef.current.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();

    const dx = info.offset.x;
    const dy = info.offset.y;

    const scaleDeltaX =
      (dx / parentRect.width) * (layout.canvasW / layout.destW) * factorX;
    const scaleDeltaY =
      (dy / parentRect.height) * (layout.canvasH / layout.destH) * factorY;

    const avgDelta = (scaleDeltaX + scaleDeltaY) / 2;

    let newScale = initialScaleRef.current + avgDelta;
    newScale = Math.max(0.05, Math.min(4, newScale));

    const actualScaleDelta = newScale - initialScaleRef.current;

    const newX = initialPosRef.current.x + (actualScaleDelta / 2) * factorX;
    const newY = initialPosRef.current.y + (actualScaleDelta / 2) * factorY;

    const clampedX = Math.max(-0.12, Math.min(0.12, newX));
    const clampedY = Math.max(-0.38, Math.min(0.32, newY));

    task.updateDecoration(fingerIndex, idx, {
      scale: newScale,
      x: clampedX,
      y: clampedY,
    });
    onRefresh();
  };

  return (
    <motion.div
      ref={itemRef}
      className={`decoration-item ${isSelected ? "selected" : ""}`}
      style={{
        position: "absolute",
        left: `${centerX}%`,
        top: `${centerY}%`,
        width: `${widthPerc}%`,
        height: `${heightPerc}%`,
        cursor: isSelected ? "grab" : "pointer",
        zIndex: isSelected ? 10 : idx,
        pointerEvents: "auto",
      }}
      animate={{
        x: "-50%",
        y: "-50%",
        rotate: dec.rotation,
      }}
      transition={{ type: "tween", duration: 0 }}
      onPanStart={isSelected ? handlePanStart : undefined}
      onPan={isSelected ? handlePan : undefined}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      onWheel={handleWheel}
      whileTap={isSelected ? { scale: 1.05 } : undefined}
      whileHover={{ scale: isSelected ? 1.02 : 1 }}
    >
      {isSelected && (
        <>
          {[
            { top: -6, left: -6, cursor: "nwse-resize", fx: -1, fy: -1 },
            { top: -6, right: -6, cursor: "nesw-resize", fx: 1, fy: -1 },
            { bottom: -6, left: -6, cursor: "nesw-resize", fx: -1, fy: 1 },
            { bottom: -6, right: -6, cursor: "nwse-resize", fx: 1, fy: 1 },
          ].map((corner, i) => (
            <motion.div
              key={i}
              className="decoration-resize-handle"
              onPointerDown={(e) => e.stopPropagation()}
              onPanStart={handleResizePanStart}
              onPan={createResizeHandler(corner.fx, corner.fy)}
              style={{
                position: "absolute",
                top: corner.top,
                bottom: corner.bottom,
                left: corner.left,
                right: corner.right,
                width: 12,
                height: 12,
                backgroundColor: "#fff",
                border: "2px solid var(--tryon-primary, #007f8b)",
                borderRadius: "50%",
                cursor: corner.cursor,
                zIndex: 20,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 1.1 }}
            />
          ))}
          <motion.div
            className="decoration-rotate-handle"
            onPointerDown={(e) => e.stopPropagation()}
            onPanStart={handleRotatePanStart}
            onPan={handleRotatePan}
            style={{
              position: "absolute",
              bottom: -40,
              left: "50%",
              marginLeft: -14,
              width: 28,
              height: 28,
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "50%",
              cursor: "grab",
              zIndex: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#555",
            }}
            whileHover={{ scale: 1.1, color: "var(--tryon-primary, #007f8b)" }}
            whileTap={{ scale: 1.05, cursor: "grabbing" }}
          >
            <RotateCw size={16} strokeWidth={2.5} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
