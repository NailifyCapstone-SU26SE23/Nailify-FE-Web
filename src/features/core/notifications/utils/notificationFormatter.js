import { axiosClient } from "../../../../lib/axiosClient";

let bulkCache = null;

export async function getBulkSalonAndArtistData() {
  if (bulkCache) return bulkCache;
  const promise = (async () => {
    try {
      const [salonsRes, artistsRes] = await Promise.all([
        axiosClient.get("/Salons?PageNumber=1&PageSize=50&Status=Open"),
        axiosClient.get("/NailArtists?pageNumber=1&pageSize=100&status=Active"),
      ]);
      const salonsMap = {};
      const artistsMap = {};

      (salonsRes.data?.data?.items || []).forEach((s) => {
        salonsMap[s.salonId] = s.name;
      });

      (artistsRes.data?.data?.items || []).forEach((a) => {
        artistsMap[a.nailArtistId] = `${a.firstName || ""} ${a.lastName || ""}`.trim();
      });

      return { salonsMap, artistsMap };
    } catch (e) {
      console.error("Failed to load bulk salon/artist data for notifications", e);
      return { salonsMap: {}, artistsMap: {} };
    }
  })();
  bulkCache = promise;
  return promise;
}

export async function formatNotificationMessage(messageStr, isVi = true) {
  try {
    const data = JSON.parse(messageStr);
    if (data.salonId && data.artistId) {
      const { salonsMap, artistsMap } = await getBulkSalonAndArtistData();

      const salonName = salonsMap[data.salonId] || "Chi nhánh";
      const artistName = artistsMap[data.artistId] || "Thợ";

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
