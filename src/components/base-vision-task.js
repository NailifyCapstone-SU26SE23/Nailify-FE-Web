import { ViewToggle } from "./view-toggle";
import { BaseTask } from "./base-task";

export class BaseVisionTask extends BaseTask {
  runningMode = "IMAGE";

  lastVideoTimeSeconds = -1;
  lastTimestampMs = -1;

  async initialize() {
    if (this.options.template) {
      this.container.innerHTML = this.options.template;
    }

    this.video = document.getElementById("webcam");
    this.canvasElement = document.getElementById("output_canvas");
    if (this.canvasElement) {
      this.canvasCtx = this.canvasElement.getContext("2d");
    }
    this.enableWebcamButton = document.getElementById("webcamButton");

    this.initWorker();
    this.setupUI();
    this.setupViewToggle();
    this.setupImageUpload();

    // Child class hook
    this.onInitializeUI();
    this.setupDelegateSelect();

    await this.initializeTask();
  }

  handleWorkerMessage(event) {
    const { type } = event.data;

    switch (type) {
      case "DETECT_RESULT":
        const { mode, result, inferenceTime } = event.data;
        this.updateStatus(`Done in ${Math.round(inferenceTime)}ms`);
        this.updateInferenceTime(inferenceTime);

        if (mode === "IMAGE") {
          this.displayImageResult(result);
        } else if (mode === "VIDEO") {
          this.displayVideoResult(result);
          if (this.video.srcObject && !this.video.paused) {
            this.animationFrameId = window.requestAnimationFrame(
              this.predictWebcam.bind(this),
            );
          }
        }
        break;
      default:
        super.handleWorkerMessage(event);
        break;
    }
  }

  handleInitDone() {
    super.handleInitDone();

    if (this.video && this.video.srcObject && this.enableWebcamButton) {
      this.enableWebcamButton.innerText = "Disable Webcam";
      this.enableWebcamButton.disabled = false;
    } else if (
      this.enableWebcamButton &&
      this.enableWebcamButton.innerText !== "Starting..."
    ) {
      this.enableWebcamButton.innerText = "Enable Webcam";
      this.enableWebcamButton.disabled = false;
    }

    if (this.runningMode === "VIDEO") {
      if (this.video.srcObject) {
        this.enableCam();
      }
    } else if (this.runningMode === "IMAGE") {
      const testImage = document.getElementById("test-image");
      if (testImage && testImage.style.display !== "none" && testImage.src) {
        this.triggerImageDetection(testImage);
      }
    }
  }

  setupViewToggle() {
    const viewWebcam = document.getElementById("view-webcam");
    const viewImage = document.getElementById("view-image");

    if (!viewWebcam || !viewImage) return;

    const switchView = (mode) => {
      localStorage.setItem("mediapipe-running-mode", mode);
      const webcamControls = document.getElementById(
        "webcam-controls-container",
      );
      const classificationResults = document.getElementById(
        "classification-results",
      );

      // Clear out old results so they don't linger across mode switches
      if (classificationResults) {
        classificationResults.innerHTML = "";
      }

      if (mode === "VIDEO") {
        viewWebcam.classList.add("active");
        viewImage.classList.remove("active");
        if (webcamControls) webcamControls.style.display = "flex";
        this.runningMode = "VIDEO";
        this.worker?.postMessage({ type: "SET_OPTIONS", runningMode: "VIDEO" });

        const isWebcamActive =
          localStorage.getItem("mediapipe-webcam-active") === "true";
        if (isWebcamActive) {
          this.enableCam();
        }
      } else {
        viewWebcam.classList.remove("active");
        viewImage.classList.add("active");
        if (webcamControls) webcamControls.style.display = "none";
        this.runningMode = "IMAGE";
        this.worker?.postMessage({ type: "SET_OPTIONS", runningMode: "IMAGE" });
        this.stopCam(false);

        if (this.isWorkerReady) {
          const testImage = document.getElementById("test-image");
          if (testImage && testImage.src) this.triggerImageDetection(testImage);
        }
      }
    };

    const storedMode = localStorage.getItem("mediapipe-running-mode");
    const initialMode = storedMode || "IMAGE";

    const viewToggle = new ViewToggle(
      "view-mode-toggle",
      [
        { label: "Webcam", value: "video" },
        { label: "Image", value: "image" },
      ],
      initialMode.toLowerCase(),
      (value) => {
        switchView(value === "video" ? "VIDEO" : "IMAGE");
      },
    );

    viewToggle.setActive(initialMode.toLowerCase());

    switchView(initialMode);
    if (this.enableWebcamButton) {
      this.enableWebcamButton.addEventListener(
        "click",
        this.toggleCam.bind(this),
      );
    }
  }

