export async function formatNotificationMessage(messageStr, isVi = true) {
  try {
    const data = JSON.parse(messageStr);
    if (data.salonId && data.artistId) {
      const salonName = data.salonName || "Chi nhánh";
      const artistName = data.artistName || "Thợ";

      let actionText = data.action === "Held" ? (isVi ? "đã được giữ" : "has been held") :
        data.action === "Released" ? (isVi ? "đã được trả lại" : "has been released") :
          data.action === "Booked" ? (isVi ? "đã đặt lịch hẹn" : "has been booked") :
            data.action;

      return isVi
        ? `Lịch hẹn ngày ${data.bookingDate} lúc ${data.startTime} tại ${salonName} cho thợ ${artistName} ${actionText}.`
        : `Booking on ${data.bookingDate} at ${data.startTime} at ${salonName} for artist ${artistName} ${actionText}.`;
    }
    return messageStr;
  } catch (e) {
    // If it's not JSON or parsing fails, return original message
    return messageStr;
  }
}
