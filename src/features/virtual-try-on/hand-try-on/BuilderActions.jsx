import { useState } from "react";
import { Grid, Hand, Sparkles } from "lucide-react";
import { useLanguage } from "../../../shared/hooks/useLanguage";

export function BuilderActions({
  handLandmarkerTask,
  onReturnToForm,
  onSaveDraft,
  viewMode = "grid",
  onViewModeChange,
  handGender = "woman",
  onHandGenderChange,
}) {
  const [appliedStatus, setAppliedStatus] = useState(false);
  const { t } = useLanguage();

  const handleSave = () => {
    if (!handLandmarkerTask) return;

    onSaveDraft?.();
  };

  const handleAddForAll = () => {
    if (!handLandmarkerTask) return;
    handLandmarkerTask.copyCurrentFingerToAll();
    setAppliedStatus(true);
    setTimeout(() => setAppliedStatus(false), 2500);
  };

  return (
    <div className="builder-actions">
      <section className="builder-panel builder-layer-panel">
        {/* Display Mode & Hand View Controls */}
        <div className="view-mode-section">
          <div className="section-title">{t("handTryOn.builderActions.displayMode")}</div>
          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => onViewModeChange?.("grid")}
            >
              <Grid size={15} />
              <span>{t("handTryOn.builderActions.gridView")}</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "hand" ? "active" : ""}`}
              onClick={() => onViewModeChange?.("hand")}
            >
              <Hand size={15} />
              <span>{t("handTryOn.builderActions.handView")}</span>
            </button>
          </div>

          {/* Gender Hand Switch (shown when Hand View is active) */}
          {viewMode === "hand" && (
            <div className="hand-gender-toggle-group">
              <span className="gender-label">{t("handTryOn.builderActions.handModel")}</span>
              <div className="gender-btn-group">
                <button
                  type="button"
                  className={`gender-btn ${handGender === "woman" ? "active" : ""}`}
                  onClick={() => onHandGenderChange?.("woman")}
                >
                  👩 {t("handTryOn.builderActions.female")}
                </button>
                <button
                  type="button"
                  className={`gender-btn ${handGender === "man" ? "active" : ""}`}
                  onClick={() => onHandGenderChange?.("man")}
                >
                  👨 {t("handTryOn.builderActions.male")}
                </button>
              </div>
            </div>
          )}

          {/* Add For All Button */}
          <button
            type="button"
            className="add-for-all-btn"
            onClick={handleAddForAll}
            title={t("handTryOn.builderActions.applyToAllTitle")}
          >
            <Sparkles size={16} />
            <span>
              {appliedStatus
                ? t("handTryOn.builderActions.appliedToAll")
                : t("handTryOn.builderActions.addForAll")}
            </span>
          </button>
        </div>

        <div className="section-title" style={{ marginTop: "14px" }}>
          {t("handTryOn.builderActions.layers")}
        </div>
        <div id="layers-list" className="layers-list">
          <div className="empty-layers">{t("handTryOn.builderActions.noDecorations")}</div>
        </div>

        <div className="decoration-instructions">
          <p>{t("handTryOn.builderActions.instructions")}</p>
        </div>
      </section>

      <section className="builder-bottom-actions">
        <button
          className="action-btn green"
          disabled={!handLandmarkerTask}
          onClick={handleSave}
          type="button"
        >
          <span className="material-icons">save</span>
          {t("handTryOn.builderActions.save")}
        </button>
        <button id="btn-image-flow" className="action-btn blue" type="button">
          <span className="material-icons">image</span>
          {t("handTryOn.builderActions.photoTryOn")}
        </button>
        <button id="btn-ar-live" className="action-btn pink" type="button">
          <span className="material-icons">videocam</span>
          {t("handTryOn.builderActions.liveTryOn")}
        </button>
        <button
          className="action-btn neutral"
          disabled={!handLandmarkerTask}
          onClick={onReturnToForm}
          type="button"
        >
          <span className="material-icons">arrow_back</span>
          {t("handTryOn.builderActions.back")}
        </button>
      </section>
    </div>
  );
}
