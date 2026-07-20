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
    console.error("Quiz API Error details:", error.response?.data || error);
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

export function normalizeQuizQuestion(q) {
    let category = q.categoryKey || q.category || "Style";
    if (category === "SkinTone") {
        category = "Skin Tone";
    }

    return {
        id: q.quizQuestionId || q.id,
        questionText: q.questionText || "",
        type: q.type === "single" || q.type === "SingleSelect" || q.type === "Single" ? "SingleSelect" : "MultiSelect",
        categoryKey: category,
        status: q.status || "Active",
        sortOrder: q.sortOrder || 1,
        choices: (q.options || q.choices || []).map(opt => {
            const optionValues = Array.isArray(opt.values)
                ? opt.values.map(String)
                : Array.isArray(opt.optionValues)
                    ? opt.optionValues.map(String)
                    : (opt.optionValue || opt.value ? [String(opt.optionValue || opt.value)] : []);
            return {
                id: opt.quizOptionId || opt.id,
                text: opt.label || opt.text || "",
                value: optionValues[0] || "", // kept for backward compatibility with older screens
                optionValues,
                description: opt.description || "",
                recommends: opt.recommends || []
            };
        })
    };
}

let mockShapes = [
    {
        id: "Almond",
        name: "Almond",
        description: "Elegant, tapered shape mimicking a natural almond. Maximizes finger length and provides a sophisticated look.",
        difficulty: "Medium",
        strengthLevel: "Moderate",
        rulesSummary: "Triggers on: Narrow nail beds, moderate to low hand activity, flexible or healthy nails."
    },
    {
        id: "Oval",
        name: "Oval",
        description: "Classic rounded look with straight sidewalls. Universally flattering and ideal for wider nail beds.",
        difficulty: "Low",
        strengthLevel: "Good",
        rulesSummary: "Triggers on: Wide/short beds, moderate hand activity, normal or thin natural nails."
    },
    {
        id: "Coffin",
        name: "Coffin / Ballerina",
        description: "Tapered straight shape flat at the tip resembling a coffin. Bold, modern, and excellent for acrylic styling.",
        difficulty: "High",
        strengthLevel: "High Required",
        rulesSummary: "Triggers on: Long nail preferences, low hand activity, strong nails, high salon upkeep."
    },
    {
        id: "Squoval",
        name: "Squoval",
        description: "Square base with soft, rounded corners. Extremely durable, practical, and highly resistant to chipping.",
        difficulty: "Low",
        strengthLevel: "Excellent",
        rulesSummary: "Triggers on: High manual activity, weak/thin nails, low maintenance interval."
    },
    {
        id: "Stiletto",
        name: "Stiletto",
        description: "Drastically pointed shape. Edgy, dramatic, and creates a striking visual statement. Requires extensions.",
        difficulty: "High",
        strengthLevel: "High Required",
        rulesSummary: "Triggers on: Narrow nail beds, low manual work, high maintenance, extensions active."
    }
];

export async function fetchQuizQuestions() {
    try {
        const response = await axiosClient.get("/Quizzes/questions", {
            headers: getAuthHeaders(),
        });
        const data = unwrapResponse(response, "Failed to load quiz questions.");
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        return items.map(normalizeQuizQuestion);
    } catch (e) {
        handleApiError(e, "Failed to load quiz questions.");
    }
}

const VALID_CATEGORIES = [
    "SkinTone",
    "Color",
    "Style",
    "Occasion",
    "Shape",
    "Complexity",
    "HandShape",
    "SkinShade"
];

function normalizeCategory(categoryKey, optionSource) {
    if (optionSource === "NailShape") return "Shape";
    if (optionSource === "NailSurface") return "Complexity";
    if (optionSource === "Color") return "Color";

    let key = categoryKey || "";
    if (key === "Theme") return "Occasion";
    if (key === "Skin Tone") return "SkinTone";

    const cleaned = key.replace(/\s+/g, "");
    const found = VALID_CATEGORIES.find(c => c.toLowerCase() === cleaned.toLowerCase());
    return found || "Style";
}

