import { BuilderActions } from "./BuilderActions";
import { BuilderControls } from "./BuilderControls";
import { NailDecorationOverlay } from "./NailDecorationOverlay";
import { HandSlotCalibrator } from "./HandSlotCalibrator";
import { HAND_SLOT_CONFIG, getHandSlots } from "./handSlotConfig";
import { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, Sliders } from "lucide-react";
import womanHandImg from "@/shared/assets/images/womanHand.png";
import manHandImg from "@/shared/assets/images/manHand.png";

const HAND_VIEW_NAIL_SCALE = 1;

function scalePercent(value, scale) {
  const numeric = parseFloat(value);
  if (!Number.isFinite(numeric)) return value;
  return `${numeric * scale}%`;
}

function NailCanvas({ fingerIndex, task }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!task || typeof task.renderPreviewCanvas !== "function") return;

    const draw = () => {
      if (
        canvasRef.current &&
        task &&
        typeof task.renderPreviewCanvas === "function"
      ) {
        task.renderPreviewCanvas(canvasRef.current, fingerIndex);
      }
    };

    // Draw base nail shape immediately when component mounts
    draw();

    document.addEventListener("nail-decorations-changed", draw);

    const timer1 = setTimeout(draw, 30);
    const timer2 = setTimeout(draw, 120);

    return () => {
      document.removeEventListener("nail-decorations-changed", draw);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [fingerIndex, task]);

  return (
    <canvas
      ref={canvasRef}
      id={`nail-preview-canvas-${fingerIndex}`}
      width="320"
      height="420"
    />
  );
}

