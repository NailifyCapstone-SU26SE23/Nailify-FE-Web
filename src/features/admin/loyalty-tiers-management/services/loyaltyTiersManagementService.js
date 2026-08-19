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
    if (payload && typeof payload === "object" && "isSucceeded" in payload) {
        if (!payload.isSucceeded) {
            throw new Error(payload.message || fallbackMessage);
        }
        return payload.data;
    }
    return response?.data ?? response;
}

function handleApiError(error, defaultMessage) {
    console.error("API Error details:", error.response?.data || error);
    const data = error.response?.data;
    if (data) {
        if (typeof data === "string") {
            throw new Error(data);
        }
        if (data.message) {
            throw new Error(data.message);
        }
        if (data.errors) {
            const messages = [];
            for (const key in data.errors) {
                if (Array.isArray(data.errors[key])) {
                    messages.push(`${key}: ${data.errors[key].join(", ")}`);
                } else {
                    messages.push(`${key}: ${data.errors[key]}`);
                }
            }
            if (messages.length > 0) {
                throw new Error(messages.join(" | "));
            }
        }
        if (data.title) {
            throw new Error(data.title);
        }
    }
    throw new Error(error.message || defaultMessage);
}

export function normalizeLoyaltyTier(tier) {
    let colors = { primary: "#D48138", gradientStart: "#D48138", gradientEnd: "#A86F3C" };

    if (tier?.colorJson) {
        try {
            colors = typeof tier.colorJson === "string" ? JSON.parse(tier.colorJson) : tier.colorJson;
        } catch (e) {
            console.warn("Failed to parse colorJson:", e);
        }
    } else if (tier?.backgroundColor) {
        colors = {
            primary: tier.backgroundColor,
            gradientStart: tier.backgroundColor,
            gradientEnd: tier.backgroundColor,
        };
    }

    return {
        id: String(tier?.loyaltyTierId ?? tier?.id ?? ""),
        loyaltyTierId: Number(tier?.loyaltyTierId ?? tier?.id ?? 0),
        name: String(tier?.name),
        description: String(tier?.description || ""),
        minLifetimePoints: Number(tier?.minLifetimePoints ?? 0),
        maxLifetimePoints: Number(tier?.maxLifetimePoints ?? 0),
        discountRate: Number(tier?.discountRate ?? 0),
        imageUrl: String(tier?.imageUrl || ""),
        backgroundColor: String(tier?.backgroundColor || colors.primary || "#D48138"),
        textColor: String(tier?.textColor || "#FFFFFF"),
        colorJson: typeof tier?.colorJson === "string" ? tier.colorJson : JSON.stringify(colors),
        parsedColors: colors,
        status: tier?.status
            ? String(tier.status).toLowerCase() === "active" || tier.status === true
                ? "Active"
                : "Inactive"
            : "Active",
        sortOrder: Number(tier?.sortOrder ?? 1),
    };
}

export async function fetchLoyaltyTiers() {
    try {
        const response = await axiosClient.get("/LoyaltyTiers", {
            headers: getAuthHeaders(),
        });

        const data = unwrapResponse(response, "Failed to load loyalty tiers.");
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        return items.map(normalizeLoyaltyTier);
    } catch (e) {
        handleApiError(e, "Failed to load loyalty tiers.");
    }
}

export async function fetchLoyaltyTierDetail(id) {
    try {
        const response = await axiosClient.get(`/LoyaltyTiers/${id}`, {
            headers: getAuthHeaders(),
        });

        const data = unwrapResponse(response, "Failed to load loyalty tier detail.");
        return normalizeLoyaltyTier(data);
    } catch (e) {
        handleApiError(e, "Failed to load loyalty tier detail.");
    }
}

