import { useMemo } from "react";
import { getBookingById } from "../services/bookingService";

export function useBookingDetail(bookingId) {
  return useMemo(() => getBookingById(bookingId), [bookingId]);
}
