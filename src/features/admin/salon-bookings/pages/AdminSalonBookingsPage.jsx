import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  DollarSign,
  Star,
  ChevronRight,
  Home,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { Spin, Tag } from "antd";
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
                <DollarSign size={14} className="text-[#ea4f93] shrink-0" />
                <span className="font-extrabold text-[#3d1f3f]">
                  ${Number(booking.totalAmount).toLocaleString()}
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

  const [salons, setSalons] = useState([]);
  const [isLoadingSalons, setIsLoadingSalons] = useState(false);
  const [isLoadingAllSalonBookings, setIsLoadingAllSalonBookings] = useState(false);
  const [error, setError] = useState("");
  const [allSalonBookings, setAllSalonBookings] = useState({}); // salonId -> bookings array

  // Calculate revenue for a specific salon
  const calculateSalonRevenue = useCallback(
    (salonIdToCheck) => {
      const salonBookings = allSalonBookings[salonIdToCheck] || [];
      return salonBookings
        .filter((booking) => booking?.status === "Completed")
        .reduce((sum, booking) => {
          const totalAmount = booking?.totalAmount || 0;
          return sum + Number(totalAmount);
        }, 0);
    },
    [allSalonBookings]
  );

  // Load all salons on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingSalons(true);
      setError("");
      try {
        const salonsData = await fetchAdminSalons({ pageSize: 1000 });
        const salonsList = salonsData?.items || [];
        setSalons(salonsList);

        // Fetch bookings for all salons
        setIsLoadingAllSalonBookings(true);
        const newAllSalonBookings = {};
        for (const salon of salonsList) {
          const salonId = salon?.id || salon?.salonId;
          if (salonId) {
            try {
              const bookingsData = await fetchBookingsBySalonId(salonId, {
                pageSize: 1000,
                isAdmin: true,
              });
              newAllSalonBookings[salonId] = bookingsData?.items || [];
            } catch (err) {
              console.error(`Error loading bookings for salon ${salonId}:`, err);
              newAllSalonBookings[salonId] = [];
            }
          }
        }
        setAllSalonBookings(newAllSalonBookings);
      } catch (err) {
        console.error("Error loading salons:", err);
        setError(err?.message || "Failed to load salons");
      } finally {
        setIsLoadingSalons(false);
        setIsLoadingAllSalonBookings(false);
      }
    };

    loadData();
  }, []);

  const isVi = language === "vi";

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 py-8">
      <motion.div key="salons-list" initial="hidden" animate="visible" variants={fadeInUp}>
        {/* <Breadcrumb
          items={[
            { label: t("menus.admin-dashboard") || "Dashboard", link: ROUTES.adminDashboard, icon: Home },
            { label: t("menus.admin-bookings") || "Salon Bookings" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#3d1f3f]">
            {t("header.bookings.title") || "Salon Bookings Overview"}
          </h1>
          <p className="mt-2 text-[14px] text-[#9a5f7f]">
            {isVi ? "Chọn chi nhánh để xem và quản lý lịch sử đặt lịch" : "Select a salon to view and manage its booking history"}
          </p>
        </div> */}

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {salons.map((salon, index) => (
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
                      <div className="flex items-center gap-2 text-[13px]">
                        <DollarSign size={14} className="text-[#16975f] shrink-0" />
                        <span className="font-bold text-[#16975f]">
                          ${calculateSalonRevenue(salon?.id || salon?.salonId).toLocaleString()}
                        </span>
                        <span className="text-[#9a5f7f] text-xs">{t("adminDashboard.table.revenue") || "Revenue"}</span>
                      </div>
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
        )}
      </motion.div>
    </div>
  );
}
