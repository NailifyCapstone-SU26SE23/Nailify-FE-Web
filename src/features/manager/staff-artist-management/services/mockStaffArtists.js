export const STAFF_SUMMARY_STATS = [
  {
    label: "Total Staff",
    value: "18",
    icon: "users",
    iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
  },
  {
    label: "Available Today",
    value: "12",
    icon: "check",
    iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
  },
  {
    label: "Average Rating",
    value: "4.8",
    icon: "star",
    iconClassName: "bg-[#fff8e1] text-[#f59e0b]",
  },
  {
    label: "Completed Services",
    value: "1,240",
    icon: "clipboard",
    iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
  },
];

export const STAFF_MINI_STATS = [
  { label: "Total Staff", value: "18" },
  { label: "Available Today", value: "12" },
  { label: "Average Rating", value: "4.8" },
  { label: "Completed Services", value: "1,240" },
  { label: "Staff On Leave", value: "3" },
];

export const QUICK_ACTIONS = [
  { label: "Edit Schedule", icon: "calendar" },
  { label: "Assign Skill", icon: "award" },
  { label: "View Performance", icon: "chart" },
  { label: "Transfer Staff", icon: "arrow" },
];

export const STAFF_FILTER_TABS = ["All", "Available", "Busy", "On Break", "On Leave"];

export const STAFF_STATUS_STYLES = {
  Available: "bg-[#eaf9ee] text-[#2fa25f]",
  Busy: "bg-[#fff0dd] text-[#db8520]",
  "On Break": "bg-[#e7ecff] text-[#4755b8]",
  "On Leave": "bg-[#ffe6ec] text-[#e1447f]",
};

export const SCHEDULE_STATUS_STYLES = {
  Active: "bg-[#eaf9ee] text-[#2fa25f]",
  Busy: "bg-[#fff0dd] text-[#db8520]",
  Break: "bg-[#e7ecff] text-[#4755b8]",
  "On Leave": "bg-[#ffe6ec] text-[#e1447f]",
};

export const STAFF_ARTISTS = [
  {
    id: "staff-01",
    name: "Mia Chen",
    role: "Senior Nail Artist",
    rating: 5.0,
    status: "Available",
    skills: ["Gel Nail", "Nail Art", "K-Beauty"],
    stats: { today: 8, month: 142, revenue: "$3,240" },
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
  },
  {
    id: "staff-02",
    name: "Luna Park",
    role: "3D Art Specialist",
    rating: 4.9,
    status: "Busy",
    skills: ["3D Art", "Chrome", "Gel Nail"],
    stats: { today: 6, month: 128, revenue: "$2,980" },
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
  },
  {
    id: "staff-03",
    name: "Aria Nguyen",
    role: "Nail Art Designer",
    rating: 4.8,
    status: "Available",
    skills: ["Ombre", "French Tips", "Nail Art"],
    stats: { today: 7, month: 119, revenue: "$2,760" },
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
  },
  {
    id: "staff-04",
    name: "Chloe Davis",
    role: "Gel & Acrylic Expert",
    rating: 4.7,
    status: "On Break",
    skills: ["Acrylic Set", "Gel Polish", "Builder Gel"],
    stats: { today: 5, month: 104, revenue: "$2,410" },
    avatarTone: "from-[#ffe0b2] to-[#ff9800]",
  },
  {
    id: "staff-05",
    name: "Sora Kim",
    role: "K-Beauty Specialist",
    rating: 4.8,
    status: "Available",
    skills: ["K-Beauty", "Gel Nail", "Spa Care"],
    stats: { today: 6, month: 98, revenue: "$2,180" },
    avatarTone: "from-[#ffd0e2] to-[#f04f91]",
  },
  {
    id: "staff-06",
    name: "Mel Santos",
    role: "Junior Nail Artist",
    rating: 4.6,
    status: "Busy",
    skills: ["Gel Manicure", "French Tips"],
    stats: { today: 4, month: 86, revenue: "$1,920" },
    avatarTone: "from-[#c4b5fd] to-[#7c3aed]",
  },
  {
    id: "staff-07",
    name: "Jess Tan",
    role: "Nail Artist",
    rating: 4.5,
    status: "On Leave",
    skills: ["Gel Nail", "Pedicure"],
    stats: { today: 0, month: 72, revenue: "$1,640" },
    avatarTone: "from-[#fecdd3] to-[#f43f5e]",
  },
  {
    id: "staff-08",
    name: "Priya Sharma",
    role: "Senior Nail Artist",
    rating: 4.9,
    status: "Available",
    skills: ["Nail Art", "Chrome", "Rhinestone"],
    stats: { today: 7, month: 135, revenue: "$3,080" },
    avatarTone: "from-[#a7f3d0] to-[#059669]",
  },
  {
    id: "staff-09",
    name: "Hana Yoo",
    role: "Nail Artist",
    rating: 4.4,
    status: "On Leave",
    skills: ["Gel Nail", "Matte Finish"],
    stats: { today: 0, month: 64, revenue: "$1,420" },
    avatarTone: "from-[#fde68a] to-[#d97706]",
  },
];

