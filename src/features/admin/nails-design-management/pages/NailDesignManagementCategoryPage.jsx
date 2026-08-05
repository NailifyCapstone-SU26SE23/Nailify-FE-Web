import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  LoaderCircle,
  PencilLine,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchAdminCategories } from "../services/nailDesignManagementService";

const emptyDraft = {
  name: "",
  description: "",
};

function buildCategoryInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "NC"
  );
}

function Pill({ children, tone = "bg-[#fff1f7] text-[#ea4f93]" }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${tone}`}>
      {children}
    </span>
  );
}

export function NailDesignManagementCategoryPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [flashMessage, setFlashMessage] = useState("");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [metaData, setMetaData] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0,
    hasPrevious: false,
    hasNext: false,
    firstRowOnPage: 0,
    lastRowOnPage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setMetaData((current) => ({ ...current, currentPage: 1 }));
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminCategories({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          name: debouncedQuery,
        });

        if (!isMounted) {
          return;
        }

        setCategories(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setCategories([]);
        setError(loadError instanceof Error ? loadError.message : (t("adminNailsDesignManagement.failedToLoadCategories")));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, metaData.currentPage, metaData.pageSize]);

  const summary = useMemo(() => {
    const total = metaData.totalItems;
    const active = categories.filter((item) => item.status === "Active").length;
    const draftCount = categories.filter((item) => item.status !== "Active").length;
    const totalTypes = new Set(categories.map((item) => item.categoryTypeName).filter(Boolean)).size;

    return { total, active, draftCount, totalTypes };
  }, [categories, metaData.totalItems]);

  const paginationItems = useMemo(() => {
    const currentPage = metaData.currentPage;
    const totalPages = metaData.totalPages;

    if (totalPages <= 1) {
      return [1];
    }

    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    const normalizedPages = [...pages]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((left, right) => left - right);

    const result = [];

    normalizedPages.forEach((page, index) => {
      result.push(page);

      const nextPage = normalizedPages[index + 1];
      if (nextPage && nextPage - page > 1) {
        result.push("...");
      }
    });

    return result;
  }, [metaData.currentPage, metaData.totalPages]);

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

    if (!normalizedName) {
      setFlashMessage(t("adminNailsDesignManagement.categoryNameIsRequired"));
      return;
    }

    setFlashMessage(
      editingId
        ? (language === "vi" ? `${normalizedName} đã sẵn sàng, nhưng API cập nhật danh mục chưa được kết nối.` : `${normalizedName} is ready, but category update API is not connected yet.`)
        : (language === "vi" ? `${normalizedName} đã sẵn sàng, nhưng API tạo danh mục chưa được kết nối.` : `${normalizedName} is ready, but category create API is not connected yet.`),
    );

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
      description: category.categoryTypeName || "",
    });
    setFlashMessage("");
  };

  const handleDelete = () => {
    setPendingDeleteId(null);
    setFlashMessage(t("adminNailsDesignManagement.categoryDeleteApiIsNotConnecte"));
  };

  const handleToggleStatus = (category) => {
    setFlashMessage(
      language === "vi"
        ? `Thay đổi trạng thái cho ${category.name} chưa được kết nối với API.`
        : `Status change for ${category.name} is not connected to API yet.`
    );
  };

  const pendingDeleteCategory = categories.find((item) => item.id === pendingDeleteId) ?? null;
  const previewName = draft.name.trim() || (t("adminNailsDesignManagement.newCategory"));
  const previewDescription =
    draft.description.trim() || (t("adminNailsDesignManagement.aShortCatalogDescriptionWillAp"));
  const previewInitials = buildCategoryInitials(previewName);
  const descriptionLength = draft.description.trim().length;

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
              <h1 className="text-[26px] font-bold tracking-tight text-[#432744]">
                {t("adminNailsDesignManagement.nailDesignCategories")}
              </h1>
              <p className="mt-1 text-[12px] text-[#c694ad]">
                {t("adminNailsDesignManagement.categoryListIsLoadedFromApiGet")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(ROUTES.adminNailDesigns)}
              className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              {t("adminNailsDesignManagement.backToDesigns")}
            </button>
            <Link
              to={ROUTES.adminNailDesignsCreate}
              className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
            >
              {t("adminNailsDesignManagement.addDesign")}
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffe8f2] text-[#ea4f93]">
            <Tag size={18} />
          </div>
          <p className="text-[28px] font-bold text-[#432744]">{summary.total}</p>
          <p className="mt-1 text-sm font-semibold text-[#8a7082]">
            {t("adminNailsDesignManagement.totalCategories")}
          </p>
        </div>
        <div className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edfdf4] text-[#16975f]">
            <Sparkles size={18} />
          </div>
          <p className="text-[28px] font-bold text-[#432744]">{summary.active}</p>
          <p className="mt-1 text-sm font-semibold text-[#8a7082]">
            {t("adminNailsDesignManagement.activeOnCurrentPage")}
          </p>
        </div>
        <div className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4df] text-[#d9871c]">
            <FolderPlus size={18} />
          </div>
          <p className="text-[28px] font-bold text-[#432744]">{summary.draftCount}</p>
          <p className="mt-1 text-sm font-semibold text-[#8a7082]">
            {t("adminNailsDesignManagement.nonactiveOnCurrentPage")}
          </p>
        </div>
        <div className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#3f68c9]">
            <Save size={18} />
          </div>
          <p className="text-[28px] font-bold text-[#432744]">{summary.totalTypes}</p>
          <p className="mt-1 text-sm font-semibold text-[#8a7082]">
            {t("adminNailsDesignManagement.categoryTypesOnPage")}
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[22px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="border-b border-[#f8dce8] bg-[linear-gradient(135deg,#fff6fb_0%,#fff0f7_55%,#ffffff_100%)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ea4f93] shadow-[0_8px_20px_rgba(236,72,153,0.08)]">
                  {t("adminNailsDesignManagement.catalogEditor")}
                </span>
                <h2 className="mt-3 text-lg font-bold text-[#432744]">
                  {editingId
                    ? (t("adminNailsDesignManagement.editCategory"))
                    : (t("adminNailsDesignManagement.addCategory"))
                  }
                </h2>
                <p className="mt-1 text-[12px] leading-5 text-[#a37792]">
                  {t("adminNailsDesignManagement.formUiIsAvailableButCreateupda")
                  }
                </p>
              </div>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-full border border-[#f4c6da] bg-white/90 p-2 text-[#ea4f93] shadow-sm"
                  aria-label="Cancel editing"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="mt-5 rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-[0_10px_24px_rgba(236,72,153,0.08)] backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#ec4899_0%,#f472b6_100%)] text-lg font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)]">
                  {previewInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[15px] font-extrabold text-[#432744]">
                      {previewName}
                    </p>
                    <Pill tone="bg-[#fff1f7] text-[#ea4f93]">
                      {editingId ? (t("adminNailsDesignManagement.editing")) : (t("adminNailsDesignManagement.newDraft"))}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#8a7082]">{previewDescription}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-[#f9dfeb] bg-[#fff9fc] px-3 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#c694ad]">
                    {t("adminNailsDesignManagement.status")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#432744]">
                    {editingId
                      ? (t("adminNailsDesignManagement.readyToUpdate"))
                      : (t("adminNailsDesignManagement.readyToCreate"))
                    }
                  </p>
                </div>
                <div className="rounded-[16px] border border-[#f9dfeb] bg-[#fff9fc] px-3 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#c694ad]">
                    {t("adminNailsDesignManagement.nameLength")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#432744]">
                    {draft.name.trim().length || 0} {t("adminNailsDesignManagement.chars")}
                  </p>
                </div>
                <div className="rounded-[16px] border border-[#f9dfeb] bg-[#fff9fc] px-3 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#c694ad]">
                    {t("adminNailsDesignManagement.description")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#432744]">
                    {descriptionLength} {t("adminNailsDesignManagement.chars")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-5 p-5" onSubmit={handleSubmit}>
            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="block text-[12px] font-bold text-[#8a7082]">
                  {t("adminNailsDesignManagement.categoryName")}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c694ad]">
                  {t("adminNailsDesignManagement.required")}
                </span>
              </div>
              <input
                value={draft.name}
                onChange={(event) => handleDraftChange("name", event.target.value)}
                placeholder={t("adminNailsDesignManagement.exGlitterLuxe")}
                className="h-12 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4] focus:bg-white"
              />
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="block text-[12px] font-bold text-[#8a7082]">
                  {t("adminNailsDesignManagement.description")}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c694ad]">
                  {t("adminNailsDesignManagement.optional")}
                </span>
              </div>
              <textarea
                value={draft.description}
                onChange={(event) => handleDraftChange("description", event.target.value)}
                placeholder={t("adminNailsDesignManagement.shortDescriptionForAdminsAndMe")}
                rows={5}
                className="w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 py-3 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4] focus:bg-white"
              />
            </label>

            <div className="rounded-[18px] border border-dashed border-[#f3c9dd] bg-[#fff8fb] px-4 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c694ad]">
                {t("adminNailsDesignManagement.writingTip")}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#8a7082]">
                {t("adminNailsDesignManagement.useShortNamesWithAStrongVisual")
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
              >
                <Save size={13} className="mr-1.5" />
                {editingId
                  ? (t("adminNailsDesignManagement.saveCategory"))
                  : (t("adminNailsDesignManagement.createCategory"))
                }
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="inline-flex items-center rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
              >
                <X size={13} className="mr-1.5" />
                {t("adminNailsDesignManagement.reset")}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[18px] border border-[#f8dce8] bg-white p-5 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#432744]">
                {t("adminNailsDesignManagement.categoryList")}
              </h2>
              <p className="mt-1 text-[11px] text-[#c694ad]">
                {t("adminNailsDesignManagement.loadedFromApiWithPaginationAnd")
                }
              </p>
            </div>
            <Pill>{metaData.totalItems} {t("adminNailsDesignManagement.items")}</Pill>
          </div>

          {flashMessage ? (
            <div className="mb-4 rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
              {flashMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
              {error}
            </div>
          ) : null}

          <label className="relative mb-4 block max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#df7baa]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("adminNailsDesignManagement.searchCategoriesByName")}
              className="h-10 w-full rounded-full border border-[#f5d7e4] bg-[#fff9fc] pl-10 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
            />
          </label>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-[18px] border border-[#f8dce8] bg-[#fffafb] px-5 py-10">
                <div className="flex items-center justify-center gap-3 text-sm text-[#b38a9f]">
                  <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                  {t("adminNailsDesignManagement.loadingCategories")}
                </div>
              </div>
            ) : categories.length ? (
              categories.map((category) => (
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
                          {category.status === "Active"
                            ? (t("adminNailsDesignManagement.active"))
                            : (t("adminNailsDesignManagement.inactive"))
                          }
                        </Pill>
                        <Pill tone="bg-[#eef4ff] text-[#3f68c9]">{category.categoryTypeName}</Pill>
                      </div>
                      {/* <p className="mt-2 text-sm leading-6 text-[#8a7082]">
                        Category type ID: {category.categoryTypeId}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-[#c694ad]">
                        Category ID #{category.categoryId}
                      </p> */}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(category)}
                        className="rounded-full border border-[#f4c6da] bg-white px-3 py-1.5 text-[10px] font-bold text-[#8c7085]"
                      >
                        {t("adminNailsDesignManagement.toggleStatus")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-1.5 text-[10px] font-bold text-[#ea4f93]"
                      >
                        <PencilLine size={12} className="mr-1 inline" />
                        {t("adminNailsDesignManagement.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(category.id)}
                        className="rounded-full border border-[#f9d0dc] bg-white px-3 py-1.5 text-[10px] font-bold text-[#d14c84]"
                      >
                        <Trash2 size={12} className="mr-1 inline" />
                        {t("adminNailsDesignManagement.delete")}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[18px] border border-[#f8dce8] bg-[#fffafb] px-5 py-10 text-center text-sm text-[#8a7082]">
                {t("adminNailsDesignManagement.noCategoriesFound")}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-[16px] border border-[#f8dce8] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              {language === "vi"
                ? `Hiển thị ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} trong số ${metaData.totalItems} danh mục`
                : `Showing ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} of ${metaData.totalItems} categories`
              }
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!metaData.hasPrevious || isLoading}
                onClick={() =>
                  setMetaData((current) => ({
                    ...current,
                    currentPage: Math.max(current.currentPage - 1, 1),
                  }))
                }
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={12} />
              </button>
              {paginationItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={item === "..." || item === metaData.currentPage || isLoading}
                  onClick={() => {
                    if (typeof item !== "number") {
                      return;
                    }

                    setMetaData((current) => ({ ...current, currentPage: item }));
                  }}
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[11px] ${item === metaData.currentPage
                    ? "bg-[#ea4f93] font-bold text-white"
                    : "border border-[#f3cade] bg-white font-medium text-[#b9849f]"
                    } disabled:cursor-default disabled:opacity-100`}
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                disabled={!metaData.hasNext || isLoading}
                onClick={() =>
                  setMetaData((current) => ({
                    ...current,
                    currentPage: Math.min(current.currentPage + 1, current.totalPages),
                  }))
                }
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </section>
      </div>

      <ActionConfirmModal
        open={showSubmitConfirm}
        intent="success"
        title={editingId ? (t("adminNailsDesignManagement.saveCategoryChanges")) : (t("adminNailsDesignManagement.createCategory"))}
        subtitle={t("adminNailsDesignManagement.categoryCreateupdateApiIsNotCo")}
        description={
          editingId
            ? (t("adminNailsDesignManagement.confirmToStageTheLatestCategor"))
            : (t("adminNailsDesignManagement.confirmToStageThisCategoryDraf"))
        }
        confirmText={editingId ? (t("adminNailsDesignManagement.saveCategory")) : (t("adminNailsDesignManagement.createCategory"))}
        cancelText={t("adminNailsDesignManagement.reviewAgain")}
        confirmIcon={Save}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          applyDraftChanges();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
        highlights={[draft.name || (t("adminNailsDesignManagement.categoryNamePending")), editingId ? (t("adminNailsDesignManagement.editMode")) : (t("adminNailsDesignManagement.createMode"))]}
        details={[
          { label: t("adminNailsDesignManagement.description"), value: draft.description || (t("adminNailsDesignManagement.noDescriptionEntered")) },
          { label: t("adminNailsDesignManagement.catalogScope"), value: t("adminNailsDesignManagement.nailDesignCategories1") },
        ]}
        warnings={[t("adminNailsDesignManagement.theListOnTheRightIsLoadedFromA")]}
      />

      <ActionConfirmModal
        open={Boolean(pendingDeleteCategory)}
        intent="danger"
        title={t("adminNailsDesignManagement.deleteCategory")}
        subtitle={t("adminNailsDesignManagement.categoryDeleteApiIsNotConnecte")}
        description={language === "vi" ? `Bạn sắp xóa danh mục ${pendingDeleteCategory?.name ?? ""}.` : `You are about to delete ${pendingDeleteCategory?.name ?? "this category"}.`}
        confirmText={t("adminNailsDesignManagement.deleteCategory")}
        cancelText={t("adminNailsDesignManagement.keepCategory")}
        confirmIcon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
        item={
          pendingDeleteCategory
            ? {
              title: pendingDeleteCategory.name,
              meta: `${pendingDeleteCategory.status === "Active" ? (t("adminNailsDesignManagement.active")) : (t("adminNailsDesignManagement.inactive"))} • ${pendingDeleteCategory.categoryTypeName}`,
              // note: `Category ID #${pendingDeleteCategory.categoryId}`,
            }
            : null
        }
        warnings={[t("adminNailsDesignManagement.deleteIsNotConnectedToBackendS")]}
      />
    </section>
  );
}
