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

function normalizeDescription(description) {
  return String(description || "").trim();
}

export function normalizeAdminSkillType(skillType) {
  const description = normalizeDescription(skillType?.description);

  return {
    id: String(skillType?.skillTypeId || "").trim(),
    skillTypeId: String(skillType?.skillTypeId || "").trim(),
    name: String(skillType?.name || "").trim() || "--",
    description,
    descriptionPreview: description || "No description",
    status: String(skillType?.status || "").trim() || "--",
    initials: String(skillType?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

function buildSkillTypePayload(formValues) {
  return {
    name: String(formValues?.name || "").trim(),
    description: normalizeDescription(formValues?.description),
  };
}

export async function fetchAdminSkillTypes({
  pageNumber = 1,
  pageSize = 10,
  name = "",
} = {}) {
  const response = await axiosClient.get("/SkillTypes", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      name: name || undefined,
    },
  });

  const data = unwrapResponse(response, "Failed to load skill types.");
  const items = Array.isArray(data?.items) ? data.items.map(normalizeAdminSkillType) : [];

  return {
    items,
    metaData: normalizeMetaData(data?.metaData, { pageNumber, pageSize }),
  };
}

export async function fetchAdminSkillTypeDetail(skillTypeId) {
  const normalizedSkillTypeId = String(skillTypeId || "").trim();

  if (!normalizedSkillTypeId) {
    throw new Error("Skill type ID is required.");
  }

  const response = await axiosClient.get(`/SkillTypes/${normalizedSkillTypeId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load skill type detail.");
  return normalizeAdminSkillType(data);
}

export async function createAdminSkillType(formValues) {
  const response = await axiosClient.post("/SkillTypes", buildSkillTypePayload(formValues), {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to create skill type.");
  return normalizeAdminSkillType(data);
}

export async function updateAdminSkillType(skillTypeId, formValues) {
  const normalizedSkillTypeId = String(skillTypeId || "").trim();

  if (!normalizedSkillTypeId) {
    throw new Error("Skill type ID is required.");
  }

  const response = await axiosClient.put(`/SkillTypes/${normalizedSkillTypeId}`, buildSkillTypePayload(formValues), {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to update skill type.");
  return normalizeAdminSkillType(data);
}

export async function deleteAdminSkillType(skillTypeId) {
  const normalizedSkillTypeId = String(skillTypeId || "").trim();

  if (!normalizedSkillTypeId) {
    throw new Error("Skill type ID is required.");
  }

  const response = await axiosClient.delete(`/SkillTypes/${normalizedSkillTypeId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to delete skill type.");
}
