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
  staffBookingDesignStudio: "/staff/bookings/:bookingId/design-studio",
  staffBookingDesignUpdate: "/staff/bookings/:bookingId/update-booking-design",
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
  adminSalons: "/admin/salons",
  adminSalonsCreate: "/admin/salons/create",
  adminSalonDetail: "/admin/salons/:salonId",
  adminSalonUpdate: "/admin/salons/:salonId/edit",
  adminStaff: "/admin/staff",
  adminStaffCreate: "/admin/staff/create",
  adminStaffUpdate: "/admin/staff/:staffId",
  adminUsers: "/admin/users",
  adminUsersCreate: "/admin/users/create",
  adminUserDetail: "/admin/users/:userId",
  adminServicePricing: "/admin/service-pricing",
  adminNailDesigns: "/admin/nail-designs",
  adminNailDesignCategories: "/admin/nail-designs/categories",
  adminNailDesignsCreate: "/admin/nail-designs/create",
  adminNailDesignDetail: "/admin/nail-designs/:designId",
};

export const getStaffBookingDetailRoute = (bookingId) =>
  `/staff/bookings/${bookingId}`;
export const getStaffBookingDesignStudioRoute = (bookingId) =>
  `/staff/bookings/${bookingId}/design-studio`;
export const getStaffBookingDesignUpdateRoute = (bookingId) =>
  `/staff/bookings/${bookingId}/update-booking-design`;
export const getReceptionistBookingDetailRoute = (bookingId) =>
  `/receptionist/bookings/${bookingId}`;
export const getManagerBookingDetailRoute = (bookingId) =>
  `/manager/bookings/${bookingId}`;
export const getAdminBookingDetailRoute = (bookingId) =>
  `/admin/bookings/${bookingId}`;
export const getAdminSalonDetailRoute = (salonId) => `/admin/salons/${salonId}`;
export const getAdminSalonUpdateRoute = (salonId) => `/admin/salons/${salonId}/edit`;
export const getAdminStaffUpdateRoute = (staffId) => `/admin/staff/${staffId}`;
export const getAdminUserDetailRoute = (userId) => `/admin/users/${userId}`;
export const getAdminServicePricingRoute = () => "/admin/service-pricing";
export const getAdminNailDesignCategoriesRoute = () => "/admin/nail-designs/categories";
export const getAdminNailDesignDetailRoute = (designId) =>
  `/admin/nail-designs/${designId}`;
