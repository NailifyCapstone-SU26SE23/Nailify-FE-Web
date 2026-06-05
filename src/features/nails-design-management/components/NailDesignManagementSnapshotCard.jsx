import { Sparkles } from "lucide-react";
import { PropTypes } from "../../../shared/utils/propTypes";
import { NAIL_DESIGN_STATUS_STYLES } from "../services/mockNailDesigns";

export function NailDesignManagementSnapshotCard({ formValues, notice }) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
      <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
        Design snapshot
      </p>

      <div className="mt-5 rounded-[22px] bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-semibold text-[#c84b91] shadow-[0_12px_24px_rgba(94,76,62,0.08)]">
            {(formValues.name || "New Design")
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0] ?? "")
              .join("")}
          </div>
          <div>
            <p className="font-semibold text-[var(--color-ink)]">
              {formValues.name || "New nail design"}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {formValues.collection || "Collection not set"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${NAIL_DESIGN_STATUS_STYLES[formValues.status]}`}
          >
            {formValues.status}
          </span>
          <span className="inline-flex rounded-full bg-[#fff] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
            {formValues.category}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Price:</span>{" "}
          {formValues.price || "Not priced yet"}
        </div>
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Duration:</span> {formValues.duration}
        </div>
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Palette:</span>{" "}
          {formValues.palette || "Palette not set"}
        </div>
      </div>

      <div className="mt-5 rounded-[22px] bg-[#fff0f5] p-5 text-sm leading-6 text-[#9b4b70]">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      </div>
    </article>
  );
}

NailDesignManagementSnapshotCard.propTypes = {
  formValues: PropTypes.shape({
    category: PropTypes.string.isRequired,
    collection: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    palette: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  notice: PropTypes.string.isRequired,
};
