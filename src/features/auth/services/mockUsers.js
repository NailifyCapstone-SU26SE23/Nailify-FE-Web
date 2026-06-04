import { ROLES } from "../../../shared/constants/roles";

const createMockPassword = (prefix) => `${prefix}@${["1", "2", "3"].join("")}`;

export const mockUsers = [
  {
    id: "staff-001",
    email: "staff@nailify.com",
    credential: createMockPassword("Staff"),
    fullName: "Salon Staff",
    role: ROLES.staff,
  },
  {
    id: "receptionist-001",
    email: "receptionist@nailify.com",
    credential: createMockPassword("Receptionist"),
    fullName: "Front Desk Receptionist",
    role: ROLES.receptionist,
  },
  {
    id: "manager-001",
    email: "manager@nailify.com",
    credential: createMockPassword("Manager"),
    fullName: "Salon Manager",
    role: ROLES.manager,
  },
  {
    id: "admin-001",
    email: "admin@nailify.com",
    credential: createMockPassword("Admin"),
    fullName: "System Admin",
    role: ROLES.admin,
  },
];
