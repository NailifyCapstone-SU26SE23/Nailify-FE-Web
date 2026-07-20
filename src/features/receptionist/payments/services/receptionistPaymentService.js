import { axiosClient } from "../../../../lib/axiosClient";
function unwrapResponse(response, fallbackMessage) {
  const data = response?.data;
  if (!data?.isSucceeded) {
    throw new Error(data?.message || fallbackMessage);
  }
  return data.data;
}
export async function createPayment(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.post(`/payments/create/${normalizedBookingId}`);
  return unwrapResponse(response, "Failed to create payment.");
}

export async function refundPayment(bookingId, bankAccountInfo) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.post(`/payments/refund/${normalizedBookingId}`, bankAccountInfo);
  return unwrapResponse(response, "Failed to refund payment.");
}

export async function getPaymentStatus(orderCode) {
  if (orderCode === undefined || orderCode === null) {
    throw new Error("Order code is required.");
  }

  const response = await axiosClient.get(`/payments/status/${orderCode}`);
  return unwrapResponse(response, "Failed to fetch payment status.");
}

export async function cancelPayment(orderCode) {
  if (orderCode === undefined || orderCode === null) {
    throw new Error("Order code is required.");
  }

  const response = await axiosClient.post(`/payments/cancel/${orderCode}`);
  return unwrapResponse(response, "Failed to cancel payment.");
}
