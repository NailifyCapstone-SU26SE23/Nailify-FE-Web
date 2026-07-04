import { ArrowLeft, FolderTree, Layers3, Pencil, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  CATEGORY_STATUS_OPTIONS,
  deleteAdminCategory,
  fetchAdminCategoryDetail,
  fetchAdminCategoryTypeOptions,
  updateAdminCategory,
} from "../services/categoriesManagementService";

function validateForm(formValues) {
  if (!String(formValues.name || "").trim()) {
    return "Category name is required.";
  }

  if (!Number.isInteger(Number(formValues.categoryTypeId)) || Number(formValues.categoryTypeId) <= 0) {
    return "Category type is required.";
  }

  if (!String(formValues.status || "").trim()) {
    return "Status is required.";
  }

  return "";
}

export function CategoryDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [draft, setDraft] = useState(null);
  const [categoryTypeOptions, setCategoryTypeOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
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

    const loadData = async () => {
      setIsLoading(true);
      setIsOptionsLoading(true);
      setError("");

      try {
        const [categoryResponse, categoryTypesResponse] = await Promise.all([
          fetchAdminCategoryDetail(categoryId),
          fetchAdminCategoryTypeOptions(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategory(categoryResponse);
        setDraft({
          name: categoryResponse.name,
          categoryTypeId: String(categoryResponse.categoryTypeId),
          status: categoryResponse.status,
        });
        setCategoryTypeOptions(categoryTypesResponse);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load category detail.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsOptionsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  const summaryItems = useMemo(() => {
    if (!category || !draft) {
      return [];
    }

    const selectedType = categoryTypeOptions.find((item) => String(item.value) === String(draft.categoryTypeId));

    return [
      ["Category ID", String(category.categoryId)],
      ["Category Type", selectedType?.label || category.categoryTypeName || "--"],
      ["Status", draft.status || "--"],
    ];
  }, [category, categoryTypeOptions, draft]);

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
    if (!category) {
      return;
    }

    setDraft({
      name: category.name,
      categoryTypeId: String(category.categoryTypeId),
      status: category.status,
    });
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!category) {
      return;
    }

    setDraft({
      name: category.name,
      categoryTypeId: String(category.categoryTypeId),
      status: category.status,
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
    if (!category || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedCategory = await updateAdminCategory(category.categoryId, {
        ...draft,
        categoryTypeId: Number(draft.categoryTypeId),
      });
      setCategory(updatedCategory);
      setDraft({
        name: updatedCategory.name,
        categoryTypeId: String(updatedCategory.categoryTypeId),
        status: updatedCategory.status,
      });
      setIsEditing(false);
      toast.success(`${updatedCategory.name} updated successfully.`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to update category.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!category) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminCategory(category.categoryId);
      toast.success(`${category.name} deleted successfully.`);
      navigate(ROUTES.adminCategories, {
        state: {
          flashMessage: `${category.name} has been deleted successfully.`,
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete category.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isLoading && !category) {
    return <Navigate to={ROUTES.adminCategories} replace />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminCategories}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#cf3d74]">Category Detail</h1>
            <p className="text-xs font-medium text-slate-400">Review, edit, and delete this category from one page.</p>
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
            Delete Category
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
              Edit Category
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
          <div className="text-center text-sm text-slate-600">Loading category details...</div>
        </div>
      ) : (
        <div className="grid gap-4 ">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              Category Information
            </h2>

            <div className="grid gap-5">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">Category Name</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <FolderTree size={14} className="shrink-0 text-rose-300" />
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
                <span className="text-[13px] font-semibold text-slate-600">Category Type</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Layers3 size={14} className="shrink-0 text-rose-300" />
                  <select
                    value={draft?.categoryTypeId || ""}
                    onChange={(event) => handleFieldChange("categoryTypeId", event.target.value)}
                    disabled={!isEditing || isOptionsLoading}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default disabled:opacity-70"
                  >
                    {categoryTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">Status</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <ShieldCheck size={14} className="shrink-0 text-rose-300" />
                  <select
                    value={draft?.status || CATEGORY_STATUS_OPTIONS[0]}
                    onChange={(event) => handleFieldChange("status", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  >
                    {CATEGORY_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
          </section>

        </div>
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save Category Changes"
        subtitle="This will update the category in backend."
        description="Confirm to save the latest changes to this category."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || category?.name || "Category"]}
        details={[
          { label: "Category Type", value: summaryItems[1]?.[1] || "--" },
          { label: "Status", value: draft?.status || "--" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete Category"
        subtitle="This will set the category status to inactive in backend."
        description={`You are about to delete ${category?.name || "this category"}.`}
        confirmText="Delete Category"
        cancelText="Keep Category"
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          category
            ? {
                title: category.name,
                meta: `${category.categoryTypeName} | ${category.status}`,
                note: `Category ID: ${category.categoryId}`,
              }
            : null
        }
        warnings={["Backend delete for this resource changes the status to inactive."]}
      />
    </section>
  );
}
