import { ArrowRight, BrushCleaning, Search, Sparkles, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ROUTES,
  getAdminNailDesignDetailRoute,
} from "../../../shared/constants/routes";
import {
  NAIL_DESIGN_ROWS,
  NAIL_DESIGN_STATUS_FILTERS,
  NAIL_DESIGN_STATUS_STYLES,
  NAIL_DESIGN_SUMMARY,
} from "../services/mockNailDesigns";

export function NailDesignManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filteredDesigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return NAIL_DESIGN_ROWS.filter((design) => {
      const matchesStatus =
        statusFilter === "All" || design.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          design.id,
          design.name,
          design.category,
          design.collection,
          design.artist,
          design.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {NAIL_DESIGN_SUMMARY.map((item) => (
          <article
            key={item.label}
            className="rounded-[22px] bg-white p-5 shadow-[0_14px_30px_rgba(94,76,62,0.06)]"
          >
            <p className="text-sm uppercase tracking-[0.16em] text-[#d45b9f]">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {item.description}
            </p>
          </article>
        ))}
      </div>

      <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
              Design Library
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--color-ink)] sm:text-2xl">
              Nail design catalog
            </h3>
          </div>

          <Link
            to={ROUTES.adminNailDesignsCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
          >
            <UserPlus size={16} />
            <span>Create design</span>
          </Link>
        </div>

        {flashMessage ? (
          <div className="mt-6 rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f]">
            {flashMessage}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-[22px] bg-[linear-gradient(135deg,#fff5f9_0%,#fff9ef_100%)] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-3 text-[#d45b9f] shadow-[0_12px_24px_rgba(94,76,62,0.08)]">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">
                  Admin-only merchandising workspace
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  Review design readiness, pricing, palette direction, and catalog
                  visibility before these mock concepts reach booking or marketing flows.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#f4e4d7] bg-[#fffdfa] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[#b38769]">
              Catalog pulse
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-2xl bg-[#fff0f5] p-3 text-[#d14c84]">
                <BrushCleaning size={18} />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">
                  {filteredDesigns.length} designs in view
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  Based on your current search and status filter.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full xl:max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c28c69]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, category, collection, artist, tags, or ID"
              className="w-full rounded-full border border-[#f1d7c0] bg-[#fffdfb] py-3 pl-11 pr-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4]"
            />
          </label>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0 xl:pb-0">
            {NAIL_DESIGN_STATUS_FILTERS.map((option) => {
              const isActive = option === statusFilter;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusFilter(option)}
                  className={
                    isActive
                      ? "shrink-0 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white"
                      : "shrink-0 rounded-full bg-[#fff6f0] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[#ffe9d7]"
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-3 md:hidden">
          {filteredDesigns.map((design) => (
            <article
              key={design.id}
              className="rounded-[22px] border border-[#f4e4d7] bg-[#fffdfa] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffe3f0_0%,#fff2cf_100%)] font-semibold text-[#c84b91]">
                  {design.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-ink)]">{design.name}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {design.collection}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                    {design.id}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#b38769]">
                    Category
                  </p>
                  <p className="mt-1 text-[var(--color-ink)]">{design.category}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#b38769]">
                    Artist
                  </p>
                  <p className="mt-1 text-[var(--color-muted)]">{design.artist}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--color-muted)]">
                    {design.price}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${NAIL_DESIGN_STATUS_STYLES[design.status]}`}
                  >
                    {design.status}
                  </span>
                </div>
                <Link
                  to={getAdminNailDesignDetailRoute(design.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#fff5ef] px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[#ffe9d7]"
                >
                  <span>Manage</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[22px] border border-[#f4e4d7] md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f4e4d7]">
              <thead className="bg-[#fff8f2]">
                <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#b38769]">
                  <th className="px-5 py-4 font-semibold">Design</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Price</th>
                  <th className="px-5 py-4 font-semibold">Artist</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Updated</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7ebdf] bg-white">
                {filteredDesigns.map((design) => (
                  <tr key={design.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffe3f0_0%,#fff2cf_100%)] font-semibold text-[#c84b91]">
                          {design.name
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-ink)]">
                            {design.name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">
                            {design.collection}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                            {design.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-ink)]">
                      <p>{design.category}</p>
                      <p className="mt-1 text-[var(--color-muted)]">
                        {design.popularity}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                      <p>{design.price}</p>
                      <p className="mt-1">{design.duration}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                      {design.artist}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${NAIL_DESIGN_STATUS_STYLES[design.status]}`}
                      >
                        {design.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                      {design.updatedAt}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={getAdminNailDesignDetailRoute(design.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#fff5ef] px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[#ffe9d7]"
                      >
                        <span>Manage</span>
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredDesigns.length === 0 ? (
          <div className="mt-6 rounded-[22px] border border-[#f4e4d7] bg-[#fffdfa] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
            No nail designs matched the current search and status filter.
          </div>
        ) : null}
      </article>
    </section>
  );
}