export async function createQuizQuestion(formData) {
    const quizCategory = normalizeCategory(formData.categoryKey, formData.optionSource);
    const quizType = formData.type === "SingleSelect" || formData.type === "single" || formData.type === "Single" ? "Single" : "Multiple";

    try {
        // 1. Create the question with questionText, type, and category as query params
        const response = await axiosClient.post(`/Quizzes/questions?type=${quizType}&category=${quizCategory}`, {
            questionText: formData.questionText.trim()
        }, {
            headers: getAuthHeaders(),
        });
        const createdQuestion = unwrapResponse(response, "Failed to create quiz question.");
        const questionId = createdQuestion.quizQuestionId || createdQuestion.id;
        if (!questionId) {
            throw new Error("Failed to retrieve created question ID.");
        }

        // 2. Add options one by one sequentially to avoid concurrency issues on backend
        let lastResponseData = null;
        for (const choice of formData.choices) {
            const label = choice.text.trim();
            const description = choice.description || "";
            const optionValues = (choice.optionValues && choice.optionValues.length)
                ? choice.optionValues.map(String)
                : [choice.value || choice.text.toLowerCase().replace(/\s+/g, '-')];

            const params = new URLSearchParams();
            params.append("label", label);
            params.append("description", description);
            optionValues.forEach(val => params.append("optionValues", val));

            const optResponse = await axiosClient.post(`/Quizzes/questions/${questionId}/options?${params.toString()}`, null, {
                headers: getAuthHeaders(),
            });
            lastResponseData = unwrapResponse(optResponse, `Failed to add option: ${label}`);
        }

        return lastResponseData ? normalizeQuizQuestion(lastResponseData) : normalizeQuizQuestion(createdQuestion);
    } catch (e) {
        handleApiError(e, "Failed to create quiz question.");
    }
}

export async function updateQuizQuestionCore(id, formData) {
    const quizCategory = normalizeCategory(formData.categoryKey, formData.optionSource);
    const quizType = formData.type === "SingleSelect" || formData.type === "single" || formData.type === "Single" ? "Single" : "Multiple";
    const isActive = formData.status !== "Inactive";

    try {
        const response = await axiosClient.put(`/Quizzes/questions/${id}?type=${quizType}&category=${quizCategory}`, {
            questionText: formData.questionText.trim(),
            isActive: isActive
        }, {
            headers: getAuthHeaders(),
        });
        const updatedQuestion = unwrapResponse(response, "Failed to update quiz question.");
        return normalizeQuizQuestion(updatedQuestion);
    } catch (e) {
        handleApiError(e, "Failed to update quiz question.");
    }
}

export async function addQuizQuestionOption(questionId, optionData) {
    try {
        const label = optionData.text.trim();
        const description = optionData.description || "";
        const optionValues = (optionData.optionValues && optionData.optionValues.length)
            ? optionData.optionValues.map(String)
            : [optionData.value || optionData.text.toLowerCase().replace(/\s+/g, '-')];

        const params = new URLSearchParams();
        params.append("label", label);
        params.append("description", description);
        optionValues.forEach(val => params.append("optionValues", val));

        const optResponse = await axiosClient.post(`/Quizzes/questions/${questionId}/options?${params.toString()}`, null, {
            headers: getAuthHeaders(),
        });
        const updatedQuestion = unwrapResponse(optResponse, `Failed to add option: ${label}`);
        return normalizeQuizQuestion(updatedQuestion);
    } catch (e) {
        handleApiError(e, "Failed to add answer option.");
    }
}

