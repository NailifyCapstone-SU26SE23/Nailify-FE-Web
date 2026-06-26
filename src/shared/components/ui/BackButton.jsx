import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PropTypes } from "../../utils/propTypes";

export function BackButton({
  label = "Back",
  to = null,
  fallbackTo = null,
  className = "",
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (fallbackTo) {
      navigate(fallbackTo);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 rounded-full border border-[#f4c6da] bg-white/90 px-4 py-2 text-sm font-bold text-[#ea4f93] shadow-[0_10px_24px_rgba(236,72,153,0.08)] transition hover:bg-[#fff5fa] ${className}`}
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
}

BackButton.propTypes = {
  className: PropTypes.string,
  fallbackTo: PropTypes.string,
  label: PropTypes.string,
  to: PropTypes.string,
};
