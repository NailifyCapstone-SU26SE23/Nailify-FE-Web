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

export async function fetchReceptionistCustomers({ pageNumber = 1, pageSize = 10, searchTerm = "" }) {

  const params = {
    pageNumber,
    pageSize,
    role: "Customer",

  };

  if (searchTerm && searchTerm.trim() !== "") {
    params.searchTerm = searchTerm.trim();
  }

  try {
    const response = await axiosClient.get("/Users", {
      params,
      headers: getAuthHeaders()
    });

    const payload = response.data;
    if (!payload?.isSucceeded) {
      throw new Error(payload?.message || "Failed to fetch customers.");
    }

    return payload.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
}

export async function fetchReceptionistCustomerDetail(id) {
  try {
    const response = await axiosClient.get(`/Users/${id}`, {
      headers: getAuthHeaders()
    });

    const payload = response.data;
    if (!payload?.isSucceeded) {
      throw new Error(payload?.message || "Failed to fetch customer detail.");
    }

    return payload.data;
  } catch (error) {
    console.error(`Error fetching customer detail (ID: ${id}):`, error);
    throw error;
  }
}

export async function updateReceptionistCustomer(id, data) {
  try {
    const response = await axiosClient.put(`/Users/${id}`, data, {
      headers: getAuthHeaders()
    });

    const payload = response.data;
    if (!payload?.isSucceeded) {
      throw new Error(payload?.message || "Failed to update customer.");
    }

    return payload.data;
  } catch (error) {
    console.error(`Error updating customer (ID: ${id}):`, error);
    throw error;
  }
}

export async function fetchCustomerBookings(salonId, searchKeyword) {
  try {
    if (!salonId) return [];
    const response = await axiosClient.get(`/Bookings/salon/${salonId}`, {
      headers: getAuthHeaders(),
      params: {
        pageNumber: 1,
        pageSize: 50,
        search: searchKeyword
      }
    });

    const payload = response.data;
    if (!payload?.isSucceeded) return [];

    const items = payload.data?.items || (Array.isArray(payload.data) ? payload.data : []);
    return items;
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    return [];
  }
}

