import { CalendarClock, ShieldAlert } from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { BOOKING_STATUS_STYLES } from "../services/mockBookings";

export function BookingSnapshotCard({ formValues, notice }) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
      <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
        Booking snapshot
      </p>
      <div className="mt-5 rounded-[22px] bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#c84b91] shadow-[0_12px_24px_rgba(94,76,62,0.08)]">
            <CalendarClock size={20} />
          </div>
          <div>
            <p className="font-semibold text-[var(--color-ink)]">
              {formValues.customerName || "New booking"}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {formValues.service || "Service not set"}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${BOOKING_STATUS_STYLES[formValues.status]}`}
          >
            {formValues.status}
          </span>
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
            {formValues.paymentStatus}
          </span>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Schedule:</span> {formValues.bookingDate} at{" "}
          {formValues.bookingTime}
        </div>
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Branch:</span> {formValues.branch}
        </div>
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Assigned staff:</span> {formValues.staffName}
        </div>
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Total:</span> {formValues.total}
        </div>
      </div>
      <div className="mt-5 rounded-[22px] bg-[#fff0f5] p-5 text-sm leading-6 text-[#9b4b70]">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      </div>
    </article>
  );
}

BookingSnapshotCard.propTypes = {
  formValues: PropTypes.shape({
    bookingDate: PropTypes.string.isRequired,
    bookingTime: PropTypes.string.isRequired,
    branch: PropTypes.string.isRequired,
    customerName: PropTypes.string.isRequired,
    paymentStatus: PropTypes.string.isRequired,
    service: PropTypes.string.isRequired,
    staffName: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    total: PropTypes.string.isRequired,
  }).isRequired,
  notice: PropTypes.string.isRequired,
};
