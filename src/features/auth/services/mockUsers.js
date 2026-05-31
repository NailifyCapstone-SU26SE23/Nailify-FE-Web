import { ROLES } from "../../../shared/constants/roles";

export const mockUsers = [
  {
    id: "staff-001",
    email: "staff@nailify.com",
    password: "Staff@123",
    fullName: "Salon Staff",
    role: ROLES.staff,
  },
  {
    id: "manager-001",
    email: "manager@nailify.com",
    password: "Manager@123",
    fullName: "Salon Manager",
    role: ROLES.manager,
  },
  {
    id: "admin-001",
    email: "admin@nailify.com",
    password: "Admin@123",
    fullName: "System Admin",
    role: ROLES.admin,
  },
];