export async function createLoyaltyTier(formData) {
    const colors = {
        primary: formData.backgroundColor || "#D48138",
        gradientStart: formData.backgroundColor || "#D48138",
        gradientEnd: formData.backgroundColor || "#D48138",
    };

    const fData = new FormData();
    fData.append("Name", String(formData.name).trim());
    fData.append("Description", String(formData.description || "").trim());
    fData.append("MinLifetimePoints", Number(formData.minLifetimePoints));
    fData.append("MaxLifetimePoints", Number(formData.maxLifetimePoints));
    fData.append("DiscountRate", Number(formData.discountRate));
    fData.append("BackgroundColor", String(formData.backgroundColor || "#D48138").trim());
    fData.append("TextColor", String(formData.textColor || "#FFFFFF").trim());
    fData.append("ColorJson", JSON.stringify(colors));
    fData.append("SortOrder", Number(formData.sortOrder || 1));

    // FIX #1: re-added Status on create.
    // Hypothesis: the Status column on the backend entity is a non-nullable
    // enum. When this field was omitted, ASP.NET Core model binding defaulted
    // it to 0, which may not map to a valid enum member (Active/Inactive
    // usually start at 1), causing SaveChangesAsync to throw a DbUpdateException
    // with the generic "error occurred while saving the entity changes" message
    // seen in the 400 response. Swagger likely worked because it always submits
    // an explicit value for every field, including Status.
    // If this turns out to be wrong (e.g. backend truly rejects Status on
    // create), remove this line again.
    fData.append("Status", String(formData.status || "Active").trim());

    // FIX #2: aligned image field casing with the rest of the payload
    // ("Image" instead of "image"). All other fields use PascalCase matching
    // the backend model; "image" was the one inconsistent key. Unlikely to be
    // the root cause (ASP.NET Core form binding is usually case-insensitive),
    // but worth eliminating as a variable while testing FIX #1.
    if (formData.imageFile instanceof File) {
        fData.append("Image", formData.imageFile);
    } else if (formData.imageUrl && !formData.imageUrl.startsWith("blob:") && !formData.imageUrl.startsWith("data:")) {
        fData.append("ImageUrl", String(formData.imageUrl).trim());
    }

    try {
        const response = await axiosClient.post("/LoyaltyTiers", fData, {
            headers: {
                ...getAuthHeaders(),
                // IMPORTANT: do NOT hardcode "multipart/form-data" here.
                // Axios/the browser must generate this header itself so it can
                // append the required "boundary=..." parameter. A hardcoded
                // value without a boundary produces a malformed multipart body
                // that the server can't parse — every field will look "missing"
                // even though the form was filled in correctly.
                "Content-Type": undefined,
            },
        });

        const data = unwrapResponse(response, "Failed to create loyalty tier.");
        return normalizeLoyaltyTier(data);
    } catch (e) {
        handleApiError(e, "Failed to create loyalty tier.");
    }
}

export async function updateLoyaltyTier(id, formData) {
    const colors = {
        primary: formData.backgroundColor || "#D48138",
        gradientStart: formData.backgroundColor || "#D48138",
        gradientEnd: formData.backgroundColor || "#D48138",
    };

    const fData = new FormData();
    fData.append("LoyaltyTierId", Number(id));
    fData.append("Name", String(formData.name).trim());
    fData.append("Description", String(formData.description || "").trim());
    fData.append("MinLifetimePoints", Number(formData.minLifetimePoints));
    fData.append("MaxLifetimePoints", Number(formData.maxLifetimePoints));
    fData.append("DiscountRate", Number(formData.discountRate));
    fData.append("BackgroundColor", String(formData.backgroundColor || "#D48138").trim());
    fData.append("TextColor", String(formData.textColor || "#FFFFFF").trim());
    fData.append("ColorJson", JSON.stringify(colors));
    fData.append("Status", String(formData.status).trim());
    fData.append("SortOrder", Number(formData.sortOrder || 1));

    // Same casing fix as createLoyaltyTier, for consistency.
    if (formData.imageFile instanceof File) {
        fData.append("Image", formData.imageFile);
    } else if (formData.imageUrl && !formData.imageUrl.startsWith("blob:") && !formData.imageUrl.startsWith("data:")) {
        fData.append("ImageUrl", String(formData.imageUrl).trim());
    }

    try {
        const response = await axiosClient.put(`/LoyaltyTiers/${id}`, fData, {
            headers: {
                ...getAuthHeaders(),
                // Same fix as createLoyaltyTier: let axios generate the
                // multipart boundary itself instead of overriding it.
                "Content-Type": undefined,
            },
        });

        const data = unwrapResponse(response, "Failed to update loyalty tier.");
        return normalizeLoyaltyTier(data);
    } catch (e) {
        handleApiError(e, "Failed to update loyalty tier.");
    }
}

export async function deleteLoyaltyTier(id) {
    try {
        const response = await axiosClient.delete(`/LoyaltyTiers/${id}`, {
            headers: getAuthHeaders(),
        });

        return unwrapResponse(response, "Failed to delete loyalty tier.");
    } catch (e) {
        handleApiError(e, "Failed to delete loyalty tier.");
    }
}