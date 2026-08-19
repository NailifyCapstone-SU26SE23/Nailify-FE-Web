import { axiosClient } from "../../../../lib/axiosClient";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
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

function normalizeBookingStatusValue(status) {
  return String(status || "").trim().toLowerCase();
}

export function isRejectedStaffBooking(booking) {
  return normalizeBookingStatusValue(booking?.status) === "rejected";
}

function filterVisibleStaffBookings(bookings) {
  return (Array.isArray(bookings) ? bookings : []).filter((booking) => !isRejectedStaffBooking(booking));
}

function extractPaginationMeta(data, fallbackPageSize) {
  const metaData = data?.metaData ?? data?.pagination ?? data ?? {};
  const totalItems =
    Number(metaData?.totalItems ?? metaData?.totalCount ?? metaData?.count ?? metaData?.total ?? 0) || 0;
  const currentPage =
    Number(metaData?.currentPage ?? metaData?.pageNumber ?? metaData?.pageIndex ?? 1) || 1;
  const pageSize =
    Number(metaData?.pageSize ?? metaData?.limit ?? fallbackPageSize ?? 10) || fallbackPageSize || 10;
  const inferredTotalPages =
    pageSize > 0 ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  const totalPages =
    Number(metaData?.totalPages ?? metaData?.pageCount ?? inferredTotalPages) || inferredTotalPages;
  const firstRowOnPage =
    Number(metaData?.firstRowOnPage || (totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0)) || 0;
  const lastRowOnPage =
    Number(metaData?.lastRowOnPage || Math.min(totalItems, currentPage * pageSize)) || 0;

  return {
    currentPage,
    totalPages: Math.max(1, totalPages),
    pageSize,
    totalItems,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < Math.max(1, totalPages),
    firstRowOnPage,
    lastRowOnPage,
  };
}

export function getStaffArtistId() {
  const session = loadAuthSession();
  const artistId = session?.user?.staffId || session?.staffId || session?.user?.id || session?.userId;

  if (!artistId) {
    throw new Error("Staff ID is not available in the current session.");
  }

  return artistId;
}

export function getStaffSalonId() {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId;

  if (!salonId) {
    throw new Error("Salon ID is not available in the current session.");
  }

  return salonId;
}

export function getStaffSessionUser() {
  return loadAuthSession()?.user ?? null;
}

