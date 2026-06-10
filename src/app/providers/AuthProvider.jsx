import { PropTypes } from "../../shared/utils/propTypes";

export function AuthProvider({ children }) {
  return children;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
