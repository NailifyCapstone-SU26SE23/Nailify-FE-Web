import { fetchAdminNailVariantDetail } from "@/features/admin/nails-design-management/services/nailDesignManagementService";
import { axiosClient } from "@/lib/axiosClient";
import { loadAuthSession } from "@/features/core/auth/model/authStorage";

function getAuthHeaders() {
  const session = loadAuthSession();
  const token = session?.accessToken || session?.token;

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function unwrapItems(response) {
  const data = response?.data?.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeComponent(item) {
  const source = item?.component ?? item;
  return {
    id: String(source?.componentId ?? source?.id ?? item?.componentId ?? ""),
    name: String(source?.name ?? "--"),
    imageUrl: String(source?.imageUrl ?? ""),
    componentType: String(source?.componentType ?? item?.componentType ?? ""),
  };
}

export async function getNailVariant(id) {
  const detail = await fetchAdminNailVariantDetail(id);

  return {
    id: String(detail.nailVariantId),
    name: detail.name,
    nailShape: detail.nailShape
      ? {
          id: String(detail.nailShape.nailShapeId),
          name: detail.nailShape.name,
          imageUrl: detail.nailShape.imageUrl,
        }
      : null,
    nailSurface: detail.nailSurface
      ? {
          id: String(detail.nailSurface.nailSurfaceId),
          name: detail.nailSurface.name,
          shaderParam: detail.nailSurface.shaderParam || "standard",
        }
      : null,
    colorJson: detail.colorJson,
    imageUrl: detail.imageUrl,
  };
}

export async function getPlacedNailComponents(nailVariantId) {
  if (!nailVariantId) return [];

  const detail = await fetchAdminNailVariantDetail(nailVariantId);
  return (detail.nailComponents ?? []).map((item, index) => ({
    id: String(item.id || index + 1),
    componentId: String(item.componentId || item.component?.componentId || ""),
    fingerIndex: Number(item.fingerIndex ?? item.FingerIndex ?? -1),
    posX: Number(item.posX || 0),
    posY: Number(item.posY || 0),
    configJson: String(item.configJson || ""),
  }));
}

export async function getComponent(id) {
  const response = await axiosClient.get(`/Components/${id}`, {
    headers: getAuthHeaders(),
  });
  const payload = response?.data?.data ?? response?.data;
  return normalizeComponent(payload);
}

export async function getComponents(componentType) {
  const response = await axiosClient.get("/Components", {
    headers: getAuthHeaders(),
    params: {
      pageNumber: 1,
      pageSize: 100,
      componentType,
    },
  });

  return unwrapItems(response).map(normalizeComponent);
}

export async function getNailShapes() {
  const response = await axiosClient.get("/NailShapes", {
    headers: getAuthHeaders(),
    params: {
      pageNumber: 1,
      pageSize: 100,
    },
  });

  return unwrapItems(response).map((shape) => ({
    id: String(shape?.nailShapeId ?? shape?.id ?? ""),
    name: String(shape?.name ?? "--"),
    imageUrl: String(shape?.imageUrl ?? ""),
  }));
}

export async function getNailSurfaces() {
  const response = await axiosClient.get("/NailSurfaces", {
    headers: getAuthHeaders(),
    params: {
      pageNumber: 1,
      pageSize: 100,
    },
  });

  return unwrapItems(response).map((surface) => ({
    id: String(surface?.nailSurfaceId ?? surface?.id ?? ""),
    name: String(surface?.name ?? "--"),
    shaderParam: String(surface?.shaderParam || surface?.name || "standard"),
  }));
}

export async function createPlacedNailComponent(values) {
  const payload = {
    ComponentId: Number(values.componentId),
    NailVariantId: Number(values.nailVariantId),
    PosX: Number(values.posX || 0),
    PosY: Number(values.posY || 0),
    FingerIndex: Number(values.fingerIndex || 0),
    ConfigJson: String(values.configJson || ""),
  };

  const response = await axiosClient.post("/NailComponents", payload, {
    headers: getAuthHeaders(),
  });
  const item = response?.data?.data ?? response?.data;

  return {
    id: String(item?.nailComponentId ?? item?.id ?? ""),
    componentId: String(item?.componentId ?? values.componentId),
    fingerIndex: Number(item?.fingerIndex ?? values.fingerIndex),
    posX: Number(item?.posX ?? values.posX),
    posY: Number(item?.posY ?? values.posY),
    configJson: String(item?.configJson ?? values.configJson ?? ""),
  };
}

export async function deletePlacedNailComponent(id) {
  await axiosClient.delete(`/NailComponents/${id}`, {
    headers: getAuthHeaders(),
  });
}
