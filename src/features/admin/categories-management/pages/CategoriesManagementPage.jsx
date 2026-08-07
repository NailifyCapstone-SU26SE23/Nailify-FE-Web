import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderTree,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Table } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminCategoryDetailRoute,
} from "../../../../shared/constants/routes";
import {
  deleteAdminCategory,
  fetchAdminCategories,
  fetchAdminCategoryTypeOptions,
} from "../services/categoriesManagementService";

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-[14px] ${item.iconClassName}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#cd98b1]">{item.label}</p>
      <p className="mt-1 text-[1.9rem] font-extrabold leading-none text-[#432744]">{item.value}</p>
      <p className="mt-2 text-xs font-medium text-[#b58a9f]">{item.note}</p>
    </article>
  );
}

function CategoryStatusBadge({ status }) {
  const { t } = useLanguage();
  const normalizedStatus = String(status || "").toLowerCase();
  const isStatusActive = normalizedStatus === "active";
  const className = isStatusActive
    ? "bg-[#e7fbf4] text-[#159669]"
    : "bg-[#fff1f5] text-[#d14c84]";

  const displayLabel = isStatusActive ? t("adminCategories.active") : t("adminCategories.inactive");

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>{displayLabel}</span>;
}

function SortableHeader({ label, sortKey, selectedSort, onToggle }) {
  const isActive = selectedSort.startsWith(`${sortKey}-`);
  const isDesc = selectedSort === `${sortKey}-desc`;

  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      className={`inline-flex items-center gap-1.5 font-semibold transition ${isActive ? "text-[#ea4f93]" : "text-[#5f4a5c] hover:text-[#ea4f93]"}`}
    >
      <span>{label}</span>
      <ArrowUpDown size={13} className={isActive ? "text-[#ea4f93]" : "text-[#d39bb5]"} />
      {isActive ? <span className="text-[10px] font-bold">{isDesc ? "DESC" : "ASC"}</span> : null}
    </button>
  );
}

function sortCategories(items, sortValue) {
  const [sortKey = "category", sortDirection = "asc"] = String(sortValue || "category-asc").split("-");
  const directionMultiplier = sortDirection === "desc" ? -1 : 1;

  return [...items].sort((left, right) => {
    const getSortValue = (item) => {
      switch (sortKey) {
        case "categoryType":
          return item.categoryTypeName || "";
        case "status":
          return item.status || "";
        case "category":
        default:
          return item.name || "";
      }
    };

    return String(getSortValue(left)).localeCompare(String(getSortValue(right))) * directionMultiplier;
  });
}

