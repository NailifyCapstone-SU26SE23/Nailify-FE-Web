import { ROUTES } from "./routes";
import { ROLES } from "./roles";
import { BOOKING_ROWS } from "../../features/core/booking-management/services/mockBookings";
import { NAIL_DESIGN_ROWS } from "../../features/admin/nails-design-management/services/mockNailDesigns";
import { SALON_BRANCHES } from "../../features/admin/salon-management/services/mockSalon";
import { SERVICE_ROWS } from "../../features/admin/service-pricing-management/services/mockServicePricing";
import { STAFF_TOP_PERFORMERS } from "../../features/admin/staff-management/services/mockStaff";
import { USER_ROWS } from "../../features/admin/user-management/services/mockUsers";

const STAFF_BOOKING_NAMES = new Set(["Ariana Vo", "Bao Tran", "Linh Pham"]);
const MANAGER_BOOKING_BRANCHES = new Set(["District 1 Salon", "District 3 Salon"]);

function getBookingCountByRole(role) {
  if (role === ROLES.staff || role === ROLES.receptionist) {
    return BOOKING_ROWS.filter((booking) =>
      STAFF_BOOKING_NAMES.has(booking.staffName),
    ).length;
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
      key: "staff-schedule",
      label: "Schedule",
      icon: "calendar",
      section: "Main",
      disabled: true,
    },
    {
      key: "staff-customers",
      label: "Customers",
      icon: "users",
      section: "Support",
      disabled: true,
    },
    {
      key: "staff-settings",
      label: "Settings",
      icon: "settings",
      section: "Support",
      disabled: true,
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
      key: "receptionist-settings",
      label: "Settings",
      icon: "settings",
      section: "Support",
      disabled: true,
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
      key: "manager-schedules",
      label: "Schedules",
      icon: "calendar",
      section: "Main",
      disabled: true,
    },
    {
      key: "manager-staff",
      label: "Staff Artists",
      icon: "users",
      section: "Main",
      disabled: true,
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
      key: "manager-settings",
      label: "Settings",
      icon: "settings",
      section: "Support",
      disabled: true,
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
      label: "Services & Pricing",
      to: ROUTES.adminServicePricing,
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
      key: "admin-settings",
      label: "Settings",
      icon: "settings",
      section: "Support",
      disabled: true,
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
