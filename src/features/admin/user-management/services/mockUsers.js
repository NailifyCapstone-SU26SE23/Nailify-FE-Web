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

const createMockUser = (
  id,
  name,
  email,
  role,
  branch,
  status,
  lastActive,
  phone,
  joinedAt,
  notes,
) => ({
  id,
  name,
  email,
  role,
  branch,
  status,
  lastActive,
  phone,
  joinedAt,
  notes,
});

const USER_ROW_DEFINITIONS = [
  [
    "USR-1001",
    "Alicia Tran",
    "alicia.tran@nailify.com",
    "Admin",
    "Head Office",
    "Active",
    "5 min ago",
    "(+84) 901 200 321",
    "2025-02-14",
    "Owns platform configuration and chain-wide user permissions.",
  ],
  [
    "USR-1002",
    "Minh Nguyen",
    "minh.nguyen@nailify.com",
    "Manager",
    "District 1 Salon",
    "Active",
    "18 min ago",
    "(+84) 902 112 455",
    "2025-03-02",
    "Primary manager for premium booking flow and staffing approvals.",
  ],
  [
    "USR-1007",
    "Thao Bui",
    "thao.bui@nailify.com",
    "Receptionist",
    "District 1 Salon",
    "Active",
    "9 min ago",
    "(+84) 903 881 114",
    "2025-04-22",
    "Manages front desk check-ins, walk-in coordination, and customer reminders.",
  ],
  [
    "USR-1003",
    "Linh Pham",
    "linh.pham@nailify.com",
    "Staff",
    "District 7 Salon",
    "Inactive",
    "2 days ago",
    "(+84) 936 556 120",
    "2025-01-27",
    "Currently inactive pending branch reassignment.",
  ],
  [
    "USR-1004",
    "Quang Le",
    "quang.le@nailify.com",
    "Manager",
    "Thu Duc Salon",
    "Pending",
    "Invitation sent",
    "(+84) 934 320 877",
    "2025-05-19",
    "Invite created for new Thu Duc branch launch.",
  ],
  [
    "USR-1005",
    "Hanh Vo",
    "hanh.vo@nailify.com",
    "Staff",
    "District 3 Salon",
    "Active",
    "32 min ago",
    "(+84) 909 145 620",
    "2025-04-11",
    "Handles daily walk-in customers and service wrap-up.",
  ],
  [
    "USR-1006",
    "Bao Chau",
    "bao.chau@nailify.com",
    "Admin",
    "Head Office",
    "Suspended",
    "1 week ago",
    "(+84) 908 743 222",
    "2024-11-28",
    "Suspended during account access review.",
  ],
];

export const USER_ROWS = USER_ROW_DEFINITIONS.map((definition) =>
  createMockUser(...definition),
);

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

export const USER_ROLE_OPTIONS = ["Admin", "Manager", "Receptionist", "Staff"];

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
  role: "Receptionist",
  branch: USER_BRANCH_OPTIONS[0],
  status: "Pending",
  lastActive: "Not activated",
  phone: "",
  joinedAt: "2026-06-01",
  notes: "",
});

export const getMockUserById = (userId) =>
  USER_ROWS.find((user) => user.id === userId) ?? null;
