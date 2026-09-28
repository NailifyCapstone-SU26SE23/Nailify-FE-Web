import { FilesetResolver } from "@mediapipe/tasks-vision";

export class BaseWorker {
  isInitializing = false;
  currentOptions = {};
  basePath = "/";
  isProcessing = false;

  static async loadWasmModule(basePath, fileName) {
    const url = `${basePath}/${fileName}`;

    const module = await import(/* @vite-ignore */ url);
    const ModuleFactory = module.default;

    const wasmModule = await ModuleFactory({
      print: (text) => console.log("[MediaPipe Debug]:", text),
      printErr: (text) => console.error("[MediaPipe Error]:", text),
      custom_dbg: (text) => console.log("[MediaPipe Debug]:", text),
    });

    return wasmModule;
  }

  constructor() {
    self.onmessage = this.handleMessage.bind(this);
  }

  async handleMessage(event) {
    const { type } = event.data;

    while (this.isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    this.isProcessing = true;

    try {
      if (type === "INIT") {
        const { modelAssetPath, delegate, baseUrl, ...rest } = event.data;
        this.basePath = baseUrl || "/";
        this.currentOptions = { modelAssetPath, delegate, ...rest };

        await this.initializeBase(event.data);

        const payload = this.getInitPayload();
        self.postMessage({ type: "INIT_DONE", ...payload });
      } else if (type === "SET_OPTIONS") {
        const { type: _type, ...optionsToUpdate } = event.data;
        Object.assign(this.currentOptions, optionsToUpdate);
        await this.updateOptions(optionsToUpdate);
        self.postMessage({ type: "OPTIONS_UPDATED" });
      } else if (type === "CLEANUP") {
        if (this.taskInstance) {
          this.taskInstance.close?.();
          this.taskInstance = undefined;
        }
        self.postMessage({ type: "CLEANUP_DONE" });
      } else {
        await this.handleCustomMessage(event.data);
      }
    } catch (error) {
      console.error("Worker Error:", error);
      self.postMessage({
        type: "ERROR",
        error: error?.message || String(error),
      });
    } finally {
      this.isProcessing = false;
    }
  }

  async initializeBase(data) {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (this.taskInstance) {
        this.taskInstance.close?.();
        this.taskInstance = undefined;
      }
      await this.initializeTask(data);
    } finally {
      this.isInitializing = false;
    }
  }

  async loadModelAsset() {
    const response = await fetch(this.currentOptions.modelAssetPath);
    if (!response.ok) {
      throw new Error(`Failed to load model: ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body?.getReader();
    if (!reader) {
      return response.arrayBuffer();
    }

    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (total > 0) {
        self.postMessage({
          type: "LOAD_PROGRESS",
          loaded: receivedLength,
          total,
        });
      }
    }

    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }

    return chunksAll.buffer;
  }

  getWasmPath() {
    const formattedBasePath = this.basePath.endsWith("/")
      ? this.basePath
      : `${this.basePath}/`;
    return new URL(
      `${formattedBasePath}wasm`,
      self.location.origin,
    ).href.replace(/\/$/, "");
  }

  async getVisionFileset() {
    const wasmPath = this.getWasmPath();
    const fileset = await FilesetResolver.forVisionTasks(wasmPath, true);
    fileset.wasmLoaderPath = `${fileset.wasmLoaderPath}?cb=${Date.now()}`; // Force reload
    return fileset;
  }

  async getAudioFileset() {
    const wasmPath = this.getWasmPath();
    const fileset = await FilesetResolver.forAudioTasks(wasmPath, true);
    fileset.wasmLoaderPath = `${fileset.wasmLoaderPath}?cb=${Date.now()}`; // Force reload
    return fileset;
  }

  async getTextFileset() {
    const wasmPath = this.getWasmPath();
    const fileset = await FilesetResolver.forTextTasks(wasmPath, true);
    fileset.wasmLoaderPath = `${fileset.wasmLoaderPath}?cb=${Date.now()}`; // Force reload
    return fileset;
  }

  updateOptions(_) {
    return Promise.resolve();
  }

  getInitPayload() {
    return {};
  }
}