export async function updateQuizQuestion(id, formData) {
    const quizCategory = normalizeCategory(formData.categoryKey, formData.optionSource);
    const quizType = formData.type === "SingleSelect" || formData.type === "single" || formData.type === "Single" ? "Single" : "Multiple";
    const isActive = formData.status !== "Inactive";

    try {
        // 1. Fetch the existing question to get its current option IDs
        const questionsList = await fetchQuizQuestions();
        const existingQuestion = questionsList.find(q => q.id === id);
        const existingOptions = existingQuestion ? existingQuestion.choices : [];

        // 2. Update the core question details
        const response = await axiosClient.put(`/Quizzes/questions/${id}?type=${quizType}&category=${quizCategory}`, {
            questionText: formData.questionText.trim(),
            isActive: isActive
        }, {
            headers: getAuthHeaders(),
        });

        // 3. Delete existing options
        for (const opt of existingOptions) {
            if (opt.id) {
                await axiosClient.delete(`/Quizzes/options/${opt.id}`, {
                    headers: getAuthHeaders(),
                });
            }
        }

        // 4. Create new/modified options sequentially
        let lastResponseData = null;
        for (const choice of formData.choices) {
            const label = choice.text.trim();
            const description = choice.description || "";
            const optionValues = (choice.optionValues && choice.optionValues.length)
                ? choice.optionValues.map(String)
                : [choice.value || choice.text.toLowerCase().replace(/\s+/g, '-')];

            const params = new URLSearchParams();
            params.append("label", label);
            params.append("description", description);
            optionValues.forEach(val => params.append("optionValues", val));

            const optResponse = await axiosClient.post(`/Quizzes/questions/${id}/options?${params.toString()}`, null, {
                headers: getAuthHeaders(),
            });
            lastResponseData = unwrapResponse(optResponse, `Failed to add option: ${label}`);
        }

        return lastResponseData ? normalizeQuizQuestion(lastResponseData) : normalizeQuizQuestion(unwrapResponse(response));
    } catch (e) {
        handleApiError(e, "Failed to update quiz question.");
    }
}

export async function deleteQuizQuestion(id) {
    try {
        await axiosClient.delete(`/Quizzes/questions/${id}`, {
            headers: getAuthHeaders(),
        });
        return true;
    } catch (e) {
        handleApiError(e, "Failed to delete quiz question.");
    }
}

// --- Linked reference data ---------------------------------------------
// Lets the quiz-creation UI let admins pick real DB records (nail shapes,
// nail surfaces, categories) as option values instead of typing free text.

export async function fetchCategoryTypes(params = {}) {
    try {
        const response = await axiosClient.get("/CategoryTypes", {
            headers: getAuthHeaders(),
            params: { pageSize: 200, ...params },
        });
        const data = unwrapResponse(response, "Failed to load category types.");
        return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    } catch (e) {
        handleApiError(e, "Failed to load category types.");
    }
}

// CategoryTypes returns a nested structure (each type has a `categories`
// array). The actual selectable answer is a `category`, so flatten here.
export async function fetchCategoryOptions(params = {}) {
    const types = (await fetchCategoryTypes(params)) || [];
    return types.flatMap((t) =>
        (t.categories || []).map((c) => ({
            id: String(c.categoryId),
            name: c.name,
            groupLabel: c.categoryTypeName || t.name,
        }))
    );
}

export async function fetchNailShapes(params = {}) {
    try {
        const response = await axiosClient.get("/NailShapes", {
            headers: getAuthHeaders(),
            params: { pageSize: 200, ...params },
        });
        const data = unwrapResponse(response, "Failed to load nail shapes.");
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        return items.map((s) => ({
            id: String(s.nailShapeId),
            name: s.name,
            imageUrl: s.imageUrl || null,
        }));
    } catch (e) {
        handleApiError(e, "Failed to load nail shapes.");
    }
}

export async function fetchNailSurfaces(params = {}) {
    try {
        const response = await axiosClient.get("/NailSurfaces", {
            headers: getAuthHeaders(),
            params: { pageSize: 200, ...params },
        });
        const data = unwrapResponse(response, "Failed to load nail surfaces.");
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        return items.map((s) => ({
            id: String(s.nailSurfaceId),
            name: s.name,
        }));
    } catch (e) {
        handleApiError(e, "Failed to load nail surfaces.");
    }
}

// Single entry point the UI calls — pass the selected "optionSource" and get
// back a normalized [{ id, name, imageUrl?, groupLabel? }] list.
export async function fetchLinkedOptions(source) {
    switch (source) {
        case "NailShape":
            return fetchNailShapes();
        case "NailSurface":
            return fetchNailSurfaces();
        case "Category":
            return fetchCategoryOptions();
        default:
            return [];
    }
}

export async function fetchDiagnosticShapes() {
    return [...mockShapes];
}

export async function updateDiagnosticShape(id, data) {
    mockShapes = mockShapes.map(s => {
        if (s.id === id) {
            return { ...s, ...data };
        }
        return s;
    });
    return mockShapes.find(s => s.id === id);
}