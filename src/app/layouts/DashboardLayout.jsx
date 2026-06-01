import { LayoutDashboard, LogOut, Scissors, Settings, Store, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { MENU_CONFIG } from "../../shared/constants/menuConfig";
import { PropTypes } from "../../shared/utils/propTypes";

const ICON_MAP = {
  calendar: Scissors,
  dashboard: LayoutDashboard,
  settings: Settings,
  store: Store,
  users: Users,
};

function SidebarItem({ item }) {
  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

  if (item.disabled) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--color-muted)] opacity-75">
        <div className="flex items-center gap-3">
          <Icon size={18} />
          <span>{item.label}</span>
        </div>
        <span className="rounded-full bg-[#fff0f6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d85a9b]">
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
          isActive
            ? "bg-[linear-gradient(90deg,#ef5db4_0%,#f59b6c_58%,#ffd95a_100%)] text-white shadow-[0_16px_28px_rgba(239,93,180,0.26)]"
            : "text-[var(--color-ink)] hover:bg-[#fff5ef]",
        ].join(" ")
      }
      end
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  );
}

SidebarItem.propTypes = {
  item: PropTypes.shape({
    disabled: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string,
  }).isRequired,
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const menus = MENU_CONFIG[user?.role] ?? [];

  return (
    <main className="h-screen overflow-hidden p-3 text-[var(--color-ink)] md:p-4">
      <div className="flex h-full w-full flex-col rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-3 shadow-[0_28px_80px_var(--color-shadow)] backdrop-blur-xl md:rounded-[34px] md:p-4">
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
            <div className="flex items-center gap-4">
              <div className="text-right">
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

        <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-auto rounded-[24px] bg-[var(--color-panel-strong)] p-5 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:rounded-[28px]">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d85a9b]">
                Navigation
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Shared dashboard layout. Role differences are handled by menu configuration.
              </p>
            </div>

            <nav className="space-y-2">
              {menus.map((item) => (
                <SidebarItem key={item.key} item={item} />
              ))}
            </nav>
          </aside>

          <div className="flex min-h-0 flex-col gap-4">
            <section className="min-h-0 flex-1 overflow-auto rounded-[24px] bg-[var(--color-panel-strong)] p-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:rounded-[28px] md:p-5">
              <div className="flex min-h-full flex-col">
                <Outlet />
              </div>
            </section>
            <footer className="shrink-0 rounded-[20px] bg-[rgba(255,252,248,0.9)] px-5 py-4 text-sm text-[var(--color-muted)] shadow-[0_12px_28px_rgba(94,76,62,0.06)] md:rounded-[24px]">
              Nailify internal dashboard layout shared across Staff, Manager, and Admin.
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
