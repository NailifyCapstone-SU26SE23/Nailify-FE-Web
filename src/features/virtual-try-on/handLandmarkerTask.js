import { BaseVisionTask } from "@/components/base-vision-task";
import {
  getComponent,
  getNailVariant,
  getPlacedNailComponents,
} from "@/services/nailDesign.service";
import chroma from "chroma-js";
import { computeFingerGeometry } from "./utils/handGeometry";
import { EMAFilter, EMAFilterPoint, EMAFilterAngle } from "./utils/filters";
import { checkHandDistance, checkImageBlur } from "./utils/diagnostics";

class HandLandmarkerTask extends BaseVisionTask {
  defaultShapeId = 1;
  defaultShapeImageKey = "shape-1";

  uiAbortController = new AbortController();

  cleanup() {
    super.cleanup();
    this.uiAbortController.abort();
  }

  numHands = 2;
  minHandDetectionConfidence = 0.5;
  minHandPresenceConfidence = 0.5;
  minTrackingConfidence = 0.5;
  filtersInitialized = false;
  fingerFilters = [];
  latestFingerGeometries = [];

  initFilters() {
    if (this.filtersInitialized) return;
    this.fingerFilters = Array.from({ length: 5 }, () => ({
      center: new EMAFilterPoint(0.25),
      rotation: new EMAFilterAngle(0.25),
      width: new EMAFilter(0.25),
      height: new EMAFilter(0.25),
    }));
    this.filtersInitialized = true;
  }

  resetFilters() {
    if (!this.filtersInitialized) return;
    this.fingerFilters.forEach((f) => {
      f.center.reset();
      f.rotation.reset();
      f.width.reset();
      f.height.reset();
    });
  }

  getLatestFingerGeometries() {
    return this.latestFingerGeometries;
  }

  // ─── Public API for React (framer-motion overlay) ─────────────
  getDecorations(fingerIndex) {
    return this.currentNailSet.nails[fingerIndex]?.decorations ?? [];
  }

  updateDecoration(fingerIndex, decIndex, updates) {
    const dec = this.currentNailSet.nails[fingerIndex]?.decorations[decIndex];
    if (!dec) return;
    if (updates.x !== undefined) dec.x = updates.x;
    if (updates.y !== undefined) dec.y = updates.y;
    if (updates.scale !== undefined)
      dec.scale = Math.max(0.05, Math.min(3, updates.scale));
    if (updates.rotation !== undefined) dec.rotation = updates.rotation;
    this.triggerRedetection();
  }

  getSelectedFingerIndex() {
    return this.selectedFingerIndex;
  }
  getSelectedLayerIndex() {
    return this.selectedLayerIndex;
  }
  getEditMode() {
    return this.editMode;
  }

  setSelectedLayer(fingerIndex, layerIndex) {
    this.selectedFingerIndex = fingerIndex;
    this.editMode = "individual";
    this.selectedLayerIndex = layerIndex;
    this.renderLayersList();
    this.syncPreviewSelection();
    this.dispatchDecorationsChanged();
    this.triggerRedetection();
  }

  deselectLayer(fingerIndex) {
    if (this.selectedFingerIndex === fingerIndex) {
      this.selectedLayerIndex = -1;
      this.renderLayersList();
      this.triggerRedetection();
      this.dispatchDecorationsChanged();
    }
  }

  getCanvasLayout(fingerIndex) {
    const canvas = document.getElementById(
      `nail-preview-canvas-${fingerIndex}`,
    );
    if (!canvas) return null;
    const { shape, shapeImageKey, length } = this.currentNailSet;
    const baseShapeImg = this.nailImages[shapeImageKey] || this.nailImages[shape];
    const shapeImageUrl = baseShapeImg ? baseShapeImg.src : null;

    const fingerLength = Math.min(canvas.width * 0.36, canvas.height * 0.32);
    const nailWidth = fingerLength * 2.0;
    const nailHeight = fingerLength * 1.2 * length;
    const nailBottom = fingerLength * 0.75;
    const totalHeight = nailHeight * 1.5;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + canvas.height * 0.16;
    return {
      destX: centerX - nailWidth / 2,
      destY: centerY + nailBottom - totalHeight,
      destW: nailWidth,
      destH: totalHeight,
      canvasW: canvas.width,
      canvasH: canvas.height,
      shapeImageUrl,
    };
  }

  copyCurrentFingerToAll() {
    const sourceIndex =
      this.selectedFingerIndex >= 0 ? this.selectedFingerIndex : 0;
    const sourceFinger = this.currentNailSet.nails[sourceIndex];
    if (!sourceFinger) return;

    const sourceColor = sourceFinger.color;
    const sourceGradient = sourceFinger.gradient
      ? JSON.parse(JSON.stringify(sourceFinger.gradient))
      : null;
    const sourceCustomShape = sourceFinger.customShape;

    this.currentNailSet.nails.forEach((nail) => {
      nail.color = sourceColor;
      nail.gradient = sourceGradient
        ? JSON.parse(JSON.stringify(sourceGradient))
        : null;
      nail.customShape = sourceCustomShape;
      nail.decorations = (sourceFinger.decorations || []).map((dec) => ({
        ...dec,
        id: Math.random().toString(36).substring(2, 9),
      }));
    });

    this.renderLayersList();
    this.triggerRedetection();
    this.dispatchDecorationsChanged();
  }

  dispatchDecorationsChanged() {
    document.dispatchEvent(new CustomEvent("nail-decorations-changed"));
  }
  // ─── End Public API ────────────────────────────────────────────

  nailImages = {};
  currentNailSet = {
    shape: "ballerina",
    shapeImageKey: "shape-1",
    length: 1.0,
    material: "Glossy",
    gradient: {
      enabled: false,
      type: "linear",
      stops: ["#FF4081", "#FFFFFF", "#000000"],
      stopCount: 2,
    },
    nails: [
      {
        color: "#FF4081",
        decorations: [],
        customShape: null,
        gradient: null,
      },
      {
        color: "#FF4081",
        decorations: [],
        customShape: null,
        gradient: null,
      },
      {
        color: "#FF4081",
        decorations: [],
        customShape: null,
        gradient: null,
      },
      {
        color: "#FF4081",
        decorations: [],
        customShape: null,
        gradient: null,
      },
      {
        color: "#FF4081",
        decorations: [],
        customShape: null,
        gradient: null,
      },
    ],
  };
  editMode = "all";
  selectedFingerIndex = 0;
  selectedLayerIndex = -1; // Index of decoration in the selected finger's array
  pendingCustomShapeFiles = new Map();
  pendingDecorationFiles = new Map();

  async saveToDatabase(_nailSetId) {
    return Promise.resolve();
  }

  getSerializedConfig() {
    return this.serializeCurrentNailSet();
  }

  getPendingImageFiles() {
    return {
      customShapeFiles: Array.from(
        this.pendingCustomShapeFiles,
        ([fingerIndex, file]) => ({ fingerIndex, file }),
      ),
      decorationFiles: Array.from(
        this.pendingDecorationFiles,
        ([decorationId, file]) => ({ decorationId, file }),
      ),
    };
  }

  async loadFromConfig(config) {
    const normalizedConfig = this.normalizeSerializedNailSet(config);
    if (!normalizedConfig) return;

    this.currentNailSet = await this.deserializeNailSet(normalizedConfig);
    this.selectedLayerIndex = -1;
    this.syncBuilderControls();
    this.renderLayersList();
    this.triggerRedetection();
    this.dispatchDecorationsChanged();
  }

  async loadFromDatabase(nailSetId) {
    await this.loadFromNailVariant(String(nailSetId));
  }

  startLiveTryOn() {
    this.switchStep("tryon");
    this.switchMode("VIDEO");
  }

  startImageTryOn() {
    this.switchStep("upload");
    this.resetImageUpload();
  }

