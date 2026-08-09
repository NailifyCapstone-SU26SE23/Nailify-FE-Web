import {
  ArrowUpDown,
  BadgePercent,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Table } from "antd";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminPromotionDetailRoute,
} from "../../../../shared/constants/routes";
import {
  deleteAdminPromotion,
  fetchAdminPromotions,
  PROMOTION_DISCOUNT_TYPE_OPTIONS,
  PROMOTION_SCOPE_OPTIONS,
  PROMOTION_TYPE_OPTIONS,
} from "../services/promotionManagementService";

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

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatDiscount(promotion) {
  const value = Number(promotion?.discountValue || 0);
  const discountType = String(promotion?.discountType || "").toLowerCase();

  if (discountType.includes("percent")) {
    return `${value}%`;
  }

  return `${value.toLocaleString("vi-VN")} VND`;
}

function PromotionStatusBadge({ promotion }) {
  const className = promotion?.isActive
    ? "bg-[#e7fbf4] text-[#159669]"
    : "bg-[#fff1f5] text-[#d14c84]";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {promotion?.status || (promotion?.isActive ? "Active" : "Inactive")}
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

function sortPromotions(items, sortValue) {
  const [sortKey = "name", sortDirection = "asc"] = String(sortValue || "name-asc").split("-");
  const directionMultiplier = sortDirection === "desc" ? -1 : 1;

  return [...items].sort((left, right) => {
    const getSortValue = (item) => {
      switch (sortKey) {
        case "type":
          return item.type || "";
        case "scope":
          return item.scope || "";
        case "discount":
          return Number(item.discountValue || 0);
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

export function PromotionsManagementPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState("");
  const [selectedSort, setSelectedSort] = useState("name-asc");
  const [promotions, setPromotions] = useState([]);
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
      setDebouncedQuery(query.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadPromotions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminPromotions({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          type: typeFilter,
          scope: scopeFilter,
          discountType: discountTypeFilter,
        });

        if (!isMounted) {
          return;
        }

        setPromotions(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setPromotions([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load promotions.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPromotions();

    return () => {
      isMounted = false;
    };
  }, [discountTypeFilter, metaData.currentPage, metaData.pageSize, scopeFilter, typeFilter]);

  const summaryCards = useMemo(() => {
    const activeCount = promotions.filter((item) => item.isActive).length;
    const categoryScopedCount = promotions.filter((item) => item.scope === "Category").length;
    const percentDiscountCount = promotions.filter((item) =>
      String(item.discountType || "").toLowerCase().includes("percent"),
    ).length;

    const isVi = t("adminDashboard.year") === "Năm";

    return [
      {
        label: t("promotions.table.promotion"),
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} ${isVi ? "trang" : "pages"}`,
        icon: BadgePercent,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: t("promotionDetail.active"),
        value: activeCount.toLocaleString(),
        note: isVi ? "Trang hiện tại" : "Current page",
        icon: Sparkles,
        iconClassName: "bg-[#e7fbf4] text-[#20ab77]",
      },
      {
        label: t("promotions.table.scope") + " (" + (t("promotionDetail.categoryId") || "Category") + ")",
        value: categoryScopedCount.toLocaleString(),
        note: isVi ? "Trang hiện tại" : "Current page",
        icon: Tag,
        iconClassName: "bg-[#fff4df] text-[#d9871c]",
      },
      {
        label: t("promotions.table.value") + " (%)",
        value: percentDiscountCount.toLocaleString(),
        note: isVi ? "Trang hiện tại" : "Current page",
        icon: CalendarRange,
        iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
      },
    ];
  }, [metaData.totalItems, metaData.totalPages, promotions, t]);

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

  const filteredPromotions = useMemo(() => {
    if (!debouncedQuery) {
      return promotions;
    }

    return promotions.filter((item) =>
      [item.name, item.description, item.type, item.scope]
        .join(" ")
        .toLowerCase()
        .includes(debouncedQuery),
    );
  }, [debouncedQuery, promotions]);

  const sortedPromotions = useMemo(
    () => sortPromotions(filteredPromotions, selectedSort),
    [filteredPromotions, selectedSort],
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
            label={t("promotions.table.promotion")}
            sortKey="name"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        key: "name",
        render: (_, promotion) => (
          <div className="flex items-center gap-3">
            {promotion.imageUrl ? (
              <img
                src={promotion.imageUrl}
                alt={promotion.name}
                className="h-12 w-12 rounded-xl border border-[#f3cade] object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff0f6] text-[#ea4f93]">
                <BadgePercent size={18} />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-[#432744]">{promotion.name}</p>

            </div>
          </div>
        ),
      },
      {
        title: (
          <SortableHeader
            label={t("promotions.table.type")}
            sortKey="type"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        render: (_, promotion) => (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#5f4a5c]">{promotion.type}</p>
            <p className="text-[11px] text-[#c694ad]">{promotion.scope}</p>
          </div>
        ),
      },
      {
        title: (
          <SortableHeader
            label={t("promotions.table.value")}
            sortKey="discount"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        render: (_, promotion) => (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#5f4a5c]">{formatDiscount(promotion)}</p>
            <p className="text-[11px] text-[#c694ad]">{promotion.discountType}</p>
          </div>
        ),
      },
      {
        title: (
          <SortableHeader
            label={t("promotions.table.startDate")}
            sortKey="scope"
            selectedSort={selectedSort}
            onToggle={handleSortToggle}
          />
        ),
        render: (_, promotion) => (
          <div className="space-y-1 text-sm text-[#5f4a5c]">
            <p>{formatDateTime(promotion.startDate)}</p>
            <p className="text-[11px] text-[#c694ad]">
              {t("userManagement.table.actions") === "Thao tác" ? "đến" : "to"}{" "}
              {formatDateTime(promotion.endDate)}
            </p>
          </div>
        ),
      },
      {
        title: t("promotions.table.status"),
        key: "status",
        render: (_, promotion) => <PromotionStatusBadge promotion={promotion} />,
      },
      {
        title: t("userManagement.table.actions"),
        key: "actions",
        render: (_, promotion) => (
          <ActionDropdown
            items={[
              {
                key: "view",
                label: t("view") || "View Detail",
                icon: Eye,
                onSelect: () => navigate(getAdminPromotionDetailRoute(promotion.promotionId)),
              },
              {
                key: "edit",
                label: t("promotionDetail.editTitle"),
                icon: Pencil,
                onSelect: () =>
                  navigate(getAdminPromotionDetailRoute(promotion.promotionId), {
                    state: { startInEdit: true },
                  }),
              },
              {
                key: "delete",
                label: t("promotionDetail.deleteBtn"),
                icon: Trash2,
                className: "text-[#d14c84]",
                onSelect: () => setDeleteTarget(promotion),
              },
            ]}
          />
        ),
      },
    ],
    [navigate, selectedSort, t],
  );

  const handleDeletePromotion = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminPromotion(deleteTarget.promotionId);
      setDeleteTarget(null);
      toast.success(`${deleteTarget.name} deleted successfully.`);

      const shouldMoveBack = promotions.length === 1 && metaData.currentPage > 1;
      const targetPage = shouldMoveBack ? Math.max(metaData.currentPage - 1, 1) : metaData.currentPage;

      const response = await fetchAdminPromotions({
        pageNumber: targetPage,
        pageSize: metaData.pageSize,
        type: typeFilter,
        scope: scopeFilter,
        discountType: discountTypeFilter,
      });
      setPromotions(response.items);
      setMetaData(response.metaData);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete promotion.");
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
            <label className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("promotions.filter.searchPlaceholder")}
                className="h-10 w-full rounded-full border border-[#f4d7e5] bg-[#fffafc] pl-11 pr-4 text-sm text-[#5b4658] outline-none placeholder:text-[#d4a1b8] focus:border-[#ea4f93]"
              />
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">{t("userManagement.table.actions") === "Thao tác" ? "Tất cả các loại" : "All types"}</option>
              {PROMOTION_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">{t("userManagement.table.actions") === "Thao tác" ? "Tất cả phạm vi" : "All scopes"}</option>
              {PROMOTION_SCOPE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <select
              value={discountTypeFilter}
              onChange={(event) => setDiscountTypeFilter(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">{t("userManagement.table.actions") === "Thao tác" ? "Tất cả giảm giá" : "All discounts"}</option>
              {PROMOTION_DISCOUNT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <Link
            to={ROUTES.adminPromotionsCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            {t("promotions.btnCreate")}
          </Link>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">{t("promotions.title")}</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              {t("userManagement.table.actions") === "Thao tác"
                ? `Hiển thị ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} trong số ${metaData.totalItems} khuyến mãi`
                : `Showing ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} of ${metaData.totalItems} promotions`
              }
            </p>
          </div>

          <Table
            rowKey="promotionId"
            columns={columns}
            dataSource={sortedPromotions}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 1180 }}
            locale={{ emptyText: error || (t("userManagement.table.actions") === "Thao tác" ? "Không tìm thấy khuyến mãi." : "No promotions found.") }}
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              {t("userManagement.table.actions") === "Thao tác"
                ? `Hiển thị ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} trong số ${metaData.totalItems} khuyến mãi`
                : `Showing ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} of ${metaData.totalItems} promotions`
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
      </section>

      {deleteTarget ? (
        <ActionConfirmModal
          open
          intent="danger"
          title="Delete Promotion"
          subtitle="This will remove the promotion from backend."
          description={`You are about to delete ${deleteTarget.name}. This action cannot be undone from this page.`}
          confirmText="Delete Promotion"
          cancelText="Keep Promotion"
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeletePromotion}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            title: deleteTarget.name,
            meta: `${deleteTarget.type} · ${deleteTarget.scope}`,
            note: `Promotion ID: ${deleteTarget.promotionId}`,
          }}
        />
      ) : null}
    </>
  );
}
