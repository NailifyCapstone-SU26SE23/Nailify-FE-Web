import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ROUTES,
  getAdminUserDetailRoute,
} from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  USER_ROWS,
  USER_STATUS_STYLES,
} from "../services/mockUsers";

const SUMMARY_CARDS = [
  {
    label: "Total Users",
    value: "4,821",
    note: "+128 this month",
    icon: Users,
    iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
  },
  {
    label: "Customers",
    value: "3,940",
    note: "+104 this month",
    icon: Users,
    iconClassName: "bg-[#fff0f7] text-[#ea4f93]",
  },
  {
    label: "Staff Artists",
    value: "612",
    note: "+18 this month",
    icon: UserCog,
    iconClassName: "bg-[#fff0f7] text-[#ea4f93]",
  },
  {
    label: "Salon Managers",
    value: "269",
    note: "+6 this month",
    icon: Shield,
    iconClassName: "bg-[#eef4ff] text-[#7c5cff]",
  },
  {
    label: "Suspended Users",
    value: "47",
    note: "+3 this week",
    icon: AlertTriangle,
    iconClassName: "bg-[#fff4ef] text-[#ff7a59]",
  },
];

// const QUICK_REGISTRATIONS = [
//   ["Sophia Nguyen", "2 mins ago", "Customer"],
//   ["Mia Tanaka", "11 mins ago", "Artist"],
//   ["Chloe Martin", "45 mins ago", "Customer"],
//   ["Aisha Patel", "1 hr ago", "Manager"],
// ];

// const SUSPICIOUS_ACTIVITY = [
//   ["Multiple logins", "USR-2521", "3 devices"],
//   ["Fake booking spam", "USR-3312", "22 bookings"],
//   ["Profile photo abuse", "USR-1877", "Flagged"],
// ];

// const RECENTLY_SUSPENDED = [
//   ["Lena Kowalski", "No-shows x3", "3h ago"],
//   ["Tom Reeves", "Abusive review", "1d ago"],
//   ["Priya Sharma", "Payment fraud", "2d ago"],
// ];

// const PERMISSION_SUMMARY = [
//   ["Customers", "Book & Review"],
//   ["Staff Artists", "Manage Schedule"],
//   ["Salon Managers", "Full Salon Access"],
//   ["Admins", "System-wide"],
//   ["Suspended", "Read Only"],
//   ["Banned", "No Access"],
// ];

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

function getDisplayRole(role) {
  switch (role) {
    case "Staff":
      return "Staff Artist";
    case "Manager":
      return "Salon Manager";
    default:
      return role;
  }
}

function getAvatar(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeUser(user, index) {
  const displayRole = getDisplayRole(user.role);
  const customPhone = [
    "+1 310-555-0192",
    "+1 213-555-0847",
    "+1 424-555-0334",
    "+1 818-555-0611",
    "+1 323-555-0728",
    "+1 626-555-0188",
    "+1 714-555-0415",
  ][index % 7];

  return {
    ...user,
    displayId: user.id.toLowerCase(),
    displayRole,
    salon: user.branch === "Head Office" ? "No salon" : user.branch,
    phone: customPhone,
    avatar: getAvatar(user.name),
    statusLabel: user.status,
  };
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
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const users = useMemo(
    () => USER_ROWS.map((user, index) => normalizeUser(user, index)),
    [],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.phone,
        user.displayRole,
        user.salon,
        user.statusLabel,
        user.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, users]);

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {SUMMARY_CARDS.map((item) => (
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
                placeholder="Search by name or phone..."
                className="h-11 w-full rounded-full border border-[#f5d7e4] bg-[#fff9fc] pl-11 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
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

          <div className="mt-4 overflow-hidden rounded-[18px] border border-[#f6dbe7]">
            <div className="flex items-center justify-between gap-3 border-b border-[#f7dce8] bg-[#fffafd] px-4 py-3">
              <p className="text-sm font-extrabold text-[#462a45]">All Users</p>
              <p className="text-[11px] font-medium text-[#d197b0]">
                Showing {Math.min(filteredUsers.length, 10)} of {filteredUsers.length} users
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-xs font-extrabold text-white">
                            {user.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#432744]">{user.name}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#c694ad]">
                              {user.displayId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <SmallTag className={getRoleTone(user.role)}>
                          {user.displayRole}
                        </SmallTag>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-[#6b5668]">{user.email.replace("@nailify.com", "@gmail.com")}</p>
                        <p className="mt-1 text-[11px] text-[#d197b0]">{user.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#8a7082]">
                        {user.salon}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${USER_STATUS_STYLES[user.statusLabel]}`}
                        >
                          {user.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#8a7082]">
                        {user.lastActive}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          to={getAdminUserDetailRoute(user.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#f7cade] bg-[#fff6fa] px-3 py-1.5 text-xs font-bold text-[#ea4f93]"
                        >
                          Actions
                          <ChevronDown size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {filteredUsers.map((user) => (
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
                      <Link
                        to={getAdminUserDetailRoute(user.id)}
                        className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#f7cade] bg-[#fff6fa] px-3 py-1.5 text-xs font-bold text-[#ea4f93]"
                      >
                        Actions
                        <ChevronDown size={12} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[#c694ad]">
                Showing 1-10 of 4,821 users
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92]"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[#ea4f93] px-2 text-[11px] font-bold text-white"
                >
                  1
                </button>
                {["2", "3", "...", "483"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white px-2 text-[11px] font-medium text-[#b9849f]"
                  >
                    {item}
                  </button>
                ))}
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92]"
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
