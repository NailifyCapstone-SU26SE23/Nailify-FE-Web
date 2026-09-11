import { PropTypes } from "../../utils/propTypes";
import { getCustomerNailStatusMeta } from "../../utils/customerNailStatus";

export function CustomerNailStatusBadge({
  status,
  language = "en",
  className = "",
  iconSize = 10,
}) {
  const { label, tone, Icon } = getCustomerNailStatusMeta(status, language);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${tone} ${className}`}>
      <Icon size={iconSize} />
      {label}
    </span>
  );
}

CustomerNailStatusBadge.propTypes = {
  status: PropTypes.string,
  language: PropTypes.string,
  className: PropTypes.string,
  iconSize: PropTypes.number,
};
