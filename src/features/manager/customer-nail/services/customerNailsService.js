
import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../../../core/auth/model/authStorage";

function getAuthHeaders() {
  const session = loadAuthSession();
  const token = session?.accessToken || session?.token;

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function unwrapResponse(response, fallbackMessage, isDetail = false) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  // Handle both formats: data.items (for lists) or just data (for single items)
  if (payload.data && payload.data.items) {
    return payload.data.items;
  }
  return payload.data;
}

export async function fetchCustomerNails() {
  try {
    console.log("Fetching customer nails...");
    
    const response = await axiosClient.get(`/CustomerNails`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load customer nails.");
  } catch (error) {
    console.error("Error fetching customer nails:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load customer nails.");
  }
}

export async function fetchCustomerNailById(customerNailId) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  console.log("Fetching customer nail by ID:", normalizedId);

  try {
    const response = await axiosClient.get(`/CustomerNails/${normalizedId}`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load customer nail detail.");
  } catch (error) {
    console.error("Error fetching customer nail detail:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load customer nail detail.");
  }
}

export async function approveCustomerNail(customerNailId) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  console.log("Approving customer nail:", normalizedId);

  try {
    const response = await axiosClient.post(`/CustomerNails/${normalizedId}/approve`, null, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to approve customer nail.");
  } catch (error) {
    console.error("Error approving customer nail:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to approve customer nail.");
  }
}

export async function rejectCustomerNail(customerNailId, rejectReason) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  console.log("Rejecting customer nail:", normalizedId, "with reason:", rejectReason);

  try {
    const response = await axiosClient.post(`/CustomerNails/${normalizedId}/reject`, { rejectReason }, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to reject customer nail.");
  } catch (error) {
    console.error("Error rejecting customer nail:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to reject customer nail.");
  }
}

export async function fetchSalonStaff(salonId) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  console.log("Fetching salon staff with salonId:", normalizedId);

  try {
    const response = await axiosClient.get(`/Users/salon/${normalizedId}/staff`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load salon staff.");
  } catch (error) {
    console.error("Error fetching salon staff:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load salon staff.");
  }
}

export async function assignReviewer(customerNailId, staffId) {
  const normalizedId = String(customerNailId || "").trim();
  const normalizedStaffId = String(staffId || "").trim();

  if (!normalizedId || !normalizedStaffId) {
    throw new Error("Customer Nail ID and Staff ID are required.");
  }

  console.log("Assigning reviewer for customer nail:", normalizedId, "with staffId:", normalizedStaffId);

  try {
    const response = await axiosClient.post(`/CustomerNails/${normalizedId}/assign-reviewer`, { staffArtistId: normalizedStaffId }, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to assign reviewer.");
  } catch (error) {
    console.error("Error assigning reviewer:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to assign reviewer.");
  }
}

export async function managerApproveQuote(customerNailId, finalPrice, finalDuration) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  console.log("Approving quote for customer nail:", normalizedId);

  try {
    const response = await axiosClient.post(`/CustomerNails/${normalizedId}/manager-approve-quote`, { finalPrice, finalDuration }, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to approve quote.");
  } catch (error) {
    console.error("Error approving quote:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to approve quote.");
  }
}

export async function managerReject(customerNailId, reason) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  console.log("Rejecting customer nail (manager):", normalizedId, "with reason:", reason);

  try {
    const response = await axiosClient.post(`/CustomerNails/${normalizedId}/manager-reject`, { reason }, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to reject customer nail.");
  } catch (error) {
    console.error("Error rejecting customer nail (manager):", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to reject customer nail.");
  }
}
