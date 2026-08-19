import { useDispatch, useSelector } from "react-redux";
import { login, loginGoogle, logout } from "../model/authSlice";
import {
  selectAuthError,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAuthenticated,
} from "../model/selectors";

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  return {
    user,
    role: user?.role ?? null,
    isAuthenticated,
    status,
    error,
    login: (credentials) => dispatch(login(credentials)),
    loginGoogle: (idToken) => dispatch(loginGoogle(idToken)),
    logout: () => dispatch(logout()),
  };
}
