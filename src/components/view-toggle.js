export class ViewToggle {
  constructor(
    containerId,
    options,
    defaultValue,
    callback,
    customStyle = "pills",
  ) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id '${containerId}' not found.`);
    }
    this.container = element;
    this.options = options;
    this.callback = callback;
    this.activeValue = defaultValue;
    this.customStyle = customStyle;

    this.render();
  }

  render() {
    const containerClass =
      this.customStyle === "tabs" ? "tabs-container" : "view-tabs";
    const buttonClass = this.customStyle === "tabs" ? "tab-button" : "view-tab";

    this.container.classList.add(containerClass);
    this.container.innerHTML = "";

    this.options.forEach((option) => {
      const button = document.createElement("button");
      button.classList.add(buttonClass);
      button.dataset.value = option.value;

      if (option.icon) {
        button.innerHTML = `<span class="material-icons">${option.icon}</span> ${option.label}`;
      } else {
        button.textContent = option.label;
      }

      if (option.value === this.activeValue) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        this.setActive(option.value);
      });

      this.container.appendChild(button);
    });
  }

  setActive(value) {
    const isSame = this.activeValue === value;
    this.activeValue = value;

    const buttonClass =
      this.customStyle === "tabs" ? ".tab-button" : ".view-tab";
    const buttons = this.container.querySelectorAll(buttonClass);
    buttons.forEach((btn) => {
      if (btn.dataset.value === value) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    if (!isSame) {
      this.callback(value);
    }
  }
}
