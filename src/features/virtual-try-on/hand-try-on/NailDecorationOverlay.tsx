import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { HandLandmarkerTaskHandle, DecorationData, CanvasLayout } from '../handLandmarkerTask';

type NailDecorationOverlayProps = {
  fingerIndex: number;
  task: HandLandmarkerTaskHandle;
};

export function NailDecorationOverlay({ fingerIndex, task }: NailDecorationOverlayProps) {
  const [decorations, setDecorations] = useState<DecorationData[]>([]);
  const [layout, setLayout] = useState<CanvasLayout | null>(null);
  const [selectedLayer, setSelectedLayer] = useState(-1);
  const [selectedFinger, setSelectedFinger] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    setDecorations(task.getDecorations(fingerIndex));
    setLayout(task.getCanvasLayout(fingerIndex));
    setSelectedLayer(task.getSelectedLayerIndex());
    setSelectedFinger(task.getSelectedFingerIndex());
  }, [fingerIndex, task]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    document.addEventListener('nail-decorations-changed', handler);

    // Poll for selection changes (lightweight — just reads numbers)
    const interval = setInterval(() => {
      const sl = task.getSelectedLayerIndex();
      const sf = task.getSelectedFingerIndex();
      if (sl !== selectedLayer || sf !== selectedFinger) {
        setSelectedLayer(sl);
        setSelectedFinger(sf);
      }
    }, 100);

    return () => {
      document.removeEventListener('nail-decorations-changed', handler);
      clearInterval(interval);
    };
  }, [refresh, selectedLayer, selectedFinger, task]);

  // Also refresh when the canvas resizes (e.g. zoom toggle)
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setLayout(task.getCanvasLayout(fingerIndex));
    });
    const canvas = document.getElementById(`nail-preview-canvas-${fingerIndex}`);
    if (canvas) resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [fingerIndex, task]);

  if (!layout || decorations.length === 0) return null;

  // The overlay is positioned over the canvas. We need to convert canvas
  // intrinsic pixel coordinates to CSS percentages.
  const toPercX = (canvasX: number) => (canvasX / layout.canvasW) * 100;
  const toPercY = (canvasY: number) => (canvasY / layout.canvasH) * 100;

  return (
    <div
      ref={containerRef}
      className="decoration-overlay"
      onPointerDown={(e) => {
        // If clicking the overlay background (not a decoration), deselect
        if (e.target === containerRef.current) {
          task.deselectLayer(fingerIndex);
          refresh();
        }
      }}
    >
      {decorations.map((dec, idx) => {
        const isSelected = selectedFinger === fingerIndex && selectedLayer === idx;

        // Calculate center position in percentage
        const centerX = toPercX(layout.destX + layout.destW / 2 + dec.x * layout.destW);
        const centerY = toPercY(layout.destY + layout.destH / 2 + dec.y * layout.destH);

        // Calculate size in percentage
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

type DecorationItemProps = {
  dec: DecorationData;
  idx: number;
  fingerIndex: number;
  isSelected: boolean;
  centerX: number;
  centerY: number;
  widthPerc: number;
  heightPerc: number;
  task: HandLandmarkerTaskHandle;
  layout: CanvasLayout;
  onRefresh: () => void;
};

function DecorationItem({
  dec, idx, fingerIndex, isSelected, centerX, centerY,
  widthPerc, heightPerc, task, layout, onRefresh,
}: DecorationItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  const initialPosRef = useRef({ x: dec.x, y: dec.y });

  const handlePanStart = useCallback(() => {
    initialPosRef.current = { x: dec.x, y: dec.y };
  }, [dec.x, dec.y]);

  const handlePan = useCallback((e: any, info: any) => {
    if (!isSelected || !itemRef.current) return;
    const parent = itemRef.current.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();

    const dxNorm = info.offset.x / parentRect.width;
    const dyNorm = info.offset.y / parentRect.height;

    const newX = initialPosRef.current.x + dxNorm * (layout.canvasW / layout.destW);
    const newY = initialPosRef.current.y + dyNorm * (layout.canvasH / layout.destH);

    task.updateDecoration(fingerIndex, idx, { x: newX, y: newY });
    onRefresh();
  }, [isSelected, fingerIndex, idx, layout, task, onRefresh]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    task.updateDecoration(fingerIndex, idx, { scale: dec.scale + delta });
    onRefresh();
  }, [dec.scale, fingerIndex, idx, task, onRefresh]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    task.setSelectedLayer(fingerIndex, idx);
    onRefresh();
  }, [fingerIndex, idx, task, onRefresh]);

  const initialScaleRef = useRef(dec.scale);

  const handleResizePanStart = useCallback((e: any) => {
    e.stopPropagation();
    initialScaleRef.current = dec.scale;
  }, [dec.scale]);

  const handleResizePan = useCallback((e: any, info: any) => {
    e.stopPropagation();
    // Dragging down/right increases scale. Sensitivity: 100px = scale +1.0
    const scaleDelta = (info.offset.x + info.offset.y) / 100;
    let newScale = initialScaleRef.current + scaleDelta;
    newScale = Math.max(0.05, Math.min(4, newScale));
    
    task.updateDecoration(fingerIndex, idx, { scale: newScale });
    onRefresh();
  }, [fingerIndex, idx, task, onRefresh]);

  return (
    <motion.div
      ref={itemRef}
      className={`decoration-item ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${centerX}%`,
        top: `${centerY}%`,
        width: `${widthPerc}%`,
        height: `${heightPerc}%`,
        cursor: isSelected ? 'grab' : 'pointer',
        zIndex: isSelected ? 10 : idx,
      }}
      animate={{
        x: '-50%',
        y: '-50%',
        rotate: dec.rotation,
      }}
      transition={{ type: 'tween', duration: 0 }}
      onPanStart={isSelected ? handlePanStart : undefined}
      onPan={isSelected ? handlePan : undefined}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      whileTap={isSelected ? { scale: 1.05 } : undefined}
      whileHover={{ scale: isSelected ? 1.02 : 1 }}
    >
      <img
        src={dec.imageSrc}
        alt={dec.type}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      {isSelected && (
        <>
          <motion.div
            className="decoration-resize-handle"
            onPointerDown={(e) => e.stopPropagation()}
            onPanStart={handleResizePanStart}
            onPan={handleResizePan}
            style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              width: 14,
              height: 14,
              backgroundColor: '#fff',
              border: '2px solid #007f8b',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 1.1 }}
          />
          <div className="decoration-resize-hint">
            <span>Drag handle to resize</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
