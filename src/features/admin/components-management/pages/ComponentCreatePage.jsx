import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ArrowLeft,
  Clock3,
  Gem,
  Image as ImageIcon,
  Save,
  Shapes,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminComponentDetailRoute } from "../../../../shared/constants/routes";
import {
  COMPONENT_TYPE_OPTIONS,
  createAdminComponent,
  formatComponentCurrency,
  formatComponentDuration,
} from "../services/componentsManagementService";
import { Image } from "antd";

function createEmptyForm() {
  return {
    name: "",
    componentType: COMPONENT_TYPE_OPTIONS[0],
    price: "",
    duration: "",
    image: null,
  };
}

function validateForm(formValues, t) {
  if (!String(formValues.name || "").trim()) {
    return t("adminComponents.nameRequired");
  }

  if (!String(formValues.componentType || "").trim()) {
    return t("adminComponents.typeRequired");
  }

  if (Number(formValues.price) < 0 || Number.isNaN(Number(formValues.price))) {
    return t("adminComponents.priceInvalid");
  }

  if (Number(formValues.duration) < 0 || Number.isNaN(Number(formValues.duration))) {
    return t("adminComponents.durationInvalid");
  }

  return "";
}

export function ComponentCreatePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createEmptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const summaryItems = useMemo(
    () => [
      [t("adminComponents.componentName"), formValues.name || "--"],
      [t("adminComponents.type"), formValues.componentType || "--"],
      [t("adminComponents.price"), formValues.price ? formatComponentCurrency(formValues.price) : "--"],
      [t("adminComponents.duration"), formValues.duration ? formatComponentDuration(formValues.duration) : "--"],
    ],
    [formValues.componentType, formValues.duration, formValues.name, formValues.price],
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

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    handleFieldChange("image", file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmitRequest = () => {
    const validationError = validateForm(formValues, t);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleCreateComponent = async () => {
    setIsSaving(true);

    try {
      const createdComponent = await createAdminComponent({
        ...formValues,
        price: Number(formValues.price),
        duration: Number(formValues.duration),
      });

      toast.success(t("adminComponents.createSuccess", { name: createdComponent.name }));
      navigate(getAdminComponentDetailRoute(createdComponent.componentId), {
        state: {
          flashMessage: t("adminComponents.createFlashSuccess", { name: createdComponent.name }),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("adminComponents.createFailed");
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
            to={ROUTES.adminComponents}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("adminComponents.addNewComponent")}</h1>
            <p className="text-xs font-medium text-slate-400">
              {t("adminComponents.addNewComponentDesc")}
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
            {t("adminComponents.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {t("adminComponents.saveComponent")}
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
            {t("adminComponents.componentDetails")}
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">{t("adminComponents.componentName")}</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Shapes size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder={t("adminComponents.enterComponentName")}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">{t("adminComponents.componentType")}</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Gem size={14} className="shrink-0 text-rose-300" />
                <select
                  value={formValues.componentType}
                  onChange={(event) => handleFieldChange("componentType", event.target.value)}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none"
                >
                  {COMPONENT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
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
                  placeholder={t("adminComponents.pricePlaceholder")}
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
                  min="0"
                  step="1"
                  value={formValues.duration}
                  onChange={(event) => handleFieldChange("duration", event.target.value)}
                  placeholder={t("adminComponents.minutes")}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5 md:col-span-2">
              <span className="text-[13px] font-semibold text-slate-600">{t("adminComponents.previewImage")}</span>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-gradient-to-br from-[#fffafc] to-[#fff5f9] px-6 py-8 transition hover:border-rose-300 hover:shadow-[0_8px_24px_rgba(226,93,143,0.12)]">
                {imagePreview ? (
                  <Image
                    crossOrigin="anonymous"
                    src={imagePreview}
                    alt="Component preview"
                    className="h-48 w-full rounded-2xl object-cover shadow-lg"
                  />
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] text-white shadow-lg">
                      <Upload size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-slate-700">{t("adminComponents.clickUploadImage")}</p>
                      <p className="mt-1 text-xs text-slate-400">{t("adminComponents.uploadFormat")}</p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </label>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminComponents.preview")}
            </h2>

            <div className="space-y-4">
              <div className="flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-[#fff8fb]">
                {imagePreview ? (
                  <img crossOrigin="anonymous" src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-sm font-medium text-slate-400">
                    <ImageIcon size={24} className="mx-auto mb-3 text-rose-300" />
                    {t("adminComponents.noImageSelected")}
                  </div>
                )}
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
        title={t("adminComponents.cancelCreateTitle")}
        subtitle={t("adminComponents.cancelCreateSubtitle")}
        description={t("adminComponents.cancelCreateDesc")}
        confirmText={t("adminComponents.discardChanges")}
        cancelText={t("adminComponents.keepEditing")}
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminComponents)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={["This new component has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminComponents.saveNewComponentTitle")}
        subtitle={t("adminComponents.saveNewComponentSubtitle")}
        description={t("adminComponents.saveNewComponentDesc")}
        confirmText={t("adminComponents.createComponent")}
        cancelText={t("adminComponents.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreateComponent}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || "New component"]}
        details={[
          { label: "Type", value: formValues.componentType || "--" },
          { label: "Price", value: formValues.price ? formatComponentCurrency(formValues.price) : "--" },
        ]}
      />
    </section>
  );
}
