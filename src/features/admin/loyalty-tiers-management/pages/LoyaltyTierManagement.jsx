import { useState, useEffect } from "react";
import {
    Award,
    Plus,
    Search,
    Trash2,
    Edit3,
    Info,
    Check,
    AlertCircle,
    Users,
    Sparkles,
    Percent,
    X,
    RefreshCw,
    Power,
    TrendingUp,
    Image as ImageIcon,
    Layers,
    Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    fetchLoyaltyTiers,
    createLoyaltyTier,
    updateLoyaltyTier,
    deleteLoyaltyTier
} from "../services/loyaltyTiersManagementService";
import LoyaltyTierDetailModal from "../components/LoyaltyTierDetailModal";
import { DeleteConfirmModal } from "../../quiz-management/components/DeleteConfirmModal";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

// Presentation-only helper: renders a tier's rank as a roman numeral stamp.
// Purely derived from sortOrder at render time — does not touch any state.
const toRoman = (num) => {
    if (!num || num < 1) return "–";
    const table = [
        [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
    ];
    let n = num;
    let out = "";
    for (const [value, symbol] of table) {
        while (n >= value) {
            out += symbol;
            n -= value;
        }
    }
    return out || String(num);
};

// Presentation-only helper: fake embossed card number derived from tier id/order.
const cardNumber = (tier) => {
    const seed = String(tier.sortOrder ?? 0).padStart(4, "0");
    return `NAIL •••• •••• ${seed}`;
};

export function LoyaltyTierManagement() {
    const { t, language } = useLanguage();
    const [tiers, setTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [pointsFilter, setPointsFilter] = useState("");
    const [showGuide, setShowGuide] = useState(true);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [activeTierId, setActiveTierId] = useState(null); // null means adding a new tier
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        minLifetimePoints: 0,
        maxLifetimePoints: 100,
        discountRate: 0,
        imageUrl: "",
        imageFile: null,
        backgroundColor: "#D48138",
        textColor: "#FFFFFF",
        status: "Active",
        sortOrder: 1
    });

    const [formErrors, setFormErrors] = useState({});
    const [notification, setNotification] = useState(null);
    const [selectedTierId, setSelectedTierId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [updatingStatusTierId, setUpdatingStatusTierId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name } | null
    const [isDeleting, setIsDeleting] = useState(false);

    // Load API Data
    const loadData = async () => {
        setIsLoading(true);
        try {
            const fetched = await fetchLoyaltyTiers();
            setTiers(fetched.sort((a, b) => a.sortOrder - b.sortOrder || a.minLifetimePoints - b.minLifetimePoints));
        } catch (err) {
            console.error("Failed to fetch loyalty tiers:", err);
            showNotification(err instanceof Error ? err.message : "Failed to load loyalty tiers.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Filter & Search logic
    const filteredTiers = tiers
        .filter(tier => {
            const matchesSearch = tier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tier.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "All" || tier.status === statusFilter;
            const matchesPoints = pointsFilter === "" ||
                (Number(pointsFilter) >= tier.minLifetimePoints && Number(pointsFilter) <= tier.maxLifetimePoints);
            return matchesSearch && matchesStatus && matchesPoints;
        })
        .sort((a, b) => a.minLifetimePoints - b.minLifetimePoints);

    // Derived metrics or organic mock stats for admin dashboard
    const getMockMemberCount = (tierName) => {
        const lower = String(tierName).toLowerCase();
        if (lower.includes("đồng") || lower.includes("bronze")) return 142;
        if (lower.includes("bạc") || lower.includes("silver")) return 88;
        if (lower.includes("vàng") || lower.includes("gold")) return 45;
        if (lower.includes("kim cương") || lower.includes("diamond")) return 14;
        if (lower.includes("bạch kim") || lower.includes("platinum")) return 28;
        return 6;
    };

    const totalMembers = tiers.reduce((sum, tier) => sum + getMockMemberCount(tier.name), 0);
    const activeTiersCount = tiers.filter(t => t.status === "Active").length;
    const maxDiscount = tiers.length ? Math.max(...tiers.map(t => t.discountRate)) : 0;
    const averageDiscount = tiers.length ? Math.round(tiers.reduce((sum, t) => sum + t.discountRate, 0) / tiers.length) : 0;

    // Handle Form Change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "minLifetimePoints" ? Math.max(0, parseInt(value) || 0) :
                name === "maxLifetimePoints" ? Math.max(0, parseInt(value) || 0) :
                    name === "discountRate" ? value :
                        name === "sortOrder" ? Math.max(1, parseInt(value) || 1) :
                            value
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Badge image upload handling.
    // NOTE: this reads the file locally and previews it as a base64 data URL so the
    // drawer + card preview update instantly. Wire this up to your real upload
    // endpoint (e.g. Cloudinary) and swap `reader.result` for the returned URL
    // once that endpoint is available.
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showNotification("Please select a valid image file.", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showNotification("Image must be smaller than 5MB.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({
                ...prev,
                imageFile: file,
                imageUrl: reader.result
            }));
        };
        reader.readAsDataURL(file);

        // allow re-selecting the same file later
        e.target.value = "";
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            imageUrl: "",
            imageFile: null
        }));
    };

    // Color Presets mapping direct database fields
    const COLOR_PRESETS = [
        { label: "Bronze", color: "#D48138", textColor: "#FFFFFF" },
        { label: "Silver", color: "#9E9E9E", textColor: "#FFFFFF" },
        { label: "Gold", color: "#FFC107", textColor: "#3F2034" },
        { label: "Platinum", color: "#5C6BC0", textColor: "#FFFFFF" },
        { label: "Diamond", color: "#00ACC1", textColor: "#FFFFFF" },
        { label: "Rose", color: "#EC407A", textColor: "#FFFFFF" },
        { label: "Slate", color: "#455A64", textColor: "#FFFFFF" }
    ];

    const selectColorPreset = (preset) => {
        setFormData(prev => ({
            ...prev,
            backgroundColor: preset.color,
            textColor: preset.textColor
        }));
    };

    // Edit Tier Action Trigger
    const handleStartEdit = (tier) => {
        setIsEditing(true);
        setActiveTierId(tier.id);
        setFormData({
            name: tier.name,
            description: tier.description,
            minLifetimePoints: tier.minLifetimePoints,
            maxLifetimePoints: tier.maxLifetimePoints,
            discountRate: tier.discountRate,
            imageUrl: tier.imageUrl,
            imageFile: null,
            backgroundColor: tier.backgroundColor,
            textColor: tier.textColor,
            status: tier.status,
            sortOrder: tier.sortOrder
        });
        setFormErrors({});
    };

    // Start Create New Tier Form
    const handleStartCreate = () => {
        setIsEditing(true);
        setActiveTierId(null);
        setFormData({
            name: "",
            description: "",
            minLifetimePoints: 0,
            maxLifetimePoints: 100,
            discountRate: 0,
            imageUrl: "",
            imageFile: null,
            backgroundColor: "#D48138",
            textColor: "#FFFFFF",
            status: "Active",
            sortOrder: tiers.length + 1
        });
        setFormErrors({});
    };

    // Cancel form edit
    const handleCancelForm = () => {
        setIsEditing(false);
        setActiveTierId(null);
        setFormErrors({});
    };

    const handleOpenDetail = (id) => {
        setSelectedTierId(id);
        setIsDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailOpen(false);
        setSelectedTierId(null);
    };

    // Delete Tier Action
    const handleDeleteTier = (id) => {
        const target = tiers.find(t => t.id === id);
        if (!target) return;
        setDeleteTarget({ id: target.id, name: target.name });
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteLoyaltyTier(deleteTarget.id);
            setTiers(prev => prev.filter(t => t.id !== deleteTarget.id));
            showNotification("Loyalty tier deleted successfully.");
            if (activeTierId === deleteTarget.id) {
                handleCancelForm();
            }
        } catch (err) {
            console.error(err);
            showNotification(err instanceof Error ? err.message : "Failed to delete loyalty tier.", "error");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleCancelDelete = () => {
        if (!isDeleting) setDeleteTarget(null);
    };

    // Toggle Tier Status directly from List
    const handleToggleStatus = async (id) => {
        const target = tiers.find(t => t.id === id);
        if (!target) return;
        const nextStatus = target.status === "Active" ? "Inactive" : "Active";

        setUpdatingStatusTierId(id);
        try {
            const updated = await updateLoyaltyTier(id, {
                ...target,
                status: nextStatus
            });
            setTiers(prev => prev.map(t => t.id === id ? updated : t).sort((a, b) => a.sortOrder - b.sortOrder));
            const statusMsg = language === "vi"
                ? `Cấp độ '${target.name}' đã được chuyển sang trạng thái ${nextStatus === "Active" ? "hoạt động" : "ngừng hoạt động"}`
                : `Tier '${target.name}' set to ${nextStatus.toLowerCase()}`;
            showNotification(statusMsg);
        } catch (err) {
            console.error(err);
            showNotification(err instanceof Error ? err.message : (language === "vi" ? "Cập nhật trạng thái thất bại." : "Failed to update status."), "error");
        } finally {
            setUpdatingStatusTierId(null);
        }
    };

    // Validate and Save Tier Form
    const handleSaveTier = async (e) => {
        e.preventDefault();
        const errors = {};
        const isVi = language === "vi";

        if (!formData.name.trim()) errors.name = isVi ? "Tên cấp độ không được để trống" : "Tier Name is required";
        if (formData.minLifetimePoints < 0) errors.minLifetimePoints = isVi ? "Điểm tối thiểu phải từ 0 trở lên" : "Minimum points must be 0 or higher";
        if (formData.maxLifetimePoints <= formData.minLifetimePoints) errors.maxLifetimePoints = isVi ? "Điểm tối đa phải lớn hơn điểm tối thiểu" : "Maximum points must be greater than minimum points";

        const discountVal = parseFloat(formData.discountRate) || 0;
        if (discountVal < 0 || discountVal > 100) errors.discountRate = isVi ? "Tỷ lệ giảm giá phải từ 0 đến 100" : "Discount rate must be between 0 and 100";
        if (!formData.backgroundColor.trim()) errors.backgroundColor = isVi ? "Màu nền thẻ không được để trống" : "Card background color is required";

        if (!activeTierId && !formData.imageFile) {
            errors.imageUrl = isVi ? "Yêu cầu tệp ảnh huy hiệu cho cấp độ mới" : "Badge image file is required for new tiers";
        } else if (activeTierId && !formData.imageFile && !formData.imageUrl) {
            errors.imageUrl = isVi ? "Yêu cầu ảnh huy hiệu" : "Badge image is required";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSaving(true);
        setIsLoading(true);
        try {
            if (activeTierId) {
                // Edit mode
                const updated = await updateLoyaltyTier(activeTierId, formData);
                setTiers(prev => prev.map(t => t.id === activeTierId ? updated : t).sort((a, b) => a.sortOrder - b.sortOrder || a.minLifetimePoints - b.minLifetimePoints));
                showNotification(isVi ? `Cấp độ '${formData.name}' đã được cập nhật thành công.` : `Tier '${formData.name}' updated successfully.`);
            } else {
                // Create mode
                const created = await createLoyaltyTier(formData);
                setTiers(prev => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder || a.minLifetimePoints - b.minLifetimePoints));
                showNotification(isVi ? `Cấp độ thành viên '${formData.name}' đã được tạo thành công.` : `Loyalty tier '${formData.name}' created successfully.`);
            }
            setIsEditing(false);
            setActiveTierId(null);
        } catch (err) {
            console.error(err);
            showNotification(err instanceof Error ? err.message : "Failed to save loyalty tier.", "error");
        } finally {
            setIsLoading(false);
            setIsSaving(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col gap-7 bg-[#fffbfc] text-[#4b3c46] pb-10">

            {/* Page Header + compact stat strip (replaces generic 4-box KPI grid) */}
            <div className="flex flex-col gap-5 border-b border-[#f5e3ed] pb-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c9799f]">
                            {language === "vi" ? "Nailify · Chương trình Thành viên" : "Nailify · Membership Program"}
                        </span>
                        <h1 className="mt-1 text-4xl font-bold tracking-tight text-[#3f2034]">
                            {t("menus.admin-loyalty-tiers") || "Loyalty Tier Catalog"}
                        </h1>
                        <p className="mt-1 text-sm text-[#8c7484]">
                            {language === "vi" ? "Mỗi cấp bậc bên dưới được hiển thị chính xác như thẻ thành viên vật lý mà khách hàng sở hữu." : "Every rank below is rendered exactly as the physical membership card customers hold."}
                        </p>
                    </div>

                    <button
                        onClick={handleStartCreate}
                        className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] px-6 text-sm font-bold text-white shadow-[0_10px_20px_rgba(235,90,153,0.18)] transition-all hover:opacity-95 active:scale-[0.98]"
                    >
                        <Plus size={15} className="mr-2" />
                        {language === "vi" ? "Tạo Cấp độ thành viên" : "Create Loyalty Tier"}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-white/70 px-5 py-3 border border-[#f5e3ed]">
                    {[
                        { label: language === "vi" ? "Thành viên đã tham gia" : "Members enrolled", value: totalMembers.toLocaleString(), icon: Users },
                        { label: language === "vi" ? "Cấp độ hoạt động" : "Active tiers", value: activeTiersCount, icon: Layers },
                        { label: language === "vi" ? "Giảm giá cao nhất" : "Top discount", value: `${maxDiscount}%`, icon: Percent },
                        { label: language === "vi" ? "Giảm giá trung bình" : "Average discount", value: `${averageDiscount}%`, icon: TrendingUp }
                    ].map((item, idx, arr) => {
                        const Icon = item.icon;
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff0f6] text-[#ea4f93]">
                                    <Icon size={14} />
                                </div>
                                <div className="leading-tight">
                                    <p className="nailify-mono text-lg font-bold text-[#3f2034]">{item.value}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#a6869a]">{item.label}</p>
                                </div>
                                {idx < arr.length - 1 && (
                                    <span className="hidden h-8 w-px bg-[#f5e3ed] sm:block ml-5" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Control Bar: Search input, points filter, Status filter */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:max-w-2xl">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c099b2]" />
                        <input
                            type="text"
                            placeholder={language === "vi" ? "Tìm kiếm cấp độ..." : "Search loyalty tiers..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-full border border-[#f5d7e4] bg-white/90 pl-11 pr-4 text-sm text-[#4b3345] outline-none transition placeholder:text-[#c0a8b9] focus:border-[#ef6bb4] focus:bg-white"
                        />
                    </div>

                    <div className="relative w-full sm:w-44">
                        <Award size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c099b2]" />
                        <input
                            type="number"
                            placeholder={language === "vi" ? "Điểm..." : "Points..."}
                            value={pointsFilter}
                            onChange={(e) => setPointsFilter(e.target.value)}
                            className="h-11 w-full rounded-full border border-[#f5d7e4] bg-white/90 pl-11 pr-4 text-sm text-[#4b3345] outline-none transition placeholder:text-[#c0a8b9] focus:border-[#ef6bb4] focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                {language === "vi"
                                    ? { All: "Tất cả", Active: "Hoạt động", Inactive: "Ngừng hoạt động" }[opt] || opt
                                    : opt
                                }
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expandable/Dismissible Loyalty Blueprint guide banner */}
            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="relative overflow-hidden rounded-3xl border border-[#f5cbdc] bg-[#fff6fa] p-5 pr-12 text-[#7e5570] shadow-sm"
                    >
                        <button
                            onClick={() => setShowGuide(false)}
                            className="absolute right-4 top-4 text-[#ea4f93] hover:opacity-75 transition-opacity"
                            title="Dismiss guide banner"
                        >
                            <X size={15} />
                        </button>
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fff0f6] text-[#ea4f93]">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#3f2034]">
                                    {language === "vi" ? "Sơ đồ hệ thống khách hàng thân thiết" : "Loyalty System Blueprint"}
                                </h4>
                                <p className="mt-1 text-xs leading-relaxed text-[#7c566f]">
                                    {language === "vi"
                                        ? <span>Định nghĩa ranh giới cấp bậc bằng cách sử dụng các ngưỡng <strong>Điểm trọn đời tối thiểu/tối đa</strong>. Tỷ lệ giảm giá của từng cấp bậc sẽ tự động áp dụng khi thanh toán hóa đơn tại quầy lễ tân. Thứ tự sắp xếp cũng quy định ký hiệu La Mã hiển thị trên mặt thẻ.</span>
                                        : <span>Define rank boundaries using <strong>Min/Max Lifetime Points</strong> thresholds. Member discount rates apply checkout invoice markdowns at reception terminals automatically. Rank order also sets the roman-numeral stamp shown on each card face.</span>
                                    }
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card Catalog: literal membership cards, credit-card proportions */}
            <div className="relative">
                {isLoading && tiers.length === 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-[28px] border border-[#f5e3ed] bg-white p-4">
                                <div className="aspect-[85.6/54] w-full animate-pulse rounded-[20px] bg-[#f5e3ed]" />
                                <div className="mt-4 h-3 w-1/3 animate-pulse rounded bg-[#f5e3ed]" />
                            </div>
                        ))}
                    </div>
                ) : filteredTiers.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                        <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredTiers.map((tier, idx) => {
                                let startColor = tier.backgroundColor;
                                let endColor = tier.backgroundColor;
                                if (tier.colorJson) {
                                    try {
                                        const colors = JSON.parse(tier.colorJson);
                                        startColor = colors.gradientStart || colors.primary || tier.backgroundColor;
                                        endColor = colors.gradientEnd || colors.primary || tier.backgroundColor;
                                    } catch (e) { }
                                }

                                return (
                                    <motion.div
                                        key={tier.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 120, damping: 18, delay: idx * 0.05 }}
                                        whileHover={{ y: -6 }}
                                        className={`group relative flex flex-col gap-3 rounded-[28px] border border-[#f5e3ed] bg-white p-4 shadow-[0_12px_24px_rgba(224,188,206,0.04)] transition-all hover:border-[#eba2c6] hover:shadow-[0_18px_36px_rgba(224,188,206,0.12)] ${tier.status === "Inactive" ? "opacity-60" : ""
                                            }`}
                                    >
                                        {/* Card Face — the primary visual, real card proportions */}
                                        <div
                                            onClick={() => handleOpenDetail(tier.id)}
                                            style={{
                                                background: `linear-gradient(135deg, ${startColor}, ${endColor})`,
                                                color: tier.textColor
                                            }}
                                            className="relative aspect-[85.6/54] w-full cursor-pointer overflow-hidden rounded-[20px] p-5 shadow-md"
                                        >
                                            {/* foil sheen */}
                                            <div className="pointer-events-none absolute -inset-x-10 -top-16 h-32 rotate-12 bg-white/15 blur-xl transition-transform duration-500 group-hover:translate-x-6" />
                                            {/* inner border glint */}
                                            <div className="absolute inset-0 rounded-[20px] border border-white/10 pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                                            {/* die-cut punch hole */}
                                            <div
                                                className="absolute left-4 top-4 h-3 w-3 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
                                                style={{ backgroundColor: "#fffbfc" }}
                                            />

                                            <div className="relative z-10 flex h-full flex-col justify-between">
                                                <div className="flex items-start justify-between pl-6">
                                                    {/* EMV chip glyph */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="h-6 w-8 rounded-[4px] border border-white/40 bg-white/20 backdrop-blur-sm">
                                                            <div className="h-full w-full" style={{
                                                                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 4px)"
                                                            }} />
                                                        </div>
                                                        <span className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.2em] opacity-80">
                                                            {language === "vi" ? `Cấp ${toRoman(tier.sortOrder)}` : `Rank ${toRoman(tier.sortOrder)}`}
                                                        </span>
                                                    </div>

                                                    {/* Badge emblem */}
                                                    <div className="h-11 w-11 shrink-0 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center overflow-hidden">
                                                        {tier.imageUrl ? (
                                                            <img
                                                                src={tier.imageUrl}
                                                                alt={`${tier.name} badge`}
                                                                className="h-9 w-9 object-contain transition-transform group-hover:scale-110"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <Award size={18} style={{ color: tier.textColor }} />
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] opacity-80">
                                                        {language === "vi" ? "Thành viên Nailify" : "Nailify Membership"}
                                                    </p>
                                                    <h4 className="mt-0.5 truncate text-2xl font-semibold leading-tight">
                                                        {tier.name}
                                                    </h4>
                                                    <p className="nailify-mono mt-1.5 text-[10px] tracking-wider opacity-70">
                                                        {cardNumber(tier)}
                                                    </p>
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-70 block">
                                                            {language === "vi" ? "Ngưỡng điểm" : "Threshold"}
                                                        </span>
                                                        <span className="nailify-mono text-xs font-bold">
                                                            {tier.minLifetimePoints.toLocaleString()}–{tier.maxLifetimePoints.toLocaleString()} {language === "vi" ? "điểm" : "pts"}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-70 block">
                                                            {language === "vi" ? "Giảm giá" : "Discount"}
                                                        </span>
                                                        <span className="text-lg font-bold">
                                                            {tier.discountRate > 0 ? `${tier.discountRate}%` : (language === "vi" ? "Tiêu chuẩn" : "Standard")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta row: compact, below the card */}
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-3 text-[11px] font-semibold text-[#8c7484]">
                                                <span className="inline-flex items-center">
                                                    <Users size={12} className="mr-1 text-[#c9a7be]" />
                                                    {getMockMemberCount(tier.name)} {language === "vi" ? "thành viên" : "members"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleStatus(tier.id);
                                                    }}
                                                    disabled={updatingStatusTierId === tier.id}
                                                    title={language === "vi" ? `Đổi trạng thái thành ${tier.status === "Active" ? "Ngừng hoạt động" : "Hoạt động"}` : `Set status to ${tier.status === "Active" ? "Inactive" : "Active"}`}
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${tier.status === "Active"
                                                        ? "bg-[#e8fdf2] text-[#16975f] hover:bg-[#d0fbe4]"
                                                        : "bg-[#fff0f3] text-[#d14c84] hover:bg-[#ffd9e1]"
                                                        }`}
                                                >
                                                    {updatingStatusTierId === tier.id ? (
                                                        <svg className="h-2.5 w-2.5 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                                        </svg>
                                                    ) : (
                                                        <Power size={9} />
                                                    )}
                                                    <span>
                                                        {language === "vi"
                                                            ? (tier.status === "Active" ? "Hoạt động" : "Ngừng hoạt động")
                                                            : tier.status
                                                        }
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartEdit(tier);
                                                    }}
                                                    disabled={updatingStatusTierId === tier.id}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f3cade] bg-white text-[#c95b90] hover:bg-[#fff0f6] transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={language === "vi" ? "Chỉnh sửa cấp độ" : "Edit tier details"}
                                                >
                                                    <Edit3 size={11} />
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTier(tier.id);
                                                    }}
                                                    disabled={updatingStatusTierId === tier.id}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ffe0e6] bg-white text-[#d14c84] hover:bg-[#fff0f3] transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={language === "vi" ? "Xóa cấp độ" : "Delete tier"}
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-[#f5cbdc] bg-white p-12 text-center"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f6] text-[#ea4f93] mb-4">
                            <Info size={20} />
                        </div>
                        <h4 className="text-base font-bold text-[#3f2034]">
                            {language === "vi" ? "Không tìm thấy cấp độ thành viên nào" : "No Loyalty Tiers Match Your Filter"}
                        </h4>
                        <p className="mt-2 text-sm text-[#8c7484] max-w-sm">
                            {language === "vi"
                                ? "Vui lòng thử điều chỉnh tiêu chí tìm kiếm, xóa từ khóa tìm kiếm hoặc tạo một cấp độ thành viên mới."
                                : "Try adjusting your search criteria, clearing your search query, or create a brand new loyalty tier to populate your dashboard."
                            }
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("All");
                                    setPointsFilter("");
                                }}
                                className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#f5cbdc] bg-[#fff5f9] px-4 py-2 text-xs font-bold text-[#c03478] hover:bg-[#ffd9e7] transition-all"
                            >
                                <RefreshCw size={12} />
                                {language === "vi" ? "Đặt lại bộ lọc" : "Reset Filters"}
                            </button>
                            <button
                                onClick={loadData}
                                className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#f5cbdc] bg-[#fff5f9] px-4 py-2 text-xs font-bold text-[#c03478] hover:bg-[#ffd9e7] transition-all"
                            >
                                <RefreshCw size={12} />
                                {language === "vi" ? "Tải lại dữ liệu" : "Reload API"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Loyalty Tier Detail Modal */}
            <LoyaltyTierDetailModal
                isOpen={isDetailOpen}
                tierId={selectedTierId}
                onClose={handleCloseDetail}
            />

            {/* sliding sidebar panel editor drawer */}
            <AnimatePresence>
                {isEditing && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.35 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancelForm}
                            className="fixed inset-0 z-40 bg-[#321c29]/40 backdrop-blur-[1px]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="no-scrollbar fixed top-0 right-0 bottom-0 z-50 w-full max-w-[460px] bg-white shadow-[-10px_0_40px_rgba(63,32,52,0.12)] p-6 overflow-y-auto border-l border-[#fcecf4] flex flex-col justify-between"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                            <div>
                                <div className="flex items-center justify-between border-b border-[#fcecf4] pb-4">
                                    <div>
                                        <h3 className="text-2xl font-semibold text-[#3f2034]">
                                            {activeTierId
                                                ? (language === "vi" ? "Chỉnh sửa Cấp độ thành viên" : "Modify Loyalty Tier")
                                                : (language === "vi" ? "Tạo Cấp độ thành viên" : "Create Loyalty Tier")
                                            }
                                        </h3>
                                        <p className="text-xs text-[#8c7484]">
                                            {language === "vi" ? "Cấu hình quy tắc và mặt in của thẻ thành viên" : "Configure rules and the card's printed face"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCancelForm}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f9fa] text-[#8e7987] hover:bg-[#fff0f6] hover:text-[#ea4f93] transition-colors"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveTier} className="mt-5 space-y-4">
                                    {/* Card Style: live preview mirrors the exact catalog card */}
                                    <div className="flex flex-col gap-4 rounded-3xl border border-[#f5e3ed] bg-[#fffbfc] p-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                {language === "vi" ? "Kiểu thiết kế thẻ" : "Card Style"}
                                            </label>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#c099b2]">
                                                {language === "vi" ? "Xem trước" : "Live preview"}
                                            </span>
                                        </div>

                                        {/* Mini live preview matching the real card face */}
                                        <motion.div
                                            whileHover={{ rotate: -1 }}
                                            style={{ backgroundColor: formData.backgroundColor, color: formData.textColor }}
                                            className="relative aspect-[85.6/54] overflow-hidden rounded-[16px] p-4 shadow-sm"
                                        >
                                            <div className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                                            <div className="relative z-10 flex h-full flex-col justify-between">
                                                <div className="flex items-start justify-between">
                                                    <div className="h-4 w-6 rounded-[3px] border border-white/40 bg-white/20" />
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/25 bg-white/15">
                                                        {formData.imageUrl ? (
                                                            <img src={formData.imageUrl} alt="Badge preview" className="h-6 w-6 object-contain" />
                                                        ) : (
                                                            <Award size={14} style={{ color: formData.textColor }} />
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-85">
                                                        {language === "vi" ? "Thành viên Nailify" : "Nailify Membership"}
                                                    </p>
                                                    <h5 className="mt-0.5 truncate text-lg font-semibold">
                                                        {formData.name || (language === "vi" ? "Tên Cấp độ" : "Tier Name")}
                                                    </h5>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest opacity-85">
                                                    <span>
                                                        {formData.discountRate > 0
                                                            ? (language === "vi" ? `Giảm ${formData.discountRate}%` : `${formData.discountRate}% off`)
                                                            : (language === "vi" ? "Tiêu chuẩn" : "Standard")
                                                        }
                                                    </span>
                                                    <span>{language === "vi" ? `Cấp ${toRoman(formData.sortOrder)}` : `Rank ${toRoman(formData.sortOrder)}`}</span>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Quick presets as swatch chips */}
                                        <div className="flex flex-wrap gap-3">
                                            {COLOR_PRESETS.map((preset, idx) => {
                                                const isSelected = formData.backgroundColor.toLowerCase() === preset.color.toLowerCase();
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => selectColorPreset(preset)}
                                                        title={preset.label}
                                                        className="group/swatch flex flex-col items-center gap-1"
                                                    >
                                                        <span
                                                            style={{ backgroundColor: preset.color }}
                                                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm transition-transform group-hover/swatch:scale-110 ${isSelected ? "border-[#3f2034] ring-2 ring-[#ea4f93] ring-offset-2" : "border-white"
                                                                }`}
                                                        >
                                                            {isSelected && (
                                                                <Check size={13} strokeWidth={3} style={{ color: preset.textColor }} />
                                                            )}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-[#8c7484]">
                                                            {language === "vi"
                                                                ? { Bronze: "Đồng", Silver: "Bạc", Gold: "Vàng", Platinum: "Bạch kim", Diamond: "Kim cương", Rose: "Hồng", Slate: "Phiến đá" }[preset.label] || preset.label
                                                                : preset.label
                                                            }
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Custom Background Color */}
                                        <div className="flex flex-col gap-2 border-t border-[#fcecf4] pt-4">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7a6473]">
                                                {language === "vi" ? "Màu nền thẻ" : "Card Background"}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#f5d7e4] shadow-inner">
                                                    <span className="absolute inset-0" style={{ backgroundColor: formData.backgroundColor }} />
                                                    <input
                                                        type="color"
                                                        name="backgroundColor"
                                                        value={formData.backgroundColor}
                                                        onChange={handleInputChange}
                                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                        title="Pick a custom background color"
                                                    />
                                                </label>
                                                <input
                                                    type="text"
                                                    name="backgroundColor"
                                                    value={formData.backgroundColor}
                                                    onChange={handleInputChange}
                                                    className={`h-11 flex-1 rounded-2xl border bg-white px-3 text-xs font-mono outline-none transition ${formErrors.backgroundColor ? "border-[#d14c84] focus:border-[#d14c84]" : "border-[#f5d7e4] focus:border-[#ef6bb4]"
                                                        }`}
                                                />
                                            </div>
                                            {formErrors.backgroundColor && (
                                                <span className="text-xs text-[#d14c84] flex items-center gap-1 font-bold">
                                                    <AlertCircle size={12} /> {formErrors.backgroundColor}
                                                </span>
                                            )}
                                        </div>

                                        {/* Custom Text Color */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7a6473]">
                                                {language === "vi" ? "Màu sắc chữ" : "Text Color"}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#f5d7e4] shadow-inner">
                                                    <span className="absolute inset-0" style={{ backgroundColor: formData.textColor }} />
                                                    <input
                                                        type="color"
                                                        name="textColor"
                                                        value={formData.textColor}
                                                        onChange={handleInputChange}
                                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                        title="Pick a custom text color"
                                                    />
                                                </label>
                                                <input
                                                    type="text"
                                                    name="textColor"
                                                    value={formData.textColor}
                                                    onChange={handleInputChange}
                                                    className="h-11 flex-1 rounded-2xl border border-[#f5d7e4] bg-white px-3 text-xs font-mono outline-none transition focus:border-[#ef6bb4]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tier Name */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                            {language === "vi" ? "Tên cấp độ" : "Tier Name"}
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder={language === "vi" ? "Ví dụ: Đồng, Vàng, Kim cương VIP" : "e.g., Bronze, Gold, Diamond VIP"}
                                            className={`h-11 w-full rounded-2xl border bg-[#fffbfc] px-4 text-sm text-[#4b3345] outline-none transition ${formErrors.name ? "border-[#d14c84] focus:border-[#d14c84]" : "border-[#f5d7e4] focus:border-[#ef6bb4]"
                                                }`}
                                        />
                                        {formErrors.name && (
                                            <span className="text-xs text-[#d14c84] flex items-center gap-1 font-bold">
                                                <AlertCircle size={12} /> {formErrors.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Points Range: Min & Max Lifetime Points */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                {language === "vi" ? "Điểm tối thiểu" : "Min Lifetime Points"}
                                            </label>
                                            <input
                                                type="number"
                                                name="minLifetimePoints"
                                                value={formData.minLifetimePoints}
                                                onChange={handleInputChange}
                                                min="0"
                                                className={`h-11 w-full rounded-2xl border bg-[#fffbfc] px-4 text-sm text-[#4b3345] outline-none transition ${formErrors.minLifetimePoints ? "border-[#d14c84]" : "border-[#f5d7e4] focus:border-[#ef6bb4]"
                                                    }`}
                                            />
                                            {formErrors.minLifetimePoints && (
                                                <span className="text-xs text-[#d14c84] flex items-center gap-1 font-bold">
                                                    <AlertCircle size={12} /> {formErrors.minLifetimePoints}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                {language === "vi" ? "Điểm tối đa" : "Max Lifetime Points"}
                                            </label>
                                            <input
                                                type="number"
                                                name="maxLifetimePoints"
                                                value={formData.maxLifetimePoints}
                                                onChange={handleInputChange}
                                                min="0"
                                                className={`h-11 w-full rounded-2xl border bg-[#fffbfc] px-4 text-sm text-[#4b3345] outline-none transition ${formErrors.maxLifetimePoints ? "border-[#d14c84]" : "border-[#f5d7e4] focus:border-[#ef6bb4]"
                                                    }`}
                                            />
                                            {formErrors.maxLifetimePoints && (
                                                <span className="text-xs text-[#d14c84] flex items-center gap-1 font-bold">
                                                    <AlertCircle size={12} /> {formErrors.maxLifetimePoints}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Discount & Sort Order */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                {language === "vi" ? "Tỷ lệ giảm giá (%)" : "Discount Rate (%)"}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="discountRate"
                                                    value={formData.discountRate}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    max="100"
                                                    step="any"
                                                    className={`h-11 w-full rounded-2xl border bg-[#fffbfc] pl-4 pr-10 text-sm text-[#4b3345] outline-none transition ${formErrors.discountRate ? "border-[#d14c84]" : "border-[#f5d7e4] focus:border-[#ef6bb4]"
                                                        }`}
                                                />
                                                <Percent size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c9a7be]" />
                                            </div>
                                            {formErrors.discountRate && (
                                                <span className="text-xs text-[#d14c84] flex items-center gap-1 font-bold">
                                                    <AlertCircle size={12} /> {formErrors.discountRate}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                                Sort Order
                                            </label>
                                            <input
                                                type="number"
                                                name="sortOrder"
                                                value={formData.sortOrder}
                                                onChange={handleInputChange}
                                                min="1"
                                                className="h-11 w-full rounded-2xl border border-[#f5d7e4] bg-[#fffbfc] px-4 text-sm text-[#4b3345] outline-none focus:border-[#ef6bb4] transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Badge Image Upload */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                            {language === "vi" ? "Huy hiệu Cấp độ" : "Badge Image"}
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#f0c2d9] bg-[#fff6fa]">
                                                {formData.imageUrl ? (
                                                    <>
                                                        <img
                                                            src={formData.imageUrl}
                                                            alt="Badge preview"
                                                            className="h-full w-full object-contain p-2"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveImage}
                                                            title={language === "vi" ? "Xóa ảnh" : "Remove image"}
                                                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#d14c84] text-white shadow-sm transition-colors hover:bg-[#b93a70]"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <ImageIcon size={20} className="text-[#e0aec7]" />
                                                )}
                                            </div>

                                            <label
                                                htmlFor="badge-image-upload"
                                                className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-[#f0c2d9] bg-[#fffbfc] px-4 py-3.5 transition-colors hover:border-[#ef6bb4] hover:bg-[#fff0f6]"
                                            >
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#c95b90]">
                                                    <Upload size={13} />
                                                </span>
                                                <span className="flex flex-col">
                                                    <span className="text-xs font-bold text-[#c95b90]">
                                                        {formData.imageUrl
                                                            ? (language === "vi" ? "Thay thế ảnh huy hiệu" : "Replace badge image")
                                                            : (language === "vi" ? "Tải lên ảnh huy hiệu" : "Upload badge image")
                                                        }
                                                    </span>
                                                    <span className="text-[10px] text-[#a6869a]">PNG hoặc JPG, tối đa 5MB</span>
                                                </span>
                                                <input
                                                    id="badge-image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        {formErrors.imageUrl && (
                                            <span className="text-xs text-[#d14c84] flex items-center gap-1 font-bold mt-1">
                                                <AlertCircle size={12} /> {formErrors.imageUrl}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#7a6473]">
                                            {language === "vi" ? "Mô tả" : "Description"}
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder={language === "vi" ? "Tóm tắt các thông số của cấp độ thành viên." : "Summarize the tier parameters."}
                                            rows="2"
                                            className="w-full rounded-2xl border border-[#f5d7e4] bg-[#fffbfc] p-3 text-sm text-[#4b3345] outline-none transition focus:border-[#ef6bb4] resize-none"
                                        />
                                    </div>

                                </form>
                            </div>

                            {/* Actions Footer inside Drawer */}
                            <div className="flex gap-2 pt-4 border-t border-[#fcecf4] mt-5">
                                <button
                                    type="button"
                                    onClick={handleSaveTier}
                                    disabled={isSaving}
                                    className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] text-white font-bold text-sm shadow-[0_8px_18px_rgba(235,90,153,0.18)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                            {language === "vi" ? "Đang lưu..." : "Saving..."}
                                        </>
                                    ) : (
                                        language === "vi" ? "Lưu Cài đặt Cấp độ" : "Save Tier Settings"
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    disabled={isSaving}
                                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#f5cbdc] bg-white px-5 text-sm font-bold text-[#b95d88] hover:bg-[#fff5f8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {language === "vi" ? "Hủy" : "Cancel"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Action Notifications */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-lg ${notification.type === "error"
                            ? "bg-[#d14c84] shadow-[0_12px_24px_rgba(209,76,132,0.3)]"
                            : "bg-[#16975f] shadow-[0_12px_24px_rgba(22,151,95,0.3)]"
                            }`}
                    >
                        {notification.type === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
                        <span>{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                isDeleting={isDeleting}
                title={language === "vi" ? "Xóa Cấp độ thành viên" : "Delete Loyalty Tier"}
                description={
                    deleteTarget
                        ? (language === "vi"
                            ? `Bạn có chắc chắn muốn xóa cấp độ "${deleteTarget.name}"? Hành động này không thể hoàn tác và tất cả cấu hình cấp độ sẽ bị loại bỏ vĩnh viễn.`
                            : `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone and all tier configuration will be permanently removed.`)
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
}