import {
  ROUTES,
  getAdminBookingDetailRoute,
  getManagerBookingDetailRoute,
  getStaffBookingDetailRoute,
} from "../../../shared/constants/routes";
import { ROLES } from "../../../shared/constants/roles";

export const BOOKING_STATUS_FILTERS = [
  "All",
  "Pending",
  "Confirmed",
  "In Service",
  "Completed",
  "Cancelled",
];

export const BOOKING_STATUS_STYLES = {
  Pending: "bg-[#fff7e7] text-[#cc8a16]",
  Confirmed: "bg-[#edfdf4] text-[#16975f]",
  "In Service": "bg-[#eef4ff] text-[#4361d8]",
  Completed: "bg-[#f4f1ff] text-[#7157d9]",
  Cancelled: "bg-[#fff0f5] text-[#d14c84]",
};

export const BOOKING_CHANNEL_OPTIONS = [
  "Mobile App",
  "Website",
  "Walk-in",
  "Phone",
  "Instagram",
];

export const BOOKING_PAYMENT_OPTIONS = [
  "Pending",
  "Deposit Paid",
  "Paid",
  "Refunded",
];

export const BOOKING_BRANCH_OPTIONS = [
  "District 1 Salon",
  "District 3 Salon",
  "District 7 Salon",
  "Thu Duc Salon",
];

export const BOOKING_SERVICE_OPTIONS = [
  "Gel Polish",
  "Classic Manicure",
  "Nail Art Premium",
  "Spa Pedicure",
  "Builder Gel Set",
];

export const BOOKING_STAFF_OPTIONS = [
  "Ariana Vo",
  "Bao Tran",
  "Linh Pham",
  "Mia Nguyen",
  "Quynh Le",
];

export const BOOKING_SUMMARY_BY_ROLE = {
  [ROLES.admin]: [
    {
      label: "All branches",
      value: "248",
      description: "mock bookings being tracked chain-wide this week",
    },
    {
      label: "Attention needed",
      value: "19",
      description: "pending approvals, reassignments, or overdue check-ins",
    },
    {
      label: "Completed today",
      value: "64",
      description: "appointments marked done across all salons",
    },
  ],
  [ROLES.manager]: [
    {
      label: "This branch",
      value: "84",
      description: "mock bookings assigned to your salon this week",
    },
    {
      label: "Pending review",
      value: "7",
      description: "appointments waiting for staffing or customer confirmation",
    },
    {
      label: "Utilization",
      value: "91%",
      description: "filled service capacity across active shifts",
    },
  ],
  [ROLES.staff]: [
    {
      label: "Assigned today",
      value: "8",
      description: "mock bookings currently assigned to your chair",
    },
    {
      label: "Next check-in",
      value: "11:30",
      description: "upcoming appointment currently in your queue",
    },
    {
      label: "Completed",
      value: "21",
      description: "appointments finished by you this week",
    },
  ],
};

const createMockBooking = (
  id,
  customerName,
  customerPhone,
  branch,
  service,
  staffName,
  bookingDate,
  bookingTime,
  duration,
  status,
  channel,
  paymentStatus,
  total,
  createdAt,
  notes,
) => ({
  id,
  customerName,
  customerPhone,
  branch,
  service,
  staffName,
  bookingDate,
  bookingTime,
  duration,
  status,
  channel,
  paymentStatus,
  total,
  createdAt,
  notes,
});

const BOOKING_ROW_DEFINITIONS = [
  [
    "BKG-2401",
    "Tram Anh Nguyen",
    "(+84) 903 221 908",
    "District 1 Salon",
    "Gel Polish",
    "Ariana Vo",
    "2026-06-03",
    "09:00",
    "60 min",
    "Confirmed",
    "Mobile App",
    "Deposit Paid",
    "450,000 VND",
    "2026-06-01 16:20",
    "Customer requested nude palette and quick turnaround before office meeting.",
  ],
  [
    "BKG-2402",
    "Nhu Y Pham",
    "(+84) 938 510 244",
    "District 3 Salon",
    "Spa Pedicure",
    "Bao Tran",
    "2026-06-03",
    "10:30",
    "75 min",
    "Pending",
    "Website",
    "Pending",
    "520,000 VND",
    "2026-06-02 09:05",
    "Needs callback to confirm therapist availability for sensitive skin treatment.",
  ],
  [
    "BKG-2403",
    "Gia Han Le",
    "(+84) 909 411 055",
    "District 7 Salon",
    "Nail Art Premium",
    "Mia Nguyen",
    "2026-06-03",
    "13:00",
    "120 min",
    "In Service",
    "Instagram",
    "Paid",
    "1,200,000 VND",
    "2026-06-01 20:11",
    "Intricate chrome design with reference image already approved by manager.",
  ],
  [
    "BKG-2404",
    "Thanh Truc Vo",
    "(+84) 902 884 117",
    "Thu Duc Salon",
    "Builder Gel Set",
    "Quynh Le",
    "2026-06-04",
    "15:30",
    "105 min",
    "Confirmed",
    "Phone",
    "Deposit Paid",
    "980,000 VND",
    "2026-06-02 14:44",
    "VIP repeat customer. Keep preferred almond shape on file.",
  ],
  [
    "BKG-2405",
    "Kim Ngan Bui",
    "(+84) 901 777 833",
    "District 1 Salon",
    "Classic Manicure",
    "Linh Pham",
    "2026-06-02",
    "16:00",
    "45 min",
    "Completed",
    "Walk-in",
    "Paid",
    "280,000 VND",
    "2026-06-02 15:48",
    "Walk-in guest converted to loyalty program after service completion.",
  ],
  [
    "BKG-2406",
    "Tuong Vy Tran",
    "(+84) 935 618 420",
    "District 3 Salon",
    "Gel Polish",
    "Bao Tran",
    "2026-06-05",
    "11:00",
    "60 min",
    "Cancelled",
    "Mobile App",
    "Refunded",
    "450,000 VND",
    "2026-06-01 08:32",
    "Cancelled by customer due to schedule conflict. Deposit refunded in mock flow.",
  ],
];

