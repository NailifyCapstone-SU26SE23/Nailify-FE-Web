export const ROUTES = {
  root: "/",
  login: "/login",
  staffRoot: "/staff",
  managerRoot: "/manager",
  adminRoot: "/admin",
  staffDashboard: "/staff/dashboard",
  staffBookings: "/staff/bookings",
  staffBookingsCreate: "/staff/bookings/create",
  managerDashboard: "/manager/dashboard",
  managerBookings: "/manager/bookings",
  managerBookingsCreate: "/manager/bookings/create",
  adminDashboard: "/admin/dashboard",
  adminBookings: "/admin/bookings",
  adminBookingsCreate: "/admin/bookings/create",
  adminUsers: "/admin/users",
  adminUsersCreate: "/admin/users/create",
};

export const getStaffBookingDetailRoute = (bookingId) =>
  `/staff/bookings/${bookingId}`;
export const getManagerBookingDetailRoute = (bookingId) =>
  `/manager/bookings/${bookingId}`;
export const getAdminBookingDetailRoute = (bookingId) =>
  `/admin/bookings/${bookingId}`;
export const getAdminUserDetailRoute = (userId) => `/admin/users/${userId}`;
