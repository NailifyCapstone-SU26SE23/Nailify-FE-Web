import { PropTypes } from "../../shared/utils/propTypes";

export function QueryProvider({ children }) {
  return children;
}

QueryProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
