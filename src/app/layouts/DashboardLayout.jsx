import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/core/auth/hooks/useAuth";
import { Header } from "../../shared/components/common/Header";
import { Sidebar } from "../../shared/components/common/Sidebar";
import { getMenuConfig } from "../../shared/constants/menuConfig";
import { useLanguage } from "../../shared/hooks/useLanguage";

function getRoleLabel(role, t) {
  switch (role) {
    case "admin":
      return t("superAdmin");
    case "manager":
      return t("salonManager");
    case "receptionist":
      return t("receptionist");
    case "staff":
      return t("nailArtist");
    default:
      return t("workspace") || "Workspace";
  }
}

function getPortalLabel(role, t) {
  switch (role) {
    case "admin":
      return t("adminConsole");
    case "manager":
      return t("managerPortal");
    case "receptionist":
      return t("receptionDesk");
    case "staff":
      return t("staffWorkspace");
    default:
      return t("nailifyPortal");
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

function getTodayLabel(language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
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

function getHeaderContent(pathname, menus, t, language) {
  const currentMenu =
    menus.find((item) => item.to === pathname) ??
    menus.find(
      (item) => item.to && item.to !== "/" && pathname.startsWith(`${item.to}/`),
    );

  if (!currentMenu) {
    return {
      title: t("header.dashboard.title"),
      description: t("header.dashboard.desc"),
    };
  }

  switch (currentMenu.key) {
    case "admin-bookings":
    case "manager-bookings":
    case "staff-bookings":
    case "receptionist-bookings":
      return {
        title: t("header.bookings.title"),
        description: t("header.bookings.desc"),
      };
    case "admin-salons":
      return {
        title: t("header.salons.title"),
        description: t("header.salons.desc"),
      };
    case "admin-staff":
      return {
        title: t("header.staff.title"),
        description: t("header.staff.desc"),
      };
    case "admin-users":
      return {
        title: t("header.users.title"),
        description: t("header.users.desc"),
      };
    case "admin-loyalty-tiers":
      return {
        title: t("header.loyaltyTiers.title"),
        description: t("header.loyaltyTiers.desc"),
      };
    case "admin-quiz":
      return {
        title: t("header.quiz.title"),
        description: t("header.quiz.desc"),
      };
    case "admin-quiz-create":
      return {
        title: t("header.quizCreate.title"),
        description: t("header.quizCreate.desc"),
      };
    case "admin-service-pricing":
      return {
        title: t("header.servicePricing.title"),
        description: t("header.servicePricing.desc"),
      };
    case "staff-tasks":
      return {
        title: t("header.tasks.title"),
        description: t("header.tasks.desc"),
      };
    case "staff-profile":
    case "receptionist-profile":
    case "manager-profile":
    case "admin-profile":
      return {
        title: t("header.profile.title"),
        description: t("header.profile.desc"),
      };
    default:
      return {
        title: currentMenu.label,
        description: language === "vi"
          ? `Quản lý ${currentMenu.label.toLowerCase()} trên hệ thống Nailify.`
          : `Manage ${currentMenu.label.toLowerCase()} across the Nailify workspace.`,
      };
  }
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, t } = useLanguage();

  const menus = getMenuConfig(user?.role);
  const translatedMenus = menus.map((item) => ({
    ...item,
    label: t(`menus.${item.key}`) || item.label,
  }));
  
  const menuGroups = groupMenusBySection(translatedMenus);
  const profileName = user?.fullName ?? "Nailify User";
  const profileRole = getRoleLabel(user?.role, t);
  const portalLabel = getPortalLabel(user?.role, t);
  const headerContent = getHeaderContent(location.pathname, translatedMenus, t, language);
  const sidebarWidth = collapsed ? 80 : 200;

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMobileMenuOpen(false);
    });
    return () => cancelAnimationFrame(handle);
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
            todayLabel={getTodayLabel(language)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onLogout={logout}
          />

          <section
            data-dashboard-scroll="desktop"
            className="flex-1 bg-white p-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)] md:p-5 min-h-0 overflow-auto"
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
              onToggleCollapse={() => { }}
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
