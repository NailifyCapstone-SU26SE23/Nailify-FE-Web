import { CalendarClock } from "lucide-react";
import { PropTypes } from "../../../shared/utils/propTypes";
import { BookingStatusBadge } from "./BookingStatusBadge";

export function BookingInfoCard({ booking }) {
  return (
    <article className="rounded-[24px] bg-white p-5 shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
      <div className="flex items-center gap-3 text-[var(--color-ink)]">
        <div className="rounded-2xl bg-[linear-gradient(180deg,#ffe3f0_0%,#fff2cf_100%)] p-3">
          <CalendarClock size={18} className="text-[#d45b9f]" />
        </div>
        <div>
          <p className="font-semibold">{booking.customerName}</p>
          <p className="text-sm text-[var(--color-muted)]">{booking.id}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-[var(--color-muted)]">
        <p><span className="font-semibold text-[var(--color-ink)]">Service:</span> {booking.service}</p>
        <p><span className="font-semibold text-[var(--color-ink)]">Branch:</span> {booking.branch}</p>
        <p><span className="font-semibold text-[var(--color-ink)]">Staff:</span> {booking.staffName}</p>
      </div>

      <div className="mt-4">
        <BookingStatusBadge status={booking.status} />
      </div>
    </article>
  );
}

BookingInfoCard.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.string.isRequired,
    customerName: PropTypes.string.isRequired,
    service: PropTypes.string.isRequired,
    branch: PropTypes.string.isRequired,
    staffName: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
};
