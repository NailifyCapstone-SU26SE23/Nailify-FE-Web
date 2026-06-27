import {
  ArrowLeft,
  Clock3,
  Image as ImageIcon,
  Pencil,
  Save,
  Shapes,
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
  deleteAdminNailShape,
  fetchAdminNailShapeDetail,
  formatNailShapeCurrency,
  formatNailShapeDuration,
  updateAdminNailShape,
} from "../services/nailShapesManagementService";
import { Image } from "antd";

function validateForm(formValues) {
  if (!String(formValues.name || "").trim()) {
    return "Nail shape name is required.";
  }

  if (Number(formValues.price) < 0 || Number.isNaN(Number(formValues.price))) {
    return "Price must be a valid number.";
  }

  if (Number(formValues.duration) <= 0 || Number.isNaN(Number(formValues.duration))) {
    return "Duration must be greater than 0.";
  }

  return "";
}

export function NailShapeDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { shapeId } = useParams();
  const [shape, setShape] = useState(null);
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

    const loadShape = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminNailShapeDetail(shapeId);

        if (!isMounted) {
          return;
        }

        setShape(response);
        setDraft({
          name: response.name,
          price: String(response.price),
          duration: String(response.duration),
          image: null,
        });
        setImagePreview(response.imageUrl || "");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load nail shape detail.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadShape();

    return () => {
      isMounted = false;
    };
  }, [shapeId]);

  const summaryItems = useMemo(() => {
    if (!shape || !draft) {
      return [];
    }

    return [
      ["Shape ID", String(shape.nailShapeId)],
      ["Shape Name", draft.name || "--"],
      ["Price", draft.price ? formatNailShapeCurrency(draft.price) : "--"],
      ["Duration", draft.duration ? formatNailShapeDuration(draft.duration) : "--"],
    ];
  }, [draft, shape]);

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
    if (!shape) {
      return;
    }

    setDraft({
      name: shape.name,
      price: String(shape.price),
      duration: String(shape.duration),
      image: null,
    });
    setImagePreview(shape.imageUrl || "");
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!shape) {
      return;
    }

    setDraft({
      name: shape.name,
      price: String(shape.price),
      duration: String(shape.duration),
      image: null,
    });
    setImagePreview(shape.imageUrl || "");
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
    if (!shape || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedShape = await updateAdminNailShape(shape.nailShapeId, {
        ...draft,
        price: Number(draft.price),
        duration: Number(draft.duration),
      });

      setShape(updatedShape);
      setDraft({
        name: updatedShape.name,
        price: String(updatedShape.price),
        duration: String(updatedShape.duration),
        image: null,
      });
      setImagePreview(updatedShape.imageUrl || imagePreview);
      setIsEditing(false);
      toast.success(`${updatedShape.name} updated successfully.`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to update nail shape.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!shape) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminNailShape(shape.nailShapeId);
      toast.success(`${shape.name} deleted successfully.`);
      navigate(ROUTES.adminNailShapes, {
        state: {
          flashMessage: `${shape.name} has been deleted successfully.`,
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete nail shape.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isLoading && !shape) {
    return <Navigate to={ROUTES.adminNailShapes} replace />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminNailShapes}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#cf3d74]">Nail Shape Detail</h1>
            <p className="text-xs font-medium text-slate-400">
              Review, edit, and delete this nail shape from one page.
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
            Delete Shape
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
              Edit Shape
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
          <div className="text-center text-sm text-slate-600">Loading nail shape details...</div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              Nail Shape Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">Shape Name</span>
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

              <label className="space-y-2.5 md:col-span-2">
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

              <label className="space-y-2.5 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">Preview Image</span>
                <label
                  className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 px-6 py-8 ${
                    isEditing
                      ? "cursor-pointer bg-gradient-to-br from-[#fffafc] to-[#fff5f9] transition hover:border-rose-300 hover:shadow-[0_8px_24px_rgba(226,93,143,0.12)]"
                      : "bg-gradient-to-br from-[#fffafc] to-[#fff5f9]"
                  }`}
                >
                  {imagePreview ? (
                    <Image
                      crossorigin="anonymous"
                      src={imagePreview}
                      alt="Nail shape preview"
                      className="h-48 w-full rounded-2xl object-cover shadow-lg"
                    />
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] text-white shadow-lg">
                        <Upload size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-slate-700">
                          {isEditing ? "Click to upload shape image" : "No preview image"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 5MB</p>
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

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
              <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
                <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
                Summary
              </h2>

              <div className="space-y-4">
                <div className="flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-[#fff8fb]">
                  {imagePreview ? (
                    <img crossorigin="anonymous" src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center text-sm font-medium text-slate-400">
                      <ImageIcon size={24} className="mx-auto mb-3 text-rose-300" />
                      No image available
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
        title="Save Nail Shape Changes"
        subtitle="This will update the nail shape in backend."
        description="Confirm to save the latest changes to this nail shape."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || shape?.name || "Nail shape"]}
        details={[
          { label: "Price", value: draft?.price ? formatNailShapeCurrency(draft.price) : "--" },
          { label: "Duration", value: draft?.duration ? formatNailShapeDuration(draft.duration) : "--" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete Nail Shape"
        subtitle="This will permanently remove the nail shape from backend."
        description={`You are about to delete ${shape?.name || "this nail shape"}. This action cannot be undone.`}
        confirmText="Delete Shape"
        cancelText="Keep Shape"
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          shape
            ? {
                image: shape.imageUrl || undefined,
                title: shape.name,
                meta: `${shape.priceLabel} • ${shape.durationLabel}`,
                note: `Shape ID: ${shape.nailShapeId}`,
              }
            : null
        }
        warnings={["This action calls the backend delete endpoint and removes the record permanently."]}
      />
    </section>
  );
}
