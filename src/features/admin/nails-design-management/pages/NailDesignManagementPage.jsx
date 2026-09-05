import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dropdown } from "antd";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ROUTES,
  getAdminNailDesignCategoriesRoute,
  getAdminNailDesignDetailRoute,
} from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { fetchAdminNailDesigns, fetchAdminCategories } from "../services/nailDesignManagementService";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

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
    pageSize: 6,
    totalItems: 0,
    hasPrevious: false,
    hasNext: false,
    firstRowOnPage: 0,
    lastRowOnPage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name-asc");

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

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    toast.success(location.state.flashMessage);

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

        setDesigns(response.items);
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
  }, [debouncedQuery, metaData.currentPage, metaData.pageSize, selectedCategoryIds]);

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
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => (a.uiEstimatedPrice || 0) - (b.uiEstimatedPrice || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (b.uiEstimatedPrice || 0) - (a.uiEstimatedPrice || 0));
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
        value: normalizedDesigns.filter((design) => design.status === "Active").length.toLocaleString(),
        note: t("adminNailsDesignManagement.onCurrentPage"),
        icon: WandSparkles,
        color: "#8b5cf6",
      },
      {
        label: t("adminNailsDesignManagement.tryonReady"),
        value: normalizedDesigns.filter((design) => design.previewImage).length.toLocaleString(),
        note: t("adminNailsDesignManagement.hasPreviewImage"),
        icon: Sparkles,
        color: "#23b68b",
      },
      {
        label: t("adminNailsDesignManagement.mostPopularStyle"),
        value: normalizedDesigns[0]?.uiTitle || "N/A",
        note: t("adminNailsDesignManagement.currentPageHighlight"),
        icon: Star,
        color: "#f5a623",
      },
    ],
    [metaData.totalItems, metaData.totalPages, normalizedDesigns, language, t],
  );

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
    },
    {
      key: "price-asc",
      label: language === "vi" ? "Giá (Thấp đến Cao)" : "Price (Low to High)",
    },
    {
      key: "price-desc",
      label: language === "vi" ? "Giá (Cao đến Thấp)" : "Price (High to Low)",
    },
  ];

  const sortMenu = {
    items: sortItems,
    selectable: true,
    selectedKeys: [sortBy],
    onClick: ({ key }) => setSortBy(key),
  };

  const toolbarButtonClassName =
    "inline-flex items-center justify-center rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]";
  const primaryToolbarButtonClassName =
    "inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]";

  return (
    <section className="flex min-h-full flex-col gap-4 flex min-h-full flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-[18px] bg-white/70 p-1 sm:flex-row sm:items-center sm:justify-end">

      </div>

      <div className="mb-4">
        <TopMetricsRow metrics={summaryCards} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
      </div>

      <div className="grid gap-4">
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

          <label className="relative mb-4 block max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#df7baa]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("adminNailsDesignManagement.searchDesignsCategoriesTags")}
              className="h-10 w-full rounded-full border border-[#f5d7e4] bg-[#fff9fc] pl-10 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
            />
          </label>

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
                <Link
                  to={getAdminNailDesignDetailRoute(design.id)}>
                  <article
                    key={design.id}
                    className="overflow-hidden rounded-[18px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(236,72,153,0.12)]"
                  >
                    <Link to={getAdminNailDesignDetailRoute(design.id)} className="block">
                      <DesignPreview design={design} />
                    </Link>
                    <div className="p-4">
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

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <SmallTag className={design.uiStatusTone}>{design.uiStatus}</SmallTag>
                        <div className="flex gap-2">
                          <Link
                            to={getAdminNailDesignDetailRoute(design.id)}
                            className="rounded-full border border-[#f4c6da] bg-white px-3 py-1.5 text-[10px] font-bold text-[#8c7085]"
                          >
                            {t("adminNailsDesignManagement.view")}
                          </Link>
                          <Link
                            to={getAdminNailDesignDetailRoute(design.id)}
                            className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-1.5 text-[10px] font-bold text-[#ea4f93]"
                          >
                            {t("adminNailsDesignManagement.edit")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))
            )}
          </div>

          {!isLoading && normalizedDesigns.length === 0 ? (
            <div className="mt-4 rounded-[16px] border border-[#f8dce8] bg-[#fffafb] px-5 py-8 text-center text-sm text-[#8a7082]">
              {t("adminNailsDesignManagement.noNailDesignsMatchedTheCurrent")}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 rounded-[16px] border border-[#f8dce8] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              {language === "vi"
                ? `Hiển thị ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} trong số ${metaData.totalItems} thiết kế`
                : `Showing ${metaData.firstRowOnPage}-${metaData.lastRowOnPage} of ${metaData.totalItems} designs`
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
        </div>

      </div>
    </section>
  );
}
