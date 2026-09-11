import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Star,
  ChevronRight,
  Home,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Spin, Tag } from "antd";
import dayjs from "dayjs";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";
import { fetchBookingsBySalonId } from "../../../manager/bookings/services/bookingsService";
import { getAdminSalonBookingDetailRoute, ROUTES } from "../../../../shared/constants/routes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const SALON_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" rx="28" fill="#fde7ef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8f365c" font-family="Arial, sans-serif" font-size="30" font-weight="700">Salon</text></svg>',
)}`;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const fadeInUpStagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      delay: i * 0.1,
    },
  }),
};

// FIX: nhận thêm onClick (và các prop khác) rồi gắn vào motion.article
function PremiumCard({
  className = "",
  children,
  padded = true,
  hoverable = false,
  onClick,
  ...rest
}) {
  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      whileHover={
        hoverable
          ? { scale: 1.01, y: -4, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.08)" }
          : {}
      }
      onClick={onClick}
      className={`relative overflow-hidden rounded-[28px] border border-[#f1e7ed] bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${padded ? "p-6" : ""
        } ${hoverable ? "cursor-pointer" : ""} ${className}`}
      {...rest}
    >
      {children}
    </motion.article>
  );
}

function SectionHeading({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shrink-0">
          <Icon size={20} />
        </div>
      )}
      <div>
        <h2 className="text-[18px] font-extrabold text-[#3d1f3f] tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-[13px] text-[#9a5f7f]">{subtitle}</p>}
      </div>
    </div>
  );
}

function Breadcrumb({ items }) {
  return (
    <nav className="mb-6 flex items-center gap-2 text-[13px]">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight size={14} className="text-[#9a5f7f]" />}
          {item.link ? (
            <Link
              to={item.link}
              className="flex items-center gap-1 text-[#9a5f7f] hover:text-[#ea4f93] transition-colors font-medium"
            >
              {item.icon && <item.icon size={14} />}
              {item.label}
            </Link>
          ) : (
            <span className="text-[#3d1f3f] font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendValue, color = "pink" }) {
  const colorClasses = {
    pink: "from-[#ff8ebb] to-[#ea4f93]",
    green: "from-[#b5f4d0] to-[#16975f]",
    yellow: "from-[#ffedd5] to-[#d69e2e]",
    blue: "from-[#dbeafe] to-[#3b82f6]",
  };

  const textColorClasses = {
    pink: "text-[#ea4f93]",
    green: "text-[#16975f]",
    yellow: "text-[#d69e2e]",
    blue: "text-[#3b82f6]",
  };

  return (
    <motion.div custom={0} initial="hidden" animate="visible" variants={fadeInUpStagger}>
      <PremiumCard className="h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-[#9a5f7f] uppercase tracking-wider mb-1">
              {title}
            </p>
            <p className="text-[28px] font-extrabold text-[#3d1f3f] leading-none">
              {value}
            </p>
            {trend && (
              <div
                className={`mt-3 flex items-center gap-1 text-[12px] font-bold ${trend === "up" ? "text-emerald-600" : "text-orange-500"
                  }`}
              >
                {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClasses[color]} shrink-0`}
          >
            <Icon size={24} className="text-white" />
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

