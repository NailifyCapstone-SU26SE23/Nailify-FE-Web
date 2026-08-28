import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Shapes,
  Sparkles,
  TimerReset,
  Trash2,
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
  getAdminNailShapeDetailRoute,
} from "../../../../shared/constants/routes";
import {
  fetchAdminNailShapes,
  deleteAdminNailShape,
} from "../services/nailShapesManagementService";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";



function NailShapePreview({ shape, className }) {
  if (shape.imageUrl) {
    return (
      <img
        crossOrigin="anonymous"
        src={shape.imageUrl}
        alt={shape.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={className || "h-11 w-11 rounded-xl border border-[#f4dbe7] object-cover"}
      />
    );
  }

  return (
    <div className={className || "flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#ffe4ef_0%,#ffd977_100%)] text-xs font-extrabold text-[#9c2f63]"}>
      {shape.name?.substring(0, 2).toUpperCase() || "NS"}
    </div>
  );
}

export function NailShapesManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [shapes, setShapes] = useState([]);
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

    const loadShapes = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminNailShapes({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          name: debouncedQuery,
        });

        if (!isMounted) {
          return;
        }

        setShapes(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setShapes([]);
        setError(loadError instanceof Error ? loadError.message : (t("adminNailShapesManagement.failedToLoadNailShapes")));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadShapes();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, metaData.currentPage, metaData.pageSize]);

  const summaryCards = useMemo(() => {
    const shapesWithDuration = shapes.filter((item) => item.duration != null && item.duration > 0).length;

    return [
      {
        label: t("adminNailShapesManagement.totalShapes"),
        value: metaData.totalItems.toLocaleString(),
        note: language === "vi" ? `${metaData.totalPages} trang` : `${metaData.totalPages} pages`,
        icon: Shapes,
        color: "#ea4f93",
      },
      {
        label: t("adminNailShapesManagement.visibleItems"),
        value: shapes.length.toLocaleString(),
        note: t("adminNailShapesManagement.currentPage"),
        icon: Sparkles,
        color: "#d9871c",
      },
      {
        label: language === "vi" ? "Có thời lượng" : "With Duration",
        value: shapesWithDuration.toLocaleString(),
        note: language === "vi" ? `Trên ${shapes.length} dáng móng hiện tại` : `Out of ${shapes.length} visible shapes`,
        icon: TimerReset,
        color: "#20ab77",
      },
    ];
  }, [metaData.totalItems, metaData.totalPages, shapes, language, t]);

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



  const handleDeleteShape = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminNailShape(deleteTarget.nailShapeId);
      setDeleteTarget(null);
      toast.success(language === "vi" ? `Đã xóa dáng móng ${deleteTarget.name} thành công.` : `${deleteTarget.name} deleted successfully.`);

      const shouldMoveBack = shapes.length === 1 && metaData.currentPage > 1;
      setMetaData((current) => ({
        ...current,
        currentPage: shouldMoveBack ? current.currentPage - 1 : current.currentPage,
      }));

      const response = await fetchAdminNailShapes({
        pageNumber: shouldMoveBack ? Math.max(metaData.currentPage - 1, 1) : metaData.currentPage,
        pageSize: metaData.pageSize,
        name: debouncedQuery,
      });
      setShapes(response.items);
      setMetaData(response.metaData);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : (t("adminNailShapesManagement.failedToDeleteNailShape")));
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
          <TopMetricsRow metrics={summaryCards} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" />
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
                  placeholder={t("adminNailShapesManagement.searchNailShapeByName")}
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
                {t("adminNailShapesManagement.search")}
              </button>
            </div>
          </div>

          <Link
            to={ROUTES.adminNailShapesCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            {t("adminNailShapesManagement.addNailShape")}
          </Link>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">{t("adminNailShapesManagement.nailShapes")}</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              {language === "vi"
                ? `Đang hiển thị ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} trên ${metaData.totalItems} dáng móng`
                : `Showing ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} of ${metaData.totalItems} nail shapes`
              }
            </p>
          </div>

          <div className="bg-[#fff9fc] p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <LoaderCircle size={32} className="animate-spin text-[#ea4f93]" />
              </div>
            ) : shapes.length === 0 ? (
              <div className="flex justify-center items-center py-20 text-sm text-[#b9849f]">
                {error || t("adminNailShapesManagement.noNailShapesFound")}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {shapes.map((shape) => (
                  <div key={shape.nailShapeId} className="group relative flex flex-col overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-sm transition-all duration-300 hover:shadow-[0_12px_28px_rgba(236,72,153,0.12)] hover:-translate-y-1">
                    <div className="relative aspect-square w-full overflow-hidden bg-[#fffafc]">
                      <NailShapePreview shape={shape} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />

                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center border-t border-[#f6dbe7] p-3 text-center gap-2">
                      <h3 className="text-xs font-bold text-[#432744] line-clamp-2">{shape.name}</h3>
                      <div className="flex items-center justify-center gap-1.5 ">
                        <Tooltip title={t("adminNailShapesManagement.viewDetail")}>
                          <button
                            type="button"
                            onClick={() => navigate(getAdminNailShapeDetailRoute(shape.nailShapeId))}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
                          >
                            <Eye size={12} />
                          </button>
                        </Tooltip>
                        <Tooltip title={t("adminNailShapesManagement.editShape")}>
                          <button
                            type="button"
                            onClick={() => navigate(getAdminNailShapeDetailRoute(shape.nailShapeId), { state: { startInEdit: true } })}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
                          >
                            <Pencil size={12} />
                          </button>
                        </Tooltip>
                        <Tooltip title={t("adminNailShapesManagement.deleteShape")}>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(shape)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-[#fff0f0] text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
                          >
                            <Trash2 size={12} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              {language === "vi"
                ? `Đang hiển thị ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} trên ${metaData.totalItems} dáng móng`
                : `Showing ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} of ${metaData.totalItems} nail shapes`
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
          title={t("adminNailShapesManagement.deleteNailShape")}
          subtitle={t("adminNailShapesManagement.thisWillPermanentlyRemoveTheNa")}
          description={language === "vi" ? `Bạn chuẩn bị xóa dáng móng ${deleteTarget.name}. Hành động này không thể hoàn tác.` : `You are about to delete ${deleteTarget.name}. This action cannot be undone.`}
          confirmText={t("adminNailShapesManagement.deleteShape")}
          cancelText={t("adminNailShapesManagement.keepShape")}
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteShape}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            image: deleteTarget.imageUrl || undefined,
            title: deleteTarget.name,
            // meta: deleteTarget.durationLabel,
            note: (t("adminNailShapesManagement.shapeId1")) + deleteTarget.nailShapeId,
          }}
          warnings={[t("adminNailShapesManagement.thisActionCallsTheBackendDelet1")]}
        />
      ) : null}
    </>
  );
}
