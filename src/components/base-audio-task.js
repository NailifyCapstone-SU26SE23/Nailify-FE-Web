import { ViewToggle } from "./view-toggle";
import { BaseTask } from "./base-task";

export class BaseAudioTask extends BaseTask {
  runningMode = "AUDIO_STREAM";

  isRecording = false;

  async initialize() {
    await super.initialize();

    this.setupAudioViewToggle();
    this.setupAudioUpload();
    this.setupRecordButton();
  }

  setupAudioViewToggle() {
    const viewMic = document.getElementById("view-microphone");
    const viewFile = document.getElementById("view-file");

    if (!viewMic || !viewFile) return;

    const switchView = (mode) => {
      if (mode === "MIC") {
        viewMic.classList.add("active");
        viewFile.classList.remove("active");
        this.runningMode = "AUDIO_STREAM";
      } else {
        viewMic.classList.remove("active");
        viewFile.classList.add("active");
        this.runningMode = "AUDIO_CLIPS";
        this.stopRecording();
      }
      this.clearResults();
      this.onViewSwitched(mode);
    };

    new ViewToggle(
      "view-mode-toggle",
      [
        { label: "Microphone", value: "mic" },
        { label: "Audio File", value: "file" },
      ],
      "mic",
      (value) => {
        switchView(value === "mic" ? "MIC" : "FILE");
      },
    );
  }

  setupAudioUpload() {
    const audioUpload = document.getElementById("audio-upload");
    const dropzone = document.querySelector(".upload-dropzone");

    if (dropzone) {
      dropzone.addEventListener("click", (e) => {
        if (e.target.closest("audio") || e.target.closest("button")) return;
        audioUpload?.click();
      });

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.style.borderColor = "var(--primary)";
        dropzone.style.backgroundColor = "#e3f2fd";
      });

      dropzone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.style.borderColor = "#ccc";
        dropzone.style.backgroundColor = "#f8f9fa";
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.style.borderColor = "#ccc";
        dropzone.style.backgroundColor = "#f8f9fa";

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.handleFileSelect(files[0]);
        }
      });
    }

    if (audioUpload) {
      audioUpload.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) this.handleFileSelect(file);
      });
    }
  }

  setupRecordButton() {
    const recordButton = document.getElementById("recordButton");
    if (recordButton) {
      recordButton.addEventListener("click", this.toggleRecording.bind(this));
    }
  }

  handleFileSelect(file) {
    const player = document.getElementById("audio-player");
    const previewContainer = document.getElementById("audio-preview-container");
    const dropzoneContent = document.querySelector(".dropzone-content");

    if (player && previewContainer && dropzoneContent) {
      player.src = URL.createObjectURL(file);
      previewContainer.style.display = "flex";
      previewContainer.style.flexDirection = "column";
      previewContainer.style.alignItems = "center";
      previewContainer.style.justifyContent = "center";
      dropzoneContent.style.display = "none";

      this.onAudioFileLoaded(file);
    }
  }

  async toggleRecording() {
    const recordButton = document.getElementById("recordButton");
    if (this.isRecording) {
      this.stopRecording();
      if (recordButton) {
        recordButton.innerHTML =
          '<span class="material-icons">mic</span> Start Recording';
        recordButton.classList.remove("recording");
      }
    } else {
      await this.startRecording();
      if (this.isRecording && recordButton) {
        recordButton.innerHTML =
          '<span class="material-icons">stop</span> Stop Recording';
        recordButton.classList.add("recording");
      }
    }
  }

  async startRecording() {
    try {
      this.audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )({ sampleRate: 16000 });
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(
        this.stream,
      );

      this.scriptProcessor = this.audioContext.createScriptProcessor(
        4096,
        1,
        1,
      );
      this.mediaStreamSource.connect(this.scriptProcessor);

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0;
      this.scriptProcessor.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      this.scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.processAudioData(inputData, this.audioContext.sampleRate);
      };

      this.isRecording = true;
      this.updateStatus("Recording...");
    } catch (err) {
      console.error("Failed to start recording", err);
      this.updateStatus("Mic Error");
    }
  }

  stopRecording() {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = undefined;
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = undefined;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = undefined;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }
    this.isRecording = false;
    this.updateStatus("Ready");
    this.clearResults();
  }

  cleanup() {
    this.stopRecording();
    super.cleanup();
  }

  getWorkerInitParamsInner() {
    return {
      runningMode: this.runningMode,
      ...this.getWorkerInitParams(),
    };
  }

  onViewSwitched(_) {}
}
