import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { BookingStatusBadge } from "./BookingStatusBadge";

export function BookingTable({ bookings, getDetailRoute }) {
  return (
    <div className="hidden overflow-hidden rounded-[22px] border border-[#f4e4d7] md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#f4e4d7]">
          <thead className="bg-[#fff8f2]">
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#b38769]">
              <th className="px-5 py-4 font-semibold">Customer</th>
              <th className="px-5 py-4 font-semibold">Service</th>
              <th className="px-5 py-4 font-semibold">Branch</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Staff</th>
              <th className="px-5 py-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7ebdf] bg-white">
            {bookings.map((booking) => (
              <tr key={booking.id} className="align-top">
                <td className="px-5 py-4">
                  <p className="font-semibold text-[var(--color-ink)]">{booking.customerName}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{booking.customerPhone}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#d45b9f]">{booking.id}</p>
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-ink)]">{booking.service}</td>
                <td className="px-5 py-4 text-sm text-[var(--color-muted)]">{booking.branch}</td>
                <td className="px-5 py-4">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-muted)]">{booking.staffName}</td>
                <td className="px-5 py-4">
                  <Link
                    to={getDetailRoute(booking.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#fff5ef] px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[#ffe9d7]"
                  >
                    <span>Manage</span>
                    <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

BookingTable.propTypes = {
  bookings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      customerName: PropTypes.string.isRequired,
      customerPhone: PropTypes.string.isRequired,
      service: PropTypes.string.isRequired,
      branch: PropTypes.string.isRequired,
      staffName: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    }),
  ).isRequired,
  getDetailRoute: PropTypes.func.isRequired,
};
