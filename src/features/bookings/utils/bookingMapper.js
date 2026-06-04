import { ROLES } from "../../../shared/constants/roles";

export function getBookingRoleFromPath(pathname) {
  if (pathname.startsWith("/admin")) {
    return ROLES.admin;
  }

  if (pathname.startsWith("/manager")) {
    return ROLES.manager;
  }

  if (pathname.startsWith("/receptionist")) {
    return ROLES.receptionist;
  }

  return ROLES.staff;
}

export function mapRoleToBookingScope(role) {
  return role === ROLES.receptionist ? ROLES.staff : role;
}
