import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag, ListFilter, ArrowUpDown,
  WandSparkles,
  Trash2,
  Eye,
  Pen,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dropdown, Tooltip } from "antd";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ROUTES,
  getAdminNailDesignCategoriesRoute,
  getAdminNailDesignDetailRoute,
} from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { fetchAdminNailDesigns, fetchAdminCategories, deleteAdminNailDesign } from "../services/nailDesignManagementService";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";

const DESIGN_CARD_PRESETS = [
  {
    title: "Nude Minimalist",
    tags: ["Minimalist", "Everyday", "Clean"],
    tones: ["Nude"],
  },
  {
    title: "French Ombré Bliss",
    tags: ["Ombré", "Bridal", "Elegant"],
    tones: ["Pastel"],
  },
  {
    title: "Chrome Glitter Storm",
    tags: ["Glitter", "Party", "Bold"],
    tones: ["Chrome"],
  },
];

function getPreviewMeta(index) {
  return DESIGN_CARD_PRESETS[index % DESIGN_CARD_PRESETS.length];
}

function formatPriceVND(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
}

function getDesignEstimatedPrice(design) {
  const variants = Array.isArray(design?.nailVariants) ? design.nailVariants : [];
  const firstPricedVariant = variants.find((variant) => variant?.estimatedPrice ?? variant?.price);
  return Number(firstPricedVariant?.estimatedPrice ?? firstPricedVariant?.price ?? 0);
}

