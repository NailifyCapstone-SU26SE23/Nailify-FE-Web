import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ArrowLeft,
  Clock,
  Coins,
  FileText,
  Image as ImageIcon,
  Save,
  Shapes,
  X,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { createAdminShapeMethodConfig } from "../services/shapeMethodConfigsManagementService";
import { fetchAdminNailShapes } from "../../nail-shapes-management/services/nailShapesManagementService";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";

function validateForm(formValues, language) {
  const isVi = language === "vi";
  if (!String(formValues.name || "").trim()) {
    return isVi ? "Tên phương pháp là bắt buộc." : "Method name is required.";
  }
  if (!formValues.nailShapeId) {
    return isVi ? "Vui lòng chọn dáng móng." : "Please select a nail shape.";
  }

  const priceNum = Number(formValues.price);
  if (!formValues.price || isNaN(priceNum) || priceNum < 0) {
    return isVi ? "Giá phải là một số dương hợp lệ." : "Price must be a valid positive number.";
  }

  const durationNum = Number(formValues.duration);
  if (!formValues.duration || isNaN(durationNum) || durationNum <= 0) {
    return isVi ? "Thời lượng phải lớn hơn 0." : "Duration must be greater than 0.";
  }

  return "";
}

export function ShapeMethodConfigCreatePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [nailShapes, setNailShapes] = useState([]);
  const [isLoadingShapes, setIsLoadingShapes] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formValues, setFormValues] = useState({
    name: "",
    nailShapeId: "",
    price: "",
    duration: "",
  });

  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    fetchAdminNailShapes({ pageNumber: 1, pageSize: 100 })
      .then((res) => setNailShapes(res.items))
      .catch(() => toast.error(t("adminShapeMethodConfigs.loadShapesFailed")))
      .finally(() => setIsLoadingShapes(false));
  }, [t]);

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
    const validationError = validateForm(formValues, language);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleCreateConfig = async () => {
    setIsSaving(true);

    try {
      await createAdminShapeMethodConfig({
        name: formValues.name.trim(),
        nailShapeId: Number(formValues.nailShapeId),
        price: Number(formValues.price),
        duration: Number(formValues.duration),
      });

      toast.success(t("adminShapeMethodConfigs.createSuccess"));
      navigate(ROUTES.adminShapeMethodConfigs, {
        state: { flashMessage: t("adminShapeMethodConfigs.createFlashSuccess") },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("adminShapeMethodConfigs.createFailed");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const selectedShape = useMemo(() => {
    return nailShapes.find((shape) => String(shape.nailShapeId) === String(formValues.nailShapeId));
  }, [nailShapes, formValues.nailShapeId]);

  const summaryItems = useMemo(
    () => [
      [t("adminShapeMethodConfigs.methodName"), formValues.name],
      [t("adminShapeMethodConfigs.nailShape"), selectedShape ? selectedShape.name : t("adminShapeMethodConfigs.notSelected")],
      [t("adminShapeMethodConfigs.priceVnd"), formValues.price ? formatCurrency(Number(formValues.price)) : "--"],
      [t("adminShapeMethodConfigs.durationMins"), formValues.duration ? `${formValues.duration} ${t("adminShapeMethodConfigs.mins")}` : "--"],
    ],
    [formValues.name, formValues.price, formValues.duration, selectedShape, t],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminShapeMethodConfigs}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">
              {t("adminShapeMethodConfigs.createMethodConfig")}
            </h1>
            <p className="text-xs font-medium text-slate-400">
              {t("adminShapeMethodConfigs.createMethodConfigDesc")}
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
            {t("adminShapeMethodConfigs.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {t("adminShapeMethodConfigs.createConfigAction")}
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
            {t("adminShapeMethodConfigs.configDetails")}
          </h2>

          <div className="grid gap-5">
            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">
                {t("adminShapeMethodConfigs.methodName")} <span className="text-[#ea4f93]">*</span>
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <FileText size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder="e.g. Gắn móng giả (Tip)"
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">
                {t("adminShapeMethodConfigs.nailShape")} <span className="text-[#ea4f93]">*</span>
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3">
                <Shapes size={14} className="shrink-0 text-rose-300" />
                <select
                  value={formValues.nailShapeId}
                  onChange={(event) => handleFieldChange("nailShapeId", event.target.value)}
                  disabled={isLoadingShapes}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300 disabled:opacity-60"
                >
                  <option value="" className="bg-white text-slate-700">
                    {t("adminShapeMethodConfigs.selectNailShape")}
                  </option>
                  {nailShapes.map((shape) => (
                    <option key={shape.nailShapeId} value={shape.nailShapeId} className="bg-white text-slate-700">
                      {shape.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {t("adminShapeMethodConfigs.priceVnd")} <span className="text-[#ea4f93]">*</span>
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Coins size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formValues.price}
                    onChange={(event) => handleFieldChange("price", event.target.value)}
                    placeholder="e.g. 250000"
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {t("adminShapeMethodConfigs.durationMins")} <span className="text-[#ea4f93]">*</span>
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Clock size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="1"
                    value={formValues.duration}
                    onChange={(event) => handleFieldChange("duration", event.target.value)}
                    placeholder="e.g. 60"
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                  />
                </div>
              </label>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminShapeMethodConfigs.preview")}
            </h2>

            <div className="space-y-4">
              <div className="flex h-auto min-h-[150px] items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-[#fff8fb]">
                {selectedShape?.imageUrl ? (
                  <img
                    crossOrigin="anonymous"
                    src={selectedShape.imageUrl}
                    alt="Selected shape preview"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center text-sm font-medium text-slate-400">
                    <ImageIcon size={24} className="mx-auto mb-3 text-rose-300" />
                    {t("adminShapeMethodConfigs.notSelected")}
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
        title={t("adminShapeMethodConfigs.cancelConfigCreation")}
        subtitle={t("adminShapeMethodConfigs.youAreLeavingThisFormWithoutSaving")}
        description={t("adminShapeMethodConfigs.allUnsavedMethodConfigDetailsWillBeLost")}
        confirmText={t("adminShapeMethodConfigs.discardChanges")}
        cancelText={t("adminShapeMethodConfigs.keepEditing")}
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminShapeMethodConfigs)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={[t("adminShapeMethodConfigs.thisNewMethodConfigHasNotBeenCreated")]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminShapeMethodConfigs.saveNewMethodConfig")}
        subtitle={t("adminShapeMethodConfigs.thisWillCreateTheMethodConfigInDatabase")}
        description={t("adminShapeMethodConfigs.confirmToAddThisMethodConfig")}
        confirmText={t("adminShapeMethodConfigs.createConfigAction")}
        cancelText={t("adminShapeMethodConfigs.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreateConfig}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || t("adminShapeMethodConfigs.newMethodConfig")]}
        details={[]}
      />
    </section>
  );
}