export const TOP_PERFORMER = {
  name: "Mia Chen",
  role: "Senior Nail Artist",
  badge: "Top Artist of the Month",
  stats: { bookings: "142", rating: "5.0", revenue: "$3.2k" },
  avatarTone: "from-[#ffc5de] via-[#ea4f93] to-[#8b5cf6]",
};

export const STAFF_ON_LEAVE = [
  {
    name: "Hana Yoo",
    dates: "Jun 10 – Jun 17",
    days: "7d",
    avatarTone: "from-[#fde68a] to-[#d97706]",
  },
  {
    name: "Jess Tan",
    dates: "Jun 12 – Jun 15",
    days: "3d",
    avatarTone: "from-[#fecdd3] to-[#f43f5e]",
  },
  {
    name: "Yuki Matsuda",
    dates: "Jun 14 – Jun 20",
    days: "6d",
    avatarTone: "from-[#bfdbfe] to-[#3b82f6]",
  },
];

export const LOW_RATING_ALERTS = [
  {
    name: "Tom Reed",
    rating: "3.8",
    message: "Below threshold — schedule coaching session",
    tone: "text-[#e1447f]",
  },
  {
    name: "Anna Tran",
    rating: "4.0",
    message: "Needs improvement on customer feedback",
    tone: "text-[#db8520]",
  },
];

export const WEEKLY_SCHEDULE = [
  {
    name: "Mia Chen",
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
    days: {
      Mon: "9-6pm",
      Tue: "9-6pm",
      Wed: "9-6pm",
      Thu: "9-6pm",
      Fri: "9-6pm",
      Sat: "10-4pm",
      Sun: "Off",
    },
    break: "12:00 PM",
    status: "Active",
  },
  {
    name: "Luna Park",
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
    days: {
      Mon: "10-7pm",
      Tue: "10-7pm",
      Wed: "Off",
      Thu: "10-7pm",
      Fri: "10-7pm",
      Sat: "9-5pm",
      Sun: "Off",
    },
    break: "1:00 PM",
    status: "Busy",
  },
  {
    name: "Aria Nguyen",
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
    days: {
      Mon: "9-5pm",
      Tue: "9-5pm",
      Wed: "9-5pm",
      Thu: "Off",
      Fri: "9-5pm",
      Sat: "10-3pm",
      Sun: "Off",
    },
    break: "12:30 PM",
    status: "Active",
  },
  {
    name: "Chloe Davis",
    avatarTone: "from-[#ffe0b2] to-[#ff9800]",
    days: {
      Mon: "11-8pm",
      Tue: "11-8pm",
      Wed: "11-8pm",
      Thu: "11-8pm",
      Fri: "Off",
      Sat: "10-6pm",
      Sun: "Off",
    },
    break: "2:00 PM",
    status: "Break",
  },
  {
    name: "Sora Kim",
    avatarTone: "from-[#ffd0e2] to-[#f04f91]",
    days: {
      Mon: "Off",
      Tue: "10-3pm",
      Wed: "10-3pm",
      Thu: "10-3pm",
      Fri: "10-3pm",
      Sat: "9-4pm",
      Sun: "Off",
    },
    break: "12:00 PM",
    status: "Active",
  },
  {
    name: "Hana Yoo",
    avatarTone: "from-[#fde68a] to-[#d97706]",
    days: {
      Mon: "Off",
      Tue: "Off",
      Wed: "Off",
      Thu: "Off",
      Fri: "Off",
      Sat: "Off",
      Sun: "Off",
    },
    break: "—",
    status: "On Leave",
  },
];