  onInitializeUI() {
    this.setupCanvasInteractions();
    // Confidence Sliders
    const setupSlider = (id, onChange) => {
      const input = document.getElementById(id);
      const valueDisplay = document.getElementById(`${id}-value`);
      if (input && valueDisplay) {
        input.addEventListener("input", () => {
          const val = parseFloat(input.value);
          valueDisplay.innerText = val.toString();
          onChange(val);
        });
      }
    };

    setupSlider("min-hand-detection-confidence", (val) => {
      this.minHandDetectionConfidence = val;
      this.worker?.postMessage({
        type: "SET_OPTIONS",
        minHandDetectionConfidence: this.minHandDetectionConfidence,
      });
      this.triggerRedetection();
    });

    setupSlider("min-hand-presence-confidence", (val) => {
      this.minHandPresenceConfidence = val;
      this.worker?.postMessage({
        type: "SET_OPTIONS",
        minHandPresenceConfidence: this.minHandPresenceConfidence,
      });
      this.triggerRedetection();
    });

    setupSlider("min-tracking-confidence", (val) => {
      this.minTrackingConfidence = val;
      this.worker?.postMessage({
        type: "SET_OPTIONS",
        minTrackingConfidence: this.minTrackingConfidence,
      });
      this.triggerRedetection();
    });

    setupSlider("num-hands", (val) => {
      this.numHands = val;
      this.worker?.postMessage({
        type: "SET_OPTIONS",
        numHands: this.numHands,
      });
      this.triggerRedetection();
    });

    // Builder View Switching
    const btnArLive = document.getElementById("btn-ar-live");
    const btnImageFlow = document.getElementById("btn-image-flow");
    const btnBackToBuilder = document.querySelectorAll(".back-to-builder-btn");
    const btnBackToStep = document.getElementById("btn-back-to-step");

    const uploadArea = document.getElementById("hand-upload-area");
    const imageUpload = document.getElementById("image-upload");
    const btnStartTryon = document.getElementById("btn-start-image-tryon");

    btnArLive.addEventListener("click", () => {
      this.switchStep("tryon");
      this.switchMode("VIDEO");
    });

    btnImageFlow.addEventListener("click", () => {
      this.switchStep("upload");
    });

    btnBackToBuilder.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.returnToPreviousPageWhenLaunchedFromDetail()) return;
        this.switchStep("builder");
      });
    });

    btnBackToStep.addEventListener("click", () => {
      if (this.returnToPreviousPageWhenLaunchedFromDetail()) return;

      if (this.runningMode === "VIDEO") {
        this.switchStep("builder");
      } else {
        this.switchStep("upload");
      }
    });

    // Step 2: Upload Flow
    imageUpload.addEventListener("click", (event) => event.stopPropagation());
    uploadArea.addEventListener("click", (event) => {
      if (event.target === imageUpload) return;
      imageUpload.click();
    });
    const loadHandPhoto = (file) => {
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result;
          const previewImg = document.getElementById("hand-preview-img");
          previewImg.src = src;
          document
            .querySelector(".upload-placeholder")
            ?.setAttribute("style", "display: none");
          document
            .querySelector(".hand-preview-container")
            ?.setAttribute("style", "display: flex");
          btnStartTryon.style.display = "block";

          // Set result image as well
          const testImage = document.getElementById("test-image");
          testImage.src = src;
          testImage.onload = () => {
            if (this.runningMode === "IMAGE") {
              this.detectImage(testImage);
            }
          };
        };
        reader.readAsDataURL(file);
      }
    };

    imageUpload.addEventListener("change", (e) => {
      loadHandPhoto(e.target.files?.[0]);
    });

    uploadArea.addEventListener("dragover", (event) => {
      event.preventDefault();
      uploadArea.classList.add("drag-active");
    });

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("drag-active");
    });

    uploadArea.addEventListener("drop", (event) => {
      event.preventDefault();
      uploadArea.classList.remove("drag-active");
      loadHandPhoto(event.dataTransfer?.files?.[0]);
    });

    btnStartTryon.addEventListener("click", () => {
      this.switchStep("tryon");
      this.switchMode("IMAGE");
    });

    // Nail Shape Listener
    document.querySelector(".shape-selector")?.addEventListener(
      "click",
      (event) => {
        const button = event.target.closest(".shape-btn");
        if (!button) return;

        document
          .querySelectorAll(".shape-btn")
          .forEach((shapeButton) => shapeButton.classList.remove("active"));
        button.classList.add("active");
        this.currentNailSet.shape = button.dataset.shape;
        const shapeImageUrl = button.dataset.shapeImageUrl;
        const shapeKey = button.dataset.shapeKey || this.currentNailSet.shape;
        this.currentNailSet.shapeImageKey = shapeKey;
        if (shapeImageUrl && !this.nailImages[shapeKey]) {
          void this.loadImage(shapeImageUrl)
            .then((image) => {
              this.nailImages[shapeKey] = image;
              this.triggerRedetection();
            })
            .catch((error) => {
              console.error(`Failed to load shape: ${shapeKey}`, error);
            });
        }
        this.triggerRedetection();
      },
      { signal: this.uiAbortController.signal },
    );

    const activeShapeButton =
      document.querySelector(
        `.shape-btn[data-shape-key="${this.defaultShapeImageKey}"]`,
      ) || document.querySelector(".shape-btn.active");
    if (activeShapeButton) {
      document
        .querySelectorAll(".shape-btn")
        .forEach((shapeButton) => shapeButton.classList.remove("active"));
      activeShapeButton.classList.add("active");
      this.currentNailSet.shape = activeShapeButton.dataset.shape;
      this.currentNailSet.shapeImageKey =
        activeShapeButton.dataset.shapeKey || this.currentNailSet.shape;
      const shapeImageUrl = activeShapeButton.dataset.shapeImageUrl;
      const shapeKey = this.currentNailSet.shapeImageKey;
      if (shapeImageUrl && !this.nailImages[shapeKey]) {
        void this.loadImage(shapeImageUrl)
          .then((image) => {
            this.nailImages[shapeKey] = image;
            this.triggerRedetection();
          })
          .catch((error) => {
            console.error(`Failed to load shape: ${shapeKey}`, error);
          });
      }
    }

    this.syncPreviewSelection();

    // Finger Selection Listeners
    const previewButtons = document.querySelectorAll(".nail-preview-card");
    previewButtons.forEach((btn) => {
      btn.addEventListener(
        "click",
        (e) => {
          if (
            e.target.closest(".decoration-item") ||
            e.target.closest(".decoration-overlay")
          ) {
            return;
          }
          const nextFingerIndex = parseInt(btn.dataset.index ?? "0", 10);
          if (
            this.editMode === "individual" &&
            this.selectedFingerIndex === nextFingerIndex
          ) {
            this.editMode = "all";
          } else {
            this.editMode = "individual";
            this.selectedFingerIndex = nextFingerIndex;
          }
          this.selectedLayerIndex = -1;
          this.syncPreviewSelection();
          this.triggerRedetection();
          this.renderLayersList();
          this.dispatchDecorationsChanged();
        },
        { signal: this.uiAbortController.signal },
      );
    });

    // Transform Listeners
    const setupTransform = (id, property, delta) => {
      document.getElementById(id)?.addEventListener("click", () => {
        if (this.selectedLayerIndex === -1) return;

        const targetFinger =
          this.currentNailSet.nails[this.selectedFingerIndex];
        const targetDec = targetFinger.decorations[this.selectedLayerIndex];
        const decId = targetDec.id;

        // Always apply transform individually
        targetDec[property] += delta;

        this.triggerRedetection();
      });
    };

    setupTransform("ctrl-up", "y", -0.05);
    setupTransform("ctrl-down", "y", 0.05);
    setupTransform("ctrl-left", "x", -0.05);
    setupTransform("ctrl-right", "x", 0.05);
    setupTransform("ctrl-zoom-in", "scale", 0.05);
    setupTransform("ctrl-zoom-out", "scale", -0.05);

    // Color Swatch Listeners
    const swatches = document.querySelectorAll(".color-swatch");
    const customColorPicker = document.getElementById("custom-color");

    swatches.forEach((swatch) => {
      swatch.addEventListener("click", () => {
        swatches.forEach((s) => s.classList.remove("active"));
        swatch.classList.add("active");
        const color = swatch.dataset.color;
        // Apply chosen color
        if (this.editMode === "all") {
          this.currentNailSet.nails.forEach((n) => (n.color = color));
        } else {
          this.currentNailSet.nails[this.selectedFingerIndex].color = color;
        }
        customColorPicker.value = color;
        this.triggerRedetection();
      });
    });

    customColorPicker.addEventListener("input", () => {
      swatches.forEach((s) => s.classList.remove("active"));
      // Apply custom picker color
      if (this.editMode === "all") {
        this.currentNailSet.nails.forEach(
          (n) => (n.color = customColorPicker.value),
        );
      } else {
        this.currentNailSet.nails[this.selectedFingerIndex].color =
          customColorPicker.value;
      }
      this.triggerRedetection();
    });

    // Gradient Listeners
    const enableGradient = document.getElementById("enable-gradient");
    const gradientControls = document.getElementById("gradient-controls");
    const gradColor1 = document.getElementById("gradient-color-1");
    const gradColor2 = document.getElementById("gradient-color-2");
    const gradColor3 = document.getElementById("gradient-color-3");
    const gradType = document.getElementById("gradient-type");
    const stopCountRadios = document.querySelectorAll(
      'input[name="stop-count"]',
    );

    enableGradient.addEventListener("change", () => {
      this.currentNailSet.gradient.enabled = enableGradient.checked;
      gradientControls.style.display = enableGradient.checked ? "flex" : "none";
      if (this.editMode === "all") {
        this.currentNailSet.nails.forEach(
          (n) =>
            (n.gradient = enableGradient.checked
              ? { ...this.currentNailSet.gradient }
              : null),
        );
      } else {
        this.currentNailSet.nails[this.selectedFingerIndex].gradient =
          enableGradient.checked ? { ...this.currentNailSet.gradient } : null;
      }
      this.triggerRedetection();
    });

    const updateGradientState = () => {
      const grad = this.currentNailSet.gradient;
      grad.stops = [gradColor1.value, gradColor2.value, gradColor3.value];
      grad.type = gradType.value;
      grad.stopCount = parseInt(
        document.querySelector('input[name="stop-count"]:checked').value,
      );

      gradColor3.style.display = grad.stopCount === 3 ? "block" : "none";

      if (this.editMode === "all") {
        this.currentNailSet.nails.forEach((n) => {
          if (n.gradient || grad.enabled) n.gradient = { ...grad };
        });
      } else {
        const n = this.currentNailSet.nails[this.selectedFingerIndex];
        if (n.gradient || grad.enabled) n.gradient = { ...grad };
      }
      this.triggerRedetection();
    };

    gradColor1.addEventListener("input", updateGradientState);
    gradColor2.addEventListener("input", updateGradientState);
    gradColor3.addEventListener("input", updateGradientState);
    gradType.addEventListener("change", updateGradientState);
    stopCountRadios.forEach((r) =>
      r.addEventListener("change", updateGradientState),
    );

    document.addEventListener(
      "click",
      (event) => {
        const target = event.target.closest(".component-decoration-btn");
        if (!target) return;

        const imageUrl = target.dataset.imageUrl;
        const componentId = target.dataset.componentId;
        const componentType = target.dataset.componentType;
        if (!imageUrl || !componentType) return;

        void this.addDecorationFromUrl(
          imageUrl,
          componentType,
          componentId ?? null,
        );
      },
      { signal: this.uiAbortController.signal },
    );

    // Nail Surface Listener
    document.querySelector(".material-grid")?.addEventListener(
      "click",
      (event) => {
        const button = event.target.closest(".material-btn");
        if (!button) return;

        document
          .querySelectorAll(".material-btn")
          .forEach((materialButton) =>
            materialButton.classList.remove("active"),
          );
        button.classList.add("active");
        this.currentNailSet.material = button.dataset.material || "Glossy";
        this.triggerRedetection();
      },
      { signal: this.uiAbortController.signal },
    );

    const handleFileUpload = (id, key) => {
      const input = document.getElementById(id);
      if (!input) return;

      input.addEventListener("change", async () => {
        if (input.files && input.files[0]) {
          const file = input.files[0];
          const previewUrl = URL.createObjectURL(file);
          const img = await this.loadImage(previewUrl);
          const newDecoration = {
            id: Math.random().toString(36).substr(2, 9),
            type: key,
            image: img,
            x: 0,
            y: 0,
            scale: key === "sticker" || key === "art" ? 0.35 : 0.2,
            rotation: 0,
          };

          this.pendingDecorationFiles.set(newDecoration.id, file);

          if (this.editMode === "all") {
            this.currentNailSet.nails.forEach((n) =>
              n.decorations.push({ ...newDecoration }),
            );
          } else {
            this.currentNailSet.nails[
              this.selectedFingerIndex
            ].decorations.push(newDecoration);
            this.selectedLayerIndex =
              this.currentNailSet.nails[this.selectedFingerIndex].decorations
                .length - 1;
          }
          this.renderLayersList();
          this.triggerRedetection();
        }
      });
    };

    handleFileUpload("upload-gem", "gem");
    const btnUploadCustom = document.getElementById("btn-upload-custom");
    btnUploadCustom.addEventListener("click", () => {
      const tempInput = document.createElement("input");
      tempInput.type = "file";
      tempInput.accept = "image/*";
      tempInput.onchange = async () => {
        if (tempInput.files && tempInput.files[0]) {
          const file = tempInput.files[0];
          const previewUrl = URL.createObjectURL(file);
          const img = await this.loadImage(previewUrl);

          if (this.editMode === "all") {
            this.currentNailSet.nails.forEach((nail, index) => {
              nail.customShape = img;
              this.pendingCustomShapeFiles.set(index, file);
            });
          } else {
            this.currentNailSet.nails[this.selectedFingerIndex].customShape =
              img;
            this.pendingCustomShapeFiles.set(this.selectedFingerIndex, file);
          }
          this.triggerRedetection();
        }
      };
      tempInput.click();
    });

    // Fix re-upload button in try-on view (stays in Step 3 but allows changing image)
    const reUploadBtn = document.getElementById("re-upload-btn");
    if (reUploadBtn) {
      reUploadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.switchStep("upload");
      });
    }

    this.updatePreviewCanvas();

    // Custom model options for Hand Landmarker
    this.models = {
      hand_landmarker: "/hand_landmarker.task",
    };

    if (this.modelSelector) {
      this.modelSelector.updateOptions([
        { label: "Hand Landmarker", value: "hand_landmarker", isDefault: true },
      ]);
    }
  }

  triggerRedetection() {
    this.updatePreviewCanvas();
    if (this.runningMode === "IMAGE") {
      const testImage = document.getElementById("test-image");
      if (
        testImage &&
        testImage.src &&
        testImage.complete &&
        testImage.naturalWidth > 0
      ) {
        this.detectImage(testImage);
      }
    }
  }

  getWorkerInitParams() {
    return {
      numHands: this.numHands,
      minHandDetectionConfidence: this.minHandDetectionConfidence,
      minHandPresenceConfidence: this.minHandPresenceConfidence,
      minTrackingConfidence: this.minTrackingConfidence,
    };
  }

  displayImageResult(result) {
    const imageCanvas = document.getElementById("image-canvas");
    const testImage = document.getElementById("test-image");
    const ctx = imageCanvas.getContext("2d");

    // Ensure canvas matches original image size
    imageCanvas.width = testImage.naturalWidth;
    imageCanvas.height = testImage.naturalHeight;

    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

    if (result.landmarks && result.landmarks.length > 0) {
      result.landmarks.forEach((landmarks, index) => {
        const score = result.handedness?.[index]?.[0]?.score ?? 0.8;
        const drawnCount = this.drawLandmarks(ctx, landmarks, score);
        if (drawnCount === 0) {
          this.drawNailsFromFingerTips(ctx, landmarks);
        }
      });
    }
  }

  displayVideoResult(result) {
    if (
      this.canvasElement.width !== this.video.videoWidth ||
      this.canvasElement.height !== this.video.videoHeight
    ) {
      this.canvasElement.width = this.video.videoWidth;
      this.canvasElement.height = this.video.videoHeight;
    }
    this.canvasCtx.clearRect(
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height,
    );

    const hudStatusContainer = document.getElementById("hud-status-container");
    const statusMessage = document.getElementById("status-message");

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];

      // Diagnostics checks
      const distCheck = checkHandDistance(landmarks);
      const isBlurry = checkImageBlur(this.video, landmarks);

      if (hudStatusContainer && statusMessage) {
        hudStatusContainer.className = "hud-top-status"; // Reset classes
        if (isBlurry) {
          hudStatusContainer.classList.add("status-warning");
          statusMessage.innerText = "BLURRY CAMERA";
        } else if (distCheck === "TOO_FAR") {
          hudStatusContainer.classList.add("status-warning");
          statusMessage.innerText = "BRING HAND CLOSER";
        } else if (distCheck === "TOO_CLOSE") {
          hudStatusContainer.classList.add("status-warning");
          statusMessage.innerText = "MOVE HAND AWAY";
        } else {
          hudStatusContainer.classList.add("status-success");
          statusMessage.innerText = "READY";
        }
      }

      const isReady = statusMessage?.innerText === "READY";
      result.landmarks.forEach((handLandmarks, index) => {
        const score = result.handedness?.[index]?.[0]?.score ?? 0.8;
        const drawnCount = this.drawLandmarks(
          this.canvasCtx,
          handLandmarks,
          score,
        );
        if (isReady && drawnCount === 0) {
          this.drawNailsFromFingerTips(this.canvasCtx, handLandmarks);
        }
      });
    } else {
      this.resetFilters();
      if (hudStatusContainer && statusMessage) {
        hudStatusContainer.className = "hud-top-status status-none";
        statusMessage.innerText = "SHOW YOUR HAND";
      }
    }
  }

  drawLandmarks(ctx, landmarks, score = 0.8) {
    // Skeleton removed as per request
    return this.drawNails(ctx, landmarks, score);
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  getRenderMaterial(surfaceName) {
    const normalized = String(surfaceName || "")
      .trim()
      .toLowerCase();
    if (normalized.includes("iridescent") || normalized.includes("iridescence"))
      return "iridescent";
    if (normalized.includes("holographic") || normalized.includes("hologram"))
      return "iridescent";
    if (normalized.includes("metallic") || normalized.includes("chrome"))
      return "metallic";
    if (normalized.includes("matte")) return "matte";
    return "standard";
  }

  normalizeSerializedNailSet(config) {
    if ("configJson" in config && typeof config.configJson === "string") {
      try {
        return this.normalizeSerializedNailSet(JSON.parse(config.configJson));
      } catch {
        return null;
      }
    }

    if (!Array.isArray(config.nails)) return null;
    return config;
  }

  serializeCurrentNailSet() {
    return {
      shape: this.currentNailSet.shape,
      shapeImageKey: this.currentNailSet.shapeImageKey,
      length: this.currentNailSet.length,
      material: this.currentNailSet.material,
      gradient: { ...this.currentNailSet.gradient },
      nails: this.currentNailSet.nails.map((nail) => ({
        color: nail.color,
        gradient: nail.gradient ? { ...nail.gradient } : null,
        customShapeSrc: nail.customShape?.src ?? null,
        decorations: nail.decorations.map((decoration) => ({
          id: decoration.id,
          type: decoration.type,
          componentId: decoration.componentId ?? null,
          imageSrc: decoration.image.src,
          x: decoration.x,
          y: decoration.y,
          scale: decoration.scale,
          rotation: decoration.rotation,
        })),
      })),
    };
  }

  async loadFromNailVariant(nailVariantId) {
    const [variant, placedComponents] = await Promise.all([
      getNailVariant(nailVariantId),
      getPlacedNailComponents(nailVariantId),
    ]);

    this.currentNailSet = this.createDefaultNailSet();
    if (variant.nailShape?.name) {
      this.currentNailSet.shape = variant.nailShape.name;
    }
    await this.loadVariantShapeImage(variant.nailShape?.id, variant.nailShape?.imageUrl);
    if (variant.nailSurface?.shaderParam || variant.nailSurface?.name) {
      this.currentNailSet.material = variant.nailSurface.name;
    }
    this.applyVariantColorJson(variant.colorJson);

    const componentCache = new Map();
    for (const placedComponent of placedComponents) {
      if (!componentCache.has(placedComponent.componentId)) {
        componentCache.set(
          placedComponent.componentId,
          await getComponent(placedComponent.componentId),
        );
      }

      const component = componentCache.get(placedComponent.componentId);
      if (!component?.imageUrl) continue;

      const config = this.parsePlacementConfig(placedComponent.configJson);
      const decoration = await this.createDecorationFromComponent(
        component.imageUrl,
        component.componentType,
        {
          componentId: placedComponent.componentId,
          x: placedComponent.posX,
          y: placedComponent.posY,
          scale: config.scale,
          rotation: config.rotation,
        },
      );
      const targets =
        placedComponent.fingerIndex === -1
          ? this.currentNailSet.nails
          : [this.currentNailSet.nails[placedComponent.fingerIndex - 1]].filter(
              Boolean,
            );

      targets.forEach((nail) => {
        nail.color = config.color ?? nail.color;
        nail.gradient = config.gradient ?? nail.gradient;
        nail.decorations.push({
          ...decoration,
          id: `dec-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        });
      });
    }

    this.selectedLayerIndex = -1;
    this.syncBuilderControls();
    this.renderLayersList();
    this.triggerRedetection();
    this.dispatchDecorationsChanged();
  }

  syncBuilderControls() {
    document.querySelectorAll(".shape-btn").forEach((shapeButton) => {
      const button = shapeButton;
      button.classList.toggle(
        "active",
        button.dataset.shape === this.currentNailSet.shape,
      );
    });

    document.querySelectorAll(".material-btn").forEach((materialButton) => {
      const button = materialButton;
      button.classList.toggle(
        "active",
        button.dataset.material === this.currentNailSet.material,
      );
    });

    const firstNail = this.currentNailSet.nails[0];
    const customColorPicker = document.getElementById("custom-color");
    if (customColorPicker && firstNail?.color) {
      customColorPicker.value = firstNail.color;
    }

    const enableGradient = document.getElementById("enable-gradient");
    const gradientControls = document.getElementById("gradient-controls");
    if (enableGradient && gradientControls) {
      enableGradient.checked = Boolean(
        this.currentNailSet.gradient.enabled || firstNail?.gradient,
      );
      gradientControls.style.display = enableGradient.checked ? "flex" : "none";
    }
  }

  createDefaultNailSet() {
    return {
      shape: "ballerina",
      shapeImageKey: this.defaultShapeImageKey,
      length: 1.0,
      material: "Glossy",
      gradient: {
        enabled: false,
        type: "linear",
        stops: ["#FF4081", "#FFFFFF", "#000000"],
        stopCount: 2,
      },
      nails: Array.from({ length: 5 }, () => ({
        color: "#FF4081",
        decorations: [],
        customShape: null,
        gradient: null,
      })),
    };
  }

  async loadVariantShapeImage(shapeId, shapeImageUrl) {
    if (!shapeImageUrl) return;

    this.currentNailSet.shapeImageKey = shapeId
      ? `shape-${shapeId}`
      : this.currentNailSet.shape;
    this.nailImages[this.currentNailSet.shapeImageKey] =
      await this.loadImage(shapeImageUrl);
  }

  parsePlacementConfig(configJson) {
    if (!configJson) return {};
    try {
      return JSON.parse(configJson);
    } catch {
      return {};
    }
  }

  applyVariantColorJson(colorJson) {
    if (!colorJson) return;

    try {
      const parsed = JSON.parse(colorJson);
      if (Array.isArray(parsed)) {
        this.currentNailSet.nails.forEach((nail, index) => {
          if (parsed[index]) nail.color = parsed[index];
        });
        return;
      }

      if (parsed.mode === "perFinger") {
        parsed.fingers?.forEach((finger) => {
          const nail = this.currentNailSet.nails[(finger.fingerIndex ?? 0) - 1];
          if (!nail) return;
          if (finger.color) nail.color = finger.color;
          nail.gradient = finger.gradient ?? null;
        });
        return;
      }

      if (parsed.color) {
        this.currentNailSet.nails.forEach((nail) => {
          nail.color = parsed.color;
          nail.gradient = parsed.gradient ?? null;
        });
        if (parsed.gradient)
          this.currentNailSet.gradient = {
            ...this.currentNailSet.gradient,
            ...parsed.gradient,
          };
        return;
      }
    } catch {
      // Plain hex colors are supported for variants saved before ColorJson became structured.
    }
    this.currentNailSet.nails.forEach((nail) => {
      nail.color = colorJson;
    });
  }

  async createDecorationFromComponent(imageUrl, componentType, options) {
    const type = this.mapComponentType(componentType);
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      componentId: options.componentId,
      image: await this.loadImage(imageUrl),
      x: options.x,
      y: options.y,
      scale:
        options.scale ?? (type === "sticker" || type === "art" ? 0.35 : 0.2),
      rotation: options.rotation ?? 0,
    };
  }

  mapComponentType(componentType) {
    const normalizedType = String(componentType).toLowerCase();
    if (normalizedType === "0" || normalizedType === "gem") return "gem";
    if (normalizedType === "1" || normalizedType === "sticker")
      return "sticker";
    if (normalizedType === "2" || normalizedType === "charm") return "charm";
    if (normalizedType === "3" || normalizedType === "art") return "art";
    return "gem";
  }

  async deserializeNailSet(config) {
    const nails = await Promise.all(
      config.nails.map(async (nail) => {
        const decorations = await Promise.all(
          nail.decorations.map(async (decoration) => {
            const image = await this.loadImage(decoration.imageSrc);
            return {
              id: decoration.id,
              type: decoration.type,
              componentId: decoration.componentId ?? null,
              image,
              x: decoration.x,
              y: decoration.y,
              scale: decoration.scale,
              rotation: decoration.rotation,
            };
          }),
        );

        return {
          color: nail.color,
          decorations,
          customShape: nail.customShapeSrc
            ? await this.loadImage(nail.customShapeSrc)
            : null,
          gradient: nail.gradient,
        };
      }),
    );

    return {
      shape: config.shape,
      shapeImageKey: config.shapeImageKey ?? config.shape,
      length: config.length,
      material: config.material || "Glossy",
      gradient: { ...config.gradient },
      nails,
    };
  }

  async addDecorationFromUrl(imageUrl, type, componentId) {
    const image = await this.loadImage(imageUrl);
    const newDecoration = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      componentId,
      image,
      x: 0,
      y: 0,
      scale: type === "sticker" || type === "art" ? 0.35 : 0.2,
      rotation: 0,
    };

    if (this.editMode === "all") {
      this.currentNailSet.nails.forEach((nail) => {
        nail.decorations.push({
          ...newDecoration,
          id: `dec-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        });
      });
    } else {
      this.currentNailSet.nails[this.selectedFingerIndex].decorations.push(
        newDecoration,
      );
      this.selectedLayerIndex =
        this.currentNailSet.nails[this.selectedFingerIndex].decorations.length -
        1;
    }

    this.renderLayersList();
    this.triggerRedetection();
    this.dispatchDecorationsChanged();
  }

  drawNails(ctx, landmarks, score = 0.8) {
    const { shape, shapeImageKey, length } = this.currentNailSet;
    let drawnCount = 0;

    this.initFilters();
    this.latestFingerGeometries = [];

    for (let i = 0; i < 5; i++) {
      const geom = computeFingerGeometry(
        landmarks,
        i,
        ctx.canvas.width,
        ctx.canvas.height,
        score,
      );
      if (!geom) continue;

      // Apply EMA filter to make it extremely smooth in video mode
      if (this.runningMode === "VIDEO") {
        const filter = this.fingerFilters[i];
        geom.center = filter.center.filter(geom.center);
        geom.rotation = filter.rotation.filter(geom.rotation);
        geom.width = filter.width.filter(geom.width);
        geom.height = filter.height.filter(geom.height);
      }

      this.latestFingerGeometries.push(geom);

      // Hide nail if confidence is too low
      if (geom.confidence < 0.35) {
        continue;
      }

      const design = this.currentNailSet.nails[i];
      const { color, decorations, customShape } = design;

      ctx.save();
      // Translate to nail center and rotate according to finger axis direction
      ctx.translate(geom.center.x, geom.center.y);
      ctx.rotate(geom.rotation + Math.PI / 2);

      const baseShapeImg =
        customShape || this.nailImages[shapeImageKey] || this.nailImages[shape];

      // Layer 1: Base + Color / Gradient / Material
      ctx.save();
      if (!customShape) {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = geom.width;
        offCanvas.height = geom.height;
        const offCtx = offCanvas.getContext("2d");

        // Draw shape mask
        if (baseShapeImg) {
          offCtx.drawImage(baseShapeImg, 0, 0, geom.width, geom.height);
        } else {
          // If shape asset is missing, use beautiful custom canvas path fallback
          offCtx.translate(geom.width / 2, geom.height / 2);
          this.drawProceduralNailMask(offCtx, geom.width, geom.height, shape);
          offCtx.fillStyle = "#ffffff";
          offCtx.fill();
          offCtx.translate(-geom.width / 2, -geom.height / 2);
        }

        offCtx.globalCompositeOperation = "source-in";

        // Apply custom gradient or fallback global gradient
        const grad =
          design.gradient ||
          (this.editMode === "all" && this.currentNailSet.gradient.enabled
            ? this.currentNailSet.gradient
            : null);

        if (grad && grad.enabled) {
          let fillGrad;
          if (grad.type === "linear") {
            fillGrad = offCtx.createLinearGradient(0, 0, 0, geom.height);
          } else if (grad.type === "horizontal") {
            fillGrad = offCtx.createLinearGradient(0, 0, geom.width, 0);
          } else {
            fillGrad = offCtx.createRadialGradient(
              geom.width / 2,
              geom.height / 2,
              0,
              geom.width / 2,
              geom.height / 2,
              geom.width,
            );
          }

          fillGrad.addColorStop(0, grad.stops[0]);
          if (grad.stopCount === 3) {
            fillGrad.addColorStop(0.5, grad.stops[1]);
            fillGrad.addColorStop(1, grad.stops[2]);
          } else {
            fillGrad.addColorStop(1, grad.stops[1]);
          }
          offCtx.fillStyle = fillGrad;
        } else {
          // Apply Material styling
          const mat = this.getRenderMaterial(this.currentNailSet.material);
          if (mat === "metallic") {
            const metallicGrad = offCtx.createLinearGradient(
              0,
              0,
              geom.width,
              geom.height,
            );
            metallicGrad.addColorStop(0, chroma(color).darken(1).hex());
            metallicGrad.addColorStop(0.3, chroma(color).brighten(1).hex());
            metallicGrad.addColorStop(0.5, color);
            metallicGrad.addColorStop(0.7, chroma(color).brighten(1.5).hex());
            metallicGrad.addColorStop(1, chroma(color).darken(1.5).hex());
            offCtx.fillStyle = metallicGrad;
          } else if (mat === "iridescent") {
            const iriGrad = offCtx.createLinearGradient(
              0,
              0,
              geom.width,
              geom.height,
            );
            const scale = chroma
              .scale(["#ff0000", "#00ff00", "#0000ff", "#ff00ff"])
              .mode("lch")
              .colors(5);
            iriGrad.addColorStop(0, chroma(color).mix(scale[0], 0.3).hex());
            iriGrad.addColorStop(0.5, chroma(color).mix(scale[2], 0.3).hex());
            iriGrad.addColorStop(1, chroma(color).mix(scale[4], 0.3).hex());
            offCtx.fillStyle = iriGrad;
          } else if (mat === "matte") {
            offCtx.fillStyle = chroma(color).desaturate(0.5).darken(0.1).hex();
          } else {
            offCtx.fillStyle = color;
          }
        }
        // Fill canvas region with selected style
        offCtx.fillRect(0, 0, geom.width, geom.height);

        // Add glass shine highlight for realistic material effect
        if (this.getRenderMaterial(this.currentNailSet.material) !== "matte") {
          offCtx.globalCompositeOperation = "screen";
          const shineGrad = offCtx.createLinearGradient(0, 0, geom.width, 0);
          shineGrad.addColorStop(0, "rgba(255,255,255,0)");
          shineGrad.addColorStop(0.4, "rgba(255,255,255,0)");
          shineGrad.addColorStop(0.5, "rgba(255,255,255,0.4)");
          shineGrad.addColorStop(0.6, "rgba(255,255,255,0)");
          shineGrad.addColorStop(1, "rgba(255,255,255,0)");
          offCtx.fillStyle = shineGrad;
          offCtx.fillRect(0, 0, geom.width, geom.height);
        }

        ctx.drawImage(
          offCanvas,
          -geom.width / 2,
          -geom.height / 2,
          geom.width,
          geom.height,
        );
      } else {
        // Draw custom image shapes as is
        ctx.drawImage(
          baseShapeImg,
          -geom.width / 2,
          -geom.height / 2,
          geom.width,
          geom.height,
        );
      }
      ctx.restore();
      drawnCount += 1;

      // Render decorations relative to nail coordinate system
      decorations.forEach((dec) => {
        ctx.save();
        const decX = dec.x * geom.width;
        const decY = dec.y * geom.height;

        ctx.translate(decX, decY);
        ctx.rotate((dec.rotation * Math.PI) / 180);

        const decW = geom.width * dec.scale;
        const decH = geom.height * dec.scale;

        ctx.drawImage(dec.image, -decW / 2, -decH / 2, decW, decH);
        ctx.restore();
      });

      ctx.restore();
    }

    return drawnCount;
  }

  drawNailsFromFingerTips(ctx, landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    const { shape, shapeImageKey, length } = this.currentNailSet;
    let drawnCount = 0;

    fingerTips.forEach((tipIndex, i) => {
      const tip = landmarks[tipIndex];
      const joint = landmarks[tipIndex - 1];
      const design = this.currentNailSet.nails[i];
      if (!tip || !joint || !design) return;

      const { color, decorations, customShape } = design;
      const px = tip.x * ctx.canvas.width;
      const py = tip.y * ctx.canvas.height;
      const jx = joint.x * ctx.canvas.width;
      const jy = joint.y * ctx.canvas.height;
      const angle = Math.atan2(py - jy, px - jx);
      const fingerLength = Math.hypot(px - jx, py - jy);
      if (!Number.isFinite(fingerLength) || fingerLength <= 0) return;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);

      const baseShapeImg =
        customShape || this.nailImages[shapeImageKey] || this.nailImages[shape];
      const nailWidth = fingerLength * 2.5;
      const nailHeight = fingerLength * 1.5 * length;
      const nailBottom = fingerLength * 1;
      const totalHeight = nailHeight * 1.5;
      const destRect = {
        x: -nailWidth / 2,
        y: nailBottom - totalHeight,
        w: nailWidth,
        h: totalHeight,
      };

      ctx.save();
      if (!customShape) {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = nailWidth;
        offCanvas.height = totalHeight;
        const offCtx = offCanvas.getContext("2d");

        if (baseShapeImg) {
          offCtx.drawImage(baseShapeImg, 0, 0, nailWidth, totalHeight);
        } else {
          offCtx.translate(nailWidth / 2, totalHeight / 2);
          this.drawProceduralNailMask(offCtx, nailWidth, totalHeight, shape);
          offCtx.fillStyle = "#ffffff";
          offCtx.fill();
          offCtx.translate(-nailWidth / 2, -totalHeight / 2);
        }

        offCtx.globalCompositeOperation = "source-in";
        const grad =
          design.gradient ||
          (this.editMode === "all" && this.currentNailSet.gradient.enabled
            ? this.currentNailSet.gradient
            : null);

        if (grad && grad.enabled) {
          let fillGrad;
          if (grad.type === "linear") {
            fillGrad = offCtx.createLinearGradient(0, 0, 0, totalHeight);
          } else if (grad.type === "horizontal") {
            fillGrad = offCtx.createLinearGradient(0, 0, nailWidth, 0);
          } else {
            fillGrad = offCtx.createRadialGradient(
              nailWidth / 2,
              totalHeight / 2,
              0,
              nailWidth / 2,
              totalHeight / 2,
              nailWidth,
            );
          }
          fillGrad.addColorStop(0, grad.stops[0]);
          if (grad.stopCount === 3) {
            fillGrad.addColorStop(0.5, grad.stops[1]);
            fillGrad.addColorStop(1, grad.stops[2]);
          } else {
            fillGrad.addColorStop(1, grad.stops[1]);
          }
          offCtx.fillStyle = fillGrad;
        } else {
          const mat = this.getRenderMaterial(this.currentNailSet.material);
          if (mat === "metallic") {
            const metallicGrad = offCtx.createLinearGradient(
              0,
              0,
              nailWidth,
              totalHeight,
            );
            metallicGrad.addColorStop(0, chroma(color).darken(1).hex());
            metallicGrad.addColorStop(0.3, chroma(color).brighten(1).hex());
            metallicGrad.addColorStop(0.5, color);
            metallicGrad.addColorStop(0.7, chroma(color).brighten(1.5).hex());
            metallicGrad.addColorStop(1, chroma(color).darken(1.5).hex());
            offCtx.fillStyle = metallicGrad;
          } else if (mat === "iridescent") {
            const iriGrad = offCtx.createLinearGradient(
              0,
              0,
              nailWidth,
              totalHeight,
            );
            const scale = chroma
              .scale(["#ff0000", "#00ff00", "#0000ff", "#ff00ff"])
              .mode("lch")
              .colors(5);
            iriGrad.addColorStop(0, chroma(color).mix(scale[0], 0.3).hex());
            iriGrad.addColorStop(0.5, chroma(color).mix(scale[2], 0.3).hex());
            iriGrad.addColorStop(1, chroma(color).mix(scale[4], 0.3).hex());
            offCtx.fillStyle = iriGrad;
          } else if (mat === "matte") {
            offCtx.fillStyle = chroma(color).desaturate(0.5).darken(0.1).hex();
          } else {
            offCtx.fillStyle = color;
          }
        }

        offCtx.fillRect(0, 0, nailWidth, totalHeight);
        ctx.drawImage(offCanvas, destRect.x, destRect.y, destRect.w, destRect.h);
      } else if (baseShapeImg) {
        ctx.drawImage(baseShapeImg, destRect.x, destRect.y, destRect.w, destRect.h);
      }
      ctx.restore();
      drawnCount += 1;

      decorations.forEach((dec) => {
        ctx.save();
        const decX = destRect.x + destRect.w / 2 + dec.x * destRect.w;
        const decY = destRect.y + destRect.h / 2 + dec.y * destRect.h;

        ctx.translate(decX, decY);
        ctx.rotate((dec.rotation * Math.PI) / 180);

        const decW = destRect.w * dec.scale;
        const decH = destRect.h * dec.scale;

        ctx.drawImage(dec.image, -decW / 2, -decH / 2, decW, decH);
        ctx.restore();
      });

      ctx.restore();
    });

    return drawnCount;
  }

  drawProceduralNailMask(ctx, w, h, shapeName) {
    ctx.beginPath();
    const normalizedShape = shapeName.toLowerCase();

    if (normalizedShape.includes("stiletto")) {
      // Pointy tip
      ctx.moveTo(-w / 2, h);
      ctx.quadraticCurveTo(-w / 2, h * 0.4, 0, 0);
      ctx.quadraticCurveTo(w / 2, h * 0.4, w / 2, h);
      ctx.quadraticCurveTo(0, h * 1.05, -w / 2, h);
    } else if (normalizedShape.includes("almond")) {
      // Rounded point tip
      ctx.moveTo(-w / 2, h);
      ctx.bezierCurveTo(-w / 2, h * 0.4, -w * 0.25, 0, 0, 0);
      ctx.bezierCurveTo(w * 0.25, 0, w / 2, h * 0.4, w / 2, h);
      ctx.quadraticCurveTo(0, h * 1.05, -w / 2, h);
    } else if (
      normalizedShape.includes("ballerina") ||
      normalizedShape.includes("coffin")
    ) {
      // Flat top, tapered sides
      ctx.moveTo(-w / 2, h);
      ctx.lineTo(-w * 0.28, 0);
      ctx.lineTo(w * 0.28, 0);
      ctx.lineTo(w / 2, h);
      ctx.quadraticCurveTo(0, h * 1.05, -w / 2, h);
    } else if (normalizedShape.includes("squoval")) {
      // Slightly rounded square
      ctx.moveTo(-w / 2, h);
      ctx.quadraticCurveTo(-w / 2, h * 0.15, -w * 0.38, 0);
      ctx.lineTo(w * 0.38, 0);
      ctx.quadraticCurveTo(w / 2, h * 0.15, w / 2, h);
      ctx.quadraticCurveTo(0, h * 1.05, -w / 2, h);
    } else {
      // Default: Round/Oval
      ctx.moveTo(-w / 2, h);
      ctx.bezierCurveTo(-w / 2, h * 0.25, -w * 0.45, 0, 0, 0);
      ctx.bezierCurveTo(w * 0.45, 0, w / 2, h * 0.25, w / 2, h);
      ctx.quadraticCurveTo(0, h * 1.05, -w / 2, h);
    }
    ctx.closePath();
  }

  setupCanvasInteractions() {
    // Decoration interactions are now handled by framer-motion DOM overlay.
    // Canvas only needs finger selection via the nail-preview-card click handler.
  }
  syncPreviewSelection() {
    document.querySelectorAll(".nail-preview-card").forEach((button) => {
      const fingerIndex = parseInt(button.dataset.index ?? "-1", 10);
      button.classList.toggle(
        "active",
        this.editMode === "individual" &&
          fingerIndex === this.selectedFingerIndex,
      );
    });
  }

  updatePreviewCanvas() {
    this.currentNailSet.nails.forEach((_, fingerIndex) => {
      const previewCanvas = document.getElementById(
        `nail-preview-canvas-${fingerIndex}`,
      );
      if (previewCanvas) this.renderPreviewCanvas(previewCanvas, fingerIndex);
    });
    this.syncPreviewSelection();
  }

  renderPreviewCanvas(previewCanvas, fingerIndex) {
    const ctx = previewCanvas.getContext("2d");
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const { shape, shapeImageKey, length } = this.currentNailSet;
    const { color, decorations, customShape } =
      this.currentNailSet.nails[fingerIndex];
    const baseShapeImg =
      customShape || this.nailImages[shapeImageKey] || this.nailImages[shape];

    const centerX = previewCanvas.width / 2;
    const centerY = previewCanvas.height / 2;
    const fingerLength = Math.min(
      previewCanvas.width * 0.36,
      previewCanvas.height * 0.32,
    );

    ctx.save();
    ctx.translate(centerX, centerY + previewCanvas.height * 0.16);

    const nailWidth = fingerLength * 2.0;
    const nailHeight = fingerLength * 1.2 * length;
    const nailBottom = fingerLength * 0.75;
    const totalHeight = nailHeight * 1.5;

    const destRect = {
      x: -nailWidth / 2,
      y: nailBottom - totalHeight,
      w: nailWidth,
      h: totalHeight,
    };

    // Layer 1: Base + Color
    ctx.save();
    if (!customShape) {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = nailWidth;
      offCanvas.height = totalHeight;
      const offCtx = offCanvas.getContext("2d");

      if (baseShapeImg) {
        offCtx.drawImage(baseShapeImg, 0, 0, nailWidth, totalHeight);
      } else {
        offCtx.save();
        offCtx.translate(nailWidth / 2, 0);
        this.drawProceduralNailMask(offCtx, nailWidth, totalHeight, shape);
        offCtx.fillStyle = "#ffffff";
        offCtx.fill();
        offCtx.restore();
      }

      offCtx.globalCompositeOperation = "source-in";

      const grad =
        this.currentNailSet.nails[fingerIndex].gradient ||
        (this.editMode === "all" && this.currentNailSet.gradient.enabled
          ? this.currentNailSet.gradient
          : null);

      if (grad && grad.enabled) {
        let fillGrad;
        if (grad.type === "linear") {
          fillGrad = offCtx.createLinearGradient(0, 0, 0, totalHeight);
        } else if (grad.type === "horizontal") {
          fillGrad = offCtx.createLinearGradient(0, 0, nailWidth, 0);
        } else {
          fillGrad = offCtx.createRadialGradient(
            nailWidth / 2,
            totalHeight / 2,
            0,
            nailWidth / 2,
            totalHeight / 2,
            nailWidth,
          );
        }

        fillGrad.addColorStop(0, grad.stops[0]);
        if (grad.stopCount === 3) {
          fillGrad.addColorStop(0.5, grad.stops[1]);
          fillGrad.addColorStop(1, grad.stops[2]);
        } else {
          fillGrad.addColorStop(1, grad.stops[1]);
        }
        offCtx.fillStyle = fillGrad;
      } else {
        // Apply Material Logic to Base Color
        const mat = this.getRenderMaterial(this.currentNailSet.material);
        if (mat === "metallic") {
          const metallicGrad = offCtx.createLinearGradient(
            0,
            0,
            nailWidth,
            totalHeight,
          );
          metallicGrad.addColorStop(0, chroma(color).darken(1).hex());
          metallicGrad.addColorStop(0.3, chroma(color).brighten(1).hex());
          metallicGrad.addColorStop(0.5, color);
          metallicGrad.addColorStop(0.7, chroma(color).brighten(1.5).hex());
          metallicGrad.addColorStop(1, chroma(color).darken(1.5).hex());
          offCtx.fillStyle = metallicGrad;
        } else if (mat === "iridescent") {
          const iriGrad = offCtx.createLinearGradient(
            0,
            0,
            nailWidth,
            totalHeight,
          );
          const scale = chroma
            .scale(["#ff0000", "#00ff00", "#0000ff", "#ff00ff"])
            .mode("lch")
            .colors(5);
          iriGrad.addColorStop(0, chroma(color).mix(scale[0], 0.3).hex());
          iriGrad.addColorStop(0.5, chroma(color).mix(scale[2], 0.3).hex());
          iriGrad.addColorStop(1, chroma(color).mix(scale[4], 0.3).hex());
          offCtx.fillStyle = iriGrad;
        } else if (mat === "matte") {
          offCtx.fillStyle = chroma(color).desaturate(0.5).darken(0.1).hex();
        } else {
          offCtx.fillStyle = color;
        }
      }

      offCtx.fillRect(0, 0, nailWidth, totalHeight);

      // Add Dynamic Shine
      if (this.getRenderMaterial(this.currentNailSet.material) !== "matte") {
        offCtx.globalCompositeOperation = "screen";
        const shineGrad = offCtx.createLinearGradient(0, 0, nailWidth, 0);
        shineGrad.addColorStop(0, "rgba(255,255,255,0)");
        shineGrad.addColorStop(0.4, "rgba(255,255,255,0)");
        shineGrad.addColorStop(0.5, "rgba(255,255,255,0.4)");
        shineGrad.addColorStop(0.6, "rgba(255,255,255,0)");
        shineGrad.addColorStop(1, "rgba(255,255,255,0)");
        offCtx.fillStyle = shineGrad;
        offCtx.fillRect(0, 0, nailWidth, totalHeight);
        offCtx.globalCompositeOperation = "source-over";
      }

      ctx.drawImage(offCanvas, destRect.x, destRect.y, destRect.w, destRect.h);
    } else {
      ctx.drawImage(
        baseShapeImg,
        destRect.x,
        destRect.y,
        destRect.w,
        destRect.h,
      );
    }
    ctx.restore();

    // Decorations are rendered by framer-motion DOM overlay in builder mode.
    // We do NOT render decorations on the preview canvas anymore.

    ctx.restore();
  }

  renderLayersList() {
    const list = document.getElementById("layers-list");
    if (!list) return;

    const finger = this.currentNailSet.nails[this.selectedFingerIndex];
    if (finger.decorations.length === 0) {
      list.innerHTML = '<div class="empty-layers">No decorations added</div>';
      return;
    }

    list.innerHTML = "";
    finger.decorations.forEach((dec, idx) => {
      const item = document.createElement("div");
      item.className = `layer-item ${idx === this.selectedLayerIndex ? "active" : ""}`;
      item.innerHTML = `
        <img class="layer-thumb" crossOrigin="anonymous" src="${dec.image.src}">
        <div class="layer-info">${dec.type.toUpperCase()} ${idx + 1}</div>
        <span class="material-icons layer-delete" data-idx="${idx}">delete</span>
      `;

      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("layer-delete")) {
          const deleteIdx = parseInt(e.target.dataset.idx);
          const decId = finger.decorations[deleteIdx].id;

          if (this.editMode === "all") {
            // Delete from all fingers
            this.currentNailSet.nails.forEach((n) => {
              const idx = n.decorations.findIndex((d) => d.id === decId);
              if (idx !== -1) n.decorations.splice(idx, 1);
            });
          } else {
            // Delete only from current finger
            finger.decorations.splice(deleteIdx, 1);
          }

          this.pendingDecorationFiles.delete(decId);
          if (this.selectedLayerIndex === deleteIdx)
            this.selectedLayerIndex = -1;
          this.renderLayersList();
          this.triggerRedetection();
          this.dispatchDecorationsChanged();
          return;
        }
        this.selectedLayerIndex = idx;
        this.renderLayersList();
        this.triggerRedetection();
        this.dispatchDecorationsChanged();
      });

      list.appendChild(item);
    });
  }

  // Override base class methods to prevent runtime errors with our custom HTML
  setupViewToggle() {
    // We handle view switching manually in our 3-step flow
  }
  setupImageUpload() {
    // We handle image upload manually in the Upload Step
  }
  switchStep(step) {
    const views = {
      builder: document.getElementById("builder-view"),
      upload: document.getElementById("upload-view"),
      tryon: document.getElementById("tryon-view"),
    };

    Object.values(views).forEach((v) => v.classList.remove("active"));
    views[step].classList.add("active");

    if (step !== "tryon") {
      this.stopCam(false);
    }
  }

  wasOpenedInTryOnMode() {
    return new URLSearchParams(window.location.search).has("mode");
  }

  returnToPreviousPageWhenLaunchedFromDetail() {
    if (!this.wasOpenedInTryOnMode()) return false;

    window.dispatchEvent(new CustomEvent("nailify:try-on-return"));
    return true;
  }

  resetImageUpload() {
    const imageUpload = document.getElementById("image-upload");
    const previewImg = document.getElementById("hand-preview-img");
    const testImage = document.getElementById("test-image");
    const startButton = document.getElementById("btn-start-image-tryon");

    if (imageUpload) imageUpload.value = "";
    if (previewImg) previewImg.removeAttribute("src");
    if (testImage) testImage.removeAttribute("src");
    document
      .querySelector(".upload-placeholder")
      ?.setAttribute("style", "display: flex");
    document
      .querySelector(".hand-preview-container")
      ?.setAttribute("style", "display: none");
    if (startButton) startButton.style.display = "none";
  }

  switchMode(mode) {
    const viewWebcam = document.getElementById("view-webcam");
    const viewImage = document.getElementById("view-image");
    const tryonTitle = document.getElementById("tryon-title");

    this.runningMode = mode;
    this.worker?.postMessage({ type: "SET_OPTIONS", runningMode: mode });

    if (mode === "VIDEO") {
      viewWebcam.classList.add("active");
      viewImage.classList.remove("active");
      if (tryonTitle) tryonTitle.innerText = "Live Try-On";
      this.enableCam();
    } else {
      viewWebcam.classList.remove("active");
      viewImage.classList.add("active");
      if (tryonTitle) tryonTitle.innerText = "Image Try-On";
      this.stopCam(false);
      const testImage = document.getElementById("test-image");
      if (testImage && testImage.src) {
        this.detectImage(testImage);
      }
    }
  }
}

