import {
  ArrowLeft,
  Clock3,
  Layers3,
  Save,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminNailSurfaceDetailRoute } from "../../../../shared/constants/routes";
import {
  createAdminNailSurface,
  formatNailSurfaceCurrency,
  formatNailSurfaceDuration,
} from "../services/nailSurfacesManagementService";
import { NailSurfacePreview } from "../components/NailSurfacePreview";
import { NailSurfacePainter } from "../components/NailSurfacePainter";
import { NailSurfaceShaderBuilder } from "../components/NailSurfaceShaderBuilder";
import {
  buildSurfacePayload,
  createEmptySurfaceForm,
  syncSurfaceForm,
} from "../utils/surfaceShaderConfig";

function createEmptyForm() {
  return createEmptySurfaceForm();
}

function validateForm(formValues, language) {
  const isVi = language === "vi";
  if (!String(formValues.name || "").trim()) {
    return isVi ? "Tên bề mặt móng là bắt buộc." : "Nail surface name is required.";
  }

  if (Number(formValues.price) < 0 || Number.isNaN(Number(formValues.price))) {
    return isVi ? "Giá phải là một số hợp lệ." : "Price must be a valid number.";
  }

  if (Number(formValues.duration) <= 0 || Number.isNaN(Number(formValues.duration))) {
    return isVi ? "Thời lượng phải lớn hơn 0." : "Duration must be greater than 0.";
  }

  return "";
}

export function NailSurfaceCreatePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [formValues, setFormValues] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const summaryItems = useMemo(
    () => [
      [t("adminNailSurfacesManagement.surfaceName"), formValues.name],
      [t("adminNailSurfacesManagement.surfaceType"), formValues.surfacePreset],
      [t("adminNailSurfacesManagement.price"), formValues.price ? formatNailSurfaceCurrency(formValues.price) : "--"],
      [t("adminNailSurfacesManagement.duration"), formValues.duration ? formatNailSurfaceDuration(formValues.duration) : "--"],
    ],
    [formValues.duration, formValues.name, formValues.price, formValues.surfacePreset, language],
  );

  const handleFieldChange = (field, value) => {
    setFormValues((current) =>
      syncSurfaceForm({
        ...current,
        [field]: value,
      }),
    );

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmitRequest = () => {
    const validationError = validateForm(formValues, language);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleCreateSurface = async () => {
    setIsSaving(true);

    try {
      const createdSurface = await createAdminNailSurface(buildSurfacePayload(formValues));

      toast.success(language === "vi" ? `Tạo bề mặt ${createdSurface.name} thành công.` : `${createdSurface.name} created successfully.`);
      navigate(getAdminNailSurfaceDetailRoute(createdSurface.nailSurfaceId), {
        state: {
          flashMessage: language === "vi" ? `Bề mặt ${createdSurface.name} đã được tạo thành công.` : `${createdSurface.name} has been created successfully.`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : (t("adminNailSurfacesManagement.failedToCreateNailSurface"));
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
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("adminNailSurfacesManagement.addNewNailSurface")}</h1>
            <p className="text-xs font-medium text-slate-400">
              {t("adminNailSurfacesManagement.createANewNailSurfaceWithShade")}
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
            {t("adminNailSurfacesManagement.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {t("adminNailSurfacesManagement.saveSurface")}
          </button>
        </div>
      </header>

      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminNailSurfacesManagement.nailSurfaceDetails")}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminNailSurfacesManagement.surfaceName")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Layers3 size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(event) => handleFieldChange("name", event.target.value)}
                    placeholder={t("adminNailSurfacesManagement.enterNailSurfaceName")}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminNailSurfacesManagement.price")}</span>
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
                <span className="text-[13px] font-semibold text-slate-600">{t("adminNailSurfacesManagement.duration")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Clock3 size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formValues.duration}
                    onChange={(event) => handleFieldChange("duration", event.target.value)}
                    placeholder={t("adminNailSurfacesManagement.minutes")}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                  />
                </div>
              </label>
            </div>
          </section>

          <NailSurfaceShaderBuilder formValues={formValues} onFieldChange={handleFieldChange} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminNailSurfacesManagement.preview")}
            </h2>

            <div className="space-y-4">
              {formValues.painterMode ? (
                <NailSurfacePainter
                  brushType={formValues.brushType || 'glossy'}
                  brushSize={formValues.brushSize || 20}
                  initialMaskDataUrl={formValues.maskDataUrl}
                  onSave={(dataUrl) => handleFieldChange("maskDataUrl", dataUrl)}
                />
              ) : (
                <NailSurfacePreview surface={formValues} />
              )}

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
        title={t("adminNailSurfacesManagement.cancelNailSurfaceCreation")}
        subtitle={t("adminNailSurfacesManagement.youAreLeavingThisFormWithoutSa")}
        description={t("adminNailSurfacesManagement.allUnsavedNailSurfaceDetailsWi")}
        confirmText={t("adminNailSurfacesManagement.discardChanges")}
        cancelText={t("adminNailSurfacesManagement.keepEditing")}
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminNailSurfaces)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={[t("adminNailSurfacesManagement.thisNewNailSurfaceHasNotBeenCr")]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminNailSurfacesManagement.saveNewNailSurface")}
        subtitle={t("adminNailSurfacesManagement.thisWillCreateTheNailSurfaceIn")}
        description={t("adminNailSurfacesManagement.confirmToAddThisNailSurfaceToT")}
        confirmText={t("adminNailSurfacesManagement.createSurface")}
        cancelText={t("adminNailSurfacesManagement.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreateSurface}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || (t("adminNailSurfacesManagement.newNailSurface"))]}
        details={[
          { label: t("adminNailSurfacesManagement.surfaceType"), value: formValues.surfacePreset },
          { label: t("adminNailSurfacesManagement.price"), value: formValues.price ? formatNailSurfaceCurrency(formValues.price) : "--" },
        ]}
      />
    </section>
  );
}
