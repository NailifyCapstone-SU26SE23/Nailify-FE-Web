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
  staffBookingServiceSession: "/staff/bookings/:bookingId/service-session",
  staffCustomerNails: "/staff/customer-nails",
  staffCustomerNailDetail: "/staff/customer-nails/:customerNailId",
  receptionistBookings: "/receptionist/bookings",
  receptionistBookingsCreate: "/receptionist/bookings/create",
  receptionistBookingDetail: "/receptionist/bookings/:bookingId",
  receptionistBookingCheckout: "/receptionist/bookings/:bookingId/checkout",

  // Manager routes
  managerRoot: "/manager",
  managerDashboard: "/manager/dashboard",
  managerBookings: "/manager/bookings",
  managerBookingsCreate: "/manager/bookings/create",
  managerBookingDetail: "/manager/bookings/:bookingId",
  managerStaffArtists: "/manager/staff-artists",
  managerStaffArtistsCreate: "/manager/staff-artists/create",
  managerStaffArtistUpdate: "/manager/staff-artists/:staffId",
  managerCustomerNails: "/manager/customer-nails",
  managerCustomerNailDetail: "/manager/customer-nails/:customerNailId",

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
  adminNailShapes: "/admin/nail-shapes",
  adminNailShapesCreate: "/admin/nail-shapes/create",
  adminNailShapeDetail: "/admin/nail-shapes/:shapeId",
  adminNailSurfaces: "/admin/nail-surfaces",
  adminNailSurfacesCreate: "/admin/nail-surfaces/create",
  adminNailSurfaceDetail: "/admin/nail-surfaces/:surfaceId",
  adminComponents: "/admin/components",
  adminComponentsCreate: "/admin/components/create",
  adminComponentDetail: "/admin/components/:componentId",
  adminProcedures: "/admin/procedures",
  adminProceduresCreate: "/admin/procedures/create",
  adminProcedureDetail: "/admin/procedures/:procedureId",
  adminCategoryTypes: "/admin/category-types",
  adminCategoryTypesCreate: "/admin/category-types/create",
  adminCategoryTypeDetail: "/admin/category-types/:categoryTypeId",
  adminSkillTypes: "/admin/skill-types",
  adminSkillTypesCreate: "/admin/skill-types/create",
  adminSkillTypeDetail: "/admin/skill-types/:skillTypeId",
  adminCategories: "/admin/categories",
  adminCategoriesCreate: "/admin/categories/create",
  adminCategoryDetail: "/admin/categories/:categoryId",
  adminNailDesigns: "/admin/nail-designs",
  adminNailDesignCategories: "/admin/nail-designs/categories",
  adminNailDesignsCreate: "/admin/nail-designs/create",
  adminNailDesignDetail: "/admin/nail-designs/:designId",
  adminNailVariantCreate: "/admin/nail-designs/:designId/variants/create",
  adminNailVariantCreateTryOn: "/admin/nail-designs/:designId/variants/create/try-on",
  adminNailVariantDetail: "/admin/nail-designs/:designId/variants/:variantId",
  adminNailVariantTryOn: "/admin/nail-designs/:designId/variants/:variantId/try-on",
};

export const getStaffBookingDetailRoute = (bookingId) =>
  `/staff/bookings/${bookingId}`;
export const getStaffBookingDesignStudioRoute = (bookingId) =>
  `/staff/bookings/${bookingId}/design-studio`;
export const getStaffBookingDesignUpdateRoute = (bookingId) =>
  `/staff/bookings/${bookingId}/update-booking-design`;
export const getStaffBookingServiceSessionRoute = (bookingId) =>
  `/staff/bookings/${bookingId}/service-session`;
export const getReceptionistBookingDetailRoute = (bookingId) =>
  `/receptionist/bookings/${bookingId}`;
export const getReceptionistBookingCheckoutRoute = (bookingId) =>
  `/receptionist/bookings/${bookingId}/checkout`;
export const getManagerBookingDetailRoute = (bookingId) =>
  `/manager/bookings/${bookingId}`;
export const getManagerStaffUpdateRoute = (staffId) =>
  `/manager/staff-artists/${staffId}`;
export const getAdminBookingDetailRoute = (bookingId) =>
  `/admin/bookings/${bookingId}`;
export const getAdminSalonDetailRoute = (salonId) => `/admin/salons/${salonId}`;
export const getAdminSalonUpdateRoute = (salonId) => `/admin/salons/${salonId}/edit`;
export const getAdminStaffUpdateRoute = (staffId) => `/admin/staff/${staffId}`;
export const getAdminUserDetailRoute = (userId) => `/admin/users/${userId}`;
export const getAdminServicePricingRoute = () => "/admin/service-pricing";
export const getAdminNailShapeDetailRoute = (shapeId) => `/admin/nail-shapes/${shapeId}`;
export const getAdminNailSurfaceDetailRoute = (surfaceId) => `/admin/nail-surfaces/${surfaceId}`;
export const getAdminComponentDetailRoute = (componentId) => `/admin/components/${componentId}`;
export const getAdminProcedureDetailRoute = (procedureId) => `/admin/procedures/${procedureId}`;
export const getAdminCategoryTypeDetailRoute = (categoryTypeId) => `/admin/category-types/${categoryTypeId}`;
export const getAdminSkillTypeDetailRoute = (skillTypeId) => `/admin/skill-types/${skillTypeId}`;
export const getAdminCategoryDetailRoute = (categoryId) => `/admin/categories/${categoryId}`;
export const getAdminNailDesignCategoriesRoute = () => "/admin/nail-designs/categories";
export const getAdminNailDesignDetailRoute = (designId) =>
  `/admin/nail-designs/${designId}`;
export const getAdminNailVariantDetailRoute = (designId, variantId) =>
  `/admin/nail-designs/${designId}/variants/${variantId}`;
export const getAdminNailVariantCreateRoute = (designId) =>
  `/admin/nail-designs/${designId}/variants/create`;
export const getAdminNailVariantCreateTryOnRoute = (designId) =>
  `/admin/nail-designs/${designId}/variants/create/try-on`;
export const getAdminNailVariantTryOnRoute = (designId, variantId, mode) => {
  const basePath = `/admin/nail-designs/${designId}/variants/${variantId}/try-on`;

  return mode ? `${basePath}?mode=${mode}&nailVariantId=${variantId}` : `${basePath}?nailVariantId=${variantId}`;
};
