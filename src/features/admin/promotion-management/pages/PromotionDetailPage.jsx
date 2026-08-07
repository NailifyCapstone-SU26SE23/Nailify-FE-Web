import {
  ArrowLeft,
  BadgePercent,
  ImagePlus,
  Pencil,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminPromotionDetailRoute } from "../../../../shared/constants/routes";
import {
  deleteAdminPromotion,
  fetchAdminPromotionDetail,
  fetchPromotionCategoryOptions,
  fetchPromotionCategoryTypeOptions,
  fetchPromotionNailDesignOptions,
  fetchPromotionsByCategory,
  fetchPromotionsByCategoryType,
  fetchPromotionsByNailDesign,
  PROMOTION_DISCOUNT_TYPE_OPTIONS,
  PROMOTION_SCOPE_OPTIONS,
  PROMOTION_TYPE_OPTIONS,
  updateAdminPromotion,
} from "../services/promotionManagementService";

function toInputDateTime(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const offsetMs = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toApiDateTime(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

function validateForm(formValues) {
  if (!String(formValues.name || "").trim()) {
    return "Promotion name is required.";
  }

  if (!String(formValues.description || "").trim()) {
    return "Promotion description is required.";
  }

  if (!String(formValues.type || "").trim()) {
    return "Promotion type is required.";
  }

  if (!String(formValues.scope || "").trim()) {
    return "Promotion scope is required.";
  }

  if (!String(formValues.discountType || "").trim()) {
    return "Discount type is required.";
  }

  if (!(Number(formValues.discountValue) > 0)) {
    return "Discount value must be greater than 0.";
  }

  if (!formValues.startDate || !formValues.endDate) {
    return "Start date and end date are required.";
  }

  if (new Date(formValues.startDate).getTime() >= new Date(formValues.endDate).getTime()) {
    return "End date must be later than start date.";
  }

  if (formValues.scope === "Category" && !Number(formValues.categoryId)) {
    return "Category is required for category-scoped promotions.";
  }

  if (formValues.scope === "CategoryType" && !Number(formValues.categoryTypeId)) {
    return "Category type is required for category-type-scoped promotions.";
  }

  if (formValues.scope === "NailDesign" && !Number(formValues.nailDesignId)) {
    return "Nail design is required for nail-design-scoped promotions.";
  }

  return "";
}

function FormField({ label, children }) {
  return (
    <label className="space-y-2.5">
      <span className="text-[13px] font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function PanelCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
      <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fff0f7] text-[#cf3d74]">
          <Icon size={16} />
        </div>
        {title}
      </h2>
      {children}
    </section>
  );
}

function mapPromotionToDraft(promotion) {
  return {
    name: promotion?.name || "",
    description: promotion?.description || "",
    type: promotion?.type || "",
    scope: promotion?.scope || "",
    discountType: promotion?.discountType || "",
    discountValue: promotion?.discountValue || "",
    categoryId: promotion?.categoryId || "",
    categoryTypeId: promotion?.categoryTypeId || "",
    nailDesignId: promotion?.nailDesignId || "",
    startDate: toInputDateTime(promotion?.startDate),
    endDate: toInputDateTime(promotion?.endDate),
    usageLimit: promotion?.usageLimit || "",
    userLimit: promotion?.userLimit || "",
    imageFile: null,
  };
}

export function PromotionDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { promotionId } = useParams();
  const [promotion, setPromotion] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(Boolean(location.state?.startInEdit));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const [relatedPromotions, setRelatedPromotions] = useState([]);
  const [isLoadingRelatedPromotions, setIsLoadingRelatedPromotions] = useState(false);
  const [lookupOptions, setLookupOptions] = useState({
    categories: [],
    categoryTypes: [],
    nailDesigns: [],
  });
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!promotionId) {
      navigate(ROUTES.adminPromotions, { replace: true });
    }
  }, [navigate, promotionId]);

  useEffect(() => {
    if (!location.state?.flashMessage && !location.state?.startInEdit) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [promotionResponse, categories, categoryTypes, nailDesigns] = await Promise.all([
          fetchAdminPromotionDetail(promotionId),
          fetchPromotionCategoryOptions(),
          fetchPromotionCategoryTypeOptions(),
          fetchPromotionNailDesignOptions(),
        ]);

        if (!isMounted) {
          return;
        }

        setPromotion(promotionResponse);
        setDraft(mapPromotionToDraft(promotionResponse));
        setLookupOptions({ categories, categoryTypes, nailDesigns });
        setImagePreview(promotionResponse.imageUrl || "");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load promotion detail.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [promotionId]);

  useEffect(() => {
    let isMounted = true;

    const loadRelatedPromotions = async () => {
      if (!promotion) {
        setRelatedPromotions([]);
        return;
      }

      const relationConfig = {
        Category: {
          id: promotion.categoryId,
          load: fetchPromotionsByCategory,
        },
        CategoryType: {
          id: promotion.categoryTypeId,
          load: fetchPromotionsByCategoryType,
        },
        NailDesign: {
          id: promotion.nailDesignId,
          load: fetchPromotionsByNailDesign,
        },
      }[promotion.scope];

      if (!relationConfig?.id || !relationConfig?.load) {
        setRelatedPromotions([]);
        return;
      }

      setIsLoadingRelatedPromotions(true);

      try {
        const items = await relationConfig.load(relationConfig.id);

        if (!isMounted) {
          return;
        }

        setRelatedPromotions(
          items.filter((item) => Number(item?.promotionId || 0) !== Number(promotion.promotionId || 0)),
        );
      } catch {
        if (isMounted) {
          setRelatedPromotions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRelatedPromotions(false);
        }
      }
    };

    void loadRelatedPromotions();

    return () => {
      isMounted = false;
    };
  }, [promotion]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleScopeChange = (value) => {
    setDraft((current) => ({
      ...current,
      scope: value,
      categoryId: value === "Category" ? current.categoryId : "",
      categoryTypeId: value === "CategoryType" ? current.categoryTypeId : "",
      nailDesignId: value === "NailDesign" ? current.nailDesignId : "",
    }));

    if (error) {
      setError("");
    }
  };

  const handleStartEdit = () => {
    if (!promotion) {
      return;
    }

    setDraft(mapPromotionToDraft(promotion));
    setImagePreview(promotion.imageUrl || "");
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!promotion) {
      return;
    }

    setDraft(mapPromotionToDraft(promotion));
    setImagePreview(promotion.imageUrl || "");
    setError("");
    setIsEditing(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setDraft((current) => ({
      ...current,
      imageFile: file,
    }));

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setImagePreview(loadEvent.target?.result || "");
    };
    reader.readAsDataURL(file);
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
    if (!promotion || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedPromotion = await updateAdminPromotion(promotion.promotionId, {
        ...draft,
        startDate: toApiDateTime(draft.startDate),
        endDate: toApiDateTime(draft.endDate),
      });

      setPromotion(updatedPromotion);
      setDraft(mapPromotionToDraft(updatedPromotion));
      setImagePreview(updatedPromotion.imageUrl || "");
      setIsEditing(false);
      toast.success(`${updatedPromotion.name} updated successfully.`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to update promotion.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!promotion) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminPromotion(promotion.promotionId);
      toast.success(`${promotion.name} deleted successfully.`);
      navigate(ROUTES.adminPromotions, {
        state: {
          flashMessage: `${promotion.name} has been deleted successfully.`,
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete promotion.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[1350px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminPromotions}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">Promotion Detail</h1>
            <p className="text-xs font-medium text-slate-400">Review, edit, and delete this promotion from one page.</p>
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
            Delete Promotion
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
              Edit Promotion
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
          <div className="text-center text-sm text-slate-600">Loading promotion details...</div>
        </div>
      ) : !promotion || !draft ? (
        <div className="rounded-[24px] border border-rose-100 bg-white/85 p-8 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-lg font-bold text-slate-800">Unable to load promotion detail</h2>
            <p className="mt-2 text-sm text-slate-500">
              {error || "This promotion could not be loaded from the backend."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                to={ROUTES.adminPromotions}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
              >
                Back to promotions
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(226,93,143,0.24)]"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="space-y-4">
            <PanelCard title="Promotion Details" icon={BadgePercent}>
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Promotion Name">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(event) => handleFieldChange("name", event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </FormField>

                <FormField label="Promotion Type">
                  <select
                    value={draft.type}
                    onChange={(event) => handleFieldChange("type", event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  >
                    <option value="">Select promotion type</option>
                    {PROMOTION_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Promotion Scope">
                  <select
                    value={draft.scope}
                    onChange={(event) => handleScopeChange(event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  >
                    <option value="">Select promotion scope</option>
                    {PROMOTION_SCOPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Discount Type">
                  <select
                    value={draft.discountType}
                    onChange={(event) => handleFieldChange("discountType", event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  >
                    <option value="">Select discount type</option>
                    {PROMOTION_DISCOUNT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Discount Value">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.discountValue}
                    onChange={(event) => handleFieldChange("discountValue", event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </FormField>

                <FormField label="Usage Limit">
                  <input
                    type="number"
                    min="0"
                    value={draft.usageLimit}
                    onChange={(event) => handleFieldChange("usageLimit", event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </FormField>

                <FormField label="User Limit">
                  <input
                    type="number"
                    min="0"
                    value={draft.userLimit}
                    onChange={(event) => handleFieldChange("userLimit", event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </FormField>

                <FormField label="Start Date">
                  <input
                    type="datetime-local"
                    value={draft.startDate}
                    onChange={(event) => handleFieldChange("startDate", event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </FormField>

                <FormField label="End Date">
                  <input
                    type="datetime-local"
                    value={draft.endDate}
                    onChange={(event) => handleFieldChange("endDate", event.target.value)}
                    disabled={!isEditing}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </FormField>

                {draft.scope === "Category" ? (
                  <FormField label="Category">
                    <select
                      value={draft.categoryId}
                      onChange={(event) => handleFieldChange("categoryId", event.target.value)}
                      disabled={!isEditing}
                      className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    >
                      <option value="">Select category</option>
                      {lookupOptions.categories.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </FormField>
                ) : null}

                {draft.scope === "CategoryType" ? (
                  <FormField label="Category Type">
                    <select
                      value={draft.categoryTypeId}
                      onChange={(event) => handleFieldChange("categoryTypeId", event.target.value)}
                      disabled={!isEditing}
                      className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    >
                      <option value="">Select category type</option>
                      {lookupOptions.categoryTypes.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </FormField>
                ) : null}

                {draft.scope === "NailDesign" ? (
                  <FormField label="Nail Design">
                    <select
                      value={draft.nailDesignId}
                      onChange={(event) => handleFieldChange("nailDesignId", event.target.value)}
                      disabled={!isEditing}
                      className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    >
                      <option value="">Select nail design</option>
                      {lookupOptions.nailDesigns.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </FormField>
                ) : null}
              </div>

              <FormField label="Description">
                <textarea
                  rows={5}
                  value={draft.description}
                  onChange={(event) => handleFieldChange("description", event.target.value)}
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                />
              </FormField>
            </PanelCard>

            <PanelCard title="Promotion Image" icon={ImagePlus}>
              {isEditing ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-rose-200 bg-[#fff8fb] px-4 py-8 transition hover:border-[#cf3d74]">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Promotion preview"
                      className="h-40 w-full max-w-[420px] rounded-[18px] border border-rose-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f7] text-[#cf3d74]">
                      <ImagePlus size={22} />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">Update promotion image</p>
                    <p className="mt-1 text-xs text-slate-400">Choose a new banner or thumbnail for this promotion.</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt={promotion.name}
                  className="h-52 w-full rounded-[18px] border border-rose-100 object-cover"
                />
              ) : (
                <div className="rounded-[20px] border border-dashed border-rose-200 bg-[#fff8fb] px-4 py-10 text-center text-sm font-semibold text-slate-500">
                  No promotion image uploaded.
                </div>
              )}
            </PanelCard>

            {promotion?.scope && promotion.scope !== "All" ? (
              <PanelCard title="Related Promotions" icon={Tag}>
                {isLoadingRelatedPromotions ? (
                  <p className="text-sm font-medium text-slate-500">Loading related promotions...</p>
                ) : relatedPromotions.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {relatedPromotions.map((item) => (
                      <Link
                        key={item.promotionId}
                        to={getAdminPromotionDetailRoute(item.promotionId)}
                        className="rounded-2xl border border-rose-100 bg-[#fff8fb] p-4 transition hover:border-[#cf3d74] hover:bg-white"
                      >
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.type} · {item.scope}</p>
                        <p className="mt-2 text-[11px] font-semibold text-rose-500">{item.status || (item.isActive ? "Active" : "Inactive")}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-500">No related promotions found for this scope.</p>
                )}
              </PanelCard>
            ) : null}
          </div>
        </div>
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save Promotion Changes"
        subtitle="This will update the promotion in backend."
        description="Confirm to save the latest changes to this promotion."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || promotion?.name || "Promotion"]}
        details={[
          { label: "Scope", value: draft?.scope || "--" },
          { label: "Type", value: draft?.type || "--" },
          { label: "Discount", value: draft?.discountValue || "--" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete Promotion"
        subtitle="This will remove the promotion from backend."
        description={`You are about to delete ${promotion?.name || "this promotion"}.`}
        confirmText="Delete Promotion"
        cancelText="Keep Promotion"
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          promotion
            ? {
              title: promotion.name,
              meta: `${promotion.type} · ${promotion.scope}`,
              note: `Promotion ID: ${promotion.promotionId}`,
            }
            : null
        }
      />
    </section>
  );
}
