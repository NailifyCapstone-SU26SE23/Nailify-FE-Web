import { Sparkles, Paintbrush, Eraser } from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { SURFACE_PRESET_OPTIONS } from "../utils/surfaceShaderConfig";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

function SliderField({ label, min, max, step, value, onChange, helper }) {
  return (
    <label className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-slate-600">{label}</span>
        <span className="text-xs font-bold text-[#cf3d74]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#f8dce8] accent-[#ea4f93]"
      />
      {helper ? <p className="text-xs text-slate-400">{helper}</p> : null}
    </label>
  );
}

SliderField.propTypes = {
  helper: PropTypes.node,
  label: PropTypes.node.isRequired,
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onChange: PropTypes.func.isRequired,
  step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3">
      <span className="text-[13px] font-semibold text-slate-600">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#ea4f93]" />
    </label>
  );
}

ToggleField.propTypes = {
  checked: PropTypes.bool.isRequired,
  label: PropTypes.node.isRequired,
  onChange: PropTypes.func.isRequired,
};

export function NailSurfaceShaderBuilder({ formValues, onFieldChange, disabled = false }) {
  const preset = formValues.surfacePreset;
  const showMetalness = preset === "chrome" || formValues.metalnessEnabled;
  const showStripe = preset === "cat-eye" || formValues.stripeEnabled;
  const showRainbow = preset === "holographic" || formValues.rainbowEnabled;
  const { t, language } = useLanguage();

  return (
    <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
      <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
        <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
        {t("adminNailSurfacesManagement.surfaceEffectBuilder")}
      </h2>

      <div className={`space-y-5 ${disabled ? "pointer-events-none opacity-75" : ""}`}>
        <label className="space-y-2.5">
          <span className="text-[13px] font-semibold text-slate-600">{t("adminNailSurfacesManagement.surfaceType")}</span>
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
            <Sparkles size={14} className="shrink-0 text-rose-300" />
            <select
              value={formValues.surfacePreset}
              onChange={(event) => onFieldChange("surfacePreset", event.target.value)}
              disabled={disabled}
              className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none"
            >
              {SURFACE_PRESET_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <ToggleField
            label={t("adminNailSurfacesManagement.shineHighlight")}
            checked={Boolean(formValues.shineEnabled)}
            onChange={(event) => onFieldChange("shineEnabled", event.target.checked)}
          />
          <ToggleField
            label={t("adminNailSurfacesManagement.reflection")}
            checked={Boolean(formValues.reflectionEnabled)}
            onChange={(event) => onFieldChange("reflectionEnabled", event.target.checked)}
          />
          <ToggleField
            label={t("adminNailSurfacesManagement.specular")}
            checked={Boolean(formValues.specularEnabled)}
            onChange={(event) => onFieldChange("specularEnabled", event.target.checked)}
          />
          <ToggleField
            label={t("adminNailSurfacesManagement.metallic")}
            checked={Boolean(formValues.metalnessEnabled)}
            onChange={(event) => onFieldChange("metalnessEnabled", event.target.checked)}
          />
          <ToggleField
            label={t("adminNailSurfacesManagement.magneticStripe")}
            checked={Boolean(formValues.stripeEnabled)}
            onChange={(event) => onFieldChange("stripeEnabled", event.target.checked)}
          />
          <ToggleField
            label={t("adminNailSurfacesManagement.rainbowIridescence")}
            checked={Boolean(formValues.rainbowEnabled)}
            onChange={(event) => onFieldChange("rainbowEnabled", event.target.checked)}
          />
        </div>

        {/* PAINTER MODE UI */}
        <div className="pt-2">
          <ToggleField
            label={t("adminNailSurfacesManagement.interactivePainterMode")}
            checked={Boolean(formValues.painterMode)}
            onChange={(event) => onFieldChange("painterMode", event.target.checked)}
          />
        </div>

        {formValues.painterMode && (
          <div className="space-y-4 rounded-2xl border border-rose-100 bg-[#fff8fb] p-4 shadow-[inset_0_2px_10px_rgba(234,79,147,0.05)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all shadow-sm ${formValues.brushType === 'matte' ? 'bg-[#ea4f93] text-white shadow-[#ea4f93]/30' : 'bg-white text-slate-500 border border-rose-100 hover:bg-rose-50'}`}
                onClick={() => onFieldChange("brushType", "matte")}
              >
                <Eraser size={16} /> {t("adminNailSurfacesManagement.matteBrush")}
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all shadow-sm ${formValues.brushType !== 'matte' ? 'bg-[#ea4f93] text-white shadow-[#ea4f93]/30' : 'bg-white text-slate-500 border border-rose-100 hover:bg-rose-50'}`}
                onClick={() => onFieldChange("brushType", "glossy")}
              >
                <Paintbrush size={16} /> {t("adminNailSurfacesManagement.glossyBrush")}
              </button>
            </div>

            <SliderField
              label={t("adminNailSurfacesManagement.brushRadius")}
              min={5}
              max={100}
              step={5}
              value={formValues.brushSize || 20}
              onChange={(e) => onFieldChange("brushSize", Number(e.target.value))}
            />
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 pt-2">
          <SliderField
            label={t("adminNailSurfacesManagement.shineOpacity")}
            min="0"
            max="1"
            step="0.05"
            value={formValues.shineOpacity}
            onChange={(event) => onFieldChange("shineOpacity", event.target.value)}
          />
          <SliderField
            label={t("adminNailSurfacesManagement.reflectionIntensity")}
            min="0"
            max="1"
            step="0.05"
            value={formValues.reflectionIntensity}
            onChange={(event) => onFieldChange("reflectionIntensity", event.target.value)}
          />
          <SliderField
            label={t("adminNailSurfacesManagement.specularIntensity")}
            min="0"
            max="1"
            step="0.05"
            value={formValues.specularIntensity}
            onChange={(event) => onFieldChange("specularIntensity", event.target.value)}
          />
          <SliderField
            label={t("adminNailSurfacesManagement.textureRoughness")}
            min="0"
            max="1"
            step="0.05"
            value={formValues.roughness}
            onChange={(event) => onFieldChange("roughness", event.target.value)}
            helper={t("adminNailSurfacesManagement.textureRoughnessHelper")}
          />
          {showMetalness ? (
            <SliderField
              label={t("adminNailSurfacesManagement.metalnessIntensity")}
              min="0"
              max="1"
              step="0.05"
              value={formValues.metalnessIntensity}
              onChange={(event) => onFieldChange("metalnessIntensity", event.target.value)}
            />
          ) : null}
          {showStripe ? (
            <SliderField
              label={t("adminNailSurfacesManagement.stripeOpacity")}
              min="0"
              max="1"
              step="0.05"
              value={formValues.stripeOpacity}
              onChange={(event) => onFieldChange("stripeOpacity", event.target.value)}
            />
          ) : null}
          {showRainbow ? (
            <SliderField
              label={t("adminNailSurfacesManagement.rainbowIntensity")}
              min="0"
              max="1"
              step="0.05"
              value={formValues.rainbowIntensity}
              onChange={(event) => onFieldChange("rainbowIntensity", event.target.value)}
            />
          ) : null}
        </div>

        <div className="rounded-[20px] border border-rose-100 bg-[#fff8fb] p-4">
          <p className="text-[13px] font-semibold text-slate-600">{t("adminNailSurfacesManagement.colorOffsets")}</p>
          <p className="mt-1 text-xs text-slate-400">
            {t("adminNailSurfacesManagement.colorOffsetsHelper")}
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <SliderField
              label={t("adminNailSurfacesManagement.lightness")}
              min="-1"
              max="1"
              step="0.05"
              value={formValues.lightnessOffset}
              onChange={(event) => onFieldChange("lightnessOffset", event.target.value)}
            />
            <SliderField
              label={t("adminNailSurfacesManagement.saturation")}
              min="-1"
              max="1"
              step="0.05"
              value={formValues.saturationOffset}
              onChange={(event) => onFieldChange("saturationOffset", event.target.value)}
            />
            <SliderField
              label={t("adminNailSurfacesManagement.hue")}
              min="-30"
              max="30"
              step="1"
              value={formValues.hueOffset}
              onChange={(event) => onFieldChange("hueOffset", event.target.value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

NailSurfaceShaderBuilder.propTypes = {
  disabled: PropTypes.bool,
  formValues: PropTypes.shape({
    hueOffset: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lightnessOffset: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    metalnessEnabled: PropTypes.bool,
    metalnessIntensity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    rainbowEnabled: PropTypes.bool,
    rainbowIntensity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    reflectionEnabled: PropTypes.bool,
    reflectionIntensity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    roughness: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    saturationOffset: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    shineEnabled: PropTypes.bool,
    shineOpacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    specularEnabled: PropTypes.bool,
    specularIntensity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stripeEnabled: PropTypes.bool,
    stripeOpacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    surfacePreset: PropTypes.string,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
};
