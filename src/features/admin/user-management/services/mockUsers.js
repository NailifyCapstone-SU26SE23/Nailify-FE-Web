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

const USER_ROW_DEFINITIONS = [];

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

export const USER_ROLE_OPTIONS = ["Admin", "Manager", "Receptionist", "Staff", "Customer"];

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

export const getMockUserById = (userId) => null;
