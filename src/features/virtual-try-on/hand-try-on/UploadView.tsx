export function UploadView() {
  return (
    <div id="upload-view" className="view-step">
      <div className="view-header">
        <button className="back-to-builder-btn back-btn">
          <span className="material-icons">arrow_back</span> Back
        </button>
        <h2>Upload Hand Photo</h2>
      </div>
      <div className="upload-flow-content">
        <div className="upload-area" id="hand-upload-area">
          <input type="file" id="image-upload" accept="image/*" style={{ display: 'none' }} />
          <div className="upload-placeholder">
            <span className="material-icons large-icon">cloud_upload</span>
            <p>Drag & Drop or Click to Upload your Hand Photo</p>
          </div>
          <div className="hand-preview-container" style={{ display: 'none' }}>
            <img id="hand-preview-img" alt="" />
          </div>
        </div>
        <button
          id="btn-start-image-tryon"
          className="action-btn blue"
          style={{ display: 'none', marginTop: 24, width: 240 }}
        >
          START TRY-ON
        </button>
      </div>
    </div>
  );
}
