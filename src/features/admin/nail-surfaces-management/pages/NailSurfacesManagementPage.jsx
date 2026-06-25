import {
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
import { Table } from "antd";
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

function SurfaceBadge({ surface }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#e7d7ff_0%,#ffd7ea_100%)] text-xs font-extrabold text-[#7e4fe6]">
      {surface.initials || "NS"}
    </div>
  );
}

export function NailSurfacesManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
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
        setError(loadError instanceof Error ? loadError.message : "Failed to load nail surfaces.");
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
        label: "Total Surfaces",
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} pages`,
        icon: Layers3,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: "Visible Items",
        value: surfaces.length.toLocaleString(),
        note: "Current page",
        icon: Sparkles,
        iconClassName: "bg-[#fff4df] text-[#d9871c]",
      },
      {
        label: "Avg Price",
        value: formatNailSurfaceCurrency(averagePrice),
        note: "Current page",
        icon: Wallet,
        iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
      },
      {
        label: "Shader Types",
        value: uniqueShaders.size.toLocaleString(),
        note: averageDuration ? `Avg ${formatNailSurfaceDuration(averageDuration)}` : "Current page",
        icon: WandSparkles,
        iconClassName: "bg-[#e7fbf4] text-[#20ab77]",
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
        title: "Surface",
        key: "surface",
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
        title: "Shader Param",
        dataIndex: "shaderParam",
        key: "shaderParam",
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: "Price",
        dataIndex: "priceLabel",
        key: "priceLabel",
        render: (value) => <span className="text-sm font-semibold text-[#432744]">{value}</span>,
      },
      {
        title: "Duration",
        dataIndex: "durationLabel",
        key: "durationLabel",
        render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, surface) => (
          <ActionDropdown
            items={[
              {
                key: "view",
                label: "View Detail",
                icon: Eye,
                onSelect: () => navigate(getAdminNailSurfaceDetailRoute(surface.nailSurfaceId)),
              },
              {
                key: "edit",
                label: "Edit Surface",
                icon: Pencil,
                onSelect: () =>
                  navigate(getAdminNailSurfaceDetailRoute(surface.nailSurfaceId), {
                    state: { startInEdit: true },
                  }),
              },
              {
                key: "delete",
                label: "Delete Surface",
                icon: Trash2,
                className: "text-[#d14c84]",
                onSelect: () => setDeleteTarget(surface),
              },
            ]}
          />
        ),
      },
    ],
    [navigate],
  );

  const handleDeleteSurface = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminNailSurface(deleteTarget.nailSurfaceId);
      setDeleteTarget(null);
      toast.success(`${deleteTarget.name} deleted successfully.`);

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
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete nail surface.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4fa_100%)]">
        <div className="flex flex-col gap-3 rounded-[20px] border border-[#f8deea] bg-white/70 p-4 shadow-[0_12px_26px_rgba(236,72,153,0.05)] lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search nail surface by name..."
              className="h-10 w-full rounded-full border border-[#f4d7e5] bg-[#fffafc] pl-11 pr-4 text-sm text-[#5b4658] outline-none placeholder:text-[#d4a1b8] focus:border-[#ea4f93]"
            />
          </label>

          <Link
            to={ROUTES.adminNailSurfacesCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            Add Nail Surface
          </Link>
        </div>

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

        <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
          <div className="border-b border-[#f6dbe7] px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#432744]">Nail Surfaces</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} nail surfaces
            </p>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={surfaces}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 980 }}
            locale={{ emptyText: error || "No nail surfaces found." }}
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} nail surfaces
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
          title="Delete Nail Surface"
          subtitle="This will permanently remove the nail surface from backend."
          description={`You are about to delete ${deleteTarget.name}. This action cannot be undone.`}
          confirmText="Delete Surface"
          cancelText="Keep Surface"
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteSurface}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            title: deleteTarget.name,
            meta: `${deleteTarget.shaderParam} • ${deleteTarget.priceLabel}`,
            note: `Surface ID: ${deleteTarget.nailSurfaceId}`,
          }}
          warnings={["This action calls the backend delete endpoint and removes this nail surface record."]}
        />
      ) : null}
    </>
  );
}
