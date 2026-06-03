import { ROUTES } from "./routes";
import { ROLES } from "./roles";

export const MENU_CONFIG = {
  [ROLES.staff]: [
    { key: "staff-dashboard", label: "Dashboard", to: ROUTES.staffDashboard, icon: "dashboard" },
    { key: "staff-schedule", label: "Schedule", icon: "calendar", disabled: true },
    { key: "staff-bookings", label: "Bookings", to: ROUTES.staffBookings, icon: "calendar" },
    { key: "staff-customers", label: "Customers", icon: "users", disabled: true },
  ],
  [ROLES.manager]: [
    { key: "manager-dashboard", label: "Dashboard", to: ROUTES.managerDashboard, icon: "dashboard" },
    { key: "manager-bookings", label: "Bookings", to: ROUTES.managerBookings, icon: "calendar" },
    { key: "manager-schedules", label: "Schedules", icon: "calendar", disabled: true },
    { key: "manager-staff", label: "Staff Management", icon: "users", disabled: true },
    { key: "manager-reports", label: "Reports", icon: "store", disabled: true },
  ],
  [ROLES.admin]: [
    { key: "admin-dashboard", label: "Dashboard", to: ROUTES.adminDashboard, icon: "dashboard" },
    { key: "admin-bookings", label: "Booking Management", to: ROUTES.adminBookings, icon: "calendar" },
    { key: "admin-salons", label: "Salons", icon: "store", disabled: true },
    { key: "admin-users", label: "User Management", to: ROUTES.adminUsers, icon: "users" },
    { key: "admin-designs", label: "Nail Designs", icon: "calendar", disabled: true },
    { key: "admin-services", label: "Services", icon: "calendar", disabled: true },
    { key: "admin-reports", label: "Reports", icon: "store", disabled: true },
    { key: "admin-settings", label: "Settings", icon: "settings", disabled: true },
  ],
};
