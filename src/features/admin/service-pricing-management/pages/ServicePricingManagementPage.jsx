import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Table, Tooltip } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  HIGHEST_REVENUE_SERVICES,
  MOST_BOOKED_SERVICES,
  PRICING_ALERTS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_TONES,
  STATUS_OPTIONS,
  buildCategoryBreakdown,
  buildServicePricingSummary,
  createEmptyService,
  formatVndCurrency,
} from "../services/mockServicePricing";
import { fetchAdminServices } from "../services/servicePricingService";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[14px] ${item.iconClassName}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[1.9rem] font-extrabold leading-none text-[#432744]">{item.value}</p>
      <p className="mt-1 text-xs font-medium text-[#a98097]">{item.label}</p>
      <p className="mt-2 text-[11px] font-bold text-[#20ab77]">{item.note}</p>
    </article>
  );
}

MetricCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.func.isRequired,
    iconClassName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

function Pill({ children, active = false, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold",
        active ? "bg-[#ea4f93] text-white" : "border border-[#f4d5e3] bg-white text-[#8a7082]",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

Pill.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};

function StatusBadge({ status }) {
  const isActive = status === "Active";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
        isActive ? "bg-[#e8faef] text-[#20ab77]" : "bg-[#f2f4f7] text-[#98a2b3]",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isActive ? "bg-[#20ab77]" : "bg-[#b8bec8]",
        ].join(" ")}
      />
      {status}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

function TogglePill({ enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-5 w-9 items-center rounded-full p-0.5 transition",
        enabled ? "bg-[#ea4f93] justify-end" : "bg-[#f6a8cb] justify-start",
      ].join(" ")}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

TogglePill.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
};

function SidePanel({ title, children }) {
  return (
    <section className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
      <h3 className="text-sm font-extrabold text-[#432744]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

SidePanel.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string.isRequired,
};

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#b6869f]">
        {label}
      </span>
      {children}
    </label>
  );
}

FormField.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string.isRequired,
};

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#311422]/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-[24px] border border-[#f6d8e6] bg-white shadow-[0_28px_80px_rgba(93,28,63,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#f6dbe7] px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-[#432744]">{title}</h3>
            <p className="mt-1 text-sm text-[#b1859d]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f4d5e3] text-[#a17a91]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

ModalShell.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

