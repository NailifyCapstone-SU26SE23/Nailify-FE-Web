import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
    ChevronLeft,
    Plus,
    X,
    Save,
    AlertCircle,
    Check,
    ListChecks,
    CircleDot,
    Smartphone,
    Link2,
    RefreshCw,
    Sliders,
    GripVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfigProvider, Select } from "antd";
import { ROUTES } from "../../../../shared/constants/routes";
import {
    fetchQuizQuestions,
    updateQuizQuestion,
    fetchLinkedOptions
} from "../services/quizManagement";

const TYPE_OPTIONS = [
    { value: "SingleSelect", label: "Single Choice", hint: "Customer can select only one option" },
    { value: "MultiSelect", label: "Multiple Choice", hint: "Customer can select multiple options" }
];

const LINK_SOURCE_OPTIONS = [
    { value: "NailShape", label: "Nail Shape", hint: "Pick from the NailShape list — IDs used to score shape matches" },
    { value: "NailSurface", label: "Nail Surface", hint: "Pick from the NailSurface list — IDs used to score surface matches" },
    { value: "Color", label: "Color", hint: "Assign color hex codes to recommend shade matches" },
    { value: "Category", label: "Category", hint: "Pick from Categories (grouped by Category Type)" }
];

const antdPinkTheme = {
    token: {
        colorPrimary: "#ea4f93",
        borderRadius: 16,
        controlHeight: 44
    }
};

