export const ROUTES = {
  root: "/",
  login: "/login",
  staffRoot: "/staff",
  managerRoot: "/manager",
  adminRoot: "/admin",
  staffDashboard: "/staff/dashboard",
  managerDashboard: "/manager/dashboard",
  managerBookings: "/manager/bookings",
  adminDashboard: "/admin/dashboard",
  adminUsers: "/admin/users",
  adminUsersCreate: "/admin/users/create",
  adminSalons: "/admin/salons",
  adminSalonsCreate: "/admin/salons/create",
  adminStaff: "/admin/staff",
  adminStaffCreate: "/admin/staff/create",
};

export const getAdminSalonUpdateRoute = (salonId) => `/admin/salons/${salonId}/edit`;

export const getAdminStaffUpdateRoute = (staffId) => `/admin/staff/${staffId}/edit`;

export const getAdminUserDetailRoute = (userId) => `/admin/users/${userId}`;
