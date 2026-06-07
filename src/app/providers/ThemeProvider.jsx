import { PropTypes } from "../../shared/utils/propTypes";

export function ThemeProvider({ children }) {
  return children;
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
