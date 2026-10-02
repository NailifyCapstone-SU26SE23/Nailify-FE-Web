
const fs = require("fs");
const file = "src/features/manager/bookings/services/bookingProceduresService.js";
let content = fs.readFileSync(file, "utf8");

content += `
/**
 * L?y danh sách các bu?c quy trình th?c t? c?a m?t m?c d?t l?ch (BookingItem)
 */
export async function fetchBookingProceduresByBookingItemId(bookingItemId) {
  try {
    const response = await axiosClient.get(\`/BookingProcedures/booking-item/\${bookingItemId}\`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to fetch booking procedures.");
  } catch (error) {
    console.error("Error fetching booking procedures:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch booking procedures.");
  }
}
`;

fs.writeFileSync(file, content);
console.log("Appended fetchBookingProceduresByBookingItemId");

