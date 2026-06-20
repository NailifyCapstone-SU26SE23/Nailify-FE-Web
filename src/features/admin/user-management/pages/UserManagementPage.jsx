import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  PencilLine,
  Search,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminUserDetailRoute,
} from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  USER_STATUS_STYLES,
} from "../services/mockUsers";
import { fetchAdminUsers } from "../services/userManagementService";

function getRoleTone(role) {
  switch (role) {
    case "Admin":
      return "bg-[#fff0dd] text-[#d9871c]";
    case "Manager":
      return "bg-[#e8f2ff] text-[#4a72d8]";
    case "Receptionist":
      return "bg-[#f2ebff] text-[#8156d5]";
    case "Staff":
      return "bg-[#f3ebff] text-[#7e4fe6]";
    default:
      return "bg-[#ffe7ef] text-[#ea4f93]";
  }
}

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[18px] border border-[#f8d7e5] bg-white p-4 shadow-[0_10px_24px_rgba(236,72,153,0.06)]">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.iconClassName}`}>
        <Icon size={16} />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#cd98b1]">
        {item.label}
      </p>
      <p className="mt-1 text-[1.9rem] font-extrabold leading-none text-[#3f2741]">
        {item.value}
      </p>
      <p className="mt-2 text-xs font-medium text-[#86c18d]">{item.note}</p>
    </article>
  );
}

MetricCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.func.isRequired,
    iconClassName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

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

