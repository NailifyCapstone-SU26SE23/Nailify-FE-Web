export const ROUTES = {

  // Public routes
  root: "/",
  login: "/login",

  // Staff routes
  staffRoot: "/staff",
  receptionistRoot: "/receptionist",
  staffDashboard: "/staff/dashboard",
  receptionistDashboard: "/receptionist/dashboard",
  staffBookings: "/staff/bookings",
  staffBookingsCreate: "/staff/bookings/create",
  staffBookingDetail: "/staff/bookings/:bookingId",
  receptionistBookings: "/receptionist/bookings",
  receptionistBookingsCreate: "/receptionist/bookings/create",
  receptionistBookingDetail: "/receptionist/bookings/:bookingId",

  // Manager routes
  managerRoot: "/manager",
  managerDashboard: "/manager/dashboard",
  managerBookings: "/manager/bookings",
  managerBookingsCreate: "/manager/bookings/create",
  managerBookingDetail: "/manager/bookings/:bookingId",

  // Admin routes
  adminRoot: "/admin",
  adminDashboard: "/admin/dashboard",
  adminBookings: "/admin/bookings",
  adminBookingsCreate: "/admin/bookings/create",
  adminBookingDetail: "/admin/bookings/:bookingId",
  adminUsers: "/admin/users",
  adminUsersCreate: "/admin/users/create",
  adminUserDetail: "/admin/users/:userId",
  adminNailDesigns: "/admin/nail-designs",
  adminNailDesignsCreate: "/admin/nail-designs/create",
  adminNailDesignDetail: "/admin/nail-designs/:designId",
};

export const getStaffBookingDetailRoute = (bookingId) =>
  `/staff/bookings/${bookingId}`;
export const getReceptionistBookingDetailRoute = (bookingId) =>
  `/receptionist/bookings/${bookingId}`;
export const getManagerBookingDetailRoute = (bookingId) =>
  `/manager/bookings/${bookingId}`;
export const getAdminBookingDetailRoute = (bookingId) =>
  `/admin/bookings/${bookingId}`;
export const getAdminUserDetailRoute = (userId) => `/admin/users/${userId}`;
export const getAdminNailDesignDetailRoute = (designId) =>
  `/admin/nail-designs/${designId}`;
