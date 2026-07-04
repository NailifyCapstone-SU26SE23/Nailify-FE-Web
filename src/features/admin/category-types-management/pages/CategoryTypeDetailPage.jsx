import { ArrowLeft, FolderTree, Pencil, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  CATEGORY_TYPE_STATUS_OPTIONS,
  deleteAdminCategoryType,
  fetchAdminCategoryTypeDetail,
  updateAdminCategoryType,
} from "../services/categoryTypesManagementService";

function validateForm(formValues) {
  if (!String(formValues.name || "").trim()) {
    return "Category type name is required.";
  }

  if (!String(formValues.status || "").trim()) {
    return "Status is required.";
  }

  return "";
}

export function CategoryTypeDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryTypeId } = useParams();
  const [categoryType, setCategoryType] = useState(null);
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

    const loadCategoryType = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminCategoryTypeDetail(categoryTypeId);

        if (!isMounted) {
          return;
        }

        setCategoryType(response);
        setDraft({
          name: response.name,
          status: response.status,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load category type detail.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCategoryType();

    return () => {
      isMounted = false;
    };
  }, [categoryTypeId]);

  const summaryItems = useMemo(() => {
    if (!categoryType || !draft) {
      return [];
    }

    return [
      ["Category Type ID", String(categoryType.categoryTypeId)],
      ["Status", draft.status || "--"],
      ["Categories Count", String(categoryType.categoriesCount)],
      ["Categories", categoryType.categoriesLabel],
    ];
  }, [categoryType, draft]);

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
    if (!categoryType) {
      return;
    }

    setDraft({
      name: categoryType.name,
      status: categoryType.status,
    });
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!categoryType) {
      return;
    }

    setDraft({
      name: categoryType.name,
      status: categoryType.status,
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
    if (!categoryType || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedCategoryType = await updateAdminCategoryType(categoryType.categoryTypeId, draft);
      setCategoryType(updatedCategoryType);
      setDraft({
        name: updatedCategoryType.name,
        status: updatedCategoryType.status,
      });
      setIsEditing(false);
      toast.success(`${updatedCategoryType.name} updated successfully.`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to update category type.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryType) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminCategoryType(categoryType.categoryTypeId);
      toast.success(`${categoryType.name} deleted successfully.`);
      navigate(ROUTES.adminCategoryTypes, {
        state: {
          flashMessage: `${categoryType.name} has been deleted successfully.`,
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete category type.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isLoading && !categoryType) {
    return <Navigate to={ROUTES.adminCategoryTypes} replace />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminCategoryTypes}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#cf3d74]">Category Type Detail</h1>
            <p className="text-xs font-medium text-slate-400">Review, edit, and delete this category type from one page.</p>
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
            Delete Category Type
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
              Edit Category Type
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
          <div className="text-center text-sm text-slate-600">Loading category type details...</div>
        </div>
      ) : (
        <div className="grid gap-4 ">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              Category Type Information
            </h2>

            <div className="grid gap-5">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">Category Type Name</span>
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
                <span className="text-[13px] font-semibold text-slate-600">Status</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <ShieldCheck size={14} className="shrink-0 text-rose-300" />
                  <select
                    value={draft?.status || CATEGORY_TYPE_STATUS_OPTIONS[0]}
                    onChange={(event) => handleFieldChange("status", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  >
                    {CATEGORY_TYPE_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <div className="rounded-2xl border border-rose-100 bg-[#fff8fb] p-4">
                <p className="text-[13px] font-semibold text-slate-600">Nested Categories</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryType?.categories?.length ? (
                    categoryType.categories.map((category) => (
                      <span
                        key={category.categoryId}
                        className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#b15f84] shadow-sm"
                      >
                        {category.name} ({category.status})
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No categories assigned.</span>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save Category Type Changes"
        subtitle="This will update the category type in backend."
        description="Confirm to save the latest changes to this category type."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || categoryType?.name || "Category type"]}
        details={[{ label: "Status", value: draft?.status || "--" }]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete Category Type"
        subtitle="This will set the category type status to inactive in backend."
        description={`You are about to delete ${categoryType?.name || "this category type"}.`}
        confirmText="Delete Category Type"
        cancelText="Keep Category Type"
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          categoryType
            ? {
                title: categoryType.name,
                meta: `${categoryType.categoriesCount} categories | ${categoryType.status}`,
                note: `Category Type ID: ${categoryType.categoryTypeId}`,
              }
            : null
        }
        warnings={["Backend delete for this resource changes the status to inactive."]}
      />
    </section>
  );
}
