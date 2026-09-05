import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderTree,
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
import { Table, Tooltip } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminSkillTypeDetailRoute,
} from "../../../../shared/constants/routes";
import {
  deleteAdminSkillType,
  fetchAdminSkillTypes,
} from "../services/skillTypesManagementService";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";



function SkillTypeStatusBadge({ status }) {
  const { t, language } = useLanguage();
  const normalizedStatus = String(status || "").toLowerCase();
  const isStatusActive = normalizedStatus === "active";
  const className = isStatusActive
    ? "bg-[#e7fbf4] text-[#159669]"
    : "bg-[#fff1f5] text-[#d14c84]";

  const displayLabel = isStatusActive ? t("adminSkillTypes.active") : t("adminSkillTypes.inactive");

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>{displayLabel}</span>;
}

export function SkillTypesManagementPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [skillTypes, setSkillTypes] = useState([]);
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

    const loadSkillTypes = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminSkillTypes({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          name: debouncedQuery,
        });

        if (!isMounted) {
          return;
        }

        setSkillTypes(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSkillTypes([]);
        setError(loadError instanceof Error ? loadError.message : t("adminSkillTypes.loadFailed"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSkillTypes();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, metaData.currentPage, metaData.pageSize]);

  const summaryCards = useMemo(() => {
    const activeCount = skillTypes.filter((item) => String(item.status).toLowerCase() === "active").length;
    const describedCount = skillTypes.filter((item) => item.description).length;

    return [
      {
        label: t("adminSkillTypes.totalTypes"),
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} pages`,
        icon: FolderTree,
        color: "#ea4f93",
      },
      {
        label: t("adminSkillTypes.activeTypes"),
        value: activeCount.toLocaleString(),
        note: "Current page",
        icon: Sparkles,
        color: "#20ab77",
      },
      {
        label: t("adminSkillTypes.withDescription"),
        value: describedCount.toLocaleString(),
        note: "Current page",
        icon: FolderTree,
        color: "#d9871c",
      },
      {
        label: t("adminSkillTypes.pageItems"),
        value: skillTypes.length.toLocaleString(),
        note: debouncedQuery || "Current page",
        icon: FolderTree,
        color: "#8b5cf6",
      },
    ];
  }, [debouncedQuery, metaData.totalItems, metaData.totalPages, skillTypes]);

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

  const filteredSkillTypes = useMemo(() => {
    if (!statusFilter) {
      return skillTypes;
    }

    return skillTypes.filter(
      (item) => String(item.status || "").toLowerCase() === statusFilter.toLowerCase(),
    );
  }, [skillTypes, statusFilter]);

  const columns = useMemo(
    () => [
      {
        title: t("adminSkillTypes.skillType"),
        key: "skillType",
        sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
        render: (_, skillType) => (
          <div>
            <p className="text-sm font-bold text-[#432744]">{skillType.name}</p>
            {/* <p className="mt-1 text-[11px] text-[#c694ad]">{skillType.skillTypeId}</p> */}
          </div>
        ),
      },
      {
        title: t("adminSkillTypes.description"),
        dataIndex: "descriptionPreview",
        key: "descriptionPreview",
        sorter: (a, b) => (a.descriptionPreview || "").localeCompare(b.descriptionPreview || ""),
        render: (value) => (
          <p className="max-w-[380px] text-sm text-[#6b5668] line-clamp-2" title={value}>
            {value}
          </p>
        ),
      },
      {
        title: t("adminSkillTypes.status"),
        dataIndex: "status",
        key: "status",
        sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
        render: (value) => <SkillTypeStatusBadge status={value} />,
      },
      {
        title: t("adminSkillTypes.actions"),
        key: "actions",
        align: "right",
        render: (_, skillType) => (
          <div className="flex items-center justify-end gap-1.5">
            <Tooltip title={t("adminSkillTypes.viewDetail")}>
              <button
                type="button"
                onClick={() => navigate(getAdminSkillTypeDetailRoute(skillType.skillTypeId))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
              >
                <Eye size={12} />
              </button>
            </Tooltip>
            <Tooltip title={t("adminSkillTypes.editSkillType")}>
              <button
                type="button"
                onClick={() => navigate(getAdminSkillTypeDetailRoute(skillType.skillTypeId), { state: { startInEdit: true } })}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
              >
                <Pencil size={12} />
              </button>
            </Tooltip>
            <Tooltip title={t("adminSkillTypes.deleteSkillType")}>
              <button
                type="button"
                onClick={() => setDeleteTarget(skillType)}
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

  const handleDeleteSkillType = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminSkillType(deleteTarget.skillTypeId);
      setDeleteTarget(null);
      toast.success(t("adminSkillTypes.deleteSuccess", { name: deleteTarget.name }));

      const shouldMoveBack = skillTypes.length === 1 && metaData.currentPage > 1;
      const targetPage = shouldMoveBack ? Math.max(metaData.currentPage - 1, 1) : metaData.currentPage;

      const response = await fetchAdminSkillTypes({
        pageNumber: targetPage,
        pageSize: metaData.pageSize,
        name: debouncedQuery,
      });
      setSkillTypes(response.items);
      setMetaData(response.metaData);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t("adminSkillTypes.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <section className="flex min-h-full flex-col gap-4">
        {flashMessage ? (
          <div className="rounded-[16px] border border-[#d8f5e7] bg-[#eefcf5] px-4 py-3 text-sm font-medium text-[#16975f]">
            {flashMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">{error}</div>
        ) : null}

        <div className="mb-4">
          <TopMetricsRow metrics={summaryCards} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] border border-[#f8deea] bg-white/70 p-4 shadow-[0_12px_26px_rgba(236,72,153,0.05)] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-3 xl:max-w-4xl xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("adminSkillTypes.searchPlaceholder")}
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
                {t("adminSkillTypes.search")}
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">{t("adminSkillTypes.allStatuses")}</option>
              <option value="Active">{t("adminSkillTypes.active")}</option>
              <option value="Inactive">{t("adminSkillTypes.inactive")}</option>
            </select>
          </div>

          <Link
            to={ROUTES.adminSkillTypesCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            {t("adminSkillTypes.addSkillType")}
          </Link>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">{t("adminSkillTypes.skillTypes")}</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              {t("adminSkillTypes.showingSkillTypes", { first: metaData.firstRowOnPage, last: metaData.lastRowOnPage, total: metaData.totalItems })}
            </p>
          </div>

          <Table
            rowKey="skillTypeId"
            columns={columns}
            dataSource={filteredSkillTypes}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 980 }}
            locale={{ emptyText: error || t("adminSkillTypes.noSkillTypesFound") }}
            className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fff9fb] [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-[0.14em] [&_.ant-table-thead_th]:!text-[#a88a9f] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row>td]:!border-b [&_.ant-table-tbody_.ant-table-row>td]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row]:hover>td:!bg-[#fff9fb] [&_.ant-table-tbody_.ant-table-row>td]:!py-4 [&_.ant-table-tbody_.ant-table-row>td]:!text-[12px] [&_.ant-table-tbody_.ant-table-row>td]:!text-[#5b4256]"
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              {t("adminSkillTypes.showingSkillTypes", { first: metaData.firstRowOnPage, last: metaData.lastRowOnPage, total: metaData.totalItems })}
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
          title={t("adminSkillTypes.deleteSkillTypeTitle")}
          subtitle={t("adminSkillTypes.deleteConfirmSubtitle")}
          description={t("adminSkillTypes.deleteConfirmDesc", { name: deleteTarget.name })}
          confirmText={t("adminSkillTypes.deleteSkillType")}
          cancelText={t("adminSkillTypes.keepSkillType")}
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteSkillType}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            title: deleteTarget.name,
            meta: deleteTarget.status,
            note: `Skill Type ID: ${deleteTarget.skillTypeId}`,
          }}
          warnings={[t("adminSkillTypes.deleteWarning")]}
        />
      ) : null}
    </>
  );
}
