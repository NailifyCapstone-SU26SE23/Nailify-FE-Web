import { BuilderActions } from "./BuilderActions";
import { BuilderControls } from "./BuilderControls";
import { NailDecorationOverlay } from "./NailDecorationOverlay";
import { useState, useEffect } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

export function BuilderView({
  currentNailSetId,
  handLandmarkerTask,
  onReturnToForm,
  onSaveDraft,
}) {
  const previewLabels = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedFinger, setSelectedFinger] = useState(
    handLandmarkerTask?.getSelectedFingerIndex() ?? -1
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

  return (
    <div id="builder-view" className="view-step active">
      <div className="builder-layout">
        <section
          className={`builder-preview-row ${isZoomed ? "zoomed" : ""}`}
          aria-label="Nail previews"
        >
          <button
            type="button"
            className="zoom-toggle-btn"
            onClick={() => setIsZoomed(!isZoomed)}
            title="Toggle zoom"
          >
            {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          {previewLabels.map((label, index) => {
            const isActive = selectedFinger === index;
            return (
              <div
                className={`nail-preview-card ${isActive ? "active" : ""}`}
                data-index={index}
                key={label}
                onClick={() => {
                  if (handLandmarkerTask) {
                    handLandmarkerTask.setSelectedLayer(index, -1);
                    document.dispatchEvent(new CustomEvent("nail-decorations-changed"));
                  }
                }}
              >
                <span>{label}</span>
                <div className="nail-canvas-wrapper">
                  <canvas
                    id={`nail-preview-canvas-${index}`}
                    width="320"
                    height="420"
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
        </section>

        <BuilderControls />

        <BuilderActions
          currentNailSetId={currentNailSetId}
          handLandmarkerTask={handLandmarkerTask}
          onReturnToForm={onReturnToForm}
          onSaveDraft={onSaveDraft}
        />
      </div>
    </div>
  );
}
