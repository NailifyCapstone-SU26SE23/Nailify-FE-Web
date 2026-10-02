import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/core/auth/hooks/useAuth";
import { ROUTES } from "../constants/routes";
import { PropTypes } from "../utils/propTypes";
import { ROLES } from "../constants/roles";

export function AuthGuard({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  const isInternalRole = Object.values(ROLES).includes(user?.role?.toLowerCase());
  if (!isInternalRole) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return children;
}

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired,
};
