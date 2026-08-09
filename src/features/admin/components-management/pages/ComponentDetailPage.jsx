import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ArrowLeft,
  Clock3,
  Gem,
  Image as ImageIcon,
  Pencil,
  Save,
  Shapes,
  Upload,
  Wallet,
  X,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  COMPONENT_TYPE_OPTIONS,
  deleteAdminComponent,
  fetchAdminComponentDetail,
  formatComponentCurrency,
  formatComponentDuration,
  updateAdminComponent,
} from "../services/componentsManagementService";
import { Image } from "antd";

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

export function ComponentDetailPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { componentId } = useParams();
  const [component, setComponent] = useState(null);
  const [draft, setDraft] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(Boolean(location.state?.startInEdit));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  useEffect(() => {
    if (!location.state?.flashMessage && !location.state?.startInEdit) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminComponentDetail(componentId);

        if (!isMounted) {
          return;
        }

        setComponent(response);
        setDraft({
          name: response.name,
          componentType: response.componentType,
          price: String(response.price),
          duration: String(response.duration),
          image: null,
        });
        setImagePreview(response.imageUrl || "");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : t("adminComponents.loadDetailFailed"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadComponent();

    return () => {
      isMounted = false;
    };
  }, [componentId]);

  const summaryItems = useMemo(() => {
    if (!component || !draft) {
      return [];
    }

    return [
      [t("adminComponents.componentIdLabel"), String(component.componentId)],
      [t("adminComponents.componentName"), draft.name || "--"],
      [t("adminComponents.type"), draft.componentType || "--"],
      [t("adminComponents.price"), draft.price ? formatComponentCurrency(draft.price) : "--"],
      [t("adminComponents.duration"), draft.duration ? formatComponentDuration(draft.duration) : "--"],
    ];
  }, [component, draft]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setDraft((current) => ({
      ...current,
      image: file,
    }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleStartEdit = () => {
    if (!component) {
      return;
    }

    setDraft({
      name: component.name,
      componentType: component.componentType,
      price: String(component.price),
      duration: String(component.duration),
      image: null,
    });
    setImagePreview(component.imageUrl || "");
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!component) {
      return;
    }

    setDraft({
      name: component.name,
      componentType: component.componentType,
      price: String(component.price),
      duration: String(component.duration),
      image: null,
    });
    setImagePreview(component.imageUrl || "");
    setError("");
    setIsEditing(false);
  };

  const handleRequestSave = () => {
    const validationError = validateForm(draft, t);

    if (validationError) {
      setError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleSave = async () => {
    if (!component || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedComponent = await updateAdminComponent(component.componentId, {
        ...draft,
        price: Number(draft.price),
        duration: Number(draft.duration),
      });

      setComponent(updatedComponent);
      setDraft({
        name: updatedComponent.name,
        componentType: updatedComponent.componentType,
        price: String(updatedComponent.price),
        duration: String(updatedComponent.duration),
        image: null,
      });
      setImagePreview(updatedComponent.imageUrl || imagePreview);
      setIsEditing(false);
      toast.success(t("adminComponents.updateSuccess", { name: updatedComponent.name }));
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t("adminComponents.updateFailed");
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!component) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminComponent(component.componentId);
      toast.success(t("adminComponents.deleteSuccess", { name: component.name }));
      navigate(ROUTES.adminComponents, {
        state: {
          flashMessage: t("adminComponents.deleteFlashSuccess", { name: component.name }),
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : t("adminComponents.deleteFailed");
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isLoading && !component) {
    return <Navigate to={ROUTES.adminComponents} replace />;
  }

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
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("adminComponents.componentDetail")}</h1>
            <p className="text-xs font-medium text-slate-400">
              {t("adminComponents.componentDetailDesc")}
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
            {t("adminComponents.deleteComponent")}
          </button>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
              >
                <X size={14} />
                {t("adminComponents.cancel")}
              </button>
              <button
                type="button"
                onClick={handleRequestSave}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
              >
                <Save size={14} />
                {t("adminComponents.saveChanges")}
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
              {t("adminComponents.editComponent")}
            </button>
          )}
        </div>
      </header>

      {flashMessage ? (
        <div className="rounded-[16px] border border-[#d8f5e7] bg-[#eefcf5] px-4 py-3 text-sm font-medium text-[#16975f]">
          {flashMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[24px] bg-white/80 p-8 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
          <div className="text-center text-sm text-slate-600">{t("adminComponents.loadingDetails")}</div>
        </div>
      ) : (
        <div className="grid gap-4 ">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminComponents.componentInformation")}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminComponents.componentName")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Shapes size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={draft?.name || ""}
                    onChange={(event) => handleFieldChange("name", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminComponents.componentType")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Gem size={14} className="shrink-0 text-rose-300" />
                  <select
                    value={draft?.componentType || COMPONENT_TYPE_OPTIONS[0]}
                    onChange={(event) => handleFieldChange("componentType", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
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
                <span className="text-[13px] font-semibold text-slate-600">{t("adminComponents.price")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Wallet size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={draft?.price || ""}
                    onChange={(event) => handleFieldChange("price", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminComponents.duration")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Clock3 size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={draft?.duration || ""}
                    onChange={(event) => handleFieldChange("duration", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </div>
              </label>

              <label className="space-y-2.5 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminComponents.previewImage")}</span>
                <label
                  className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 px-6 py-8 ${isEditing
                    ? "cursor-pointer bg-gradient-to-br from-[#fffafc] to-[#fff5f9] transition hover:border-rose-300 hover:shadow-[0_8px_24px_rgba(226,93,143,0.12)]"
                    : "bg-gradient-to-br from-[#fffafc] to-[#fff5f9]"
                    }`}
                >
                  {imagePreview ? (
                    <Image
                      crossOrigin="anonymous"
                      src={imagePreview}
                      alt="Component preview"
                      className="h-48 w-full rounded-2xl object-cover shadow-lg"
                      style={{ objectFit: "cover", height: "12rem", width: "100%", borderRadius: "1rem" }}
                    />
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] text-white shadow-lg">
                        <Upload size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-slate-700">
                          {isEditing ? t("adminComponents.clickUploadImage") : t("adminComponents.noPreviewImage")}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{t("adminComponents.uploadFormat")}</p>
                      </div>
                    </>
                  )}
                  {isEditing ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  ) : null}
                </label>
              </label>
            </div>
          </section>

        </div>
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminComponents.saveChangesTitle")}
        subtitle={t("adminComponents.saveChangesSubtitle")}
        description={t("adminComponents.saveChangesDesc")}
        confirmText={t("adminComponents.saveChanges")}
        cancelText={t("adminComponents.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || component?.name || "Component"]}
        details={[
          { label: "Type", value: draft?.componentType || "--" },
          { label: "Price", value: draft?.price ? formatComponentCurrency(draft.price) : "--" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title={t("adminComponents.deleteComponentTitle")}
        subtitle={t("adminComponents.deleteConfirmSubtitle")}
        description={t("adminComponents.deleteConfirmDesc", { name: component?.name || "this component" })}
        confirmText={t("adminComponents.deleteComponent")}
        cancelText={t("adminComponents.keepComponent")}
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          component
            ? {
              image: component.imageUrl || undefined,
              title: component.name,
              meta: `${component.componentType} • ${component.priceLabel}`,
              note: `Component ID: ${component.componentId}`,
            }
            : null
        }
        warnings={[t("adminComponents.deleteWarning")]}
      />
    </section>
  );
}
