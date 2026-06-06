export const BOOKING_SUMMARY_CARDS = [
  {
    label: "Pending Bookings",
    value: "14",
    sub: "Awaiting confirmation",
    iconBg: "bg-rose-100 text-rose-500",
    icon: "clock",
  },
  {
    label: "Confirmed Bookings",
    value: "31",
    sub: "+5 since yesterday",
    iconBg: "bg-emerald-100 text-emerald-600",
    icon: "check",
  },
  {
    label: "Checked-in Customers",
    value: "9",
    sub: "+2 this hour",
    iconBg: "bg-sky-100 text-sky-600",
    icon: "user",
  },
  {
    label: "No-shows Today",
    value: "3",
    sub: "+1 from last week",
    iconBg: "bg-red-100 text-red-500",
    icon: "target",
  },
  {
    label: "Reschedule Requests",
    value: "6",
    sub: "Needs attention",
    iconBg: "bg-amber-100 text-amber-600",
    icon: "refresh",
  },
];

export const BOOKING_STATUS_FILTERS = [
  "All",
  "Pending",
  "Confirmed",
  "Checked In",
  "Reschedule",
];

export const BOOKING_APPOINTMENTS = [
  {
    id: "1",
    time: "9:00 AM",
    duration: "60 min",
    customer: "Sarah Johnson",
    phone: "+1 (555) 123-4567",
    service: "Gel Full Set + Art",
    artist: "Luna Park",
    artistDot: "bg-violet-500",
    deposit: "$25.00",
    depositStatus: "Paid",
    depositTone: "text-emerald-600",
    status: "Checked In",
    statusTone: "bg-sky-100 text-sky-600",
  },
  {
    id: "2",
    time: "9:30 AM",
    duration: "90 min",
    customer: "Emily Chen",
    phone: "+1 (555) 234-5678",
    service: "Acrylic Full Set",
    artist: "Aria Nguyen",
    artistDot: "bg-pink-500",
    deposit: "$30.00",
    depositStatus: "Paid",
    depositTone: "text-emerald-600",
    status: "In Progress",
    statusTone: "bg-violet-100 text-violet-600",
  },
  {
    id: "3",
    time: "10:00 AM",
    duration: "45 min",
    customer: "Jessica Kim",
    phone: "+1 (555) 345-6789",
    service: "Pedicure Deluxe",
    artist: "Chloe Davis",
    artistDot: "bg-amber-500",
    deposit: "$15.00",
    depositStatus: "Pending",
    depositTone: "text-amber-600",
    status: "Pending",
    statusTone: "bg-amber-100 text-amber-600",
  },
  {
    id: "4",
    time: "10:30 AM",
    duration: "60 min",
    customer: "Maya Johnson",
    phone: "+1 (555) 456-7890",
    service: "Nail Art Design",
    artist: "Mel Santos",
    artistDot: "bg-teal-500",
    deposit: "$20.00",
    depositStatus: "Paid",
    depositTone: "text-emerald-600",
    status: "Confirmed",
    statusTone: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "5",
    time: "11:00 AM",
    duration: "60 min",
    customer: "Lisa Nguyen",
    phone: "+1 (555) 567-8901",
    service: "Gel Polish",
    artist: "Luna Park",
    artistDot: "bg-violet-500",
    deposit: "$10.00",
    depositStatus: "Paid",
    depositTone: "text-emerald-600",
    status: "Reschedule Req.",
    statusTone: "bg-orange-100 text-orange-600",
  },
  {
    id: "6",
    time: "11:30 AM",
    duration: "45 min",
    customer: "Anna Williams",
    phone: "+1 (555) 678-9012",
    service: "Manicure Basic",
    artist: "Chloe Davis",
    artistDot: "bg-amber-500",
    deposit: "$0.00",
    depositStatus: "Pending",
    depositTone: "text-amber-600",
    status: "No-show",
    statusTone: "bg-slate-100 text-slate-500",
  },
];

export const SCHEDULE_HOURS = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];

