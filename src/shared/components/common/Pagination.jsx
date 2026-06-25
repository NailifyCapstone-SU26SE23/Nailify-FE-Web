import { PropTypes } from "../../utils/propTypes";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  console.log("Pagination props:", { currentPage, totalPages, onPageChange });
  return (
    <div className="flex items-center gap-3 text-xs text-[#7f6478]">
      <button
        type="button"
        onClick={(e) => {
          console.log("Prev button clicked!");
          onPageChange?.(Math.max(1, currentPage - 1));
        }}
        className="inline-flex items-center gap-1 rounded-full border border-[#f4c1d8] bg-white px-3 py-1.5 font-bold text-[#ea4f93] transition hover:bg-[#fff7fb] disabled:opacity-50"
        disabled={currentPage <= 1}
      >
        <ChevronLeft size={12} />
        Prev
      </button>
      <span className="font-bold text-[#402542]">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={(e) => {
          console.log("Next button clicked!");
          onPageChange?.(Math.min(totalPages, currentPage + 1));
        }}
        className="inline-flex items-center gap-1 rounded-full border border-[#f4c1d8] bg-white px-3 py-1.5 font-bold text-[#ea4f93] transition hover:bg-[#fff7fb] disabled:opacity-50"
        disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight size={12} />
      </button>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number,
  onPageChange: PropTypes.func,
  totalPages: PropTypes.number,
};
