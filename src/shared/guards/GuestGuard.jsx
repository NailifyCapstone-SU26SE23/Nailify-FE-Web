import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getDashboardRouteByRole } from "../../features/auth/utils/getDashboardRouteByRole";
import { PropTypes } from "../utils/propTypes";

export function GuestGuard({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={getDashboardRouteByRole(user?.role)} replace />;
  }

  return children;
}

GuestGuard.propTypes = {
  children: PropTypes.node.isRequired,
};