function ServiceFormModal({ draft, mode, onChange, onClose, onSubmit, errorMessage }) {
  return (
    <ModalShell
      title={mode === "create" ? "Create Service" : "Edit Service"}
      subtitle="Manage mock service pricing, duration, and availability."
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Service Name">
            <input
              value={draft.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label="Category">
            <select
              value={draft.category}
              onChange={(event) => onChange("category", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Base Price">
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => onChange("price", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label="Duration (Min)">
            <input
              type="number"
              min="5"
              step="5"
              value={draft.duration}
              onChange={(event) => onChange("duration", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label="Status">
            <select
              value={draft.status}
              onChange={(event) => onChange("status", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d33b6e]">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#f4d5e3] px-4 py-2 text-sm font-bold text-[#8a7082]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-[image:var(--gradient-accent)] px-5 py-2 text-sm font-bold text-white"
          >
            {mode === "create" ? "Create Service" : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

ServiceFormModal.propTypes = {
  draft: PropTypes.shape({}).isRequired,
  errorMessage: PropTypes.string,
  mode: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

function ConfirmModal({ title, body, label, recordType, onCancel, onConfirm }) {
  return (
    <ActionConfirmModal
      open
      intent="danger"
      title={title}
      subtitle="This will update the current mock pricing state."
      description={body}
      confirmText="Delete"
      cancelText="Keep Record"
      confirmIcon={Trash2}
      onConfirm={onConfirm}
      onCancel={onCancel}
      item={{
        title: label,
        meta: `Pricing record • ${recordType}`,
        note: "This entry will be removed from the current admin UI state.",
      }}
      warnings={[
        "This delete is mock-only and affects the current UI state.",
        "Any screens depending on this record should be reviewed after deletion.",
      ]}
    />
  );
}

ConfirmModal.propTypes = {
  body: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  recordType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

function getAlertTone(tone) {
  switch (tone) {
    case "amber":
      return { icon: CircleAlert, badge: "bg-[#fff4df] text-[#d9871c]" };
    case "rose":
      return { icon: CircleDollarSign, badge: "bg-[#ffe7ef] text-[#ea4f93]" };
    case "sky":
      return { icon: Sparkles, badge: "bg-[#e6f0ff] text-[#4f7df0]" };
    default:
      return { icon: CircleCheck, badge: "bg-[#e7fbf4] text-[#20ab77]" };
  }
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

function sortServices(items, sortValue) {
  const [sortKey = "service", sortDirection = "asc"] = String(sortValue || "service-asc").split("-");
  const directionMultiplier = sortDirection === "desc" ? -1 : 1;

  return [...items].sort((left, right) => {
    const getSortValue = (item) => {
      switch (sortKey) {
        case "category":
          return item.category || "";
        case "price":
          return Number(item.price || 0);
        case "duration":
          return Number(item.duration || 0);
        case "status":
          return item.status || "";
        case "service":
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

export function ServicePricingManagementPage() {
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("service-asc");
  const [flashMessage, setFlashMessage] = useState("");
  const [serviceModal, setServiceModal] = useState({ open: false, mode: "create", recordId: null });
  const [deleteState, setDeleteState] = useState(null);
  const [serviceDraft, setServiceDraft] = useState(createEmptyService);
  const [serviceError, setServiceError] = useState("");
  const [serviceMetaData, setServiceMetaData] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0,
    hasPrevious: false,
    hasNext: false,
    firstRowOnPage: 0,
    lastRowOnPage: 0,
  });
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceLoadError, setServiceLoadError] = useState("");

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setServiceMetaData((current) => ({ ...current, currentPage: 1 }));
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      setIsLoadingServices(true);
      setServiceLoadError("");

      try {
        const response = await fetchAdminServices({
          pageNumber: serviceMetaData.currentPage,
          pageSize: serviceMetaData.pageSize,
          name: debouncedQuery,
        });

        if (!isMounted) {
          return;
        }

        setServices(response.items);
        setServiceMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setServices([]);
        setServiceLoadError(
          loadError instanceof Error ? loadError.message : "Failed to load services.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingServices(false);
        }
      }
    };

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, serviceMetaData.currentPage, serviceMetaData.pageSize]);

  const serviceCategories = useMemo(() => {
    const categories = Array.from(new Set(services.map((service) => service.category).filter(Boolean)));
    return ["All", ...categories];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory = activeCategory === "All" || service.category === activeCategory;
      return matchesCategory;
    });
  }, [activeCategory, services]);

  const sortedServices = useMemo(
    () => sortServices(filteredServices, selectedSort),
    [filteredServices, selectedSort],
  );

  const summaryCards = useMemo(
    () => buildServicePricingSummary(services, []).filter((item) => item.label !== "Add-ons Available"),
    [services],
  );

  const categoryBreakdown = useMemo(() => buildCategoryBreakdown(services), [services]);

  useEffect(() => {
    if (!serviceCategories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [activeCategory, serviceCategories]);

  const servicePaginationItems = useMemo(() => {
    const currentPage = serviceMetaData.currentPage;
    const totalPages = serviceMetaData.totalPages;

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
  }, [serviceMetaData.currentPage, serviceMetaData.totalPages]);

  const openCreateService = () => {
    setServiceDraft(createEmptyService());
    setServiceError("");
    setServiceModal({ open: true, mode: "create", recordId: null });
  };

  const openEditService = (service) => {
    setServiceDraft({
      name: service.name,
      category: service.category,
      price: String(service.price),
      duration: String(service.duration),
      hasAddOn: service.hasAddOn,
      status: service.status,
    });
    setServiceError("");
    setServiceModal({ open: true, mode: "edit", recordId: service.id });
  };

  const getServiceActionItems = (service) => [
    {
      key: "edit-service",
      label: "Edit Service",
      icon: Pencil,
      onSelect: () => openEditService(service),
    },
    {
      key: "delete-service",
      label: "Delete Service",
      icon: Trash2,
      className: "text-[#d14c84]",
      onSelect: () =>
        setDeleteState({
          type: "service",
          recordId: service.id,
          label: service.name,
        }),
    },
  ];

  const submitServiceForm = () => {
    setServiceError("Service create/update API is not connected yet.");
  };

  const handleSortToggle = (sortKey) => {
    setSelectedSort((current) => {
      if (current.startsWith(`${sortKey}-`)) {
        return current.endsWith("-asc") ? `${sortKey}-desc` : `${sortKey}-asc`;
      }

      return `${sortKey}-asc`;
    });
  };

  const serviceColumns = useMemo(() => ([
    {
      title: (
        <SortableHeader
          label="Service Name"
          sortKey="service"
          selectedSort={selectedSort}
          onToggle={handleSortToggle}
        />
      ),
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          <div className="max-w-[200px] truncate text-sm font-bold text-[#432744]">
            {value}
          </div>
        </Tooltip>
      ),
    },
    {
      title: (
        <SortableHeader
          label="Category"
          sortKey="category"
          selectedSort={selectedSort}
          onToggle={handleSortToggle}
        />
      ),
      dataIndex: "category",
      key: "category",
      render: (value) => (
        <Pill
          className={SERVICE_CATEGORY_TONES[value] ?? "border border-[#f4d5e3] bg-white text-[#8a7082]"}
        >
          {value}
        </Pill>
      ),
    },
    {
      title: (
        <SortableHeader
          label="Base Price"
          sortKey="price"
          selectedSort={selectedSort}
          onToggle={handleSortToggle}
        />
      ),
      dataIndex: "price",
      key: "price",
      render: (value) => <span className="text-sm text-[#5f4b5d]">{formatVndCurrency(value)}</span>,
    },
    {
      title: (
        <SortableHeader
          label="Est. Duration"
          sortKey="duration"
          selectedSort={selectedSort}
          onToggle={handleSortToggle}
        />
      ),
      dataIndex: "duration",
      key: "duration",
      render: (value) => <span className="text-sm text-[#5f4b5d]">{formatDurationMinutes(value)}</span>,
    },
    {
      title: (
        <SortableHeader
          label="Status"
          sortKey="status"
          selectedSort={selectedSort}
          onToggle={handleSortToggle}
        />
      ),
      dataIndex: "status",
      key: "status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, service) => <ActionDropdown items={getServiceActionItems(service)} />,
    },
  ]), [getServiceActionItems, selectedSort]);

  return (
    <>
      <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4fa_100%)]">
        {flashMessage ? (
          <div className="rounded-[18px] border border-[#d8f5e7] bg-[#eefcf5] px-4 py-3 text-sm font-medium text-[#16975f]">
            {flashMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] border border-[#f8deea] bg-white/70 p-4 shadow-[0_12px_26px_rgba(236,72,153,0.05)] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-3 xl:max-w-6xl xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search services or pricing..."
                  className="h-10 w-full rounded-full border border-[#f4d7e5] bg-[#fffafc] pl-11 pr-4 text-sm text-[#5b4658] outline-none placeholder:text-[#d4a1b8] focus:border-[#ea4f93]"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  setServiceMetaData((current) => ({
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
              value={activeCategory}
              onChange={(event) => setActiveCategory(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              {serviceCategories.map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? "All categories" : category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateService}
              className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] w-35"
            >
              <Plus size={13} className="mr-1.5 inline" />
              Add Service
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_310px]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
              <div className="border-b border-[#f6dbe7] px-5 py-4">
                <h2 className="text-sm font-extrabold text-[#432744]">Services</h2>
                <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
                  Showing {serviceMetaData.firstRowOnPage}-{serviceMetaData.lastRowOnPage} of{" "}
                  {serviceMetaData.totalItems} services
                </p>
              </div>

              <Table
                rowKey="id"
                columns={serviceColumns}
                dataSource={sortedServices}
                loading={isLoadingServices}
                pagination={false}
                scroll={{ x: 800 }}
                locale={{ emptyText: serviceLoadError || "No services found." }}
              />

              <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-[#c694ad]">
                  Showing {serviceMetaData.firstRowOnPage}-{serviceMetaData.lastRowOnPage} of{" "}
                  {serviceMetaData.totalItems} services
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={!serviceMetaData.hasPrevious || isLoadingServices}
                    onClick={() =>
                      setServiceMetaData((current) => ({
                        ...current,
                        currentPage: Math.max(current.currentPage - 1, 1),
                      }))
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  {servicePaginationItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={item === "..." || item === serviceMetaData.currentPage || isLoadingServices}
                      onClick={() => {
                        if (typeof item !== "number") {
                          return;
                        }

                        setServiceMetaData((current) => ({ ...current, currentPage: item }));
                      }}
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[11px] ${item === serviceMetaData.currentPage
                        ? "bg-[#ea4f93] font-bold text-white"
                        : "border border-[#f3cade] bg-white font-medium text-[#b9849f]"
                        } disabled:cursor-default disabled:opacity-100`}
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={!serviceMetaData.hasNext || isLoadingServices}
                    onClick={() =>
                      setServiceMetaData((current) => ({
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

          <aside className="space-y-4">
            <SidePanel title="Insights">
              <div className="space-y-4">
                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fff8fb] p-4">
                  <p className="text-xs font-extrabold text-[#432744]">Most Booked Services</p>
                  <div className="mt-3 space-y-3">
                    {MOST_BOOKED_SERVICES.map(([name, value], index) => (
                      <div key={name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ffe7ef] text-[10px] font-extrabold text-[#ea4f93]">
                            {index + 1}
                          </span>
                          <span className="text-xs font-medium text-[#5d4c5c]">{name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#ea4f93]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fff8fb] p-4">
                  <p className="text-xs font-extrabold text-[#432744]">Highest Revenue Services</p>
                  <div className="mt-3 space-y-3">
                    {HIGHEST_REVENUE_SERVICES.map(([name, value, progress]) => (
                      <div key={name}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[#5d4c5c]">{name}</span>
                          <span className="text-[11px] font-bold text-[#ea4f93]">{value}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#f8dce8]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#ea4f93_0%,#f38cba_100%)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fff8fb] p-4">
                  <p className="text-xs font-extrabold text-[#432744]">Pricing Alerts</p>
                  <div className="mt-3 space-y-3">
                    {PRICING_ALERTS.map((alert) => {
                      const tone = getAlertTone(alert.tone);
                      const Icon = tone.icon;

                      return (
                        <div key={alert.title} className="flex items-start gap-3">
                          <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.badge}`}>
                            <Icon size={14} />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-[#432744]">{alert.title}</p>
                            <p className="mt-1 text-[11px] leading-5 text-[#8a7082]">{alert.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fff8fb] p-4">
                  <p className="text-xs font-extrabold text-[#432744]">Category Breakdown</p>
                  <div className="mt-3 space-y-3">
                    {categoryBreakdown.map(([name, count]) => (
                      <div key={name}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[#5d4c5c]">{name}</span>
                          <span className="text-[11px] font-bold text-[#ea4f93]">{count}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#f8dce8]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#ea4f93_0%,#f38cba_100%)]"
                            style={{ width: `${Math.min(count * 12, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SidePanel>
          </aside>
        </div>
      </section>

      {serviceModal.open ? (
        <ServiceFormModal
          mode={serviceModal.mode}
          draft={serviceDraft}
          errorMessage={serviceError}
          onClose={() => setServiceModal({ open: false, mode: "create", recordId: null })}
          onChange={(field, value) => setServiceDraft((current) => ({ ...current, [field]: value }))}
          onSubmit={submitServiceForm}
        />
      ) : null}

      {deleteState ? (
        <ConfirmModal
          title="Delete Service"
          body={`Are you sure you want to delete ${deleteState.label}? This record will be removed from the current admin UI state.`}
          label={deleteState.label}
          recordType="Service"
          onCancel={() => setDeleteState(null)}
          onConfirm={() => {
            setFlashMessage("Service delete API is not connected yet.");
            setDeleteState(null);
          }}
        />
      ) : null}
    </>
  );
}
