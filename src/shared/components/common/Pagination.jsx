import { PropTypes } from "../../utils/propTypes";

export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <button
        type="button"
        onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
        className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
        disabled={currentPage <= 1}
      >
        Prev
      </button>
      <span>
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
        className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
        disabled={currentPage >= totalPages}
      >
        Next
      </button>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number,
  onPageChange: PropTypes.func,
  totalPages: PropTypes.number,
};
