import { useState } from "react";
import { PropTypes } from "../../utils/propTypes";

export function StaffAvatar({ staff, className, fallbackClassName = "" }) {
  const [hasImageError, setHasImageError] = useState(false);
  const avatarUrl = typeof staff.avatarUrl === "string" ? staff.avatarUrl.trim() : "";

  if (avatarUrl && !hasImageError) {
    return (
      <img
        crossOrigin="anonymous"
        src={avatarUrl}
        alt={staff.name}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return <div className={fallbackClassName}>{staff.initials}</div>;
}

StaffAvatar.propTypes = {
  className: PropTypes.string,
  fallbackClassName: PropTypes.string,
  staff: PropTypes.shape({
    avatarUrl: PropTypes.string,
    initials: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};
