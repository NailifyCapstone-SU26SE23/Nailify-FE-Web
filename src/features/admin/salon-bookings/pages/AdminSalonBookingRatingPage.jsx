import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  User,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Search,
  RotateCcw,
  TrendingUp,
  Smile,
  ShieldCheck,
  Zap,
  Store,
  MapPin,
  Phone,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkle
} from "lucide-react";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";
import { fetchBookingRatingsBySalonId, fetchUserById } from "../../../manager/bookings/services/bookingsService";
import { fetchAllSalonStaff } from "../../../manager/staff-artist-management/services/nailArtistsService";
import { formatDate } from "../../../../shared/utils/formatDate";
import { Spin, Alert, Select, DatePicker } from "antd";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import dayjs from "dayjs";

// Helper to generate initials for custom avatar when imageUrl is missing
const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Colors for customer initials avatar backgrounds
const getAvatarColor = (name) => {
  const colors = [
    "bg-[#fff2f7] text-[#ea4f93] border border-[#ea4f93]/15",
    "bg-amber-50 text-amber-700 border border-amber-100",
    "bg-emerald-50 text-emerald-700 border border-emerald-100",
    "bg-blue-50 text-blue-700 border border-blue-100",
    "bg-purple-50 text-purple-700 border border-purple-100",
    "bg-rose-50 text-rose-700 border border-rose-100",
  ];
  let sum = 0;
  for (let i = 0; i < (name || "").length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

// Motion presets
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

export function AdminSalonBookingRatingPage() {
  const { t, language } = useLanguage();
  const [salons, setSalons] = useState([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [salonsError, setSalonsError] = useState(null);

  // Selection state
  const [selectedSalon, setSelectedSalon] = useState(null);

  // Ratings list and lookup states
  const [ratings, setRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [ratingsError, setRatingsError] = useState(null);
  const [usersMap, setUsersMap] = useState({});

  // Background metrics caching per salon
  const [salonMetrics, setSalonMetrics] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Search & Filters state
  const [salonSearchQuery, setSalonSearchQuery] = useState("");
  const [salonStatusFilter, setSalonStatusFilter] = useState("all");
  const [salonSortOption, setSalonSortOption] = useState("name");

  // Reviews filters
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewScoreFilter, setReviewScoreFilter] = useState("all");
  const [reviewSortBy, setReviewSortBy] = useState("recent");
  const [reviewFilterDate, setReviewFilterDate] = useState(null);

  // Load Salons list
  const loadSalons = async () => {
    setLoadingSalons(true);
    setSalonsError(null);
    try {
      const response = await fetchAdminSalons({ pageIndex: 1, pageSize: 100 });
      const items = response.items || [];
      setSalons(items);
      loadSalonMetrics(items);
    } catch (err) {
      setSalonsError(err.message || "Failed to load salons list.");
    } finally {
      setLoadingSalons(false);
    }
  };

  // Load salon ratings metrics in parallel
  const loadSalonMetrics = async (salonsList) => {
    setLoadingMetrics(true);
    const metricsMap = {};
    try {
      await Promise.all(
        salonsList.map(async (salon) => {
          try {
            const data = await fetchBookingRatingsBySalonId(salon.id);
            const items = data || [];
            const average = items.length > 0
              ? Number((items.reduce((sum, r) => sum + (r.overallScore || 0), 0) / items.length).toFixed(1))
              : 0;
            metricsMap[salon.id] = {
              count: items.length,
              average
            };
          } catch (err) {
            console.error(`Failed to load reviews for salon ${salon.id}:`, err);
            metricsMap[salon.id] = { count: 0, average: 0 };
          }
        })
      );
      setSalonMetrics(metricsMap);
    } catch (err) {
      console.error("Error aggregating reviews metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadSalons();
  }, []);

  // Fetch unique user details and staff lists for reviews page
  const loadUserNames = async (ratingsList, currentSalonId) => {
    const newUsers = { ...usersMap };

    // 1. Fetch staff
    try {
      const staffList = await fetchAllSalonStaff(currentSalonId);
      if (Array.isArray(staffList)) {
        staffList.forEach((s) => {
          if (s.staffId) {
            newUsers[s.staffId] = {
              name: s.name,
              avatarUrl: s.avatarUrl || ""
            };
          }
        });
      }
    } catch (err) {
      console.error("Failed to load salon staff list:", err);
    }

    // 2. Fetch customer user details
    const uniqueCustomerIds = new Set();
    ratingsList.forEach((r) => {
      if (r.customerId) uniqueCustomerIds.add(r.customerId);
    });

    const customerIdsToFetch = Array.from(uniqueCustomerIds).filter(id => !newUsers[id]);

    if (customerIdsToFetch.length > 0) {
      try {
        await Promise.all(
          customerIdsToFetch.map(async (id) => {
            try {
              const user = await fetchUserById(id);
              const firstName = String(user?.firstName || "").trim();
              const lastName = String(user?.lastName || "").trim();
              const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || user?.fullName || user?.userName || user?.name || "User";
              newUsers[id] = {
                name: fullName,
                avatarUrl: user?.avatarUrl || ""
              };
            } catch (err) {
              console.error(`Failed to fetch user name for ID ${id}:`, err);
              newUsers[id] = { name: "User", avatarUrl: "" };
            }
          })
        );
      } catch (err) {
        console.error("Error loading user names:", err);
      }
    }

    setUsersMap(newUsers);
  };

  // Load reviews list when a salon is selected
  const loadReviewsForSelectedSalon = async () => {
    if (!selectedSalon) return;
    setLoadingRatings(true);
    setRatingsError(null);
    try {
      const data = await fetchBookingRatingsBySalonId(selectedSalon.id);
      setRatings(data || []);
      loadUserNames(data || [], selectedSalon.id);
    } catch (err) {
      setRatingsError(err.message || "Failed to load ratings for selected salon.");
    } finally {
      setLoadingRatings(false);
    }
  };

  useEffect(() => {
    loadReviewsForSelectedSalon();
  }, [selectedSalon]);

  const handleBackToSalons = () => {
    setSelectedSalon(null);
    setRatings([]);
  };

  // Client side sorting & filtering for Salons Selector
  const filteredSalons = useMemo(() => {
    let items = [...salons];

    // Filter status
    if (salonStatusFilter !== "all") {
      items = items.filter(
        (s) => (s.status || "Active").toLowerCase() === salonStatusFilter.toLowerCase()
      );
    }

    // Filter search query
    if (salonSearchQuery.trim()) {
      const query = salonSearchQuery.toLowerCase();
      items = items.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.address?.toLowerCase().includes(query)
      );
    }

    // Sort options
    if (salonSortOption === "name") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (salonSortOption === "rating") {
      items.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (salonSortOption === "reviews") {
      items.sort((a, b) => {
        const countA = salonMetrics[a.id]?.count || 0;
        const countB = salonMetrics[b.id]?.count || 0;
        return countB - countA;
      });
    }

    return items;
  }, [salons, salonStatusFilter, salonSearchQuery, salonSortOption, salonMetrics]);

  // Derived global metrics for the header
  const totalNetworkReviews = useMemo(() => {
    return Object.values(salonMetrics).reduce((sum, m) => sum + (m.count || 0), 0);
  }, [salonMetrics]);

  const networkAvgScore = useMemo(() => {
    const values = Object.values(salonMetrics).filter(m => m.count > 0);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, m) => acc + (m.average || 0), 0);
    return Number((sum / values.length).toFixed(1));
  }, [salonMetrics]);

  // Client side filters for Reviews Feed
  const processedRatings = useMemo(() => {
    let items = [...ratings];

    // Filter by score
    if (reviewScoreFilter !== "all") {
      const targetScore = parseInt(reviewScoreFilter, 10);
      items = items.filter(r => Math.round(r.overallScore) === targetScore);
    }

    // Filter by search query
    if (reviewSearchQuery.trim()) {
      const query = reviewSearchQuery.toLowerCase();
      items = items.filter((r) => {
        const cName = (r.customerName || usersMap[r.customerId]?.name || "Customer").toLowerCase();
        const artist = (r.nailArtistName || usersMap[r.nailArtistId]?.name || "Staff").toLowerCase();
        const comment = (r.comment || "").toLowerCase();
        return cName.includes(query) || artist.includes(query) || comment.includes(query);
      });
    }

    // Filter by date
    if (reviewFilterDate) {
      items = items.filter(r => dayjs(r.createdAt).isSame(reviewFilterDate, 'day'));
    }

    // Sort options
    if (reviewSortBy === "recent") {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (reviewSortBy === "highest") {
      items.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    } else if (reviewSortBy === "lowest") {
      items.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
    }

    return items;
  }, [ratings, reviewSearchQuery, reviewScoreFilter, reviewSortBy, usersMap, reviewFilterDate]);

  // Aggregate stats for the active salon review board
  const activeSalonStats = useMemo(() => {
    if (ratings.length === 0) {
      return {
        total: 0,
        average: 0,
        quality: 0,
        punctuality: 0,
        cleanliness: 0,
        starsBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const total = ratings.length;
    const sumOverall = ratings.reduce((sum, r) => sum + (r.overallScore || 0), 0);
    const sumQuality = ratings.reduce((sum, r) => sum + (r.serviceQuality || 0), 0);
    const sumPunctuality = ratings.reduce((sum, r) => sum + (r.punctuality || 0), 0);
    const sumCleanliness = ratings.reduce((sum, r) => sum + (r.cleanliness || 0), 0);

    const starsBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      const score = Math.min(5, Math.max(1, Math.round(r.overallScore || 5)));
      starsBreakdown[score] = (starsBreakdown[score] || 0) + 1;
    });

    return {
      total,
      average: Number((sumOverall / total).toFixed(1)),
      quality: Number((sumQuality / total).toFixed(1)),
      punctuality: Number((sumPunctuality / total).toFixed(1)),
      cleanliness: Number((sumCleanliness / total).toFixed(1)),
      starsBreakdown
    };
  }, [ratings]);

  const isVi = language === "vi";

  return (
    <div className="min-h-[100dvh] bg-[#fafaf9] p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#ea4f93]/6 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-[-100px] -z-10 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#ffa26f]/4 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#ea4f93]/10 text-[#ea4f93]">
                <Store size={18} className="stroke-[2]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ea4f93]">
                {isVi ? "Bảng điều khiển quản trị" : "Admin Control Panel"}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[#2d1b35] tracking-tight md:text-4xl">
              {t("menus.admin-reviews") || "Salons Feedback Audit"}
            </h1>
            <p className="text-xs md:text-sm text-[#a88a9f] max-w-[65ch] leading-relaxed">
              {selectedSalon
                ? (isVi ? `Đang kiểm toán chỉ số hài lòng và các phản hồi của khách hàng tại ${selectedSalon.name}.` : `Auditing satisfaction indices and customer feedback cards for ${selectedSalon.name}.`)
                : (isVi ? "Chọn một chi nhánh salon bên dưới để kiểm toán lịch sử đánh giá của khách hàng và điểm chất lượng dịch vụ." : "Select a salon branch below to audit customer review history and service quality scores.")
              }
            </p>
          </div>

          {selectedSalon && (
            <button
              onClick={handleBackToSalons}
              className="flex self-start md:self-auto items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4.5 py-3 text-xs font-bold text-[#2d1b35] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-[#ea4f93]/30 transition-all duration-300 active:scale-[0.98]"
            >
              <ArrowLeft size={13} />
              {isVi ? "Quay lại chi nhánh" : "Back to Salons"}
            </button>
          )}
        </div>

        {/* STATE 1: Salon Grid Selection */}
        {!selectedSalon ? (
          <div className="space-y-6">
            {/* Global Stats Overview */}
            {salons.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Salons */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-[#f1e7ed]/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center gap-4">
                  <span className="p-3.5 rounded-2xl bg-pink-50 text-[#ea4f93] shrink-0">
                    <Store size={20} />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-[#a88a9f] uppercase tracking-wider block">{isVi ? "Chi nhánh hệ thống" : "Network Branches"}</span>
                    <span className="text-2xl font-bold text-[#2d1b35]">{salons.length}</span>
                  </div>
                </div>

                {/* Total reviews */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-[#f1e7ed]/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center gap-4">
                  <span className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                    <MessageSquare size={20} />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-[#a88a9f] uppercase tracking-wider block">{isVi ? "Đánh giá đã duyệt" : "Audited Reviews"}</span>
                    <span className="text-2xl font-bold text-[#2d1b35]">
                      {loadingMetrics ? <Spin size="small" /> : `${totalNetworkReviews} logs`}
                    </span>
                  </div>
                </div>

                {/* Average Score */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-[#f1e7ed]/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center gap-4">
                  <span className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                    <Star size={20} className="fill-current" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-[#a88a9f] uppercase tracking-wider block">{isVi ? "Điểm trung bình" : "Network Avg Score"}</span>
                    <span className="text-2xl font-mono font-bold text-[#2d1b35]">
                      {loadingMetrics ? <Spin size="small" /> : `${networkAvgScore} / 5`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Toolbar search & filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/75 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
                <input
                  type="text"
                  placeholder={isVi ? "Lọc theo tên chi nhánh..." : "Search salons by name, address..."}
                  value={salonSearchQuery}
                  onChange={(e) => setSalonSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/30 focus:outline-hidden focus:bg-white focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 bg-[#fcf9fb] p-1 rounded-2xl border border-[#f1e7ed]">
                  {["all", "active", "busy", "closed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSalonStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${salonStatusFilter === st
                        ? "bg-[#ea4f93] text-white shadow-xs"
                        : "text-[#7f6478] hover:text-[#2d1b35] hover:bg-[#ea4f93]/5"
                        }`}
                    >
                      {st === "all" ? (isVi ? "Tất cả" : "all") : st === "active" ? (isVi ? "Hoạt động" : "active") : st === "busy" ? (isVi ? "Bận" : "busy") : (isVi ? "Đóng cửa" : "closed")}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#a88a9f] uppercase tracking-wider">{isVi ? "Sắp xếp:" : "Sort:"}</span>
                  <Select
                    value={salonSortOption}
                    onChange={(val) => setSalonSortOption(val)}
                    className="w-36 h-10 select-premium-antd"
                    popupClassName="select-premium-dropdown"
                    options={[
                      { value: "name", label: isVi ? "Tên" : "Name" },
                      { value: "rating", label: isVi ? "Đánh giá" : "Rating" },
                      { value: "reviews", label: isVi ? "Số lượng đánh giá" : "Reviews Volume" }
                    ]}
                    style={{ borderRadius: "0.875rem" }}
                  />
                </div>
              </div>
            </div>

            {loadingSalons ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white/40 backdrop-blur-xs rounded-3xl border border-slate-200/60 shadow-xs">
                <Spin size="large" />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] animate-pulse">{isVi ? "Đang tải dữ liệu chi nhánh..." : "Loading salons..."}</p>
              </div>
            ) : salonsError ? (
              <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                <Alert
                  message={isVi ? "Lỗi tải danh sách chi nhánh" : "Failed to load salons list"}
                  description={salonsError}
                  type="warning"
                  showIcon
                  action={
                    <button
                      onClick={loadSalons}
                      className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      {isVi ? "Thử lại" : "Retry"}
                    </button>
                  }
                />
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-200/60 shadow-xs">
                <Store size={36} className="text-[#a88a9f] mb-3 stroke-[1.2]" />
                <h3 className="text-sm font-bold text-[#2d1b35]">{isVi ? "Không tìm thấy chi nhánh nào" : "No Salons Found"}</h3>
                <p className="mt-1 text-xs text-[#a88a9f] max-w-[40ch]">{isVi ? "Không có chi nhánh salon nào phù hợp bộ lọc tìm kiếm." : "No salon branch matches your search query."}</p>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredSalons.map((salon) => {
                  const metric = salonMetrics[salon.id] || { count: 0, average: 0 };
                  const isMetricLoading = loadingMetrics && !salonMetrics[salon.id];
                  return (
                    <motion.div
                      key={salon.id}
                      variants={fadeInUp}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      onClick={() => setSelectedSalon(salon)}
                      className="group bg-white/80 backdrop-blur-md rounded-[2.25rem] border border-[#f1e7ed]/60 p-6 shadow-[0_12px_32px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(234,79,147,0.06)] hover:border-[#ea4f93]/20 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Salon image / initials placeholder */}
                        <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/50">
                          {salon.image ? (
                            <img
                              src={salon.image}
                              alt={salon.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ea4f93]/5 to-[#ffa26f]/5 text-[#ea4f93] font-bold text-2xl">
                              {getInitials(salon.name)}
                            </div>
                          )}

                          <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${salon.status === "Active" || salon.status === "Open"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : salon.status === "Busy"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}>
                            {salon.status || "Active"}
                          </span>

                          <div className="absolute bottom-3 left-3 bg-[#2d1b35]/70 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                            ★ {salon.rating || "4.8"} ({salon.reviews || "120"} reviews)
                          </div>
                        </div>

                        {/* Salon Details */}
                        <div className="space-y-2.5">
                          <h3 className="text-base font-bold text-[#2d1b35] group-hover:text-[#ea4f93] transition-colors leading-tight">
                            {salon.name}
                          </h3>
                          <div className="space-y-1 text-xs text-[#a88a9f] pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="shrink-0 text-slate-400" />
                              <span className="truncate">{salon.address}</span>
                            </div>
                            {salon.phone && (
                              <div className="flex items-center gap-2">
                                <Phone size={12} className="shrink-0 text-slate-400" />
                                <span>{salon.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock size={12} className="shrink-0 text-slate-400" />
                              <span>{salon.hours || "Operating hours not listed"}</span>
                            </div>
                          </div>

                          {/* Audit Metrics Panel inside Card */}
                          <div className="space-y-3 pt-1">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-[#7f6478]">
                                <span>Audited Average Rating</span>
                                <span className="font-mono text-[#ea4f93]">
                                  {isMetricLoading ? <Spin size="small" className="scale-75" /> : metric.count === 0 ? "N/A" : `${metric.average} / 5`}
                                </span>
                              </div>
                              <div className="w-full bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                                <div
                                  className="bg-gradient-to-r from-[#ea4f93] to-[#ffa26f] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${isMetricLoading || metric.count === 0 ? 0 : (metric.average / 5) * 100}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-[#a88a9f]">
                              <span>{isVi ? "Số lượng đánh giá đã kiểm toán" : "Audited Reviews Count"}</span>
                              <span className="font-bold text-[#2d1b35] font-mono">
                                {isMetricLoading ? "..." : (isVi ? `${metric.count} bản ghi` : `${metric.count} logs`)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#ea4f93]">
                        <span>{isVi ? "Xem đánh giá chi nhánh" : "Review Salon Feedback"}</span>
                        <span className="h-8 w-8 rounded-full bg-[#ea4f93]/10 text-[#ea4f93] flex items-center justify-center group-hover:bg-[#ea4f93] group-hover:text-white transition-colors duration-300 shadow-2xs">
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        ) : (
          /* STATE 2: Salon reviews audits */
          <div className="space-y-6">

            {loadingRatings ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white/40 backdrop-blur-xs rounded-[2.5rem] border border-slate-200/60 shadow-xs">
                <Spin size="large" />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] animate-pulse">{isVi ? "Đang tải dữ liệu đánh giá..." : "Loading ratings logs..."}</p>
              </div>
            ) : ratingsError ? (
              <div className="p-6 bg-rose-50/50 rounded-[2.5rem] border border-rose-100">
                <Alert
                  message={isVi ? "Lỗi tải dữ liệu phản hồi" : "Failed to load feedback"}
                  description={ratingsError}
                  type="warning"
                  showIcon
                  action={
                    <button
                      onClick={loadReviewsForSelectedSalon}
                      className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      {isVi ? "Thử lại" : "Retry"}
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">

                {/* Left column: reviews list (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Reviews search & filters bar */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/75 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
                      <input
                        type="text"
                        placeholder={isVi ? "Tìm theo tên khách hàng, email hoặc số điện thoại..." : "Search by customer, nail artist, or comment..."}
                        value={reviewSearchQuery}
                        onChange={(e) => setReviewSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/30 focus:outline-hidden focus:bg-white focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-[#fcf9fb] p-1 rounded-2xl border border-[#f1e7ed]">
                        {["all", "5", "4", "3", "2"].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setReviewScoreFilter(score)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-0.5 ${reviewScoreFilter === score
                              ? "bg-[#ea4f93] text-white shadow-xs"
                              : "text-[#7f6478] hover:text-[#2d1b35] hover:bg-[#ea4f93]/5"
                              }`}
                          >
                            {score === "all" ? (isVi ? "Tất cả" : "All") : `${score}`}
                            {score !== "all" && <Star size={10} className="fill-current" />}
                          </button>
                        ))}
                      </div>

                      <DatePicker
                        placeholder={isVi ? "Lọc theo ngày" : "Filter by date"}
                        value={reviewFilterDate}
                        onChange={(date) => setReviewFilterDate(date)}
                        className="h-10 rounded-[0.875rem] border border-slate-200 px-3 text-xs md:text-sm shadow-2xs hover:border-[#ea4f93] focus:border-[#ea4f93] transition-all duration-300"
                        suffixIcon={<Calendar size={13} className="text-[#a88a9f]" />}
                        allowClear
                      />

                      <Select
                        value={reviewSortBy}
                        onChange={(val) => setReviewSortBy(val)}
                        className="w-36 h-10 select-premium-antd"
                        popupClassName="select-premium-dropdown"
                        options={[
                          { value: "recent", label: isVi ? "Gần đây nhất" : "Most Recent" },
                          { value: "highest", label: isVi ? "Điểm cao nhất" : "Highest Score" },
                          { value: "lowest", label: isVi ? "Điểm thấp nhất" : "Lowest Score" }
                        ]}
                        style={{ borderRadius: "0.875rem" }}
                      />
                    </div>
                  </div>

                  {/* Reviews lists feed */}
                  {processedRatings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xs">
                      <MessageSquare size={36} className="text-[#a88a9f] mb-3 stroke-[1.2]" />
                      <h3 className="text-sm font-bold text-[#2d1b35]">{isVi ? "Không tìm thấy đánh giá nào" : "No Reviews Found"}</h3>
                      <p className="mt-1 text-xs text-[#a88a9f] max-w-[40ch]">{isVi ? "Không có đánh giá phản hồi nào từ khách hàng phù hợp bộ lọc." : "No customer feedback matches your search filters."}</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-6"
                    >
                      {processedRatings.map((rating) => {
                        const cName = rating.customerName || usersMap[rating.customerId]?.name || "Customer";
                        const avatarUrl = usersMap[rating.customerId]?.avatarUrl || "";
                        const score = rating.overallScore || 5;
                        const dateFormatted = formatDate(rating.createdAt);
                        const artistName = rating.nailArtistName || usersMap[rating.nailArtistId]?.name || "Nail Artist";

                        // Check if there is an operational comment response in the API/mock
                        const responseContent = rating.commentResponse || "Cảm ơn quý khách đã tin tưởng và đánh giá dịch vụ của tiệm. Chúng tôi luôn ghi nhận ý kiến để nâng cấp chất lượng tốt hơn nữa.";

                        return (
                          <motion.div
                            key={rating.bookingRatingId}
                            variants={fadeInUp}
                            className="bg-white border border-[#ea4f93]/10 hover:border-[#ea4f93]/20 shadow-[0_12px_32px_rgba(0,0,0,0.02)] rounded-[2rem] p-6 lg:p-8 flex flex-col space-y-5 transition-all duration-300"
                          >
                            {/* Upper row: User Info (circular avatar, name, subtitle & stars) */}
                            <div className="flex items-start gap-4">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={cName}
                                  className="h-12 w-12 rounded-full object-cover shrink-0 border border-slate-100 shadow-2xs"
                                />
                              ) : (
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${getAvatarColor(cName)}`}>
                                  {getInitials(cName)}
                                </div>
                              )}

                              <div className="space-y-1">
                                <h4 className="text-base font-bold text-[#2d1b35] leading-tight">{cName}</h4>
                                <p className="text-xs text-[#a88a9f] font-semibold leading-none">
                                  Nail Service · {dateFormatted}
                                </p>
                                {/* Stars */}
                                <div className="flex items-center gap-0.5 pt-1">
                                  {[1, 2, 3, 4, 5].map((sIndex) => (
                                    <Star
                                      key={sIndex}
                                      size={15}
                                      className={`${sIndex <= Math.round(score)
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-200"
                                        }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Mid Row: Comment bubble layout matching the design reference */}
                            <div className="bg-[#fff5f9]/70 border-l-4 border-[#ea4f93] p-4 lg:p-5 rounded-r-2xl rounded-bl-2xl rounded-tl-xs shadow-3xs">
                              <p className="text-xs md:text-sm text-[#2d1b35] leading-relaxed font-medium">
                                "{rating.comment || (isVi ? "Không có ý kiến bình luận bằng văn bản." : "No written comment provided.")}"
                              </p>
                            </div>

                            {/* Image upload snapshot (if present) */}
                            {rating.imageUrl && (
                              <div className="relative rounded-2xl overflow-hidden max-w-sm border border-slate-100 shadow-2xs group">
                                <div className="absolute inset-0 border border-white/10 z-10 pointer-events-none" />
                                <img
                                  src={rating.imageUrl}
                                  alt="Feedback snapshot"
                                  className="w-full h-auto object-cover max-h-56 transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                                <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-[10px] text-white font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 pointer-events-none">
                                  <ImageIcon size={10} />
                                  {isVi ? "Hình khách chụp" : "Client Photo"}
                                </div>
                              </div>
                            )}

                            {/* Detailed sub-scores mapping */}
                            <div className="grid grid-cols-3 gap-3 bg-[#fafaf9]/60 p-3 rounded-2xl border border-slate-100/80 text-center">
                              <div>
                                <span className="text-[9px] uppercase text-[#a88a9f] block">{isVi ? "Chất lượng" : "Quality"}</span>
                                <span className="font-mono text-xs font-bold text-[#2d1b35]">
                                  {rating.serviceQuality || 5}/5
                                </span>
                              </div>
                              <div className="border-x border-slate-200/50">
                                <span className="text-[9px] uppercase text-[#a88a9f] block">{isVi ? "Đúng giờ" : "Punctual"}</span>
                                <span className="font-mono text-xs font-bold text-[#2d1b35]">
                                  {rating.punctuality || 5}/5
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-[#a88a9f] block">{isVi ? "Sạch sẽ" : "Clean"}</span>
                                <span className="font-mono text-xs font-bold text-[#2d1b35]">
                                  {rating.cleanliness || 5}/5
                                </span>
                              </div>
                            </div>

                            {/* Footer area matching reference card style */}
                            <div className="pt-2 flex items-center justify-between">
                              <span className="text-xs text-[#a88a9f] font-medium">{dateFormatted}</span>
                              <span className="px-3.5 py-1.5 rounded-full bg-[#fff2f7] text-[#ea4f93] text-[10px] font-extrabold uppercase tracking-wider select-none">
                                {isVi ? "Đánh giá lịch hẹn" : "Booking Review"}
                              </span>
                            </div>

                            {/* Staff Attribution & Response auditing */}
                            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-pink-50 text-[#ea4f93] flex items-center justify-center">
                                  <User size={12} />
                                </div>
                                <span className="text-xs text-[#a88a9f]">
                                  {isVi ? "Kỹ thuật viên:" : "Assigned Artist:"} <span className="font-bold text-[#2d1b35]">{artistName}</span>
                                </span>
                              </div>

                              <span className="text-[10px] font-bold text-[#ea4f93] uppercase tracking-wider bg-[#ea4f93]/5 border border-[#ea4f93]/15 px-3 py-1 rounded-full flex items-center gap-1 select-none">
                                <Sparkle size={10} className="fill-[#ea4f93]" />
                                {isVi ? "Bản ghi đã kiểm toán" : "Audited Record"}
                              </span>
                            </div>

                            {/* Read-Only Manager Response Auditing Box */}
                            <div className="bg-[#f0fdf4]/50 border border-emerald-500/10 rounded-2xl p-4.5 space-y-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                                <ShieldCheck size={12} />
                                Manager Audit Trail (Response)
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                "{responseContent}"
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Right column: analytics panel (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Rating summary details */}
                  <div className="bg-white/80 backdrop-blur-md rounded-[2.25rem] border border-[#f1e7ed]/60 p-6 shadow-[0_12px_32px_rgba(0,0,0,0.02)] space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#2d1b35]">Rating Summary</h3>
                      <p className="text-[10px] text-[#a88a9f]">Aggregated satisfaction score index.</p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-[#2d1b35] tracking-tight">{activeSalonStats.average}</span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((sIndex) => (
                            <Star
                              key={sIndex}
                              size={12}
                              className={`${sIndex <= Math.round(activeSalonStats.average) ? "fill-current" : "text-slate-200"
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#a88a9f] block">
                          {activeSalonStats.total} total reviews
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = activeSalonStats.starsBreakdown[stars] || 0;
                        const percent = activeSalonStats.total > 0 ? (count / activeSalonStats.total) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-3 text-xs text-[#7f6478]">
                            <span className="w-3 font-mono font-bold">{stars}</span>
                            <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                            <div className="flex-1 bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="w-6 text-right font-mono font-bold text-slate-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-criteria indices */}
                  <div className="bg-white/80 backdrop-blur-md rounded-[2.25rem] border border-[#f1e7ed]/60 p-6 shadow-[0_12px_32px_rgba(0,0,0,0.02)] space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#2d1b35]">Satisfaction Indices</h3>
                      <p className="text-[10px] text-[#a88a9f]">Core indicators mapping customer loyalty.</p>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Service quality */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[#7f6478]">
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-[#ea4f93]" />
                            Service Quality
                          </span>
                          <span className="font-mono text-[#ea4f93]">{activeSalonStats.quality}/5</span>
                        </div>
                        <div className="w-full bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                          <div
                            className="bg-gradient-to-r from-[#ea4f93] to-[#ffa26f] h-full rounded-full transition-all duration-500"
                            style={{ width: `${(activeSalonStats.quality / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Punctuality */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[#7f6478]">
                          <span className="flex items-center gap-1.5">
                            <Zap size={12} className="text-amber-500" />
                            Punctuality
                          </span>
                          <span className="font-mono text-amber-500">{activeSalonStats.punctuality}/5</span>
                        </div>
                        <div className="w-full bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(activeSalonStats.punctuality / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Cleanliness */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[#7f6478]">
                          <span className="flex items-center gap-1.5">
                            <Smile size={12} className="text-emerald-500" />
                            Cleanliness
                          </span>
                          <span className="font-mono text-emerald-500">{activeSalonStats.cleanliness}/5</span>
                        </div>
                        <div className="w-full bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(activeSalonStats.cleanliness / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance insights */}
                  <div className="bg-gradient-to-br from-[#2d1b35] to-[#1a0e22] rounded-[2.25rem] p-6 text-white shadow-lg space-y-4">
                    <div className="p-2 rounded-xl bg-white/10 text-[#ea4f93] w-fit">
                      <TrendingUp size={16} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Auditing Notes</h4>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {activeSalonStats.average >= 4.5
                          ? "This salon branch maintains exemplary quality metrics chain-wide. No interventions required."
                          : activeSalonStats.average >= 3.5
                            ? "Branch customer support reviews are stable. Recommend monitoring staff scheduling slots closely."
                            : "Critical warning: Service quality averages are sub-optimal. Recommend issuing salon operations audit directive immediately."
                        }
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminSalonBookingRatingPage;
