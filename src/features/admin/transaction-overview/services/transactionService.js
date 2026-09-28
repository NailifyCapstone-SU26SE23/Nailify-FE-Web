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

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

export async function fetchAdminTransactions({
  pageNumber = 1,
  pageSize = 10,
  startDate,
  endDate,
  status,
  salonId
} = {}) {
  const response = await axiosClient.get("/Transactions", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(status && { status }),
      ...(salonId && { salonId })
    },
  });

  const data = unwrapResponse(response, "Failed to load transactions.");
  
  const items = Array.isArray(data?.items) ? data.items : [];
  const metaData = data?.metaData ?? {};

  return {
    items,
    metaData: {
      currentPage: Number(metaData.currentPage || pageNumber || 1),
      totalPages: Number(metaData.totalPages || 1),
      pageSize: Number(metaData.pageSize || pageSize || 10),
      totalItems: Number(metaData.totalItems || items.length),
      hasPrevious: Boolean(metaData.hasPrevious),
      hasNext: Boolean(metaData.hasNext),
      firstRowOnPage: Number(metaData.firstRowOnPage || (items.length ? 1 : 0)),
      lastRowOnPage: Number(metaData.lastRowOnPage || items.length),
    },
  };
}

export async function fetchAdminTransactionById(id) {
  if (!id) {
    throw new Error("Transaction ID is required.");
  }

  try {
    const response = await axiosClient.get(`/Transactions/${id}`, {
      headers: getAuthHeaders(),
    });

    const data = unwrapResponse(response, "Failed to load transaction details.");
    return data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const payload = error.response?.data;
      throw new Error(payload?.message || "Transaction not found.");
    }

    throw error;
  }
}
