import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sliders,
  TimerReset,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Table, Select } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  fetchAdminShapeMethodConfigs,
  deleteAdminShapeMethodConfig,
} from "../services/shapeMethodConfigsManagementService";
import { fetchAdminNailShapes } from "../../nail-shapes-management/services/nailShapesManagementService";

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

function sortConfigs(items, sortValue) {
  const [sortKey = "name", sortDirection = "asc"] = String(sortValue || "name-asc").split("-");
  const directionMultiplier = sortDirection === "desc" ? -1 : 1;

  return [...items].sort((left, right) => {
    const getSortValue = (item) => {
      switch (sortKey) {
        case "price":
          return Number(item.price || 0);
        case "duration":
          return Number(item.duration || 0);
        case "name":
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

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDuration = (value) => `${value} mins`;

export function ShapeMethodConfigsManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [nailShapeId, setNailShapeId] = useState(null);
  const [nailShapes, setNailShapes] = useState([]);
  const [selectedSort, setSelectedSort] = useState("name-asc");
  const [configs, setConfigs] = useState([]);
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

  // Load Nail Shapes for Filter
  useEffect(() => {
    fetchAdminNailShapes({ pageNumber: 1, pageSize: 100 })
      .then(res => setNailShapes(res.items))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadConfigs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminShapeMethodConfigs({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          name: debouncedQuery,
          nailShapeId: nailShapeId,
        });

        if (!isMounted) {
          return;
        }

        setConfigs(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setConfigs([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load shape method configs.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadConfigs();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, nailShapeId, metaData.currentPage, metaData.pageSize]);

  const summaryCards = useMemo(() => {
    const totalPrice = configs.reduce((sum, item) => sum + item.price, 0);
    const totalDuration = configs.reduce((sum, item) => sum + item.duration, 0);
    const averagePrice = configs.length ? Math.round(totalPrice / configs.length) : 0;
    const averageDuration = configs.length ? Math.round(totalDuration / configs.length) : 0;

    return [
      {
        label: "Total Configs",
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} pages`,
        icon: Sliders,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: "Avg Price",
        value: formatCurrency(averagePrice),
        note: "Current page",
        icon: Wallet,
        iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
      },
      {
        label: "Avg Duration",
        value: formatDuration(averageDuration),
        note: "Current page",
        icon: TimerReset,
        iconClassName: "bg-[#e7fbf4] text-[#20ab77]",
      },
    ];
  }, [metaData.totalItems, metaData.totalPages, configs]);

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
    for (let index = 0; index < normalizedPages.length; index++) {
      const current = normalizedPages[index];
      result.push(current);

      if (index < normalizedPages.length - 1) {
        const next = normalizedPages[index + 1];
        if (next - current > 1) {
          result.push("ellipsis");
        }
      }
    }

    return result;
  }, [metaData.currentPage, metaData.totalPages]);

  const handleSortToggle = (key) => {
    setSelectedSort((current) => {
      if (current === `${key}-asc`) {
        return `${key}-desc`;
      }

      return `${key}-asc`;
    });
  };

  const handlePageChange = (page) => {
    if (page === metaData.currentPage || page < 1 || page > metaData.totalPages) {
      return;
    }

    setMetaData((current) => ({
      ...current,
      currentPage: page,
    }));
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.shapeMethodConfigId || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading(`Deleting ${deleteTarget.name}...`);

    try {
      await deleteAdminShapeMethodConfig(deleteTarget.shapeMethodConfigId);
      setConfigs((current) => current.filter((item) => item.shapeMethodConfigId !== deleteTarget.shapeMethodConfigId));
      setMetaData((current) => ({
        ...current,
        totalItems: Math.max(0, current.totalItems - 1),
      }));
      toast.success(`${deleteTarget.name} has been deleted.`, { id: toastId });
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete shape method config.", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusClasses = (status) => {
    if (status === "Active") return "bg-green-100 text-green-700";
    if (status === "Inactive") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const sortedConfigs = useMemo(() => sortConfigs(configs, selectedSort), [configs, selectedSort]);

  const columns = [
    {
      title: <SortableHeader label="Name" sortKey="name" selectedSort={selectedSort} onToggle={handleSortToggle} />,
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-bold text-[#432744]">{text}</span>,
    },
    {
      title: "Shape",
      dataIndex: "nailShapeId",
      key: "nailShapeId",
      render: (shapeId) => {
        const shape = nailShapes.find(s => s.nailShapeId === shapeId);
        return shape ? shape.name : `--`;
      },
    },
    {
      title: <SortableHeader label="Price" sortKey="price" selectedSort={selectedSort} onToggle={handleSortToggle} />,
      dataIndex: "price",
      key: "price",
      render: (price) => <span className="font-semibold text-[#8b5cf6]">{formatCurrency(price)}</span>,
    },
    {
      title: <SortableHeader label="Duration" sortKey="duration" selectedSort={selectedSort} onToggle={handleSortToggle} />,
      dataIndex: "duration",
      key: "duration",
      render: (duration) => <span className="font-semibold text-[#20ab77]">{formatDuration(duration)}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(status)}`}>
          {status}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <ActionDropdown
          items={[
            {
              key: "view",
              label: "View Details",
              icon: Eye,
              onSelect: () => navigate(ROUTES.adminShapeMethodConfigDetail.replace(":configId", record.shapeMethodConfigId)),
            },
            {
              key: "edit",
              label: "Edit",
              icon: Pencil,
              onSelect: () => navigate(ROUTES.adminShapeMethodConfigDetail.replace(":configId", record.shapeMethodConfigId)),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              danger: true,
              onSelect: () => setDeleteTarget(record),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {flashMessage ? (
        <div className="rounded-[18px] border border-[#d3f4e6] bg-[#ecfdf4] p-4 text-sm font-semibold text-[#148956] shadow-sm">
          {flashMessage}
        </div>
      ) : null}

      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#432744]">Shape Method Configs</h1>
          <p className="mt-1 text-sm font-medium text-[#b58a9f]">Manage configuration and pricing for nail shape methods.</p>
        </div>

        <Link
          to={ROUTES.adminShapeMethodConfigsCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(236,72,153,0.35)]"
        >
          <Plus size={18} />
          Create Config
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <MetricCard key={card.label} item={card} />
        ))}
      </section>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#cd98b1]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search configs by name..."
            className="h-12 w-full rounded-full border border-[#f8dce8] bg-white pl-11 pr-4 text-sm font-medium text-[#432744] shadow-sm outline-none transition-all placeholder:text-[#cd98b1] focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10"
          />
        </div>
        <div className="relative">
          <Select
            allowClear
            placeholder="Filter by Nail Shape"
            style={{ width: 220, height: 48 }}
            className="rounded-full shadow-sm [&>.ant-select-selector]:!rounded-full [&>.ant-select-selector]:!h-12 [&>.ant-select-selector]:!items-center [&>.ant-select-selector]:!border-[#f8dce8]"
            onChange={(val) => setNailShapeId(val)}
            options={nailShapes.map(s => ({ value: s.nailShapeId, label: s.name }))}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-[24px] border border-[#f8dce8] bg-white shadow-[0_12px_32px_rgba(236,72,153,0.05)]">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={sortedConfigs}
            rowKey="shapeMethodConfigId"
            pagination={false}
            loading={isLoading}
            className="w-full text-sm [&_.ant-table-thead_th]:!bg-[#fffafc] [&_.ant-table-thead_th]:!text-[#cd98b1] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-wider"
          />
        </div>

        {metaData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#fdebf3] bg-[#fffafc] px-6 py-4">
            <p className="text-xs font-semibold text-[#b58a9f]">
              Showing <span className="text-[#ea4f93]">{metaData.firstRowOnPage}</span> to{" "}
              <span className="text-[#ea4f93]">{metaData.lastRowOnPage}</span> of{" "}
              <span className="text-[#ea4f93]">{metaData.totalItems}</span> results
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!metaData.hasPrevious}
                onClick={() => handlePageChange(metaData.currentPage - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#ea4f93] transition-colors hover:bg-[#ffe8f2] disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              {paginationItems.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <span key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-[#cd98b1]">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handlePageChange(item)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${item === metaData.currentPage
                        ? "bg-[#ea4f93] text-white shadow-md"
                        : "text-[#5f4a5c] hover:bg-[#ffe8f2] hover:text-[#ea4f93]"
                      }`}
                  >
                    {item}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={!metaData.hasNext}
                onClick={() => handlePageChange(metaData.currentPage + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#ea4f93] transition-colors hover:bg-[#ffe8f2] disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {deleteTarget && (
        <ActionConfirmModal
          isOpen
          title="Delete Config"
          description={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          icon={Trash2}
          isDestructive
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
            }
          }}
        />
      )}
    </div>
  );
}
