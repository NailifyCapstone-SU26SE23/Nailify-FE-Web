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

export function getManagerSalonId() {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId;

  if (!salonId) {
    throw new Error("Salon ID is not available in the current account profile.");
  }

  return salonId;
}

function unwrapResponse(response, fallbackMessage) {
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

function unwrapResponseData(response, fallbackMessage) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

function extractItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizeMetaData(metaData, defaults = {}) {
  const pageSize = Number(metaData?.pageSize ?? defaults.pageSize ?? 10) || 10;
  const totalItems = Number(metaData?.totalItems ?? metaData?.totalCount ?? 0) || 0;
  const currentPage = Number(metaData?.currentPage ?? defaults.pageNumber ?? 1) || 1;
  const inferredTotalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  const totalPages = Number(metaData?.totalPages ?? inferredTotalPages) || inferredTotalPages;

  return {
    currentPage,
    totalPages: Math.max(1, totalPages),
    pageSize,
    totalItems,
    hasPrevious: Boolean(metaData?.hasPrevious ?? currentPage > 1),
    hasNext: Boolean(metaData?.hasNext ?? currentPage < Math.max(1, totalPages)),
    firstRowOnPage: Number(metaData?.firstRowOnPage ?? (totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0)) || 0,
    lastRowOnPage: Number(metaData?.lastRowOnPage ?? Math.min(totalItems, currentPage * pageSize)) || 0,
  };
}

function buildCustomerNailRequestParams(params) {
  const normalizedParams = {};

  if (params.pageNumber !== undefined) {
    normalizedParams.pageNumber = params.pageNumber;
  }

  if (params.pageSize !== undefined) {
    normalizedParams.pageSize = params.pageSize;
  }

  if (params.salonId) {
    normalizedParams.salonId = params.salonId;
  }

  if (params.approvedArtistId) {
    normalizedParams.approvedArtistId = params.approvedArtistId;
  }

  if (params.status) {
    normalizedParams.status = params.status;
  }

  return normalizedParams;
}

export function normalizeCustomerNail(item, rawNailsList = []) {
  if (!item) return null;

  // If this is a CustomerNailRequest object:
  if (item.customerNailRequestId || item.customerNail) {
    const nail = item.customerNail || {};

    // Find matching raw nail from the list to get shape/surface/components details
    const matchedRawNail = rawNailsList.find(rn => rn.customerNailId === item.customerNailId) || {};
    const requestPrice = item.price ?? null;
    const requestDuration = item.duration ?? null;
    const systemPrice = nail.price ?? matchedRawNail.price ?? 0;
    const systemDuration = nail.duration ?? matchedRawNail.duration ?? 0;

    return {
      customerNailRequestId: item.customerNailRequestId || item.id,
      salonId: item.salonId,
      salonName: item.salonName,
      status: item.status, // request status (PendingReview, Approved, etc.)
      rejectReason: item.rejectReason,
      approvedArtistId: item.approvedArtistId,
      price: requestPrice,
      duration: requestDuration,
      requestPrice,
      requestDuration,
      systemPrice,
      systemDuration,
      createdAt: item.createdAt || nail.createdAt || matchedRawNail.createdAt,
      updatedAt: item.updatedAt,
      artistFullName: item.artistFullName,
      customerNail: Object.keys(nail).length > 0 ? nail : matchedRawNail,

      customerNailId: nail.customerNailId || item.customerNailId,
      userId: nail.userId || matchedRawNail.userId,
      name: nail.name || matchedRawNail.name,
      imageUrl: nail.imageUrl || matchedRawNail.imageUrl,
      nailShapeId: nail.nailShapeId || matchedRawNail.nailShapeId,
      nailSurfaceId: nail.nailSurfaceId || matchedRawNail.nailSurfaceId,
      customColor: nail.customColor || matchedRawNail.customColor,
      isPublic: nail.isPublic || matchedRawNail.isPublic,
      basedOnNailVariantId: nail.basedOnNailVariantId || matchedRawNail.basedOnNailVariantId,
      nailShape: nail.nailShape || matchedRawNail.nailShape,
      nailSurface: nail.nailSurface || matchedRawNail.nailSurface,
      customerNailComponents: nail.customerNailComponents || matchedRawNail.customerNailComponents || [],
      nailProcedures: nail.nailProcedures || matchedRawNail.nailProcedures || [],

      _isRequest: true
    };
  }

  // If this is a direct CustomerNail object:
  return {
    ...item,
    customerNailId: item.customerNailId || item.id,
    price: item.price || 0,
    duration: item.duration || 0,
    requestPrice: null,
    requestDuration: null,
    systemPrice: item.price || 0,
    systemDuration: item.duration || 0,
    customerNailComponents: item.customerNailComponents || [],
    _isRequest: false
  };
}

export async function fetchCustomerNails(params = {}) {
  const finalParams = { pageSize: 1000, ...params };
  if (!finalParams.salonId && !finalParams.approvedArtistId) {
    finalParams.salonId = getManagerSalonId();
  }
  const requestParams = buildCustomerNailRequestParams(finalParams);

  try {
    console.log("Fetching customer nail requests from /CustomerNailRequests...");
    const response = await axiosClient.get(`/CustomerNailRequests`, {
      params: requestParams,
      headers: getAuthHeaders(),
    });
    const data = unwrapResponseData(response, "Failed to load customer nail requests.");
    const items = extractItems(data).map(item => normalizeCustomerNail(item)).filter(Boolean);

    return {
      items,
      metaData: normalizeMetaData(data?.metaData ?? data?.pagination, requestParams),
    };
  } catch (error) {
    console.error("Error fetching customer nail requests:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load customer nail requests.", { cause: error });
  }
}

export async function fetchCustomerNailById(customerNailId) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  console.log("Fetching customer nail by ID:", normalizedId);

  let requestDetail = null;
  let rawNailDetail = null;

  // 1. Try to fetch as a request
  try {
    const response = await axiosClient.get(`/CustomerNailRequests/${normalizedId}`, {
      headers: getAuthHeaders(),
    });
    requestDetail = unwrapResponse(response, "Failed to load customer nail request.");
  } catch (error) {
    try {
      const response2 = await axiosClient.get(`/CustomerNails/requests/${normalizedId}`, {
        headers: getAuthHeaders(),
      });
      requestDetail = unwrapResponse(response2, "Failed to load customer nail request.");
    } catch (err2) {
      // Not a request or not found under request endpoint
    }
  }

  // 2. Fetch the raw nail details to merge if it's a request or if we fell back
  const targetNailId = requestDetail ? requestDetail.customerNailId : normalizedId;
  try {
    const response3 = await axiosClient.get(`/CustomerNails/${targetNailId}`, {
      headers: getAuthHeaders(),
    });
    rawNailDetail = unwrapResponse(response3, "Failed to load customer nail.");
  } catch (err3) {
    console.warn("Failed to fetch raw customer nail details:", err3);
  }

  // 3. Normalize and return
  if (requestDetail) {
    return normalizeCustomerNail(requestDetail, rawNailDetail ? [rawNailDetail] : []);
  } else if (rawNailDetail) {
    return normalizeCustomerNail(rawNailDetail);
  } else {
    throw new Error("Customer nail not found under requests or direct records.");
  }
}

