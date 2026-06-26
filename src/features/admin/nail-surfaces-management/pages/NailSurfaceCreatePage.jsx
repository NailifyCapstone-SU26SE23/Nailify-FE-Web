import {
  ArrowLeft,
  Clock3,
  Layers3,
  Save,
  Sparkles,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminNailSurfaceDetailRoute } from "../../../../shared/constants/routes";
import {
  createAdminNailSurface,
  formatNailSurfaceCurrency,
  formatNailSurfaceDuration,
} from "../services/nailSurfacesManagementService";

function createEmptyForm() {
  return {
    name: "",
    shaderParam: "",
    price: "",
    duration: "",
  };
}

function validateForm(formValues) {
  if (!String(formValues.name || "").trim()) {
    return "Nail surface name is required.";
  }

  if (!String(formValues.shaderParam || "").trim()) {
    return "Shader param is required.";
  }

  if (Number(formValues.price) < 0 || Number.isNaN(Number(formValues.price))) {
    return "Price must be a valid number.";
  }

  if (Number(formValues.duration) <= 0 || Number.isNaN(Number(formValues.duration))) {
    return "Duration must be greater than 0.";
  }

  return "";
}

export function NailSurfaceCreatePage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const summaryItems = useMemo(
    () => [
      ["Surface Name", formValues.name || "--"],
      ["Shader Param", formValues.shaderParam || "--"],
      ["Price", formValues.price ? formatNailSurfaceCurrency(formValues.price) : "--"],
      ["Duration", formValues.duration ? formatNailSurfaceDuration(formValues.duration) : "--"],
    ],
    [formValues.duration, formValues.name, formValues.price, formValues.shaderParam],
  );

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmitRequest = () => {
    const validationError = validateForm(formValues);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleCreateSurface = async () => {
    setIsSaving(true);

    try {
      const createdSurface = await createAdminNailSurface({
        ...formValues,
        price: Number(formValues.price),
        duration: Number(formValues.duration),
      });

      toast.success(`${createdSurface.name} created successfully.`);
      navigate(getAdminNailSurfaceDetailRoute(createdSurface.nailSurfaceId), {
        state: {
          flashMessage: `${createdSurface.name} has been created successfully.`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create nail surface.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminNailSurfaces}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#cf3d74]">Add New Nail Surface</h1>
            <p className="text-xs font-medium text-slate-400">
              Create a new nail surface with shader configuration and pricing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            Save Surface
          </button>
        </div>
      </header>

      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
          <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
            <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
            Nail Surface Details
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Surface Name</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Layers3 size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder="Enter nail surface name"
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Shader Param</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Sparkles size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.shaderParam}
                  onChange={(event) => handleFieldChange("shaderParam", event.target.value)}
                  placeholder="Glossy, matte, chrome..."
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Price</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Wallet size={14} className="shrink-0 text-rose-300" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formValues.price}
                  onChange={(event) => handleFieldChange("price", event.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Duration</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Clock3 size={14} className="shrink-0 text-rose-300" />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formValues.duration}
                  onChange={(event) => handleFieldChange("duration", event.target.value)}
                  placeholder="Minutes"
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              Preview
            </h2>

            <div className="space-y-4">
              <div className="flex h-48 items-center justify-center rounded-2xl border border-rose-100 bg-[#fff8fb]">
                <div className="text-center text-sm font-medium text-slate-400">
                  <Upload size={24} className="mx-auto mb-3 text-rose-300" />
                  Surface shader preview
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-rose-100 bg-[#fff8fb] p-4">
                {summaryItems.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-500">{label}</span>
                    <span className="text-right font-bold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title="Cancel Nail Surface Creation"
        subtitle="You are leaving this form without saving."
        description="All unsaved nail surface details will be discarded."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminNailSurfaces)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={["This new nail surface has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save New Nail Surface"
        subtitle="This will create the nail surface in backend."
        description="Confirm to add this nail surface to the admin catalog."
        confirmText="Create Surface"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreateSurface}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || "New nail surface"]}
        details={[
          { label: "Shader Param", value: formValues.shaderParam || "--" },
          { label: "Price", value: formValues.price ? formatNailSurfaceCurrency(formValues.price) : "--" },
        ]}
      />
    </section>
  );
}
