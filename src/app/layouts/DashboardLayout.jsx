import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  Store,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AdminSidebar } from "../../features/admin/components/AdminSidebar";
import { SalonManagerSidebar } from "../../features/manager/components/SalonManagerSidebar";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { MENU_CONFIG } from "../../shared/constants/menuConfig";
import { ROLES } from "../../shared/constants/roles";
import { PropTypes } from "../../shared/utils/propTypes";

const ICON_MAP = {
  calendar: Scissors,
  dashboard: LayoutDashboard,
  settings: Settings,
  store: Store,
  users: Users,
};

function SidebarItem({ item, isCollapsed }) {
  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

  if (item.disabled) {
    return (
      <div
        className={`rounded-2xl border border-transparent py-3 text-sm text-[var(--color-muted)] opacity-75 ${
          isCollapsed ? "px-3" : "px-4"
        }`}
      >
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon size={18} />
            {isCollapsed ? null : <span>{item.label}</span>}
          </div>
          {isCollapsed ? null : (
            <span className="rounded-full bg-[#fff0f6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d85a9b]">
              Soon
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          `rounded-2xl py-3 text-sm font-medium transition ${
            isCollapsed
              ? "flex justify-center px-3"
              : "flex items-center gap-3 px-4"
          }`,
          isActive
            ? "bg-[linear-gradient(90deg,#ef5db4_0%,#f59b6c_58%,#ffd95a_100%)] text-white shadow-[0_16px_28px_rgba(239,93,180,0.26)]"
            : "text-[var(--color-ink)] hover:bg-[#fff5ef]",
        ].join(" ")
      }
      end
      title={isCollapsed ? item.label : undefined}
    >
      <Icon size={18} />
      {isCollapsed ? null : <span>{item.label}</span>}
    </NavLink>
  );
}

SidebarItem.propTypes = {
  isCollapsed: PropTypes.bool,
  item: PropTypes.shape({
    disabled: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string,
  }).isRequired,
};

function DashboardHeader({ user, logout }) {
  return (
    <header className="shrink-0 rounded-[24px] bg-[var(--color-panel-strong)] px-4 py-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:rounded-[28px] md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#d45b9f]">
            Nailify Internal
          </p>
          <h1 className="text-xl font-semibold capitalize">
            {user?.role} workspace
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-left sm:text-right">
            <p className="font-medium">{user?.fullName}</p>
            <p className="text-sm text-[var(--color-muted)]">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_24px_rgba(242,94,181,0.22)] transition hover:scale-[1.01]"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

DashboardHeader.propTypes = {
  logout: PropTypes.func.isRequired,
  user: PropTypes.shape({
    email: PropTypes.string,
    fullName: PropTypes.string,
    role: PropTypes.string,
  }),
};

function AdminDashboardLayout({ user, logout }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9eef2] text-[var(--color-ink)]">
      <AdminSidebar
        collapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
        user={user}
      />

      <div
        className={`min-h-screen transition-[margin] duration-200 ${
          isSidebarCollapsed ? "ml-[80px]" : "ml-[200px]"
        }`}
      >
        <div className="flex min-h-screen flex-col gap-4 p-4 md:p-5">
          <DashboardHeader user={user} logout={logout} />

          <section className="flex-1 rounded-[24px] bg-[var(--color-panel-strong)] p-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:rounded-[28px] md:p-5">
            <div className="flex min-h-full flex-col">
              <Outlet />
            </div>
          </section>

          <footer className="shrink-0 rounded-[20px] bg-[rgba(255,252,248,0.9)] px-5 py-4 text-sm text-[var(--color-muted)] shadow-[0_12px_28px_rgba(94,76,62,0.06)] md:rounded-[24px]">
            Nailify admin console powered by the shared dashboard layout.
          </footer>
        </div>
      </div>
    </div>
  );
}

AdminDashboardLayout.propTypes = {
  logout: PropTypes.func.isRequired,
  user: PropTypes.shape({
    email: PropTypes.string,
    fullName: PropTypes.string,
    role: PropTypes.string,
  }),
};

