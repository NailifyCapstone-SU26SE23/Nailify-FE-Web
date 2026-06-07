import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/core/auth/hooks/useAuth";
import { Header } from "../../shared/components/common/Header";
import { Sidebar } from "../../shared/components/common/Sidebar";
import { getMenuConfig } from "../../shared/constants/menuConfig";

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
      return "Admin Console";
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

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
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
    case "admin-salons":
      return {
        title: "Salons",
        description: "Manage salons, branches, capacity, and operational status.",
      };
    case "admin-staff":
      return {
        title: "Staff",
        description: "Manage staff profiles, assignments, performance, and availability.",
      };
    case "admin-users":
      return {
        title: "Users",
        description: "Manage customers, staff artists, and salon managers.",
      };
    default:
      return {
        title: currentMenu.label,
        description: `Manage ${currentMenu.label.toLowerCase()} across the Nailify workspace.`,
      };
  }
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const menus = getMenuConfig(user?.role);
  const menuGroups = groupMenusBySection(menus);
  const profileName = user?.fullName ?? "Nailify User";
  const profileRole = getRoleLabel(user?.role);
  const portalLabel = getPortalLabel(user?.role);
  const headerContent = getHeaderContent(location.pathname, menus);
  const sidebarWidth = collapsed ? 80 : 200;

  return (
    <main className="h-screen overflow-hidden bg-[#fff7fb] text-[var(--color-ink)]">
      <div
        className="grid h-full"
        style={{ gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}
      >
        <Sidebar
          collapsed={collapsed}
          menuGroups={menuGroups}
          onToggleCollapse={() => setCollapsed((current) => !current)}
          portalLabel={portalLabel}
          profileName={profileName}
          profileRole={profileRole}
          userInitials={getUserInitials(profileName)}
        />

        <div className="flex min-h-0 flex-col">
          <Header
            title={headerContent.title}
            description={headerContent.description}
            todayLabel={getTodayLabel()}
            onLogout={logout}
          />

          <section className="flex-1 bg-white p-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:p-5 lg:min-h-0 lg:overflow-auto">
            <div className="flex min-h-full flex-col">
              <Outlet />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
