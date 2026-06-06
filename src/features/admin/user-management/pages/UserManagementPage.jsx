import { ArrowRight, Search, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ROUTES,
  getAdminUserDetailRoute,
} from "../../../../shared/constants/routes";
import {
  USER_ROWS,
  USER_STATUS_FILTERS,
  USER_STATUS_STYLES,
  USER_SUMMARY,
} from "../services/mockUsers";

export function UserManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [flashMessage] = useState(
    location.state?.flashMessage ?? "",
  );

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return USER_ROWS.filter((user) => {
      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [user.name, user.email, user.role, user.branch, user.id]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
        <div className="h-3 bg-[image:var(--gradient-accent)]" />
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-start md:p-8">
          <div className="max-w-full md:max-w-[26rem]">
            <p className="text-sm uppercase tracking-[0.24em] text-[#d45b9f]">
              Admin Control
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
              User Management
            </h2>
            <p className="mt-3 text-base leading-8 text-[var(--color-muted)]">
              Manage internal accounts, monitor onboarding status, and review
              role coverage across salons from one place.
            </p>
          </div>

          <div className="rounded-[24px] bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-4 text-sm text-[var(--color-muted)] shadow-[0_14px_30px_rgba(94,76,62,0.06)] sm:p-5">
            <div className="flex items-center gap-3 text-[var(--color-ink)]">
              <div className="rounded-2xl bg-white p-3 shadow-[0_12px_24px_rgba(94,76,62,0.08)]">
                <ShieldCheck size={18} className="text-[#d45b9f]" />
              </div>
              <div>
                <p className="font-semibold">Permission overview</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                  Admin only
                </p>
              </div>
            </div>
            <p className="mt-4 leading-6">
              Access changes, invitation approvals, and role assignments should
              be reviewed here before syncing with backend user services.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {USER_SUMMARY.map((item) => (
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

      <div className="grid gap-4">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
                Directory
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--color-ink)] sm:text-2xl">
                Internal user list
              </h3>
            </div>

            <Link
              to={ROUTES.adminUsersCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
            >
              <UserPlus size={16} />
              <span>Create user</span>
            </Link>
          </div>

          {flashMessage ? (
            <div className="mt-6 rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f]">
              {flashMessage}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block w-full xl:max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c28c69]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, role, branch, or ID"
                className="w-full rounded-full border border-[#f1d7c0] bg-[#fffdfb] py-3 pl-11 pr-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4]"
              />
            </label>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0 xl:pb-0">
              {USER_STATUS_FILTERS.map((option) => {
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
            {filteredUsers.map((user) => (
              <article
                key={user.id}
                className="rounded-[22px] border border-[#f4e4d7] bg-[#fffdfa] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffe3f0_0%,#fff2cf_100%)] font-semibold text-[#c84b91]">
                    {user.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--color-ink)]">{user.name}</p>
                    <p className="mt-1 break-all text-sm text-[var(--color-muted)]">
                      {user.email}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                      {user.id}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#b38769]">
                      Role
                    </p>
                    <p className="mt-1 text-[var(--color-ink)]">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#b38769]">
                      Last active
                    </p>
                    <p className="mt-1 text-[var(--color-muted)]">{user.lastActive}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {user.branch}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${USER_STATUS_STYLES[user.status]}`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <Link
                    to={getAdminUserDetailRoute(user.id)}
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
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Branch</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Last active</th>
                    <th className="px-5 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7ebdf] bg-white">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffe3f0_0%,#fff2cf_100%)] font-semibold text-[#c84b91]">
                            {user.name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--color-ink)]">
                              {user.name}
                            </p>
                            <p className="mt-1 text-sm text-[var(--color-muted)]">
                              {user.email}
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                              {user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--color-ink)]">
                        {user.role}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                        {user.branch}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${USER_STATUS_STYLES[user.status]}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                        {user.lastActive}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={getAdminUserDetailRoute(user.id)}
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

          {filteredUsers.length === 0 ? (
            <div className="rounded-[22px] border border-[#f4e4d7] bg-[#fffdfa] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
              No users matched the current search and status filter.
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
