import { PropTypes } from "../../../../shared/utils/propTypes";
import { BOOKING_STATUS_STYLES } from "../services/bookingService";

export function BookingStatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${BOOKING_STATUS_STYLES[status]} ${className}`.trim()}
    >
      {status}
    </span>
  );
}

BookingStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
};
