import { useCallback, useEffect, useRef, useState } from "react";
import {
  getComponents,
  getNailShapes,
  getNailSurfaces,
} from "../../../services/nailDesign.service";

/* ─── Curated Professional Nail Color Palette ───────────────────────── */
const NAIL_COLORS = [
  // Reds
  { hex: "#DC143C", name: "Crimson" },
  { hex: "#B22222", name: "Firebrick" },
  { hex: "#8B0000", name: "Dark Red" },
  // Pinks
  { hex: "#FF4081", name: "Hot Pink" },
  { hex: "#E91E63", name: "Rose" },
  { hex: "#FF69B4", name: "Bubblegum" },
  { hex: "#FFB6C1", name: "Light Pink" },
  // Nudes
  { hex: "#F5CBA7", name: "Peach" },
  { hex: "#FFDAB9", name: "Bisque" },
  { hex: "#D2B48C", name: "Tan" },
  { hex: "#C8A882", name: "Sand" },
  // Purples
  { hex: "#9C27B0", name: "Violet" },
  { hex: "#7B1FA2", name: "Deep Purple" },
  { hex: "#E1BEE7", name: "Lavender" },
  // Blues
  { hex: "#1565C0", name: "Royal Blue" },
  { hex: "#42A5F5", name: "Sky Blue" },
  { hex: "#0D47A1", name: "Navy" },
  // Neutrals & Other
  { hex: "#FFFFFF", name: "White" },
  { hex: "#2C2C2C", name: "Charcoal" },
  { hex: "#000000", name: "Black" },
  { hex: "#2E7D32", name: "Emerald" },
  { hex: "#FFD700", name: "Gold" },
  { hex: "#FF6F00", name: "Amber" },
];

const SURFACE_ICONS = {
  glossy: "✨",
  matte: "🪨",
  chrome: "🪞",
  "cat eyes": "🐱",
  holographic: "🌈",
  minnh: "💎",
};

function getSurfaceIcon(name) {
  const normalized = name.toLowerCase().trim();
  return SURFACE_ICONS[normalized] ?? "💅";
}

