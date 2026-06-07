import { PropTypes } from "../../utils/propTypes";

export function Loading({ label = "Loading..." }) {
  return <div className="text-sm text-slate-500">{label}</div>;
}

Loading.propTypes = {
  label: PropTypes.string,
};
