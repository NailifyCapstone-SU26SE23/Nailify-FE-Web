import {
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  MapPin,
  PencilLine,
  Search,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Select, Table } from "antd";
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
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";

const ALL_FILTER_VALUE = "__all__";
const ROLE_FILTER_OPTIONS = [
  { value: ALL_FILTER_VALUE, label: "All roles" },
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "Receptionist", label: "Receptionist" },
  { value: "Staff_Artist", label: "Staff Artist" },
  { value: "Customer", label: "Customer" },
];

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

function sortUsers(items, sortValue) {
  const [sortKey = "user", sortDirection = "asc"] = String(sortValue || "user-asc").split("-");
  const sortedItems = [...items];
  const directionMultiplier = sortDirection === "desc" ? -1 : 1;

  const getSortValue = (user) => {
    switch (sortKey) {
      case "role":
        return user.displayRole || "";
      case "email":
        return user.email || "";
      case "phone":
        return user.phone || "";
      case "salon":
        return user.salon || "";
      case "status":
        return user.statusLabel || "";
      case "lastActive":
        return user.lastActive || "";
      case "user":
      default:
        return user.name || "";
    }
  };

  return sortedItems.sort((left, right) =>
    getSortValue(left).localeCompare(getSortValue(right)) * directionMultiplier,
  );
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

function ChevronDownIcon() {
  return <ChevronRight size={14} className="rotate-90 text-current" />;
}

function SortableHeader({ label, sortKey, selectedSort, onToggle }) {
  const isActive = selectedSort.startsWith(`${sortKey}-`);
  const isDesc = selectedSort === `${sortKey}-desc`;

  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      className={`inline-flex items-center gap-1.5 font-semibold transition ${isActive ? "text-[#ea4f93]" : "text-[#5f4a5c] hover:text-[#ea4f93]"}`}
    >
      <span>{label}</span>
      <ArrowUpDown size={13} className={isActive ? "text-[#ea4f93]" : "text-[#d39bb5]"} />
      {isActive ? <span className="text-[10px] font-bold">{isDesc ? "DESC" : "ASC"}</span> : null}
    </button>
  );
}

SortableHeader.propTypes = {
  label: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
  selectedSort: PropTypes.string.isRequired,
  sortKey: PropTypes.string.isRequired,
};

function FilterSelect({
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
}) {
  return (
    <div className={`group flex h-11 items-center gap-2 rounded-[16px] border border-[#f1d8e5] bg-[linear-gradient(180deg,#fffefe_0%,#fff8fc_100%)] px-3 shadow-[0_10px_18px_rgba(236,72,153,0.05)] transition hover:border-[#efbad3] ${className}`}>
      <div className="pointer-events-none flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#ea4f93]">
        <Icon size={13} />
      </div>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        bordered={false}
        suffixIcon={<ChevronDownIcon />}
        popupMatchSelectWidth
        className="h-full min-w-0 flex-1 [&_.ant-select-arrow]:!right-0 [&_.ant-select-arrow]:!text-[#d3a0b8] [&_.ant-select-selection-item]:!leading-[42px] [&_.ant-select-selection-item]:!text-[15px] [&_.ant-select-selection-item]:!font-semibold [&_.ant-select-selection-item]:!text-[#4b3148] [&_.ant-select-selection-placeholder]:!leading-[42px] [&_.ant-select-selection-placeholder]:!text-[#cf9ab3] [&_.ant-select-selector]:!h-full [&_.ant-select-selector]:!rounded-[16px] [&_.ant-select-selector]:!bg-transparent [&_.ant-select-selector]:!px-0 [&_.ant-select-selector]:!shadow-none"
      />
    </div>
  );
}