export const STAFF_SCHEDULE = [
  {
    name: "Luna Park",
    role: "Senior Artist",
    dotColor: "bg-violet-500",
    blockColor: "bg-violet-400",
    blocks: [
      { startCol: 1, span: 2, label: "Sarah J." },
      { startCol: 4, span: 2, label: "Gel Set" },
      { startCol: 7, span: 2, label: "Lisa N." },
    ],
  },
  {
    name: "Aria Nguyen",
    role: "Nail Artist",
    dotColor: "bg-pink-500",
    blockColor: "bg-pink-400",
    blocks: [
      { startCol: 2, span: 3, label: "Emily C." },
      { startCol: 6, span: 2, label: "Walk-in" },
    ],
  },
  {
    name: "Chloe Davis",
    role: "Nail Artist",
    dotColor: "bg-amber-500",
    blockColor: "bg-amber-400",
    blocks: [
      { startCol: 3, span: 2, label: "Jessica K." },
      { startCol: 5, span: 1, label: "Conflict Slot", conflict: true },
      { startCol: 6, span: 2, label: "Anna W." },
    ],
  },
  {
    name: "Mel Santos",
    role: "Nail Artist",
    dotColor: "bg-teal-500",
    blockColor: "bg-teal-400",
    blocks: [
      { startCol: 4, span: 2, label: "Maya J." },
      { startCol: 8, span: 1, label: "Open" },
    ],
  },
];

export const SMART_SLOT_SUGGESTIONS = [
  {
    time: "12:00 PM",
    difficulty: "Easy",
    difficultyTone: "bg-emerald-100 text-emerald-600",
    detail: "Today, July 12 • Slot opens in 2h 15m",
    staff: "Luna Park",
    staffAppts: "4 appts today",
    tags: ["Gel/Manicure"],
    complexity: "Low complexity",
    avatarTone: "from-violet-400 to-fuchsia-300",
    initials: "LP",
  },
  {
    time: "2:30 PM",
    difficulty: "Medium",
    difficultyTone: "bg-amber-100 text-amber-600",
    detail: "Today, July 12 • Slot opens in 4h 45m",
    staff: "Mel Santos",
    staffAppts: "2 appts today",
    tags: ["Acrylic/Art"],
    complexity: "Medium complexity",
    avatarTone: "from-teal-400 to-cyan-300",
    initials: "MS",
  },
  {
    time: "4:00 PM",
    difficulty: "Complex",
    difficultyTone: "bg-rose-100 text-rose-500",
    detail: "Today, July 12 • Slot opens in 6h 15m",
    staff: "Aria Nguyen",
    staffAppts: "6 appts today",
    tags: ["Full Set + Design"],
    complexity: "High complexity",
    avatarTone: "from-pink-400 to-rose-300",
    initials: "AN",
  },
];

export const CAPACITY_STATS = [
  { label: "Booked", value: "28", tone: "text-rose-500" },
  { label: "Total Slots", value: "36", tone: "text-slate-700" },
  { label: "% Filled", value: "78%", tone: "text-emerald-600" },
];

export const SHIFT_CAPACITY = [
  { label: "Morning", percent: 85, tone: "#d45b9f" },
  { label: "Afternoon", percent: 72, tone: "#f59e0b" },
  { label: "Evening", percent: 60, tone: "#6366f1" },
];

export const STAFF_WORKLOAD = [
  { name: "Luna Park", current: 9, max: 10, tone: "#d45b9f" },
  { name: "Aria Nguyen", current: 8, max: 10, tone: "#ec4899" },
  { name: "Chloe Davis", current: 7, max: 10, tone: "#f59e0b" },
  { name: "Mel Santos", current: 4, max: 10, tone: "#14b8a6" },
];

export const BOOKING_WAITLIST = [
  { name: "Rachel P.", service: "Gel Manicure", time: "Today, 1 PM" },
  { name: "Diana M.", service: "Pedicure", time: "Today, 3 PM" },
  { name: "Kate L.", service: "Nail Art", time: "Today, 5 PM" },
];

export const BOOKING_CONFLICTS = [
  {
    title: "Double Booking - 11 AM",
    detail: "Chloe Davis has overlapping appointments",
    tone: "border-l-red-400 bg-red-50",
    iconTone: "text-red-500",
  },
  {
    title: "Unassigned Booking - 3 PM",
    detail: "Customer waiting — no staff assigned yet",
    tone: "border-l-amber-400 bg-amber-50",
    iconTone: "text-amber-500",
  },
  {
    title: "Deposit Missing - 10 AM",
    detail: "Jessica Kim — deposit not received",
    tone: "border-l-rose-400 bg-rose-50",
    iconTone: "text-rose-500",
  },
];