function normalizeDesign(design, index, t) {
  const preview = getPreviewMeta(index);
  const tags = Array.isArray(design.categoryNames) ? design.categoryNames : [];
  const hasTryOnAsset = Boolean(design.previewImage);
  const estimatedPrice = getDesignEstimatedPrice(design);

  return {
    ...design,
    uiTitle: design.name || preview.title,
    uiTags: tags.length ? tags.slice(0, 3) : preview.tags,
    uiTones: [
      design.status === "Active"
        ? (t("adminNailsDesignManagement.active"))
        : (t("adminNailsDesignManagement.inactive"))
    ],
    uiPrice: estimatedPrice ? formatPriceVND(estimatedPrice) : "",
    uiEstimatedPrice: estimatedPrice,
    uiStatus: hasTryOnAsset
      ? (t("adminNailsDesignManagement.tryonReady"))
      : (t("adminNailsDesignManagement.noTryon")),
    uiStatusTone: hasTryOnAsset ? "bg-[#e7fbf4] text-[#23b68b]" : "bg-[#fff0f5] text-[#eb5a99]",
    uiTagsAll: tags,
    initials: design.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}



function SmallTag({ children, className = "" }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}

SmallTag.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

function DesignPreview({ design }) {
  console.log('design', design);
  return (
    <div className="h-52 overflow-hidden rounded-t-[16px] bg-[#f6edf2]">
      {design.imageUrl ? (
        <img
          crossOrigin="anonymous"
          src={design.imageUrl}
          alt={design.uiTitle}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,#fff6fb_0%,#f9e6ef_45%,#f3d7e6_100%)] text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/75 text-lg font-extrabold text-[#d85b96] shadow-[0_12px_24px_rgba(216,91,150,0.16)]">
            {design.initials || "ND"}
          </div>
          <p className="px-4 text-xs font-semibold text-[#a76f8c]">No preview image</p>
        </div>
      )}
    </div>
  );
}

DesignPreview.propTypes = {
  design: PropTypes.shape({
    initials: PropTypes.string,
    previewImage: PropTypes.string,
    uiTitle: PropTypes.string.isRequired,
  }).isRequired,
};

export function NailDesignManagementPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [designs, setDesigns] = useState([]);
  const [metaData, setMetaData] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 8,
    totalItems: 0,
    hasPrevious: false,
    hasNext: false,
    firstRowOnPage: 0,
    lastRowOnPage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (error) {
      toast.error(error, { id: "error-msg" });
    }
  }, [error]);

  const [globalMetrics, setGlobalMetrics] = useState({
    activeDesigns: 0,
    tryOnReady: 0,
  });

  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name-asc");
  const [refreshKey, setRefreshKey] = useState(0);

  const [pendingDeleteDesign, setPendingDeleteDesign] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!pendingDeleteDesign) return;
    setIsDeleting(true);
    try {
      await deleteAdminNailDesign(pendingDeleteDesign.id);
      toast.success(language === "vi" ? `Đã xóa thiết kế "${pendingDeleteDesign.name}"` : `Deleted design "${pendingDeleteDesign.name}" successfully.`);
      setRefreshKey(prev => prev + 1);
      setMetaData(prev => ({ ...prev, currentPage: 1 }));
      setDebouncedQuery(query.trim() + " ");
      setTimeout(() => setDebouncedQuery(query.trim()), 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === "vi" ? "Lỗi khi xóa" : "Failed to delete design"));
    } finally {
      setIsDeleting(false);
      setPendingDeleteDesign(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadGlobalMetrics = async () => {
      try {
        const response = await fetchAdminNailDesigns({
          pageNumber: 1,
          pageSize: 10000,
          name: debouncedQuery,
          categoryIds: selectedCategoryIds,
        });

        if (!isMounted) return;

        const allItems = response.items || [];
        setGlobalMetrics({
          activeDesigns: allItems.filter(d => d.status === "Active").length,
          tryOnReady: allItems.filter(d => !!d.previewImage).length,
        });
      } catch (err) {
        console.error("Failed to load global metrics", err);
      }
    };
    void loadGlobalMetrics();
    return () => { isMounted = false; };
  }, [debouncedQuery, selectedCategoryIds]);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const response = await fetchAdminCategories({ pageNumber: 1, pageSize: 100 });
        if (isMounted && response?.items) {
          setCategoriesList(response.items);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterOpenChange = (nextOpen, info) => {
    if (info && info.source === "menu") {
      return;
    }
    setFilterDropdownOpen(nextOpen);
  };

  const flashMessageShownRef = useRef(false);

  useEffect(() => {
    if (!location.state?.flashMessage || flashMessageShownRef.current) {
      return;
    }

    toast.success(location.state.flashMessage);
    flashMessageShownRef.current = true;

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setMetaData((current) => ({ ...current, currentPage: 1 }));
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadDesigns = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminNailDesigns({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          name: debouncedQuery,
          categoryIds: selectedCategoryIds,
        });

        if (!isMounted) {
          return;
        }

        setDesigns((prev) => metaData.currentPage === 1 ? response.items : [...prev, ...response.items]);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setDesigns([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load nail designs.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDesigns();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, metaData.currentPage, metaData.pageSize, selectedCategoryIds, refreshKey]);

  const normalizedDesigns = useMemo(
    () => designs.map((design, index) => normalizeDesign(design, index, t)),
    [designs, t],
  );

  const sortedDesigns = useMemo(() => {
    let result = [...normalizedDesigns];

    if (sortBy === "name-asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }

    return result;
  }, [normalizedDesigns, sortBy]);

  const summaryCards = useMemo(
    () => [
      {
        label: t("adminNailsDesignManagement.totalDesigns"),
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} ${t("adminNailsDesignManagement.pages")}`,
        icon: Tag,
        color: "#ea4f93",
      },
      {
        label: t("adminNailsDesignManagement.activeDesigns"),
        value: globalMetrics.activeDesigns.toLocaleString(),
        note: language === "vi" ? "Tất cả các trang" : "All pages",
        icon: WandSparkles,
        color: "#8b5cf6",
      },
      {
        label: t("adminNailsDesignManagement.tryonReady"),
        value: globalMetrics.tryOnReady.toLocaleString(),
        note: language === "vi" ? "Tất cả các trang" : "All pages",
        icon: Sparkles,
        color: "#23b68b",
      },
      {
        label: t("adminNailsDesignManagement.mostPopularStyle"),
        value: normalizedDesigns[0]?.uiTitle || "N/A",
        note: language === "vi" ? "Tất cả các trang" : "All pages",
        icon: Star,
        color: "#f5a623",
      },
    ],
    [metaData.totalItems, metaData.totalPages, normalizedDesigns, language, t],
  );

  const filterItems = useMemo(() => {
    const allItem = {
      key: "all",
      label: language === "vi" ? "Tất cả danh mục" : "All Categories",
    };
    const catItems = categoriesList.map((cat) => ({
      key: String(cat.categoryId),
      label: cat.name,
    }));
    return [allItem, ...catItems];
  }, [categoriesList, language]);

  const filterMenu = {
    items: filterItems,
    selectable: true,
    multiple: true,
    selectedKeys: selectedCategoryIds.length > 0 ? selectedCategoryIds.map(String) : ["all"],
    onClick: ({ key }) => {
      if (key === "all") {
        setSelectedCategoryIds([]);
      } else {
        const id = Number(key);
        setSelectedCategoryIds((prev) =>
          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
      }
      setMetaData((current) => ({ ...current, currentPage: 1 }));
    },
    style: {
      maxHeight: "250px",
      overflowY: "auto",
    },
  };

  const sortItems = [
    {
      key: "name-asc",
      label: language === "vi" ? "Tên (A - Z)" : "Name (A - Z)",
    },
    {
      key: "name-desc",
      label: language === "vi" ? "Tên (Z - A)" : "Name (Z - A)",
    }
  ];

  const sortMenu = {
    items: sortItems,
    selectable: true,
    selectedKeys: [sortBy],
    onClick: ({ key }) => setSortBy(key),
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-[18px] bg-white/70 p-1 sm:flex-row sm:items-center sm:justify-end">

      </div>

      <div className="mb-4">
        <TopMetricsRow metrics={summaryCards} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
      </div>

      <div className="grid gap-4">
        <div>
          <div className="flex flex-col gap-3 border-b border-[#f1dce7] p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <label className="relative block w-full sm:min-w-0 sm:flex-1">
              <Search
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b58da3]"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(
                  "adminNailsDesignManagement.searchDesignsCategoriesTags"
                )}
                className="
        h-10
        w-full
        rounded-full
        border
        border-[#f1dce7]
        bg-[#fff9fc]
        pl-10
        pr-4
        text-xs
        font-medium
        text-[#432744]
        outline-none
        transition-all
        duration-200
        placeholder:text-[#c39caf]
        hover:border-[#ea4f93]/40
        focus:border-[#ea4f93]
        focus:bg-white
        focus:ring-2
        focus:ring-[#ea4f93]/10
      "
              />
            </label>

            {/* Toolbar Actions */}
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
              {/* Filter */}
              <Dropdown
                menu={filterMenu}
                trigger={["click"]}
                open={filterDropdownOpen}
                onOpenChange={handleFilterOpenChange}
              >
                <button
                  type="button"
                  className={`
                    w-[150px]
          inline-flex
          h-10
          items-center
          gap-2
          rounded-full
          border
          px-3.5
          text-xs
          font-semibold
          transition-all
          duration-200
          ${selectedCategoryIds.length > 0
                      ? "border-[#ea4f93]/40 bg-[#fff0f7] text-[#ea4f93] shadow-[0_3px_10px_rgba(234,79,147,0.08)]"
                      : "border-[#f1dce7] bg-white text-[#7f6478] hover:border-[#ea4f93]/40 hover:bg-[#fff9fc] hover:text-[#ea4f93]"
                    }
        `}
                >
                  <ListFilter size={15} strokeWidth={2.2} />

                  <span>
                    {selectedCategoryIds.length > 0
                      ? selectedCategoryIds.length === 1
                        ? categoriesList.find(
                          (c) => c.categoryId === selectedCategoryIds[0]
                        )?.name || t("adminNailsDesignManagement.filter")
                        : language === "vi"
                          ? `${selectedCategoryIds.length} danh mục`
                          : `${selectedCategoryIds.length} categories`
                      : t("adminNailsDesignManagement.filter")}
                  </span>

                  {selectedCategoryIds.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ea4f93] px-1.5 text-[10px] font-bold text-white">
                      {selectedCategoryIds.length}
                    </span>
                  )}
                </button>
              </Dropdown>

              {/* Sort */}
              <Dropdown menu={sortMenu} trigger={["click"]}>
                <button
                  type="button"
                  className={`
          inline-flex
          h-10
          items-center
          gap-2
          rounded-full
          border
          px-3.5
          text-xs
          font-semibold
          transition-all
          duration-200
          ${sortBy
                      ? "border-[#ea4f93]/40 bg-[#fff0f7] text-[#ea4f93]"
                      : "border-[#f1dce7] bg-white text-[#7f6478] hover:border-[#ea4f93]/40 hover:bg-[#fff9fc] hover:text-[#ea4f93]"
                    }
        `}
                >
                  <ArrowUpDown size={15} strokeWidth={2.2} />

                  <span>
                    {sortBy
                      ? sortItems.find((s) => s.key === sortBy)?.label ||
                      t("adminNailsDesignManagement.sort")
                      : t("adminNailsDesignManagement.sort")}
                  </span>
                </button>
              </Dropdown>

              {/* Add Design */}
              <Link
                to={ROUTES.adminNailDesignsCreate}
                className="
        inline-flex
        h-10
        items-center
        gap-2
        rounded-full
        bg-gradient-to-r
        from-[#ea4f93]
        to-[#ff8ebb]
        px-4
        text-xs
        font-semibold
        text-white
        shadow-[0_5px_14px_rgba(234,79,147,0.20)]
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-[0_8px_18px_rgba(234,79,147,0.25)]
      "
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>{t("adminNailsDesignManagement.addDesign")}</span>
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              <div className="col-span-full rounded-[18px] border border-[#f8dce8] bg-[#fffafb] px-5 py-10">
                <div className="flex items-center justify-center gap-3 text-sm text-[#b38a9f]">
                  <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                  {t("adminNailsDesignManagement.loadingNailDesigns")}
                </div>
              </div>
            ) : (
              sortedDesigns.map((design) => (
                <article
                  key={design.id}
                  className="relative flex h-full flex-col overflow-hidden rounded-[18px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(236,72,153,0.12)]"
                >
                  <SmallTag className={`absolute top-3 right-3 z-10 shadow-sm ${design.uiStatusTone}`}>
                    {design.uiStatus}
                  </SmallTag>
                  <Link to={getAdminNailDesignDetailRoute(design.id)} className="block">
                    <DesignPreview design={design} />
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={getAdminNailDesignDetailRoute(design.id)}
                          className="font-extrabold text-[#432744] transition hover:text-[#ea4f93]"
                        >
                          {design.uiTitle}
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {design.uiTags.map((tag, index) => (
                        <SmallTag
                          key={`${design.id}-${tag}`}
                          className={
                            [
                              "bg-[#ffe7ef] text-[#ea4f93]",
                              "bg-[#f5ecff] text-[#8b5cf6]",
                              "bg-[#fff4df] text-[#d9871c]",
                            ][index % 3]
                          }
                        >
                          {tag}
                        </SmallTag>
                      ))}
                      {design.uiTones.map((tag) => (
                        <SmallTag key={`${design.id}-${tag}`} className="bg-[#fff7fb] text-[#c694ad]">
                          {tag}
                        </SmallTag>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-center gap-3 border-t border-[#fdf2f7] pt-4">
                      <div className="flex gap-3">
                        <Tooltip title={t("adminNailsDesignManagement.view")} placement="bottom">
                          <Link
                            to={getAdminNailDesignDetailRoute(design.id)}
                            className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#f4c6da] bg-white text-[#8c7085] hover:bg-[#fbf4f8] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye size={14} />
                          </Link>
                        </Tooltip>
                        <Tooltip title={t("adminNailsDesignManagement.edit")} placement="bottom">
                          <Link
                            to={getAdminNailDesignDetailRoute(design.id)}
                            className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#f4c6da] bg-[#fff7fb] text-[#ea4f93] hover:bg-[#ffe1ee] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Pen size={14} />
                          </Link>
                        </Tooltip>
                        <Tooltip title={language === "vi" ? "Xóa" : "Delete"} placement="bottom">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPendingDeleteDesign(design);
                            }}
                            className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#f4c6da] bg-[#fff0f6] text-[#d14c84] hover:bg-[#ffe1ee] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {!isLoading && normalizedDesigns.length === 0 ? (
            <div className="mt-4 rounded-[16px] border border-[#f8dce8] bg-[#fffafb] px-5 py-8 text-center text-sm text-[#8a7082]">
              {t("adminNailsDesignManagement.noNailDesignsMatchedTheCurrent")}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col items-center justify-center pt-2">
            <p className="text-[11px] text-[#c694ad] mb-3">
              {language === "vi"
                ? `Hiển thị ${normalizedDesigns.length} trong số ${metaData.totalItems} thiết kế`
                : `Showing ${normalizedDesigns.length} of ${metaData.totalItems} designs`
              }
            </p>
            {metaData.hasNext && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setMetaData((current) => ({
                    ...current,
                    currentPage: current.currentPage + 1,
                  }))
                }
                className="inline-flex items-center justify-center rounded-full bg-[#fff0f6] px-6 py-2 text-xs font-bold text-[#ea4f93] hover:bg-[#ffe1ee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <LoaderCircle size={14} className="animate-spin mr-2" /> : null}
                {language === "vi" ? "Xem thêm" : "Load more"}
              </button>
            )}
          </div>
        </div>
      </div>

      <ActionConfirmModal
        open={Boolean(pendingDeleteDesign)}
        loading={isDeleting}
        intent="danger"
        title={language === "vi" ? "Xóa Mẫu Móng" : "Delete Nail Design"}
        description={language === "vi" ? `Bạn sắp xóa thiết kế ${pendingDeleteDesign?.name ?? ""}.` : `You are about to delete ${pendingDeleteDesign?.name ?? "this design"}.`}
        confirmText={language === "vi" ? "Xóa Thiết Kế" : "Delete Design"}
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteDesign(null)}
        item={
          pendingDeleteDesign
            ? {
              title: pendingDeleteDesign.name,
              image: pendingDeleteDesign.imageUrl || undefined,
              meta: pendingDeleteDesign.status === "Active" ? t("adminNailsDesignManagement.active") : t("adminNailsDesignManagement.inactive"),
              note: pendingDeleteDesign.description || "Nail design",
            }
            : undefined
        }
        warnings={[
          language === "vi"
            ? "Hành động này không thể hoàn tác. Mọi dữ liệu liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống."
            : "This action cannot be undone. Any related data will be permanently deleted from the system."
        ]}
      />
    </section>
  );
}
