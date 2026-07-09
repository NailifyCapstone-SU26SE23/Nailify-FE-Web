import { useMemo } from "react";
import { getBookings } from "../services/bookingService";

export function useBookings({ query = "", statusFilter = "All", matcher } = {}) {
  const bookings = getBookings();

  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          booking.id,
          booking.customerName,
          booking.customerPhone,
          booking.branch,
          booking.service,
          booking.staffName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesScope = matcher ? matcher(booking) : true;

      return matchesStatus && matchesQuery && matchesScope;
    });
  }, [bookings, matcher, query, statusFilter]);
}