export const BOOKING_ROWS = BOOKING_ROW_DEFINITIONS.map((definition) =>
  createMockBooking(...definition),
);

export const BOOKING_ROLE_CONFIG = {
  [ROLES.admin]: {
    badge: "Admin Control",
    title: "Booking Management",
    listHeading: "Cross-branch booking desk",
    description:
      "Monitor appointment volume, resolve booking conflicts, and review service coverage across every branch from one control surface.",
    panelTitle: "Global visibility",
    panelDescription:
      "Admin can review every booking state before backend scheduling, payment, and notification services are connected.",
    permissionLabel: "Admin only",
    listRoute: ROUTES.adminBookings,
    createRoute: ROUTES.adminBookingsCreate,
    getDetailRoute: getAdminBookingDetailRoute,
    createLabel: "Create booking",
    detailBadge: "Booking Management",
    detailDescription:
      "Review booking details, update appointment fields, or perform a mock delete from this detail page.",
    createDescription:
      "Create a mock appointment with service, branch, staff, and payment details before wiring this flow to real APIs.",
  },
  [ROLES.manager]: {
    badge: "Manager Desk",
    title: "Branch Bookings",
    listHeading: "Salon booking board",
    description:
      "Track upcoming appointments, rebalance staff assignments, and keep your branch schedule aligned throughout the day.",
    panelTitle: "Branch operations",
    panelDescription:
      "Manager sees branch-level bookings and can use this UI to coordinate staffing and service throughput.",
    permissionLabel: "Manager access",
    listRoute: ROUTES.managerBookings,
    createRoute: ROUTES.managerBookingsCreate,
    getDetailRoute: getManagerBookingDetailRoute,
    createLabel: "Add booking",
    detailBadge: "Manager Booking",
    detailDescription:
      "Inspect an appointment, adjust staffing or timing, and run mock CRUD actions for branch operations.",
    createDescription:
      "Add a new mock branch booking and pre-assign the staff member before backend availability checks exist.",
  },
  [ROLES.staff]: {
    badge: "Staff Workspace",
    title: "Bookings",
    listHeading: "Assigned appointment queue",
    description:
      "Follow your daily queue, confirm customer details, and update appointment progress from a staff-focused booking screen.",
    panelTitle: "Personal queue",
    panelDescription:
      "Staff can review assigned bookings and practice status updates in this mock interface.",
    permissionLabel: "Staff access",
    listRoute: ROUTES.staffBookings,
    createRoute: ROUTES.staffBookingsCreate,
    getDetailRoute: getStaffBookingDetailRoute,
    createLabel: "Add personal booking",
    detailBadge: "Staff Booking",
    detailDescription:
      "Open a booking, capture service notes, and update mock appointment status without leaving your workspace.",
    createDescription:
      "Create a mock booking entry for your queue and prepare service details ahead of backend integration.",
  },
};

export const createEmptyBooking = () => ({
  id: "BKG-NEW",
  customerName: "",
  customerPhone: "",
  branch: BOOKING_BRANCH_OPTIONS[0],
  service: BOOKING_SERVICE_OPTIONS[0],
  staffName: BOOKING_STAFF_OPTIONS[0],
  bookingDate: "2026-06-06",
  bookingTime: "09:00",
  duration: "60 min",
  status: "Pending",
  channel: BOOKING_CHANNEL_OPTIONS[0],
  paymentStatus: BOOKING_PAYMENT_OPTIONS[0],
  total: "0 VND",
  createdAt: "2026-06-03 09:00",
  notes: "",
});

export const getMockBookingById = (bookingId) =>
  BOOKING_ROWS.find((booking) => booking.id === bookingId) ?? null;
