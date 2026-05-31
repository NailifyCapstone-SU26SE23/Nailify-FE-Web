import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getDashboardRouteByRole } from "../../features/auth/utils/getDashboardRouteByRole";

export function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={getDashboardRouteByRole(user?.role)} replace />;
  }

  return children;
}
