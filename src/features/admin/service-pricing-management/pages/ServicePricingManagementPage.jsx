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
  Eye,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Tooltip } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";

import { useLanguage } from "../../../../shared/hooks/useLanguage";
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
import { fetchAdminServices, createAdminService, updateAdminService, deleteAdminService } from "../services/servicePricingService";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";



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
  const { language } = useLanguage();
  return (
    <ModalShell
      title={mode === "create" ? language === "vi" ? "Thêm dịch vụ" : "Create Service" : language === "vi" ? "Chỉnh sửa dịch vụ" : "Edit Service"}
      subtitle={language === "vi" ? "Quản lý giá, thời lượng và tình trạng khả dụng của các dịch vụ giả lập." : "Manage mock service pricing, duration, and availability."}
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
          <FormField label={language === "vi" ? "Tên dịch vụ" : "Service Name"}>
            <input
              value={draft.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label={language === "vi" ? "Mô tả" : "Description"}>
            <input
              value={draft.description || ""}
              onChange={(event) => onChange("description", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label={language === "vi" ? "Danh mục" : "Category"}>
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
          <FormField label={language === "vi" ? "Giá cơ bản" : "Base Price"}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => onChange("price", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label={language === "vi" ? "Thời lượng (phút)" : "Duration (Min)"}>
            <input
              type="number"
              min="5"
              step="5"
              value={draft.duration}
              onChange={(event) => onChange("duration", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label={language === "vi" ? "Trạng thái" : "Status"}>
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
            {language === "vi" ? "Hủy" : "Cancel"}
          </button>
          <button
            type="submit"
            className="rounded-full bg-[image:var(--gradient-accent)] px-5 py-2 text-sm font-bold text-white"
          >
            {mode === "create" ? language === "vi" ? "Thêm dịch vụ" : "Create Service" : language === "vi" ? "Lưu thay đổi" : "Save Changes"}
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

function ServiceDetailModal({ service, onClose }) {
  const { language } = useLanguage();
  if (!service) return null;

  return (
    <ModalShell
      title={language === "vi" ? "Chi tiết dịch vụ" : "Service Details"}
      subtitle={language === "vi" ? "Thông tin chi tiết về dịch vụ cấu hình giá và thời gian." : "Detailed service specifications, pricing, and timing configurations."}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#f4d7e5] bg-[#fffafc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a88ea0]">
              {language === "vi" ? "Tên dịch vụ" : "Service Name"}
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#432744]">{service.name}</p>
          </div>
          <div className="rounded-2xl border border-[#f4d7e5] bg-[#fffafc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a88ea0]">
              {language === "vi" ? "Danh mục" : "Category"}
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#432744]">{service.category}</p>
          </div>
          <div className="rounded-2xl border border-[#f4d7e5] bg-[#fffafc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a88ea0]">
              {language === "vi" ? "Giá cơ bản" : "Base Price"}
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#2fa06c]">
              {Number(service.price).toLocaleString("vi-VN")} VND
            </p>
          </div>
          <div className="rounded-2xl border border-[#f4d7e5] bg-[#fffafc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a88ea0]">
              {language === "vi" ? "Thời lượng" : "Duration"}
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#8b5cf6]">
              {service.duration} {language === "vi" ? "phút" : "min"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#f4d7e5] bg-[#fffafc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a88ea0]">
              {language === "vi" ? "Trạng thái" : "Status"}
            </p>
            <span
              className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${service.status === "Active" ? "bg-[#e7fbf4] text-[#23b68b]" : "bg-[#fff0f5] text-[#eb5a99]"
                }`}
            >
              {service.status}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[image:var(--gradient-accent)] px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90"
          >
            {language === "vi" ? "Đóng" : "Close"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

ServiceDetailModal.propTypes = {
  service: PropTypes.shape({
    name: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    duration: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    status: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

function ConfirmModal({ title, body, label, recordType, onCancel, onConfirm }) {
  const { language } = useLanguage();
  return (
    <ActionConfirmModal
      open
      intent="danger"
      title={title}
      subtitle={language === "vi" ? "Hành động này sẽ xóa dịch vụ khỏi hệ thống." : "This will remove the service from the system."}
      description={body}
      confirmText={language === "vi" ? "Xóa" : "Delete"}
      cancelText={language === "vi" ? "Giữ dịch vụ" : "Keep Service"}
      confirmIcon={Trash2}
      onConfirm={onConfirm}
      onCancel={onCancel}
      item={{
        title: label,
        meta: language === "vi" ? `Dịch vụ • ${recordType}` : `Service • ${recordType}`,
        note: language === "vi" ? "Dịch vụ này sẽ bị xóa khỏi danh sách quản lý." : "This service will be removed from the admin list.",
      }}
      warnings={[
        language === "vi" ? "Hành động này không thể hoàn tác từ màn hình này." : "This action cannot be undone from this screen.",
        language === "vi" ? "Các màn hình phụ thuộc vào dịch vụ này nên được kiểm tra sau khi xóa." : "Any screens depending on this service should be reviewed after deletion.",
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


export function ServicePricingManagementPage() {
  const { t, language } = useLanguage();
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [flashMessage, setFlashMessage] = useState("");
  const [serviceModal, setServiceModal] = useState({ open: false, mode: "create", recordId: null });
  const [deleteState, setDeleteState] = useState(null);
  const [serviceDraft, setServiceDraft] = useState(createEmptyService);
  const [serviceError, setServiceError] = useState("");
  const [detailService, setDetailService] = useState(null);
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
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [debouncedQuery, serviceMetaData.currentPage, serviceMetaData.pageSize, refreshKey]);

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

  const summaryCards = useMemo(
    () => {
      const originalSummary = buildServicePricingSummary(services, []).filter((item) => item.label !== "Add-ons Available");
      return originalSummary.map((item) => {
        let label = item.label;
        if (label === "Active Services") {
          label = t("servicePricing.metric.activeServices");
        } else if (label === "Most Booked Service") {
          label = t("servicePricing.metric.mostBooked");
        } else if (label === "Highest Revenue Service") {
          label = t("servicePricing.metric.highestRevenue");
        }
        return { ...item, label };
      });
    },
    [services, t],
  );

  const categoryBreakdown = useMemo(() => buildCategoryBreakdown(services), [services]);

  useEffect(() => {
    if (!serviceCategories.includes(activeCategory)) {
      requestAnimationFrame(() => {
        setActiveCategory("All");
      });
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

  const openCreateService = useCallback(() => {
    setServiceDraft(createEmptyService());
    setServiceError("");
    setServiceModal({ open: true, mode: "create", recordId: null });
  }, []);

  const openEditService = useCallback((service) => {
    setServiceDraft({
      name: service.name,
      description: service.description || "",
      category: service.category,
      price: String(service.price),
      duration: String(service.duration),
      hasAddOn: service.hasAddOn,
      status: service.status,
    });
    setServiceError("");
    setServiceModal({ open: true, mode: "edit", recordId: service.id });
  }, []);

  const getServiceActionItems = useCallback((service) => [
    {
      key: "view-service",
      label: language === "vi" ? "Xem chi tiết" : "View Details",
      icon: Eye,
      onSelect: () => setDetailService(service),
    },
    {
      key: "edit-service",
      label: language === "vi" ? "Chỉnh sửa dịch vụ" : "Edit Service",
      icon: Pencil,
      onSelect: () => openEditService(service),
    },
    {
      key: "delete-service",
      label: language === "vi" ? "Xóa dịch vụ" : "Delete Service",
      icon: Trash2,
      className: "text-[#d14c84]",
      onSelect: () =>
        setDeleteState({
          type: "service",
          recordId: service.id,
          label: service.name,
        }),
    },
  ], [openEditService, t, language]);

  const submitServiceForm = async () => {
    setServiceError("");
    try {
      if (serviceModal.mode === "create") {
        await createAdminService(serviceDraft);
        setFlashMessage(language === "vi" ? "Thêm dịch vụ thành công!" : "Service created successfully!");
      } else {
        await updateAdminService(serviceModal.recordId, serviceDraft);
        setFlashMessage(language === "vi" ? "Cập nhật dịch vụ thành công!" : "Service updated successfully!");
      }
      setServiceModal({ open: false, mode: "create", recordId: null });
      setRefreshKey(k => k + 1);
    } catch (error) {
      setServiceError(error.message || (language === "vi" ? "Không thể lưu dịch vụ." : "Failed to save service."));
    }
  };

  const serviceColumns = useMemo(() => ([
    {
      title: t("servicePricing.table.service"),
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          <div className="max-w-[200px] truncate text-sm font-bold text-[#432744]">
            {value}
          </div>
        </Tooltip>
      ),
    },
    {
      title: t("servicePricing.table.category"),
      dataIndex: "category",
      key: "category",
      sorter: (a, b) => (a.category || "").localeCompare(b.category || ""),
      render: (value) => (
        <Pill
          className={SERVICE_CATEGORY_TONES[value] ?? "border border-[#f4d5e3] bg-white text-[#8a7082]"}
        >
          {value}
        </Pill>
      ),
    },
    {
      title: t("servicePricing.table.price"),
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => Number(a.price || 0) - Number(b.price || 0),
      render: (value) => <span className="text-sm text-[#5f4b5d]">{formatVndCurrency(value)}</span>,
    },
    {
      title: t("servicePricing.table.duration"),
      dataIndex: "duration",
      key: "duration",
      sorter: (a, b) => Number(a.duration || 0) - Number(b.duration || 0),
      render: (value) => <span className="text-sm text-[#5f4b5d]">{formatDurationMinutes(value)}</span>,
    },
    {
      title: t("servicePricing.table.status"),
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (value) => <StatusBadge status={value} />,
    },
    {
      title: t("userManagement.table.actions"),
      key: "actions",
      render: (_, service) => (
        <div className="flex items-center gap-2">
          {getServiceActionItems(service).map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.key} title={item.label}>
                <button
                  type="button"
                  onClick={item.onSelect}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#a17a91] hover:bg-[#fff0f5] hover:text-[#e84d92] transition-colors shadow-sm border border-[#f4d5e3] ${item.className || ""}`}
                >
                  <Icon size={14} />
                </button>
              </Tooltip>
            );
          })}
        </div>
      ),
    },
  ]), [getServiceActionItems, t]);

  return (
    <>
      <section className="flex min-h-full flex-col gap-4">
        

        <div className="mb-4">
          <TopMetricsRow metrics={summaryCards} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[#f8deea] bg-white/70 p-2 shadow-[0_12px_26px_rgba(236,72,153,0.05)] xl:flex-row xl:items-center xl:justify-between">
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
                  placeholder={t("servicePricing.filter.searchPlaceholder")}
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
                {t("userManagement.table.actions") === "Thao tác" ? "Tìm kiếm" : "Search"}
              </button>
            </div>

            <select
              value={activeCategory}
              onChange={(event) => setActiveCategory(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              {serviceCategories.map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? t("servicePricing.filter.allCategories") : category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateService}
              className="whitespace-nowrap rounded-full bg-[image:var(--gradient-accent)] px-5 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
            >
              <Plus size={13} className="mr-1.5 inline" />
              {t("userManagement.table.actions") === "Thao tác" ? "Thêm dịch vụ" : "Add Service"}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-lg border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
              {/* <div className="border-b border-[#f6dbe7] px-5 py-4">
                <h2 className="text-sm font-extrabold text-[#432744]">{t("menus.admin-service-pricing")}</h2>
                <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
                  {t("userManagement.table.actions") === "Thao tác"
                    ? `Hiển thị ${serviceMetaData.firstRowOnPage}-${serviceMetaData.lastRowOnPage} trong số ${serviceMetaData.totalItems} dịch vụ`
                    : `Showing ${serviceMetaData.firstRowOnPage}-${serviceMetaData.lastRowOnPage} of ${serviceMetaData.totalItems} services`
                  }
                </p>
              </div> */}

              <Table
                rowKey="id"
                columns={serviceColumns}
                dataSource={filteredServices}
                loading={isLoadingServices}
                pagination={false}
                scroll={{ x: 800 }}
                locale={{ emptyText: serviceLoadError || "No services found." }}
                className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fff9fb] [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-[0.14em] [&_.ant-table-thead_th]:!text-[#a88a9f] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row>td]:!border-b [&_.ant-table-tbody_.ant-table-row>td]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row]:hover>td:!bg-[#fff9fb] [&_.ant-table-tbody_.ant-table-row>td]:!py-4 [&_.ant-table-tbody_.ant-table-row>td]:!text-[12px] [&_.ant-table-tbody_.ant-table-row>td]:!text-[#5b4256]"
              />

              <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-[#c694ad]">
                  {language === "vi" ? `Hiển thị ${serviceMetaData.firstRowOnPage}-${serviceMetaData.lastRowOnPage} trong số ${serviceMetaData.totalItems} dịch vụ`
                    : `Showing ${serviceMetaData.firstRowOnPage}-${serviceMetaData.lastRowOnPage} of ${serviceMetaData.totalItems} services`}
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

      {detailService ? (
        <ServiceDetailModal
          service={detailService}
          onClose={() => setDetailService(null)}
        />
      ) : null}

      {deleteState ? (
        <ConfirmModal
          title={language === "vi" ? "Xóa dịch vụ" : "Delete Service"}
          body={
            language === "vi"
              ? `Bạn có chắc muốn xóa dịch vụ ${deleteState.label}? Dịch vụ này sẽ bị xóa khỏi danh sách quản lý.`
              : `Are you sure you want to delete ${deleteState.label}? This service will be removed from the admin list.`
          }
          label={deleteState.label}
          recordType={language === "vi" ? "Dịch vụ" : "Service"}
          onCancel={() => setDeleteState(null)}
          onConfirm={async () => {
            try {
              await deleteAdminService(deleteState.recordId);
              setFlashMessage(language === "vi" ? "Xóa dịch vụ thành công!" : "Service deleted successfully!");
              setRefreshKey(k => k + 1);
            } catch (error) {
              setFlashMessage(error.message || (language === "vi" ? "Không thể xóa dịch vụ." : "Failed to delete service."));
            }
            setDeleteState(null);
          }}
        />
      ) : null}
    </>
  );
}