export async function fetchStaffBookings(filters = {}) {
  const artistId = getStaffArtistId();
  const {
    endDate,
    includePagination = false,
    pageNumber,
    pageSize,
    search,
    startDate,
    status,
  } = filters ?? {};
  const response = await axiosClient.get(`/Bookings/artist/${artistId}`, {
    headers: getAuthHeaders(),
    params: {
      ...(pageNumber ? { pageNumber } : {}),
      ...(pageSize ? { pageSize } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load assigned bookings.");
  const items = filterVisibleStaffBookings(Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : []);

  if (includePagination) {
    return {
      items,
      pagination: extractPaginationMeta(data, pageSize),
    };
  }

  return items;
}

export async function fetchStaffSalonBookings(filters = {}) {
  const salonId = getStaffSalonId();
  const {
    endDate,
    includePagination = false,
    pageNumber = 1,
    pageSize = 100,
    search,
    startDate,
    status,
  } = filters ?? {};
  const response = await axiosClient.get(`/Bookings/salon/${salonId}`, {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load salon bookings.");
  const items = filterVisibleStaffBookings(
    Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : [],
  );

  if (includePagination) {
    return {
      items,
      pagination: extractPaginationMeta(data, pageSize),
    };
  }

  return items;
}

export async function fetchServiceCatalog(filters = {}) {
  const {
    pageNumber = 1,
    pageSize = 10,
    name,
  } = filters ?? {};

  const response = await axiosClient.get("/Services", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(name ? { name } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load services.");

  return {
    items: Array.isArray(data?.items) ? data.items.map((item) => ({
      serviceId: String(item?.serviceId || "").trim(),
      name: String(item?.name || "").trim(),
      description: String(item?.description || "").trim(),
      price: Number(item?.price || 0),
      duration: Number(item?.duration || 0),
      status: String(item?.status || "").trim(),
      createAt: String(item?.createAt || "").trim(),
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

export async function fetchStaffServiceDetail(serviceId) {
  const normalizedServiceId = String(serviceId || "").trim();

  if (!normalizedServiceId) {
    throw new Error("Service ID is required.");
  }

  const response = await axiosClient.get(`/Services/${normalizedServiceId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load service detail.");

  return {
    serviceId: String(data?.serviceId || "").trim(),
    name: String(data?.name || "").trim(),
    description: String(data?.description || "").trim(),
    price: Number(data?.price || 0),
    duration: Number(data?.duration || 0),
    status: String(data?.status || "").trim(),
    createAt: String(data?.createAt || "").trim(),
  };
}

export async function fetchStaffBuilderNailShapes(filters = {}) {
  const {
    pageNumber = 1,
    pageSize = 100,
    name,
  } = filters ?? {};

  const response = await axiosClient.get("/NailShapes", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(name ? { name } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load nail shapes.");

  return Array.isArray(data?.items)
    ? data.items.map((item) => ({
      nailShapeId: Number(item?.nailShapeId || 0),
      name: String(item?.name || "").trim(),
      imageUrl: String(item?.imageUrl || "").trim(),
      price: Number(item?.price || 0),
      duration: Number(item?.duration || 0),
    }))
    : [];
}

export async function fetchStaffBuilderNailSurfaces(filters = {}) {
  const {
    pageNumber = 1,
    pageSize = 100,
    name,
  } = filters ?? {};

  const response = await axiosClient.get("/NailSurfaces", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(name ? { name } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load nail surfaces.");

  return Array.isArray(data?.items)
    ? data.items.map((item) => ({
      nailSurfaceId: Number(item?.nailSurfaceId || 0),
      name: String(item?.name || "").trim(),
      shaderParam: String(item?.shaderParam || "").trim(),
      lightnessOffset: Number(item?.lightnessOffset || 0),
      saturationOffset: Number(item?.saturationOffset || 0),
      hueOffset: Number(item?.hueOffset || 0),
      price: Number(item?.price || 0),
      duration: Number(item?.duration || 0),
    }))
    : [];
}

export async function fetchStaffBuilderNailComponents(filters = {}) {
  const {
    pageNumber = 1,
    pageSize = 100,
  } = filters ?? {};

  const response = await axiosClient.get("/NailComponents", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
    },
  });

  const data = unwrapResponse(response, "Failed to load nail components.");
  const uniqueComponents = new Map();

  if (Array.isArray(data?.items)) {
    data.items.forEach((item) => {
      const component = item?.component;
      const componentId = Number(component?.componentId || item?.componentId || 0);

      if (!componentId || uniqueComponents.has(componentId)) {
        return;
      }

      uniqueComponents.set(componentId, {
        componentId,
        name: String(component?.name || "").trim(),
        imageUrl: String(component?.imageUrl || "").trim(),
        componentType: String(component?.componentType || "").trim(),
        price: Number(component?.price || 0),
        duration: Number(component?.duration || 0),
      });
    });
  }

  return [...uniqueComponents.values()];
}

export async function fetchStaffBookingDetail(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.get(`/Bookings/${normalizedBookingId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load booking detail.");

  if (isRejectedStaffBooking(data)) {
    throw new Error("Rejected bookings are not available in the staff workspace.");
  }

  return data;
}

export function toNullableBookingNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalizedValue = Number(value);

  return Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null;
}

export function isBookingUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(value || "").trim());
}

export function toNullableBookingUuid(value) {
  const normalizedValue = String(value || "").trim();

  return isBookingUuidLike(normalizedValue) ? normalizedValue : null;
}

export function normalizeBookingItemQuantity(value, fallback = 1) {
  const normalizedValue = Number(value);

  return Number.isFinite(normalizedValue) && normalizedValue > 0
    ? Math.floor(normalizedValue)
    : fallback;
}

export function isNailLinkedBookingItem(item) {
  return Boolean(
    toNullableBookingNumber(item?.nailVariantId)
    || toNullableBookingUuid(item?.customerNailRequestId)
    || toNullableBookingNumber(item?.customerNailId)
    || toNullableBookingNumber(item?.shapeMethodConfigId)
    || String(item?.nailVariantName || "").trim()
    || String(item?.customerNailName || "").trim(),
  );
}

export function buildBookingUpdateItemPayload(item, fallbackQuantity = 1) {
  return {
    nailVariantId: toNullableBookingNumber(item?.nailVariantId),
    serviceId: toNullableBookingUuid(item?.serviceId),
    shapeMethodConfigId: toNullableBookingNumber(item?.shapeMethodConfigId),
    customerNailId: toNullableBookingNumber(item?.customerNailId),
    customerNailRequestId: toNullableBookingUuid(item?.customerNailRequestId),
    quantity: normalizeBookingItemQuantity(item?.quantity, fallbackQuantity),
  };
}

export function buildStaffBookingItemsForUpdate(existingBookingItems = [], selectedServiceQuantities = {}) {
  const normalizedExistingItems = Array.isArray(existingBookingItems) ? existingBookingItems : [];
  const payloadItems = normalizedExistingItems.map((item) => buildBookingUpdateItemPayload(item));
  const serviceOnlyIndexById = new Map();

  normalizedExistingItems.forEach((item, index) => {
    const serviceId = toNullableBookingUuid(item?.serviceId);

    if (!serviceId || isNailLinkedBookingItem(item) || serviceOnlyIndexById.has(serviceId)) {
      return;
    }

    serviceOnlyIndexById.set(serviceId, index);
  });

  Object.entries(selectedServiceQuantities || {}).forEach(([rawServiceId, rawQuantity]) => {
    const serviceId = toNullableBookingUuid(rawServiceId);
    const quantity = normalizeBookingItemQuantity(rawQuantity, 0);

    if (!serviceId || quantity <= 0) {
      return;
    }

    if (serviceOnlyIndexById.has(serviceId)) {
      const itemIndex = serviceOnlyIndexById.get(serviceId);
      const existingItem = payloadItems[itemIndex];

      payloadItems[itemIndex] = {
        ...existingItem,
        quantity: normalizeBookingItemQuantity(existingItem?.quantity, 1) + quantity,
      };
      return;
    }

    serviceOnlyIndexById.set(serviceId, payloadItems.length);
    payloadItems.push({
      nailVariantId: null,
      serviceId,
      shapeMethodConfigId: null,
      customerNailId: null,
      customerNailRequestId: null,
      quantity,
    });
  });

  return payloadItems;
}

export async function fetchLoyaltyTiers() {
  try {
    const response = await axiosClient.get('/LoyaltyTiers', {
      headers: getAuthHeaders()
    });
    const payload = response.data;
    if (!payload?.isSucceeded) {
      throw new Error(payload?.message || "Failed to fetch loyalty tiers.");
    }
    return payload.data;
  } catch (error) {
    console.error("Error fetching loyalty tiers:", error);
    throw error;
  }
}

export async function updateStaffBooking(bookingId, payload) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.put(`/Bookings/${normalizedBookingId}`, payload, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to update booking.");
}

export async function createStaffCustomerNail(payload) {
  const formData = new FormData();
  const normalizedName = String(payload?.name || "").trim();
  const nailShapeId = Number(payload?.nailShapeId || 0);
  const nailSurfaceId = Number(payload?.nailSurfaceId || 0);
  const customColor = String(payload?.customColor || "").trim();
  const isPublic = Boolean(payload?.isPublic);

  if (!normalizedName) {
    throw new Error("Customer nail name is required.");
  }

  if (!Number.isInteger(nailShapeId) || nailShapeId <= 0) {
    throw new Error("A valid nail shape is required.");
  }

  if (!Number.isInteger(nailSurfaceId) || nailSurfaceId <= 0) {
    throw new Error("A valid nail surface is required.");
  }

  formData.append("Name", normalizedName);
  formData.append("NailShapeId", String(nailShapeId));
  formData.append("NailSurfaceId", String(nailSurfaceId));
  formData.append("CustomColor", customColor);
  formData.append("IsPublic", String(isPublic));

  if (payload?.image instanceof File) {
    formData.append("image", payload.image);
  }

  const response = await axiosClient.post("/CustomerNails", formData, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return unwrapResponse(response, "Failed to create customer nail.");
}

export async function createStaffCustomerNailComponent(payload) {
  const customerNailId = Number(payload?.customerNailId || 0);
  const componentId = payload?.componentId == null ? null : Number(payload.componentId || 0);
  const customerComponentId = payload?.customerComponentId == null
    ? null
    : Number(payload.customerComponentId || 0);
  const posX = Number(payload?.posX ?? 0);
  const posY = Number(payload?.posY ?? 0);
  const fingerIndex = Number(payload?.fingerIndex ?? 0);
  const configJson = String(payload?.configJson || "").trim();

  if (!Number.isInteger(customerNailId) || customerNailId <= 0) {
    throw new Error("A valid customer nail ID is required.");
  }

  if (componentId !== null && (!Number.isInteger(componentId) || componentId <= 0)) {
    throw new Error("Component ID must be null or a positive integer.");
  }

  if (customerComponentId !== null && (!Number.isInteger(customerComponentId) || customerComponentId <= 0)) {
    throw new Error("Customer component ID must be null or a positive integer.");
  }

  if (componentId === null && customerComponentId === null) {
    throw new Error("A component ID or customer component ID is required.");
  }

  const response = await axiosClient.post("/CustomerNailComponents", {
    customerNailId,
    componentId,
    customerComponentId,
    posX: Number.isFinite(posX) ? posX : 0,
    posY: Number.isFinite(posY) ? posY : 0,
    fingerIndex: Number.isFinite(fingerIndex) ? fingerIndex : 0,
    configJson,
  }, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to create customer nail component.");
}

export async function fetchStaffCustomerComponentDetail(customerComponentId) {
  const normalizedCustomerComponentId = Number(customerComponentId || 0);

  if (!Number.isInteger(normalizedCustomerComponentId) || normalizedCustomerComponentId <= 0) {
    throw new Error("Customer component ID is required.");
  }

  const response = await axiosClient.get(`/CustomerComponents/${normalizedCustomerComponentId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load customer component detail.");

  return {
    customerComponentId: Number(data?.customerComponentId || 0),
    userId: String(data?.userId || "").trim(),
    name: String(data?.name || "").trim(),
    imageUrl: String(data?.imageUrl || "").trim(),
    componentType: String(data?.componentType || "").trim(),
    createdAt: String(data?.createdAt || "").trim(),
    isPublic: Boolean(data?.isPublic),
  };
}

export async function fetchStaffNailVariantDetail(variantId) {
  const normalizedVariantId = Number(variantId || 0);

  if (!Number.isInteger(normalizedVariantId) || normalizedVariantId <= 0) {
    throw new Error("Variant ID is required.");
  }

  const response = await axiosClient.get(`/NailVariants/${normalizedVariantId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load nail variant detail.");

  return {
    nailVariantId: Number(data?.nailVariantId || 0),
    name: String(data?.name || "").trim(),
    nailShapeId: Number(data?.nailShapeId || 0),
    nailSurfaceId: Number(data?.nailSurfaceId || 0),
    nailDesignId: Number(data?.nailDesignId || 0),
    price: Number(data?.price || 0),
    priceLabel: formatCurrency(data?.price || 0),
    duration: Number(data?.duration || 0),
    durationLabel: formatDurationMinutes(Number(data?.duration || 0)),
    imageUrl: String(data?.imageUrl || "").trim(),
    colorJson: String(data?.colorJson || "").trim(),
    nailShape: data?.nailShape
      ? {
        nailShapeId: Number(data.nailShape.nailShapeId || 0),
        name: String(data.nailShape.name || "").trim(),
        imageUrl: String(data.nailShape.imageUrl || "").trim(),
        price: Number(data.nailShape.price || 0),
        duration: Number(data.nailShape.duration || 0),
      }
      : null,
    nailSurface: data?.nailSurface
      ? {
        nailSurfaceId: Number(data.nailSurface.nailSurfaceId || 0),
        name: String(data.nailSurface.name || "").trim(),
        shaderParam: String(data.nailSurface.shaderParam || "").trim(),
        price: Number(data.nailSurface.price || 0),
        duration: Number(data.nailSurface.duration || 0),
      }
      : null,
    nailComponents: Array.isArray(data?.nailComponents)
      ? data.nailComponents.map((item) => ({
        nailComponentId: Number(item?.nailComponentId || 0),
        componentId: Number(item?.componentId || 0),
        fingerIndex: Number(item?.fingerIndex || 0),
        posX: Number(item?.posX || 0),
        posY: Number(item?.posY || 0),
        configJson: String(item?.configJson || "").trim(),
        component: item?.component
          ? {
            componentId: Number(item.component.componentId || 0),
            name: String(item.component.name || "").trim(),
            imageUrl: String(item.component.imageUrl || "").trim(),
            componentType: String(item.component.componentType || "").trim(),
            price: Number(item.component.price || 0),
            duration: Number(item.component.duration || 0),
          }
          : null,
      }))
      : [],
  };
}

export async function fetchStaffCustomerNailDetail(customerNailId) {
  const normalizedCustomerNailId = Number(customerNailId || 0);

  if (!Number.isInteger(normalizedCustomerNailId) || normalizedCustomerNailId <= 0) {
    throw new Error("Customer nail ID is required.");
  }

  const response = await axiosClient.get(`/CustomerNails/${normalizedCustomerNailId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load customer nail detail.");
  const normalizedCustomerNailComponents = Array.isArray(data?.customerNailComponents)
    ? await Promise.all(data.customerNailComponents.map(async (item) => {
      const customerComponentId = Number(item?.customerComponentId || 0);
      const resolvedCustomerComponent = item?.customerComponent
        ? {
          customerComponentId: Number(item.customerComponent.customerComponentId || 0),
          userId: String(item.customerComponent.userId || "").trim(),
          name: String(item.customerComponent.name || "").trim(),
          imageUrl: String(item.customerComponent.imageUrl || "").trim(),
          componentType: String(item.customerComponent.componentType || "").trim(),
          createdAt: String(item.customerComponent.createdAt || "").trim(),
          isPublic: Boolean(item.customerComponent.isPublic),
        }
        : customerComponentId > 0
          ? await fetchStaffCustomerComponentDetail(customerComponentId)
          : null;

      return {
        nailComponentId: Number(item?.customerNailComponentId || 0),
        customerNailComponentId: Number(item?.customerNailComponentId || 0),
        customerNailId: Number(item?.customerNailId || 0),
        componentId: Number(item?.componentId || 0),
        customerComponentId,
        fingerIndex: Number(item?.fingerIndex || 0),
        posX: Number(item?.posX || 0),
        posY: Number(item?.posY || 0),
        configJson: String(item?.configJson || "").trim(),
        component: item?.component
          ? {
            componentId: Number(item.component.componentId || 0),
            name: String(item.component.name || "").trim(),
            imageUrl: String(item.component.imageUrl || "").trim(),
            componentType: String(item.component.componentType || "").trim(),
            price: Number(item.component.price || 0),
            duration: Number(item.component.duration || 0),
          }
          : resolvedCustomerComponent
            ? {
              componentId: 0,
              name: resolvedCustomerComponent.name,
              imageUrl: resolvedCustomerComponent.imageUrl,
              componentType: resolvedCustomerComponent.componentType,
              price: 0,
              duration: 0,
            }
            : null,
        customerComponent: resolvedCustomerComponent,
      };
    }))
    : [];

  return {
    detailType: "customerNail",
    customerNailId: Number(data?.customerNailId || 0),
    nailVariantId: Number(data?.basedOnNailVariant?.nailVariantId || data?.basedOnNailVariantId || data?.customerNailId || 0),
    nailDesignId: Number(data?.basedOnNailVariant?.nailDesignId || 0),
    userId: String(data?.userId || "").trim(),
    name: String(data?.name || "").trim(),
    imageUrl: String(data?.imageUrl || "").trim(),
    nailShapeId: Number(data?.nailShapeId || 0),
    nailSurfaceId: Number(data?.nailSurfaceId || 0),
    price: Number(data?.price || 0),
    priceLabel: formatCurrency(data?.price || 0),
    customColor: String(data?.customColor || "").trim(),
    colorJson: String(data?.basedOnNailVariant?.colorJson || data?.customColor || "").trim(),
    duration: Number(data?.duration || 0),
    durationLabel: formatDurationMinutes(Number(data?.duration || 0)),
    createdAt: String(data?.createdAt || "").trim(),
    isPublic: Boolean(data?.isPublic),
    basedOnNailVariantId: Number(data?.basedOnNailVariantId || 0),
    status: String(data?.status || "").trim(),
    nailShape: data?.nailShape
      ? {
        nailShapeId: Number(data.nailShape.nailShapeId || 0),
        name: String(data.nailShape.name || "").trim(),
        imageUrl: String(data.nailShape.imageUrl || "").trim(),
        price: Number(data.nailShape.price || 0),
        duration: Number(data.nailShape.duration || 0),
      }
      : null,
    nailSurface: data?.nailSurface
      ? {
        nailSurfaceId: Number(data.nailSurface.nailSurfaceId || 0),
        name: String(data.nailSurface.name || "").trim(),
        shaderParam: String(data.nailSurface.shaderParam || "").trim(),
        price: Number(data.nailSurface.price || 0),
        duration: Number(data.nailSurface.duration || 0),
      }
      : null,
    basedOnNailVariant: data?.basedOnNailVariant
      ? {
        nailVariantId: Number(data.basedOnNailVariant.nailVariantId || 0),
        name: String(data.basedOnNailVariant.name || "").trim(),
        nailShapeId: Number(data.basedOnNailVariant.nailShapeId || 0),
        nailSurfaceId: Number(data.basedOnNailVariant.nailSurfaceId || 0),
        nailDesignId: Number(data.basedOnNailVariant.nailDesignId || 0),
        price: Number(data.basedOnNailVariant.price || 0),
        duration: Number(data.basedOnNailVariant.duration || 0),
        imageUrl: String(data.basedOnNailVariant.imageUrl || "").trim(),
        colorJson: String(data.basedOnNailVariant.colorJson || "").trim(),
        nailShape: data.basedOnNailVariant.nailShape
          ? {
            nailShapeId: Number(data.basedOnNailVariant.nailShape.nailShapeId || 0),
            name: String(data.basedOnNailVariant.nailShape.name || "").trim(),
            imageUrl: String(data.basedOnNailVariant.nailShape.imageUrl || "").trim(),
            price: Number(data.basedOnNailVariant.nailShape.price || 0),
            duration: Number(data.basedOnNailVariant.nailShape.duration || 0),
          }
          : null,
        nailSurface: data.basedOnNailVariant.nailSurface
          ? {
            nailSurfaceId: Number(data.basedOnNailVariant.nailSurface.nailSurfaceId || 0),
            name: String(data.basedOnNailVariant.nailSurface.name || "").trim(),
            shaderParam: String(data.basedOnNailVariant.nailSurface.shaderParam || "").trim(),
            price: Number(data.basedOnNailVariant.nailSurface.price || 0),
            duration: Number(data.basedOnNailVariant.nailSurface.duration || 0),
          }
          : null,
        nailComponents: Array.isArray(data?.basedOnNailVariant?.nailComponents)
          ? data.basedOnNailVariant.nailComponents.map((item) => ({
            nailComponentId: Number(item?.nailComponentId || 0),
            componentId: Number(item?.componentId || 0),
            fingerIndex: Number(item?.fingerIndex || 0),
            posX: Number(item?.posX || 0),
            posY: Number(item?.posY || 0),
            configJson: String(item?.configJson || "").trim(),
            component: item?.component
              ? {
                componentId: Number(item.component.componentId || 0),
                name: String(item.component.name || "").trim(),
                imageUrl: String(item.component.imageUrl || "").trim(),
                componentType: String(item.component.componentType || "").trim(),
                price: Number(item.component.price || 0),
                duration: Number(item.component.duration || 0),
              }
              : null,
          }))
          : [],
      }
      : null,
    nailComponents: normalizedCustomerNailComponents,
    customerNailComponents: normalizedCustomerNailComponents,
  };
}

export async function fetchStaffCustomerDetail(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error("Customer user ID is required.");
  }

  const response = await axiosClient.get(`/Users/customers/${normalizedUserId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load customer detail.");

  return {
    userId: String(data?.userId || "").trim(),
    email: String(data?.email || "").trim(),
    phone: String(data?.phone || "").trim(),
    firstName: String(data?.firstName || "").trim(),
    lastName: String(data?.lastName || "").trim(),
    fullName: [String(data?.firstName || "").trim(), String(data?.lastName || "").trim()]
      .filter(Boolean)
      .join(" ")
      .trim(),
    avatarUrl: String(data?.avatarUrl || "").trim(),
    status: String(data?.status || "").trim(),
    role: String(data?.role || "").trim(),
    salonId: String(data?.salonId || "").trim(),
    staffId: String(data?.staffId || "").trim(),
    loyaltyPoint: Number(data?.loyaltyPoint || 0),
  };
}

export async function fetchBookingProceduresByBookingItem(bookingItemId) {
  const normalizedBookingItemId = String(bookingItemId || "").trim();

  if (!normalizedBookingItemId) {
    throw new Error("Booking item ID is required.");
  }

  const response = await axiosClient.get(`/BookingProcedures/booking-item/${normalizedBookingItemId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load booking procedures.");

  return Array.isArray(data) ? data : [];
}

export async function claimBookingProcedure(procedureId) {
  const normalizedProcedureId = String(procedureId || "").trim();

  if (!normalizedProcedureId) {
    throw new Error("Procedure ID is required.");
  }

  const response = await axiosClient.post(
    `/BookingProcedures/procedures/${normalizedProcedureId}/claim`,
    null,
    {
      headers: getAuthHeaders(),
    },
  );

  return unwrapResponse(response, "Failed to claim booking procedure.");
}

export async function updateBookingProcedureStatus(bookingProcedureId, status, artistId = getStaffArtistId()) {
  const normalizedBookingProcedureId = String(bookingProcedureId || "").trim();
  const normalizedArtistId = String(artistId || "").trim();
  const normalizedStatus = String(status || "").trim();

  if (!normalizedBookingProcedureId) {
    throw new Error("Booking procedure ID is required.");
  }

  if (!normalizedArtistId) {
    throw new Error("Artist ID is required.");
  }

  if (!normalizedStatus) {
    throw new Error("Procedure status is required.");
  }

  const response = await axiosClient.put(`/BookingProcedures/${normalizedBookingProcedureId}/status`, null, {
    headers: getAuthHeaders(),
    params: {
      artistId: normalizedArtistId,
      status: normalizedStatus,
    },
  });

  return unwrapResponse(response, "Failed to update booking procedure status.");
}

export async function startStaffBookingService(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/start`, null, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to start service.");
}

export async function uploadImageBeforeService(bookingId, imageFile) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  if (!(imageFile instanceof File)) {
    throw new Error("Before-service image is required.");
  }

  const formData = new FormData();
  formData.append("BookingId", normalizedBookingId);
  formData.append("Image", imageFile);

  const response = await axiosClient.post("/Bookings/check-in-images", formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse(response, "Failed to check in booking.");
}

export async function uploadImageAfterService(bookingId, imageFile) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  if (!(imageFile instanceof File)) {
    throw new Error("After-service image is required.");
  }

  const formData = new FormData();
  formData.append("Images", imageFile);

  const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/complete-service`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse(response, "Failed to complete service.");
}

export function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateParam() {
  return toDateInputValue(new Date());
}

export function isTodayBooking(value) {
  return toDateInputValue(value) === getTodayDateParam();
}

export function formatTimeValue(value) {
  return value ? String(value).slice(0, 5) : "--";
}

export function parseDurationMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return 0;
  }

  const matchedMinutes = normalizedValue.match(/(\d+)/);

  return matchedMinutes ? Math.max(0, Number(matchedMinutes[1])) : 0;
}

export function formatAppointmentEndTime(startTime, durationValue) {
  const normalizedStartTime = formatTimeValue(startTime);

  if (normalizedStartTime === "--") {
    return "--";
  }

  const [hoursText = "0", minutesText = "0"] = normalizedStartTime.split(":");
  const baseDate = new Date();
  baseDate.setHours(Number(hoursText), Number(minutesText), 0, 0);

  if (Number.isNaN(baseDate.getTime())) {
    return "--";
  }

  const endDate = new Date(baseDate.getTime() + parseDurationMinutes(durationValue) * 60000);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(endDate);
}

export function formatCurrency(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "--";
  }

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount)} VND`;
}

export function formatBookingCode(bookingId) {
  const normalized = String(bookingId || "").trim();

  if (!normalized) {
    return "--";
  }

  return `BK-${normalized.slice(0, 8).toUpperCase()}`;
}

function buildServiceSessionBreakdown(items = [], options = {}) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const serviceDetailMap = options?.serviceDetailMap ?? {};
  const nailVariantDetailMap = options?.nailVariantDetailMap ?? {};
  const customerNailDetailMap = options?.customerNailDetailMap ?? {};

  const rawRows = normalizedItems.flatMap((item, index) => {
    const bookingItemId = String(item?.bookingItemId || item?.id || "").trim();
    const serviceId = String(item?.serviceId || "").trim();
    const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;
    const resolvedService = serviceId ? serviceDetailMap[serviceId] : null;
    const customerNailId = Number(item?.customerNailId || 0);
    const nailVariantId = Number(item?.nailVariantId || 0);
    const resolvedCustomerNail = customerNailId > 0 ? customerNailDetailMap[customerNailId] : null;
    const resolvedNailVariant = nailVariantId > 0 ? nailVariantDetailMap[nailVariantId] : null;
    const resolvedNailDetail = resolvedCustomerNail || resolvedNailVariant;
    const resolvedNailName = String(
      resolvedCustomerNail?.name ||
      resolvedNailVariant?.name ||
      item?.customerNailName ||
      item?.nailVariantName ||
      "",
    ).trim();
    const hasNailDetail = Boolean(resolvedNailName || customerNailId > 0 || nailVariantId > 0);
    const rows = [];

    const resolvedServiceName = String(resolvedService?.name || item?.serviceName || "").trim();
    if (resolvedServiceName || serviceId) {
      const duration = parseDurationMinutes(
        resolvedService?.duration ?? item?.serviceDuration ?? item?.duration ?? item?.estimatedDuration ?? 0,
      );

      rows.push({
        id: `${bookingItemId || `service-${index}`}-service`,
        bookingItemId,
        name: resolvedServiceName,
        detailLabel: "Service",
        quantity,
        duration,
        durationLabel: formatDurationMinutes(duration),
        priceLabel: formatCurrency(resolvedService?.price ?? item?.price ?? item?.finalPrice ?? 0),
        canViewProcedures: Boolean(bookingItemId) && !hasNailDetail,
      });
    }

    if (resolvedNailName || customerNailId > 0 || nailVariantId > 0) {
      const duration = parseDurationMinutes(resolvedNailDetail?.duration);

      rows.push({
        id: `${bookingItemId || `service-${index}`}-nail`,
        bookingItemId,
        name: resolvedNailName,
        detailLabel: resolvedCustomerNail ? "Customer Nail" : "Nail Variant",
        quantity,
        duration,
        durationLabel: formatDurationMinutes(duration),
        priceLabel: formatCurrency(resolvedNailDetail?.price ?? 0),
        canViewProcedures: Boolean(bookingItemId),
      });
    }

    return rows;
  });

  const groupedRows = [];
  const map = new Map();

  rawRows.forEach((row) => {
    const key = `${row.detailLabel}_${row.name}_${row.priceLabel}_${row.durationLabel}`;
    if (!map.has(key)) {
      const copy = { ...row };
      map.set(key, copy);
      groupedRows.push(copy);
    } else {
      map.get(key).quantity += row.quantity;
    }
  });

  return groupedRows;
}

function buildNailServiceSessionBreakdown(items = []) {
  const normalizedItems = Array.isArray(items) ? items : [];

  const rawItems = normalizedItems
    .map((item, index) => {
      const name = String(item?.nailVariantName || item?.customerNailName || "").trim();

      if (!name) {
        return null;
      }

      const duration = parseDurationMinutes(
        item?.duration || item?.serviceDuration || item?.estimatedDuration || 0,
      );
      const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;
      const price = Number(item?.price || item?.finalPrice || 0);

      return {
        id: String(item?.bookingItemId || item?.id || `${name}-${index}`).trim(),
        name,
        duration,
        durationLabel: formatDurationMinutes(duration),
        quantity,
        priceLabel: formatCurrency(price),
      };
    })
    .filter(Boolean);

  const grouped = [];
  const map = new Map();
  rawItems.forEach((row) => {
    const key = `${row.name}_${row.priceLabel}_${row.durationLabel}`;
    if (!map.has(key)) {
      const copy = { ...row };
      map.set(key, copy);
      grouped.push(copy);
    } else {
      map.get(key).quantity += row.quantity;
    }
  });

  return grouped;
}

function buildPriceSummaryRows(items = [], discounts = []) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const normalizedDiscounts = Array.isArray(discounts) ? discounts : [];

  return {
    serviceRows: normalizedItems
      .map((item, index) => {
        const name = String(item?.serviceName || "").trim();

        if (!name) {
          return null;
        }

        const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;

        return {
          id: `service-${item?.bookingItemId || item?.id || index}`,
          category: "Service",
          label: name,
          amount: formatCurrency(item?.price || item?.finalPrice || 0),
        };
      })
      .filter(Boolean),
    nailRows: normalizedItems
      .map((item, index) => {
        const name = String(item?.nailVariantName || item?.customerNailName || "").trim();

        if (!name) {
          return null;
        }

        const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;

        return {
          id: `nail-${item?.bookingItemId || item?.id || index}`,
          category: "Nail Service",
          label: name,
          amount: formatCurrency(item?.price || item?.finalPrice || 0),
        };
      })
      .filter(Boolean),
    discountRows: normalizedDiscounts
      .map((item, index) => ({
        id: `discount-${index}`,
        category: "Discount",
        label: String(item?.name || item?.type || `Discount ${index + 1}`).trim(),
        meta: String(item?.type || "").trim() || null,
        amount: `-${formatCurrency(Math.abs(Number(item?.amount || 0)))}`,
      }))
      .filter(Boolean),
  };
}

export function buildStaffServiceSessionPayload(booking, options = {}) {
  const customerDetail = options.customerDetail ?? null;
  const items = booking?.bookingItems ?? [];
  const bookingItemIds = [
    ...new Set(
      items
        .map((item) => String(item?.bookingItemId || item?.id || "").trim())
        .filter(Boolean),
    ),
  ];
  const serviceNames = [...new Set(items.map((item) => String(item?.serviceName || "").trim()).filter(Boolean))];
  const variantNames = [...new Set(items.map((item) => String(item?.nailVariantName || "").trim()).filter(Boolean))];
  const firstNamedItem = items.find((item) => item.serviceName || item.customerNailName || item.nailVariantName);
  const serviceLabel =
    serviceNames.length ? serviceNames.join("\n") :
      booking?.service ||
      booking?.uiService ||
      firstNamedItem?.customerNailName ||
      firstNamedItem?.nailVariantName ||
      "--";
  const currentProcessLabel = [
    serviceNames.length ? serviceNames.join(" | ") : "",
    variantNames[0] || "",
  ].filter(Boolean).join(" | ");
  const estimatedDuration =
    booking?.duration ||
    (booking?.totalDuration ? formatDurationMinutes(booking.totalDuration) : "--");
  const serviceBreakdown = buildServiceSessionBreakdown(items, options);
  const nailServiceBreakdown = buildNailServiceSessionBreakdown(items);
  const priceSummary = buildPriceSummaryRows(items, booking?.discounts);
  const appointmentStartTime = booking?.bookingTime || formatTimeValue(booking?.startTime);
  const estimatedFinishTime = formatAppointmentEndTime(appointmentStartTime, booking?.totalDuration || booking?.duration);
  const totalPriceLabel =
    booking?.totalPriceLabel ||
    booking?.total ||
    formatCurrency(booking?.totalPrice);

  return {
    bookingCode: formatBookingCode(booking?.bookingId),
    bookingItemId:
      firstNamedItem?.bookingItemId ||
      firstNamedItem?.id ||
      items[0]?.bookingItemId ||
      items[0]?.id ||
      "",
    bookingItemIds,
    customerName:
      customerDetail?.fullName ||
      booking?.customerName ||
      "--",
    customerPhone:
      customerDetail?.phone ||
      booking?.customerPhone ||
      "--",
    customerAvatar:
      customerDetail?.avatarUrl ||
      booking?.customerAvatar ||
      booking?.avatarUrl ||
      "",
    serviceLabel,
    serviceBreakdown,
    nailServiceBreakdown,
    priceSummary,
    staffArtist: booking?.artistName || booking?.staffName,
    chair: "--",
    appointmentTime: appointmentStartTime,
    estimatedDuration: estimatedFinishTime,
    estimatedFinishTime,
    completedAt: "--",
    designName: variantNames[0],
    totalPrice: totalPriceLabel,
    totalAmount: totalPriceLabel,
    originalServicePrice: totalPriceLabel,
    extraServiceFee: "0 VND",
    discountLabel: "Discount",
    discountValue: "0 VND",
    remainingBalance: totalPriceLabel,
    beforePhotoTimestamp: "--",
    currentProcess: currentProcessLabel,
    remainingTime: estimatedDuration,
    materialsUsed: serviceNames.length ? serviceNames : ["--"],
    stepNote: "",
    customerNotes: [],
    backRoute: options.backRoute || "",
    designUpdateRoute: options.designUpdateRoute || "",
    confirmations: [
      "Customer identity confirmed",
      "Service design confirmed",
      "Price confirmed",
      "Before photo uploaded",
    ],
    started: false,
    completed: false,
  };
}

export function normalizeStaffBooking(booking) {
  const services = booking?.bookingItems?.map((item) => item.serviceName).filter(Boolean) ?? [];
  const previewImage =
    booking?.bookingItems?.find((item) => item.customerNailImageUrl)?.customerNailImageUrl ||
    booking?.checkInImageUrl ||
    booking?.checkOutImagesUrl ||
    "";

  return {
    ...booking,
    id: booking?.bookingId,
    uiId: formatBookingCode(booking?.bookingId),
    customerName: booking?.customerName || "Unknown customer",
    customerPhone: "--",
    branch: booking?.salonName,
    uiBranch: booking?.salonName,
    staffName: booking?.artistName,
    service: services[0],
    uiService: services[0],
    services,
    bookingDate: toDateInputValue(booking?.bookingDate),
    bookingDateValue: toDateInputValue(booking?.bookingDate),
    bookingDateTime: booking?.bookingDate || "",
    bookingTime: formatTimeValue(booking?.startTime),
    startTimeValue: booking?.startTime || "",
    duration: booking?.totalDuration ? formatDurationMinutes(booking.totalDuration) : "--",
    status: booking?.status || "Pending",
    uiStatus: booking?.status || "Pending",
    paymentStatus: "--",
    uiPayment: "--",
    total: formatCurrency(booking?.totalPrice),
    totalPriceValue: Number(booking?.totalPrice || 0),
    totalPriceLabel: formatCurrency(booking?.totalPrice),
    previewImage,
  };
}
