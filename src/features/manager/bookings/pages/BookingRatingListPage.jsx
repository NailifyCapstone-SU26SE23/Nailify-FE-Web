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
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  Smile,
  ShieldCheck,
  Zap,
  Quote
} from "lucide-react";
import { fetchBookingRatingsBySalonId, fetchUserById } from "../services/bookingsService";
import { fetchAllSalonStaff, getSalonId } from "../../staff-artist-management/services/nailArtistsService";
import { loadAuthSession } from "../../../../features/core/auth/model/authStorage";
import { formatDate } from "../../../../shared/utils/formatDate";
import { Spin, Alert, Select, Modal, DatePicker } from "antd";
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

// Tier system: turns a raw score into a meaningful label + color set,
// reused across the gauge, review cards, and badges so a "4.6" always
// reads the same way everywhere on the page.
const getTier = (score) => {
  if (score >= 4.5) {
    return {
      label: "Excellent",
      text: "text-emerald-600",
      solid: "#10b981",
      bg: "bg-emerald-50",
      border: "border-emerald-200/70",
      ring: "ring-emerald-500/10"
    };
  }
  if (score >= 3.5) {
    return {
      label: "Solid",
      text: "text-amber-600",
      solid: "#f59e0b",
      bg: "bg-amber-50",
      border: "border-amber-200/70",
      ring: "ring-amber-500/10"
    };
  }
  return {
    label: "Needs attention",
    text: "text-rose-600",
    solid: "#e11d48",
    bg: "bg-rose-50",
    border: "border-rose-200/70",
    ring: "ring-rose-500/10"
  };
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

// Signature element: a semicircle "sentiment gauge" for the average score.
// Structure carries meaning here — the arc fill length IS the score,
// not decoration bolted onto a number.
function SentimentGauge({ average, total }) {
  const radius = 80;
  const halfCircumference = Math.PI * radius;
  const pct = Math.max(0, Math.min(1, average / 5));
  const progress = pct * halfCircumference;
  const tier = getTier(average);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 116" className="w-full max-w-[240px]">
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="#f1e7ed"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={tier.solid}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${halfCircumference}`}
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text
          x="100"
          y="88"
          textAnchor="middle"
          className="fill-[#2d1b35]"
          style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          {average}
        </text>
        <text
          x="100"
          y="106"
          textAnchor="middle"
          className="fill-[#a88a9f]"
          style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          out of 5
        </text>
      </svg>
      <span className={`-mt-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${tier.bg} ${tier.text} border ${tier.border}`}>
        {tier.label}
      </span>
      <span className="mt-2 text-[10px] font-semibold text-[#a88a9f] uppercase tracking-wider">
        Based on {total} review{total === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export function BookingRatingListPage() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [filterDate, setFilterDate] = useState(null);

  // Response modal state
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replies, setReplies] = useState({}); // simulated responses store
  const [usersMap, setUsersMap] = useState({});

  // Get manager's salonId
  const salonId = useMemo(() => {
    return getSalonId();
  }, []);

  const loadUserNames = async (ratingsList) => {
    const newUsers = { ...usersMap };

    // 1. Fetch salon staff to map nailArtistId (which is staffId) to artist names
    try {
      const staffList = await fetchAllSalonStaff(salonId);
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

    // 2. Extract unique customerIds (which are userIds)
    const uniqueCustomerIds = new Set();
    ratingsList.forEach((r) => {
      if (r.customerId) uniqueCustomerIds.add(r.customerId);
    });

    const customerIdsToFetch = Array.from(uniqueCustomerIds).filter(id => !newUsers[id]);

    // 3. Fetch customer details
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
        console.error("Error fetching customer names in batch:", err);
      }
    }

    setUsersMap(newUsers);
  };

  const loadRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBookingRatingsBySalonId(salonId);
      setRatings(data || []);
      loadUserNames(data || []);
    } catch (err) {
      setError(err.message || "Failed to load booking ratings list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  // Aggregate stats derived from the current ratings list
  const stats = useMemo(() => {
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

  // Client side search, filter, and sort
  const processedRatings = useMemo(() => {
    let items = [...ratings];

    if (scoreFilter !== "all") {
      const targetScore = parseInt(scoreFilter, 10);
      items = items.filter(r => Math.round(r.overallScore) === targetScore);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((r) => {
        const cName = (r.customerName || usersMap[r.customerId]?.name || "Customer").toLowerCase();
        const artist = (r.nailArtistName || usersMap[r.nailArtistId]?.name || "Staff").toLowerCase();
        const comment = (r.comment || "").toLowerCase();
        return cName.includes(query) || artist.includes(query) || comment.includes(query);
      });
    }

    if (filterDate) {
      items = items.filter(r => dayjs(r.createdAt).isSame(filterDate, 'day'));
    }

    if (sortBy === "recent") {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "highest") {
      items.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    } else if (sortBy === "lowest") {
      items.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
    }

    return items;
  }, [ratings, searchQuery, scoreFilter, sortBy, usersMap, filterDate]);

  const handleOpenReplyModal = (rating) => {
    setSelectedRating(rating);
    setReplyText(replies[rating.bookingRatingId] || "");
    setReplyModalVisible(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedRating) return;
    setSubmittingReply(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setReplies(prev => ({
        ...prev,
        [selectedRating.bookingRatingId]: replyText.trim()
      }));
      setReplyModalVisible(false);
      setReplyText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

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
                <Star size={18} className="stroke-[2] fill-current" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ea4f93]">Feedback Hub</span>
              {stats.total > 0 && (
                <span className="text-[10px] font-bold text-[#a88a9f] bg-[#fcf9fb] border border-[#f1e7ed] rounded-full px-2.5 py-0.5">
                  {stats.total} review{stats.total === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-[#2d1b35] tracking-tight md:text-4xl">
              Booking Reviews
            </h1>
            <p className="text-xs md:text-sm text-[#a88a9f] max-w-[65ch] leading-relaxed">
              Track customer ratings, review staff performance metrics, and respond to branch service feedback.
            </p>
          </div>

          <button
            onClick={loadRatings}
            className="flex self-start md:self-auto items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#2d1b35] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-[#ea4f93]/30 hover:text-[#ea4f93] transition-all duration-300 active:scale-[0.98]"
          >
            <RotateCcw size={13} />
            Reload Feed
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/40 backdrop-blur-xs rounded-[2.5rem] border border-slate-200/60 shadow-xs">
            <Spin size="large" />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] animate-pulse">Loading ratings data...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50/50 rounded-[2.5rem] border border-rose-100">
            <Alert
              message="Failed to load feedback"
              description={error}
              type="warning"
              showIcon
              action={
                <button
                  onClick={loadRatings}
                  className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                >
                  Retry
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">

            {/* LEFT COLUMN: Feed & Search (7 cols) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Search & Filters Command Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/75 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                {/* <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
                  <input
                    type="text"
                    placeholder="Search by customer name, nail artist, or comment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/30 focus:outline-hidden focus:bg-white focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300"
                  />
                </div> */}

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-[#fcf9fb] p-1 rounded-2xl border border-[#f1e7ed]">
                    {["all", "5", "4", "3", "2", "1"].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setScoreFilter(score)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-0.5 ${scoreFilter === score
                          ? "bg-[#ea4f93] text-white shadow-xs"
                          : "text-[#7f6478] hover:text-[#2d1b35] hover:bg-[#ea4f93]/5"
                          }`}
                      >
                        {score === "all" ? "All" : `${score}`}
                        {score !== "all" && <Star size={10} className="fill-current" />}
                      </button>
                    ))}
                  </div>

                  <DatePicker
                    placeholder="Filter by date"
                    value={filterDate}
                    onChange={(date) => setFilterDate(date)}
                    className="h-10 rounded-[0.875rem] border border-slate-200 px-3 text-xs md:text-sm shadow-2xs hover:border-[#ea4f93] focus:border-[#ea4f93] transition-all duration-300"
                    suffixIcon={<Calendar size={13} className="text-[#a88a9f]" />}
                    allowClear
                  />

                  <Select
                    value={sortBy}
                    onChange={(val) => setSortBy(val)}
                    className="w-36 h-10 select-premium-antd"
                    popupClassName="select-premium-dropdown"
                    options={[
                      { value: "recent", label: "Most Recent" },
                      { value: "highest", label: "Highest Score" },
                      { value: "lowest", label: "Lowest Score" }
                    ]}
                    style={{ borderRadius: "0.875rem" }}
                  />
                </div>
              </div>
              <div className="relative flex-1 w-full bg-white">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
                <input
                  type="text"
                  placeholder="Search by customer name, nail artist, or comment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/30 focus:outline-hidden focus:bg-white focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300"
                />
              </div>

              {/* Feed List */}
              {processedRatings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xs">
                  <MessageSquare size={36} className="text-[#a88a9f] mb-3 stroke-[1.2]" />
                  <h3 className="text-sm font-bold text-[#2d1b35]">No reviews match these filters</h3>
                  <p className="mt-1 text-xs text-[#a88a9f] max-w-[40ch]">Try clearing the search, star, or date filter to see more feedback.</p>
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
                    const tier = getTier(score);
                    const dateFormatted = formatDate(rating.createdAt);
                    const artistName = rating.nailArtistName || usersMap[rating.nailArtistId]?.name || "Nail Artist";
                    const isReplied = !!replies[rating.bookingRatingId];

                    return (
                      <motion.div
                        key={rating.bookingRatingId}
                        variants={fadeInUp}
                        className={`bg-white border ${tier.border} shadow-[0_12px_32px_rgba(0,0,0,0.02)] rounded-[2rem] p-6 lg:p-8 flex flex-col space-y-5 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.04)] hover:-translate-y-0.5`}
                      >
                        {/* Upper row: avatar, name, subtitle, stars, tier badge */}
                        <div className="flex items-start justify-between gap-4">
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

                          <span className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${tier.bg} ${tier.text} border ${tier.border}`}>
                            {tier.label}
                          </span>
                        </div>

                        {/* Mid Row: Comment bubble */}
                        <div className="relative bg-[#fff5f9]/70 border-l-4 border-[#ea4f93] p-4 lg:p-5 pl-11 rounded-r-2xl rounded-bl-2xl rounded-tl-xs shadow-3xs">
                          <Quote size={16} className="absolute left-4 top-4 text-[#ea4f93]/30 fill-[#ea4f93]/10" />
                          <p className="text-xs md:text-sm text-[#2d1b35] leading-relaxed font-medium">
                            {rating.comment || "No written comment provided."}
                          </p>
                        </div>

                        {/* Image upload snapshot (if present) */}
                        {rating.imageUrl && (
                          <div className="relative rounded-2xl overflow-hidden max-w-sm border border-slate-100 shadow-2xs group cursor-zoom-in">
                            <div className="absolute inset-0 border border-white/10 z-10 pointer-events-none" />
                            <img
                              src={rating.imageUrl}
                              alt="Feedback snapshot"
                              className="w-full h-auto object-cover max-h-56 transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                            <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-[10px] text-white font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 pointer-events-none">
                              <ImageIcon size={10} />
                              Client Photo
                            </div>
                          </div>
                        )}

                        {/* Detailed sub-scores mapping */}
                        <div className="grid grid-cols-3 gap-3 bg-[#fafaf9]/60 p-3 rounded-2xl border border-slate-100/80">
                          <div className="flex flex-col items-center gap-1">
                            <span className="flex items-center gap-1 text-[9px] uppercase text-[#a88a9f] font-bold">
                              <Sparkles size={10} className="text-[#ea4f93]" /> Quality
                            </span>
                            <span className="font-mono text-xs font-bold text-[#2d1b35]">
                              {rating.serviceQuality || 5}/5
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1 border-x border-slate-200/50">
                            <span className="flex items-center gap-1 text-[9px] uppercase text-[#a88a9f] font-bold">
                              <Zap size={10} className="text-amber-500" /> Punctual
                            </span>
                            <span className="font-mono text-xs font-bold text-[#2d1b35]">
                              {rating.punctuality || 5}/5
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="flex items-center gap-1 text-[9px] uppercase text-[#a88a9f] font-bold">
                              <Smile size={10} className="text-emerald-500" /> Clean
                            </span>
                            <span className="font-mono text-xs font-bold text-[#2d1b35]">
                              {rating.cleanliness || 5}/5
                            </span>
                          </div>
                        </div>

                        {/* Staff Attribution & Response triggers */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-pink-50 text-[#ea4f93] flex items-center justify-center">
                              <User size={12} />
                            </div>
                            <span className="text-xs text-[#a88a9f]">
                              Assigned Artist: <span className="font-bold text-[#2d1b35]">{artistName}</span>
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenReplyModal(rating)}
                            className={`px-4.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] ${isReplied
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-[#ea4f93] hover:bg-[#ea4f93]/90 text-white shadow-2xs"
                              }`}
                          >
                            <MessageSquare size={12} />
                            {isReplied ? "View Response" : "Respond Feedback"}
                          </button>
                        </div>

                        {/* Response display trail */}
                        {isReplied && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-emerald-50/40 border border-emerald-500/10 rounded-2xl p-4.5 space-y-2"
                          >
                            <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck size={12} />
                                Salon Manager Response
                              </span>
                              <span>Just now</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                              {replies[rating.bookingRatingId]}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* RIGHT COLUMN: Analytics Panel (3 cols) */}
            <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-6">

              {/* Signature card: sentiment gauge */}
              <div className="bg-white/80 backdrop-blur-md rounded-[2.25rem] border border-[#f1e7ed]/60 p-6 shadow-[0_12px_32px_rgba(0,0,0,0.02)] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#2d1b35]">Rating Summary</h3>
                  <p className="text-[10px] text-[#a88a9f]">Aggregated satisfaction score index.</p>
                </div>

                <SentimentGauge average={stats.average} total={stats.total} />

                {/* Stars Breakdown */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = stats.starsBreakdown[stars] || 0;
                    const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs text-[#7f6478]">
                        <span className="w-3 font-mono font-bold">{stars}</span>
                        <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                          <div
                            className="bg-gradient-to-r from-amber-300 to-amber-500 h-full rounded-full transition-all duration-500"
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
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#7f6478]">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-[#ea4f93]" />
                        Service Quality
                      </span>
                      <span className="font-mono text-[#ea4f93]">{stats.quality}/5</span>
                    </div>
                    <div className="w-full bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                      <div
                        className="bg-gradient-to-r from-[#ea4f93] to-[#ffa26f] h-full rounded-full transition-all duration-500"
                        style={{ width: `${(stats.quality / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#7f6478]">
                      <span className="flex items-center gap-1.5">
                        <Zap size={12} className="text-amber-500" />
                        Punctuality
                      </span>
                      <span className="font-mono text-amber-500">{stats.punctuality}/5</span>
                    </div>
                    <div className="w-full bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(stats.punctuality / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#7f6478]">
                      <span className="flex items-center gap-1.5">
                        <Smile size={12} className="text-emerald-500" />
                        Cleanliness
                      </span>
                      <span className="font-mono text-emerald-500">{stats.cleanliness}/5</span>
                    </div>
                    <div className="w-full bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(stats.cleanliness / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance insight quote */}
              <div className="bg-gradient-to-br from-[#2d1b35] to-[#1a0e22] rounded-[2.25rem] p-6 text-white shadow-lg space-y-4">
                <div className="p-2 rounded-xl bg-white/10 text-[#ea4f93] w-fit">
                  <TrendingUp size={16} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Manager Insights</h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {stats.average >= 4.5
                      ? "Outstanding performance! Your salon is delivering exceptional satisfaction benchmarks — keep it up."
                      : stats.average >= 3.5
                        ? "Service levels are healthy, but punctuality logs show room for improvement to maximize repeat appointments."
                        : "Action required — review cleanliness audits and client remarks on service times to re-establish standards."
                    }
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Response Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-[#2d1b35] font-bold text-base">
            <MessageSquare size={16} className="text-[#ea4f93]" />
            <span>Respond to Customer Review</span>
          </div>
        }
        open={replyModalVisible}
        onCancel={() => setReplyModalVisible(false)}
        footer={null}
        centered
        width={500}
        className="premium-receipt-modal"
        styles={{
          mask: { backdropFilter: "blur(4px)" }
        }}
      >
        {selectedRating && (
          <div className="space-y-5 pt-3">
            <div className="p-4 bg-[#fafaf9] rounded-2xl border border-slate-100 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#2d1b35]">{selectedRating.customerName || "Customer"}</span>
                <span className="text-[#a88a9f] font-medium">{formatDate(selectedRating.createdAt)}</span>
              </div>
              <p className="text-xs text-slate-500 italic">
                "{selectedRating.comment || "No written comment provided."}"
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#2d1b35] block">Your Response Comment</label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a warm response thanking the customer for their review..."
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/20 focus:outline-hidden focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300 resize-none"
              />
            </div>

            <div className="flex gap-2 p-3 bg-amber-50/50 border border-amber-500/10 rounded-xl text-[10px] text-amber-800 font-medium">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              <span>Responses are published to the customer's mobile application inbox immediately. Please keep responses warm and professional.</span>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setReplyModalVisible(false)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-500 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReply || !replyText.trim()}
                onClick={handleSendReply}
                className="px-4.5 py-2.5 rounded-2xl bg-[#ea4f93] hover:bg-[#ea4f93]/90 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
              >
                {submittingReply ? (
                  <>
                    <Spin size="small" className="scale-75 brightness-0 invert" />
                    Publishing...
                  </>
                ) : (
                  "Publish Response"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}