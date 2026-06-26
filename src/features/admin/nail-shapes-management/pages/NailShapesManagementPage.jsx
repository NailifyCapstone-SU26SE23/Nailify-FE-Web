import {
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
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Image, Table } from "antd";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminNailShapeDetailRoute,
} from "../../../../shared/constants/routes";
import {
  fetchAdminNailShapes,
  deleteAdminNailShape,
  formatNailShapeCurrency,
  formatNailShapeDuration,
} from "../services/nailShapesManagementService";

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

function NailShapePreview({ shape }) {
  if (shape.imageUrl) {
    return (
      <Image
        src={shape.imageUrl}
        alt={shape.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        style={{height: "44px", width: "44px", borderRadius: "12px", border: "1px solid #f4dbe7", objectFit: "cover"}}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#ffe4ef_0%,#ffd977_100%)] text-xs font-extrabold text-[#9c2f63]">
      {shape.initials || "NS"}
    </div>
  );
}

export function NailShapesManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
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
        setError(loadError instanceof Error ? loadError.message : "Failed to load nail shapes.");
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
    const totalPrice = shapes.reduce((sum, item) => sum + item.price, 0);
    const totalDuration = shapes.reduce((sum, item) => sum + item.duration, 0);
    const averagePrice = shapes.length ? Math.round(totalPrice / shapes.length) : 0;
    const averageDuration = shapes.length ? Math.round(totalDuration / shapes.length) : 0;

    return [
      {
        label: "Total Shapes",
        value: metaData.totalItems.toLocaleString(),
        note: `${metaData.totalPages} pages`,
        icon: Shapes,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: "Visible Items",
        value: shapes.length.toLocaleString(),
        note: "Current page",
        icon: Sparkles,
        iconClassName: "bg-[#fff4df] text-[#d9871c]",
      },
      {
        label: "Avg Price",
        value: formatNailShapeCurrency(averagePrice),
        note: "Current page",
        icon: Wallet,
        iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
      },
      {
        label: "Avg Duration",
        value: formatNailShapeDuration(averageDuration),
        note: "Current page",
        icon: TimerReset,
        iconClassName: "bg-[#e7fbf4] text-[#20ab77]",
      },
    ];
  }, [metaData.totalItems, metaData.totalPages, shapes]);

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
        title: "Shape",
        key: "shape",
        render: (_, shape) => (
          <div className="flex items-center gap-3">
            <NailShapePreview shape={shape} />
            <div>
              <p className="text-sm font-bold text-[#432744]">{shape.name}</p>
            </div>
          </div>
        ),
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
        render: (_, shape) => (
          <ActionDropdown
            items={[
              {
                key: "view",
                label: "View Detail",
                icon: Eye,
                onSelect: () => navigate(getAdminNailShapeDetailRoute(shape.nailShapeId)),
              },
              {
                key: "edit",
                label: "Edit Shape",
                icon: Pencil,
                onSelect: () => navigate(getAdminNailShapeDetailRoute(shape.nailShapeId), { state: { startInEdit: true } }),
              },
              {
                key: "delete",
                label: "Delete Shape",
                icon: Trash2,
                className: "text-[#d14c84]",
                onSelect: () => setDeleteTarget(shape),
              },
            ]}
          />
        ),
      },
    ],
    [navigate],
  );

  const handleDeleteShape = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminNailShape(deleteTarget.nailShapeId);
      setDeleteTarget(null);
      toast.success(`${deleteTarget.name} deleted successfully.`);

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
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete nail shape.");
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
              placeholder="Search nail shape by name..."
              className="h-10 w-full rounded-full border border-[#f4d7e5] bg-[#fffafc] pl-11 pr-4 text-sm text-[#5b4658] outline-none placeholder:text-[#d4a1b8] focus:border-[#ea4f93]"
            />
          </label>

          <Link
            to={ROUTES.adminNailShapesCreate}
            className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 shrink-0" />
            Add Nail Shape
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
            <h2 className="text-sm font-extrabold text-[#432744]">Nail Shapes</h2>
            <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
              Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} nail shapes
            </p>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={shapes}
            loading={{
              spinning: isLoading,
              indicator: <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />,
            }}
            pagination={false}
            scroll={{ x: 920 }}
            locale={{ emptyText: error || "No nail shapes found." }}
          />

          <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#c694ad]">
              Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} nail shapes
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
          title="Delete Nail Shape"
          subtitle="This will permanently remove the nail shape from backend."
          description={`You are about to delete ${deleteTarget.name}. This action cannot be undone.`}
          confirmText="Delete Shape"
          cancelText="Keep Shape"
          confirmIcon={Trash2}
          loading={isDeleting}
          onConfirm={handleDeleteShape}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          item={{
            image: deleteTarget.imageUrl || undefined,
            title: deleteTarget.name,
            meta: `${deleteTarget.priceLabel} • ${deleteTarget.durationLabel}`,
            note: `Shape ID: ${deleteTarget.nailShapeId}`,
          }}
          warnings={["This action calls the backend delete endpoint and removes this nail shape record."]}
        />
      ) : null}
    </>
  );
}
