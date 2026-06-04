import {
  BarChart3,
  Bell,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquareWarning,
  Settings,
  Star,
  Store,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { MENU_CONFIG } from "../../shared/constants/menuConfig";
import { PropTypes } from "../../shared/utils/propTypes";

const ICON_MAP = {
  analytics: BarChart3,
  calendar: CalendarDays,
  dashboard: LayoutDashboard,
  reviews: Star,
  settings: Settings,
  store: Store,
  support: MessageSquareWarning,
  users: Users,
};

function getRoleLabel(role) {
  switch (role) {
    case "admin":
      return "Super Admin";
    case "manager":
      return "Salon Manager";
    case "receptionist":
      return "Receptionist";
    case "staff":
      return "Staff Artist";
    default:
      return "Workspace";
  }
}

function getPortalLabel(role) {
  switch (role) {
    case "admin":
      return "Admin Portal";
    case "manager":
      return "Manager Portal";
    case "receptionist":
      return "Reception Desk";
    case "staff":
      return "Staff Workspace";
    default:
      return "Nailify Portal";
  }
}

function getUserInitials(name) {
  return (name ?? "NF")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function groupMenusBySection(menus) {
  return menus.reduce((groups, item) => {
    const section = item.section ?? "Main";

    if (!groups[section]) {
      groups[section] = [];
    }

    groups[section].push(item);
    return groups;
  }, {});
}

function getHeaderContent(pathname, menus) {
  const currentMenu =
    menus.find((item) => item.to === pathname) ??
    menus.find(
      (item) => item.to && item.to !== "/" && pathname.startsWith(`${item.to}/`),
    );

  if (!currentMenu) {
    return {
      title: "Dashboard",
      description: "Monitor internal operations across the Nailify workspace.",
    };
  }

  switch (currentMenu.key) {
    case "admin-bookings":
    case "manager-bookings":
    case "staff-bookings":
    case "receptionist-bookings":
      return {
        title: "Booking Management",
        description: "Monitor bookings across all Nailify salon locations.",
      };
    case "admin-users":
      return {
        title: "User Management",
        description: "Manage customers, staff artists, and salon managers.",
      };
    default:
      return {
        title: currentMenu.label,
        description: `Manage ${currentMenu.label.toLowerCase()} across the Nailify workspace.`,
      };
  }
}

function SidebarItem({ item }) {
  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

  const content = ({ isActive = false } = {}) => (
    <div
      className={[
        "flex min-h-9 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
        isActive
          ? "bg-[rgba(255,255,255,0.18)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "text-white/80 hover:bg-[rgba(255,255,255,0.1)] hover:text-white",
      ].join(" ")}
    >
      <Icon size={15} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
      {item.badge ? (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.2)] px-1.5 text-[10px] font-extrabold text-white">
          {item.badge}
        </span>
      ) : null}
    </div>
  );

  if (item.disabled) {
    return <div>{content()}</div>;
  }

  return (
    <NavLink to={item.to} end>
      {({ isActive }) => content({ isActive })}
    </NavLink>
  );
}

SidebarItem.propTypes = {
  item: PropTypes.shape({
    badge: PropTypes.string,
    disabled: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    section: PropTypes.string,
    to: PropTypes.string,
  }).isRequired,
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const menus = MENU_CONFIG[user?.role] ?? [];
  const menuGroups = groupMenusBySection(menus);
  const profileName = user?.fullName ?? "Nailify User";
  const profileRole = getRoleLabel(user?.role);
  const headerContent = getHeaderContent(location.pathname, menus);

  return (
    <main className="h-screen overflow-hidden bg-[#fff7fb] p-3 text-[var(--color-ink)] md:p-4">
      <div className="grid h-full gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-full overflow-hidden rounded-[10px] bg-[linear-gradient(180deg,#ca2e79_0%,#ea4f93_100%)] shadow-[6px_0_30px_rgba(201,45,120,0.22)]">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/15 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[1.05rem] font-extrabold tracking-[0.02em] text-white">
                    Nailify
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">
                    {getPortalLabel(user?.role)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-5">
              {Object.entries(menuGroups).map(([section, items]) => (
                <div key={section} className="mb-5 last:mb-0">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
                    {section}
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {items.map((item) => (
                      <SidebarItem key={item.key} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/15 p-3">
              <div className="rounded-2xl bg-white/14 px-3 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-[linear-gradient(180deg,#8e154d_0%,#d22c78_100%)] text-sm font-bold text-white">
                    {getUserInitials(profileName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {profileName}
                    </p>
                    <p className="truncate text-[11px] text-white/65">{profileRole}</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
                    title="Sign out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col gap-4">
          <header className="rounded-[10px] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-[1.85rem] font-extrabold leading-none text-[#3d2a3a]">
                  {headerContent.title}
                </h1>
                <p className="mt-2 text-sm text-[#c28ca6]">
                  {headerContent.description}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f8c8db] bg-[#fff8fb] text-[#eb5a99] shadow-[0_12px_24px_rgba(235,90,153,0.12)] transition hover:bg-[#fff0f7]"
                title="Notifications"
              >
                <Bell size={18} />
              </button>
            </div>
          </header>

          <section className="flex-1 rounded-[10px] bg-white p-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:p-5 lg:min-h-0 lg:overflow-auto">
            <div className="flex min-h-full flex-col">
              <Outlet />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
