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
