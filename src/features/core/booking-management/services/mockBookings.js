import {
  ROUTES,
  getAdminBookingDetailRoute,
  getManagerBookingDetailRoute,
  getReceptionistBookingDetailRoute,
  getStaffBookingDetailRoute,
} from "../../../../shared/constants/routes";
import { ROLES } from "../../../../shared/constants/roles";

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

const BOOKING_FIELDS = [
  "id",
  "customerName",
  "customerPhone",
  "branch",
  "service",
  "staffName",
  "bookingDate",
  "bookingTime",
  "duration",
  "status",
  "channel",
  "paymentStatus",
  "total",
  "createdAt",
  "notes",
];

const createMockBooking = (definition) =>
  BOOKING_FIELDS.reduce((booking, field, index) => {
    booking[field] = definition[index];
    return booking;
  }, {});

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
  [
    "BKG-2407",
    "Bao Chau Le",
    "(+84) 978 611 204",
    "District 1 Salon",
    "Gel Polish",
    "Linh Pham",
    "2026-06-11",
    "12:00",
    "75 min",
    "In Service",
    "Website",
    "Paid",
    "560,000 VND",
    "2026-06-10 18:22",
    "Customer approved pearl chrome concept. Keep service on schedule before dinner event.",
  ],
  [
    "BKG-2408",
    "Minh Anh",
    "(+84) 912 345 678",
    "District 1 Salon",
    "Nail Art Premium",
    "Linh Pham",
    "2026-06-11",
    "14:30",
    "90 min",
    "Pending",
    "Mobile App",
    "Deposit Paid",
    "650,000 VND",
    "2026-06-10 20:05",
    "Sensitive to acrylic monomer. Confirm chrome pearl design and finish before 6PM event.",
  ],
  [
    "BKG-2409",
    "Thao Nhi Vo",
    "(+84) 903 442 511",
    "District 1 Salon",
    "Classic Manicure",
    "Linh Pham",
    "2026-06-11",
    "16:30",
    "45 min",
    "Confirmed",
    "Walk-in",
    "Pending",
    "320,000 VND",
    "2026-06-11 09:10",
    "Walk-in client, prefers a quick minimal nude finish if an earlier slot opens.",
  ],
];

export const BOOKING_ROWS = BOOKING_ROW_DEFINITIONS.map(createMockBooking);

const DEFAULT_DESIGN_IMAGE =
  "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=600&q=80";
const ALT_DESIGN_IMAGE =
  "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80";
const LAST_UPLOAD_IMAGE =
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=240&q=80";

