import { axiosClient } from "../../../../lib/axiosClient";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function unwrapResponse(response, defaultErrorMessage = "An error occurred.") {
  const payload = response.data;
  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || defaultErrorMessage);
  }
  return payload.data;
}

export async function fetchAdminShapeMethodConfigs(filters = {}) {
  const { pageNumber = 1, pageSize = 10, nailShapeId, name } = filters ?? {};

  const response = await axiosClient.get("/ShapeMethodConfigs", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(nailShapeId ? { nailShapeId } : {}),
      ...(name ? { name } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load shape method configs.");

  return {
    items: Array.isArray(data?.items) ? data.items.map((item) => ({
      shapeMethodConfigId: Number(item?.shapeMethodConfigId || 0),
      nailShapeId: Number(item?.nailShapeId || 0),
      name: String(item?.name || "").trim(),
      price: Number(item?.price || 0),
      duration: Number(item?.duration || 0),
      status: String(item?.status || "").trim(),
    })) : [],
    metaData: data?.metaData ?? {
      currentPage: 1,
      totalPages: 1,
      pageSize,
      totalItems: 0,
      hasPrevious: false,
      hasNext: false,
      firstRowOnPage: 0,
      lastRowOnPage: 0,
    },
  };
}

export async function fetchAdminShapeMethodConfigDetail(id) {
  const normalizedId = Number(id);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid shape method config ID.");
  }

  const response = await axiosClient.get(`/ShapeMethodConfigs/${normalizedId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load shape method config detail.");

  return {
    shapeMethodConfigId: Number(data?.shapeMethodConfigId || 0),
    nailShapeId: Number(data?.nailShapeId || 0),
    name: String(data?.name || "").trim(),
    price: Number(data?.price || 0),
    duration: Number(data?.duration || 0),
    status: String(data?.status || "").trim(),
  };
}

export async function fetchAdminShapeMethodConfigsByNailShape(nailShapeId) {
  const normalizedId = Number(nailShapeId);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid nail shape ID.");
  }

  const response = await axiosClient.get(`/ShapeMethodConfigs/nail-shape/${normalizedId}`, {
    headers: getAuthHeaders(),
  });

  const payload = response.data;
  if (!payload?.isSucceeded) {
    // If not found, return empty array instead of throwing if you want to handle it gracefully,
    // but unwrapResponse handles the error. Actually let's use unwrapResponse.
  }
  const data = unwrapResponse(response, "Failed to load shape method configs.");

  return Array.isArray(data) ? data.map(item => ({
    shapeMethodConfigId: Number(item?.shapeMethodConfigId || 0),
    nailShapeId: Number(item?.nailShapeId || 0),
    name: String(item?.name || "").trim(),
    price: Number(item?.price || 0),
    duration: Number(item?.duration || 0),
    status: String(item?.status || "").trim(),
  })) : [];
}

export async function createAdminShapeMethodConfig(payload) {
  const response = await axiosClient.post("/ShapeMethodConfigs", payload, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to create shape method config.");
}

export async function updateAdminShapeMethodConfig(id, payload) {
  const normalizedId = Number(id);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid shape method config ID.");
  }

  const response = await axiosClient.put(`/ShapeMethodConfigs/${normalizedId}`, payload, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to update shape method config.");
}

export async function deleteAdminShapeMethodConfig(id) {
  const normalizedId = Number(id);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid shape method config ID.");
  }

  const response = await axiosClient.delete(`/ShapeMethodConfigs/${normalizedId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete shape method config.");
}
