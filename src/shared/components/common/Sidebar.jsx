import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  MessageSquareWarning,
  Palette,
  Settings,
  Star,
  Store,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { PropTypes } from "../../utils/propTypes";

const ICON_MAP = {
  analytics: BarChart3,
  calendar: CalendarDays,
  dashboard: LayoutDashboard,
  palette: Palette,
  reviews: Star,
  settings: Settings,
  store: Store,
  support: MessageSquareWarning,
  users: Users,
};

function SidebarItem({ item, collapsed }) {
  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

  const content = ({ isActive = false } = {}) => (
    <div
      title={collapsed ? item.label : undefined}
      className={[
        "flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm transition",
        collapsed ? "justify-center" : "gap-3",
        isActive
          ? "bg-[rgba(255,255,255,0.18)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "text-white/80 hover:bg-[rgba(255,255,255,0.1)] hover:text-white",
        item.disabled ? "cursor-not-allowed opacity-70" : "",
      ].join(" ")}
    >
      <Icon size={15} className="shrink-0" />
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
      ) : null}
      {item.badge && !collapsed ? (
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
  collapsed: PropTypes.bool,
  item: PropTypes.shape({
    badge: PropTypes.string,
    disabled: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    section: PropTypes.string,
    to: PropTypes.string,
  }).isRequired,
};

export function Sidebar({
  collapsed,
  menuGroups,
  onToggleCollapse,
  portalLabel,
  profileName,
  profileRole,
  userInitials,
}) {
  return (
    <aside className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#ea87aa_0%,#ea5f94_55%,#cc437a_100%)] shadow-[6px_0_30px_rgba(201,45,120,0.22)]">
      <div className="flex h-full flex-col">
        <div
          className={[
            "border-b border-white/15",
            collapsed ? "px-2 py-4" : "px-4 py-6",
          ].join(" ")}
        >
          <div className="flex items-center justify-center gap-2 text-center">
            {!collapsed ? <MapPin size={18} className="shrink-0 text-white" /> : null}
            <div className="min-w-0">
              <p className="truncate text-[1.55rem] font-black leading-none tracking-[0.01em] text-white">
                {collapsed ? "N" : "Nailify"}
              </p>
              {!collapsed ? (
                <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/70">
                  {portalLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-5">
          {Object.entries(menuGroups).map(([section, items]) => (
            <div key={section} className="mb-5 last:mb-0">
              {!collapsed ? (
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
                  {section}
                </p>
              ) : null}
              <div className="mt-2 space-y-0.5">
                {items.map((item) => (
                  <SidebarItem key={item.key} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className={[
            "border-t border-white/15",
            collapsed ? "px-2 py-3" : "p-3",
          ].join(" ")}
        >
          <div className="rounded-2xl bg-white/14 px-3 py-3 backdrop-blur-sm">
            <div
              className={[
                "flex items-center",
                collapsed ? "justify-center" : "gap-3",
              ].join(" ")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-[linear-gradient(180deg,#8e154d_0%,#d22c78_100%)] text-sm font-bold text-white">
                {userInitials}
              </div>
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-white">
                    {profileName}
                  </p>
                  <p className="truncate text-[11px] text-white/65">{profileRole}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-10 items-center justify-center border-t border-white/15 text-white/80 transition hover:bg-white/10"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  menuGroups: PropTypes.shape({}).isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  portalLabel: PropTypes.string.isRequired,
  profileName: PropTypes.string.isRequired,
  profileRole: PropTypes.string.isRequired,
  userInitials: PropTypes.string.isRequired,
};
