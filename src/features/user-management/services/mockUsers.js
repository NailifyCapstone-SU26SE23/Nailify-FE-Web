export const USER_SUMMARY = [
  {
    label: "Total users",
    value: "128",
    description: "active accounts across all internal roles",
  },
  {
    label: "Pending invites",
    value: "12",
    description: "new users waiting for onboarding approval",
  },
  {
    label: "Admins",
    value: "6",
    description: "platform-level operators with full access",
  },
];

export const USER_ROWS = [
  {
    id: "USR-1001",
    name: "Alicia Tran",
    email: "alicia.tran@nailify.com",
    role: "Admin",
    branch: "Head Office",
    status: "Active",
    lastActive: "5 min ago",
    phone: "(+84) 901 200 321",
    joinedAt: "2025-02-14",
    notes: "Owns platform configuration and chain-wide user permissions.",
  },
  {
    id: "USR-1002",
    name: "Minh Nguyen",
    email: "minh.nguyen@nailify.com",
    role: "Manager",
    branch: "District 1 Salon",
    status: "Active",
    lastActive: "18 min ago",
    phone: "(+84) 902 112 455",
    joinedAt: "2025-03-02",
    notes: "Primary manager for premium booking flow and staffing approvals.",
  },
  {
    id: "USR-1003",
    name: "Linh Pham",
    email: "linh.pham@nailify.com",
    role: "Staff",
    branch: "District 7 Salon",
    status: "Inactive",
    lastActive: "2 days ago",
    phone: "(+84) 936 556 120",
    joinedAt: "2025-01-27",
    notes: "Currently inactive pending branch reassignment.",
  },
  {
    id: "USR-1004",
    name: "Quang Le",
    email: "quang.le@nailify.com",
    role: "Manager",
    branch: "Thu Duc Salon",
    status: "Pending",
    lastActive: "Invitation sent",
    phone: "(+84) 934 320 877",
    joinedAt: "2025-05-19",
    notes: "Invite created for new Thu Duc branch launch.",
  },
  {
    id: "USR-1005",
    name: "Hanh Vo",
    email: "hanh.vo@nailify.com",
    role: "Staff",
    branch: "District 3 Salon",
    status: "Active",
    lastActive: "32 min ago",
    phone: "(+84) 909 145 620",
    joinedAt: "2025-04-11",
    notes: "Handles daily walk-in customers and service wrap-up.",
  },
  {
    id: "USR-1006",
    name: "Bao Chau",
    email: "bao.chau@nailify.com",
    role: "Admin",
    branch: "Head Office",
    status: "Suspended",
    lastActive: "1 week ago",
    phone: "(+84) 908 743 222",
    joinedAt: "2024-11-28",
    notes: "Suspended during account access review.",
  },
];

export const USER_STATUS_FILTERS = [
  "All",
  "Active",
  "Pending",
  "Inactive",
  "Suspended",
];

export const USER_STATUS_STYLES = {
  Active: "bg-[#edfdf4] text-[#16975f]",
  Pending: "bg-[#fff7e7] text-[#cc8a16]",
  Inactive: "bg-[#f4f1ff] text-[#7157d9]",
  Suspended: "bg-[#fff0f5] text-[#d14c84]",
};

export const USER_ROLE_OPTIONS = ["Admin", "Manager", "Staff"];

export const USER_BRANCH_OPTIONS = [
  "Head Office",
  "District 1 Salon",
  "District 3 Salon",
  "District 7 Salon",
  "Thu Duc Salon",
];

export const createEmptyUser = () => ({
  id: "USR-NEW",
  name: "",
  email: "",
  role: "Staff",
  branch: USER_BRANCH_OPTIONS[0],
  status: "Pending",
  lastActive: "Not activated",
  phone: "",
  joinedAt: "2026-06-01",
  notes: "",
});

export const getMockUserById = (userId) =>
  USER_ROWS.find((user) => user.id === userId) ?? null;