function ManagerDashboardLayout({ user }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9eef2] text-[var(--color-ink)]">
      <SalonManagerSidebar
        collapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
        user={user}
      />

      <div
        className={`min-h-screen transition-[margin] duration-200 ${
          isSidebarCollapsed ? "ml-[80px]" : "ml-[200px]"
        }`}
      >
        <div className="p-4 md:p-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

ManagerDashboardLayout.propTypes = {
  user: PropTypes.shape({
    fullName: PropTypes.string,
    role: PropTypes.string,
  }),
};

function RoleDashboardLayout({ user, logout, menus }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <main className="min-h-screen p-3 text-[var(--color-ink)] md:p-4 lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-[calc(100vh-1.5rem)] w-full flex-col rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-3 shadow-[0_28px_80px_var(--color-shadow)] backdrop-blur-xl md:rounded-[34px] md:p-4 lg:h-full lg:min-h-0">
        <DashboardHeader user={user} logout={logout} />

        <div
          className={`mt-4 grid min-h-0 flex-1 gap-4 ${
            isSidebarCollapsed
              ? "lg:grid-cols-[96px_minmax(0,1fr)]"
              : "lg:grid-cols-[280px_minmax(0,1fr)]"
          }`}
        >
          <aside className="rounded-[24px] bg-[var(--color-panel-strong)] p-3 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:rounded-[28px] md:p-4 lg:min-h-0">
            <div className="flex h-full flex-col">
              <div className={isSidebarCollapsed ? "mb-4" : "mb-5 px-2 pt-1"}>
                {isSidebarCollapsed ? (
                  <p className="text-center text-xs uppercase tracking-[0.2em] text-[#d85a9b]">
                    Nav
                  </p>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d85a9b]">
                      Navigation
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      Shared dashboard layout. Role differences are handled by menu configuration.
                    </p>
                  </>
                )}
              </div>

              <nav className="flex-1 space-y-2 lg:overflow-auto">
                {menus.map((item) => (
                  <SidebarItem
                    key={item.key}
                    item={item}
                    isCollapsed={isSidebarCollapsed}
                  />
                ))}
              </nav>

              <div className="hidden pt-3 lg:block">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                  className={`inline-flex h-11 items-center rounded-2xl border border-[#f1dfd2] bg-white text-sm font-medium text-[var(--color-ink)] shadow-[0_10px_24px_rgba(94,76,62,0.08)] transition hover:bg-[#fff5ef] ${
                    isSidebarCollapsed
                      ? "w-full justify-center"
                      : "w-full justify-between px-4"
                  }`}
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight size={18} />
                  ) : (
                    <>
                      <span></span>
                      <ChevronLeft size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col gap-4">
            <section className="flex-1 rounded-[24px] bg-[var(--color-panel-strong)] p-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:rounded-[28px] md:p-5 lg:min-h-0 lg:overflow-auto">
              <div className="flex min-h-full flex-col">
                <Outlet />
              </div>
            </section>
            <footer className="shrink-0 rounded-[20px] bg-[rgba(255,252,248,0.9)] px-5 py-4 text-sm text-[var(--color-muted)] shadow-[0_12px_28px_rgba(94,76,62,0.06)] md:rounded-[24px]">
              Nailify internal dashboard layout shared across Staff and Manager.
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

RoleDashboardLayout.propTypes = {
  logout: PropTypes.func.isRequired,
  menus: PropTypes.arrayOf(
    PropTypes.shape({
      disabled: PropTypes.bool,
      icon: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
    }),
  ).isRequired,
  user: PropTypes.shape({
    email: PropTypes.string,
    fullName: PropTypes.string,
    role: PropTypes.string,
  }),
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const menus = MENU_CONFIG[user?.role] ?? [];

  if (user?.role === ROLES.admin) {
    return <AdminDashboardLayout user={user} logout={logout} />;
  }

  if (user?.role === ROLES.manager) {
    return <ManagerDashboardLayout user={user} />;
  }

  return (
    <RoleDashboardLayout user={user} logout={logout} menus={menus} />
  );
}
