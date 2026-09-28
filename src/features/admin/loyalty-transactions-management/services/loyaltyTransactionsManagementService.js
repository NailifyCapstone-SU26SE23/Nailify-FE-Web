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

function normalizeMetaData(metaData, defaults) {
  return {
    currentPage: Number(metaData?.currentPage || defaults.pageNumber || 1),
    totalPages: Number(metaData?.totalPages || 1),
    pageSize: Number(metaData?.pageSize || defaults.pageSize || 10),
    totalItems: Number(metaData?.totalItems || 0),
    hasPrevious: Boolean(metaData?.hasPrevious),
    hasNext: Boolean(metaData?.hasNext),
    firstRowOnPage: Number(metaData?.firstRowOnPage || 0),
    lastRowOnPage: Number(metaData?.lastRowOnPage || 0),
  };
}

export async function fetchLoyaltyTransactions({ pageNumber = 1, pageSize = 10 } = {}) {
  const response = await axiosClient.get("/LoyaltyTransactions", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
    },
  });

  const data = unwrapResponse(response, "Failed to load loyalty transactions.");
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchLoyaltyTransactionDetail(id) {
  const normalizedId = Number(id || 0);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Transaction ID is required.");
  }

  const response = await axiosClient.get(`/LoyaltyTransactions/${normalizedId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load loyalty transaction detail.");
}

export async function fetchCustomerDetail(id) {
  if (!id) {
    throw new Error("Customer ID is required.");
  }

  const response = await axiosClient.get(`/Users/customers/${id}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load customer detail.");
}

export async function fetchCustomers({ pageNumber = 1, pageSize = 1000, searchTerm = "" } = {}) {
  const response = await axiosClient.get("/Users/customers", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      searchTerm
    }
  });

  const data = unwrapResponse(response, "Failed to load customers.");
  return data?.items || [];
}