export function BuilderView({
  currentNailSetId,
  handLandmarkerTask,
  onReturnToForm,
  onSaveDraft,
}) {
  const previewLabels = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "hand"
  const [handGender, setHandGender] = useState("woman"); // "woman" | "man"
  const [isZoomed, setIsZoomed] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Live custom slots configuration (with localStorage backup)
  const [customConfig, setCustomConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("nailify_hand_slot_config");
      return saved ? JSON.parse(saved) : HAND_SLOT_CONFIG;
    } catch (e) {
      return HAND_SLOT_CONFIG;
    }
  });

  const [selectedFinger, setSelectedFinger] = useState(
    handLandmarkerTask?.getSelectedFingerIndex() ?? -1,
  );

  useEffect(() => {
    if (!handLandmarkerTask) return;
    const handler = () => {
      setSelectedFinger(handLandmarkerTask.getSelectedFingerIndex());
    };
    document.addEventListener("nail-decorations-changed", handler);
    return () => {
      document.removeEventListener("nail-decorations-changed", handler);
    };
  }, [handLandmarkerTask]);

  // Re-draw base nail canvas shapes whenever viewMode, handGender, or zoom changes
  useEffect(() => {
    if (!handLandmarkerTask) return;
    const timer = setTimeout(() => {
      handLandmarkerTask.triggerRedetection();
    }, 40);
    return () => clearTimeout(timer);
  }, [viewMode, handGender, isZoomed, handLandmarkerTask]);

  const handleSelectFinger = (index) => {
    setSelectedFinger(index);
    if (handLandmarkerTask) {
      handLandmarkerTask.setSelectedLayer(index, -1);
      document.dispatchEvent(new CustomEvent("nail-decorations-changed"));
    }
  };

  const handleShowAllFingers = () => {
    setSelectedFinger(-1);
    if (handLandmarkerTask) {
      handLandmarkerTask.setSelectedLayer(-1, -1);
      document.dispatchEvent(new CustomEvent("nail-decorations-changed"));
    }
  };

  const handleAddForAll = () => {
    if (handLandmarkerTask) {
      handLandmarkerTask.copyCurrentFingerToAll();
    }
  };

  const handleUpdateSlot = (fingerIndex, field, val) => {
    setCustomConfig((prev) => {
      const currentGenderList = [
        ...(prev[handGender] || HAND_SLOT_CONFIG[handGender]),
      ];
      currentGenderList[fingerIndex] = {
        ...currentGenderList[fingerIndex],
        [field]: val,
      };
      const updated = { ...prev, [handGender]: currentGenderList };
      try {
        localStorage.setItem(
          "nailify_hand_slot_config",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });
  };

  const handleResetSlots = () => {
    setCustomConfig((prev) => {
      const updated = { ...prev, [handGender]: HAND_SLOT_CONFIG[handGender] };
      try {
        localStorage.removeItem("nailify_hand_slot_config");
      } catch (e) {}
      return updated;
    });
  };

  const currentHandImg = handGender === "man" ? manHandImg : womanHandImg;

  // Hand slot positions derived from live state or config file
  const activeGenderSlots =
    customConfig[handGender] || HAND_SLOT_CONFIG[handGender];
  const handSlots = activeGenderSlots.map((slot) => ({
    ...slot,
    style: {
      left: slot.left,
      top: slot.top,
      width: scalePercent(slot.width, HAND_VIEW_NAIL_SCALE),
      height: slot.height || "auto",
      transform: `rotate(${slot.rotate})`,
    },
  }));

  const activeSlot = selectedFinger >= 0 ? handSlots[selectedFinger] : null;
  const handWrapperStyle = activeSlot
    ? {
        transform: "scale(2.2)",
        transformOrigin: `${activeSlot.style.left} ${activeSlot.style.top}`,
      }
    : {
        transform: "scale(0.72)",
        transformOrigin: "center center",
      };

  return (
    <div id="builder-view" className="view-step active">
      <div className="builder-layout">
        <section
          className={`builder-preview-row ${isZoomed ? "zoomed" : ""} ${
            viewMode === "hand" ? "hand-mode" : ""
          }`}
          aria-label="Nail previews"
        >
          {/* Toggle zoom for grid view */}
          {viewMode === "grid" && (
            <button
              type="button"
              className="zoom-toggle-btn"
              onClick={() => setIsZoomed(!isZoomed)}
              title="Toggle zoom"
            >
              {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
            </button>
          )}

          {/* MODE 1: GRID VIEW (Always renders full 5 nail cards) */}
          {viewMode === "grid" && (
            <div className={`all-cards-grid ${isZoomed ? "zoomed" : ""}`}>
              {previewLabels.map((label, index) => {
                const isActive = selectedFinger === index;
                return (
                  <div
                    className={`nail-preview-card ${isActive ? "active" : ""}`}
                    data-index={index}
                    key={label}
                    onClick={(e) => {
                      if (
                        e.target.closest(".decoration-overlay") ||
                        e.target.closest(".decoration-item")
                      ) {
                        return;
                      }
                      handleSelectFinger(index);
                    }}
                  >
                    <span>{label}</span>
                    <div className="nail-canvas-wrapper">
                      <NailCanvas
                        fingerIndex={index}
                        task={handLandmarkerTask}
                      />
                      {handLandmarkerTask && (
                        <NailDecorationOverlay
                          fingerIndex={index}
                          task={handLandmarkerTask}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODE 2: HAND VIEW */}
          {viewMode === "hand" && (
            <div className="hand-view-main">
              {/* Calibrate toggle button */}
              <button
                type="button"
                className="calibrate-toggle-btn"
                onClick={() => setIsCalibrating(!isCalibrating)}
                title="Open live position calibrator"
              >
                <Sliders size={14} />
                <span>Calibrate Nails</span>
              </button>

              {/* Live Calibrator Panel */}
              {isCalibrating && (
                <HandSlotCalibrator
                  gender={handGender}
                  slots={activeGenderSlots}
                  onUpdateSlot={handleUpdateSlot}
                  onResetSlots={handleResetSlots}
                  onClose={() => setIsCalibrating(false)}
                />
              )}

              <div
                className={`hand-view-container ${
                  selectedFinger !== -1 ? "finger-focused" : ""
                }`}
              >
                <div className="hand-image-wrapper" style={handWrapperStyle}>
                  <img
                    src={currentHandImg}
                    alt={`${handGender} hand preview`}
                    className="hand-base-img"
                  />
                  {/* Position 5 nails overlay over hand model image */}
                  {handSlots.map((slot) => {
                    const isSelected = selectedFinger === slot.index;
                    return (
                      <div
                        key={slot.label}
                        className={`hand-nail-slot ${
                          isSelected ? "active" : ""
                        }`}
                        style={slot.style}
                        onClick={(e) => {
                          if (
                            e.target.closest(".decoration-overlay") ||
                            e.target.closest(".decoration-item")
                          ) {
                            return;
                          }
                          if (selectedFinger === slot.index) {
                            handleShowAllFingers();
                          } else {
                            handleSelectFinger(slot.index);
                          }
                        }}
                      >
                        <div className="nail-canvas-wrapper">
                          <NailCanvas
                            fingerIndex={slot.index}
                            task={handLandmarkerTask}
                          />
                          {handLandmarkerTask && (
                            <NailDecorationOverlay
                              fingerIndex={slot.index}
                              task={handLandmarkerTask}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick finger selector strip at bottom of Hand View */}
              <div className="finger-thumb-strip">
                <button
                  type="button"
                  className={`thumb-chip ${
                    selectedFinger === -1 ? "active" : ""
                  }`}
                  onClick={handleShowAllFingers}
                >
                  🖐️ All Hand
                </button>
                {previewLabels.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className={`thumb-chip ${
                      selectedFinger === index ? "active" : ""
                    }`}
                    onClick={() => handleSelectFinger(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <BuilderControls />

        <BuilderActions
          currentNailSetId={currentNailSetId}
          handLandmarkerTask={handLandmarkerTask}
          onReturnToForm={onReturnToForm}
          onSaveDraft={onSaveDraft}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          handGender={handGender}
          onHandGenderChange={setHandGender}
        />
      </div>
    </div>
  );
}
