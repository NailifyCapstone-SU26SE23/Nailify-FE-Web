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
  const { language } = useLanguage();
  const isVi = language === "vi";

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
          <div className="section-title">{isVi ? "Chế độ hiển thị" : "Display Mode"}</div>
          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => onViewModeChange?.("grid")}
            >
              <Grid size={15} />
              <span>{isVi ? "Dạng lưới" : "Grid View"}</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "hand" ? "active" : ""}`}
              onClick={() => onViewModeChange?.("hand")}
            >
              <Hand size={15} />
              <span>{isVi ? "Mô phỏng bàn tay" : "Hand View"}</span>
            </button>
          </div>

          {/* Gender Hand Switch (shown when Hand View is active) */}
          {viewMode === "hand" && (
            <div className="hand-gender-toggle-group">
              <span className="gender-label">{isVi ? "Mẫu tay:" : "Hand Model:"}</span>
              <div className="gender-btn-group">
                <button
                  type="button"
                  className={`gender-btn ${handGender === "woman" ? "active" : ""}`}
                  onClick={() => onHandGenderChange?.("woman")}
                >
                  👩 {isVi ? "Nữ" : "Female"}
                </button>
                <button
                  type="button"
                  className={`gender-btn ${handGender === "man" ? "active" : ""}`}
                  onClick={() => onHandGenderChange?.("man")}
                >
                  👨 {isVi ? "Nam" : "Male"}
                </button>
              </div>
            </div>
          )}

          {/* Add For All Button */}
          <button
            type="button"
            className="add-for-all-btn"
            onClick={handleAddForAll}
            title="Apply current nail design to all 5 nails"
          >
            <Sparkles size={16} />
            <span>
              {appliedStatus ? "Applied to All Nails!" : "Add for All Nails"}
            </span>
          </button>
        </div>

        <div className="section-title" style={{ marginTop: "14px" }}>
          {isVi ? "Lớp trang trí" : "Layers"}
        </div>
        <div id="layers-list" className="layers-list">
          <div className="empty-layers">{isVi ? "Chưa có lớp trang trí" : "No decorations added"}</div>
        </div>

        <div className="decoration-instructions">
          <p>
            💡 <strong>{isVi ? "Kéo" : "Drag"}</strong> {isVi ? "để di chuyển" : "to move"} · <strong>{isVi ? "Kéo góc" : "Drag corner"}</strong> {isVi ? "để thay đổi kích thước" : "to resize"}
          </p>
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
          {isVi ? "Lưu" : "Save"}
        </button>
        <button id="btn-image-flow" className="action-btn blue" type="button">
          <span className="material-icons">image</span>
          {isVi ? "Thử trên ảnh" : "Photo Try On"}
        </button>
        <button id="btn-ar-live" className="action-btn pink" type="button">
          <span className="material-icons">videocam</span>
          {isVi ? "Thử trực tiếp" : "Live Try On"}
        </button>
        <button
          className="action-btn neutral"
          disabled={!handLandmarkerTask}
          onClick={onReturnToForm}
          type="button"
        >
          <span className="material-icons">arrow_back</span>
          {isVi ? "Quay lại" : "Back"}
        </button>
      </section>
    </div>
  );
}
