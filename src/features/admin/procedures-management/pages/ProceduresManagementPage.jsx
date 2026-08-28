import { useLanguage } from "../../../../shared/hooks/useLanguage";
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
import { Table, Tooltip } from "antd";
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
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";



function ProcedureStatusBadge({ status }) {
  const { t, language } = useLanguage();
  const toneMap = {
    Active: "bg-[#e7fbf4] text-[#159669]",
    Inactive: "bg-[#fff1f5] text-[#d14c84]",
  };

  const isStatusActive = String(status || "").toLowerCase() === "active";
  const displayLabel = isStatusActive ? t("adminProcedures.active") : t("adminProcedures.inactive");

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${isStatusActive ? toneMap.Active : toneMap.Inactive}`}>
      {displayLabel}
    </span>
  );
}

function ProcedureRequiredBadge({ isRequired }) {
  const { t, language } = useLanguage();
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${isRequired ? "bg-[#fff4df] text-[#d9871c]" : "bg-[#f3ebff] text-[#7e4fe6]"
        }`}
    >
      {isRequired ? t("adminProcedures.required") : t("adminProcedures.optional")}
    </span>
  );
}

export function ProceduresManagementPage() {
  const { t, language } = useLanguage();
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
        setError(loadError instanceof Error ? loadError.message : t("adminProcedures.loadFailed"));
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
        label: t("adminProcedures.totalProcedures"),
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} pages`,
        icon: ClipboardList,
        color: "#ea4f93",
      },
      {
        label: t("adminProcedures.activeItems"),
        value: activeCount.toLocaleString(),
        note: "Current page",
        icon: Sparkles,
        color: "#20ab77",
      },
      {
        label: t("adminProcedures.requiredSteps"),
        value: requiredCount.toLocaleString(),
        note: "Current page",
        icon: TimerReset,
        color: "#d9871c",
      },
      {
        label: t("adminProcedures.avgDuration"),
        value: formatProcedureDuration(averageDuration),
        note: "Current page",
        icon: TimerReset,
        color: "#8b5cf6",
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

  const columns = useMemo(
    () => [
      {
        title: t("adminProcedures.procedure"),
        key: "procedure",
        sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
        render: (_, procedure) => (
          <div className="flex items-center gap-3">

            <div>
              <p className="text-sm font-bold text-[#432744]">{procedure.name}</p>

            </div>
          </div>
        ),
      },
      {
        title: t("adminProcedures.duration"),
        dataIndex: "durationLabel",
        key: "durationLabel",
        sorter: (a, b) => Number(a.duration || 0) - Number(b.duration || 0),
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: t("adminProcedures.required"),
        dataIndex: "isRequired",
        key: "isRequired",
        sorter: (a, b) => (a.isRequired === b.isRequired ? 0 : a.isRequired ? -1 : 1),
        render: (value) => <ProcedureRequiredBadge isRequired={value} />,
      },
      {
        title: t("adminProcedures.status"),
        dataIndex: "status",
        key: "status",
        sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
        render: (value) => <ProcedureStatusBadge status={value} />,
      },
      {
        title: t("adminProcedures.created"),
        dataIndex: "createAtLabel",
        key: "createAtLabel",
        sorter: (a, b) => new Date(a.createAt || 0).getTime() - new Date(b.createAt || 0).getTime(),
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: t("adminProcedures.actions"),
        key: "actions",
        align: "right",
        render: (_, procedure) => (
          <div className="flex items-center justify-end gap-1.5">
            <Tooltip title={t("adminProcedures.viewDetail")}>
              <button
                type="button"
                onClick={() => navigate(getAdminProcedureDetailRoute(procedure.procedureId))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
              >
                <Eye size={12} />
              </button>
            </Tooltip>
            <Tooltip title={t("adminProcedures.editProcedure")}>
              <button
                type="button"
                onClick={() => navigate(getAdminProcedureDetailRoute(procedure.procedureId), { state: { startInEdit: true } })}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
              >
                <Pencil size={12} />
              </button>
            </Tooltip>
            <Tooltip title={t("adminProcedures.deleteProcedure")}>
              <button
                type="button"
                onClick={() => setDeleteTarget(procedure)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-[#fff0f0] text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
              >
                <Trash2 size={12} />
              </button>
            </Tooltip>
          </div>
        ),
      },
    ], [navigate, t],
  );

  const handleDeleteProcedure = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminProcedure(deleteTarget.procedureId);
      setDeleteTarget(null);
      toast.success(t("adminProcedures.deleteSuccess", { name: deleteTarget.name }));

      const shouldMoveBack = procedures.length === 1 && metaData.currentPage > 1;
      const targetPage = shouldMoveBack ? Math.max(metaData.currentPage - 1, 1) : metaData.currentPage;

      const response = await fetchAdminProcedures({
        pageIndex: targetPage,
        pageSize: metaData.pageSize,
      });
      setProcedures(response.items);
      setMetaData(response.metaData);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t("adminProcedures.deleteFailed"));
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

        <div className="mb-4">
          <TopMetricsRow metrics={summaryCards} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] border border-[#f8deea] bg-white/70 p-4 shadow-[0_12px_26px_rgba(236,72,153,0.05)] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-3 xl:max-w-6xl xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("adminProcedures.searchPlaceholder")}
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
                {t("adminProcedures.search")}
              </button>
            </div>

            <select
              value={selectedRequired}
              onChange={(event) => setSelectedRequired(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">{t("adminProcedures.allRequired")}</option>
              <option value="required">{t("adminProcedures.required")}</option>
              <option value="optional">{t("adminProcedures.optional")}</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">{t("adminProcedures.allStatuses")}</option>
              <option value="Active">{t("adminProcedures.active")}</option>
              <option value="Inactive">{t("adminProcedures.inactive")}</option>
            </select>
          </div>
          <div className="w-auto min-w-[150px]">
            <Link
              to={ROUTES.adminProceduresCreate}
              className="inline-flex h-[40px] items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
            >
              <Plus size={13} className="mr-1.5 shrink-0" />
              {t("adminProcedures.addProcedure")}
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">{t("adminProcedures.procedures")}</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              {t("adminProcedures.showingProcedures", { first: metaData.firstRowOnPage, last: metaData.lastRowOnPage, total: metaData.totalItems })}
            </p>
          </div>

          <Table
            rowKey="procedureId"
            columns={columns}
            dataSource={filteredProcedures}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 1100 }}
            locale={{ emptyText: error || t("adminProcedures.noProceduresFound") }}
            className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fff9fb] [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-[0.14em] [&_.ant-table-thead_th]:!text-[#a88a9f] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row>td]:!border-b [&_.ant-table-tbody_.ant-table-row>td]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row]:hover>td:!bg-[#fff9fb] [&_.ant-table-tbody_.ant-table-row>td]:!py-4 [&_.ant-table-tbody_.ant-table-row>td]:!text-[12px] [&_.ant-table-tbody_.ant-table-row>td]:!text-[#5b4256]"
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              {t("adminProcedures.showingProcedures", { first: metaData.firstRowOnPage, last: metaData.lastRowOnPage, total: metaData.totalItems })}
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
          title={t("adminProcedures.deleteProcedureTitle")}
          subtitle={t("adminProcedures.deleteConfirmSubtitle")}
          description={t("adminProcedures.deleteConfirmDesc", { name: deleteTarget.name })}
          confirmText={t("adminProcedures.deleteProcedure")}
          cancelText={t("adminProcedures.keepProcedure")}
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteProcedure}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            title: deleteTarget.name,
            meta: `${deleteTarget.durationLabel} | ${deleteTarget.status}`,

          }}
          warnings={[t("adminProcedures.deleteWarning")]}
        />
      ) : null}
    </>
  );
}
