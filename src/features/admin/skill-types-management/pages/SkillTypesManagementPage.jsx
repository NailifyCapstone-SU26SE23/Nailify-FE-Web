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
import { Table } from "antd";
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

function sortSkillTypes(items, sortValue) {
  const [sortKey = "skillType", sortDirection = "asc"] = String(sortValue || "skillType-asc").split("-");
  const directionMultiplier = sortDirection === "desc" ? -1 : 1;

  return [...items].sort((left, right) => {
    const getSortValue = (item) => {
      switch (sortKey) {
        case "description":
          return item.descriptionPreview || "";
        case "status":
          return item.status || "";
        case "skillType":
        default:
          return item.name || "";
      }
    };

    return String(getSortValue(left)).localeCompare(String(getSortValue(right))) * directionMultiplier;
  });
}

export function SkillTypesManagementPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSort, setSelectedSort] = useState("skillType-asc");
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
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: t("adminSkillTypes.activeTypes"),
        value: activeCount.toLocaleString(),
        note: "Current page",
        icon: Sparkles,
        iconClassName: "bg-[#e7fbf4] text-[#20ab77]",
      },
      {
        label: t("adminSkillTypes.withDescription"),
        value: describedCount.toLocaleString(),
        note: "Current page",
        icon: FolderTree,
        iconClassName: "bg-[#fff4df] text-[#d9871c]",
      },
      {
        label: t("adminSkillTypes.pageItems"),
        value: skillTypes.length.toLocaleString(),
        note: debouncedQuery || "Current page",
        icon: FolderTree,
        iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
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

  const sortedSkillTypes = useMemo(
    () => sortSkillTypes(filteredSkillTypes, selectedSort),
    [filteredSkillTypes, selectedSort],
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
            label={t("adminSkillTypes.skillType")}
            sortKey="skillType"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        key: "skillType",
        render: (_, skillType) => (
          <div>
            <p className="text-sm font-bold text-[#432744]">{skillType.name}</p>
            {/* <p className="mt-1 text-[11px] text-[#c694ad]">{skillType.skillTypeId}</p> */}
          </div>
        ),
      },
      {
        title: (
          <SortableHeader
            label={t("adminSkillTypes.description")}
            sortKey="description"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "descriptionPreview",
        key: "descriptionPreview",
        render: (value) => (
          <p className="max-w-[380px] text-sm text-[#6b5668] line-clamp-2" title={value}>
            {value}
          </p>
        ),
      },
      {
        title: (
          <SortableHeader
            label={t("adminSkillTypes.status")}
            sortKey="status"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        dataIndex: "status",
        key: "status",
        render: (value) => <SkillTypeStatusBadge status={value} />,
      },
      {
        title: t("adminSkillTypes.actions"),
        key: "actions",
        render: (_, skillType) => (
          <ActionDropdown
            items={[
              {
                key: "view",
                label: t("adminSkillTypes.viewDetail"),
                icon: Eye,
                onSelect: () => navigate(getAdminSkillTypeDetailRoute(skillType.skillTypeId)),
              },
              {
                key: "edit",
                label: t("adminSkillTypes.editSkillType"),
                icon: Pencil,
                onSelect: () =>
                  navigate(getAdminSkillTypeDetailRoute(skillType.skillTypeId), {
                    state: { startInEdit: true },
                  }),
              },
              {
                key: "delete",
                label: t("adminSkillTypes.deleteSkillType"),
                icon: Trash2,
                className: "text-[#d14c84]",
                onSelect: () => setDeleteTarget(skillType),
              },
            ]}
          />
        ),
      },
    ], [navigate, selectedSort, t],
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
            dataSource={sortedSkillTypes}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 980 }}
            locale={{ emptyText: error || t("adminSkillTypes.noSkillTypesFound") }}
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