export async function approveCustomerNail(customerNailId) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  console.log("Approving customer nail:", normalizedId);

  try {
    const response = await axiosClient.post(`/CustomerNailRequests/${normalizedId}/approve`, null, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to approve customer nail.");
  } catch (error) {
    console.warn("Failed /CustomerNailRequests/approve, trying /CustomerNails/approve...", error.response?.data || error);
    try {
      const response2 = await axiosClient.post(`/CustomerNails/${normalizedId}/approve`, null, {
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response2, "Failed to approve customer nail.");
    } catch (err2) {
      console.error("Error approving customer nail:", err2.response?.data || err2);
      throw new Error(err2.response?.data?.message || err2.message || "Failed to approve customer nail.", { cause: err2 });
    }
  }
}

export async function rejectCustomerNail(customerNailId, rejectReason) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  console.log("Rejecting customer nail:", normalizedId, "with reason:", rejectReason);

  try {
    const response = await axiosClient.post(`/CustomerNailRequests/${normalizedId}/reject`, { rejectReason }, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to reject customer nail.");
  } catch (error) {
    console.warn("Failed /CustomerNailRequests/reject, trying /CustomerNails/reject...", error.response?.data || error);
    try {
      const response2 = await axiosClient.post(`/CustomerNails/${normalizedId}/reject`, { rejectReason }, {
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response2, "Failed to reject customer nail.");
    } catch (err2) {
      console.error("Error rejecting customer nail:", err2.response?.data || err2);
      throw new Error(err2.response?.data?.message || err2.message || "Failed to reject customer nail.", { cause: err2 });
    }
  }
}

export async function fetchSalonStaff(salonId, role = "Staff_Artist") {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  console.log("Fetching salon staff with salonId:", normalizedId, "role:", role);

  try {
    const response = await axiosClient.get(`/Users`, {
      params: {
        pageNumber: 1,
        pageSize: 100,
        role: role,
        salonId: normalizedId
      },
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load salon staff.");
  } catch (error) {
    console.error("Error fetching salon staff:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load salon staff.", { cause: error });
  }
}

export async function assignReviewer(customerNailId, staffId) {
  const normalizedId = String(customerNailId || "").trim();
  const normalizedStaffId = String(staffId || "").trim();

  if (!normalizedId || !normalizedStaffId) {
    throw new Error("Customer Nail ID and Staff ID are required.");
  }

  const payload = { staffArtistId: normalizedStaffId };
  console.log("Assigning reviewer for customer nail:", normalizedId, "with staffId:", normalizedStaffId);

  try {
    const response = await axiosClient.post(`/CustomerNails/requests/${normalizedId}/assign-reviewer`, payload, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to assign reviewer.");
  } catch (error) {
    console.warn("Failed /CustomerNails/requests/assign-reviewer, trying /CustomerNailRequests/assign-reviewer...", error.response?.data || error);
    try {
      const response2 = await axiosClient.post(`/CustomerNailRequests/${normalizedId}/assign-reviewer`, payload, {
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response2, "Failed to assign reviewer.");
    } catch (err2) {
      console.warn("Failed /CustomerNailRequests/assign-reviewer, trying /CustomerNailRequests/assign-artist...", err2.response?.data || err2);
      try {
        const response3 = await axiosClient.post(`/CustomerNailRequests/${normalizedId}/assign-artist`, payload, {
          headers: getAuthHeaders(),
        });
        return unwrapResponse(response3, "Failed to assign reviewer.");
      } catch (err3) {
        console.warn("Failed /CustomerNailRequests/assign-artist, trying /CustomerNails/assign-reviewer...", err3.response?.data || err3);
        try {
          const response4 = await axiosClient.post(`/CustomerNails/${normalizedId}/assign-reviewer`, payload, {
            headers: getAuthHeaders(),
          });
          return unwrapResponse(response4, "Failed to assign reviewer.");
        } catch (err4) {
          console.error("Error assigning reviewer:", err4.response?.data || err4);
          throw new Error(err4.response?.data?.message || err4.message || "Failed to assign reviewer.", { cause: err4 });
        }
      }
    }
  }
}

export async function managerApproveQuote(customerNailId, finalPrice, finalDuration) {
  const normalizedId = String(customerNailId || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }

  const payload = {
    finalPrice: finalPrice === null || finalPrice === undefined || finalPrice === "" ? null : Number(finalPrice),
    finalDuration: finalDuration === null || finalDuration === undefined || finalDuration === "" ? null : Number(finalDuration),
  };
  console.log("Approving quote for customer nail:", normalizedId);

  try {
    const response = await axiosClient.post(`/CustomerNails/requests/${normalizedId}/manager-approve-quote`, payload, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to approve quote.");
  } catch (error) {
    console.warn("Failed /CustomerNails/requests/manager-approve-quote, trying /CustomerNailRequests/manager-approve-quote...", error.response?.data || error);
    try {
      const response2 = await axiosClient.post(`/CustomerNailRequests/${normalizedId}/manager-approve-quote`, payload, {
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response2, "Failed to approve quote.");
    } catch (err2) {
      console.warn("Failed /CustomerNailRequests/manager-approve-quote, trying /CustomerNails/${normalizedId}/manager-approve-quote...", err2.response?.data || err2);
      try {
        const response3 = await axiosClient.post(`/CustomerNails/${normalizedId}/manager-approve-quote`, payload, {
          headers: getAuthHeaders(),
        });
        return unwrapResponse(response3, "Failed to approve quote.");
      } catch (err3) {
        console.error("Error approving quote:", err3.response?.data || err3);
        throw new Error(err3.response?.data?.message || err3.message || "Failed to approve quote.", { cause: err3 });
      }
    }
  }
}

export async function managerReject(customerNailId, reason) {
  const normalizedId = String(customerNailId || "").trim();
  const normalizedReason = String(reason || "").trim();

  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }
  if (!normalizedReason) {
    throw new Error("Reject reason is required.");
  }

  const payload = { reason: normalizedReason };
  console.log("Rejecting customer nail (manager):", normalizedId, "with reason:", normalizedReason);

  try {
    const response = await axiosClient.post(`/CustomerNails/requests/${normalizedId}/manager-reject`, payload, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to reject customer nail.");
  } catch (error) {
    console.warn("Failed /CustomerNails/requests/manager-reject, trying /CustomerNailRequests/manager-reject...", error.response?.data || error);
    try {
      const response2 = await axiosClient.post(`/CustomerNailRequests/${normalizedId}/manager-reject`, payload, {
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response2, "Failed to reject customer nail.");
    } catch (err2) {
      console.warn("Failed /CustomerNailRequests/manager-reject, trying /CustomerNails/${normalizedId}/manager-reject...", err2.response?.data || err2);
      try {
        const response3 = await axiosClient.post(`/CustomerNails/${normalizedId}/manager-reject`, payload, {
          headers: getAuthHeaders(),
        });
        return unwrapResponse(response3, "Failed to reject customer nail.");
      } catch (err3) {
        console.error("Error rejecting customer nail (manager):", err3.response?.data || err3);
        throw new Error(err3.response?.data?.message || err3.message || "Failed to reject customer nail.", { cause: err3 });
      }
    }
  }
}

export async function fetchCustomerNailRequests(params = {}) {
  return fetchCustomerNails(params);
}

export async function fetchStaffCustomerNailRequests(staffArtistId, params = {}) {
  const normalizedArtistId = String(staffArtistId || "").trim();
  if (!normalizedArtistId) {
    throw new Error("Staff Artist ID is required.");
  }
  const response = await fetchCustomerNails({
    approvedArtistId: normalizedArtistId,
    ...params
  });
  return response?.items || [];
}

export async function fetchCustomerNailRequestById(id) {
  return fetchCustomerNailById(id);
}

export async function fetchProcedures(params = {}) {
  try {
    const response = await axiosClient.get("/Procedures", {
      headers: getAuthHeaders(),
      params,
    });
    const data = unwrapResponse(response, "Failed to fetch procedures.");
    return Array.isArray(data) ? data : data?.items || data?.data || [];
  } catch (error) {
    console.warn("Failed fetching procedures from /Procedures, fallbacking to []...", error);
    return [];
  }
}

export async function staffSubmitArtistQuote(customerNailId, quotedPrice, quotedDuration, artistNotes = "", procedures = []) {
  const normalizedId = String(customerNailId || "").trim();
  if (!normalizedId) {
    throw new Error("Customer Nail ID is required.");
  }
  const payload = {
    quotedPrice: quotedPrice === null || quotedPrice === undefined || quotedPrice === "" ? null : Number(quotedPrice),
    quotedDuration: quotedDuration === null || quotedDuration === undefined || quotedDuration === "" ? null : Number(quotedDuration),
    artistNotes: artistNotes || "",
    procedures: Array.isArray(procedures) ? procedures : [],
  };

  try {
    console.log("Submitting artist quote (primary: /CustomerNails/requests/{id}/artist-quote)...");
    const response = await axiosClient.post(`/CustomerNails/requests/${normalizedId}/artist-quote`, payload, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to submit artist quote.");
  } catch (error) {
    console.warn("Failed /CustomerNails/requests/artist-quote, trying /CustomerNailRequests/artist-quote...", error.response?.data || error);
    try {
      const response2 = await axiosClient.post(`/CustomerNailRequests/${normalizedId}/artist-quote`, payload, {
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response2, "Failed to submit artist quote.");
    } catch (err2) {
      console.warn("Failed /CustomerNailRequests/artist-quote, trying /CustomerNails/artist-quote...", err2.response?.data || err2);
      try {
        const response3 = await axiosClient.post(`/CustomerNails/${normalizedId}/artist-quote`, payload, {
          headers: getAuthHeaders(),
        });
        return unwrapResponse(response3, "Failed to submit artist quote.");
      } catch (err3) {
        console.error("Error submitting artist quote:", err3.response?.data || err3);
        throw new Error(err3.response?.data?.message || err3.message || "Failed to submit artist quote.", { cause: err3 });
      }
    }
  }
}
