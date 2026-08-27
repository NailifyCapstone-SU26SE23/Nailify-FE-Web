import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  WandSparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { Table, Tooltip } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminNailSurfaceDetailRoute,
} from "../../../../shared/constants/routes";
import {
  deleteAdminNailSurface,
  fetchAdminNailSurfaces,
  formatNailSurfaceCurrency,
  formatNailSurfaceDuration,
} from "../services/nailSurfacesManagementService";
import { NailSurfacePreview } from "../components/NailSurfacePreview";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";



function SurfaceBadge({ surface }) {
  return (
    <NailSurfacePreview surface={surface} compact />
  );
}

export function NailSurfacesManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [surfaces, setSurfaces] = useState([]);
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

    const loadSurfaces = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminNailSurfaces({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          name: debouncedQuery,
        });

        if (!isMounted) {
          return;
        }

        setSurfaces(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSurfaces([]);
        setError(loadError instanceof Error ? loadError.message : (t("adminNailSurfacesManagement.failedToLoadNailSurfaces")));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSurfaces();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, metaData.currentPage, metaData.pageSize]);

  const summaryCards = useMemo(() => {
    const totalPrice = surfaces.reduce((sum, item) => sum + item.price, 0);
    const totalDuration = surfaces.reduce((sum, item) => sum + item.duration, 0);
    const averagePrice = surfaces.length ? Math.round(totalPrice / surfaces.length) : 0;
    const averageDuration = surfaces.length ? Math.round(totalDuration / surfaces.length) : 0;
    const uniqueShaders = new Set(surfaces.map((item) => item.shaderParam).filter(Boolean));

    return [
      {
        label: t("adminNailSurfacesManagement.totalSurfaces"),
        value: metaData.totalItems.toLocaleString(),
        note: language === "vi" ? `${metaData.totalPages} trang` : `${metaData.totalPages} pages`,
        icon: Layers3,
        color: "#ea4f93",
      },
      {
        label: t("adminNailSurfacesManagement.visibleItems"),
        value: surfaces.length.toLocaleString(),
        note: t("adminNailSurfacesManagement.currentPage"),
        icon: Sparkles,
        color: "#d9871c",
      },
      {
        label: t("adminNailSurfacesManagement.avgPrice"),
        value: formatNailSurfaceCurrency(averagePrice),
        note: t("adminNailSurfacesManagement.currentPage"),
        icon: Wallet,
        color: "#8b5cf6",
      },
      {
        label: t("adminNailSurfacesManagement.shaderTypes"),
        value: uniqueShaders.size.toLocaleString(),
        note: averageDuration ? ((t("adminNailSurfacesManagement.avg")) + formatNailSurfaceDuration(averageDuration)) : (t("adminNailSurfacesManagement.currentPage")),
        icon: WandSparkles,
        color: "#20ab77",
      },
    ];
  }, [metaData.totalItems, metaData.totalPages, surfaces]);

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

  const columns = useMemo(
    () => [
      {
        title: t("adminNailSurfacesManagement.surface"),
        key: "surface",
        sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
        render: (_, surface) => (
          <div className="flex items-center gap-3">
            <SurfaceBadge surface={surface} />
            <div>
              <p className="text-sm font-bold text-[#432744]">{surface.name}</p>

            </div>
          </div>
        ),
      },
      {
        title: t("adminNailSurfacesManagement.price"),
        dataIndex: "priceLabel",
        key: "priceLabel",
        sorter: (a, b) => Number(a.price || 0) - Number(b.price || 0),
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: t("adminNailSurfacesManagement.duration"),
        dataIndex: "durationLabel",
        key: "durationLabel",
        sorter: (a, b) => Number(a.duration || 0) - Number(b.duration || 0),
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: t("adminNailSurfacesManagement.actions"),
        key: "actions",
        align: "right",
        render: (_, surface) => (
          <div className="flex items-center justify-end gap-1.5">
            <Tooltip title={t("adminNailSurfacesManagement.viewDetail")}>
              <button
                type="button"
                onClick={() => navigate(getAdminNailSurfaceDetailRoute(surface.nailSurfaceId))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
              >
                <Eye size={12} />
              </button>
            </Tooltip>
            <Tooltip title={t("adminNailSurfacesManagement.editSurface")}>
              <button
                type="button"
                onClick={() => navigate(getAdminNailSurfaceDetailRoute(surface.nailSurfaceId), { state: { startInEdit: true } })}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
              >
                <Pencil size={12} />
              </button>
            </Tooltip>
            <Tooltip title={t("adminNailSurfacesManagement.deleteSurface")}>
              <button
                type="button"
                onClick={() => setDeleteTarget(surface)}
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

  const handleDeleteSurface = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminNailSurface(deleteTarget.nailSurfaceId);
      setDeleteTarget(null);
      toast.success(language === "vi" ? `Đã xóa ${deleteTarget.name} thành công.` : `${deleteTarget.name} deleted successfully.`);

      const shouldMoveBack = surfaces.length === 1 && metaData.currentPage > 1;
      const targetPage = shouldMoveBack ? Math.max(metaData.currentPage - 1, 1) : metaData.currentPage;

      const response = await fetchAdminNailSurfaces({
        pageNumber: targetPage,
        pageSize: metaData.pageSize,
        name: debouncedQuery,
      });
      setSurfaces(response.items);
      setMetaData(response.metaData);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : (t("adminNailSurfacesManagement.failedToDeleteNailSurface")));
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
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("adminNailSurfacesManagement.searchNailSurfaceByName")}
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
                {t("adminNailSurfacesManagement.search")}
              </button>
            </div>

            {/* <select
              value={shaderFilter}
              onChange={(event) => setShaderFilter(event.target.value)}
              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              <option value="">All shader params</option>
              {shaderOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select> */}
          </div>

          <Link
            to={ROUTES.adminNailSurfacesCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] w-45"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            {t("adminNailSurfacesManagement.addNailSurface")}
          </Link>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">{t("adminNailSurfacesManagement.nailSurfaces")}</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              {language === "vi" ? `Hiển thị ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} trên ${metaData.totalItems} bề mặt móng` : `Showing ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} of ${metaData.totalItems} nail surfaces`}
            </p>
          </div>

          <Table
            rowKey="nailSurfaceId"
            columns={columns}
            dataSource={surfaces}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 980 }}
            locale={{ emptyText: error || (t("adminNailSurfacesManagement.noNailSurfacesFound")) }}
            className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fff9fb] [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-[0.14em] [&_.ant-table-thead_th]:!text-[#a88a9f] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row>td]:!border-b [&_.ant-table-tbody_.ant-table-row>td]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row]:hover>td:!bg-[#fff9fb] [&_.ant-table-tbody_.ant-table-row>td]:!py-4 [&_.ant-table-tbody_.ant-table-row>td]:!text-[12px] [&_.ant-table-tbody_.ant-table-row>td]:!text-[#5b4256]"
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              {language === "vi" ? `Hiển thị ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} trên ${metaData.totalItems} bề mặt móng` : `Showing ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} of ${metaData.totalItems} nail surfaces`}
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
          title={t("adminNailSurfacesManagement.deleteNailSurface")}
          subtitle={t("adminNailSurfacesManagement.thisWillPermanentlyRemoveTheNa")}
          description={language === "vi" ? `Bạn chuẩn bị xóa ${deleteTarget.name}. Hành động này không thể hoàn tác.` : `You are about to delete ${deleteTarget.name}. This action cannot be undone.`}
          confirmText={t("adminNailSurfacesManagement.deleteSurface")}
          cancelText={t("adminNailSurfacesManagement.keepSurface")}
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteSurface}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            title: deleteTarget.name,
            meta: `${deleteTarget.shaderParam} • ${deleteTarget.priceLabel}`,
            note: (t("adminNailSurfacesManagement.surfaceId")) + deleteTarget.nailSurfaceId,
          }}
          warnings={[t("adminNailSurfacesManagement.thisActionCallsTheBackendDelet1")]}
        />
      ) : null}
    </>
  );
}
