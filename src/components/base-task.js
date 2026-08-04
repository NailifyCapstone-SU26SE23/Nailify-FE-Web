import { ModelSelector } from "./model-selector";

export class BaseTask {
  models = {};
  currentDelegate = "GPU";

  isWorkerReady = false;

  constructor(options) {
    this.options = options;
    this.container = options.container;
    this.currentModel = options.defaultModelName;
    this.models[options.defaultModelName] = options.defaultModelUrl;
    if (options.defaultDelegate) {
      this.currentDelegate = options.defaultDelegate;
    }
  }

  async initialize() {
    if (this.options.template) {
      this.container.innerHTML = this.options.template;
    }

    this.initWorker();
    this.setupUI();

    // Child class hook
    this.onInitializeUI();
    this.setupDelegateSelect();

    await this.initializeTask();
  }

  initWorker() {
    if (!this.worker) {
      this.worker = this.options.workerFactory();
    }
    if (this.worker) {
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = (e) => {
        console.error("Worker error event:", e);
        this.updateStatus(
          `Worker load/runtime error: ${e.message || "failed to load"}`,
        );
      };
    }
  }

  handleWorkerMessage(event) {
    const { type } = event.data;

    switch (type) {
      case "LOAD_PROGRESS":
        this.handleLoadProgress(event.data);
        break;

      case "INIT_DONE":
        this.handleInitDone();
        break;

      case "DELEGATE_FALLBACK":
        console.warn("Worker fell back to CPU delegate.");
        this.currentDelegate = "CPU";
        const delegateSelect = document.getElementById("delegate-select");
        if (delegateSelect) delegateSelect.value = "CPU";
        break;

      case "ERROR":
      case "DETECT_ERROR":
      case "CLASSIFY_ERROR":
        console.error("Worker error:", event.data.error);
        this.updateStatus(`Error: ${event.data.error}`);
        break;
    }
  }

  handleLoadProgress(data) {
    const { progress, loaded, total } = data;
    if (progress !== undefined) {
      this.modelSelector?.showProgress(progress * 100, 100);
      if (progress >= 1)
        setTimeout(() => this.modelSelector?.hideProgress(), 500);
    } else if (loaded !== undefined && total !== undefined) {
      this.modelSelector?.showProgress(loaded, total);
      if (loaded >= total)
        setTimeout(() => this.modelSelector?.hideProgress(), 500);
    }
  }

  handleInitDone() {
    this.modelSelector?.hideProgress();
    document.querySelector(".viewport")?.classList.remove("loading-model");
    this.isWorkerReady = true;
    this.updateStatus("Ready");
  }

  setupDelegateSelect() {
    const delegateSelect = document.getElementById("delegate-select");
    if (delegateSelect) {
      delegateSelect.addEventListener("change", async () => {
        this.currentDelegate = delegateSelect.value;
        await this.initializeTask();
      });
      delegateSelect.value = this.currentDelegate;
    }
  }

  setupUI() {
    this.modelSelector = new ModelSelector(
      "model-selector-container",
      [
        {
          label: this.options.defaultModelName,
          value: this.options.defaultModelName,
          isDefault: true,
        },
      ],
      async (selection) => {
        if (selection.type === "standard") {
          this.currentModel = selection.value;
        } else if (selection.type === "custom") {
          this.models["custom"] = URL.createObjectURL(selection.file);
          this.currentModel = "custom";
        }
        await this.initializeTask();
      },
    );
  }

  async initializeTask() {
    document.querySelector(".viewport")?.classList.add("loading-model");
    this.isWorkerReady = false;
    this.updateStatus("Loading Model...");

    // @ts-ignore
    const baseUrl = import.meta.env.BASE_URL;
    let modelPath = this.models[this.currentModel];

    if (this.currentModel === "custom" && this.models["custom"]) {
      modelPath = this.models["custom"];
    } else if (!modelPath.startsWith("http")) {
      modelPath = new URL(modelPath, new URL(baseUrl, window.location.origin))
        .href;
    }

    const initParams = this.getWorkerInitParamsInner();

    this.worker?.postMessage({
      type: "INIT",
      modelAssetPath: modelPath,
      delegate: this.currentDelegate,
      baseUrl,
      ...initParams,
    });
  }

  getWorkerInitParamsInner() {
    return this.getWorkerInitParams();
  }

  updateStatus(msg) {
    const el = document.getElementById("status-message");
    if (el) el.innerText = msg;
  }

  updateInferenceTime(time) {
    const el = document.getElementById("inference-time");
    if (el) el.innerText = `Inference Time: ${time.toFixed(2)} ms`;
  }

  cleanup() {
    if (this.worker) {
      this.worker.postMessage({ type: "CLEANUP" });
      this.worker.terminate();
      this.worker = undefined;
    }

    this.isWorkerReady = false;
  }

  onInitializeUI() {}
}