const STAFF_BOOKING_EXPERIENCES = {
  "BKG-2408": {
    bookingCode: "BK-2408",
    statusLabel: "Waiting Confirmation",
    artistInitials: "H",
    steps: [
      { key: "detail", label: "Booking Detail", state: "complete" },
      { key: "consult", label: "Consultation", state: "complete" },
      { key: "confirm", label: "Confirm Design", state: "upcoming" },
      { key: "start", label: "Start Service", state: "upcoming" },
    ],
    customer: {
      name: "Minh Anh",
      phone: "+84 912 345 678",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80",
      memberTier: "Gold Member",
      facts: [
        { label: "Last Booking", value: "July 14, 2025" },
        { label: "Total Visits", value: "18 sessions" },
        { label: "Preferred Shape", value: "Almond / Coffin" },
        { label: "Preferred Length", value: "Medium to Long" },
      ],
      allergyNote:
        "Sensitive to acrylic monomer - use gel-based products only. No strong acetone.",
      preferences: "K-Beauty styles, Chrome finishes, Minimalist designs, Pastel tones",
    },
    bookingInfo: [
      { label: "Service", value: "Chrome Nail Art", note: "+ Hand Spa Add-on" },
      { label: "Appointment", value: "2:30 PM", note: "June 11, 2026" },
      { label: "Duration", value: "90 minutes", note: "Est. end 4:00 PM" },
      { label: "Assigned Chair", value: "Chair 03", note: "VIP Section" },
      { label: "Deposit Paid", value: "200,000 VND", note: "Confirmed", tone: "success" },
      { label: "Staff Artist", value: "Hana Nguyen", note: "Senior Artist" },
    ],
    design: {
      name: "Chrome Pearl",
      image: DEFAULT_DESIGN_IMAGE,
      details: [
        { label: "Shape", value: "Almond" },
        { label: "Length", value: "Medium" },
        { label: "Color", value: "Pearl Chrome" },
        { label: "Finish", value: "Glossy" },
        { label: "Decoration", value: "Pearl Accent" },
        { label: "Base", value: "Gel-based" },
      ],
      tags: [
        { label: "Elegant", className: "border-[#f4cada] bg-[#fff6fa] text-[#ea4f93]" },
        { label: "Chrome", className: "border-[#d8cbff] bg-[#f6f2ff] text-[#8c63ef]" },
        { label: "K-Beauty", className: "border-[#cbe0ff] bg-[#f1f7ff] text-[#4b80e0]" },
        { label: "Popular", className: "border-[#bde6cb] bg-[#effcf3] text-[#27a55f]" },
      ],
    },
    sessionStatus: [
      { label: "Status", value: "Waiting Confirmation" },
      { label: "Staff Artist", value: "Hana Nguyen" },
      { label: "Chair", value: "Chair 03 - VIP" },
      { label: "Time Slot", value: "2:30 - 4:00 PM" },
    ],
    customerHistory: {
      favoriteStyles: [
        { label: "Chrome", className: "border-[#f4cada] bg-[#fff6fa] text-[#ea4f93]" },
        { label: "K-Beauty", className: "border-[#d8cbff] bg-[#f6f2ff] text-[#8c63ef]" },
        { label: "Minimalist", className: "border-[#cbe0ff] bg-[#f1f7ff] text-[#4b80e0]" },
        { label: "Pastel", className: "border-[#d9f2c8] bg-[#f3fce9] text-[#61a437]" },
      ],
      previousShapes: "Almond - Coffin - Oval",
      lastUpload: {
        title: "Chrome Almond Set",
        date: "July 14, 2025",
        image: LAST_UPLOAD_IMAGE,
      },
    },
    suggestedDesigns: [
      { name: "Chrome Nude", meta: "Almond - Glossy - Neutral", image: LAST_UPLOAD_IMAGE },
      { name: "Korean Minimal", meta: "Oval - Matte - Soft Pink", image: ALT_DESIGN_IMAGE },
      { name: "Pearl Ombre", meta: "Coffin - Glossy - Pearl", image: DEFAULT_DESIGN_IMAGE },
    ],
    staffNotes: [
      {
        label: "Customer Requests",
        value:
          "Customer prefers gel-based products only due to acrylic sensitivity. Wants extra shine on the chrome finish.",
      },
      {
        label: "Design Adjustments",
        value:
          "Add one pearl bead on each ring finger nail. Slightly warmer pearl tone preferred.",
      },
      {
        label: "Notes Before Service",
        value:
          "Customer has an event at 6PM. Ensure service is completed by 4:15 PM. Handle cuticles gently.",
      },
    ],
    checklist: [
      { label: "Customer confirmed nail design (Chrome Pearl)", checked: true },
      { label: "Total price confirmed - 650,000 VND (deposit deducted)", checked: true },
      { label: "Estimated duration confirmed - 90 minutes", checked: false },
      { label: "Nail style, shape and finish confirmed with customer", checked: false },
    ],
  },
};