  setupImageUpload() {
    const imageUpload = document.getElementById("image-upload");
    const imagePreviewContainer = document.getElementById(
      "image-preview-container",
    );
    const testImage = document.getElementById("test-image");
    const dropzone = document.querySelector(".upload-dropzone");
    const dropzoneContent = document.querySelector(".dropzone-content");

    if (testImage && testImage.src && dropzoneContent) {
      dropzoneContent.style.display = "none";
    }

    if (dropzone) {
      dropzone.addEventListener("click", (e) => {
        const previewContainer = dropzone.querySelector(".preview-container");
        if (previewContainer && previewContainer.contains(e.target)) {
          return;
        }
        imageUpload?.click();
      });
    }

    imageUpload?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (testImage) testImage.src = e.target?.result;
          if (imagePreviewContainer) imagePreviewContainer.style.display = "";
          const dc = document.querySelector(".dropzone-content");
          if (dc) dc.style.display = "none";

          if (testImage) this.triggerImageDetection(testImage);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  async initializeTask() {
    if (this.enableWebcamButton) {
      this.enableWebcamButton.disabled = true;
      if (!this.video || !this.video.srcObject) {
        this.enableWebcamButton.innerText = "Initializing...";
      }
    }
    await super.initializeTask();
  }

  getWorkerInitParamsInner() {
    return {
      runningMode: this.runningMode,
      ...this.getWorkerInitParams(),
    };
  }

  triggerImageDetection(image) {
    if (image.complete && image.naturalWidth > 0) {
      this.detectImage(image);
    } else {
      image.onload = () => {
        if (image.naturalWidth > 0) {
          this.detectImage(image);
        }
      };
    }
  }

  async detectImage(image) {
    if (!this.worker || !this.isWorkerReady) return;
    if (this.runningMode !== "IMAGE") this.runningMode = "IMAGE";

    const bitmap = await createImageBitmap(image);
    this.updateStatus(`Processing image...`);
    this.worker.postMessage(
      {
        type: "DETECT_IMAGE",
        bitmap: bitmap,
        timestampMs: performance.now(),
      },
      [bitmap],
    );
  }

  async enableCam() {
    if (!this.worker || !this.video) return;
    if (this.video.srcObject) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.predictWebcam();
      return;
    }

    if (this.enableWebcamButton) {
      this.enableWebcamButton.innerText = "Starting...";
      this.enableWebcamButton.disabled = true;
    }
    const constraints = { video: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = stream;
      const placeholder = document.getElementById("webcam-placeholder");
      if (placeholder) placeholder.style.display = "none";

      const playAndPredict = () => {
        if (!this.video) return;
        this.video.play().catch(console.error);
        this.predictWebcam();
      };

      if (this.video.readyState >= 2) {
        playAndPredict();
      } else {
        this.video.addEventListener("loadeddata", playAndPredict, {
          once: true,
        });
      }

      this.runningMode = "VIDEO";
      localStorage.setItem("mediapipe-webcam-active", "true");
      this.worker.postMessage({ type: "SET_OPTIONS", runningMode: "VIDEO" });
      this.updateStatus("Webcam running...");
      if (this.enableWebcamButton) {
        this.enableWebcamButton.innerText = "Disable Webcam";
        this.enableWebcamButton.disabled = false;
      }
    } catch (err) {
      console.error(err);
      this.updateStatus("Camera error!");
      if (this.enableWebcamButton) {
        this.enableWebcamButton.innerText = "Enable Webcam";
        this.enableWebcamButton.disabled = false;
      }
    }
  }

  toggleCam() {
    if (this.video && this.video.srcObject) {
      this.stopCam(true);
    } else {
      this.enableCam();
    }
  }

  stopCam(persistState = true) {
    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      this.video.srcObject = null;
      const placeholder = document.getElementById("webcam-placeholder");
      if (placeholder) placeholder.style.display = "flex";
      if (this.enableWebcamButton)
        this.enableWebcamButton.innerText = "Enable Webcam";
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

      if (this.canvasCtx && this.canvasElement) {
        this.canvasCtx.clearRect(
          0,
          0,
          this.canvasElement.width,
          this.canvasElement.height,
        );
      }

      if (persistState) {
        localStorage.setItem("mediapipe-webcam-active", "false");
      }
    }
  }

  async predictWebcam() {
    if (this.runningMode === "IMAGE") {
      this.runningMode = "VIDEO";
    }

    if (!this.isWorkerReady || !this.worker) {
      this.animationFrameId = window.requestAnimationFrame(
        this.predictWebcam.bind(this),
      );
      return;
    }

    if (this.video.currentTime !== this.lastVideoTimeSeconds) {
      this.lastVideoTimeSeconds = this.video.currentTime;

      try {
        let bitmap;
        if (navigator.webdriver) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = this.video.videoWidth || 640;
          tempCanvas.height = this.video.videoHeight || 480;
          const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
          ctx?.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
          bitmap = await window.createImageBitmap(tempCanvas);
        } else {
          bitmap = await window.createImageBitmap(this.video);
        }

        const now = performance.now();
        const timestampMs =
          now > this.lastTimestampMs ? now : this.lastTimestampMs + 1;
        this.lastTimestampMs = timestampMs;

        this.worker?.postMessage(
          {
            type: "DETECT_VIDEO",
            bitmap: bitmap,
            timestampMs: timestampMs,
          },
          [bitmap],
        );
      } catch (e) {
        console.error("Failed to create ImageBitmap from video", e);
        this.animationFrameId = window.requestAnimationFrame(
          this.predictWebcam.bind(this),
        );
      }
    } else {
      this.animationFrameId = window.requestAnimationFrame(
        this.predictWebcam.bind(this),
      );
    }
  }

  cleanup() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.stopCam(false);

    if (this.canvasCtx && this.canvasElement) {
      this.canvasCtx.clearRect(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height,
      );
    }

    super.cleanup();
  }
}
