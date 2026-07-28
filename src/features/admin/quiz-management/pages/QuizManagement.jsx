import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import {
    HelpCircle,
    Plus,
    Search,
    Trash2,
    Edit3,
    Check,
    AlertCircle,
    X,
    RefreshCw,
    Power,
    Sliders,
    Layers,
    FileText,
    TrendingUp,
    Sparkles,
    CheckSquare,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    fetchQuizQuestions,
    createQuizQuestion,
    updateQuizQuestionCore,
    updateQuizQuestion,
    deleteQuizQuestion,
    fetchDiagnosticShapes,
    updateDiagnosticShape
} from "../services/quizManagement";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";

export function QuizManagement() {
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [shapes, setShapes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Drawer State
    const [isEditing, setIsEditing] = useState(false);
    const [activeQuestionId, setActiveQuestionId] = useState(null); // null means creating
    const [formData, setFormData] = useState({
        questionText: "",
        type: "SingleSelect",
        categoryKey: "Style",
        status: "Active",
        sortOrder: 1,
        choices: [
            { text: "", value: "", description: "", recommends: [] },
            { text: "", value: "", description: "", recommends: [] }
        ]
    });
    const [formErrors, setFormErrors] = useState({});

    // Selected Shape State (for viewing/editing recommendation details on the right panel)
    const [selectedShape, setSelectedShape] = useState(null);
    const [shapeEditData, setShapeEditData] = useState({ description: "", difficulty: "Medium", strengthLevel: "Moderate", rulesSummary: "" });
    const [isEditingShape, setIsEditingShape] = useState(false);

    // Notification State
    const [notification, setNotification] = useState(null);

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, questionText } | null
    const [isDeleting, setIsDeleting] = useState(false);

    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Load Data
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [qList, sList] = await Promise.all([
                fetchQuizQuestions(),
                fetchDiagnosticShapes()
            ]);
            setQuestions(qList || []);
            setShapes(sList || []);
            if (sList && sList.length > 0) {
                setSelectedShape(sList[0]);
                setShapeEditData({
                    description: sList[0].description,
                    difficulty: sList[0].difficulty,
                    strengthLevel: sList[0].strengthLevel,
                    rulesSummary: sList[0].rulesSummary
                });
            }
        } catch (err) {
            console.error(err);
            showNotification(err instanceof Error ? err.message : "Failed to load quiz details.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    // Filter logic
    const filteredQuestions = (questions || []).filter(q => {
        const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || q.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeQuestionsCount = (questions || []).filter(q => q.status === "Active").length;

    // Toggle Question Status
    const handleToggleStatus = async (id) => {
        const target = questions.find(q => q.id === id);
        if (!target) return;
        const nextStatus = target.status === "Active" ? "Inactive" : "Active";
        setIsLoading(true);
        try {
            const updated = await updateQuizQuestionCore(id, { ...target, status: nextStatus });
            setQuestions(prev => prev.map(q => q.id === id ? updated : q).sort((a, b) => a.sortOrder - b.sortOrder));
            showNotification(`Question status updated to ${nextStatus.toLowerCase()}`);
        } catch (err) {
            console.error(err);
            showNotification(err instanceof Error ? err.message : "Failed to update status.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Delete Question — open confirm modal
    const handleDeleteQuestion = (id) => {
        const target = questions.find(q => q.id === id);
        if (!target) return;
        setDeleteTarget({ id: target.id, questionText: target.questionText });
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteQuizQuestion(deleteTarget.id);
            setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id));
            showNotification("Question removed successfully.");
            if (activeQuestionId === deleteTarget.id) handleCancelForm();
        } catch (err) {
            console.error(err);
            showNotification(err instanceof Error ? err.message : "Failed to delete question.", "error");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleCancelDelete = () => {
        if (!isDeleting) setDeleteTarget(null);
    };


    // Start Create
    const handleStartCreate = () => {
        setIsEditing(true);
        setActiveQuestionId(null);
        setFormData({
            questionText: "",
            type: "SingleSelect",
            categoryKey: "Style",
            status: "Active",
            sortOrder: questions.length + 1,
            choices: [
                { text: "", value: "", description: "", recommends: [] },
                { text: "", value: "", description: "", recommends: [] }
            ]
        });
        setFormErrors({});
    };

    // Start Edit Question — navigate to the dedicated UpdateQuiz page
    const handleStartEdit = (q) => {
        navigate(`/admin/quiz/update/${q.id}`);
    };

    const handleCancelForm = () => {
        setIsEditing(false);
        setActiveQuestionId(null);
        setFormErrors({});
    };

    // Handle Form Inputs
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "sortOrder" ? Math.max(1, parseInt(value) || 1) : value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Choices Management in Form
    const handleChoiceFieldChange = (idx, field, value) => {
        setFormData(prev => {
            const choices = [...prev.choices];
            choices[idx] = { ...choices[idx], [field]: value };
            return { ...prev, choices };
        });
        if (formErrors.choices) {
            setFormErrors(prev => ({ ...prev, choices: null }));
        }
    };

    const handleChoiceRecommendToggle = (choiceIdx, shapeId) => {
        setFormData(prev => {
            const choices = [...prev.choices];
            const currentRecs = choices[choiceIdx].recommends || [];
            const nextRecs = currentRecs.includes(shapeId)
                ? currentRecs.filter(id => id !== shapeId)
                : [...currentRecs, shapeId];
            choices[choiceIdx] = { ...choices[choiceIdx], recommends: nextRecs };
            return { ...prev, choices };
        });
    };

    const handleAddChoice = () => {
        setFormData(prev => ({
            ...prev,
            choices: [...prev.choices, { text: "", value: "", description: "", recommends: [] }]
        }));
    };

    const handleRemoveChoice = (idx) => {
        if (formData.choices.length <= 2) {
            showNotification("Questions require at least two choices.", "error");
            return;
        }
        setFormData(prev => ({
            ...prev,
            choices: prev.choices.filter((_, i) => i !== idx)
        }));
    };

    // Save Question Form
    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        const errors = {};

        if (!formData.questionText.trim()) errors.questionText = "Question text is required";

        const emptyChoiceIdx = formData.choices.findIndex(c => !c.text.trim());
        if (emptyChoiceIdx !== -1) {
            errors.choices = "All choice fields must have labels filled in";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsLoading(true);
        try {
            if (activeQuestionId) {
                const updated = await updateQuizQuestion(activeQuestionId, formData);
                setQuestions(prev => prev.map(q => q.id === activeQuestionId ? updated : q).sort((a, b) => a.sortOrder - b.sortOrder));
                showNotification("Diagnostic question updated successfully.");
            } else {
                const created = await createQuizQuestion(formData);
                setQuestions(prev => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
                showNotification("Diagnostic question created successfully.");
            }
            setIsEditing(false);
            setActiveQuestionId(null);
        } catch (err) {
            console.error(err);
            showNotification(err instanceof Error ? err.message : "Failed to save changes.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // View Shape details helper
    const handleSelectShape = (shape) => {
        setSelectedShape(shape);
        setShapeEditData({
            description: shape.description,
            difficulty: shape.difficulty,
            strengthLevel: shape.strengthLevel,
            rulesSummary: shape.rulesSummary
        });
        setIsEditingShape(false);
    };

    // Save Shape changes
    const handleSaveShape = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const updated = await updateDiagnosticShape(selectedShape.id, shapeEditData);
            setShapes(prev => prev.map(s => s.id === selectedShape.id ? updated : s));
            setSelectedShape(updated);
            setIsEditingShape(false);
            showNotification("Recommendation rules updated successfully.");
        } catch (err) {
            console.error(err);
            showNotification("Failed to update rules.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col gap-6 bg-[#fffbfc] text-[#4b3c46] pb-10">
            {/* Monospace metrics row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                    { label: "Completed Quizzes", value: "4,924", icon: FileText, desc: "Evaluations calculated" },
                    { label: "Diagnostic Steps", value: activeQuestionsCount, icon: Sliders, desc: "Active questions in flow" },
                    { label: "Registered Shapes", value: shapes.length, icon: Layers, desc: "Target recommendation styles" },
                    { label: "Completion Rate", value: "96.4%", icon: TrendingUp, desc: "Quiz progression accuracy" }
                ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <div key={idx} className="group flex flex-col justify-between rounded-3xl border border-white/60 bg-white/60 p-5 shadow-[0_12px_32px_rgba(224,188,206,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white/90 hover:shadow-[0_16px_40px_rgba(234,79,147,0.15)]">
                            <div className="flex items-start justify-between">
                                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#a6869a]">
                                    {item.label}
                                </span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff0f6] text-[#ea4f93]">
                                    <Icon size={15} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-3xl font-bold font-mono tracking-tight text-[#3f2034]">{item.value}</span>
                                <p className="mt-1 text-xs text-[#a3909e]">{item.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter and Command section */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:max-w-xl">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c099b2]" />
                        <input
                            type="text"
                            placeholder="Search quiz queries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-full border border-[#f5d7e4] bg-white/90 pl-11 pr-4 text-sm text-[#4b3345] outline-none transition placeholder:text-[#c0a8b9] focus:border-[#ef6bb4] focus:bg-white"
                        />
                    </div>
                    <div className="flex rounded-full border border-[#f5d7e4] bg-white/95 p-1 shrink-0">
                        {["All", "Active", "Inactive"].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setStatusFilter(opt)}
                                className={`rounded-full px-4 py-1 text-xs font-bold transition-all ${statusFilter === opt
                                    ? "bg-[#ea4f93] text-white"
                                    : "text-[#8c6b81] hover:bg-[#fff0f6]"
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <Link
                    to={ROUTES.adminQuizCreate}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ea4f93] to-[#ff7eb3] px-6 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(234,79,147,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_28px_rgba(234,79,147,0.4)] active:scale-95"
                >
                    <Plus size={15} className="mr-2" />
                    Create Question
                </Link>
            </div>

            {/* Asymmetric Split Layout Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* LEFT HALF: Questions editor dashboard section (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#fff0f6] text-xs font-bold text-[#ea4f93]">
                            Q
                        </span>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#3f2034]">Assessment Flow Steps</h3>
                    </div>

                    <div className="relative min-h-[350px]">
                        {isLoading && questions.length === 0 ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-32 w-full animate-pulse rounded-[2rem] border border-[#f5e3ed] bg-white p-6" />
                                ))}
                            </div>
                        ) : filteredQuestions.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                <motion.div className="flex flex-col gap-4">
                                    {filteredQuestions.map((q, idx) => (
                                        <motion.div
                                            key={q.id}
                                            layout
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.96 }}
                                            transition={{ type: "spring", stiffness: 120, damping: 18, delay: idx * 0.04 }}
                                            className={`relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-[0_8px_24px_rgba(224,188,206,0.15)] backdrop-blur-md hover:-translate-y-1 hover:border-[#eba2c6]/50 hover:bg-white/80 hover:shadow-[0_16px_40px_rgba(234,79,147,0.12)] transition-all duration-300 ${q.status === "Inactive" ? "opacity-70 grayscale-[20%]" : ""}`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ea4f93] bg-[#fff0f6] px-2 py-0.5 rounded-md font-mono">
                                                            Step {q.sortOrder}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-[#a6869a] uppercase tracking-wider">
                                                            {q.type === "SingleSelect" ? "Single Select" : "Multiple Select"}
                                                        </span>
                                                        {q.categoryKey && (
                                                            <span className="text-[10px] font-bold text-[#8c6b81] bg-[#fdf2f7] px-2 py-0.5 rounded-md border border-[#fbe4ee]">
                                                                Category: {q.categoryKey}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="mt-2 text-sm font-bold text-[#3f2034]">{q.questionText}</h4>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => handleToggleStatus(q.id)}
                                                        title={`Set status to ${q.status === "Active" ? "Inactive" : "Active"}`}
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold transition-all active:scale-[0.98] ${q.status === "Active"
                                                            ? "bg-[#e8fdf2] text-[#16975f] hover:bg-[#d0fbe4]"
                                                            : "bg-[#fff0f3] text-[#d14c84] hover:bg-[#ffd9e1]"
                                                            }`}
                                                    >
                                                        <Power size={8} />
                                                        <span>{q.status}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleStartEdit(q)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f3cade] bg-white text-[#c95b90] hover:bg-[#fff0f6] transition-colors active:scale-[0.98]"
                                                        title="Edit step details"
                                                    >
                                                        <Edit3 size={11} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteQuestion(q.id)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ffe0e6] bg-white text-[#d14c84] hover:bg-[#fff0f3] transition-colors active:scale-[0.98]"
                                                        title="Remove step"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Choice Option cards */}
                                            <div className="mt-4 border-t border-[#fcecf4] pt-4">
                                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#a6869a] mb-2">Configured Options</p>
                                                <div className="flex flex-col gap-2">
                                                    {q.choices.map((choice, cIdx) => (
                                                        <div key={cIdx} className="flex flex-col gap-1 rounded-xl bg-[#fffbfc] border border-[#fcecf4] p-3 text-xs">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-bold text-[#5c3e53]">{choice.text}</span>
                                                                {choice.value && !/^\d+$/.test(choice.value) && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(choice.value) && (
                                                                    <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                                        {choice.value}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {choice.description && (
                                                                <p className="text-[11px] text-[#8c7484] leading-relaxed mt-0.5">{choice.description}</p>
                                                            )}
                                                            {choice.recommends && choice.recommends.length > 0 && (
                                                                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                                                    {choice.recommends.map((sh, sIdx) => (
                                                                        <span key={sIdx} className="inline-flex items-center rounded-md bg-[#fff0f6] border border-[#fcecf4] px-2 py-0.5 text-[9px] font-bold text-[#c95b90] shadow-sm">
                                                                            {sh}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-[#f5cbdc] bg-white p-12 text-center"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f6] text-[#ea4f93] mb-4">
                                    <HelpCircle size={20} />
                                </div>
                                <h4 className="text-base font-bold text-[#3f2034]">No Quiz Elements Found</h4>
                                <p className="mt-2 text-xs text-[#8c7484] max-w-xs">
                                    Try refining your search filter, resetting filters, or configure a diagnostic question.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* RIGHT HALF: Shape recommendation rules & detail viewer (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#fff0f6] text-xs font-bold text-[#ea4f93]">
                            S
                        </span>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#3f2034]">Nail Shapes Recommendation Model</h3>
                    </div>

                    {/* Shape List Panel */}
                    <div className="flex flex-col gap-2">
                        {shapes.map((shape) => (
                            <button
                                key={shape.id}
                                onClick={() => handleSelectShape(shape)}
                                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${selectedShape?.id === shape.id
                                    ? "border-[#ea4f93] bg-white/90 shadow-[0_8px_20px_rgba(234,79,147,0.15)] backdrop-blur-md translate-x-1"
                                    : "border-white/60 bg-white/40 backdrop-blur-sm hover:border-[#eba2c6]/50 hover:bg-white/80 hover:shadow-md hover:translate-x-1"
                                    }`}
                            >
                                <div>
                                    <h4 className="text-xs font-extrabold text-[#3f2034]">{shape.name}</h4>
                                    <p className="mt-1 text-[11px] text-[#8c7484] max-w-[280px] truncate">{shape.description}</p>
                                </div>
                                <ChevronRight size={13} className={selectedShape?.id === shape.id ? "text-[#ea4f93]" : "text-[#c9a7be]"} />
                            </button>
                        ))}
                    </div>

                    {/* Selected Shape Detail View */}
                    {selectedShape && (
                        <div className="rounded-[2rem] border border-[#f5e3ed] bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-[#fcecf4] pb-3 mb-4">
                                <div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#a6869a] block">Target Diagnostic Style</span>
                                    <h4 className="text-base font-bold text-[#3f2034] mt-0.5">{selectedShape.name}</h4>
                                </div>
                                <button
                                    onClick={() => setIsEditingShape(!isEditingShape)}
                                    className="inline-flex h-8 px-3 items-center justify-center gap-1.5 rounded-full border border-[#f3cade] bg-white text-xs font-extrabold text-[#c95b90] hover:bg-[#fff0f6] transition-all active:scale-[0.98]"
                                >
                                    <Sliders size={11} />
                                    <span>{isEditingShape ? "Cancel" : "Configure Rules"}</span>
                                </button>
                            </div>

                            {isEditingShape ? (
                                <form onSubmit={handleSaveShape} className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#7a6473]">Shape Description</label>
                                        <textarea
                                            value={shapeEditData.description}
                                            onChange={(e) => setShapeEditData(prev => ({ ...prev, description: e.target.value }))}
                                            rows="3"
                                            className="w-full rounded-xl border border-[#f5d7e4] bg-[#fffbfc] p-3 text-xs text-[#4b3345] outline-none focus:border-[#ef6bb4] resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#7a6473]">Upkeep Difficulty</label>
                                            <select
                                                value={shapeEditData.difficulty}
                                                onChange={(e) => setShapeEditData(prev => ({ ...prev, difficulty: e.target.value }))}
                                                className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fffbfc] px-3 text-xs text-[#4b3345] outline-none focus:border-[#ef6bb4]"
                                            >
                                                <option value="Low">Low Maintenance</option>
                                                <option value="Medium">Medium Maintenance</option>
                                                <option value="High">High Upkeep</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#7a6473]">Nail Strength Required</label>
                                            <select
                                                value={shapeEditData.strengthLevel}
                                                onChange={(e) => setShapeEditData(prev => ({ ...prev, strengthLevel: e.target.value }))}
                                                className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fffbfc] px-3 text-xs text-[#4b3345] outline-none focus:border-[#ef6bb4]"
                                            >
                                                <option value="Flexible">Thin / Flexible</option>
                                                <option value="Moderate">Moderate / Normal</option>
                                                <option value="Excellent">Strong / Acrylics Only</option>
                                                <option value="High Required">High Required</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#7a6473]">Diagnostic Rules Conditions (Triggers)</label>
                                        <textarea
                                            value={shapeEditData.rulesSummary}
                                            onChange={(e) => setShapeEditData(prev => ({ ...prev, rulesSummary: e.target.value }))}
                                            rows="2"
                                            className="w-full rounded-xl border border-[#f5d7e4] bg-[#fffbfc] p-3 text-xs text-[#4b3345] outline-none focus:border-[#ef6bb4] resize-none"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-[#ea4f93] text-xs font-bold text-white shadow-md hover:bg-[#d14c84] transition-colors active:scale-[0.98]"
                                    >
                                        Save Rules Configuration
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-4 text-xs">
                                    <p className="leading-relaxed text-[#7c566f]">{selectedShape.description}</p>

                                    <div className="grid grid-cols-2 gap-4 border-t border-[#fcecf4] pt-4">
                                        <div>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#a6869a] block">Upkeep Difficulty</span>
                                            <span className="inline-flex mt-1 rounded-md bg-[#fff0f6] px-2 py-0.5 text-[10px] font-extrabold text-[#c95b90]">
                                                {selectedShape.difficulty}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#a6869a] block">Nail Strength</span>
                                            <span className="inline-flex mt-1 rounded-md bg-[#fff0f6] px-2 py-0.5 text-[10px] font-extrabold text-[#c95b90]">
                                                {selectedShape.strengthLevel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#fcecf4] pt-4 bg-[#fffafc] rounded-xl p-3 border border-[#fbebf2]">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#ea4f93] flex items-center gap-1">
                                            <Sparkles size={10} /> Model Targeting Rules
                                        </span>
                                        <p className="mt-1.5 leading-relaxed text-[#6c485f] font-medium">{selectedShape.rulesSummary}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-over Drawer for Question Create/Edit */}
            <AnimatePresence>
                {isEditing && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.35 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancelForm}
                            className="fixed inset-0 z-40 bg-[#321c29]/40 backdrop-blur-[1px]"
                        />

                        {/* Drawer body */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[500px] bg-white shadow-[-10px_0_40px_rgba(63,32,52,0.12)] p-6 overflow-y-auto border-l border-[#fcecf4] flex flex-col justify-between"
                        >
                            <div className="no-scrollbar overflow-y-auto flex-1 pb-4">
                                <div className="flex items-center justify-between border-b border-[#fcecf4] pb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-[#3f2034]">
                                            {activeQuestionId ? "Modify Diagnostic Question" : "Create Diagnostic Question"}
                                        </h3>
                                        <p className="text-xs text-[#8c7484]">Add options and recommendations mapping</p>
                                    </div>
                                    <button
                                        onClick={handleCancelForm}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f9fa] text-[#8e7987] hover:bg-[#fff0f6] hover:text-[#ea4f93] transition-colors"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveQuestion} className="mt-5 space-y-4">
                                    {/* Question Text */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                            Question Text
                                        </label>
                                        <textarea
                                            name="questionText"
                                            value={formData.questionText}
                                            onChange={handleFormChange}
                                            placeholder="e.g. What style aesthetic do you prefer?"
                                            rows="2"
                                            className={`w-full rounded-2xl border bg-[#fffbfc] p-3 text-xs text-[#4b3345] outline-none transition resize-none ${formErrors.questionText ? "border-[#d14c84] focus:border-[#d14c84]" : "border-[#f5d7e4] focus:border-[#ef6bb4]"
                                                }`}
                                        />
                                        {formErrors.questionText && (
                                            <span className="text-xs text-[#d14c84] flex items-center gap-1 font-bold">
                                                <AlertCircle size={12} /> {formErrors.questionText}
                                            </span>
                                        )}
                                    </div>

                                    {/* Sorting Order, Type, and Category Key */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                Sort Order
                                            </label>
                                            <input
                                                type="number"
                                                name="sortOrder"
                                                value={formData.sortOrder}
                                                onChange={handleFormChange}
                                                min="1"
                                                className="h-10 w-full rounded-2xl border border-[#f5d7e4] bg-[#fffbfc] px-3 text-xs text-[#4b3345] outline-none focus:border-[#ef6bb4] transition"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                Select Mode
                                            </label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleFormChange}
                                                className="h-10 w-full rounded-2xl border border-[#f5d7e4] bg-[#fffbfc] px-3 text-xs text-[#4b3345] outline-none focus:border-[#ef6bb4] transition"
                                            >
                                                <option value="SingleSelect">Single Select</option>
                                                <option value="MultiSelect">Multiple Select</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                Category Key
                                            </label>
                                            <input
                                                type="text"
                                                name="categoryKey"
                                                value={formData.categoryKey || ""}
                                                onChange={handleFormChange}
                                                placeholder="e.g. Style, Shape"
                                                className="h-10 w-full rounded-2xl border border-[#f5d7e4] bg-[#fffbfc] px-3 text-xs text-[#4b3345] outline-none focus:border-[#ef6bb4] transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Choices configuration */}
                                    <div className="flex flex-col gap-2.5 border-t border-[#fcecf4] pt-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                Choice Options
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddChoice}
                                                className="inline-flex h-7 px-2.5 items-center justify-center gap-1.5 rounded-full border border-[#f3cade] bg-white text-[10px] font-extrabold text-[#c95b90] hover:bg-[#fff0f6] transition-all"
                                            >
                                                <Plus size={10} /> Add Option
                                            </button>
                                        </div>

                                        {formErrors.choices && (
                                            <span className="text-xs text-[#d14c84] flex items-center gap-1 font-bold">
                                                <AlertCircle size={12} /> {formErrors.choices}
                                            </span>
                                        )}

                                        <div className="space-y-3.5 mt-2">
                                            {formData.choices.map((choice, choiceIdx) => (
                                                <div key={choiceIdx} className="rounded-2xl border border-[#fcecf4] p-4 bg-[#fffbfc] space-y-3 relative">
                                                    <div className="flex flex-col gap-2.5 pr-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold font-mono text-[#c9a7be] shrink-0">Option {choiceIdx + 1}</span>
                                                            <input
                                                                type="text"
                                                                value={choice.text}
                                                                onChange={(e) => handleChoiceFieldChange(choiceIdx, "text", e.target.value)}
                                                                placeholder="Label (Tên hiển thị) e.g., Tối giản"
                                                                className="flex-1 h-9 rounded-xl border border-[#f5d7e4] bg-white px-3 text-xs text-[#4b3345] outline-none focus:border-[#ef6bb4] transition"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 pl-14">
                                                            <input
                                                                type="text"
                                                                value={choice.value}
                                                                onChange={(e) => handleChoiceFieldChange(choiceIdx, "value", e.target.value)}
                                                                placeholder="Value (e.g. minimalist)"
                                                                className="h-8 rounded-lg border border-[#fcecf4] bg-white px-2.5 text-[11px] font-mono text-[#4b3345] outline-none focus:border-[#ef6bb4] transition"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={choice.description}
                                                                onChange={(e) => handleChoiceFieldChange(choiceIdx, "description", e.target.value)}
                                                                placeholder="Description (Mô tả)"
                                                                className="h-8 rounded-lg border border-[#fcecf4] bg-white px-2.5 text-[11px] text-[#4b3345] outline-none focus:border-[#ef6bb4] transition"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Delete choice btn */}
                                                    {formData.choices.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveChoice(choiceIdx)}
                                                            className="absolute right-2 top-2 h-6 w-6 inline-flex items-center justify-center text-[#d14c84] hover:bg-[#fff0f3] rounded-full transition-colors"
                                                            title="Delete choice option"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}

                                                    {/* Recommended Shapes checkboxes grid */}
                                                    <div>
                                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#a6869a] mb-1.5">Recommends shapes</p>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {shapes.map((shape) => {
                                                                const isSelected = (choice.recommends || []).includes(shape.id);
                                                                return (
                                                                    <button
                                                                        key={shape.id}
                                                                        type="button"
                                                                        onClick={() => handleChoiceRecommendToggle(choiceIdx, shape.id)}
                                                                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[10px] font-bold transition-all ${isSelected
                                                                            ? "border-[#ea4f93] bg-[#fff6fa] text-[#ea4f93]"
                                                                            : "border-[#fcecf4] bg-white text-[#8e7987] hover:border-[#eba2c6]"
                                                                            }`}
                                                                    >
                                                                        {isSelected ? <CheckSquare size={10} /> : <div className="h-2.5 w-2.5 border border-[#c9a7be] rounded-sm shrink-0" />}
                                                                        <span>{shape.name}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full inline-flex h-11 items-center justify-center rounded-2xl bg-[#ea4f93] text-xs font-bold text-white shadow-md hover:bg-[#d14c84] transition-colors active:scale-[0.98]"
                                    >
                                        Save Diagnostic Element
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                isDeleting={isDeleting}
                title="Delete Quiz Question"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete "${deleteTarget.questionText}"? This action cannot be undone and all answer choices will be permanently removed.`
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
}