const STAFF_DESIGN_STUDIO_EXPERIENCES = {
  "BKG-2408": {
    bookingCode: "BK-2408",
    customerName: "Minh Anh",
    customerAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80",
    staffName: "Linh Nguyen",
    statusLabel: "In Progress",
    selectedDesign: {
      id: "chrome-pearl",
      name: "Chrome Pearl",
      price: "$48",
      duration: "75 min",
      image: DEFAULT_DESIGN_IMAGE,
      tags: ["Chrome", "Glossy"],
      accent: "Top Pick",
      accentClassName: "bg-[#ede9ff] text-[#7d5ce6]",
      ctaLabel: "Selected",
      previewTone: "Pearl Glow",
      summaryService: "Full Set Gel Nails",
    },
    templates: [
      {
        id: "chrome-pearl",
        name: "Chrome Pearl",
        price: "$48",
        duration: "75 min",
        image: DEFAULT_DESIGN_IMAGE,
        tags: ["Chrome", "Glossy"],
        accent: "Top Pick",
        accentClassName: "bg-[#ede9ff] text-[#7d5ce6]",
        ctaLabel: "Selected",
      },
      {
        id: "korean-nude",
        name: "Korean Nude",
        price: "$35",
        duration: "60 min",
        image: ALT_DESIGN_IMAGE,
        tags: ["Nude", "Minimal"],
        accent: "Trending",
        accentClassName: "bg-[#fff0cf] text-[#d68f1e]",
        ctaLabel: "Select",
      },
      {
        id: "french-ombre",
        name: "French Ombre",
        price: "$42",
        duration: "70 min",
        image: LAST_UPLOAD_IMAGE,
        tags: ["Pink", "Ombre"],
        accent: "Hot",
        accentClassName: "bg-[#ffe1d7] text-[#e56b43]",
        ctaLabel: "Select",
      },
      {
        id: "wedding-floral",
        name: "Wedding Floral",
        price: "$65",
        duration: "90 min",
        image: LAST_UPLOAD_IMAGE,
        tags: ["Floral", "Bridal"],
        accent: "New",
        accentClassName: "bg-[#ddf8e7] text-[#24a561]",
        ctaLabel: "Select",
      },
      {
        id: "minimal-beige",
        name: "Minimal Beige",
        price: "$30",
        duration: "55 min",
        image:
          "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=600&q=80",
        tags: ["Beige", "Matte"],
        accent: "Popular",
        accentClassName: "bg-[#e8e5ff] text-[#7d5ce6]",
        ctaLabel: "Select",
      },
    ],
    filters: ["Shape", "Color", "Occasion", "Skin Tone", "Complexity", "Length", "Finish", "Trend", "Price Range"],
    preferences: [
      { label: "Favorite Styles", value: "Minimal, Korean, Nude" },
      { label: "Preferred Colors", value: "Nude, Pink, White" },
      { label: "Booking History", value: "8 visits - Last: Korean Nude" },
      { label: "Skin Tone", value: "Light Warm" },
    ],
    recommendations: {
      skinTone: ["Nude Tones", "Soft Pink", "Peach"],
      history: ["Korean Nude", "Minimal Beige", "French Ombre"],
      trends: ["Chrome Pearl", "Jelly Nails", "Cat Eye", "Glazed Donut"],
    },
    builder: {
      modeLabel: "Custom Mode",
      shapes: ["Almond", "Square", "Round", "Oval", "Coffin"],
      lengths: ["Short", "Medium", "Long"],
      colors: [
        { label: "Nude", swatch: "#e6c1a2" },
        { label: "Pink", swatch: "#ef6daf" },
        { label: "Chrome", swatch: "#c4cfde" },
        { label: "White", swatch: "#f7f7fb" },
        { label: "Red", swatch: "#ff6d6d" },
        { label: "Black", swatch: "#273044" },
        { label: "Custom", swatch: "linear-gradient(135deg,#111827 0%,#ffffff 100%)" },
      ],
      finishes: ["Glossy", "Matte", "Chrome", "Glitter", "Jelly"],
      decorations: ["Pearl", "Stone", "Floral", "French Tip", "Gold Line", "Cat Eye", "Sticker"],
      extras: ["Hand Spa", "Gel Extension", "Cuticle Care", "Repair"],
      priceRows: [
        ["Base Price", "$48.00"],
        ["Decoration Fee", "$8.00"],
        ["Extra Services", "$0.00"],
      ],
      totalPrice: "$56.00",
      estimatedDuration: "75 min",
      initialSelection: {
        shape: "Almond",
        length: "Medium",
        color: "Chrome",
        finish: "Glossy",
        decorations: ["Pearl"],
        extras: [],
      },
    },
  },
};

const DEFAULT_STUDIO_FILTERS = [
  "Shape",
  "Color",
  "Occasion",
  "Skin Tone",
  "Complexity",
  "Length",
  "Finish",
  "Trend",
  "Price Range",
];