export async function setupHandLandmarker(container) {
  const task = new HandLandmarkerTask({
    container,
    defaultModelName: "hand_landmarker",
    defaultModelUrl: "/hand_landmarker.task",
    workerFactory: () =>
      new Worker(new URL("./handLandmarker.worker.js", import.meta.url), {
        type: "module",
      }),
  });

  await task.initialize();
  return {
    cleanup: () => task.cleanup(),
    getSerializedConfig: () => task.getSerializedConfig(),
    getPendingImageFiles: () => task.getPendingImageFiles(),
    getLatestFingerGeometries: () => task.getLatestFingerGeometries(),
    loadFromConfig: (config) => task.loadFromConfig(config),
    loadFromDatabase: (nailSetId) => task.loadFromDatabase(String(nailSetId)),
    saveToDatabase: (nailSetId) => task.saveToDatabase(String(nailSetId)),
    startImageTryOn: () => task.startImageTryOn(),
    startLiveTryOn: () => task.startLiveTryOn(),
    renderPreviewCanvas: (canvas, fingerIndex) =>
      task.renderPreviewCanvas(canvas, fingerIndex),
    triggerRedetection: () => task.triggerRedetection(),
    copyCurrentFingerToAll: () => task.copyCurrentFingerToAll(),
    // Framer-motion API
    getDecorations: (fingerIndex) =>
      task.getDecorations(fingerIndex).map((d) => ({
        id: d.id,
        type: d.type,
        imageSrc: d.image.src,
        x: d.x,
        y: d.y,
        scale: d.scale,
        rotation: d.rotation,
      })),
    updateDecoration: (fi, di, u) => task.updateDecoration(fi, di, u),
    getSelectedFingerIndex: () => task.getSelectedFingerIndex(),
    getSelectedLayerIndex: () => task.getSelectedLayerIndex(),
    setSelectedLayer: (fi, li) => task.setSelectedLayer(fi, li),
    deselectLayer: (fi) => task.deselectLayer(fi),
    getCanvasLayout: (fi) => task.getCanvasLayout(fi),
    getEditMode: () => task.getEditMode(),
  };
}
