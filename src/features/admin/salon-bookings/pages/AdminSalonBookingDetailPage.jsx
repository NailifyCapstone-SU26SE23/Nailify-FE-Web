import toast from 'react-hot-toast';
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Search,
  Home,
  CreditCard,
  Sparkles,
  TrendingUp,
  UserRound,
  ChevronRight,
  Percent,
  Banknote,
  Eye,
  Clock,
} from "lucide-react";
import { Spin, Input, Empty, Tag, Table, DatePicker, Button, Select, Tooltip as AntTooltip } from "antd";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { useDebounce } from "../../../../shared/hooks/useDebounce";
import { DateRangePicker } from "../../../../shared/components/ui/DateRangePicker";
import dayjs from "dayjs";

import { fetchBookingsBySalonId } from "../../../manager/bookings/services/bookingsService";
import { fetchAdminSalonDetail } from "../../salon-management/services/salonManagementService";
import {
  ROUTES,
  getAdminBookingDetailRoute,
} from "../../../../shared/constants/routes";
import { ActionButtons } from "../../../../shared/components/common/ActionButtons";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

const SALON_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" rx="28" fill="#fde7ef"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8f365c" font-family="Arial, sans-serif" font-size="30" font-weight="700">Salon</text></rect></svg>'
)}`;

function PremiumCard({ className = "", children, padded = true, noHover = false }) {
  return (
    <article
      className={`relative overflow-hidden rounded-lg border border-[#f5e2ec] bg-white ${padded ? "p-6" : ""
        } shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(226,93,143,0.06)]" : ""
        } ${className}`}
    >
      {children}
    </article>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-[16px] font-bold text-[#2d1b35]">{title}</h2>
      {subtitle ? (
        <p className="mt-1.5 text-[11px] text-[#a88a9f] leading-relaxed">{subtitle}</p>
      ) : null}
    </div>
  );
}
const getStatusDisplay = (status, isVi) => {
  const s = status || "";
  switch (s) {
    case "Pending":
      return { text: isVi ? "Chờ xác nhận" : "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    case "Approved":
      return { text: isVi ? "Đã duyệt" : "Approved", color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "Rejected":
      return { text: isVi ? "Đã từ chối" : "Rejected", color: "bg-red-50 text-red-700 border-red-200" };
    case "Cancelled":
      return { text: isVi ? "Đã hủy" : "Cancelled", color: "bg-gray-50 text-gray-700 border-gray-200" };
    case "CheckedIn":
      return { text: isVi ? "Đã Check-in" : "Checked In", color: "bg-purple-50 text-purple-700 border-purple-200" };
    case "InProgress":
      return { text: isVi ? "Đang thực hiện" : "In Progress", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "ServiceCompleted":
      return { text: isVi ? "Dịch vụ hoàn tất" : "Service Completed", color: "bg-teal-50 text-teal-700 border-teal-200" };
    case "Completed":
      return { text: isVi ? "Hoàn thành" : "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "Repaired":
      return { text: isVi ? "Đã bảo hành" : "Repaired", color: "bg-cyan-50 text-cyan-700 border-cyan-200" };
    case "ReschedulePending":
      return { text: isVi ? "Chờ đổi lịch" : "Reschedule Pending", color: "bg-orange-50 text-orange-700 border-orange-200" };
    case "RescheduleSuggested":
      return { text: isVi ? "Đề xuất đổi lịch" : "Reschedule Suggested", color: "bg-orange-50 text-orange-700 border-orange-200" };
    default:
      return { text: s, color: "bg-slate-50 text-slate-700 border-slate-200" };
  }
};

function BookingCard({ booking, index }) {
  const { language } = useLanguage();
  const isVi = language === "vi";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="rounded-[28px] border border-[#f5e2ec] bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_45px_rgba(226,93,143,0.06)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shrink-0">
            <span className="text-lg font-bold">
              {booking?.customerName?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#2d1b35] truncate">
              {booking?.customerName || "Unknown Customer"}
            </h3>
            {booking?.customerEmail && (
              <p className="text-[11px] text-[#a88a9f] mt-1 truncate">
                {booking.customerEmail}
              </p>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${getStatusDisplay(booking?.status, isVi).color}`}>
          <span className="text-[10px] font-bold">
            {getStatusDisplay(booking?.status, isVi).text}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-[12px] text-[#5b4256]">
        {booking?.customerPhone && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fde7ef] text-[#ea4f93] shrink-0">
              <Phone size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Phone
              </p>
              <p className="font-medium text-[#2d1b35] truncate">
                {booking.customerPhone}
              </p>
            </div>
          </div>
        )}
        {booking?.bookingDate && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fde7ef] text-[#ea4f93] shrink-0">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Date
              </p>
              <p className="font-medium text-[#2d1b35]">
                {dayjs(booking.bookingDate).format("MMM D, YYYY")}
              </p>
            </div>
          </div>
        )}
        {booking?.totalAmount && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fde7ef] text-[#ea4f93] shrink-0">
              <CreditCard size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Total
              </p>
              <p className="font-bold text-[18px] text-[#2d1b35]">
                ${Number(booking.totalAmount).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {booking?.services && Array.isArray(booking.services) && booking.services.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#f5e2ec]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">
            Services
          </p>
          <div className="flex flex-wrap gap-2">
            {booking.services.map((service, idx) => (
              <Tag
                key={idx}
                color="pink"
                className="!bg-[#fff5fb] !text-[#ea4f93] !border-[#f0b7cf] !text-[10px] !font-semibold !px-3 !py-1 !rounded-full"
              >
                {service.name || service}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[28px] border border-[#f5e2ec] bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)]">
      <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-[#fde7ef]" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-[#fde7ef] rounded-lg w-48" />
            <div className="h-4 bg-[#fde7ef] rounded-lg w-32" />
          </div>
          <div className="h-8 w-24 rounded-full bg-[#fde7ef]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#fde7ef]" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-[#fde7ef] rounded-lg w-12" />
                <div className="h-4 bg-[#fde7ef] rounded-lg w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export function AdminSalonBookingDetailPage() {
  const { t, language } = useLanguage();
  const isVi = language === "vi";
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoadingSalon, setIsLoadingSalon] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [allStatsBookings, setAllStatsBookings] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (error) {
      toast.error(error, { id: "error-msg" });
    }
  }, [error]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [chartView, setChartView] = useState("day"); // "day", "week", "month", "year"

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadAllStatsBookings = async () => {
      if (!salonId) return;

      setIsLoadingStats(true);

      try {
        let options = {
          pageNumber: 1,
          pageSize: 10000,
          isAdmin: true,
        };

        if (dateRange && dateRange.length === 2) {
          options.startDate = dayjs(dateRange[0]).toISOString();
          options.endDate = dayjs(dateRange[1]).toISOString();
        }

        const bookingsData = await fetchBookingsBySalonId(salonId, options);
        setAllStatsBookings(bookingsData?.items || []);
      } catch (err) {
        console.error("Error loading stats bookings:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadAllStatsBookings();
  }, [salonId, dateRange]);

  const stats = useMemo(() => {
    const completedBookings = allStatsBookings.filter(
      (booking) => booking?.status?.toLowerCase() === "completed"
    );

    const totalRevenue = completedBookings.reduce(
      (sum, booking) => sum + Number(booking?.totalPrice || booking?.totalAmount || 0),
      0
    );
    const avgBookingValue = completedBookings.length > 0
      ? totalRevenue / completedBookings.length
      : 0;

    const groupedData = completedBookings.reduce((acc, booking) => {
      const bDate = dayjs(booking?.bookingDate || booking?.createdAt);
      let sortKey = "";
      let displayLabel = "";

      if (chartView === "day") {
        sortKey = bDate.format("YYYY-MM-DD");
        displayLabel = bDate.format("MMM D");
      } else if (chartView === "week") {
        const start = bDate.startOf("week");
        sortKey = start.format("YYYY-MM-DD");
        displayLabel = `${start.format("MMM D")} - ${bDate.endOf("week").format("MMM D")}`;
      } else if (chartView === "month") {
        sortKey = bDate.format("YYYY-MM");
        displayLabel = bDate.format("MMM YYYY");
      } else if (chartView === "year") {
        sortKey = bDate.format("YYYY");
        displayLabel = bDate.format("YYYY");
      }

      if (!acc[sortKey]) {
        acc[sortKey] = { label: displayLabel, revenue: 0 };
      }
      acc[sortKey].revenue += Number(booking?.totalPrice || booking?.totalAmount || 0);
      return acc;
    }, {});

    let chartData = Object.entries(groupedData)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, data]) => ({ date: data.label, revenue: data.revenue }));

    // Limit to last 30 points if it's day, otherwise let it show all if it's month/year
    if (chartView === "day" && chartData.length > 30) {
      chartData = chartData.slice(-30);
    } else if (chartView === "week" && chartData.length > 12) {
      chartData = chartData.slice(-12);
    } else if (chartView === "month" && chartData.length > 12) {
      chartData = chartData.slice(-12);
    }

    if (chartData.length === 0) {
      if (dateRange && dateRange.length === 2) {
        chartData = [
          { date: dayjs(dateRange[0]).format("MMM D"), revenue: 0 },
          { date: dayjs(dateRange[1]).format("MMM D"), revenue: 0 },
        ];
      } else {
        chartData = [
          { date: dayjs().subtract(1, 'day').format("MMM D"), revenue: 0 },
          { date: dayjs().format("MMM D"), revenue: 0 },
        ];
      }
    }

    return {
      totalRevenue,
      totalBookings: totalCount,
      avgBookingValue,
      chartData,
    };
  }, [allStatsBookings, dateRange, totalCount, chartView]);

  const bookingColumns = useMemo(() => {
    return [
      {
        title: isVi ? "Khách hàng" : "Customer",
        key: "customerInfo",
        width: "30%",
        sorter: (a, b) => (a.customerName || "").localeCompare(b.customerName || ""),
        render: (_, booking) => (
          <div>
            <p className="text-sm font-bold text-[#412643]">{booking.customerName}</p>
            {booking.customerEmail && <p className="text-[11px] text-[#a88a9f]">{booking.customerEmail}</p>}
          </div>
        ),
      },
      {
        title: isVi ? "Ngày" : "Date",
        dataIndex: "bookingDate",
        key: "bookingDate",
        width: "20%",
        sorter: (a, b) => dayjs(a.bookingDate).valueOf() - dayjs(b.bookingDate).valueOf(),
        render: (value) => <span className="text-sm font-medium text-[#2d1b35]">{value ? dayjs(value).format("MMM D, YYYY") : "--"}</span>,
      },
      {
        title: isVi ? "Tổng tiền" : "Total",
        key: "totalAmount",
        width: "15%",
        sorter: (a, b) => (a.totalAmount || a.totalPrice || 0) - (b.totalAmount || b.totalPrice || 0),
        render: (_, booking) => {
          const amount = booking.totalAmount || booking.totalPrice || 0;
          const formattedAmount = `${amount.toLocaleString("vi-VN")} VND`;
          return <span className="text-[14px] font-bold text-[#2d1b35]">{formattedAmount}</span>;
        },
      },

      {
        title: isVi ? "Trạng thái" : "Status",
        dataIndex: "status",
        key: "status",
        width: "25%",
        sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
        filteredValue: statusFilter ? [statusFilter] : null,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
          <div style={{ padding: 12 }} onKeyDown={(e) => e.stopPropagation()}>
            <Select
              value={selectedKeys[0] || null}
              onChange={(val) => setSelectedKeys(val ? [val] : [])}
              style={{ width: 220, marginBottom: 12, display: 'flex' }}
              placeholder={isVi ? "Chọn trạng thái" : "Select status"}
              options={[
                { value: "Pending", label: isVi ? "Chờ xác nhận" : "Pending" },
                { value: "Approved", label: isVi ? "Đã duyệt" : "Approved" },
                { value: "Rejected", label: isVi ? "Đã từ chối" : "Rejected" },
                { value: "Cancelled", label: isVi ? "Đã hủy" : "Cancelled" },
                { value: "CheckedIn", label: isVi ? "Đã Check-in" : "Checked In" },
                { value: "InProgress", label: isVi ? "Đang thực hiện" : "In Progress" },
                { value: "ServiceCompleted", label: isVi ? "Dịch vụ hoàn tất" : "Service Completed" },
                { value: "Completed", label: isVi ? "Hoàn thành" : "Completed" },
                { value: "Repaired", label: isVi ? "Đã bảo hành" : "Repaired" },
                { value: "ReschedulePending", label: isVi ? "Chờ đổi lịch" : "Reschedule Pending" },
                { value: "RescheduleSuggested", label: isVi ? "Đề xuất đổi lịch" : "Reschedule Suggested" },
              ]}
              allowClear
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="primary"
                onClick={() => {
                  setStatusFilter(selectedKeys[0] || "");
                  confirm();
                }}
                size="small"
                className="bg-[#ea4f93] flex-1"
              >
                {isVi ? "Lọc" : "Filter"}
              </Button>
              <Button
                onClick={() => {
                  clearFilters();
                  setSelectedKeys([]);
                  setStatusFilter("");
                  confirm();
                }}
                size="small"
                className="flex-1"
              >
                {isVi ? "Xoá" : "Reset"}
              </Button>
            </div>
          </div>
        ),
        render: (status) => {
          const display = getStatusDisplay(status, isVi);
          return (
            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold border ${display.color}`}>
              {display.text}
            </span>
          );
        },
      },
      {
        title: isVi ? "Thao tác" : "Actions",
        key: "actions",
        align: "right",
        width: "10%",
        render: (_, booking) => {
          const bookingId = booking?.bookingId || booking?.id;

          return (
            <ActionButtons
              onView={() =>
                navigate(getAdminBookingDetailRoute(bookingId), {
                  state: { from: `/admin/bookings/${salonId}` },
                })
              }
              showView={!!bookingId}
            />
          );
        },
      },
    ];
  }, [dateRange, isVi, navigate, salonId]);

  const salonSummary = useMemo(() => {
    const isVi = language === "vi";
    return [
      {
        label: t("adminDashboard.table.revenue") || "Total Revenue",
        value: stats.totalRevenue.toLocaleString("vi-VN"),
        unit: "VND",
        note: isVi ? "+12.5% quý này" : "+12.5% this quarter",
        icon: Banknote,
        color: "#ea4f93",
      },
      {
        label: isVi ? "Lịch hẹn đã hoàn thành" : "Completed Bookings",
        value: stats.totalBookings.toString(),
        unit: "",
        note: isVi ? "+8 tuần này" : "+8 this week",
        icon: Calendar,
        color: "#f59e0b",
      },
      {
        label: isVi ? "Giá trị lịch hẹn TB" : "Avg Booking Value",
        value: Math.round(stats.avgBookingValue).toLocaleString("vi-VN"),
        unit: "VND",
        note: isVi ? "+5.2% so với tháng trước" : "+5.2% vs last month",
        icon: CreditCard,
        color: "#10b981",
      },
      {
        label: t("userManagement.table.status") || "Status",
        value: (() => {
          if (isLoadingSalon) return "...";
          const s = salon?.status?.toLowerCase();
          if (s === "open") return isVi ? "Mở cửa" : "Open";
          if (s === "closed") return isVi ? "Đóng cửa" : "Closed";
          if (s === "active") return isVi ? "Đang hoạt động" : "Active";
          return salon?.status || "N/A";
        })(),
        unit: "",
        note: isVi ? "Hoạt động bình thường" : "Operating normally",
        icon: Sparkles,
        color: "#0ea5e9",
      },
    ];
  }, [stats, salon, isLoadingSalon, t, language]);

  useEffect(() => {
    const loadSalon = async () => {
      if (!salonId) return;
      setIsLoadingSalon(true);
      try {
        const salonData = await fetchAdminSalonDetail(salonId);
        setSalon(salonData);
      } catch (err) {
        console.error("Error loading salon:", err);
      } finally {
        setIsLoadingSalon(false);
      }
    };
    loadSalon();
  }, [salonId]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!salonId) return;

      setIsLoadingBookings(true);
      setError("");

      try {
        let options = {
          pageNumber: currentPage,
          pageSize: pageSize,
          isAdmin: true,
        };

        if (debouncedSearch) {
          options.search = debouncedSearch;
        }

        if (dateRange && dateRange.length === 2) {
          options.startDate = dayjs(dateRange[0]).toISOString();
          options.endDate = dayjs(dateRange[1]).toISOString();
        }

        if (statusFilter) {
          options.status = statusFilter;
        }

        const bookingsData = await fetchBookingsBySalonId(salonId, options);

        setBookings(bookingsData?.items || []);
        setTotalCount(bookingsData?.totalCount || bookingsData?.metaData?.totalItems || bookingsData?.items?.length || 0);
      } catch (err) {
        console.error("Error loading bookings:", err);
        setError(err?.message || "Failed to load bookings.");
      } finally {
        setIsLoadingBookings(false);
      }
    };

    loadBookings();
  }, [salonId, currentPage, pageSize, debouncedSearch, dateRange, statusFilter]);

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-lg bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminSalonBookings}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">
              {isLoadingSalon ? (t("adminSalonBookings.loading")) : salon?.name || "Salon Bookings"}
            </h1>
            <nav className="flex items-center gap-1.5 text-[12px] mt-1">
              <Link
                to={ROUTES.adminDashboard}
                className="text-slate-400 hover:text-[#ea4f93] font-medium transition-colors"
              >
                <Home size={12} className="inline mr-1" />
                {t("menus.admin-dashboard") || "Dashboard"}
              </Link>
              <ChevronRight size={10} className="text-slate-300" />
              <Link
                to={ROUTES.adminSalonBookings}
                className="text-slate-400 hover:text-[#ea4f93] font-medium transition-colors"
              >
                <Calendar size={12} className="inline mr-1" />
                {t("menus.admin-bookings") || "Salon Bookings"}
              </Link>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-[#ea4f93] font-bold">
                {isLoadingSalon ? (t("adminSalonBookings.loading")) : salon?.name || "Salon"}
              </span>
            </nav>
          </div>
        </div>

        {!isLoadingSalon && salon && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-[#2d1b35]">{salon.name}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Phone size={10} />
                {salon.phone}
              </span>
            </div>
            <img
              crossOrigin="anonymous"
              src={salon.image || salon.imageUrl || SALON_PLACEHOLDER_IMAGE}
              alt={salon.name}
              className="h-14 w-14 rounded-2xl object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </header>

      {!isLoadingSalon && (
        <TopMetricsRow metrics={salonSummary} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
      )}

      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <PremiumCard className="rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <SectionHeading
                title={t(`adminDashboard.widgets.revenueTrend`)}
                subtitle={t("adminSalonBookings.revenueFromCompletedBookingsOv")}
              />
              <Select
                value={chartView}
                onChange={(val) => setChartView(val)}
                className="w-[120px]"
                size="middle"
                options={[
                  { value: "day", label: isVi ? "Theo Ngày" : "By Day" },
                  { value: "week", label: isVi ? "Theo Tuần" : "By Week" },
                  { value: "month", label: isVi ? "Theo Tháng" : "By Month" },
                  { value: "year", label: isVi ? "Theo Năm" : "By Year" },
                ]}
              />
            </div>
            {isLoadingStats ? (
              <div className="h-64 bg-[#fde7ef] rounded-2xl animate-pulse mt-6" />
            ) : (
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea4f93" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ea4f93" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5e2ec" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#a88a9f"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#a88a9f"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value.toLocaleString("vi-VN")} ₫`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid #f5e2ec",
                        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ea4f93"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </PremiumCard>

          <div className="h-full">
            <PremiumCard className="h-full rounded-lg">
              <SectionHeading
                title={t("adminSalonBookings.quickStats")}
                subtitle={t("adminSalonBookings.keyInformationAboutTheSalon")}
              />
              <div className="mt-6 space-y-5">
                {isLoadingSalon ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-[#fde7ef] rounded-lg w-24 animate-pulse" />
                      <div className="h-7 bg-[#fde7ef] rounded-xl w-full animate-pulse" />
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] flex items-center gap-1 font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">
                        <Phone size={12} /> {t("adminSalonBookings.salonPhone")}
                      </p>
                      <p className="text-[14px] font-bold text-[#2d1b35]">
                        {salon?.phone}
                      </p>
                    </div>
                    {/* <div>
                      <p className="text-[10px] flex items-center gap-1 font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">
                        <Clock size={12} /> {t("adminSalonBookings.operatingHours")}
                      </p>
                      <p className="text-[13px] font-medium text-[#5b4256]">
                        {salon?.hours}
                      </p>
                    </div> */}
                    <div>
                      <p className="text-[10px] flex items-center gap-1 font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">
                        <MapPin size={12} /> {t("adminSalonBookings.location")}
                      </p>
                      <p className="text-[13px] font-medium text-[#5b4256] truncate">
                        {salon?.address}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </PremiumCard>
          </div>
        </div>
      </motion.div>

      <PremiumCard>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <SectionHeading
            title={t("adminSalonBookings.completedBookings") || "Bookings"}
            subtitle={
              language === "vi"
                ? `Hiển thị ${totalCount} lịch hẹn${searchQuery ? ` • Tìm kiếm: "${searchQuery}"` : ""}`
                : `Showing ${totalCount} booking${totalCount !== 1 ? "s" : ""}${searchQuery ? ` • Search: "${searchQuery}"` : ""}`
            }
          />
          <div className="flex flex-1 items-center gap-3 max-w-2xl justify-end">
            <DateRangePicker
              value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0].startOf('day').valueOf(), dates[1].endOf('day').valueOf()]);
                } else {
                  setDateRange(null);
                }
              }}
              className="min-w-[260px] h-10 rounded-full border-[#f0b7cf] px-4 shadow-inner shadow-[#fff0f8] !bg-white hover:border-[#ea4f93] focus:border-[#ea4f93]"
            />
            <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-[#f0b7cf] bg-white px-4 shadow-inner shadow-[#fff0f8]">
              <Search size={18} className="text-[#ea4f93]" />
              <Input
                placeholder={t("adminSalonBookings.searchCustomerNameEmailOrPhone")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="borderless"
                className="!bg-transparent !text-[13px] !text-[#2d1b35] !placeholder:text-[#c8b0bf]"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-center py-6 bg-[#fff0f0] rounded-2xl border border-[#fecdd3]">
            <p className="text-[#d14c84] font-bold text-sm">{error}</p>
          </div>
        )}

        {isLoadingBookings ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="overflow-auto -mx-6 px-6">
            <Table
              rowKey={(record) => record?.id || record?.bookingId}
              columns={bookingColumns}
              dataSource={bookings}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount,
                showSizeChanger: true,
                className: "!mt-4",
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size && size !== pageSize) {
                    setPageSize(size);
                    setCurrentPage(1);
                  }
                },
              }}
              locale={{
                emptyText: (
                  <div className="py-12">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div>
                          <p className="text-[#5b4256] text-sm font-medium">
                            {t("adminSalonBookings.noCompletedBookingsFound") || "No completed bookings found"}
                          </p>
                          {(searchQuery || dateRange) && (
                            <p className="text-[#a88a9f] text-xs mt-1">
                              {t("adminSalonBookings.tryADifferentSearchTerm") || "Try a different search term or date range"}
                            </p>
                          )}
                        </div>
                      }
                    />
                  </div>
                ),
              }}
              size="middle"
              className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fff7fb] [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-thead_th]:!text-[#8f7484] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!text-[12px] [&_.ant-table-tbody_tr>td]:!border-b [&_.ant-table-tbody_tr>td]:!border-[#f5e2ec] [&_.ant-table-tbody_tr:hover>td]:!bg-[#fff5fb] transition-colors"
            />
          </div>
        )}
      </PremiumCard>
    </section>
  );
}
