import { useLanguage } from "../../../shared/hooks/useLanguage";

export function UploadView() {
  const { t } = useLanguage();

  return (
    <div id="upload-view" className="view-step">
      <div className="view-header">
        <button className="back-to-builder-btn back-btn">
          <span className="material-icons">arrow_back</span> {t("handTryOn.uploadView.back")}
        </button>
        <h2>{t("handTryOn.uploadView.title")}</h2>
      </div>
      <div className="upload-flow-content">
        <div className="upload-area" id="hand-upload-area">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            style={{ display: "none" }}
          />
          <div className="upload-placeholder">
            <span className="material-icons large-icon">cloud_upload</span>
            <p>{t("handTryOn.uploadView.placeholder")}</p>
          </div>
          <div className="hand-preview-container" style={{ display: "none" }}>
            <img crossOrigin="anonymous" id="hand-preview-img" alt="" />
          </div>
        </div>
        <button
          id="btn-start-image-tryon"
          className="action-btn blue upload-tryon-btn"
          style={{ display: "none" }}
        >
          {t("handTryOn.uploadView.startTryOn")}
        </button>
      </div>
    </div>
  );
}
