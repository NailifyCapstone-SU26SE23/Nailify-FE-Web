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

export async function fetchSystemSummary() {
  const response = await axiosClient.get("/Wallets/system-summary", {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load system summary.");
}

export async function fetchWithdrawalRequests({ pageNumber = 1, pageSize = 10, status } = {}) {
  const response = await axiosClient.get("/Wallets/admin/withdrawals", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(status && { status }),
    },
  });

  const data = unwrapResponse(response, "Failed to load withdrawal requests.");
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchWithdrawalRequestDetail(requestId) {
  if (!requestId) {
    throw new Error("Withdrawal request ID is required.");
  }

  const response = await axiosClient.get(`/Wallets/withdrawals/${requestId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load withdrawal request detail.");
}

export async function approveWithdrawalRequest(requestId, payload) {
  if (!requestId) {
    throw new Error("Withdrawal request ID is required.");
  }

  const response = await axiosClient.post(
    `/Wallets/withdrawals/${requestId}/approve`,
    payload,
    {
      headers: getAuthHeaders(),
    }
  );

  return unwrapResponse(response, "Failed to approve withdrawal request.");
}

export async function rejectWithdrawalRequest(requestId, payload) {
  if (!requestId) {
    throw new Error("Withdrawal request ID is required.");
  }

  const response = await axiosClient.post(
    `/Wallets/withdrawals/${requestId}/reject`,
    payload,
    {
      headers: getAuthHeaders(),
    }
  );

  return unwrapResponse(response, "Failed to reject withdrawal request.");
}

export async function fetchWalletById(walletId) {
  if (!walletId) {
    throw new Error("Wallet ID is required.");
  }
  const response = await axiosClient.get(`/Wallets/getById/${walletId}`, {
    headers: getAuthHeaders(),
  });
  return unwrapResponse(response, "Failed to load wallet detail.");
}

export async function fetchCustomerById(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }
  const response = await axiosClient.get(`/Users/customers/${customerId}`, {
    headers: getAuthHeaders(),
  });
  return unwrapResponse(response, "Failed to load customer detail.");
}
