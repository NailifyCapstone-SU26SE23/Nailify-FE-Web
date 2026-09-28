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

export async function fetchAdminWalletTransactions({
  pageNumber = 1,
  pageSize = 10,
  type,
  status,
  fromDate,
  toDate,
} = {}) {
  const response = await axiosClient.get("/Wallets/admin/transactions", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(type && { type }),
      ...(status && { status }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
    },
  });

  const data = unwrapResponse(response, "Failed to load wallet transactions.");
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchAdminWalletTransactionDetail(id) {
  if (!id) {
    throw new Error("Wallet transaction ID is required.");
  }

  const response = await axiosClient.get(`/Wallets/transactions/${id}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load wallet transaction detail.");
}

export async function fetchAdminWalletById(walletId) {
  if (!walletId) {
    throw new Error("Wallet ID is required.");
  }

  const response = await axiosClient.get(`/Wallets/getById/${walletId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load wallet owner detail.");
}
