import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserCircle,
  Phone,
  Mail,
  Calendar,
  Activity,
  CalendarPlus,
  Sparkles,
  UserCheck,
  Edit,
  ShieldCheck,
  Star,
  Award,
  Clock,
  DollarSign,
  Heart,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Save,
  Tag,
  Check,
  X,
  CreditCard,
  Scissors,
} from "lucide-react";
import { Spin, Modal, Input, Select, Tag as AntTag, Progress } from "antd";
import toast from "react-hot-toast";

import {
  fetchReceptionistCustomerDetail,
  updateReceptionistCustomer,
  fetchCustomerBookings,
  fetchLoyaltyTiers,
  fetchPromotions,
} from "../services/receptionistCustomerService";
import { getReceptionistSalonId } from "../../bookings/services/receptionistBookingService";
import { ROUTES } from "../../../../shared/constants/routes";

function formatDate(dateString) {
  if (!dateString) return "Chưa cập nhật";
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "0 đ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function getInitials(firstName, lastName) {
  const f = (firstName || "").trim()[0] || "";
  const l = (lastName || "").trim()[0] || "";
  const initials = `${f}${l}`.toUpperCase();
  return initials || "CU";
}

function getAvatarBg(userId) {
  const gradients = [
    "from-[#EC4899] to-[#F43F5E]",
    "from-[#8B5CF6] to-[#6366F1]",
    "from-[#F59E0B] to-[#EF4444]",
    "from-[#10B981] to-[#059669]",
  ];
  const charCode = (userId || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return gradients[charCode % gradients.length];
}

function getStatusBadge(status) {
  const norm = String(status || "").trim().toLowerCase();
  switch (norm) {
    case "active":
    case "current":
      return { label: "Hoạt động", bg: "bg-[#E8F8EF] text-[#1F9D61] border-[#B8F0D0]" };
    case "prospective":
      return { label: "Tiềm năng", bg: "bg-[#F5ECFF] text-[#7C63D8] border-[#DCD0FF]" };
    case "non-active":
    case "inactive":
      return { label: "Tạm khóa", bg: "bg-[#F1F1F1] text-[#666666] border-[#E0E0E0]" };
    default:
      return { label: status || "Hoạt động", bg: "bg-[#E8F8EF] text-[#1F9D61] border-[#B8F0D0]" };
  }
}

function getBookingStatusBadge(status) {
  const norm = String(status || "").trim().toLowerCase();
  switch (norm) {
    case "completed":
    case "finished":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "confirmed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "in-progress":
    case "inprogress":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "cancelled":
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-purple-50 text-purple-700 border-purple-200";
  }
}

export function ReceptionistCustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "bookings" | "preferences" | "loyalty"
  const [loyaltyTiers, setLoyaltyTiers] = useState([]);
  const [promotions, setPromotions] = useState([]);

  // Customer Preferences State
  const [preferenceTags, setPreferenceTags] = useState(["Sơn Gel nhạt", "Móng vuông tròn", "Ưu tiên thợ kinh nghiệm"]);
  const [newTagInput, setNewTagInput] = useState("");

  // Edit Customer Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchReceptionistCustomerDetail(id);
      setCustomer(data);
      setEditFirstName(data.firstName || "");
      setEditLastName(data.lastName || "");
      setEditEmail(data.email || "");
      setEditPhone(data.phone || "");
      setEditStatus(data.status || "Active");

      const tiers = await fetchLoyaltyTiers();
      setLoyaltyTiers(tiers || []);

      const promoData = await fetchPromotions();
      setPromotions(promoData?.items || []);

      // Load customer bookings
      try {
        const salonId = getReceptionistSalonId();
        if (salonId) {
          setLoadingBookings(true);
          const searchKeyword = data.phone || data.email || data.firstName || "";
          const bookingList = await fetchCustomerBookings(salonId, searchKeyword);
          setBookings(bookingList);
        }
      } catch (err) {
        console.warn("Could not retrieve salonId for customer booking search:", err);
      }
    } catch (error) {
      console.error("Error loading customer detail:", error);
      toast.error("Không thể tải thông tin khách hàng.");
    } finally {
      setIsLoading(false);
      setLoadingBookings(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const customerTier = useMemo(() => {
    if (!loyaltyTiers?.length || !customer) return null;
    const pts = customer.loyaltyPoint || 0;
    return loyaltyTiers.find(t =>
      pts >= t.minLifetimePoints &&
      (t.maxLifetimePoints === null || pts <= t.maxLifetimePoints)
    ) || loyaltyTiers[0];
  }, [customer, loyaltyTiers]);

  const nextTier = useMemo(() => {
    if (!loyaltyTiers?.length || !customerTier) return null;
    const currentIdx = loyaltyTiers.findIndex(t => t.loyaltyTierId === customerTier.loyaltyTierId);
    if (currentIdx !== -1 && currentIdx < loyaltyTiers.length - 1) {
      return loyaltyTiers[currentIdx + 1];
    }
    return null;
  }, [loyaltyTiers, customerTier]);

  // const promotionMessage = useMemo(() => {
  //   if (!promotions || promotions.length === 0) return "Tích điểm để nhận nhiều ưu đãi!";

  //   // Tìm khuyến mãi Active phù hợp không phải đền bù
  //   const activePromos = promotions.filter(p => p.status === 'Active' && p.situation !== 'Cancelled' && p.situation !== 'Reschedule');

  //   if (activePromos.length > 0) {
  //     const p = activePromos[0];
  //     if (p.discountType === 'Percentage') {
  //       return `Đủ điều kiện đổi ưu đãi ${p.discountValue}%`;
  //     } else if (p.discountType === 'FixedAmount') {
  //       return `Đủ điều kiện đổi ưu đãi ${p.discountValue.toLocaleString('vi-VN')}đ`;
  //     }
  //     return `Đủ điều kiện đổi: ${p.name}`;
  //   }

  //   return "Tích điểm để nhận nhiều ưu đãi!";
  // }, [promotions]);

  const handleCreateWalkIn = () => {
    if (!customer) return;
    navigate(ROUTES.receptionistBookingsCreate, {
      state: {
        customer: customer,
        customerId: customer.userId,
        prefillCustomerName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
        prefillPhone: customer.phone || "",
      },
    });
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim()) {
      toast.error("Vui lòng nhập Tên khách hàng.");
      return;
    }
    try {
      setIsSavingProfile(true);
      await updateReceptionistCustomer(id, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        status: editStatus,
      });
      toast.success("Cập nhật thông tin khách hàng thành công!");
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error(err.message || "Cập nhật thông tin thất bại.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddPreferenceTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (preferenceTags.includes(trimmed)) {
      toast.error("Nhãn sở thích này đã tồn tại.");
      return;
    }
    setPreferenceTags([...preferenceTags, trimmed]);
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setPreferenceTags(preferenceTags.filter((t) => t !== tagToRemove));
  };

  // Calculated Metrics
  const metrics = useMemo(() => {
    const totalBookingsCount = bookings.length;
    const completedBookings = bookings.filter(
      (b) => String(b.status).toLowerCase() === "completed" || String(b.status).toLowerCase() === "finished"
    );
    const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || Number(b.finalPrice) || 0), 0);
    const avgSpent = totalBookingsCount > 0 ? Math.round(totalSpent / totalBookingsCount) : 0;

    return {
      totalBookings: totalBookingsCount,
      completedBookings: completedBookings.length,
      totalSpent,
      avgSpent,
    };
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-[#FAF7F9]">
        <Spin size="large" tip="Đang tải hồ sơ khách hàng..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center bg-[#FAF7F9] text-gray-500 font-sans">
        <UserCircle size={60} className="mb-4 text-[#EA4F93] opacity-40" />
        <p className="text-base font-extrabold text-[#3D243C]">Không tìm thấy thông tin khách hàng</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2.5 bg-[#FFF0F5] border border-[#F4D6E4] hover:bg-[#FFE5EE] text-[#EA4F93] rounded-full text-xs font-bold transition shadow-2xs"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Khách Hàng";
  const statusInfo = getStatusBadge(customer.status);
  const initials = getInitials(customer.firstName, customer.lastName);
  const avatarGradient = getAvatarBg(customer.userId);

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F9] p-4 md:p-8 font-sans space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-[#F4D6E4] text-[#8C677F] hover:text-[#EA4F93] hover:bg-[#FFF8FA] rounded-2xl transition shadow-2xs cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2B182B] tracking-tight flex items-center gap-2.5">
              Hồ Sơ Khách Hàng
            </h1>
            <p className="text-xs text-[#9E8497] font-medium">
              Quản lý chi tiết tài khoản, lịch sử dịch vụ và ưu đãi tích điểm
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#F4D6E4] text-[#2B182B] text-xs font-bold shadow-2xs hover:bg-[#FFF8FA] hover:border-[#EA4F93] transition cursor-pointer"
          >
            <Edit size={15} className="text-[#EA4F93]" />
            Chỉnh Sửa Hồ Sơ
          </button>

          <button
            type="button"
            onClick={handleCreateWalkIn}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#EA4F93] via-[#E11D48] to-[#BE123C] text-white text-xs font-bold shadow-md hover:shadow-lg transition hover:-translate-y-0.5 cursor-pointer"
          >
            <CalendarPlus size={16} />
            Tạo Lịch Hẹn Đặt Chỗ
          </button>
        </div>
      </div>

      {/* Hero Customer Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2A172A] via-[#3B1C38] to-[#251024] p-6 md:p-7 text-white shadow-xl border border-pink-900/30">
        {/* Glow Decor Background */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Col 1: Identity & Avatar (4 Cols) */}
          <div className="lg:col-span-5 flex items-center gap-4.5">
            {customer.avatarUrl ? (
              <img
                src={customer.avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md ring-4 ring-pink-500/30 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EA4F93] via-[#E11D48] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-2xl shadow-md border-2 border-white/30 ring-4 ring-pink-500/30 shrink-0">
                {initials}
              </div>
            )}

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white truncate">{fullName}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${statusInfo.bg}`}>
                  {statusInfo.label}
                </span>
                {customerTier && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-xs flex items-center gap-1"
                    style={{
                      backgroundColor: customerTier.backgroundColor,
                      color: customerTier.textColor || '#fff'
                    }}
                  >
                    <Award size={11} /> VIP {customerTier.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: Translucent Info Cards (Email, Phone, Date) (5 Cols) */}
          <div className="lg:col-span-4 flex flex-wrap items-center gap-2.5 overflow-hidden">
            <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-3 hover:bg-white/10 transition max-w-full min-w-0">
              <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} className="text-pink-400" /> Email
              </p>
              <a
                href={customer.email ? `mailto:${customer.email}` : "#"}
                className="text-xs font-bold text-white hover:text-pink-300 transition block mt-0.5 truncate"
                title={customer.email || "Chưa cập nhật"}
              >
                {customer.email || "Chưa cập nhật"}
              </a>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-3 hover:bg-white/10 transition max-w-full shrink-0">
              <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={12} className="text-pink-400" /> SĐT
              </p>
              <a
                href={customer.phone ? `tel:${customer.phone}` : "#"}
                className="text-xs font-bold text-white hover:text-pink-300 transition block mt-0.5 truncate"
              >
                {customer.phone || "Chưa cập nhật"}
              </a>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-3 hover:bg-white/10 transition max-w-full shrink-0">
              <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-pink-400" /> Ngày Đăng Ký
              </p>
              <p className="text-xs font-bold text-white truncate mt-0.5">{formatDate(customer.createdAt)}</p>
            </div>
          </div>

          {/* Col 3: Gold Loyalty Points Box (3 Cols) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 via-pink-500/10 to-purple-500/20 border border-amber-400/30 p-4 text-center space-y-1 shadow-md backdrop-blur-md">
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400 animate-pulse" /> Điểm Thưởng Tích Lũy
              </p>
              <p className="text-3xl font-bold text-amber-300">
                {customer.loyaltyPoint || 0} <span className="text-xs font-extrabold text-white">pts</span>
              </p>
              {/* <span className="inline-block rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[9.5px] font-bold text-amber-200">
                {promotionMessage}
              </span> */}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-white p-4 border border-[#F3E2EC] shadow-2xs flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F5] text-[#EA4F93] shrink-0">
            <CalendarPlus size={22} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#9E8497]">Tổng Lịch Hẹn</p>
            <p className="text-xl font-bold text-[#2B182B]">{metrics.totalBookings} đơn</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{metrics.completedBookings} hoàn thành</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-[#F3E2EC] shadow-2xs flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#10B981] shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#9E8497]">Tổng Chi Tiêu</p>
            <p className="text-xl font-bold text-[#2B182B]">{formatCurrency(metrics.totalSpent)}</p>
            <p className="text-[10px] text-[#9E8497] font-semibold mt-0.5">~{formatCurrency(metrics.avgSpent)}/lần</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-[#F3E2EC] shadow-2xs flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF3C7] text-[#D97706] shrink-0">
            <Star size={22} className="fill-[#D97706]" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#9E8497]">Đánh Giá Dịch Vụ</p>
            <p className="text-xl font-bold text-[#2B182B]">5.0 / 5.0</p>
            <p className="text-[10px] text-[#D97706] font-bold mt-0.5">3 Đánh giá hài lòng</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-[#F3E2EC] shadow-2xs flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0" style={{ backgroundColor: customerTier ? `${customerTier.backgroundColor}20` : '#EEF2FF', color: customerTier ? customerTier.backgroundColor : '#4F46E5' }}>
            <Award size={22} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#9E8497]">Hạng Thành Viên</p>
            <p className="text-xl font-bold text-[#2B182B]" style={{ color: customerTier?.backgroundColor }}>{customerTier ? customerTier.name : "Thành Viên"}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: customerTier?.backgroundColor || '#4F46E5' }}>Tích điểm tự động</p>
          </div>
        </div>
      </div>

      {/* Main Tab Container */}
      <div className="rounded-3xl bg-white border border-[#F3E2EC] shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#F3E2EC] bg-[#FFFCFD] px-6 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer ${activeTab === "info"
              ? "border-[#EA4F93] text-[#EA4F93]"
              : "border-transparent text-[#9E8497] hover:text-[#2B182B]"
              }`}
          >
            <Sparkles size={15} />
            <span>Thông Tin Cá Nhân & Ghi Chú</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer ${activeTab === "bookings"
              ? "border-[#EA4F93] text-[#EA4F93]"
              : "border-transparent text-[#9E8497] hover:text-[#2B182B]"
              }`}
          >
            <Clock size={15} />
            <span>Lịch Sử Đặt Hẹn ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer ${activeTab === "preferences"
              ? "border-[#EA4F93] text-[#EA4F93]"
              : "border-transparent text-[#9E8497] hover:text-[#2B182B]"
              }`}
          >
            <Scissors size={15} />
            <span>Sở Thích Móng & Phong Cách</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("loyalty")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer ${activeTab === "loyalty"
              ? "border-[#EA4F93] text-[#EA4F93]"
              : "border-transparent text-[#9E8497] hover:text-[#2B182B]"
              }`}
          >
            <Award size={15} />
            <span>Ưu Đãi Loyalty</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 md:p-8">
          {/* TAB 1: Personal Info & Notes */}
          {activeTab === "info" && (
            <div className="space-y-6 animate-fadeIn w-full">
              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFF9FC] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#F4D6E4] pb-3">
                  <h3 className="text-sm font-bold text-[#2B182B] uppercase tracking-wider flex items-center gap-2">
                    <UserCheck size={16} className="text-[#EA4F93]" /> Thông Tin Liên Hệ Khách Hàng
                  </h3>
                  <span className="text-[11px] text-[#9E8497] font-semibold">Tài khoản chính chủ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-white rounded-xl border border-[#F3E2EC] space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] flex items-center gap-1.5">
                      <Mail size={13} className="text-[#EA4F93]" /> Địa chỉ Email
                    </p>
                    <p className="font-bold text-[#2B182B] text-sm break-all">{customer.email || "Chưa cập nhật"}</p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#F3E2EC] space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] flex items-center gap-1.5">
                      <Phone size={13} className="text-[#EA4F93]" /> Số Điện Thoại
                    </p>
                    <p className="font-bold text-[#2B182B] text-sm">{customer.phone || "Chưa cập nhật"}</p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#F3E2EC] space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#EA4F93]" /> Ngày Đăng Ký Hệ Thống
                    </p>
                    <p className="font-bold text-[#2B182B] text-sm">{formatDate(customer.createdAt)}</p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#F3E2EC] space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] flex items-center gap-1.5">
                      <Activity size={13} className="text-[#EA4F93]" /> Trạng Thái Tài Khoản
                    </p>
                    <p className="font-bold text-[#2B182B] text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      {customer.status || "Active"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Preferences Tags */}
              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFF9FC] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#F4D6E4] pb-3">
                  <h3 className="text-sm font-bold text-[#2B182B] uppercase tracking-wider flex items-center gap-2">
                    <Tag size={16} className="text-[#EA4F93]" /> Nhãn Sở Thích & Lưu Ý Làm Móng
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {preferenceTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#F4D6E4] px-3 py-1.5 text-xs font-extrabold text-[#2B182B] shadow-2xs"
                    >
                      <Heart size={12} className="text-[#EA4F93] fill-[#EA4F93]" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-[#9E8497] hover:text-[#E11D48] transition cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onPressEnter={handleAddPreferenceTag}
                    placeholder="Thêm sở thích mới (VD: Dị ứng nước tẩy, Sơn Gel nhạt...)"
                    className="rounded-xl border-[#F3D7E4] text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddPreferenceTag}
                    className="rounded-xl bg-[#EA4F93] px-4 py-2 text-xs font-bold text-white hover:bg-[#D4387B] transition shrink-0 cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Booking History */}
          {activeTab === "bookings" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#2B182B] uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-[#EA4F93]" /> Danh Sách Lịch Hẹn Đặt Chỗ
                </h3>
                <span className="text-xs font-bold text-[#9E8497]">Hiển thị {bookings.length} lịch hẹn gần nhất</span>
              </div>

              {loadingBookings ? (
                <div className="py-12 text-center">
                  <Spin size="medium" tip="Đang tải danh sách đặt hẹn..." />
                </div>
              ) : bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#F4D6E4] bg-[#FFF9FC] py-12 text-center space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0F5] text-[#EA4F93] mx-auto">
                    <Calendar size={28} />
                  </div>
                  <p className="text-sm font-bold text-[#2B182B]">Chưa tìm thấy lịch hẹn nào của khách hàng</p>
                  <p className="text-xs text-[#9E8497]">Tạo ngay một lịch hẹn mới cho khách hàng tại chi nhánh.</p>
                  <button
                    type="button"
                    onClick={handleCreateWalkIn}
                    className="inline-flex items-center gap-2 rounded-full bg-[#EA4F93] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#D4387B] transition cursor-pointer"
                  >
                    <CalendarPlus size={15} /> Tạo Lịch Hẹn Mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((item, idx) => {
                    const bStatus = item.status || "Confirmed";
                    const statusClass = getBookingStatusBadge(bStatus);
                    return (
                      <div
                        key={item.bookingId || item.id || idx}
                        className="rounded-2xl border border-[#F3E2EC] bg-white p-4 hover:border-[#EA4F93]/40 transition shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F5] text-[#EA4F93] shrink-0 font-bold text-xs">
                            #{String(item.orderCode || item.bookingId || idx + 1).slice(-4)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-[#2B182B]">
                                Lịch Hẹn {formatDate(item.bookingDate || item.appointmentTime)}
                              </p>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusClass}`}>
                                {bStatus}
                              </span>
                            </div>
                            <p className="text-xs text-[#9E8497] font-medium mt-0.5">
                              Thợ phụ trách: <span className="font-bold text-[#2B182B]">{item.artistName || item.nailArtistName || "Chưa phân bổ"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 border-t md:border-t-0 border-[#F3E2EC] pt-3 md:pt-0">
                          <div className="text-right">
                            <p className="text-xs text-[#9E8497] font-medium">Tổng Tiền Dịch Vụ</p>
                            <p className="text-sm font-bold text-[#EA4F93]">
                              {formatCurrency(item.totalAmount || item.finalPrice || 0)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/receptionist/bookings/${item.bookingId || item.id}`)}
                            className="p-2 rounded-xl border border-[#F3E2EC] hover:bg-[#FFF0F5] hover:border-[#EA4F93] text-[#2B182B] hover:text-[#EA4F93] transition cursor-pointer"
                            title="Xem chi tiết đơn hẹn"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Preferences & Style */}
          {activeTab === "preferences" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFF9FC] p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#2B182B] uppercase tracking-wider flex items-center gap-2">
                  <Scissors size={16} className="text-[#EA4F93]" /> Mẫu Móng & Phong Cách Thường Làm
                </h3>
                <p className="text-xs text-[#9E8497]">
                  Thông tin phong cách ưu thích giúp thợ nail chuẩn bị dụng cụ và phụ kiện phù hợp trước khi làm móng.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-white rounded-xl border border-[#F3E2EC] text-center space-y-1">
                    <p className="text-xs font-bold text-[#9E8497]">Dáng Móng Yêu Thích</p>
                    <p className="text-base font-bold text-[#2B182B]">Square Almond (Vuông Tròn)</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-[#F3E2EC] text-center space-y-1">
                    <p className="text-xs font-bold text-[#9E8497]">Tone Màu Sơn Hay Dùng</p>
                    <p className="text-base font-bold text-[#EA4F93]">Nude Pastel & Pastel Pink</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-[#F3E2EC] text-center space-y-1">
                    <p className="text-xs font-bold text-[#9E8497]">Loại Mặt Móng Ưu Tiên</p>
                    <p className="text-base font-bold text-[#2B182B]">Gel Cứng Cao Cấp</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Loyalty */}
          {activeTab === "loyalty" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/60 via-amber-50/20 to-amber-50/60 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs" style={{ backgroundColor: customerTier?.backgroundColor || '#F5C842' }}>
                      <Award size={26} style={{ color: customerTier?.textColor || '#fff' }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#2B182B]">Hạng Thành Viên VIP {customerTier ? customerTier.name : ""}</h3>
                      <p className="text-xs text-[#9E8497] font-medium">Tích {customer.loyaltyPoint || 0} điểm thưởng / Đã tiêu {formatCurrency(metrics.totalSpent)}</p>
                    </div>
                  </div>
                  <span className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-xs" style={{ backgroundColor: customerTier?.backgroundColor || '#F5C842', color: customerTier?.textColor || '#fff' }}>
                    {customerTier ? customerTier.name : "Thành Viên"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-extrabold text-[#2B182B]">
                    <span>Tiến trình thăng hạng {nextTier ? nextTier.name : "Tối đa"}</span>
                    <span>{customer.loyaltyPoint || 0} {nextTier ? `/ ${nextTier.minLifetimePoints} Pts` : "Pts"}</span>
                  </div>
                  <Progress percent={nextTier ? ((customer.loyaltyPoint || 0) / nextTier.minLifetimePoints) * 100 : 100} strokeColor={{ "0%": customerTier?.backgroundColor || "#F59E0B", "100%": nextTier?.backgroundColor || "#D97706" }} showInfo={false} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT CUSTOMER PROFILE MODAL */}
      <Modal
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        closable={false}
        centered
        width={540}
        styles={{ content: { padding: 0, borderRadius: 28, overflow: "hidden" } }}
      >
        <div className="bg-white p-6 md:p-7 font-sans relative">
          <div className="flex items-center justify-between border-b border-[#F3E2EC] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F5] text-[#EA4F93]">
                <Edit size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2B182B]">Chỉnh Sửa Thông Tin Khách Hàng</h3>
                <p className="text-xs text-[#9E8497] font-medium">Cập nhật hồ sơ tài khoản chi tiết</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-full p-2 text-[#9E8497] hover:bg-[#FFF0F5] hover:text-[#EA4F93] transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2B182B] uppercase tracking-wider mb-1">
                  Họ (Last Name)
                </label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Nhập họ..."
                  className="rounded-xl border-[#F3D7E4] text-xs font-medium py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2B182B] uppercase tracking-wider mb-1">
                  Tên (First Name)
                </label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="Nhập tên..."
                  className="rounded-xl border-[#F3D7E4] text-xs font-medium py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B182B] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone size={13} className="text-[#EA4F93]" /> Số Điện Thoại
              </label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="rounded-xl border-[#F3D7E4] text-xs font-medium py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B182B] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail size={13} className="text-[#EA4F93]" /> Địa Chỉ Email
              </label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Nhập email..."
                className="rounded-xl border-[#F3D7E4] text-xs font-medium py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B182B] uppercase tracking-wider mb-1">
                Trạng Thái Tài Khoản
              </label>
              <Select
                value={editStatus}
                onChange={(val) => setEditStatus(val)}
                className="w-full text-xs font-medium"
                options={[
                  { value: "Active", label: "Active (Hoạt động bình thường)" },
                  { value: "Inactive", label: "Inactive (Tạm ngưng hoạt động)" },
                ]}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#F3E2EC]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full border border-[#F3D7E4] px-5 py-2.5 text-xs font-bold text-[#2B182B] hover:bg-[#FAF0F5] transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#EA4F93] to-[#E11D48] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                <Check size={16} />
                {isSavingProfile ? "Đang lưu..." : "Lưu Thay Đổi"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}


