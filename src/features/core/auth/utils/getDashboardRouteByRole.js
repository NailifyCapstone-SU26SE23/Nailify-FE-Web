import { ROUTES } from "../../../../shared/constants/routes";
import { ROLES } from "../../../../shared/constants/roles";

export function getDashboardRouteByRole(role) {
  switch (role) {
    case ROLES.staff:
      return ROUTES.staffDashboard;
    case ROLES.receptionist:
      return ROUTES.receptionistDashboard;
    case ROLES.manager:
      return ROUTES.managerDashboard;
    case ROLES.admin:
      return ROUTES.adminDashboard;
    default:
      return ROUTES.login;
  }
}