FilterSelect.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.elementType.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export function UserManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [salons, setSalons] = useState([]);
  const [selectedRole, setSelectedRole] = useState(ALL_FILTER_VALUE);
  const [selectedSalonId, setSelectedSalonId] = useState(ALL_FILTER_VALUE);
  const [selectedSort, setSelectedSort] = useState("user-asc");
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
    let isMounted = true;

    const loadSalons = async () => {
      try {
        const response = await fetchAdminSalons({ pageSize: 100 });

        if (!isMounted) {
          return;
        }

        setSalons(response.items ?? []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSalons([]);
        console.error("Failed to load salons for user filters:", loadError);
      }
    };

    void loadSalons();

    return () => {
      isMounted = false;
    };
  }, []);

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
          role: selectedRole === ALL_FILTER_VALUE ? "" : selectedRole,
          salonId: selectedSalonId === ALL_FILTER_VALUE ? "" : selectedSalonId,
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
  }, [debouncedQuery, metaData.currentPage, metaData.pageSize, selectedRole, selectedSalonId]);

  const salonNameById = useMemo(
    () =>
      salons.reduce((result, salon) => {
        result[salon.id] = salon.name;
        return result;
      }, {}),
    [salons],
  );

  const displayedUsers = useMemo(() => {
    const mappedUsers = users.map((user) => ({
      ...user,
      salon: user.salonId ? salonNameById[user.salonId] || "Assigned salon" : "No salon",
    }));

    return sortUsers(mappedUsers, selectedSort);
  }, [salonNameById, selectedSort, users]);

  const summaryCards = useMemo(() => {
    const customers = displayedUsers.filter((user) => user.role === "Customer").length;
    const staffArtists = displayedUsers.filter((user) => user.role === "Staff").length;
    const managers = displayedUsers.filter((user) => user.role === "Manager").length;
    const suspendedUsers = displayedUsers.filter((user) => user.statusLabel === "Suspended").length;

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
  }, [displayedUsers, metaData.totalItems, metaData.totalPages]);

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

  const handleHeaderSort = (sortKey) => {
    setSelectedSort((current) =>
      current === `${sortKey}-asc` ? `${sortKey}-desc` : `${sortKey}-asc`,
    );
  };

  const userColumns = useMemo(() => ([
    {
      title: <SortableHeader label="User" sortKey="user" selectedSort={selectedSort} onToggle={handleHeaderSort} />,
      key: "user",
      render: (_, user) => (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-xs font-extrabold text-white">
            {user.avatar}
          </div>
          <p className="font-bold text-[#432744]">{user.name}</p>
        </div>
      ),
    },
    {
      title: <SortableHeader label="Role" sortKey="role" selectedSort={selectedSort} onToggle={handleHeaderSort} />,
      dataIndex: "displayRole",
      key: "displayRole",
      render: (value, user) => <SmallTag className={getRoleTone(user.role)}>{value}</SmallTag>,
    },
    {
      title: <SortableHeader label="Email" sortKey="email" selectedSort={selectedSort} onToggle={handleHeaderSort} />,
      key: "contact",
      render: (_, user) => (
        <div>
          <p className="text-sm text-[#6b5668]">{user.email}</p>
        </div>
      ),
    },
     {
      title: <SortableHeader label="Phone" sortKey="phone" selectedSort={selectedSort} onToggle={handleHeaderSort} />,
      key: "contact",
      render: (_, user) => (
        <div>
          <p className="text-sm text-[#6b5668]">{user.phone}</p>
        </div>
      ),
    },
    {
      title: <SortableHeader label="Salon" sortKey="salon" selectedSort={selectedSort} onToggle={handleHeaderSort} />,
      dataIndex: "salon",
      key: "salon",
      render: (value) => <span className="text-sm text-[#8a7082]">{value}</span>,
    },
    {
      title: <SortableHeader label="Status" sortKey="status" selectedSort={selectedSort} onToggle={handleHeaderSort} />,
      dataIndex: "statusLabel",
      key: "statusLabel",
      render: (value) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${USER_STATUS_STYLES[value] ?? "bg-[#f5f0f4] text-[#8a7082]"}`}>
          {value}
        </span>
      ),
    },
    {
      title: <SortableHeader label="Last Active" sortKey="lastActive" selectedSort={selectedSort} onToggle={handleHeaderSort} />,
      dataIndex: "lastActive",
      key: "lastActive",
      render: (value) => <span className="text-sm text-[#8a7082]">{value}</span>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, user) => <ActionDropdown items={getActionItems(user)} />,
    },
  ]), [getActionItems, selectedSort]);

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
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-[520px] xl:max-w-[560px]">
                <label className="relative block min-w-0 flex-1">
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
                <button
                  type="button"
                  onClick={() => {
                    setDebouncedQuery(query.trim());
                    setMetaData((current) => ({ ...current, currentPage: 1 }));
                  }}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
                >
                  <Search size={15} className="mr-2" />
                  Search
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5 xl:flex-nowrap">
                <FilterSelect
                  icon={Users}
                  value={selectedRole}
                  onChange={(value) => {
                    setSelectedRole(value);
                    setMetaData((current) => ({ ...current, currentPage: 1 }));
                  }}
                  options={ROLE_FILTER_OPTIONS}
                  className="min-w-[200px]"
                  placeholder="All roles"
                  disabled={isLoading}
                />
                <FilterSelect
                  icon={MapPin}
                  value={selectedSalonId}
                  onChange={(value) => {
                    setSelectedSalonId(value);
                    setMetaData((current) => ({ ...current, currentPage: 1 }));
                  }}
                  options={[
                    { value: ALL_FILTER_VALUE, label: "All salons" },
                    ...salons.map((salon) => ({
                      value: salon.id,
                      label: salon.name,
                    })),
                  ]}
                  className="min-w-[250px]"
                  placeholder="All salons"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Link
                to={ROUTES.adminUsersCreate}
                className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[image:var(--gradient-accent)] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
              >
                <UserPlus size={15} className="mr-2" />
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

            <div className="hidden lg:block">
              <Table
                rowKey="id"
                columns={userColumns}
                dataSource={displayedUsers}
                loading={isLoading}
                pagination={false}
                scroll={{ x: 1100 }}
                locale={{ emptyText: "No users found." }}
              />
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 rounded-[16px] border border-[#f8dce8] bg-[#fffafb] p-4 text-sm text-[#b38a9f]">
                  <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                  Loading users...
                </div>
              ) : displayedUsers.length ? (
                displayedUsers.map((user) => (
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