export function UserManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [users, setUsers] = useState([]);
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
      setMetaData((current) => ({ ...current, currentPage: 1 }));
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminUsers({
          pageNumber: metaData.currentPage,
          pageSize: metaData.pageSize,
          searchTerm: debouncedQuery,
        });

        if (!isMounted) {
          return;
        }

        setUsers(response.items);
        setMetaData(response.metaData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setUsers([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load users.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, metaData.currentPage, metaData.pageSize]);

  const summaryCards = useMemo(() => {
    const customers = users.filter((user) => user.role === "Customer").length;
    const staffArtists = users.filter((user) => user.role === "Staff").length;
    const managers = users.filter((user) => user.role === "Manager").length;
    const suspendedUsers = users.filter((user) => user.statusLabel === "Suspended").length;

    return [
      {
        label: "Total Users",
        value: String(metaData.totalItems),
        note: `${metaData.totalPages} pages`,
        icon: Users,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: "Customers",
        value: String(customers),
        note: "On current page",
        icon: Users,
        iconClassName: "bg-[#fff0f7] text-[#ea4f93]",
      },
      {
        label: "Staff Artists",
        value: String(staffArtists),
        note: "On current page",
        icon: UserCog,
        iconClassName: "bg-[#fff0f7] text-[#ea4f93]",
      },
      {
        label: "Salon Managers",
        value: String(managers),
        note: "On current page",
        icon: Shield,
        iconClassName: "bg-[#eef4ff] text-[#7c5cff]",
      },
      {
        label: "Suspended Users",
        value: String(suspendedUsers),
        note: "On current page",
        icon: AlertTriangle,
        iconClassName: "bg-[#fff4ef] text-[#ff7a59]",
      },
    ];
  }, [metaData.totalItems, metaData.totalPages, users]);

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

  const getActionItems = (user) => {
    const detailRoute = getAdminUserDetailRoute(user.id);

    return [
      { key: "view", label: "View User", icon: Eye, onSelect: () => navigate(detailRoute) },
      {
        key: "edit",
        label: "Edit User",
        icon: PencilLine,
        onSelect: () => navigate(detailRoute, { state: { requestEdit: true } }),
      },
      {
        key: "delete",
        label: "Delete User",
        icon: Trash2,
        className: "text-[#d14c84]",
        onSelect: () => navigate(detailRoute, { state: { requestDelete: true } }),
      },
    ];
  };

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </div>

      {/* <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_290px]"> */}
      <div>
        <article className="rounded-[20px] border border-[#f7d8e6] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-[420px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#df7baa]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by email, first name, last name..."
                className="h-11 w-full rounded-full border border-[#f5d7e4] bg-[#fff9fc] pl-11 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDebouncedQuery(query.trim());
                  setMetaData((current) => ({ ...current, currentPage: 1 }));
                }}
                className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
              >
                <Search size={14} className="mr-1.5" />
                Search User
              </button>
              <Link
                to={ROUTES.adminUsersCreate}
                className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
              >
                <UserPlus size={14} className="mr-1.5" />
                Add User
              </Link>
            </div>
          </div>

          {flashMessage ? (
            <div className="mt-4 rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
              {flashMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
              {error}
            </div>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-[18px] border border-[#f6dbe7]">
            <div className="flex items-center justify-between gap-3 border-b border-[#f7dce8] bg-[#fffafd] px-4 py-3">
              <p className="text-sm font-extrabold text-[#462a45]">All Users</p>
              <p className="text-[11px] font-medium text-[#d197b0]">
                Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} users
              </p>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead className="border-b border-[#f8e1eb] bg-[#fffdfd]">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#c696ad]">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Email / Phone</th>
                    <th className="px-4 py-3">Salon</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fae6ef] bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-10">
                        <div className="flex items-center justify-center gap-3 text-sm text-[#b38a9f]">
                          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                          Loading users...
                        </div>
                      </td>
                    </tr>
                  ) : users.length ? (
                    users.map((user) => (
                      <tr key={user.id} className="align-top">
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-xs font-extrabold text-white">
                              {user.avatar}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#432744]">{user.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <SmallTag className={getRoleTone(user.role)}>
                            {user.displayRole}
                          </SmallTag>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-[#6b5668]">{user.email}</p>
                          <p className="mt-1 text-[11px] text-[#d197b0]">{user.phone}</p>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8a7082]">
                          {user.salon}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${USER_STATUS_STYLES[user.statusLabel] ?? "bg-[#f5f0f4] text-[#8a7082]"}`}
                          >
                            {user.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8a7082]">
                          {user.lastActive}
                        </td>
                        <td className="px-4 py-3.5">
                          <ActionDropdown items={getActionItems(user)} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-10 text-center text-sm text-[#8a7082]">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 rounded-[16px] border border-[#f8dce8] bg-[#fffafb] p-4 text-sm text-[#b38a9f]">
                  <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                  Loading users...
                </div>
              ) : users.length ? (
                users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-[16px] border border-[#f8dce8] bg-[#fffafb] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-xs font-extrabold text-white">
                      {user.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#432744]">{user.name}</p>
                        <SmallTag className={getRoleTone(user.role)}>
                          {user.displayRole}
                        </SmallTag>
                      </div>
                      <p className="mt-1 text-sm text-[#6b5668]">{user.email}</p>
                      <p className="mt-1 text-[11px] text-[#d197b0]">{user.phone}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[#c694ad]">
                        {user.salon}
                      </p>
                      <p className="mt-1 text-sm text-[#8a7082]">{user.lastActive}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${USER_STATUS_STYLES[user.statusLabel]}`}
                      >
                        {user.statusLabel}
                      </span>
                      <div className="mt-2 flex justify-end">
                        <ActionDropdown items={getActionItems(user)} />
                      </div>
                    </div>
                  </div>
                </article>
                ))
              ) : (
                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fffafb] p-4 text-center text-sm text-[#8a7082]">
                  No users found.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[#c694ad]">
                Showing {metaData.firstRowOnPage}-{metaData.lastRowOnPage} of {metaData.totalItems} users
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
        </article>

        {/* <aside className="rounded-[20px] border border-[#f7d8e6] bg-[linear-gradient(180deg,#fffdfd_0%,#fff7fb_100%)] p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
          <h3 className="text-sm font-extrabold text-[#412643]">Quick Info Panel</h3>

          <div className="mt-5 space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ce97b1]">
                  New Registrations
                </p>
                <SmallTag className="bg-[#ffe7ef] text-[#ea4f93]">+12 today</SmallTag>
              </div>
              <div className="space-y-3">
                {QUICK_REGISTRATIONS.map(([name, time, role]) => (
                  <div key={name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-[10px] font-extrabold text-white">
                        {getAvatar(name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#432744]">{name}</p>
                        <p className="text-[11px] text-[#c694ad]">{time}</p>
                      </div>
                    </div>
                    <SmallTag className={getRoleTone(role === "Artist" ? "Staff" : role)}>
                      {role}
                    </SmallTag>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ce97b1]">
                  Suspicious Activity
                </p>
                <SmallTag className="bg-[#fff0dd] text-[#d9871c]">3 alerts</SmallTag>
              </div>
              <div className="space-y-3">
                {SUSPICIOUS_ACTIVITY.map(([title, userId, note]) => (
                  <div key={title} className="rounded-[16px] border border-[#f7dce8] bg-[#fffafb] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#432744]">{title}</p>
                        <p className="mt-1 text-[11px] text-[#c694ad]">{userId}</p>
                      </div>
                      <AlertTriangle size={14} className="text-[#ff7a59]" />
                    </div>
                    <p className="mt-2 text-[11px] text-[#8a7082]">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ce97b1]">
                  Recently Suspended
                </p>
                <SmallTag className="bg-[#ffe7ef] text-[#ea4f93]">5 users</SmallTag>
              </div>
              <div className="space-y-3">
                {RECENTLY_SUSPENDED.map(([name, reason, time]) => (
                  <div key={name} className="rounded-[16px] border border-[#f7dce8] bg-[#fffafb] p-3">
                    <p className="text-sm font-bold text-[#432744]">{name}</p>
                    <p className="mt-1 text-[11px] text-[#8a7082]">{reason}</p>
                    <p className="mt-1 text-[11px] text-[#c694ad]">{time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ce97b1]">
                Permission Summary
              </p>
              <div className="space-y-2.5">
                {PERMISSION_SUMMARY.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[#6c5669]">{label}</span>
                    <span className="font-bold text-[#ea4f93]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside> */}
      </div>
    </section>
  );
}