const DEFAULT_STUDIO_BUILDER = {
  modeLabel: "Custom Mode",
  shapes: ["Almond", "Square", "Round", "Oval", "Coffin"],
  lengths: ["Short", "Medium", "Long"],
  colors: [
    { label: "Nude", swatch: "#e6c1a2" },
    { label: "Pink", swatch: "#ef6daf" },
    { label: "Chrome", swatch: "#c4cfde" },
    { label: "White", swatch: "#f7f7fb" },
    { label: "Red", swatch: "#ff6d6d" },
    { label: "Black", swatch: "#273044" },
    { label: "Custom", swatch: "linear-gradient(135deg,#111827 0%,#ffffff 100%)" },
  ],
  finishes: ["Glossy", "Matte", "Chrome", "Glitter", "Jelly"],
  decorations: ["Pearl", "Stone", "Floral", "French Tip", "Gold Line", "Cat Eye", "Sticker"],
  extras: ["Hand Spa", "Gel Extension", "Cuticle Care", "Repair"],
};

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
  [ROLES.receptionist]: {
    badge: "Reception Desk",
    title: "Reception Bookings",
    listHeading: "Front-desk booking queue",
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
    createDescription:
      "Create a mock front-desk booking entry before backend availability and check-in flows are connected.",
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

export const getStaffBookingExperienceById = (bookingId) =>
  STAFF_BOOKING_EXPERIENCES[bookingId] ?? null;

export const getStaffDesignStudioExperienceById = (bookingId) =>
  STAFF_DESIGN_STUDIO_EXPERIENCES[bookingId] ??
  (() => {
    const booking = getMockBookingById(bookingId);

    if (!booking) {
      return null;
    }

    const bookingExperience = getStaffBookingExperienceById(bookingId);
    const bookingCode = booking.id.replace("BKG", "BK");
    const defaultTemplate = {
      id: "custom-consultation",
      name: bookingExperience?.design?.name ?? "Consultation Design",
      price: booking.total.includes("VND") ? booking.total.replace(",000 VND", "k").replace(" VND", "") : "$40",
      duration: booking.duration,
      image: bookingExperience?.design?.image ?? DEFAULT_DESIGN_IMAGE,
      tags:
        bookingExperience?.design?.tags?.map((item) => item.label).slice(0, 2) ?? ["Custom", "Consultation"],
      accent: "Recommended",
      accentClassName: "bg-[#ede9ff] text-[#7d5ce6]",
      ctaLabel: "Selected",
      previewTone: bookingExperience?.design?.details?.find((item) => item.label === "Color")?.value ?? "Soft Glow",
      summaryService: booking.service,
    };

    return {
      bookingCode,
      customerName: booking.customerName,
      customerAvatar:
        bookingExperience?.customer.avatar ??
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80",
      staffName: booking.staffName,
      statusLabel: booking.status,
      selectedDesign: defaultTemplate,
      templates: [
        defaultTemplate,
        {
          id: "soft-nude",
          name: "Soft Nude",
          price: "$35",
          duration: "60 min",
          image: ALT_DESIGN_IMAGE,
          tags: ["Nude", "Minimal"],
          accent: "Trending",
          accentClassName: "bg-[#fff0cf] text-[#d68f1e]",
          ctaLabel: "Select",
        },
        {
          id: "pink-gloss",
          name: "Pink Gloss",
          price: "$42",
          duration: "70 min",
          image: LAST_UPLOAD_IMAGE,
          tags: ["Pink", "Glossy"],
          accent: "New",
          accentClassName: "bg-[#ddf8e7] text-[#24a561]",
          ctaLabel: "Select",
        },
      ],
      filters: DEFAULT_STUDIO_FILTERS,
      preferences: [
        { label: "Favorite Styles", value: bookingExperience?.customer.preferences ?? "Minimal, clean finish" },
        { label: "Preferred Colors", value: "Nude, Pink, White" },
        { label: "Booking History", value: `Last booking: ${booking.createdAt.split(" ")[0]}` },
        { label: "Skin Tone", value: "Warm Neutral" },
      ],
      recommendations: {
        skinTone: ["Nude Tones", "Soft Pink", "Milk White"],
        history: ["Minimal Nude", "Pink Gloss", "Clean French"],
        trends: ["Chrome Accent", "Jelly Nails", "Cat Eye"],
      },
      builder: {
        ...DEFAULT_STUDIO_BUILDER,
        priceRows: [
          ["Base Price", booking.total.includes("VND") ? booking.total.replace(" VND", "") : "$40.00"],
          ["Decoration Fee", "$6.00"],
          ["Extra Services", "$0.00"],
        ],
        totalPrice: booking.total.includes("VND") ? booking.total.replace(" VND", "") : "$46.00",
        estimatedDuration: booking.duration,
        initialSelection: {
          shape:
            bookingExperience?.design?.details?.find((item) => item.label === "Shape")?.value ?? "Almond",
          length:
            bookingExperience?.design?.details?.find((item) => item.label === "Length")?.value ?? "Medium",
          color:
            bookingExperience?.design?.details?.find((item) => item.label === "Color")?.value ?? "Pink",
          finish:
            bookingExperience?.design?.details?.find((item) => item.label === "Finish")?.value ?? "Glossy",
          decorations:
            bookingExperience?.design?.details?.find((item) => item.label === "Decoration")?.value
              ? [bookingExperience.design.details.find((item) => item.label === "Decoration").value]
              : [],
          extras: [],
        },
      },
    };
  })();