/* ─── Main BuilderControls Component ────────────────────────────────── */
export function BuilderControls() {
  const [nailShapes, setNailShapes] = useState([]);
  const [nailSurfaces, setNailSurfaces] = useState([]);
  const [componentsByType, setComponentsByType] = useState({
    0: [],
    1: [],
    2: [],
    3: [],
  });
  const [colorMode, setColorMode] = useState("solid");
  const [stopCount, setStopCount] = useState(2);
  const gradientPreviewRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getNailShapes(),
      getNailSurfaces(),
      getComponents(0),
      getComponents(1),
      getComponents(2),
      getComponents(3),
    ])
      .then(
        ([
          loadedShapes,
          loadedSurfaces,
          loadedGems,
          loadedStickers,
          loadedCharms,
          loadedArt,
        ]) => {
          if (ignore) return;
          setNailShapes(loadedShapes);
          setNailSurfaces(loadedSurfaces);
          setComponentsByType({
            0: loadedGems,
            1: loadedStickers,
            2: loadedCharms,
            3: loadedArt,
          });
        },
      )
      .catch(() => {
        if (ignore) return;
        setNailShapes([]);
        setNailSurfaces([]);
        setComponentsByType({ 0: [], 1: [], 2: [], 3: [] });
      });

    return () => {
      ignore = true;
    };
  }, []);

  /* Sync gradient preview bar with current gradient color stops */
  const updateGradientPreview = useCallback(() => {
    if (!gradientPreviewRef.current) return;
    const c1 = document.getElementById("gradient-color-1")?.value ?? "#FF4081";
    const c2 = document.getElementById("gradient-color-2")?.value ?? "#FFFFFF";
    const c3 = document.getElementById("gradient-color-3")?.value ?? "#000000";
    const gType = document.getElementById("gradient-type")?.value ?? "linear";
    const checkedRadio = document.querySelector(
      'input[name="stop-count"]:checked',
    );
    const sc = checkedRadio ? parseInt(checkedRadio.value, 10) : 2;

    let gradientCSS;
    if (gType === "radial") {
      gradientCSS =
        sc === 3
          ? `radial-gradient(circle, ${c1}, ${c2}, ${c3})`
          : `radial-gradient(circle, ${c1}, ${c2})`;
    } else if (gType === "horizontal") {
      gradientCSS =
        sc === 3
          ? `linear-gradient(90deg, ${c1}, ${c2}, ${c3})`
          : `linear-gradient(90deg, ${c1}, ${c2})`;
    } else {
      gradientCSS =
        sc === 3
          ? `linear-gradient(180deg, ${c1}, ${c2}, ${c3})`
          : `linear-gradient(180deg, ${c1}, ${c2})`;
    }
    gradientPreviewRef.current.style.background = gradientCSS;
  }, []);

  /* When switching to gradient mode, enable the checkbox; when leaving, disable it */
  const handleModeChange = useCallback(
    (mode) => {
      setColorMode(mode);

      const enableGradientCheckbox = document.getElementById("enable-gradient");
      if (!enableGradientCheckbox) return;

      if (mode === "gradient") {
        if (!enableGradientCheckbox.checked) {
          enableGradientCheckbox.checked = true;
          enableGradientCheckbox.dispatchEvent(
            new Event("change", { bubbles: true }),
          );
        }
        requestAnimationFrame(updateGradientPreview);
      } else if (mode === "solid") {
        if (enableGradientCheckbox.checked) {
          enableGradientCheckbox.checked = false;
          enableGradientCheckbox.dispatchEvent(
            new Event("change", { bubbles: true }),
          );
        }
      }
    },
    [updateGradientPreview],
  );

  /* Observe gradient control changes to keep preview synced */
  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(updateGradientPreview);
      const checkedRadio = document.querySelector(
        'input[name="stop-count"]:checked',
      );
      const sc = checkedRadio ? parseInt(checkedRadio.value, 10) : 2;
      setStopCount(sc);
    };
    const ids = [
      "gradient-color-1",
      "gradient-color-2",
      "gradient-color-3",
      "gradient-type",
    ];
    ids.forEach((id) =>
      document.getElementById(id)?.addEventListener("input", handler),
    );
    document
      .querySelectorAll('input[name="stop-count"]')
      .forEach((radio) => radio.addEventListener("change", handler));
    // Initial run to sync
    handler();

    return () => {
      ids.forEach((id) =>
        document.getElementById(id)?.removeEventListener("input", handler),
      );
      document
        .querySelectorAll('input[name="stop-count"]')
        .forEach((radio) => radio.removeEventListener("change", handler));
    };
  }, [updateGradientPreview]);

  return (
    <div className="builder-controls-grid">
      <section className="builder-panel builder-style-panel">
        {/* ─── Nail Shape ─── */}
        <div className="section-title">Nail Shape</div>
        <div className="shape-selector">
          {nailShapes.length > 0 ? (
            nailShapes.map((shape, index) => {
              const hasDefaultShape = nailShapes.some(
                (nailShape) => Number(nailShape.id) === 1,
              );
              const isDefaultShape = hasDefaultShape
                ? Number(shape.id) === 1
                : index === 0;

              return (
              <button
                className={`shape-btn ${isDefaultShape ? "active" : ""}`}
                data-shape={shape.name}
                data-shape-key={`shape-${shape.id}`}
                data-shape-image-url={shape.imageUrl ?? ""}
                key={shape.id}
                type="button"
              >
                {shape.imageUrl ? (
                  <img alt="" className="shape-thumb" src={shape.imageUrl} />
                ) : null}
                {shape.name}
              </button>
              );
            })
          ) : (
            <div className="empty-layers">No nail shapes found</div>
          )}
        </div>

        {/* ─── Nail Color — Paint Studio ─── */}
        <div className="section-title">
          <span>Nail Color</span>
        </div>

        {/* Mode Tabs */}
        <div className="paint-studio">
          <div className="paint-mode-tabs">
            <button
              className={`paint-mode-tab ${colorMode === "solid" ? "active" : ""}`}
              onClick={() => handleModeChange("solid")}
              type="button"
            >
              <span className="paint-tab-icon">🎨</span>
              <span className="paint-tab-label">Solid</span>
            </button>
            <button
              className={`paint-mode-tab ${colorMode === "gradient" ? "active" : ""}`}
              onClick={() => handleModeChange("gradient")}
              type="button"
            >
              <span className="paint-tab-icon">🌈</span>
              <span className="paint-tab-label">Gradient</span>
            </button>
          </div>

          {/* ─── Solid Color Mode ─── */}
          <div
            className={`paint-panel ${colorMode === "solid" ? "active" : ""}`}
          >
            <div className="color-palette">
              {NAIL_COLORS.map((c) => (
                <div
                  className="color-swatch"
                  data-color={c.hex}
                  key={c.hex}
                  style={{ background: c.hex }}
                  title={c.name}
                />
              ))}
              <input
                type="color"
                id="custom-color"
                defaultValue="#FF4081"
                title="Custom Color"
              />
            </div>
          </div>

          {/* ─── Gradient Mode ─── */}
          <div
            className={`paint-panel ${colorMode === "gradient" ? "active" : ""}`}
          >
            {/* Hidden checkbox — preserved for handLandmarkerTask.js event handler */}
            <input
              type="checkbox"
              id="enable-gradient"
              style={{
                position: "absolute",
                opacity: 0,
                pointerEvents: "none",
                width: 0,
                height: 0,
              }}
            />

            {/* Live gradient preview bar */}
            <div className="gradient-preview-bar" ref={gradientPreviewRef} />

            {/* Premium Ombre Presets */}
            <div className="gradient-presets-section">
              <span className="gradient-presets-title">Ombre Presets</span>
              <div className="gradient-presets-grid">
                {[
                  {
                    name: "French Ombre",
                    c1: "#FFB6C1",
                    c2: "#FFFFFF",
                    c3: "#FFFFFF",
                    stops: 2,
                    type: "linear",
                    bg: "linear-gradient(180deg, #FFB6C1, #FFFFFF)",
                  },
                  {
                    name: "Sunset Glow",
                    c1: "#FF4081",
                    c2: "#FFD700",
                    c3: "#FFD700",
                    stops: 2,
                    type: "linear",
                    bg: "linear-gradient(180deg, #FF4081, #FFD700)",
                  },
                  {
                    name: "Berry Sorbet",
                    c1: "#E91E63",
                    c2: "#FFB6C1",
                    c3: "#FFFFFF",
                    stops: 3,
                    type: "linear",
                    bg: "linear-gradient(180deg, #E91E63, #FFB6C1, #FFFFFF)",
                  },
                  {
                    name: "Ocean Mist",
                    c1: "#0D47A1",
                    c2: "#42A5F5",
                    c3: "#42A5F5",
                    stops: 2,
                    type: "linear",
                    bg: "linear-gradient(180deg, #0D47A1, #42A5F5)",
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="gradient-preset-card"
                    style={{ background: preset.bg }}
                    title={preset.name}
                    onClick={() => {
                      const input1 =
                        document.getElementById("gradient-color-1");
                      const input2 =
                        document.getElementById("gradient-color-2");
                      const input3 =
                        document.getElementById("gradient-color-3");
                      const typeSelect =
                        document.getElementById("gradient-type");
                      const radio = document.querySelector(
                        `input[name="stop-count"][value="${preset.stops}"]`,
                      );

                      if (input1) {
                        input1.value = preset.c1;
                        input1.dispatchEvent(
                          new Event("input", { bubbles: true }),
                        );
                      }
                      if (input2) {
                        input2.value = preset.c2;
                        input2.dispatchEvent(
                          new Event("input", { bubbles: true }),
                        );
                      }
                      if (input3) {
                        input3.value = preset.c3;
                        input3.dispatchEvent(
                          new Event("input", { bubbles: true }),
                        );
                      }
                      if (typeSelect) {
                        typeSelect.value = preset.type;
                        typeSelect.dispatchEvent(
                          new Event("change", { bubbles: true }),
                        );
                      }
                      if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(
                          new Event("change", { bubbles: true }),
                        );
                      }
                      updateGradientPreview();
                    }}
                  >
                    <span className="preset-name">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div
              id="gradient-controls"
              className="gradient-controls"
              style={{ display: colorMode === "gradient" ? "flex" : "none" }}
            >
              {/* Color count toggle */}
              <div className="gradient-stop-count">
                <span className="gradient-dir-label">Colors</span>
                <div className="stop-count-selector">
                  <label className="stop-count-chip">
                    <input
                      type="radio"
                      name="stop-count"
                      value="2"
                      defaultChecked
                    />{" "}
                    2 Colors (Ombre)
                  </label>
                  <label className="stop-count-chip">
                    <input type="radio" name="stop-count" value="3" /> 3 Colors
                    (Trio)
                  </label>
                </div>
              </div>

              {/* Color stops with clear labels */}
              <div className="gradient-stop-group">
                <label className="gradient-stop-label">
                  <span className="gradient-stop-title">Base Color</span>
                  <input
                    type="color"
                    id="gradient-color-1"
                    defaultValue="#FF4081"
                    title="Base Color"
                  />
                </label>
                {stopCount === 3 ? (
                  <>
                    <label className="gradient-stop-label">
                      <span className="gradient-stop-title">Middle Color</span>
                      <input
                        type="color"
                        id="gradient-color-2"
                        defaultValue="#FFFFFF"
                        title="Middle Color"
                      />
                    </label>
                    <label className="gradient-stop-label">
                      <span className="gradient-stop-title">Tip Color</span>
                      <input
                        type="color"
                        id="gradient-color-3"
                        defaultValue="#000000"
                        title="Tip Color"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="gradient-stop-label">
                      <span className="gradient-stop-title">Tip Color</span>
                      <input
                        type="color"
                        id="gradient-color-2"
                        defaultValue="#FFFFFF"
                        title="Tip Color"
                      />
                    </label>
                    {/* Render gradient-color-3 in a hidden container to prevent script error or styling clash */}
                    <div style={{ display: "none" }}>
                      <input
                        type="color"
                        id="gradient-color-3"
                        defaultValue="#000000"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Direction picker — simple style terms */}
              <div className="gradient-direction-picker">
                <span className="gradient-dir-label">Style</span>
                <select
                  id="gradient-type"
                  className="gradient-type-select"
                  defaultValue="linear"
                >
                  <option value="linear">↕ Vertical (Top to Bottom)</option>
                  <option value="horizontal">
                    ↔ Horizontal (Left to Right)
                  </option>
                  <option value="radial">◎ Radial (Center Outward)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Nail Surface ─── */}
        <div className="material-section">
          <div className="section-title">Nail Surface</div>
          <div className="material-grid">
            {nailSurfaces.length > 0 ? (
              nailSurfaces.map((surface, index) => (
                <button
                  className={`material-btn ${index === 0 ? "active" : ""}`}
                  data-material={surface.name}
                  key={surface.id}
                  type="button"
                >
                  <span className="material-btn-icon">
                    {getSurfaceIcon(surface.name)}
                  </span>
                  <span className="material-btn-name">{surface.name}</span>
                </button>
              ))
            ) : (
              <div className="empty-layers">No nail surfaces found</div>
            )}
          </div>
        </div>
      </section>

      <section className="builder-panel builder-component-panel">
        <button
          id="btn-upload-custom"
          className="action-btn orange"
          type="button"
        >
          <span className="material-icons">upload_file</span>
          Upload Custom Nail Image
        </button>
        <ComponentPicker
          title="Gem"
          type="gem"
          components={componentsByType[0]}
        />
        <ComponentPicker
          title="Sticker"
          type="sticker"
          components={componentsByType[1]}
        />
        <ComponentPicker
          title="Charm"
          type="charm"
          components={componentsByType[2]}
        />
        <ComponentPicker
          title="Art"
          type="art"
          components={componentsByType[3]}
        />
      </section>
    </div>
  );
}

function ComponentPicker({ components, title, type }) {
  return (
    <>
      <div className="section-title">{title}</div>
      <div className="extras-grid">
        {components.length > 0 ? (
          components.map((component) => (
            <button
              className="extra-item component-decoration-btn"
              data-component-id={component.id}
              data-component-type={type}
              data-image-url={component.imageUrl ?? ""}
              disabled={!component.imageUrl}
              key={component.id}
              type="button"
            >
              {component.imageUrl ? (
                <img alt="" className="layer-thumb" src={component.imageUrl} />
              ) : null}
              <span>{component.name}</span>
            </button>
          ))
        ) : (
          <div className="empty-layers">
            No {title.toLowerCase()} components found
          </div>
        )}
      </div>
    </>
  );
}
