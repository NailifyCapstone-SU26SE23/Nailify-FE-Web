import { ROUTES } from "./routes";
import { ROLES } from "./roles";
import { BOOKING_ROWS } from "../bookings/services/mockBookings";
import { NAIL_DESIGN_ROWS } from "../../features/admin/nails-design-management/services/mockNailDesigns";
import { SALON_BRANCHES } from "../../features/admin/salon-management/services/mockSalon";
import { SERVICE_ROWS } from "../../features/admin/service-pricing-management/services/mockServicePricing";
import { STAFF_TOP_PERFORMERS } from "../../features/admin/staff-management/services/mockStaff";
import { USER_ROWS } from "../../features/admin/user-management/services/mockUsers";

const STAFF_BOOKING_NAMES = new Set(["Ariana Vo", "Bao Tran", "Linh Pham"]);
const MANAGER_BOOKING_BRANCHES = new Set(["District 1 Salon", "District 3 Salon"]);

function getBookingCountByRole(role) {
  if (role === ROLES.staff) {
    return BOOKING_ROWS.filter((booking) =>
      STAFF_BOOKING_NAMES.has(booking.staffName),
    ).length;
  }

  if (role === ROLES.receptionist) {
    return BOOKING_ROWS.length;
  }

  if (role === ROLES.manager) {
    return BOOKING_ROWS.filter((booking) =>
      MANAGER_BOOKING_BRANCHES.has(booking.branch),
    ).length;
  }

  return BOOKING_ROWS.length;
}

function getMenuBadge(itemKey, role) {
  switch (itemKey) {
    case "staff-bookings":
    case "receptionist-bookings":
    case "manager-bookings":
    case "admin-bookings":
      return String(getBookingCountByRole(role));
    case "admin-users":
      return String(USER_ROWS.length);
    case "admin-service-pricing":
      return String(SERVICE_ROWS.length);
    case "admin-salons":
      return String(SALON_BRANCHES.length);
    case "admin-staff":
      return String(STAFF_TOP_PERFORMERS.length);
    case "admin-nail-designs":
      return String(NAIL_DESIGN_ROWS.length);
    default:
      return null;
  }
}

