import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gem,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Shapes,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Table } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminComponentDetailRoute,
} from "../../../../shared/constants/routes";
import {
  COMPONENT_TYPE_OPTIONS,
  deleteAdminComponent,
  fetchAdminComponents,
  formatComponentCurrency,
  formatComponentDuration,
} from "../services/componentsManagementService";

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

function ComponentPreview({ component }) {
  if (component.imageUrl) {
    return (
      <img
        crossOrigin="anonymous"
        src={component.imageUrl}
        alt={component.name}
        className="h-11 w-11 rounded-xl border border-[#f4dbe7] object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#ffe4ef_0%,#ffd977_100%)] text-xs font-extrabold text-[#9c2f63]">
      {component.initials || "CP"}
    </div>
  );
}

function TypeBadge({ type }) {
  const toneMap = {
    Gem: "bg-[#f3ebff] text-[#7e4fe6]",
    Sticker: "bg-[#e8f4ff] text-[#3b82f6]",
    Charm: "bg-[#fff4df] text-[#d9871c]",
    Art: "bg-[#e7fbf4] text-[#20ab77]",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${toneMap[type] || "bg-[#fff7fb] text-[#c694ad]"}`}>
      {type}
    </span>
  );
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

function sortComponents(items, sortValue) {
  const [sortKey = "component", sortDirection = "asc"] = String(sortValue || "component-asc").split("-");
  const directionMultiplier = sortDirection === "desc" ? -1 : 1;

  return [...items].sort((left, right) => {
    const getSortValue = (item) => {
      switch (sortKey) {
        case "type":
          return item.componentType || "";
        case "price":
          return Number(item.price || 0);
        case "duration":
          return Number(item.duration || 0);
        case "component":
        default:
          return item.name || "";
      }
    };

    const leftValue = getSortValue(left);
    const rightValue = getSortValue(right);

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * directionMultiplier;
    }

    return String(leftValue).localeCompare(String(rightValue)) * directionMultiplier;
  });
}

export function ComponentsManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [componentTypeFilter, setComponentTypeFilter] = useState("");
  const [selectedSort, setSelectedSort] = useState("component-asc");
  const [components, setComponents] = useState([]);
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

    const loadComponents = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminComponents({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          name: debouncedQuery,
          componentType: componentTypeFilter,
        });

        if (!isMounted) {
          return;
        }

        setComponents(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setComponents([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load components.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadComponents();

    return () => {
      isMounted = false;
    };
  }, [componentTypeFilter, debouncedQuery, metaData.currentPage, metaData.pageSize]);

  const summaryCards = useMemo(() => {
    const totalPrice = components.reduce((sum, item) => sum + item.price, 0);
    const totalDuration = components.reduce((sum, item) => sum + item.duration, 0);
    const averagePrice = components.length ? Math.round(totalPrice / components.length) : 0;
    const averageDuration = components.length ? Math.round(totalDuration / components.length) : 0;
    const visibleTypes = new Set(components.map((item) => item.componentType).filter(Boolean));

    return [
      {
        label: "Total Components",
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} pages`,
        icon: Shapes,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: "Visible Items",
        value: components.length.toLocaleString(),
        note: "Current page",
        icon: Sparkles,
        iconClassName: "bg-[#fff4df] text-[#d9871c]",
      },
      {
        label: "Avg Price",
        value: formatComponentCurrency(averagePrice),
        note: averageDuration ? `Avg ${formatComponentDuration(averageDuration)}` : "Current page",
        icon: Wallet,
        iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
      },
      {
        label: "Visible Types",
        value: visibleTypes.size.toLocaleString(),
        note: componentTypeFilter || "All component types",
        icon: Gem,
        iconClassName: "bg-[#e7fbf4] text-[#20ab77]",
      },
    ];
  }, [componentTypeFilter, components, metaData.totalItems, metaData.totalPages]);

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

  const sortedComponents = useMemo(
    () => sortComponents(components, selectedSort),
    [components, selectedSort],
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
            label="Component"
            sortKey="component"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        key: "component",
        render: (_, component) => (
          <div className="flex items-center gap-3">
            <ComponentPreview component={component} />
            <div>
              <p className="text-sm font-bold text-[#432744]">{component.name}</p>

            </div>
          </div>
        ),
      },
      {
        title: (
          <SortableHeader
            label="Type"
            sortKey="type"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "componentType",
        key: "componentType",
        render: (value) => <TypeBadge type={value} />,
      },
      {
        title: (
          <SortableHeader
            label="Price"
            sortKey="price"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "priceLabel",
        key: "priceLabel",
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: (
          <SortableHeader
            label="Duration"
            sortKey="duration"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "durationLabel",
        key: "durationLabel",
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, component) => (
          <ActionDropdown
            items={[
              {
                key: "view",
                label: "View Detail",
                icon: Eye,
                onSelect: () => navigate(getAdminComponentDetailRoute(component.componentId)),
              },
              {
                key: "edit",
                label: "Edit Component",
                icon: Pencil,
                onSelect: () =>
                  navigate(getAdminComponentDetailRoute(component.componentId), {
                    state: { startInEdit: true },
                  }),
              },
              {
                key: "delete",
                label: "Delete Component",
                icon: Trash2,
                className: "text-[#d14c84]",
                onSelect: () => setDeleteTarget(component),
              },
            ]}
          />
        ),
      },
    ],
    [navigate, selectedSort],
  );

  const handleDeleteComponent = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminComponent(deleteTarget.componentId);
      setDeleteTarget(null);
      toast.success(`${deleteTarget.name} deleted successfully.`);

      const shouldMoveBack = components.length === 1 && metaData.currentPage > 1;
      const targetPage = shouldMoveBack ? Math.max(metaData.currentPage - 1, 1) : metaData.currentPage;

      const response = await fetchAdminComponents({
        pageNumber: targetPage,
        pageSize: metaData.pageSize,
        name: debouncedQuery,
        componentType: componentTypeFilter,
      });
      setComponents(response.items);
      setMetaData(response.metaData);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete component.");
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
          <div className="rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
            {error}
          </div>
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
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search component by name..."
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
                Search
              </button>
            </div>

            <select
              value={componentTypeFilter}
              onChange={(event) => {
                setComponentTypeFilter(event.target.value);
                setMetaData((current) => ({
                  ...current,
                  currentPage: 1,
                }));
              }}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">All types</option>
              {COMPONENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <Link
            to={ROUTES.adminComponentsCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            Add Component
          </Link>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">Components</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} components
            </p>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={sortedComponents}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 980 }}
            locale={{ emptyText: error || "No components found." }}
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} components
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
      </section>

      {deleteTarget ? (
        <ActionConfirmModal
          open
          intent="danger"
          title="Delete Component"
          subtitle="This will permanently remove the component from backend."
          description={`You are about to delete ${deleteTarget.name}. This action cannot be undone.`}
          confirmText="Delete Component"
          cancelText="Keep Component"
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteComponent}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            image: deleteTarget.imageUrl || undefined,
            title: deleteTarget.name,
            meta: `${deleteTarget.componentType} • ${deleteTarget.priceLabel}`,
            note: `Component ID: ${deleteTarget.componentId}`,
          }}
          warnings={["This action calls the backend delete endpoint and removes this component record."]}
        />
      ) : null}
    </>
  );
}
