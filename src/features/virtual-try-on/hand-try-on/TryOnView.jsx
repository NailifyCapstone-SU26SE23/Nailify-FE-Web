import { useEffect } from "react";

export function TryOnView({ handLandmarkerTask, onReturnToForm }) {
  useEffect(() => {
    let zoomFactor = 1.0;

    const zoomInBtn = document.getElementById("hud-btn-zoom-in");
    const zoomOutBtn = document.getElementById("hud-btn-zoom-out");
    const resetBtn = document.getElementById("hud-btn-reset");
    const downloadBtn = document.getElementById("hud-btn-download");
    const shutterBtn = document.getElementById("hud-shutter");
    const toggleModeBtn = document.getElementById("hud-btn-toggle-mode");

    const updateZoom = (factor) => {
      zoomFactor = Math.max(1.0, Math.min(3.0, factor));
      const containers = document.querySelectorAll(
        ".cam-container-full, .image-result-container",
      );
      containers.forEach((el) => {
        el.style.setProperty("--zoom-factor", zoomFactor.toString());
      });
    };

    const handleZoomIn = () => updateZoom(zoomFactor + 0.15);
    const handleZoomOut = () => updateZoom(zoomFactor - 0.15);
    const handleReset = () => {
      updateZoom(1.0);
      if (handLandmarkerTask) {
        const config = handLandmarkerTask.getSerializedConfig();
        handLandmarkerTask.loadFromConfig(config);
      }
    };

    const handleCapture = () => {
      const isVideo = document
        .getElementById("view-webcam")
        ?.classList.contains("active");
      if (isVideo) {
        const video = document.getElementById("webcam");
        const canvas = document.getElementById("output_canvas");
        if (video && canvas) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = video.videoWidth || canvas.width;
          tempCanvas.height = video.videoHeight || canvas.height;
          const ctx = tempCanvas.getContext("2d");

          ctx.save();
          // Draw video with horizontal mirroring
          ctx.translate(tempCanvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.restore();

          // Draw canvas decorations
          ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

          const link = document.createElement("a");
          link.download = `nailify-live-${Date.now()}.png`;
          link.href = tempCanvas.toDataURL("image/png");
          link.click();
        }
      } else {
        const img = document.getElementById("test-image");
        const canvas = document.getElementById("image-canvas");
        if (img && canvas) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = img.naturalWidth || canvas.width;
          tempCanvas.height = img.naturalHeight || canvas.height;
          const ctx = tempCanvas.getContext("2d");

          ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

          const link = document.createElement("a");
          link.download = `nailify-image-${Date.now()}.png`;
          link.href = tempCanvas.toDataURL("image/png");
          link.click();
        }
      }
    };

    const handleToggleMode = () => {
      if (handLandmarkerTask) {
        const isVideo = document
          .getElementById("view-webcam")
          ?.classList.contains("active");
        if (isVideo) {
          handLandmarkerTask.switchStep("upload");
        } else {
          handLandmarkerTask.switchMode("VIDEO");
          handLandmarkerTask.switchStep("tryon");
        }
      }
    };

    zoomInBtn?.addEventListener("click", handleZoomIn);
    zoomOutBtn?.addEventListener("click", handleZoomOut);
    resetBtn?.addEventListener("click", handleReset);
    downloadBtn?.addEventListener("click", handleCapture);
    shutterBtn?.addEventListener("click", handleCapture);
    toggleModeBtn?.addEventListener("click", handleToggleMode);

    return () => {
      zoomInBtn?.removeEventListener("click", handleZoomIn);
      zoomOutBtn?.removeEventListener("click", handleZoomOut);
      resetBtn?.removeEventListener("click", handleReset);
      downloadBtn?.removeEventListener("click", handleCapture);
      shutterBtn?.removeEventListener("click", handleCapture);
      toggleModeBtn?.removeEventListener("click", handleToggleMode);
    };
  }, [handLandmarkerTask]);

  return (
    <div id="tryon-view" className="view-step">
      <div className="tryon-viewport-wrapper">
        {/* Top Floating Controls */}
        <button
          id="btn-back-to-step"
          className="hud-circle-btn hud-back-btn"
          aria-label="Go back"
        >
          <span className="material-icons">arrow_back</span>
        </button>

        <div className="hud-top-status status-none" id="hud-status-container">
          <span className="status-dot"></span>
          <span id="status-message">Ready</span>
        </div>

        <button
          className="hud-circle-btn hud-close-btn"
          onClick={onReturnToForm}
          aria-label="Close studio"
        >
          <span className="material-icons">close</span>
        </button>

        {/* Left Vertical Slider Column */}
        <div className="hud-vertical-slider-container">
          <span className="hud-slider-label">Confidence</span>
          <div className="hud-slider-wrapper-vertical">
            <input
              type="range"
              id="min-hand-detection-confidence"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0.5"
            />
          </div>
          <span
            id="min-hand-detection-confidence-value"
            className="hud-slider-val"
          >
            0.5
          </span>
        </div>

        {/* Core Screen Viewport */}
        <div className="tryon-content-full">
          {/* Cyber Scanning Guide Overlays */}
          <div className="scanner-target-overlay">
            <div className="scanner-corner top-left"></div>
            <div className="scanner-corner top-right"></div>
            <div className="scanner-corner bottom-left"></div>
            <div className="scanner-corner bottom-right"></div>
            <div className="scanner-grid-line"></div>

            {/* Hand Guideline Silhouette */}
            <div className="hud-hand-guide-container">
              <svg
                className="hud-hand-guide-svg"
                viewBox="0 0 100 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M50 115 C45 110, 42 100, 42 90 C42 85, 38 80, 36 75 C34 70, 31 60, 31 52 C31 46, 33 42, 35 42 C37 42, 38 45, 38 48 C38 40, 40 35, 43 35 C46 35, 47 38, 47 43 C47 34, 49 28, 52 28 C55 28, 56 31, 56 38 C56 34, 58 30, 61 30 C64 30, 65 33, 65 41 C65 42, 65 45, 65 48 C65 43, 68 39, 71 39 C74 39, 75 42, 75 49 C75 56, 73 66, 73 72 C73 78, 68 85, 68 90 C68 100, 65 110, 60 115"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hand sparkles */}
                <path
                  d="M25 45 L27 48 L30 45 L27 42 Z"
                  fill="white"
                  opacity="0.8"
                />
                <path
                  d="M75 60 L77 63 L80 60 L77 57 Z"
                  fill="white"
                  opacity="0.8"
                />
              </svg>
              <div className="hud-center-tip" id="tryon-title">
                Show your nails
              </div>
            </div>
          </div>

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

        {/* Right Action Floating Column */}
        <div className="hud-right-actions">
          <button
            id="hud-btn-reset"
            className="hud-action-circle"
            title="Reset scale"
          >
            <span className="material-icons">replay</span>
          </button>
          <button
            id="hud-btn-zoom-in"
            className="hud-action-circle"
            title="Zoom In"
          >
            <span className="material-icons">add</span>
          </button>
          <button
            id="hud-btn-zoom-out"
            className="hud-action-circle"
            title="Zoom Out"
          >
            <span className="material-icons">remove</span>
          </button>
          <button
            id="hud-btn-toggle-mode"
            className="hud-action-circle"
            title="Toggle camera/image"
          >
            <span className="material-icons">photo_camera</span>
          </button>
          <button
            id="hud-btn-download"
            className="hud-action-circle"
            title="Download Screenshot"
          >
            <span className="material-icons">download</span>
          </button>
        </div>

        {/* Bottom Shutter & Footer info */}
        <div className="hud-bottom-container">
          <button
            id="hud-shutter"
            className="hud-shutter-btn"
            aria-label="Capture snapshot"
          >
            <span className="shutter-inner"></span>
          </button>

          <div className="hud-footer">
            <span id="inference-time">Inference Time: - ms</span>
            <span className="hud-divider">|</span>
            <span>
              Powered by <span className="text-accent font-bold">Nailify</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
