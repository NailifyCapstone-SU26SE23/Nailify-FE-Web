import { ArrowLeft, FolderTree, Layers3, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminCategoryDetailRoute } from "../../../../shared/constants/routes";
import {
  createAdminCategory,
  fetchAdminCategoryTypeOptions,
} from "../services/categoriesManagementService";

function validateForm(formValues) {
  if (!String(formValues.name || "").trim()) {
    return "Category name is required.";
  }

  if (!Number.isInteger(Number(formValues.categoryTypeId)) || Number(formValues.categoryTypeId) <= 0) {
    return "Category type is required.";
  }

  return "";
}

export function CategoryCreatePage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({ name: "", categoryTypeId: "" });
  const [categoryTypeOptions, setCategoryTypeOptions] = useState([]);
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCategoryTypes = async () => {
      setIsLoadingOptions(true);

      try {
        const response = await fetchAdminCategoryTypeOptions();

        if (!isMounted) {
          return;
        }

        setCategoryTypeOptions(response);
        if (!formValues.categoryTypeId && response.length) {
          setFormValues((current) => ({
            ...current,
            categoryTypeId: String(response[0].value),
          }));
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFormError(error instanceof Error ? error.message : "Failed to load category type options.");
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      }
    };

    void loadCategoryTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  const summaryItems = useMemo(() => {
    const selectedType = categoryTypeOptions.find((item) => String(item.value) === String(formValues.categoryTypeId));

    return [
      ["Category Name", formValues.name || "--"],
      ["Category Type", selectedType?.label || "--"],
    ];
  }, [categoryTypeOptions, formValues.categoryTypeId, formValues.name]);

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
    const validationError = validateForm(formValues);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleCreate = async () => {
    setIsSaving(true);

    try {
      const createdCategory = await createAdminCategory({
        ...formValues,
        categoryTypeId: Number(formValues.categoryTypeId),
      });
      toast.success(`${createdCategory.name} created successfully.`);
      navigate(getAdminCategoryDetailRoute(createdCategory.categoryId), {
        state: {
          flashMessage: `${createdCategory.name} has been created successfully.`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create category.";
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
            to={ROUTES.adminCategories}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">Add New Category</h1>
            <p className="text-xs font-medium text-slate-400">Create a new category for admin management.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            disabled={isLoadingOptions}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95 disabled:opacity-70"
          >
            <Save size={14} />
            Save Category
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
            Category Details
          </h2>

          <div className="grid gap-5">
            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Category Name</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <FolderTree size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder="Enter category name"
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Category Type</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Layers3 size={14} className="shrink-0 text-rose-300" />
                <select
                  value={formValues.categoryTypeId}
                  onChange={(event) => handleFieldChange("categoryTypeId", event.target.value)}
                  disabled={isLoadingOptions}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:opacity-70"
                >
                  {!categoryTypeOptions.length ? <option value="">No category types</option> : null}
                  {categoryTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              Preview
            </h2>

            <div className="space-y-3 rounded-2xl border border-rose-100 bg-[#fff8fb] p-4">
              {summaryItems.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-500">{label}</span>
                  <span className="text-right font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title="Cancel Category Creation"
        subtitle="You are leaving this form without saving."
        description="All unsaved category details will be discarded."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminCategories)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={["This new category has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save New Category"
        subtitle="This will create the category in backend."
        description="Confirm to add this category to admin management."
        confirmText="Create Category"
        cancelText="Review Again"
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreate}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || "New category"]}
        details={[{ label: "Category Type", value: summaryItems[1]?.[1] || "--" }]}
      />
    </section>
  );
}
