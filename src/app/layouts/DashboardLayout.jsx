import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
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
      return "Nail Artist";
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
        title: "Salon Management",
        description: "Manage salons, branches, capacity, and operational status.",
      };
    case "admin-staff":
      return {
        title: "Staff Management",
        description: "Manage staff profiles, assignments, performance, and availability.",
      };
    case "admin-users":
      return {
        title: "Users",
        description: "Manage customers, staff artists, and salon managers.",
      };
    case "admin-service-pricing":
      return {
        title: "Service & Pricing Management",
        description: "Manage services, prices, and estimated durations.",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menus = getMenuConfig(user?.role);
  const menuGroups = groupMenusBySection(menus);
  const profileName = user?.fullName ?? "Nailify User";
  const profileRole = getRoleLabel(user?.role);
  const portalLabel = getPortalLabel(user?.role);
  const headerContent = getHeaderContent(location.pathname, menus);
  const sidebarWidth = collapsed ? 80 : 200;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <main className="h-screen overflow-hidden bg-[#fff7fb] text-[var(--color-ink)]">
      <div className="hidden h-full md:grid" style={{ gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}>
        <Sidebar
          collapsed={collapsed}
          menuGroups={menuGroups}
          onLogout={logout}
          onToggleCollapse={() => setCollapsed((current) => !current)}
          portalLabel={portalLabel}
          profileName={profileName}
          profileRole={profileRole}
          userInitials={getUserInitials(profileName)}
        />

        <div className="flex min-h-0 flex-col">
          <Header
            backButtonFallbackTo="/"
            title={headerContent.title}
            description={headerContent.description}
            todayLabel={getTodayLabel()}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onLogout={logout}
          />

          <section
            data-dashboard-scroll="desktop"
            className="flex-1 bg-white p-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:p-5 lg:min-h-0 lg:overflow-auto"
          >
            <div className="flex min-h-full flex-col">
              <Outlet />
            </div>
          </section>
        </div>
      </div>

      <div className="relative flex h-full min-h-0 flex-col md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          title="Open menu"
          className="absolute left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f8c8db] bg-white/95 text-[#eb5a99] shadow-[0_12px_24px_rgba(235,90,153,0.12)] transition hover:bg-[#fff0f7]"
        >
          <Menu size={20} />
        </button>

        <section className="flex-1 overflow-auto bg-white p-4 pt-16 shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
          <div className="flex min-h-full flex-col">
            <Outlet />
          </div>
        </section>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-[#3d2233]/45 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-[320px]">
            <Sidebar
              collapsed={false}
              isMobile
              menuGroups={menuGroups}
              onCloseMobile={() => setMobileMenuOpen(false)}
              onLogout={logout}
              onToggleCollapse={() => {}}
              portalLabel={portalLabel}
              profileName={profileName}
              profileRole={profileRole}
              userInitials={getUserInitials(profileName)}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
