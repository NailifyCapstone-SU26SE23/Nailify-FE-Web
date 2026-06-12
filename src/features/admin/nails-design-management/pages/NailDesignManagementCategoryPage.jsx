import {
  ArrowLeft,
  FolderPlus,
  PencilLine,
  Save,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { NAIL_DESIGN_CATEGORY_OPTIONS } from "../services/mockNailDesigns";

const INITIAL_CATEGORY_ROWS = NAIL_DESIGN_CATEGORY_OPTIONS.map((name, index) => ({
  id: `cat-${index + 1}`,
  name,
  description: `${name} design direction for curated admin collections and salon showcases.`,
  status: index < 6 ? "Active" : "Draft",
  designCount: 6 + index * 2,
}));

const emptyDraft = {
  name: "",
  description: "",
};

function Pill({ children, tone = "bg-[#fff1f7] text-[#ea4f93]" }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${tone}`}>
      {children}
    </span>
  );
}

export function NailDesignManagementCategoryPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(INITIAL_CATEGORY_ROWS);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [flashMessage, setFlashMessage] = useState("");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const summary = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((item) => item.status === "Active").length;
    const draftCount = categories.filter((item) => item.status === "Draft").length;
    const totalDesigns = categories.reduce((sum, item) => sum + item.designCount, 0);

    return { total, active, draftCount, totalDesigns };
  }, [categories]);

  const handleDraftChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const applyDraftChanges = () => {
    const normalizedName = draft.name.trim();
    const normalizedDescription = draft.description.trim();

    if (!normalizedName) {
      setFlashMessage("Category name is required.");
      return;
    }

    if (editingId) {
      setCategories((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: normalizedName,
                description: normalizedDescription || item.description,
              }
            : item,
        ),
      );
      setFlashMessage(`${normalizedName} has been updated.`);
    } else {
      setCategories((current) => [
        {
          id: `cat-${Date.now()}`,
          name: normalizedName,
          description:
            normalizedDescription ||
            `${normalizedName} design direction for curated admin collections and salon showcases.`,
          status: "Draft",
          designCount: 0,
        },
        ...current,
      ]);
      setFlashMessage(`${normalizedName} has been added.`);
    }

    resetDraft();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSubmitConfirm(true);
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setDraft({
      name: category.name,
      description: category.description,
    });
    setFlashMessage("");
  };

  const handleDelete = (categoryId) => {
    setPendingDeleteId(null);
    setCategories((current) => current.filter((item) => item.id !== categoryId));
    if (editingId === categoryId) {
      resetDraft();
    }
    setFlashMessage("Category has been removed.");
  };

  const handleToggleStatus = (categoryId) => {
    setCategories((current) =>
      current.map((item) =>
        item.id === categoryId
          ? {
              ...item,
              status: item.status === "Active" ? "Draft" : "Active",
            }
          : item,
      ),
    );
  };

  const pendingDeleteCategory = categories.find((item) => item.id === pendingDeleteId) ?? null;

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <header className="rounded-[20px] border border-[#f8dce8] bg-white/80 p-5 shadow-[0_12px_30px_rgba(236,72,153,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Link
              to={ROUTES.adminNailDesigns}
              className="inline-flex rounded-xl border border-[#f4c6da] bg-white p-2 text-[#ea4f93] transition hover:bg-[#fff7fb]"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-[26px] font-black tracking-tight text-[#432744]">
                Nail Design Categories
              </h1>
              <p className="mt-1 text-[12px] text-[#c694ad]">
                Create and manage design categories for the admin nail catalog.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(ROUTES.adminNailDesigns)}
              className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              Back To Designs
            </button>
            <Link
              to={ROUTES.adminNailDesignsCreate}
              className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
            >
              Add Design
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffe8f2] text-[#ea4f93]">
            <Tag size={18} />
          </div>
          <p className="text-[28px] font-black text-[#432744]">{summary.total}</p>
          <p className="mt-1 text-sm font-semibold text-[#8a7082]">Total Categories</p>
        </div>
        <div className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edfdf4] text-[#16975f]">
            <Sparkles size={18} />
          </div>
          <p className="text-[28px] font-black text-[#432744]">{summary.active}</p>
          <p className="mt-1 text-sm font-semibold text-[#8a7082]">Active Categories</p>
        </div>
        <div className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4df] text-[#d9871c]">
            <FolderPlus size={18} />
          </div>
          <p className="text-[28px] font-black text-[#432744]">{summary.draftCount}</p>
          <p className="mt-1 text-sm font-semibold text-[#8a7082]">Draft Categories</p>
        </div>
        <div className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#3f68c9]">
            <Save size={18} />
          </div>
          <p className="text-[28px] font-black text-[#432744]">{summary.totalDesigns}</p>
          <p className="mt-1 text-sm font-semibold text-[#8a7082]">Mapped Designs</p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[18px] border border-[#f8dce8] bg-white p-5 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#432744]">
                {editingId ? "Edit Category" : "Add Category"}
              </h2>
              <p className="mt-1 text-[11px] text-[#c694ad]">
                Update label and description used across the catalog.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetDraft}
                className="rounded-full border border-[#f4c6da] bg-[#fff7fb] p-2 text-[#ea4f93]"
                aria-label="Cancel editing"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-[12px] font-bold text-[#8a7082]">Category Name</span>
              <input
                value={draft.name}
                onChange={(event) => handleDraftChange("name", event.target.value)}
                placeholder="Ex: Glitter Luxe"
                className="h-11 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[12px] font-bold text-[#8a7082]">Description</span>
              <textarea
                value={draft.description}
                onChange={(event) => handleDraftChange("description", event.target.value)}
                placeholder="Short description for admins and merchandising."
                rows={5}
                className="w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 py-3 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
              >
                <Save size={13} className="mr-1.5" />
                {editingId ? "Save Category" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="inline-flex items-center rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
              >
                <X size={13} className="mr-1.5" />
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[18px] border border-[#f8dce8] bg-white p-5 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#432744]">Category List</h2>
              <p className="mt-1 text-[11px] text-[#c694ad]">
                Interactive mock list for adding, editing, and removing categories.
              </p>
            </div>
            <Pill>{categories.length} items</Pill>
          </div>

          {flashMessage ? (
            <div className="mb-4 rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
              {flashMessage}
            </div>
          ) : null}

          <div className="space-y-3">
            {categories.map((category) => (
              <article
                key={category.id}
                className="rounded-[18px] border border-[#f8dce8] bg-[#fffafb] p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-extrabold text-[#432744]">{category.name}</h3>
                      <Pill
                        tone={
                          category.status === "Active"
                            ? "bg-[#edfdf4] text-[#16975f]"
                            : "bg-[#fff7e7] text-[#cc8a16]"
                        }
                      >
                        {category.status}
                      </Pill>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#8a7082]">{category.description}</p>
                    <p className="mt-2 text-[11px] font-semibold text-[#c694ad]">
                      {category.designCount} mapped designs
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(category.id)}
                      className="rounded-full border border-[#f4c6da] bg-white px-3 py-1.5 text-[10px] font-bold text-[#8c7085]"
                    >
                      {category.status === "Active" ? "Mark Draft" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(category)}
                      className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-1.5 text-[10px] font-bold text-[#ea4f93]"
                    >
                      <PencilLine size={12} className="mr-1 inline" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(category.id)}
                      className="rounded-full border border-[#f9d0dc] bg-white px-3 py-1.5 text-[10px] font-bold text-[#d14c84]"
                    >
                      <Trash2 size={12} className="mr-1 inline" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <ActionConfirmModal
        open={showSubmitConfirm}
        intent="success"
        title={editingId ? "Save Category Changes" : "Create Category"}
        subtitle="This will update the current mock category catalog."
        description={
          editingId
            ? "Confirm to save the latest category label and description changes."
            : "Confirm to add this category to the nail design catalog."
        }
        confirmText={editingId ? "Save Category" : "Create Category"}
        cancelText="Review Again"
        confirmIcon={Save}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          applyDraftChanges();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
        highlights={[draft.name || "Category name pending", editingId ? "Edit mode" : "Create mode"]}
        details={[
          { label: "Description", value: draft.description || "No description entered" },
          { label: "Catalog Scope", value: "Nail design categories" },
        ]}
        warnings={["This mock save updates the current UI state only and does not persist outside this feature."]}
      />

      <ActionConfirmModal
        open={Boolean(pendingDeleteCategory)}
        intent="danger"
        title="Delete Category"
        subtitle="This will remove the category from the current mock catalog."
        description={`You are about to delete ${pendingDeleteCategory?.name ?? "this category"}. This action cannot be undone.`}
        confirmText="Delete Category"
        cancelText="Keep Category"
        confirmIcon={Trash2}
        onConfirm={() => handleDelete(pendingDeleteId)}
        onCancel={() => setPendingDeleteId(null)}
        item={
          pendingDeleteCategory
            ? {
                title: pendingDeleteCategory.name,
                meta: `${pendingDeleteCategory.status} • ${pendingDeleteCategory.designCount} mapped designs`,
                note: pendingDeleteCategory.description,
              }
            : null
        }
        warnings={["Mapped catalog references in the current mock UI may no longer appear after deletion."]}
      />
    </section>
  );
}
