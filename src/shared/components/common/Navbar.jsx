import { PropTypes } from "../../utils/propTypes";

export function Navbar({ children = null, className = "" }) {
  return <nav className={className}>{children}</nav>;
}

Navbar.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
