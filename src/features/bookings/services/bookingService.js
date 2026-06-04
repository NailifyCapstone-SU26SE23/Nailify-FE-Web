import {
  BOOKING_ROLE_CONFIG,
  BOOKING_ROWS,
  BOOKING_SUMMARY_BY_ROLE,
  BOOKING_STATUS_FILTERS,
  BOOKING_STATUS_STYLES,
  createEmptyBooking,
  getMockBookingById,
} from "../../booking-management/services/mockBookings";
import { ROLES } from "../../../shared/constants/roles";
import {
  ROUTES,
  getReceptionistBookingDetailRoute,
} from "../../../shared/constants/routes";

const receptionistRoleConfig = {
  ...BOOKING_ROLE_CONFIG[ROLES.staff],
  badge: "Reception Desk",
  title: "Reception Bookings",
  description:
    "Track walk-ins, upcoming appointments, and front-desk coordination from a receptionist-focused booking workspace.",
  panelTitle: "Reception workflow",
  panelDescription:
    "Receptionists can review appointment details, confirm customer arrival, and keep the desk queue moving.",
  permissionLabel: "Receptionist access",
  listRoute: ROUTES.receptionistBookings,
  createRoute: ROUTES.receptionistBookingsCreate,
  getDetailRoute: getReceptionistBookingDetailRoute,
  createLabel: "Create front-desk booking",
  detailBadge: "Reception Booking",
  detailDescription:
    "Review booking details, update arrival information, and run mock actions for front-desk operations.",
};

const receptionistSummary = [
  {
    label: "Front desk queue",
    value: "18",
    description: "appointments requiring receptionist attention today",
  },
  {
    label: "Walk-ins",
    value: "7",
    description: "customers added from the salon reception counter",
  },
  {
    label: "Arrivals pending",
    value: "5",
    description: "guests expected to check in within the next hour",
  },
];

export function getBookingRoleConfig(role) {
  if (role === ROLES.receptionist) {
    return receptionistRoleConfig;
  }

  return BOOKING_ROLE_CONFIG[role] ?? BOOKING_ROLE_CONFIG[ROLES.staff];
}

export function getBookingSummaryByRole(role) {
  if (role === ROLES.receptionist) {
    return receptionistSummary;
  }

  return BOOKING_SUMMARY_BY_ROLE[role] ?? BOOKING_SUMMARY_BY_ROLE[ROLES.staff];
}

export function getBookings() {
  return BOOKING_ROWS;
}

export function getBookingById(bookingId) {
  return getMockBookingById(bookingId);
}

export {
  BOOKING_STATUS_FILTERS,
  BOOKING_STATUS_STYLES,
  createEmptyBooking,
};
