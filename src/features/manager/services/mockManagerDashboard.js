export const MANAGER_KPI_CARDS = [
  {
    label: "Today's Bookings",
    value: "34",
    change: "+8%",
    changeTone: "text-emerald-500",
    icon: "calendar",
    iconBg: "bg-rose-100 text-rose-500",
  },
  {
    label: "Walk-in Customers",
    value: "7",
    change: "+3",
    changeTone: "text-emerald-500",
    icon: "user",
    iconBg: "bg-sky-100 text-sky-500",
  },
  {
    label: "Available Staff",
    value: "3",
    change: "No change",
    changeTone: "text-slate-400",
    icon: "users",
    iconBg: "bg-violet-100 text-violet-500",
  },
  {
    label: "Occupied Chairs",
    value: "6",
    change: "N/A",
    changeTone: "text-rose-400",
    icon: "chair",
    iconBg: "bg-amber-100 text-amber-500",
  },
  {
    label: "Daily Revenue",
    value: "$1,840",
    change: "+12%",
    changeTone: "text-emerald-500",
    icon: "dollar",
    iconBg: "bg-emerald-100 text-emerald-500",
  },
  {
    label: "Average Wait Time",
    value: "18m",
    change: "+5min",
    changeTone: "text-rose-500",
    icon: "clock",
    iconBg: "bg-orange-100 text-orange-500",
  },
];

export const MANAGER_STAFF_AVAILABILITY = [
  {
    name: "Tina L.",
    role: "Nail Artist",
    status: "Busy",
    statusTone: "bg-rose-100 text-rose-500",
    dotTone: "bg-rose-500",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Kevin B.",
    role: "Nail Artist",
    status: "Available",
    statusTone: "bg-emerald-100 text-emerald-600",
    dotTone: "bg-emerald-500",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Maya J.",
    role: "Senior Artist",
    status: "Busy",
    statusTone: "bg-rose-100 text-rose-500",
    dotTone: "bg-rose-500",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Sophie R.",
    role: "Nail Artist",
    status: "Available",
    statusTone: "bg-emerald-100 text-emerald-600",
    dotTone: "bg-emerald-500",
    initials: "SR",
    avatarTone: "from-violet-400 to-fuchsia-300",
  },
  {
    name: "Liam T.",
    role: "Receptionist",
    status: "Available",
    statusTone: "bg-emerald-100 text-emerald-600",
    dotTone: "bg-emerald-500",
    initials: "LT",
    avatarTone: "from-sky-400 to-blue-300",
  },
  {
    name: "Anna K.",
    role: "Nail Artist",
    status: "Off duty",
    statusTone: "bg-slate-100 text-slate-500",
    dotTone: "bg-slate-400",
    initials: "AK",
    avatarTone: "from-amber-400 to-orange-300",
  },
  {
    name: "James P.",
    role: "Nail Artist",
    status: "Busy",
    statusTone: "bg-rose-100 text-rose-500",
    dotTone: "bg-rose-500",
    initials: "JP",
    avatarTone: "from-pink-400 to-rose-300",
  },
  {
    name: "Emily W.",
    role: "Senior Artist",
    status: "Available",
    statusTone: "bg-emerald-100 text-emerald-600",
    dotTone: "bg-emerald-500",
    initials: "EW",
    avatarTone: "from-indigo-400 to-sky-300",
  },
];

export const MANAGER_QUEUE_OVERVIEW = [
  { label: "Waiting Customers", value: "5", tone: "bg-amber-50 text-amber-600 border-amber-100" },
  { label: "In-salon Sessions", value: "6", tone: "bg-rose-50 text-rose-500 border-rose-100" },
  { label: "Delayed Bookings", value: "2", tone: "bg-red-50 text-red-500 border-red-100" },
  { label: "No-shows", value: "1", tone: "bg-slate-50 text-slate-500 border-slate-200" },
];

export const MANAGER_SCHEDULE_FILTERS = ["All", "Waiting", "In Progress", "Completed"];

export const MANAGER_SCHEDULE_ROWS = [
  {
    id: "1",
    time: "09:00",
    customer: "Sarah Johnson",
    phone: "+1 (555) 123-4567",
    service: "Gel Manicure",
    artist: "Tina L.",
    status: "Completed",
    statusTone: "bg-emerald-100 text-emerald-600",
    action: "View",
  },
  {
    id: "2",
    time: "09:30",
    customer: "Emily Chen",
    phone: "+1 (555) 234-5678",
    service: "Acrylic Full Set",
    artist: "Maya J.",
    status: "In Progress",
    statusTone: "bg-rose-100 text-rose-500",
    action: "Done",
  },
  {
    id: "3",
    time: "10:00",
    customer: "Jessica Kim",
    phone: "+1 (555) 345-6789",
    service: "Pedicure Deluxe",
    artist: "Kevin B.",
    status: "Checked In",
    statusTone: "bg-sky-100 text-sky-600",
    action: "View",
  },
  {
    id: "4",
    time: "10:30",
    customer: "Maya Johnson",
    phone: "+1 (555) 456-7890",
    service: "Nail Art Design",
    artist: "Sophie R.",
    status: "Waiting",
    statusTone: "bg-amber-100 text-amber-600",
    action: "Check In",
  },
  {
    id: "5",
    time: "11:00",
    customer: "Lisa Nguyen",
    phone: "+1 (555) 567-8901",
    service: "Gel Polish",
    artist: "Tina L.",
    status: "Cancelled",
    statusTone: "bg-red-100 text-red-500",
    action: "View",
  },
];

export const MANAGER_QUICK_STATUS = [
  { label: "Salon Status", value: "Open", tone: "bg-emerald-100 text-emerald-600" },
  { label: "Current Capacity", value: "75% Full", tone: "bg-rose-100 text-rose-500" },
  { label: "Next Break", value: "12:30 PM", tone: "bg-amber-100 text-amber-600" },
  { label: "Closing Time", value: "8:30 PM", tone: "bg-slate-100 text-slate-600" },
];

export const MANAGER_URGENT_ISSUES = [
  {
    title: "Late Customer",
    detail: "Maya Johnson — 15m late for 10:30 AM",
    tone: "border-l-amber-400 bg-amber-50",
    iconTone: "text-amber-500",
  },
  {
    title: "Staff Absence",
    detail: "Kevin B. called in sick for afternoon shift",
    tone: "border-l-red-400 bg-red-50",
    iconTone: "text-red-500",
  },
  {
    title: "Customer Complaint",
    detail: "Product issue reported at station 3",
    tone: "border-l-rose-400 bg-rose-50",
    iconTone: "text-rose-500",
  },
];

export const MANAGER_REVIEWS = [
  {
    name: "Sarah M.",
    rating: 5,
    text: "Amazing service! Tina did a beautiful gel manicure.",
    time: "Today, 11:45 AM",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
  },
  {
    name: "Jennifer L.",
    rating: 5,
    text: "Love the nail art design! Will definitely come back.",
    time: "Today, 10:20 AM",
    initials: "JL",
    avatarTone: "from-pink-400 to-rose-300",
  },
  {
    name: "Amanda K.",
    rating: 4,
    text: "Great pedicure, very relaxing atmosphere.",
    time: "Yesterday, 4:30 PM",
    initials: "AK",
    avatarTone: "from-violet-400 to-fuchsia-300",
  },
  {
    name: "Rachel P.",
    rating: 5,
    text: "Best salon in town! Professional and friendly staff.",
    time: "Yesterday, 2:15 PM",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=80",
  },
];