export const SCHEDULE_DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const PERFORMANCE_OVERVIEW = [
  {
    name: "Mia Chen",
    role: "Senior Nail Artist",
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
    metrics: {
      completed: "142",
      rating: "5.0",
      revenue: "$3,240",
      satisfaction: "98%",
    },
    testimonial:
      "Mia is absolutely amazing! Her attention to detail and creative designs always exceed my expectations.",
    client: "Sarah Chen",
  },
  {
    name: "Luna Park",
    role: "3D Art Specialist",
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
    metrics: {
      completed: "128",
      rating: "4.9",
      revenue: "$2,980",
      satisfaction: "96%",
    },
    testimonial:
      "Luna created the most beautiful 3D floral design I've ever seen. Highly recommend!",
    client: "Emily Wong",
  },
  {
    name: "Priya Sharma",
    role: "Senior Nail Artist",
    avatarTone: "from-[#a7f3d0] to-[#059669]",
    metrics: {
      completed: "135",
      rating: "4.9",
      revenue: "$3,080",
      satisfaction: "97%",
    },
    testimonial:
      "Priya's chrome finish work is flawless. Fast, professional, and so talented.",
    client: "Grace Teo",
  },
];

export const STAFF_ALERTS = [
  {
    name: "Tom Reed",
    rating: "3.8",
    message: "Below threshold",
    tone: "bg-[#ffe6ec] text-[#e1447f]",
  },
  {
    name: "Anna Tran",
    rating: "4.0",
    message: "Needs improvement",
    tone: "bg-[#fff0dd] text-[#db8520]",
  },
  {
    name: "Mel Santos",
    rating: "4.6",
    message: "Monitor closely",
    tone: "bg-[#fff8e1] text-[#ca8a04]",
  },
];

export const WORKLOAD_BALANCE = [
  { name: "Mia Chen", percent: 95, avatarTone: "from-[#ffc5de] to-[#ea4f93]" },
  { name: "Luna Park", percent: 88, avatarTone: "from-[#d8c4ff] to-[#8b5cf6]" },
  { name: "Aria Nguyen", percent: 76, avatarTone: "from-[#b8f0d8] to-[#2fc5a9]" },
  { name: "Chloe Davis", percent: 62, avatarTone: "from-[#ffe0b2] to-[#ff9800]" },
  { name: "Sora Kim", percent: 54, avatarTone: "from-[#ffd0e2] to-[#f04f91]" },
];

export const STAFF_SPECIALTIES = [
  "Gel Nail",
  "Nail Art",
  "K-Beauty",
  "3D Art",
  "Chrome",
  "Ombre",
  "French Tips",
  "Acrylic Set",
  "Gel Polish",
  "Builder Gel",
  "Spa Care",
  "Pedicure",
  "Matte Finish",
  "Rhinestone",
];

export const STAFF_ROLE_OPTIONS = [
  { value: "Senior Nail Artist", label: "Senior Nail Artist" },
  { value: "Nail Art Designer", label: "Nail Art Designer" },
  { value: "3D Art Specialist", label: "3D Art Specialist" },
  { value: "Gel & Acrylic Expert", label: "Gel & Acrylic Expert" },
  { value: "K-Beauty Specialist", label: "K-Beauty Specialist" },
  { value: "Junior Nail Artist", label: "Junior Nail Artist" },
  { value: "Nail Artist", label: "Nail Artist" },
];

export const STAFF_FORM_MODAL_STYLES = {
  content: {
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 25px 50px -12px rgba(226, 93, 143, 0.15)",
  },
  mask: {
    backdropFilter: "blur(4px)",
    backgroundColor: "rgba(63, 34, 64, 0.2)",
  },
};

export const createEmptyStaffForm = () => ({
  name: "",
  role: "Nail Artist",
  email: "",
  phone: "",
  status: "Available",
  skills: [],
  schedule: SCHEDULE_DAY_KEYS.reduce((acc, day) => {
    acc[day] = { shift: "09:00 - 18:00", status: "Active" };
    return acc;
  }, {}),
});

export const submitMockStaffCreate = async (data) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    success: true,
    message: `Staff artist ${data.name} has been created successfully.`,
  };
};

export const submitMockStaffUpdate = async (id, data) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    success: true,
    message: `Staff artist ${data.name} has been updated successfully.`,
  };
};

export const getStaffById = (id) => {
  return STAFF_ARTISTS.find((staff) => staff.id === id);
};

export const getStaffInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const filterStaffByStatus = (staffList, status) => {
  if (status === "All") return staffList;
  return staffList.filter((staff) => staff.status === status);
};
