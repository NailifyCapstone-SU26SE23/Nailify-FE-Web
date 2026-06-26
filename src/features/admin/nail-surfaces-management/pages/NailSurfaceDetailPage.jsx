import {
  ArrowLeft,
  Clock3,
  Layers3,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  deleteAdminNailSurface,
  fetchAdminNailSurfaceDetail,
  formatNailSurfaceCurrency,
  formatNailSurfaceDuration,
  updateAdminNailSurface,
} from "../services/nailSurfacesManagementService";

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

export function NailSurfaceDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { surfaceId } = useParams();
  const [surface, setSurface] = useState(null);
  const [draft, setDraft] = useState(null);
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

    const loadSurface = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminNailSurfaceDetail(surfaceId);

        if (!isMounted) {
          return;
        }

        setSurface(response);
        setDraft({
          name: response.name,
          shaderParam: response.shaderParam,
          price: String(response.price),
          duration: String(response.duration),
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load nail surface detail.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSurface();

    return () => {
      isMounted = false;
    };
  }, [surfaceId]);

  const summaryItems = useMemo(() => {
    if (!surface || !draft) {
      return [];
    }

    return [
      ["Surface ID", String(surface.nailSurfaceId)],
      ["Surface Name", draft.name || "--"],
      ["Shader Param", draft.shaderParam || "--"],
      ["Price", draft.price ? formatNailSurfaceCurrency(draft.price) : "--"],
      ["Duration", draft.duration ? formatNailSurfaceDuration(draft.duration) : "--"],
    ];
  }, [draft, surface]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleStartEdit = () => {
    if (!surface) {
      return;
    }

    setDraft({
      name: surface.name,
      shaderParam: surface.shaderParam,
      price: String(surface.price),
      duration: String(surface.duration),
    });
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!surface) {
      return;
    }

    setDraft({
      name: surface.name,
      shaderParam: surface.shaderParam,
      price: String(surface.price),
      duration: String(surface.duration),
    });
    setError("");
    setIsEditing(false);
  };

  const handleRequestSave = () => {
    const validationError = validateForm(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleSave = async () => {
    if (!surface || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedSurface = await updateAdminNailSurface(surface.nailSurfaceId, {
        ...draft,
        price: Number(draft.price),
        duration: Number(draft.duration),
      });

      setSurface(updatedSurface);
      setDraft({
        name: updatedSurface.name,
        shaderParam: updatedSurface.shaderParam,
        price: String(updatedSurface.price),
        duration: String(updatedSurface.duration),
      });
      setIsEditing(false);
      toast.success(`${updatedSurface.name} updated successfully.`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to update nail surface.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!surface) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminNailSurface(surface.nailSurfaceId);
      toast.success(`${surface.name} deleted successfully.`);
      navigate(ROUTES.adminNailSurfaces, {
        state: {
          flashMessage: `${surface.name} has been deleted successfully.`,
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete nail surface.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isLoading && !surface) {
    return <Navigate to={ROUTES.adminNailSurfaces} replace />;
  }

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
            <h1 className="text-2xl font-black tracking-tight text-[#cf3d74]">Nail Surface Detail</h1>
            <p className="text-xs font-medium text-slate-400">
              Review, edit, and delete this nail surface from one page.
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
            Delete Surface
          </button>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestSave}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
              >
                <Save size={14} />
                Save Changes
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
              Edit Surface
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
          <div className="text-center text-sm text-slate-600">Loading nail surface details...</div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              Nail Surface Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">Surface Name</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Layers3 size={14} className="shrink-0 text-rose-300" />
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
                <span className="text-[13px] font-semibold text-slate-600">Shader Param</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Sparkles size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={draft?.shaderParam || ""}
                    onChange={(event) => handleFieldChange("shaderParam", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
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
                    value={draft?.price || ""}
                    onChange={(event) => handleFieldChange("price", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
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
                    value={draft?.duration || ""}
                    onChange={(event) => handleFieldChange("duration", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </div>
              </label>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
              <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
                <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
                Summary
              </h2>

              <div className="space-y-4">
                <div className="flex h-48 items-center justify-center rounded-2xl border border-rose-100 bg-[#fff8fb]">
                  <div className="text-center text-sm font-medium text-slate-400">
                    <Upload size={24} className="mx-auto mb-3 text-rose-300" />
                    Shader configuration preview
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
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save Nail Surface Changes"
        subtitle="This will update the nail surface in backend."
        description="Confirm to save the latest changes to this nail surface."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || surface?.name || "Nail surface"]}
        details={[
          { label: "Shader Param", value: draft?.shaderParam || "--" },
          { label: "Price", value: draft?.price ? formatNailSurfaceCurrency(draft.price) : "--" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete Nail Surface"
        subtitle="This will permanently remove the nail surface from backend."
        description={`You are about to delete ${surface?.name || "this nail surface"}. This action cannot be undone.`}
        confirmText="Delete Surface"
        cancelText="Keep Surface"
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          surface
            ? {
                title: surface.name,
                meta: `${surface.shaderParam} • ${surface.priceLabel}`,
                note: `Surface ID: ${surface.nailSurfaceId}`,
              }
            : null
        }
        warnings={["This action calls the backend delete endpoint and removes the record permanently."]}
      />
    </section>
  );
}
