import {
  fetchAdminNailVariantDetail,
} from '@/features/admin/nails-design-management/services/nailDesignManagementService';
import { axiosClient } from '@/lib/axiosClient';

export type NailDesignFormValues = Record<string, unknown> & {
  imageFile?: File;
};

export type NailVariantFormValues = Record<string, unknown> & {
  imageFile?: File;
};

export type Component = {
  id: string;
  name: string;
  imageUrl?: string;
  componentType?: string;
};

export type NailShape = {
  id: string;
  name: string;
  imageUrl?: string;
};

export type NailSurface = {
  id: string;
  name: string;
  shaderParam: string;
};

export type NailVariant = {
  id: string;
  name: string;
  nailShape?: NailShape | null;
  nailSurface?: NailSurface | null;
  colorJson?: string;
  imageUrl?: string;
};

export type PlacedNailComponent = {
  id: string;
  componentId: string;
  fingerIndex: number;
  posX: number;
  posY: number;
  configJson?: string;
};

function unwrapItems(response: any) {
  const data = response?.data?.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeComponent(item: any): Component {
  const source = item?.component ?? item;
  return {
    id: String(source?.componentId ?? source?.id ?? item?.componentId ?? ''),
    name: String(source?.name ?? '--'),
    imageUrl: String(source?.imageUrl ?? ''),
    componentType: String(source?.componentType ?? item?.componentType ?? ''),
  };
}

export async function getNailVariant(id: string | number): Promise<NailVariant> {
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
          shaderParam: detail.nailSurface.shaderParam || 'standard',
        }
      : null,
    colorJson: detail.colorJson,
    imageUrl: detail.imageUrl,
  };
}

export async function getPlacedNailComponents(nailVariantId?: string | number): Promise<PlacedNailComponent[]> {
  if (!nailVariantId) return [];

  const detail = await fetchAdminNailVariantDetail(nailVariantId);
  return (detail.nailComponents ?? []).map((item: any, index: number) => ({
    id: String(item.id || index + 1),
    componentId: String(item.componentId || item.component?.componentId || ''),
    fingerIndex: Number(item.fingerIndex || 0),
    posX: Number(item.posX || 0),
    posY: Number(item.posY || 0),
    configJson: String(item.configJson || ''),
  }));
}

export async function getComponent(id: string | number): Promise<Component> {
  const response = await axiosClient.get(`/Components/${id}`);
  const payload = response?.data?.data ?? response?.data;
  return normalizeComponent(payload);
}

export async function getComponents(componentType?: number | string): Promise<Component[]> {
  const response = await axiosClient.get('/Components', {
    params: {
      pageNumber: 1,
      pageSize: 100,
      componentType,
    },
  });

  return unwrapItems(response).map(normalizeComponent);
}

export async function getNailShapes(): Promise<NailShape[]> {
  const response = await axiosClient.get('/NailShapes', {
    params: {
      pageNumber: 1,
      pageSize: 100,
    },
  });

  return unwrapItems(response).map((shape: any) => ({
    id: String(shape?.nailShapeId ?? shape?.id ?? ''),
    name: String(shape?.name ?? '--'),
    imageUrl: String(shape?.imageUrl ?? ''),
  }));
}

export async function getNailSurfaces(): Promise<NailSurface[]> {
  const response = await axiosClient.get('/NailSurfaces', {
    params: {
      pageNumber: 1,
      pageSize: 100,
    },
  });

  return unwrapItems(response).map((surface: any) => ({
    id: String(surface?.nailSurfaceId ?? surface?.id ?? ''),
    name: String(surface?.name ?? '--'),
    shaderParam: String(surface?.shaderParam || surface?.name || 'standard'),
  }));
}