export function CategoriesManagementPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("");
  const [selectedSort, setSelectedSort] = useState("category-asc");
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [isFilterLoading, setIsFilterLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setMetaData((current) => ({
        ...current,
        currentPage: 1,
      }));
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadCategoryTypes = async () => {
      setIsFilterLoading(true);

      try {
        const response = await fetchAdminCategoryTypeOptions();

        if (!isMounted) {
          return;
        }

        setCategoryTypes(response);
      } catch {
        if (!isMounted) {
          return;
        }

        setCategoryTypes([]);
      } finally {
        if (isMounted) {
          setIsFilterLoading(false);
        }
      }
    };

    void loadCategoryTypes();

    return () => {
      isMounted = false;
    };
  }, []);

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
          categoryTypeId: categoryTypeFilter ? Number(categoryTypeFilter) : undefined,
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
        setError(loadError instanceof Error ? loadError.message : t("adminCategories.loadFailed"));
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
  }, [categoryTypeFilter, debouncedQuery, metaData.currentPage, metaData.pageSize]);

  const summaryCards = useMemo(() => {
    const activeCount = categories.filter((item) => String(item.status).toLowerCase() === "active").length;
    const visibleTypes = new Set(categories.map((item) => item.categoryTypeName).filter(Boolean)).size;

    return [
      {
        label: t("adminCategories.totalCategories"),
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} pages`,
        icon: FolderTree,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: t("adminCategories.activeItems"),
        value: activeCount.toLocaleString(),
        note: "Current page",
        icon: Sparkles,
        iconClassName: "bg-[#e7fbf4] text-[#20ab77]",
      },
      {
        label: t("adminCategories.visibleTypes"),
        value: visibleTypes.toLocaleString(),
        note: categoryTypeFilter ? "Filtered type" : "Current page",
        icon: Layers3,
        iconClassName: "bg-[#fff4df] text-[#d9871c]",
      },
      {
        label: t("adminCategories.pageItems"),
        value: categories.length.toLocaleString(),
        note: debouncedQuery || "Current page",
        icon: FolderTree,
        iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
      },
    ];
  }, [categories, categoryTypeFilter, debouncedQuery, metaData.totalItems, metaData.totalPages]);

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

  const sortedCategories = useMemo(
    () => sortCategories(categories, selectedSort),
    [categories, selectedSort],
  );

  const handleSortToggle = (sortKey) => {
    setSelectedSort((current) => {
      if (current.startsWith(`${sortKey}-`)) {
        return current.endsWith("-asc") ? `${sortKey}-desc` : `${sortKey}-asc`;
      }

      return `${sortKey}-asc`;
    });
  };

  const columns = useMemo(
    () => [
      {
        title: (
          <SortableHeader
            label={t("adminCategories.category")}
            sortKey="category"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        key: "category",
        render: (_, category) => (
          <div className="flex items-center gap-3">
            
            <div>
              <p className="text-sm font-bold text-[#432744]">{category.name}</p>
              
            </div>
          </div>
        ),
      },
      {
        title: (
          <SortableHeader
            label={t("adminCategories.categoryType")}
            sortKey="categoryType"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "categoryTypeName",
        key: "categoryTypeName",
        render: (value) => <span className="text-sm font-semibold text-[#432744]">{value}</span>,
      },
      {
        title: (
          <SortableHeader
            label={t("adminCategories.status")}
            sortKey="status"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "status",
        key: "status",
        render: (value) => <CategoryStatusBadge status={value} />,
      },
      {
        title: t("adminCategories.actions"),
        key: "actions",
        render: (_, category) => (
          <ActionDropdown
            items={[
              {
                key: "view",
                label: t("adminCategories.viewDetail"),
                icon: Eye,
                onSelect: () => navigate(getAdminCategoryDetailRoute(category.categoryId)),
              },
              {
                key: "edit",
                label: t("adminCategories.editCategory"),
                icon: Pencil,
                onSelect: () =>
                  navigate(getAdminCategoryDetailRoute(category.categoryId), {
                    state: { startInEdit: true },
                  }),
              },
              {
                key: "delete",
                label: t("adminCategories.deleteCategory"),
                icon: Trash2,
                className: "text-[#d14c84]",
                onSelect: () => setDeleteTarget(category),
              },
            ]}
          />
        ),
      },
    ], [navigate, selectedSort, t],
  );

  const handleDeleteCategory = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminCategory(deleteTarget.categoryId);
      setDeleteTarget(null);
      toast.success(t("adminCategories.deleteSuccess", { name: deleteTarget.name }));

      const shouldMoveBack = categories.length === 1 && metaData.currentPage > 1;
      const targetPage = shouldMoveBack ? Math.max(metaData.currentPage - 1, 1) : metaData.currentPage;

      const response = await fetchAdminCategories({
        pageNumber: targetPage,
        pageSize: metaData.pageSize,
        name: debouncedQuery,
        categoryTypeId: categoryTypeFilter ? Number(categoryTypeFilter) : undefined,
      });
      setCategories(response.items);
      setMetaData(response.metaData);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t("adminCategories.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4fa_100%)]">
        {flashMessage ? (
          <div className="rounded-[16px] border border-[#d8f5e7] bg-[#eefcf5] px-4 py-3 text-sm font-medium text-[#16975f]">
            {flashMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">{error}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] border border-[#f8deea] bg-white/70 p-4 shadow-[0_12px_26px_rgba(236,72,153,0.05)] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-3 xl:max-w-5xl xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("adminCategories.searchPlaceholder")}
                  className="h-10 w-full rounded-full border border-[#f4d7e5] bg-[#fffafc] pl-11 pr-4 text-sm text-[#5b4658] outline-none placeholder:text-[#d4a1b8] focus:border-[#ea4f93]"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  setMetaData((current) => ({
                    ...current,
                    currentPage: 1,
                  }))
                }
                className="inline-flex h-10 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
              >
                <Search size={14} className="mr-2 shrink-0" />
                {t("adminCategories.search")}
              </button>
            </div>

            <select
              value={categoryTypeFilter}
              onChange={(event) => {
                setCategoryTypeFilter(event.target.value);
                setMetaData((current) => ({
                  ...current,
                  currentPage: 1,
                }));
              }}
              disabled={isFilterLoading}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93] disabled:opacity-70"
            >
              <option value="">All category types</option>
              {categoryTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            to={ROUTES.adminCategoriesCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            {t("adminCategories.addCategory")}
          </Link>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">{t("adminCategories.categories")}</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              {t("adminCategories.showingCategories", { first: metaData.firstRowOnPage, last: metaData.lastRowOnPage, total: metaData.totalItems })}
            </p>
          </div>

          <Table
            rowKey="categoryId"
            columns={columns}
            dataSource={sortedCategories}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 980 }}
            locale={{ emptyText: error || t("adminCategories.noCategoriesFound") }}
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              {t("adminCategories.showingCategories", { first: metaData.firstRowOnPage, last: metaData.lastRowOnPage, total: metaData.totalItems })}
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
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[11px] ${
                    item === metaData.currentPage
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
      </section>

      {deleteTarget ? (
        <ActionConfirmModal
          open
          intent="danger"
          title={t("adminCategories.deleteCategoryTitle")}
          subtitle={t("adminCategories.deleteConfirmSubtitle")}
          description={t("adminCategories.deleteConfirmDesc", { name: deleteTarget.name })}
          confirmText={t("adminCategories.deleteCategory")}
          cancelText={t("adminCategories.keepCategory")}
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteCategory}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            title: deleteTarget.name,
            meta: `${deleteTarget.categoryTypeName} | ${deleteTarget.status}`,
            note: `Category ID: ${deleteTarget.categoryId}`,
          }}
          warnings={[t("adminCategories.deleteWarning")]}
        />
      ) : null}
    </>
  );
}
