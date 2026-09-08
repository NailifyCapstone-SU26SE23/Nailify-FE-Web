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
  { label: "Transfer Staff", icon: "arrow" },
];

export const STAFF_FILTER_TABS = ["All", "Active", "Inactive"];

export const STAFF_STATUS_STYLES = {
  Active: "bg-[#eaf9ee] text-[#2fa25f]",
  Inactive: "bg-[#fff0dd] text-[#db8520]",
};

export const SCHEDULE_STATUS_STYLES = {
  Active: "bg-[#eaf9ee] text-[#2fa25f]",
  Inactive: "bg-[#fff0dd] text-[#db8520]",
};

export const STAFF_ARTISTS = [];

export const TOP_PERFORMER = null;

export const STAFF_ON_LEAVE = [];

export const LOW_RATING_ALERTS = [];

export const WEEKLY_SCHEDULE = [];

export const SCHEDULE_DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const PERFORMANCE_OVERVIEW = [];

export const STAFF_ALERTS = [];

export const WORKLOAD_BALANCE = [];

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
  { value: "Senior Staff Artist", label: "Senior Staff Artist" },
  { value: "Nail Art Designer", label: "Nail Art Designer" },
  { value: "3D Art Specialist", label: "3D Art Specialist" },
  { value: "Gel & Acrylic Expert", label: "Gel & Acrylic Expert" },
  { value: "K-Beauty Specialist", label: "K-Beauty Specialist" },
  { value: "Junior Staff Artist", label: "Junior Staff Artist" },
  { value: "Staff Artist", label: "Staff Artist" },
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
  role: "Staff Artist",
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
  return {
    success: true,
    message: `Staff artist ${data.name} has been created successfully.`,
  };
};

export const submitMockStaffUpdate = async (id, data) => {
  return {
    success: true,
    message: `Staff artist ${data.name} has been updated successfully.`,
  };
};

export const getStaffById = (id) => {
  return null;
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