export const MENU_CONFIG = {

  //staff
  [ROLES.staff]: [
    {
      key: "staff-dashboard",
      label: "Dashboard",
      to: ROUTES.staffDashboard,
      icon: "dashboard",
      section: "Main",
    },
    {
      key: "staff-bookings",
      label: "Bookings",
      to: ROUTES.staffBookings,
      icon: "calendar",
      section: "Main",
      badge: "8",
    },
    {
      key: "staff-tasks",
      label: "Tasks",
      to: ROUTES.staffTasks,
      icon: "tasks",
      section: "Main",
    },
    {
      key: "staff-customer-nails",
      label: "Custom Reviews",
      to: ROUTES.staffCustomerNails,
      icon: "palette",
      section: "Main",
    },
    {
      key: "staff-waitting",
      label: "Waitlist Alerts",
      to: ROUTES.staffWaitting,
      icon: "support",
      section: "Main",
      badge: "4",
    },
    {
      key: "staff-schedule",
      label: "Schedule",
      to: ROUTES.staffSchedules,
      icon: "calendar",
      section: "Main",
    },
    {
      key: "staff-breaks",
      label: "Breaks",
      to: ROUTES.staffBreaks,
      icon: "clock",
      section: "Main",
    },
    {
      key: "staff-customers",
      label: "Customers",
      icon: "users",
      section: "Support",
      disabled: true,
    },
    {
      key: "staff-profile",
      label: "Profile",
      to: ROUTES.staffProfile,
      icon: "settings",
      section: "Support",
    },
  ],

  //receptionist
  [ROLES.receptionist]: [
    {
      key: "receptionist-dashboard",
      label: "Dashboard",
      to: ROUTES.receptionistDashboard,
      icon: "dashboard",
      section: "Main",
    },
    {
      key: "receptionist-bookings",
      label: "Bookings",
      to: ROUTES.receptionistBookings,
      icon: "calendar",
      section: "Main",
      badge: "24",
    },
    {
      key: "receptionist-breaks",
      label: "Breaks",
      to: ROUTES.receptionistBreaks,
      icon: "clock",
      section: "Main",
    },
    {
      key: "receptionist-customers",
      label: "Customers",
      icon: "users",
      section: "Main",
      disabled: true,
    },
    {
      key: "receptionist-reviews",
      label: "Reviews",
      icon: "reviews",
      section: "Analytics",
      disabled: true,
    },
    {
      key: "receptionist-complaints",
      label: "Complaints",
      icon: "support",
      section: "Support",
      badge: "3",
      disabled: true,
    },
    {
      key: "receptionist-profile",
      label: "Profile",
      to: ROUTES.receptionistProfile,
      icon: "settings",
      section: "Support",
    },
  ],
  //manager
  [ROLES.manager]: [
    {
      key: "manager-dashboard",
      label: "Dashboard",
      to: ROUTES.managerDashboard,
      icon: "dashboard",
      section: "Main",
    },
    {
      key: "manager-bookings",
      label: "Bookings",
      to: ROUTES.managerBookings,
      icon: "calendar",
      section: "Main",
      badge: "16",
    },
    {
      key: "manager-customer-nails",
      label: "Customer Nails",
      to: ROUTES.managerCustomerNails,
      icon: "palette",
      section: "Main",
    },
    {
      key: "manager-schedules",
      label: "Schedules",
      icon: "calendar",
      section: "Main",
      disabled: true,
    },
    {
      key: "manager-staff",
      label: "Staff Artists",
      to: ROUTES.managerStaffArtists,
      icon: "users",
      section: "Main",
    },
    {
      key: "manager-customers",
      label: "Customers",
      icon: "users",
      section: "Main",
      disabled: true,
    },
    {
      key: "manager-reports",
      label: "Analytics",
      icon: "analytics",
      section: "Analytics",
      disabled: true,
    },
    {
      key: "manager-reviews",
      label: "Reviews",
      icon: "reviews",
      section: "Analytics",
      disabled: true,
    },
    {
      key: "manager-profile",
      label: "Profile",
      to: ROUTES.managerProfile,
      icon: "settings",
      section: "Support",
    },
  ],

  //admin
  [ROLES.admin]: [
    {
      key: "admin-dashboard",
      label: "Dashboard",
      to: ROUTES.adminDashboard,
      icon: "dashboard",
      section: "Main",
    },
    {
      key: "admin-bookings",
      label: "Bookings",
      to: ROUTES.adminBookings,
      icon: "calendar",
      section: "Main",
      badge: "24",
    },
    {
      key: "admin-salons",
      label: "Salons",
      to: ROUTES.adminSalons,
      icon: "store",
      section: "Main",
    },
    {
      key: "admin-staff",
      label: "Staff",
      to: ROUTES.adminStaff,
      icon: "users",
      section: "Main",
    },
    {
      key: "admin-users",
      label: "Users",
      to: ROUTES.adminUsers,
      icon: "users",
      section: "Main",
    },
    {
      key: "admin-service-pricing",
      label: "Services",
      to: ROUTES.adminServicePricing,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-nail-shapes",
      label: "Nail Shapes",
      to: ROUTES.adminNailShapes,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-nail-surfaces",
      label: "Nail Surfaces",
      to: ROUTES.adminNailSurfaces,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-components",
      label: "Components",
      to: ROUTES.adminComponents,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-procedures",
      label: "Procedures",
      to: ROUTES.adminProcedures,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-category-types",
      label: "Category Types",
      to: ROUTES.adminCategoryTypes,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-skill-types",
      label: "Skill Types",
      to: ROUTES.adminSkillTypes,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-categories",
      label: "Categories",
      to: ROUTES.adminCategories,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-promotions",
      label: "Promotions",
      to: ROUTES.adminPromotions,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-nail-designs",
      label: "Nail Designs",
      to: ROUTES.adminNailDesigns,
      icon: "palette",
      section: "Main",
    },
    {
      key: "admin-analytics",
      label: "Analytics",
      icon: "analytics",
      section: "Analytics",
      disabled: true,
    },
    {
      key: "admin-reviews",
      label: "Reviews",
      icon: "reviews",
      section: "Analytics",
      disabled: true,
    },
    {
      key: "admin-complaints",
      label: "Complaints",
      icon: "support",
      section: "Support",
      badge: "7",
      disabled: true,
    },
    {
      key: "admin-profile",
      label: "Profile",
      to: ROUTES.adminProfile,
      icon: "settings",
      section: "Support",
    },
  ],
};

export function getMenuConfig(role) {
  const menus = MENU_CONFIG[role] ?? [];

  return menus.map((item) => {
    const badge = getMenuBadge(item.key, role);

    if (badge === null) {
      const menuItem = { ...item };
      delete menuItem.badge;
      return menuItem;
    }

    return {
      ...item,
      badge,
    };
  });
}
