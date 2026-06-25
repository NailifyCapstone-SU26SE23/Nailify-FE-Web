import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/core/auth/hooks/useAuth";
import { ROUTES } from "../constants/routes";
import { PropTypes } from "../utils/propTypes";

export function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return children;
}

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired,
};
