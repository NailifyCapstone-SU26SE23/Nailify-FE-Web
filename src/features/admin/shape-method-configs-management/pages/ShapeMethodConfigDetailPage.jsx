import { ArrowLeft, LoaderCircle, Save, Sliders, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  fetchAdminShapeMethodConfigDetail,
  updateAdminShapeMethodConfig,
  deleteAdminShapeMethodConfig,
} from "../services/shapeMethodConfigsManagementService";
import { fetchAdminNailShapes } from "../../nail-shapes-management/services/nailShapesManagementService";

export function ShapeMethodConfigDetailPage() {
  const navigate = useNavigate();
  const { configId } = useParams();
  
  const [config, setConfig] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState({});

  const [nailShapes, setNailShapes] = useState([]);
  const [isLoadingShapes, setIsLoadingShapes] = useState(true);

  useEffect(() => {
    fetchAdminNailShapes({ pageNumber: 1, pageSize: 100 })
      .then(res => setNailShapes(res.items))
      .catch(err => console.error("Failed to load nail shapes"))
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
          toast.error(error instanceof Error ? error.message : "Failed to load shape method config details.");
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
  }, [configId, navigate]);

  if (!configId) {
    return <Navigate to={ROUTES.adminShapeMethodConfigs} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!String(draft.name || "").trim()) newErrors.name = "Name is required.";
    if (!draft.nailShapeId) newErrors.nailShapeId = "Nail shape is required.";
    
    const priceNum = Number(draft.price);
    if (!draft.price || isNaN(priceNum) || priceNum < 0) {
      newErrors.price = "Price must be a valid positive number.";
    }

    const durationNum = Number(draft.duration);
    if (!draft.duration || isNaN(durationNum) || durationNum <= 0) {
      newErrors.duration = "Duration must be greater than 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    const toastId = toast.loading("Updating shape method config...");

    try {
      const updatedData = await updateAdminShapeMethodConfig(configId, {
        name: String(draft.name).trim(),
        nailShapeId: Number(draft.nailShapeId),
        price: Number(draft.price),
        duration: Number(draft.duration),
        status: draft.status,
      });

      setConfig(updatedData);
      setDraft({
        name: updatedData.name,
        nailShapeId: updatedData.nailShapeId,
        price: updatedData.price,
        duration: updatedData.duration,
        status: updatedData.status,
      });
      toast.success("Shape method config updated successfully.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update config.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    const toastId = toast.loading("Deleting shape method config...");

    try {
      await deleteAdminShapeMethodConfig(configId);
      toast.success("Config deleted successfully.", { id: toastId });
      navigate(ROUTES.adminShapeMethodConfigs, {
        replace: true,
        state: { flashMessage: "Shape method config deleted successfully." },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete config.", { id: toastId });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const hasChanges = Boolean(
    config &&
      draft &&
      (
        config.name !== draft.name ||
        config.nailShapeId !== Number(draft.nailShapeId) ||
        config.price !== Number(draft.price) ||
        config.duration !== Number(draft.duration) ||
        config.status !== draft.status
      )
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-[#cd98b1]">
          <LoaderCircle size={24} className="animate-spin text-[#ea4f93]" />
          <span className="font-semibold tracking-wide">Loading config details...</span>
        </div>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to={ROUTES.adminShapeMethodConfigs}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#cd98b1] transition-colors hover:text-[#ea4f93]"
        >
          <ArrowLeft size={16} />
          Back to Configs
        </Link>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
        >
          <Trash2 size={14} />
          Delete Config
        </button>
      </div>

      <form onSubmit={handleUpdate} className="overflow-hidden rounded-[24px] border border-[#f8dce8] bg-white shadow-[0_12px_32px_rgba(236,72,153,0.05)]">
        <div className="border-b border-[#fdebf3] bg-[#fffafc] px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#ffe4ef_0%,#ffd977_100%)] text-[#9c2f63] shadow-inner">
              <Sliders size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#432744]">Config Details</h1>
              <p className="mt-1 text-sm font-medium text-[#b58a9f]">Update shape method config information</p>
            </div>
          </div>

          <div className="flex gap-2 text-xs font-semibold text-[#cd98b1]">
             ID: <span className="text-[#ea4f93]">{configId}</span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-bold text-[#5f4a5c]">
                  Method Name <span className="text-[#ea4f93]">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={draft.name}
                  onChange={handleChange}
                  className={`h-12 w-full rounded-xl border bg-[#fffafc] px-4 text-[15px] font-medium text-[#432744] shadow-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                    errors.name
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-[#f4dbe7] focus:border-[#ea4f93] focus:ring-[#ea4f93]/10"
                  }`}
                />
                {errors.name && <p className="mt-2 text-xs font-semibold text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="nailShapeId" className="mb-2 block text-sm font-bold text-[#5f4a5c]">
                  Nail Shape <span className="text-[#ea4f93]">*</span>
                </label>
                <select
                  id="nailShapeId"
                  name="nailShapeId"
                  value={draft.nailShapeId}
                  onChange={handleChange}
                  disabled={isLoadingShapes}
                  className={`h-12 w-full rounded-xl border bg-[#fffafc] px-4 text-[15px] font-medium text-[#432744] shadow-sm outline-none transition-all focus:bg-white focus:ring-4 disabled:opacity-60 ${
                    errors.nailShapeId
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-[#f4dbe7] focus:border-[#ea4f93] focus:ring-[#ea4f93]/10"
                  }`}
                >
                  <option value="">Select a nail shape...</option>
                  {nailShapes.map((shape) => (
                    <option key={shape.nailShapeId} value={shape.nailShapeId}>
                      {shape.name}
                    </option>
                  ))}
                </select>
                {errors.nailShapeId && <p className="mt-2 text-xs font-semibold text-red-500">{errors.nailShapeId}</p>}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="price" className="mb-2 block text-sm font-bold text-[#5f4a5c]">
                    Price (VND) <span className="text-[#ea4f93]">*</span>
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={draft.price}
                    onChange={handleChange}
                    className={`h-12 w-full rounded-xl border bg-[#fffafc] px-4 text-[15px] font-medium text-[#432744] shadow-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                      errors.price
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : "border-[#f4dbe7] focus:border-[#ea4f93] focus:ring-[#ea4f93]/10"
                    }`}
                  />
                  {errors.price && <p className="mt-2 text-xs font-semibold text-red-500">{errors.price}</p>}
                </div>

                <div>
                  <label htmlFor="duration" className="mb-2 block text-sm font-bold text-[#5f4a5c]">
                    Duration (Mins) <span className="text-[#ea4f93]">*</span>
                  </label>
                  <input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={draft.duration}
                    onChange={handleChange}
                    className={`h-12 w-full rounded-xl border bg-[#fffafc] px-4 text-[15px] font-medium text-[#432744] shadow-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                      errors.duration
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : "border-[#f4dbe7] focus:border-[#ea4f93] focus:ring-[#ea4f93]/10"
                    }`}
                  />
                  {errors.duration && <p className="mt-2 text-xs font-semibold text-red-500">{errors.duration}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:border-l lg:border-[#fdebf3] lg:pl-8">
              <div>
                <label className="mb-3 block text-sm font-bold text-[#5f4a5c]">Status</label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={draft.status === "Active"}
                      onChange={handleChange}
                      className="text-[#ea4f93] focus:ring-[#ea4f93]"
                    />
                    <span className="text-sm font-semibold text-[#432744]">Active</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={draft.status === "Inactive"}
                      onChange={handleChange}
                      className="text-[#ea4f93] focus:ring-[#ea4f93]"
                    />
                    <span className="text-sm font-semibold text-[#432744]">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#fdebf3] bg-[#fffafc] px-6 py-5 md:px-8">
          {hasChanges && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setDraft({
                  name: config.name,
                  nailShapeId: config.nailShapeId,
                  price: config.price,
                  duration: config.duration,
                  status: config.status,
                });
                setErrors({});
              }}
              className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold text-[#5f4a5c] transition-colors hover:bg-[#fce9f2] hover:text-[#ea4f93]"
            >
              Discard Changes
            </button>
          )}

          <button
            type="submit"
            disabled={!hasChanges || isSaving}
            className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(236,72,153,0.35)] disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
          >
            {isSaving ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {showDeleteModal && (
        <ActionConfirmModal
          isOpen
          title="Delete Config"
          description={`Are you sure you want to delete "${config.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          icon={Trash2}
          isDestructive
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
            }
          }}
        />
      )}
    </div>
  );
}
