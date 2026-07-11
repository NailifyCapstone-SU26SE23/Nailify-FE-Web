import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  TimerReset,
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
  getAdminProcedureDetailRoute,
} from "../../../../shared/constants/routes";
import {
  deleteAdminProcedure,
  fetchAdminProcedures,
  formatProcedureDuration,
} from "../services/proceduresManagementService";

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

function ProcedureStatusBadge({ status }) {
  const toneMap = {
    Active: "bg-[#e7fbf4] text-[#159669]",
    Inactive: "bg-[#fff1f5] text-[#d14c84]",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${toneMap[status] || "bg-[#fff7fb] text-[#c694ad]"}`}>
      {status}
    </span>
  );
}

function ProcedureRequiredBadge({ isRequired }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        isRequired ? "bg-[#fff4df] text-[#d9871c]" : "bg-[#f3ebff] text-[#7e4fe6]"
      }`}
    >
      {isRequired ? "Required" : "Optional"}
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

function sortProcedures(items, sortValue) {
  const [sortKey = "procedure", sortDirection = "asc"] = String(sortValue || "procedure-asc").split("-");
  const directionMultiplier = sortDirection === "desc" ? -1 : 1;

  return [...items].sort((left, right) => {
    const getSortValue = (item) => {
      switch (sortKey) {
        case "duration":
          return Number(item.duration || 0);
        case "required":
          return item.isRequired ? 1 : 0;
        case "status":
          return item.status || "";
        case "created":
          return new Date(item.createAt || 0).getTime();
        case "procedure":
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

export function ProceduresManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [procedures, setProcedures] = useState([]);
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
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRequired, setSelectedRequired] = useState("");
  const [selectedSort, setSelectedSort] = useState("created-desc");
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
      setDebouncedQuery(query.trim().toLowerCase());
      setMetaData((current) => ({
        ...current,
        currentPage: 1,
      }));
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadProcedures = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminProcedures({
          pageIndex: metaData.currentPage,
          pageSize: metaData.pageSize,
        });

        if (!isMounted) {
          return;
        }

        setProcedures(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setProcedures([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load procedures.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProcedures();

    return () => {
      isMounted = false;
    };
  }, [metaData.currentPage, metaData.pageSize]);

  const summaryCards = useMemo(() => {
    const activeCount = procedures.filter((item) => item.status === "Active").length;
    const requiredCount = procedures.filter((item) => item.isRequired).length;
    const averageDuration = procedures.length
      ? Math.round(procedures.reduce((sum, item) => sum + item.duration, 0) / procedures.length)
      : 0;

    return [
      {
        label: "Total Procedures",
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} pages`,
        icon: ClipboardList,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: "Active Items",
        value: activeCount.toLocaleString(),
        note: "Current page",
        icon: Sparkles,
        iconClassName: "bg-[#e7fbf4] text-[#20ab77]",
      },
      {
        label: "Required Steps",
        value: requiredCount.toLocaleString(),
        note: "Current page",
        icon: TimerReset,
        iconClassName: "bg-[#fff4df] text-[#d9871c]",
      },
      {
        label: "Avg Duration",
        value: formatProcedureDuration(averageDuration),
        note: "Current page",
        icon: TimerReset,
        iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
      },
    ];
  }, [metaData.totalItems, metaData.totalPages, procedures]);

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

  const filteredProcedures = useMemo(() => {
    return procedures.filter((procedure) => {
      const normalizedStatus = String(procedure.status || "").toLowerCase();
      const matchesQuery =
        !debouncedQuery ||
        String(procedure.name || "").toLowerCase().includes(debouncedQuery) ||
        String(procedure.description || "").toLowerCase().includes(debouncedQuery);
      const matchesStatus = !selectedStatus || normalizedStatus === selectedStatus.toLowerCase();
      const matchesRequired =
        !selectedRequired ||
        (selectedRequired === "required" ? procedure.isRequired : !procedure.isRequired);

      return matchesQuery && matchesStatus && matchesRequired;
    });
  }, [debouncedQuery, procedures, selectedRequired, selectedStatus]);

  const sortedProcedures = useMemo(
    () => sortProcedures(filteredProcedures, selectedSort),
    [filteredProcedures, selectedSort],
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
            label="Procedure"
            sortKey="procedure"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        key: "procedure",
        render: (_, procedure) => (
          <div className="flex items-center gap-3">
            
            <div>
              <p className="text-sm font-bold text-[#432744]">{procedure.name}</p>
            
            </div>
          </div>
        ),
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
        title: (
          <SortableHeader
            label="Required"
            sortKey="required"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "isRequired",
        key: "isRequired",
        render: (value) => <ProcedureRequiredBadge isRequired={value} />,
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
        render: (value) => <ProcedureStatusBadge status={value} />,
      },
      {
        title: (
          <SortableHeader
            label="Created"
            sortKey="created"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "createAtLabel",
        key: "createAtLabel",
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, procedure) => (
          <ActionDropdown
            items={[
              {
                key: "view",
                label: "View Detail",
                icon: Eye,
                onSelect: () => navigate(getAdminProcedureDetailRoute(procedure.procedureId)),
              },
              {
                key: "edit",
                label: "Edit Procedure",
                icon: Pencil,
                onSelect: () =>
                  navigate(getAdminProcedureDetailRoute(procedure.procedureId), {
                    state: { startInEdit: true },
                  }),
              },
              {
                key: "delete",
                label: "Delete Procedure",
                icon: Trash2,
                className: "text-[#d14c84]",
                onSelect: () => setDeleteTarget(procedure),
              },
            ]}
          />
        ),
      },
    ],
    [navigate, selectedSort],
  );

  const handleDeleteProcedure = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminProcedure(deleteTarget.procedureId);
      setDeleteTarget(null);
      toast.success(`${deleteTarget.name} deleted successfully.`);

      const shouldMoveBack = procedures.length === 1 && metaData.currentPage > 1;
      const targetPage = shouldMoveBack ? Math.max(metaData.currentPage - 1, 1) : metaData.currentPage;

      const response = await fetchAdminProcedures({
        pageIndex: targetPage,
        pageSize: metaData.pageSize,
      });
      setProcedures(response.items);
      setMetaData(response.metaData);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete procedure.");
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
          <div className="flex w-full flex-col gap-3 xl:max-w-6xl xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search procedure by name or description..."
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
              value={selectedRequired}
              onChange={(event) => setSelectedRequired(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">All required</option>
              <option value="required">Required</option>
              <option value="optional">Optional</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <Link
            to={ROUTES.adminProceduresCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            Add Procedure
          </Link>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">Procedures</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} procedures
            </p>
          </div>

          <Table
            rowKey="procedureId"
            columns={columns}
            dataSource={sortedProcedures}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 1100 }}
            locale={{ emptyText: error || "No procedures found." }}
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} procedures
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
          title="Delete Procedure"
          subtitle="This will permanently remove the procedure from backend."
          description={`You are about to delete ${deleteTarget.name}. This action cannot be undone.`}
          confirmText="Delete Procedure"
          cancelText="Keep Procedure"
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteProcedure}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            title: deleteTarget.name,
            meta: `${deleteTarget.durationLabel} | ${deleteTarget.status}`,
            
          }}
          warnings={["This action calls the backend delete endpoint and removes this procedure record."]}
        />
      ) : null}
    </>
  );
}
