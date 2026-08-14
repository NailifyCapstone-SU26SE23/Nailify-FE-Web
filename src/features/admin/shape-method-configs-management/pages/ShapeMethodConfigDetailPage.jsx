import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ArrowLeft,
  Clock,
  Coins,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Save,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  fetchAdminShapeMethodConfigDetail,
  updateAdminShapeMethodConfig,
  deleteAdminShapeMethodConfig,
} from "../services/shapeMethodConfigsManagementService";
import { fetchAdminNailShapes } from "../../nail-shapes-management/services/nailShapesManagementService";
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

export function ShapeMethodConfigDetailPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { configId } = useParams();

  const [config, setConfig] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [formError, setFormError] = useState("");

  const [nailShapes, setNailShapes] = useState([]);
  const [isLoadingShapes, setIsLoadingShapes] = useState(true);

  useEffect(() => {
    fetchAdminNailShapes({ pageNumber: 1, pageSize: 100 })
      .then((res) => setNailShapes(res.items))
      .catch((err) => console.error("Failed to load nail shapes", err))
      .finally(() => setIsLoadingShapes(false));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      try {
        const data = await fetchAdminShapeMethodConfigDetail(configId);
        if (!isMounted) return;

        setConfig(data);
        setDraft({
          name: data.name,
          nailShapeId: data.nailShapeId,
          price: data.price,
          duration: data.duration,
          status: data.status,
        });
      } catch (error) {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : t("adminShapeMethodConfigs.loadDetailFailed"));
          navigate(ROUTES.adminShapeMethodConfigs, { replace: true });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, [configId, navigate, t]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleStartEdit = () => {
    if (!config) return;
    setDraft({
      name: config.name,
      nailShapeId: config.nailShapeId,
      price: config.price,
      duration: config.duration,
      status: config.status,
    });
    setFormError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!config) return;
    setDraft({
      name: config.name,
      nailShapeId: config.nailShapeId,
      price: config.price,
      duration: config.duration,
      status: config.status,
    });
    setFormError("");
    setIsEditing(false);
  };

  const handleRequestSave = () => {
    const validationError = validateForm(draft, language);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleSave = async () => {
    if (!config || !draft) return;
    setIsSaving(true);

    try {
      const updatedConfig = await updateAdminShapeMethodConfig(configId, {
        name: String(draft.name).trim(),
        nailShapeId: Number(draft.nailShapeId),
        price: Number(draft.price),
        duration: Number(draft.duration),
        status: draft.status,
      });

      setConfig(updatedConfig);
      setDraft({
        name: updatedConfig.name,
        nailShapeId: updatedConfig.nailShapeId,
        price: updatedConfig.price,
        duration: updatedConfig.duration,
        status: updatedConfig.status,
      });
      setIsEditing(false);
      toast.success(t("adminShapeMethodConfigs.updateSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("adminShapeMethodConfigs.updateFailed");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!config) return;
    setIsDeleting(true);

    try {
      await deleteAdminShapeMethodConfig(configId);
      toast.success(t("adminShapeMethodConfigs.deleteSuccess"));
      navigate(ROUTES.adminShapeMethodConfigs, {
        replace: true,
        state: { flashMessage: t("adminShapeMethodConfigs.deleteFlashSuccess") },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("adminShapeMethodConfigs.deleteFailed");
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const selectedShape = useMemo(() => {
    return nailShapes.find((shape) => String(shape.nailShapeId) === String(draft?.nailShapeId));
  }, [nailShapes, draft?.nailShapeId]);

  const summaryItems = useMemo(
    () => [
      [t("adminShapeMethodConfigs.methodName"), draft?.name || "--"],
      [t("adminShapeMethodConfigs.nailShape"), selectedShape ? selectedShape.name : t("adminShapeMethodConfigs.notSelected")],
      [t("adminShapeMethodConfigs.priceVnd"), draft?.price ? formatCurrency(Number(draft.price)) : "--"],
      [t("adminShapeMethodConfigs.durationMins"), draft?.duration ? `${draft.duration} ${t("adminShapeMethodConfigs.mins")}` : "--"],
      [t("adminShapeMethodConfigs.status"), draft?.status === "Active" ? t("adminShapeMethodConfigs.active") : t("adminShapeMethodConfigs.inactive")],
    ],
    [draft?.name, draft?.price, draft?.duration, draft?.status, selectedShape, t],
  );

  if (!configId) {
    return <Navigate to={ROUTES.adminShapeMethodConfigs} replace />;
  }

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
              {t("adminShapeMethodConfigs.configDetails")}
            </h1>
            <p className="text-xs font-medium text-slate-400">
              {t("adminShapeMethodConfigs.detailPageDesc")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={14} />
            {t("adminShapeMethodConfigs.deleteConfig")}
          </button>

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
              >
                <X size={14} />
                {t("adminShapeMethodConfigs.cancel")}
              </button>
              <button
                type="button"
                onClick={handleRequestSave}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
              >
                <Save size={14} />
                {t("adminShapeMethodConfigs.saveChanges")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil size={14} />
              {t("adminShapeMethodConfigs.editConfig")}
            </button>
          )}
        </div>
      </header>

      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {formError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[24px] bg-white/80 p-8 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
          <div className="flex items-center gap-3 text-[#cd98b1]">
            <LoaderCircle size={24} className="animate-spin text-[#ea4f93]" />
            <span className="font-semibold tracking-wide">{t("adminShapeMethodConfigs.loadingConfigDetails")}</span>
          </div>
        </div>
      ) : (
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
                <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3.5 ${isEditing ? "border-rose-100 bg-[#fff8fb]" : "border-slate-100 bg-slate-50/50"}`}>
                  <FileText size={14} className={`shrink-0 ${isEditing ? "text-rose-300" : "text-slate-400"}`} />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={draft.name}
                    onChange={(event) => handleFieldChange("name", event.target.value)}
                    placeholder="e.g. Gắn móng giả (Tip)"
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300 disabled:cursor-default"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {t("adminShapeMethodConfigs.nailShape")} <span className="text-[#ea4f93]">*</span>
                </span>
                <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${isEditing ? "border-rose-100 bg-[#fff8fb]" : "border-slate-100 bg-slate-50/50"}`}>
                  <Shapes size={14} className={`shrink-0 ${isEditing ? "text-rose-300" : "text-slate-400"}`} />
                  <select
                    disabled={!isEditing || isLoadingShapes}
                    value={draft.nailShapeId}
                    onChange={(event) => handleFieldChange("nailShapeId", event.target.value)}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300 disabled:opacity-80 disabled:cursor-default"
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
                  <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3.5 ${isEditing ? "border-rose-100 bg-[#fff8fb]" : "border-slate-100 bg-slate-50/50"}`}>
                    <Coins size={14} className={`shrink-0 ${isEditing ? "text-rose-300" : "text-slate-400"}`} />
                    <input
                      type="number"
                      disabled={!isEditing}
                      min="0"
                      step="1000"
                      value={draft.price}
                      onChange={(event) => handleFieldChange("price", event.target.value)}
                      placeholder="e.g. 250000"
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300 disabled:cursor-default"
                    />
                  </div>
                </label>

                <label className="space-y-2.5">
                  <span className="text-[13px] font-semibold text-slate-600">
                    {t("adminShapeMethodConfigs.durationMins")} <span className="text-[#ea4f93]">*</span>
                  </span>
                  <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3.5 ${isEditing ? "border-rose-100 bg-[#fff8fb]" : "border-slate-100 bg-slate-50/50"}`}>
                    <Clock size={14} className={`shrink-0 ${isEditing ? "text-rose-300" : "text-slate-400"}`} />
                    <input
                      type="number"
                      disabled={!isEditing}
                      min="1"
                      value={draft.duration}
                      onChange={(event) => handleFieldChange("duration", event.target.value)}
                      placeholder="e.g. 60"
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300 disabled:cursor-default"
                    />
                  </div>
                </label>
              </div>

              <div className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">
                  {t("adminShapeMethodConfigs.status")}
                </span>
                <div className="flex gap-4 p-1">
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 transition ${draft.status === "Active" ? "border-emerald-200 bg-emerald-50/50 text-emerald-700 font-bold" : "border-slate-100 bg-slate-50/50 text-slate-400"} ${!isEditing ? "cursor-default opacity-85" : ""}`}>
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      disabled={!isEditing}
                      checked={draft.status === "Active"}
                      onChange={(event) => handleFieldChange("status", event.target.value)}
                      className="accent-rose-500 disabled:opacity-50"
                    />
                    <span className="text-[14px]">
                      {t("adminShapeMethodConfigs.active")}
                    </span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 transition ${draft.status === "Inactive" ? "border-rose-200 bg-rose-50/50 text-rose-700 font-bold" : "border-slate-100 bg-slate-50/50 text-slate-400"} ${!isEditing ? "cursor-default opacity-85" : ""}`}>
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      disabled={!isEditing}
                      checked={draft.status === "Inactive"}
                      onChange={(event) => handleFieldChange("status", event.target.value)}
                      className="accent-rose-500 disabled:opacity-50"
                    />
                    <span className="text-[14px]">
                      {t("adminShapeMethodConfigs.inactive")}
                    </span>
                  </label>
                </div>
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
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminShapeMethodConfigs.saveConfigChanges")}
        subtitle={t("adminShapeMethodConfigs.thisWillUpdateTheConfigInBa")}
        description={t("adminShapeMethodConfigs.confirmToSaveTheLatestChanges")}
        confirmText={t("adminShapeMethodConfigs.saveChanges")}
        cancelText={t("adminShapeMethodConfigs.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || config?.name || t("adminShapeMethodConfigs.newMethodConfig")]}
        details={[]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title={t("adminShapeMethodConfigs.deleteConfigTitle")}
        subtitle={t("adminShapeMethodConfigs.thisWillPermanentlyRemoveTheConfig")}
        description={language === "vi" ? `Bạn chuẩn bị xóa cấu hình ${config?.name || ""}. Hành động này không thể hoàn tác.` : `You are about to delete config ${config?.name || ""}. This action cannot be undone.`}
        confirmText={t("adminShapeMethodConfigs.deleteConfig")}
        cancelText={t("adminShapeMethodConfigs.keepConfig")}
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          selectedShape
            ? {
              image: selectedShape.imageUrl || undefined,
              title: draft?.name || config?.name || "",
              meta: draft?.price ? formatCurrency(Number(draft.price)) : "",
              note: `ID: ${configId}`,
            }
            : null
        }
        warnings={[t("adminShapeMethodConfigs.thisActionCallsTheBackendDelete")]}
      />
    </section>
  );
}
