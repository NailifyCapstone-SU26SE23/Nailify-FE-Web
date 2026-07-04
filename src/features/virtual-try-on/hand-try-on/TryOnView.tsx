export function TryOnView() {
  return (
    <div id="tryon-view" className="view-step">
      <div className="tryon-header">
        <button id="btn-back-to-step" className="back-btn">
          <span className="material-icons">arrow_back</span> Back
        </button>
        <h2 id="tryon-title">Live Try-On</h2>
        <div id="status-message" className="status-message">
          Ready
        </div>
      </div>

      <div className="tryon-content-full">
        <div id="view-webcam" className="view-content">
          <div className="cam-container-full">
            <video id="webcam" autoPlay playsInline muted />
            <canvas id="output_canvas" />
          </div>
        </div>

        <div id="view-image" className="view-content">
          <div className="image-result-container">
            <div className="result-scroll-wrapper">
              <img id="test-image" crossOrigin="anonymous" alt="" />
              <canvas id="image-canvas" />
            </div>
          </div>
        </div>
      </div>

      <div className="tryon-settings-compact">
        <div className="control-group">
          <span>Confidence</span>
          <input type="range" id="min-hand-detection-confidence" min="0" max="1" step="0.01" defaultValue="0.5" />
          <span id="min-hand-detection-confidence-value" className="value-badge">
            0.5
          </span>
        </div>
        <div id="inference-time" className="inference-time">
          Inference Time: - ms
        </div>
      </div>
    </div>
  );
}