export function UpdateQuiz() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isSavingQuiz, setIsSavingQuiz] = useState(false);

    // Question form state
    const [formData, setFormData] = useState({
        questionText: "",
        type: "SingleSelect",
        categoryKey: "Style",
        optionSource: "Category",
        status: "Active",
        choices: []
    });

    const [formErrors, setFormErrors] = useState({});
    const [previewSelected, setPreviewSelected] = useState([]);
    const [notification, setNotification] = useState(null);

    const [linkedOptions, setLinkedOptions] = useState([]);
    const [linkedLoading, setLinkedLoading] = useState(false);
    const [linkedError, setLinkedError] = useState(null);

    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Load initial question details
    useEffect(() => {
        let cancelled = false;
        const loadQuestionData = async () => {
            setIsLoading(true);
            try {
                const allQuestions = await fetchQuizQuestions();
                const q = allQuestions.find((item) => item.id === id);
                if (!q) {
                    showNotification("Question not found.", "error");
                    return;
                }

                if (!cancelled) {
                    let deducedSource = "Category";
                    if (q.categoryKey === "Shape") deducedSource = "NailShape";
                    else if (q.categoryKey === "Complexity") deducedSource = "NailSurface";
                    else if (q.categoryKey === "Color") deducedSource = "Color";
                    else deducedSource = "Category";

                    setFormData({
                        questionText: q.questionText,
                        type: q.type,
                        categoryKey: q.categoryKey || "Style",
                        optionSource: deducedSource,
                        status: q.status || "Active",
                        choices: q.choices || []
                    });
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    showNotification(err instanceof Error ? err.message : "Failed to load question details.", "error");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void loadQuestionData();
        return () => {
            cancelled = true;
        };
    }, [id]);

    // Fetch reference list when answer source changes
    useEffect(() => {
        if (!formData.optionSource) {
            setLinkedOptions([]);
            setLinkedError(null);
            return;
        }
        let cancelled = false;
        setLinkedLoading(true);
        setLinkedError(null);
        fetchLinkedOptions(formData.optionSource)
            .then((items) => {
                if (!cancelled) setLinkedOptions(items || []);
            })
            .catch((err) => {
                if (!cancelled) {
                    setLinkedOptions([]);
                    setLinkedError(err instanceof Error ? err.message : "Could not load the linked data list.");
                }
            })
            .finally(() => {
                if (!cancelled) setLinkedLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [formData.optionSource]);

    useEffect(() => {
        if (formData.optionSource === "Color") {
            setFormData((prev) => {
                const updatedChoices = prev.choices.map((c) => ({
                    ...c,
                    optionValues: c.optionValues && c.optionValues.length ? c.optionValues : ["#ffffff"]
                }));
                return { ...prev, categoryKey: "Color", choices: updatedChoices };
            });
        } else if (formData.optionSource === "NailShape") {
            setFormData((prev) => ({ ...prev, categoryKey: "Shape" }));
        } else if (formData.optionSource === "NailSurface") {
            setFormData((prev) => ({ ...prev, categoryKey: "Complexity" }));
        }
    }, [formData.optionSource]);

    const categoryTypeChoices = useMemo(() => {
        if (formData.optionSource !== "Category") return [];
        return Array.from(new Set(linkedOptions.map((o) => o.groupLabel).filter(Boolean)));
    }, [formData.optionSource, linkedOptions]);

    useEffect(() => {
        if (formData.optionSource !== "Category") return;
        if (categoryTypeChoices.length === 0) return;
        if (!categoryTypeChoices.includes(formData.categoryKey)) {
            setFormData((prev) => ({ ...prev, categoryKey: categoryTypeChoices[0] }));
        }
    }, [formData.optionSource, categoryTypeChoices]);

    const categoryFilteredOptions = useMemo(() => {
        if (formData.optionSource !== "Category") return linkedOptions;
        return linkedOptions.filter((o) => o.groupLabel === formData.categoryKey);
    }, [formData.optionSource, formData.categoryKey, linkedOptions]);

    // Form value changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
    };

    // Choices array edits (under core update settings)
    const handleChoiceFieldChange = (idx, field, value) => {
        setFormData((prev) => {
            const choices = [...prev.choices];
            choices[idx] = { ...choices[idx], [field]: value };
            return { ...prev, choices };
        });
        if (formErrors.choices) setFormErrors((prev) => ({ ...prev, choices: null }));
    };

    const handleChoiceManualValueChange = (idx, value) => {
        setFormData((prev) => {
            const choices = [...prev.choices];
            choices[idx] = { ...choices[idx], optionValues: value ? [value] : [] };
            return { ...prev, choices };
        });
        if (formErrors.choices) setFormErrors((prev) => ({ ...prev, choices: null }));
    };

    const handleChoiceOptionValueToggle = (idx, optionId) => {
        setFormData((prev) => {
            const choices = [...prev.choices];
            const current = choices[idx].optionValues || [];
            const nextValues = current.includes(optionId)
                ? current.filter((v) => v !== optionId)
                : [...current, optionId];
            choices[idx] = { ...choices[idx], optionValues: nextValues };
            return { ...prev, choices };
        });
        if (formErrors.choices) setFormErrors((prev) => ({ ...prev, choices: null }));
    };

    const handleAddChoice = () => {
        setFormData((prev) => ({
            ...prev,
            choices: [...prev.choices, { text: "", optionValues: [], description: "" }]
        }));
    };

    const handleRemoveChoice = (idx) => {
        if (formData.choices.length <= 2) {
            showNotification("A question needs at least two choices.", "error");
            return;
        }
        setFormData((prev) => ({
            ...prev,
            choices: prev.choices.filter((_, i) => i !== idx)
        }));
    };

    const handlePreviewSelectToggle = (choiceText) => {
        if (formData.type === "SingleSelect") {
            setPreviewSelected([choiceText]);
        } else {
            setPreviewSelected((prev) =>
                prev.includes(choiceText) ? prev.filter((t) => t !== choiceText) : [...prev, choiceText]
            );
        }
    };

    // Update core details + update/sync all options
    const handleUpdateQuizSubmit = async (e) => {
        e.preventDefault();
        const errors = {};

        if (!formData.questionText.trim()) {
            errors.questionText = "Please enter the question text";
        }

        const emptyLabelIdx = formData.choices.findIndex((c) => !c.text.trim());
        if (emptyLabelIdx !== -1) {
            errors.choices = "All choices must have a display label";
        } else if (formData.optionSource) {
            const missingValueIdx = formData.choices.findIndex(
                (c) => !(c.optionValues && c.optionValues.length)
            );
            if (missingValueIdx !== -1) {
                errors.choices = `All choices need at least one item selected from ${LINK_SOURCE_OPTIONS.find((o) => o.value === formData.optionSource)?.label
                    }`;
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            showNotification("Please check the missing fields.", "error");
            return;
        }

        setIsSavingQuiz(true);
        try {
            const updated = await updateQuizQuestion(id, formData);
            showNotification("Quiz question updated successfully!");
            setTimeout(() => navigate(ROUTES.adminQuiz), 1000);
        } catch (err) {
            console.error(err);
            showNotification(err instanceof Error ? err.message : "Failed to update quiz question.", "error");
        } finally {
            setIsSavingQuiz(false);
        }
    };

    const allChoicesForPreview = useMemo(() => {
        return [...(formData.choices || [])];
    }, [formData.choices]);

    const filledChoiceCount = useMemo(
        () => (formData.choices || []).filter((c) => c.text.trim()).length,
        [formData.choices]
    );

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-[#8c7484]">
                <RefreshCw className="h-8 w-8 animate-spin text-[#ea4f93]" />
                <p className="text-xs font-bold">Loading quiz details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#fffbfc] text-[#4b3c46] pb-16 pt-4">
            {/* Breadcrumb Header */}
            <div className="flex flex-col gap-4 border-b border-[#f5e3ed] pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <Link
                        to={ROUTES.adminQuiz}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c95b90] transition hover:text-[#d14c84]"
                    >
                        <ChevronLeft size={13} strokeWidth={2.5} /> Back to Quiz Management
                    </Link>
                    <h1 className="mt-2.5  text-[2rem] leading-tight text-[#3f2034] md:text-[2.4rem]">
                        Update Quiz Question
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8c7484]">
                        Modify the core question properties or update its answer choices list. Changes will update the recommender system immediately.
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#f3cade] bg-white px-4 py-2 text-[11px] font-bold text-[#a6869a] shrink-0">
                    <ListChecks size={14} className="text-[#ea4f93]" />
                    {filledChoiceCount}/{formData.choices.length} choices filled
                </div>
            </div>

            {/* Body */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
                {/* FORMS CONTAINER */}
                <div className="lg:col-span-7">
                    {/* Update Quiz Settings & Choices Form */}
                    <form onSubmit={handleUpdateQuizSubmit} className="rounded-[2rem] border border-white/60 bg-white/60 p-7 shadow-[0_16px_40px_-16px_rgba(224,188,206,0.35)] backdrop-blur-md space-y-6 transition-all duration-300 hover:shadow-[0_24px_48px_-12px_rgba(234,79,147,0.2)] hover:bg-white/80">
                        <header className="flex items-center justify-between border-b border-[#fcecf4] pb-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#fff0f6] text-xs font-bold text-[#ea4f93] shadow-[0_4px_10px_rgba(234,79,147,0.15)]">
                                    <Sliders size={14} />
                                </span>
                                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#3f2034]">
                                    Quiz Settings & Answer Choices
                                </h2>
                            </div>
                            <span className="rounded-full bg-[#fdf5f9] border border-[#fbcce0] px-3 py-1 text-[10px] font-extrabold text-[#ea4f93] uppercase">
                                Core Update Settings
                            </span>
                        </header>

                        {/* Section A: Core Settings */}
                        <div className="space-y-5">
                            {/* Question Text */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="questionText" className="text-[11px] font-bold uppercase tracking-wide text-[#7a6473]">
                                    Question Text
                                </label>
                                <textarea
                                    id="questionText"
                                    name="questionText"
                                    value={formData.questionText}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Which nail style do you like most?"
                                    rows={2}
                                    className={`w-full resize-none rounded-2xl border bg-[#fffbfc] p-3.5 text-[13px] text-[#4b3345] outline-none transition ${formErrors.questionText
                                        ? "border-[#d14c84] focus:border-[#d14c84]"
                                        : "border-[#f0dde8] focus:border-[#ea4f93]"
                                        }`}
                                />
                                {formErrors.questionText && (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#d14c84]">
                                        <AlertCircle size={12} /> {formErrors.questionText}
                                    </span>
                                )}
                            </div>

                            {/* Answer Type */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-[#7a6473]">
                                    Answer Selection Type
                                </span>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {TYPE_OPTIONS.map((opt) => {
                                        const active = formData.type === opt.value;
                                        return (
                                            <button
                                                type="button"
                                                key={opt.value}
                                                onClick={() => handleFormChange({ target: { name: "type", value: opt.value } })}
                                                className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-all ${active
                                                    ? "border-[#ea4f93] bg-[#fff0f6] shadow-sm"
                                                    : "border-[#f0dde8] bg-[#fffbfc] hover:border-[#f0b8d3]"
                                                    }`}
                                            >
                                                <CircleDot
                                                    size={15}
                                                    className={`mt-0.5 shrink-0 ${active ? "text-[#ea4f93]" : "text-[#c9a7be]"}`}
                                                />
                                                <span>
                                                    <span className={`block text-[12px] font-extrabold ${active ? "text-[#c9376e]" : "text-[#4b3345]"}`}>
                                                        {opt.label}
                                                    </span>
                                                    <span className="block text-[10px] text-[#a6869a] mt-0.5 leading-tight">{opt.hint}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Linked Answer Source */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="optionSource" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#7a6473]">
                                    <Link2 size={12} className="text-[#ea4f93]" />
                                    Linked Answer Source
                                </label>
                                <ConfigProvider theme={antdPinkTheme}>
                                    <Select
                                        id="optionSource"
                                        value={formData.optionSource || undefined}
                                        placeholder="Select a linked answer source..."
                                        allowClear
                                        size="large"
                                        style={{ width: "100%" }}
                                        onChange={(value) =>
                                            handleFormChange({ target: { name: "optionSource", value: value || "" } })
                                        }
                                        options={LINK_SOURCE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                                    />
                                </ConfigProvider>
                            </div>

                            {/* Category Group */}
                            {formData.optionSource === "Category" && (
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="categoryKey" className="text-[11px] font-bold uppercase tracking-wide text-[#7a6473]">
                                        Category Group
                                    </label>
                                    <ConfigProvider theme={antdPinkTheme}>
                                        <Select
                                            id="categoryKey"
                                            value={formData.categoryKey || undefined}
                                            placeholder={linkedLoading ? "Loading category groups..." : "Select a category group..."}
                                            size="large"
                                            style={{ width: "100%" }}
                                            loading={linkedLoading}
                                            disabled={linkedLoading || categoryTypeChoices.length === 0}
                                            notFoundContent={linkedLoading ? "Loading..." : "No category groups found"}
                                            onChange={(value) =>
                                                handleFormChange({ target: { name: "categoryKey", value } })
                                            }
                                            options={categoryTypeChoices.map((typeName) => ({
                                                value: typeName,
                                                label: typeName
                                            }))}
                                        />
                                    </ConfigProvider>
                                </div>
                            )}

                            {/* Active Status */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="status" className="text-[11px] font-bold uppercase tracking-wide text-[#7a6473]">
                                    Status
                                </label>
                                <div className="flex rounded-full border border-[#f5d7e4] bg-white p-1 shrink-0 w-max">
                                    {["Active", "Inactive"].map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => handleFormChange({ target: { name: "status", value: opt } })}
                                            className={`rounded-full px-4 py-1 text-[11px] font-bold transition-all ${formData.status === opt
                                                ? "bg-[#ea4f93] text-white"
                                                : "text-[#8c6b81] hover:bg-[#fff0f6]"
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section B: Editable Answer Choices */}
                        <div className="border-t border-[#fcecf4] pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3f2034] flex items-center gap-1.5">
                                    <ListChecks size={14} className="text-[#ea4f93]" />
                                    Answer Choices
                                </h3>
                            </div>

                            {formErrors.choices && (
                                <div className="flex items-center gap-1.5 rounded-xl border border-[#ffe0e6] bg-[#fff0f3] p-3 text-[11px] font-bold text-[#d14c84]">
                                    <AlertCircle size={14} className="shrink-0" />
                                    {formErrors.choices}
                                </div>
                            )}

                            <div className="space-y-3">
                                {formData.choices.map((choice, idx) => (
                                    <div
                                        key={choice.id || idx}
                                        className="rounded-3xl border border-[#f0dde8] bg-[#fffbfc] overflow-hidden"
                                    >
                                        <div className="flex items-start gap-3 p-4">
                                            <GripVertical size={14} className="mt-2 shrink-0 text-[#d8c1cf]" />

                                            <div className="min-w-0 flex-1 space-y-2.5">
                                                {/* Label Input */}
                                                <input
                                                    type="text"
                                                    value={choice.text}
                                                    onChange={(e) => handleChoiceFieldChange(idx, "text", e.target.value)}
                                                    placeholder="Display label, e.g. Minimalist"
                                                    className="h-10 w-full rounded-xl border border-[#f0dde8] bg-white px-3.5 text-[12.5px] text-[#4b3345] outline-none transition focus:border-[#ea4f93]"
                                                    required
                                                />

                                                {/* Description Input */}
                                                <input
                                                    type="text"
                                                    value={choice.description || ""}
                                                    onChange={(e) => handleChoiceFieldChange(idx, "description", e.target.value)}
                                                    placeholder="Additional description (optional)"
                                                    className="h-10 w-full rounded-xl border border-[#f0dde8] bg-white px-3.5 text-[12px] text-[#4b3345] outline-none transition focus:border-[#ea4f93]"
                                                />

                                                {/* Linked Values Select / manual key override */}
                                                {!formData.optionSource ? null : formData.optionSource === "Color" ? (
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] font-bold uppercase tracking-wide text-[#a6869a]">
                                                            Choose Color Code
                                                        </label>
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="text"
                                                                value={choice.optionValues?.[0] || "#ffffff"}
                                                                onChange={(e) => handleChoiceManualValueChange(idx, e.target.value)}
                                                                placeholder="e.g. #FFC0CB"
                                                                className="h-10 w-full rounded-xl border border-[#f0dde8] bg-white pl-12 pr-3.5 font-mono text-[12.5px] text-[#4b3345] outline-none transition focus:border-[#ea4f93]"
                                                                required
                                                            />
                                                            <div className="absolute left-2.5 flex items-center justify-center">
                                                                <input
                                                                    type="color"
                                                                    value={choice.optionValues?.[0]?.startsWith("#") ? choice.optionValues[0] : "#ffffff"}
                                                                    onChange={(e) => handleChoiceManualValueChange(idx, e.target.value)}
                                                                    className="h-7 w-7 border-0 p-0 bg-transparent cursor-pointer rounded-lg overflow-hidden"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-[#f0dde8] bg-white p-2.5">
                                                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-[#a6869a]">
                                                            Link {LINK_SOURCE_OPTIONS.find((o) => o.value === formData.optionSource)?.label} values
                                                        </p>
                                                        {linkedLoading && (
                                                            <p className="text-[10px] text-[#a6869a]">Loading...</p>
                                                        )}
                                                        {linkedError && (
                                                            <p className="text-[10px] font-bold text-[#d14c84]">{linkedError}</p>
                                                        )}
                                                        {!linkedLoading && !linkedError && categoryFilteredOptions.length === 0 && (
                                                            <p className="text-[10px] text-[#a6869a]">No reference data available.</p>
                                                        )}
                                                        {!linkedLoading && !linkedError && categoryFilteredOptions.length > 0 && (
                                                            <div className="max-h-32 space-y-0.5 overflow-y-auto pr-1">
                                                                {categoryFilteredOptions.map((opt) => {
                                                                    const checked = (choice.optionValues || []).includes(opt.id);
                                                                    return (
                                                                        <label
                                                                            key={opt.id}
                                                                            className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[11px] text-[#4b3345] transition-colors hover:bg-[#fff0f6]"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={checked}
                                                                                onChange={() => handleChoiceOptionValueToggle(idx, opt.id)}
                                                                                className="h-3.5 w-3.5 accent-[#ea4f93]"
                                                                            />
                                                                            {opt.imageUrl && (
                                                                                <img
                                                                                    src={opt.imageUrl}
                                                                                    alt={opt.name}
                                                                                    className="h-4 w-4 shrink-0 rounded object-cover"
                                                                                />
                                                                            )}
                                                                            <span className="truncate">
                                                                                {opt.name}
                                                                                {formData.optionSource !== "Category" && opt.groupLabel
                                                                                    ? ` · ${opt.groupLabel}`
                                                                                    : ""}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {formData.choices.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveChoice(idx)}
                                                    className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#c9a7be] transition-colors hover:bg-[#fff0f3] hover:text-[#d14c84]"
                                                    title="Remove choice"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-start pt-2">
                                <button
                                    type="button"
                                    onClick={handleAddChoice}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#ea4f93]/40 bg-[#fff0f6]/50 py-4 text-xs font-bold text-[#ea4f93] transition-all duration-300 hover:border-[#ea4f93] hover:bg-[#fff0f6] hover:shadow-[0_8px_16px_rgba(234,79,147,0.12)] active:scale-[0.98]"
                                >
                                    <Plus size={13} /> Add Choice
                                </button>
                            </div>
                        </div>

                        {/* Submit entire Quiz + Options updates */}
                        <div className="mt-8 border-t border-[#fcecf4] pt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSavingQuiz}
                                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ea4f93] to-[#ff7eb3] px-8 text-sm font-bold text-white shadow-[0_12px_24px_rgba(234,79,147,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_16px_32px_rgba(234,79,147,0.4)] active:scale-95 disabled:opacity-50"
                            >
                                {isSavingQuiz ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                        </svg>
                                        Saving Quiz & choices...
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} strokeWidth={2.5} />
                                        Update Quiz Question
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* PREVIEW CONTAINER */}
                <div className="lg:col-span-5 lg:sticky lg:top-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[#3f2034]">
                        <Smartphone size={15} className="text-[#ea4f93]" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em]">App Live Preview</h3>
                    </div>

                    <div className="relative mx-auto w-full max-w-[300px] rounded-[2.75rem] border-[8px] border-[#321c29] bg-[#321c29] p-1.5 shadow-[0_28px_56px_-18px_rgba(50,28,41,0.4)]">
                        <div className="absolute left-1/2 top-2.5 z-10 h-3.5 w-24 -translate-x-1/2 rounded-full bg-[#321c29]" />
                        <div className="flex min-h-[480px] flex-col justify-between rounded-[2.25rem] bg-white p-5 pt-8">
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-[#a6869a]">
                                        <span>Style Analysis Step</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full ${i <= 1 ? "bg-[#ea4f93]" : "bg-[#f5e3ed]"}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className="rounded-full bg-[#fff0f6] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ea4f93]">
                                        {formData.categoryKey || "Diagnostic"}
                                    </span>
                                    <h4 className="mt-2.5  text-[16px] leading-snug text-[#3f2034]">
                                        {formData.questionText.trim() || "What nail style do you prefer?"}
                                    </h4>
                                    <p className="mt-1 text-[10.5px] text-[#8e7987]">
                                        {formData.type === "SingleSelect" ? "Select one option below." : "You can select multiple options."}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {allChoicesForPreview.map((choice, idx) => {
                                        const labelText = choice.text.trim() || `Option ${idx + 1}`;
                                        const isSelected = previewSelected.includes(labelText);
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handlePreviewSelectToggle(labelText)}
                                                className={`flex w-full items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all ${isSelected
                                                    ? "border-[#ea4f93] bg-[#fff8fb] shadow-sm"
                                                    : "border-[#f0eef1] bg-[#fafafb] hover:border-[#f0b8d3]"
                                                    }`}
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className={`block truncate text-[11px] font-bold ${isSelected ? "text-[#ea4f93]" : "text-[#4b3c46]"}`}>
                                                        {labelText}
                                                    </span>
                                                    {choice.description?.trim() && (
                                                        <span className="block truncate text-[9px] text-[#8c7484] mt-0.5">
                                                            {choice.description.trim()}
                                                        </span>
                                                    )}
                                                </span>
                                                {isSelected ? (
                                                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ea4f93] text-white">
                                                        <Check size={9} strokeWidth={3} />
                                                    </div>
                                                ) : (
                                                    <div className="h-4 w-4 shrink-0 rounded-full border border-[#dcd3d9]" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="mt-4 flex h-10 items-center justify-center rounded-xl bg-[#3f2034] text-[11px] font-bold text-white transition-opacity active:opacity-90"
                            >
                                Continue
                            </button>
                        </div>
                    </div>

                    <p className="mx-auto max-w-[260px] text-center text-[10.5px] leading-relaxed text-[#a6869a]">
                        Live preview updates in real time as you edit the form on the left.
                    </p>
                </div>
            </div>

            {/* Premium Toast Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -30, scale: 0.92, rotateX: -10 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, y: -20, scale: 0.92, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        style={{ perspective: 1000 }}
                        className="fixed top-6 right-6 z-50 flex w-[320px] items-start gap-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-[0_20px_40px_-15px_rgba(234,79,147,0.25)] backdrop-blur-xl"
                    >
                        <div className="absolute top-0 bottom-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#ea4f93] to-[#d14c84]" />

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fff0f6] text-[#ea4f93] shadow-sm">
                            {notification.type === "error" ? (
                                <AlertCircle size={16} strokeWidth={2.5} />
                            ) : (
                                <Check size={16} strokeWidth={2.5} />
                            )}
                        </div>

                        <div className="flex-1 space-y-0.5 pr-2">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#3f2034]">
                                {notification.type === "error" ? "System Error" : "Success"}
                            </h4>
                            <p className="text-[11.5px] leading-normal text-[#695463]">
                                {notification.message}
                            </p>
                        </div>

                        {/* Progress Bar timer */}
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 3, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-0.5 bg-[#ea4f93]"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default UpdateQuiz;
