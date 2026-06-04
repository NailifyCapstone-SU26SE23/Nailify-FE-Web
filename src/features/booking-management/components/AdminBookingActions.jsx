import { Save, Trash2 } from "lucide-react";
import { PropTypes } from "../../../shared/utils/propTypes";

export function AdminBookingActions({ onSave, onDelete }) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={onSave}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
      >
        <Save size={16} />
        <span>Save changes</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#f1d7c0] bg-[#fff7f2] px-5 py-3 text-sm font-semibold text-[#8c5d44] transition hover:bg-[#fff0e6] sm:w-auto"
      >
        <Trash2 size={16} />
        <span>Delete booking</span>
      </button>
    </div>
  );
}

AdminBookingActions.propTypes = {
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