function BookingCard({ booking }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return CheckCircle;
      case "Rejected":
        return XCircle;
      case "Cancelled":
        return XCircle;
      default:
        return Clock;
    }
  };

  const StatusIcon = getStatusIcon(booking?.status);

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "Cancelled":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="rounded-[24px] border border-[#f1e7ed] bg-[#fffafd] p-6 transition-all duration-300 hover:border-[#ea4f93] hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(234,79,147,0.1)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shrink-0">
              <span className="text-lg font-bold">
                {booking?.customerName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-extrabold text-[#3d1f3f] truncate">
                {booking?.customerName || "Unknown Customer"}
              </h3>
              {booking?.customerEmail && (
                <p className="text-[13px] text-[#9a5f7f] truncate">
                  {booking.customerEmail}
                </p>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold ${getStatusColor(
                booking?.status
              )}`}
            >
              <StatusIcon size={12} />
              {booking?.status || "Unknown"}
            </span>
          </div>

          <div className="grid gap-3 text-[13px] text-[#7f6478] sm:grid-cols-2 md:grid-cols-3">
            {booking?.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#ea4f93] shrink-0" />
                <span>{booking.customerPhone}</span>
              </div>
            )}
            {booking?.bookingDate && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#ea4f93] shrink-0" />
                <span>
                  {new Date(booking.bookingDate).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {booking?.bookingTime && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#ea4f93] shrink-0" />
                <span>{booking.bookingTime}</span>
              </div>
            )}
            {booking?.totalAmount && (
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#3d1f3f]">
                  {Number(booking.totalAmount).toLocaleString("vi-VN")} VND
                </span>
              </div>
            )}
          </div>

          {booking?.services && Array.isArray(booking.services) && booking.services.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#f1e7ed]">
              <p className="text-[12px] font-semibold text-[#9a5f7f] mb-2">Services:</p>
              <div className="flex flex-wrap gap-2">
                {booking.services.map((service, index) => (
                  <Tag
                    key={index}
                    className="!bg-[#fff5fb] !text-[#ea4f93] !border-[#f1c6dd] !text-[11px] !font-medium !px-3 !py-1 !rounded-full"
                  >
                    {service.name || service}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AdminSalonBookingsPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" for A-Z, "desc" for Z-A

  const [salons, setSalons] = useState([]);
  const [isLoadingSalons, setIsLoadingSalons] = useState(false);
  const [error, setError] = useState("");

  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadMore, setIsLoadMore] = useState(false);

  // Debounced search term for API
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPageIndex(1); // Reset page when search changes
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const loadData = async () => {
      if (pageIndex === 1) setIsLoadingSalons(true);
      else setIsLoadMore(true);
      setError("");

      try {
        const salonsData = await fetchAdminSalons({
          pageIndex,
          pageSize: 6,
          searchTerm: debouncedSearch
        });

        const salonsList = salonsData?.items || [];
        if (pageIndex === 1) {
          setSalons(salonsList);
        } else {
          setSalons(prev => [...prev, ...salonsList]);
        }

        setHasMore(salonsData?.metaData?.hasNext || false);
      } catch (err) {
        console.error("Error loading salons:", err);
        setError(err?.message || "Failed to load salons");
      } finally {
        setIsLoadingSalons(false);
        setIsLoadMore(false);
      }
    };

    loadData();
  }, [pageIndex, debouncedSearch]);

  const handleLoadMore = () => {
    if (!isLoadMore && hasMore) {
      setPageIndex(prev => prev + 1);
    }
  };

  const filteredAndSortedSalons = useMemo(() => {
    let result = [...salons];

    // Local sort
    result.sort((a, b) => {
      const nameA = a?.name || "";
      const nameB = b?.name || "";
      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      }
      return nameB.localeCompare(nameA);
    });

    return result;
  }, [salons, searchTerm, sortOrder]);

  const isVi = language === "vi";

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 py-8">
      <motion.div key="salons-list" initial="hidden" animate="visible" variants={fadeInUp}>

        {isLoadingSalons ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Spin size="large" tip={isVi ? "Đang tải dữ liệu chi nhánh..." : "Loading salons..."} />
          </div>
        ) : error ? (
          <PremiumCard>
            <div className="py-16 text-center text-[#e1447f]">
              <p className="text-xl font-bold mb-2">{isVi ? "Có lỗi xảy ra!" : "Oops!"}</p>
              <p className="text-base">{error}</p>
            </div>
          </PremiumCard>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex justify-between items-center gap-3 w-full">
                <div className="relative w-full">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search size={16} className="text-[#c28ca6]" />
                  </div>
                  <input
                    type="text"
                    placeholder={isVi ? "Tìm kiếm chi nhánh..." : "Search salon..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full min-w-[200px] rounded-full border border-[#f1e7ed] bg-white pl-10 pr-4 text-sm text-[#3d1f3f] placeholder-[#c28ca6] outline-none transition-all focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/20"
                  />
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <ArrowUpDown size={16} className="text-[#c28ca6]" />
                  </div>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="h-10 appearance-none rounded-full border border-[#f1e7ed] bg-white pl-10 pr-8 text-sm text-[#3d1f3f] outline-none transition-all focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/20 cursor-pointer"
                  >
                    <option value="asc">{isVi ? "Tên: A đến Z" : "Name: A to Z"}</option>
                    <option value="desc">{isVi ? "Tên: Z đến A" : "Name: Z to A"}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {filteredAndSortedSalons.map((salon, index) => (
                <motion.div
                  key={salon?.id || salon?.salonId}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUpStagger}
                >
                  <PremiumCard
                    padded={false}
                    hoverable
                    onClick={() =>
                      navigate(getAdminSalonBookingDetailRoute(salon?.id || salon?.salonId))
                    }
                  >
                    <div className="overflow-hidden rounded-t-[28px] relative h-52">
                      <img
                        crossOrigin="anonymous"
                        src={salon?.imageUrl || salon?.image || SALON_PLACEHOLDER_IMAGE}
                        alt={salon?.name || "Salon"}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = SALON_PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                          </div>
                          <span className="text-white font-bold text-sm drop-shadow-md">
                            {salon?.rating || "4.8"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-[18px] font-extrabold text-[#3d1f3f] truncate mb-2">
                        {salon?.name || "Unknown Salon"}
                      </h3>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-[13px]">
                          <MapPin size={14} className="text-[#ea4f93] shrink-0" />
                          <span className="text-[#7f6478] truncate">{salon?.address || "No address"}</span>
                        </div>
                        {salon?.phone && (
                          <div className="flex items-center gap-2 text-[13px]">
                            <Phone size={14} className="text-[#ea4f93] shrink-0" />
                            <span className="text-[#7f6478] truncate">{salon.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-[#f1e7ed]">
                        <div className="flex items-center gap-1 text-[#ea4f93] text-sm font-bold">
                          {isVi ? "Xem lịch hẹn" : "View Bookings"}
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8 pb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoadMore}
                  disabled={isLoadMore}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#ea4f93] bg-white px-8 py-3 text-[15px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb] disabled:opacity-50"
                >
                  {isLoadMore ? <Spin size="small" /> : isVi ? "Hiện thêm" : "View more"}
                </motion.button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
