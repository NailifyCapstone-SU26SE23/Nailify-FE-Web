import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, Modal, message, Select, Spin, Alert, Table } from "antd";
import {
  Search,
  Eye,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock3,
  AlertCircle,
  X,
  CreditCard,
  RefreshCw,
  Wallet,
  Calendar,
  Check,
  CircleCheck
} from "lucide-react";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { fetchTransactions, fetchBookingById } from "../services/transactionService";
import dayjs from "dayjs";
import { RefundConfirmModal } from "../components/RefundConfirmModal";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const getInitials = (name) => {
  return (name || "C")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
};

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

export function TransactionManagementPage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionsData, setTransactionsData] = useState({
    items: [],
    totalCount: 0,
    totalPages: 0,
  });

  const [selectedSort, setSelectedSort] = useState("createdAt-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [refundConfirmVisible, setRefundConfirmVisible] = useState(false);

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransactions({
        pageNumber: currentPage,
        pageSize,
        status: statusFilter
      });

      if (data && data.items && data.items.length > 0) {
        const enrichedItems = await Promise.all(
          data.items.map(async (tx) => {
            if (tx.bookingId) {
              try {
                const booking = await fetchBookingById(tx.bookingId);
                return { ...tx, booking };
              } catch (e) {
                console.error("Error fetching booking details for tx:", tx.transactionId);
              }
            }
            return tx;
          })
        );
        data.items = enrichedItems;
      }

      setTransactionsData(data);
    } catch (err) {
      setError(err.message || "Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentPage, pageSize, statusFilter]);

  // Reset page when search or status filter changes to prevent offset bugs
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Load booking details when selected transaction changes
  useEffect(() => {
    if (selectedTransaction?.bookingId) {
      setLoadingBooking(true);
      setBookingDetails(null);
      fetchBookingById(selectedTransaction.bookingId)
        .then((data) => {
          setBookingDetails(data);
        })
        .catch((err) => {
          console.error("Error loading booking details:", err);
        })
        .finally(() => {
          setLoadingBooking(false);
        });
    } else {
      setBookingDetails(null);
    }
  }, [selectedTransaction]);

  // Handle manual page refresh
  const handleRefresh = () => {
    setCurrentPage(1);
    loadTransactions();
  };

  // Client side filtering for query and status to match premium instant feel
  const processedTransactions = useMemo(() => {
    let items = transactionsData.items || [];

    // Filter by status
    if (statusFilter !== "all") {
      items = items.filter(t => t.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        t =>
          t.customerName?.toLowerCase().includes(q) ||
          t.orderCode?.toLowerCase().includes(q) ||
          t.bookingId?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [transactionsData.items, searchQuery, statusFilter]);

  const sortedTransactions = useMemo(() => {
    const [sortKey, sortOrder] = selectedSort.split("-");
    const multiplier = sortOrder === "desc" ? -1 : 1;
    return [...processedTransactions].sort((a, b) => {
      let valA, valB;
      switch (sortKey) {
        case "orderCode":
          valA = (a.orderCode || "").toLowerCase();
          valB = (b.orderCode || "").toLowerCase();
          break;
        case "customer":
          valA = (a.customerName || "").toLowerCase();
          valB = (b.customerName || "").toLowerCase();
          break;
        case "totalPrice":
          valA = a.booking?.totalPrice ?? a.amount ?? 0;
          valB = b.booking?.totalPrice ?? b.amount ?? 0;
          break;
        case "deposit":
          valA = a.amountDue ?? a.booking?.amountDue ?? 0;
          valB = b.amountDue ?? b.booking?.amountDue ?? 0;
          break;
        case "balance":
          valA = a.amountPaid ?? a.booking?.amountPaid ?? 0;
          valB = b.amountPaid ?? b.booking?.amountPaid ?? 0;
          break;
        case "createdAt":
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case "status":
          valA = (a.status || "").toLowerCase();
          valB = (b.status || "").toLowerCase();
          break;
        default:
          return 0;
      }
      if (valA < valB) return -1 * multiplier;
      if (valA > valB) return 1 * multiplier;
      return 0;
    });
  }, [processedTransactions, selectedSort]);

  // Determine if server is returning paginated data or a flat array of all records
  const isServerPaginated = useMemo(() => {
    const totalPages = transactionsData.metaData?.totalPages || transactionsData.totalPages || 1;
    return totalPages > 1;
  }, [transactionsData]);

  // Calculate actual total pages for client-side or server-side pagination
  const totalPages = useMemo(() => {
    if (isServerPaginated) {
      return transactionsData.metaData?.totalPages || transactionsData.totalPages || 1;
    }
    return Math.max(1, Math.ceil(sortedTransactions.length / pageSize));
  }, [isServerPaginated, transactionsData, sortedTransactions.length, pageSize]);

  // Paginated/Sliced transactions for display
  const displayedTransactions = useMemo(() => {
    if (isServerPaginated) {
      return sortedTransactions;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(startIndex, startIndex + pageSize);
  }, [isServerPaginated, sortedTransactions, currentPage, pageSize]);

  // Recalculate metrics based on all current transactions
  const metrics = useMemo(() => {
    const allItems = transactionsData.items || [];
    const paidItems = allItems.filter(t => t.status?.toLowerCase() === "paid");
    const pendingItems = allItems.filter(t => t.status?.toLowerCase() === "pending");

    const totalRevenue = paidItems.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const successRate = allItems.length > 0
      ? Math.round((paidItems.length / allItems.length) * 100)
      : 0;

    return {
      totalRevenue,
      successRate,
      paidCount: paidItems.length,
      pendingCount: pendingItems.length,
      totalCount: allItems.length
    };
  }, [transactionsData.items]);

  // Copy helper
  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("Payment checkout link copied to clipboard!");
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleConfirmRefund = () => {
    toast.info("Tính năng đang được hoàn thiện (This feature is under development)");
    setRefundConfirmVisible(false);
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    const normStatus = String(status || "").toLowerCase();
    switch (normStatus) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce"></span>
            Pending
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
            Expired
          </span>
        );
      case "canceled":
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-[100dvh] font-sans relative overflow-hidden">
      {/* Premium background mesh gradients */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#ea4f93]/7 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[300px] left-[-100px] -z-10 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#ffa26f]/4 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Asymmetric Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#ea4f93]/10 text-[#ea4f93]">
                <Wallet size={18} className="stroke-[2]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ea4f93]">{language === "vi" ? "Quản lý" : "Manager"}</span>
            </div>
            <h1 className="text-3xl font-bold text-[#2d1b35] tracking-tight md:text-4xl">
              {language === "vi" ? "Lịch sử giao dịch" : "Transactions History"}
            </h1>
            <p className="text-xs md:text-sm text-[#a88a9f] max-w-[65ch] leading-relaxed">
              {language === "vi" ? "Thống kê và theo dõi các giao dịch đã xử lý. Truy cập liên kết thanh toán và mã thanh toán động." : "Track and audit all payments processed for customer bookings. Access checkout links and dynamic pay codes."}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="flex self-start md:self-auto items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4.5 py-3 text-xs font-bold text-[#2d1b35] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(234,79,147,0.08)] hover:border-[#ea4f93]/30 transition-all duration-300 active:scale-[0.98]"
          >
            <RefreshCw size={13} className={`${loading ? "animate-spin" : ""}`} />
            {language === "vi" ? "Làm mới dữ liệu" : "Refresh Data"}
          </button>
        </div>

        {/* Bento Metrics Cards */}
        <TopMetricsRow
          metrics={[
            {
              label: language === "vi" ? "Tổng doanh thu" : "Total Revenue",
              value: formatCurrency(metrics.totalRevenue),
              icon: CircleCheck,
              color: '#10b981', // emerald
              note: language === "vi" ? "Tính từ giao dịch thành công" : "Calculated from successful transactions"
            },
            {
              label: language === "vi" ? "Tỷ lệ thành công" : "Success Rate",
              value: metrics.successRate,
              unit: '%',
              icon: CreditCard,
              color: '#6366f1', // indigo
              note: `${metrics.paidCount} ${language === "vi" ? "của" : "of"} ${metrics.totalCount} ${language === "vi" ? "giao dịch hoàn thành" : "transactions completed"}`
            },
            {
              label: language === "vi" ? "Thanh toán chờ xử lý" : "Pending Payments",
              value: metrics.pendingCount,
              icon: Clock3,
              color: '#f59e0b', // amber
              note: language === "vi" ? "Đang chờ quét hoặc hoàn tất thanh toán" : "Awaiting scan or checkout completion"
            }
          ]}
          className="grid gap-6 grid-cols-1 md:grid-cols-3"
        />

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/75 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
            <input
              type="text"
              placeholder={t("manager.bookings.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/30 focus:outline-hidden focus:bg-white focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a88a9f] hover:text-[#2d1b35]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-[10px] font-bold text-[#a88a9f] uppercase tracking-wider">{language === "vi" ? "Trạng thái" : "Status"}:</span>
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-40 h-11 select-premium-antd"
              popupClassName="select-premium-dropdown"
              options={[
                { value: "all", label: language === "vi" ? "Tất cả trạng thái" : "All Statuses" },
                { value: "paid", label: language === "vi" ? "Đã thanh toán" : "Paid" },
                { value: "pending", label: language === "vi" ? "Đang chờ thanh toán" : "Pending" },
                { value: "expired", label: language === "vi" ? "Hết hạn" : "Expired" },
                { value: "canceled", label: language === "vi" ? "Đã hủy" : "Canceled" }
              ]}
              style={{
                borderRadius: "1rem",
              }}
            />
          </div>
        </div>

        {/* Loading / Error States / Data Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200/60 shadow-xs"
            >
              <Spin size="large" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] animate-pulse">{language === "vi" ? "Đang tải giao dịch..." : "Loading transactions..."}</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100"
            >
              <Alert
                message="Data Load Warning"
                description={error}
                type="warning"
                showIcon
                action={
                  <button
                    onClick={loadTransactions}
                    className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                  >
                    {language === "vi" ? "Thử lại" : "Retry"}
                  </button>
                }
              />
            </motion.div>
          ) : processedTransactions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-3xl border border-slate-200/60 shadow-xs"
            >
              <div className="p-4 rounded-full bg-slate-50 text-[#a88a9f] mb-4">
                <AlertCircle size={30} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-[#2d1b35]">{language === "vi" ? "Không tìm thấy giao dịch" : "No Transactions Found"}</h3>
              <p className="mt-1 text-xs text-[#a88a9f] max-w-[40ch] leading-relaxed">
                {language === "vi" ? "Không có bản ghi giao dịch nào khớp với cài đặt bộ lọc hiện tại. Hãy thử sửa đổi bộ lọc hoặc truy vấn tìm kiếm." : "There are no transaction records matching your current filter settings. Try modifying filters or search query."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="overflow-hidden bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_12px_40px_rgba(0,0,0,0.02)]"
            >
              <div className="overflow-x-auto">
                <Table
                  rowKey="transactionId"
                  dataSource={displayedTransactions}
                  pagination={false}
                  onChange={(pagination, filters, sorter) => {
                    if (sorter && sorter.field) {
                      if (sorter.order) {
                        setSelectedSort(`${sorter.field}-${sorter.order === "ascend" ? "asc" : "desc"}`);
                      } else {
                        setSelectedSort("createdAt-desc");
                      }
                    }
                  }}
                  onRow={(record) => ({
                    onClick: () => {
                      setSelectedTransaction(record);
                      setDrawerVisible(true);
                    }
                  })}
                  className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fff9fb] [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-[0.14em] [&_.ant-table-thead_th]:!text-[#a88a9f] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row>td]:!border-b [&_.ant-table-tbody_.ant-table-row>td]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row]:hover>td:!bg-[#fff9fb] [&_.ant-table-tbody_.ant-table-row>td]:!py-4 [&_.ant-table-tbody_.ant-table-row>td]:!text-[12px] [&_.ant-table-tbody_.ant-table-row>td]:!text-[#5b4256]"
                  columns={[
                    {
                      title: language === "vi" ? "Mã đơn hàng" : "Order Code",
                      dataIndex: "orderCode",
                      key: "orderCode",
                      sorter: true,
                      sortOrder: selectedSort === "orderCode-asc" ? "ascend" : selectedSort === "orderCode-desc" ? "descend" : null,
                      render: (_, tx) => (
                        <span className="font-mono font-bold text-sm text-[#ea4f93]">
                          #{tx.orderCode || "N/A"}
                        </span>
                      )
                    },
                    {
                      title: language === "vi" ? "Khách hàng & Địa điểm" : "Customer & Location",
                      dataIndex: "customer",
                      key: "customer",
                      sorter: true,
                      sortOrder: selectedSort === "customer-asc" ? "ascend" : selectedSort === "customer-desc" ? "descend" : null,
                      render: (_, tx) => (
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs shrink-0 shadow-xs ${getAvatarColor(tx.customerName)}`}>
                            {getInitials(tx.customerName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#2d1b35] text-sm truncate">
                              {tx.customerName || "Unnamed Customer"}
                            </div>
                            <div className="text-[10px] text-[#a88a9f] font-medium truncate mt-0.5">
                              {tx.salonName || "Nailify Salon"}
                            </div>
                          </div>
                        </div>
                      )
                    },
                    {
                      title: language === "vi" ? "Tổng giá" : "Total Price",
                      dataIndex: "totalPrice",
                      key: "totalPrice",
                      sorter: true,
                      sortOrder: selectedSort === "totalPrice-asc" ? "ascend" : selectedSort === "totalPrice-desc" ? "descend" : null,
                      render: (_, tx) => (
                        <span className="font-mono font-bold text-[#2d1b35] text-sm">
                          {tx.booking?.totalPrice != null ? formatCurrency(tx.booking.totalPrice) : formatCurrency(tx.amount)}
                        </span>
                      )
                    },
                    {
                      title: language === "vi" ? "Tiền đặt cọc" : "Deposit Paid",
                      dataIndex: "deposit",
                      key: "deposit",
                      sorter: true,
                      sortOrder: selectedSort === "deposit-asc" ? "ascend" : selectedSort === "deposit-desc" ? "descend" : null,
                      render: (_, tx) => (
                        <span className="font-mono font-bold text-[#ea4f93] text-sm">
                          {tx.amountDue != null ? formatCurrency(tx.amountDue) : (tx.booking?.amountDue != null ? formatCurrency(tx.booking.amountDue) : "-")}
                        </span>
                      )
                    },
                    {
                      title: language === "vi" ? "Số dư còn lại" : "Remaining Balance",
                      dataIndex: "balance",
                      key: "balance",
                      sorter: true,
                      sortOrder: selectedSort === "balance-asc" ? "ascend" : selectedSort === "balance-desc" ? "descend" : null,
                      render: (_, tx) => (
                        <span className="font-mono font-bold text-[#2fa25f] text-sm">
                          {tx.amountPaid != null ? formatCurrency(tx.amountPaid) : (tx.booking?.amountPaid != null ? formatCurrency(tx.booking.amountPaid) : "-")}
                        </span>
                      )
                    },
                    {
                      title: language === "vi" ? "Ngày tạo" : "Created At",
                      dataIndex: "createdAt",
                      key: "createdAt",
                      sorter: true,
                      sortOrder: selectedSort === "createdAt-asc" ? "ascend" : selectedSort === "createdAt-desc" ? "descend" : null,
                      render: (_, tx) => (
                        <div className="flex items-center gap-1.5 text-xs text-[#7f6478]">
                          <Calendar size={13} className="text-[#a88a9f]" />
                          <span className="font-medium">{dayjs(tx.createdAt).format("DD MMM YYYY, HH:mm")}</span>
                        </div>
                      )
                    },
                    {
                      title: language === "vi" ? "Trạng thái" : "Status",
                      dataIndex: "status",
                      key: "status",
                      sorter: true,
                      sortOrder: selectedSort === "status-asc" ? "ascend" : selectedSort === "status-desc" ? "descend" : null,
                      render: (_, tx) => renderStatusBadge(tx.status)
                    },
                    {
                      title: language === "vi" ? "Hành động" : "Actions",
                      key: "actions",
                      align: "right",
                      render: (_, tx) => (
                        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setDrawerVisible(true);
                            }}
                            title="View receipt detail"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#7f6478] hover:text-white hover:bg-[#ea4f93] hover:border-[#ea4f93] shadow-xs transition-all duration-300 active:scale-95"
                          >
                            <Eye size={13} className="stroke-[2]" />
                          </button>
                        </div>
                      )
                    }
                  ]}
                  components={{
                    body: {
                      wrapper: ({ children, ...props }) => (
                        <tbody {...props}>
                          <AnimatePresence>{children}</AnimatePresence>
                        </tbody>
                      ),
                      row: ({ children, className, style, ...props }) => (
                        <motion.tr
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }}
                          exit={{ opacity: 0 }}
                          className={`group border-l-4 border-l-transparent hover:border-l-[#ea4f93] hover:bg-[#fff9fc]/40 transition-all duration-300 cursor-pointer ${className || ""}`}
                          style={style}
                          {...props}
                        >
                          {children}
                        </motion.tr>
                      )
                    }
                  }}
                />
              </div>

              {/* Pagination footer */}
              {processedTransactions.length > 0 && (
                <div className="flex justify-between items-center px-6 py-4.5 border-t border-slate-100 bg-slate-50/30">
                  <span className="text-xs text-[#a88a9f]">
                    {language === "vi" 
                      ? <span>Hiển thị <span className="font-bold text-[#2d1b35]">{displayedTransactions.length}</span> / <span className="font-bold text-[#2d1b35]">{transactionsData.metaData?.totalItems || transactionsData.totalCount || processedTransactions.length}</span> kết quả</span>
                      : <span>Showing <span className="font-bold text-[#2d1b35]">{displayedTransactions.length}</span> of <span className="font-bold text-[#2d1b35]">{transactionsData.metaData?.totalItems || transactionsData.totalCount || processedTransactions.length}</span> items</span>
                    }
                  </span>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(p) => setCurrentPage(p)}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hide the native scrollbar on the receipt body while keeping it scrollable */}
      <style>{`
        .receipt-scroll::-webkit-scrollbar { width: 0; height: 0; }
        .receipt-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* Transaction Details Modal Pop-up */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#ea4f93]/10 text-[#ea4f93]">
              <Wallet size={16} className="stroke-[2]" />
            </span>
            <div className="text-left">
              <span className="text-[10px] text-[#a88a9f] font-bold uppercase tracking-wider block leading-none mb-1">{language === "vi" ? "Chi tiết giao dịch" : "Receipt Detail"}</span>
              <span className="font-mono text-sm font-bold text-[#2d1b35]">
                #{selectedTransaction?.orderCode || "N/A"}
              </span>
            </div>
          </div>
        }
        open={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        footer={null}
        width={440}
        centered
        destroyOnClose
        closeIcon={<X size={15} className="text-[#a88a9f] hover:text-[#ea4f93] transition-colors" />}
        styles={{
          content: { borderRadius: "1.75rem", padding: 0, overflow: "hidden" },
          header: { borderBottom: "1px solid #f1e7ed", padding: "1.25rem 1.5rem 1rem", marginBottom: 0 },
          body: { padding: 0, backgroundColor: "#fcf9fb" },
        }}
      >
        {selectedTransaction && (
          <div className="receipt-scroll max-h-[78vh] overflow-y-auto">
            <div className="p-6 space-y-5">

              {/* Unified summary: status + amount + order code in one place, no repeat further down */}
              <div className="text-center space-y-2.5 pb-1">
                <div className="flex justify-center items-center gap-2">
                  {renderStatusBadge(selectedTransaction.status)}
                  {bookingDetails && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${selectedTransaction.amount === bookingDetails.amountDue
                      ? "bg-[#fff2f7] text-[#ea4f93] border-[#ea4f93]/20"
                      : selectedTransaction.amount === bookingDetails.amountPaid
                        ? "bg-indigo-50 text-indigo-700 border-indigo-500/20"
                        : selectedTransaction.amount === bookingDetails.totalPrice
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500/20"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                      {selectedTransaction.amount === bookingDetails.amountDue
                        ? "Đặt cọc (Deposit)"
                        : selectedTransaction.amount === bookingDetails.amountPaid
                          ? "Thanh toán còn lại"
                          : selectedTransaction.amount === bookingDetails.totalPrice
                            ? "Thanh toán 100%"
                            : "Thanh toán"}
                    </span>
                  )}
                </div>
                <h2 className="text-4xl font-mono font-bold text-[#2d1b35] tracking-tight">
                  {formatCurrency(selectedTransaction.amount)}
                </h2>
                <p className="text-xs text-[#a88a9f]">
                  {language === "vi" ? "Mã đơn hàng" : "Order Code"} <span className="font-mono font-bold text-[#2d1b35]">#{selectedTransaction.orderCode}</span>
                </p>
              </div>

              {/* Thermal Invoice Printout Panel */}
              <div className="bg-[#faf8f5] border border-[#e6decb] p-5 rounded-[1.75rem] shadow-[0_8px_24px_rgba(97,76,60,0.03)] relative overflow-hidden text-[#4a3f35] border-t-4 border-t-[#ea4f93]">
                {/* Dashed edge header */}
                <div className="text-center pb-3.5 border-b border-dashed border-[#e6decb] space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#a88a9f]">{language === "vi" ? "Hóa đơn Nailify" : "Nailify Receipt"}</h3>
                  <div className="font-mono text-[9px] text-[#a88a9f]">
                    {dayjs(selectedTransaction.createdAt).format("DD MMM YYYY, HH:mm")}
                  </div>
                </div>

                {/* Customer & Salon Details inside Receipt */}
                <div className="py-3.5 space-y-2 border-b border-dashed border-[#e6decb] text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#a88a9f] shrink-0">{language === "vi" ? "Khách hàng" : "Customer"}</span>
                    <span className="font-bold text-[#2d1b35] text-right truncate">{selectedTransaction.customerName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#a88a9f] shrink-0">{language === "vi" ? "Salon" : "Salon"}</span>
                    <span className="font-bold text-[#ea4f93] text-right truncate">{selectedTransaction.salonName || "Nailify Salon"}</span>
                  </div>
                  {bookingDetails && (
                    <div className="flex justify-between gap-3 border-t border-dashed border-[#e6decb]/40 pt-2 mt-1.5">
                      <span className="text-[#a88a9f] shrink-0">{language === "vi" ? "Loại thanh toán" : "Payment Type"}</span>
                      <span className="font-bold text-[#2d1b35] text-right">
                        {selectedTransaction.amount === bookingDetails.amountDue
                          ? "Đặt cọc (Deposit)"
                          : selectedTransaction.amount === bookingDetails.amountPaid
                            ? "Thanh toán còn lại"
                            : selectedTransaction.amount === bookingDetails.totalPrice
                              ? "Thanh toán 100%"
                              : "Thanh toán đơn hàng"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Billing Breakdown inside Receipt */}
                <div className="py-3.5">
                  {loadingBooking ? (
                    <div className="flex justify-center items-center py-6">
                      <Spin size="small" />
                    </div>
                  ) : bookingDetails ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#a88a9f]">Subtotal</span>
                        <span className="font-mono font-semibold text-[#2d1b35]">{formatCurrency(bookingDetails.price)}</span>
                      </div>

                      {bookingDetails.discounts && bookingDetails.discounts.length > 0 ? (
                        bookingDetails.discounts.map((d, index) => (
                          <div key={d.id ?? index} className="flex justify-between pl-2.5 text-[11px]">
                            <span className="text-[#a88a9f] italic">↳ {d.type}: {d.name}</span>
                            <span className="font-mono text-emerald-600 font-medium">
                              {d.amountDisplay || `-${formatCurrency(d.amount)}`}
                            </span>
                          </div>
                        ))
                      ) : (
                        bookingDetails.discount !== 0 && (
                          <div className="flex justify-between">
                            <span className="text-[#a88a9f]">{language === "vi" ? "Giảm giá" : "Discount"}</span>
                            <span className="font-mono text-emerald-600 font-medium">
                              {bookingDetails.discount > 0 ? "-" : ""}{formatCurrency(Math.abs(bookingDetails.discount))}
                            </span>
                          </div>
                        )
                      )}

                      <div className="flex justify-between border-t border-dashed border-[#e6decb] pt-2">
                        <span className="text-[#a88a9f] font-bold">{language === "vi" ? "Tổng giá tiền" : "Total Price"}</span>
                        <span className="font-mono font-bold text-[#2d1b35]">{formatCurrency(bookingDetails.totalPrice)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#a88a9f]">{language === "vi" ? "Tiền đặt cọc" : "Deposit paid"}</span>
                        <span className="font-mono text-[#ea4f93] font-bold">{formatCurrency(bookingDetails.amountDue)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#a88a9f]">{language === "vi" ? "Số dư còn lại" : "Remaining balance"}</span>
                        <span className="font-mono text-[#2d1b35] font-semibold">{formatCurrency(bookingDetails.amountPaid)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#a88a9f] italic text-center py-2">
                      {selectedTransaction.bookingId
                        ? `Could not load details for booking #${selectedTransaction.bookingId.slice(0, 8)}`
                        : "No linked booking for this transaction."}
                    </p>
                  )}
                </div>

                {/* Barcode footer */}
                <div className="border-t border-dashed border-[#e6decb] pt-3.5 text-center space-y-1.5">
                  <div className="flex justify-center items-center gap-[2px] opacity-25 h-6 select-none">
                    {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6].map((w, i) => (
                      <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.25em] text-[#a88a9f] font-mono">
                    {language === "vi" ? "Nailify Inc — Xin Cảm ơn" : "Nailify Inc — Thank You"}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-2.5 shadow-xs">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#ea4f93]">{language === "vi" ? "Thời gian" : "Timeline"}</h4>

                <div className="flex justify-between text-xs">
                  <span className="text-[#a88a9f]">{language === "vi" ? "Đã tạo" : "Created"}</span>
                  <span className="text-[#2d1b35] font-medium">{dayjs(selectedTransaction.createdAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                </div>

                {selectedTransaction.paidAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a88a9f]">{language === "vi" ? "Đã thanh toán" : "Paid"}</span>
                    <span className="text-[#2fa25f] font-semibold">{dayjs(selectedTransaction.paidAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                  </div>
                )}

                {selectedTransaction.expiresAt && !selectedTransaction.paidAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a88a9f]">{language === "vi" ? "Hết hạn" : "Expires"}</span>
                    <span className="text-[#db8520] font-semibold">{dayjs(selectedTransaction.expiresAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                  </div>
                )}
              </div>

              {/* Interactive payment area for Pending state */}
              {selectedTransaction.status?.toLowerCase() === "pending" && (
                <div className="bg-white rounded-2xl border border-amber-200 p-4.5 text-center space-y-3.5 shadow-xs">
                  <div className="inline-flex p-2.5 bg-amber-50 rounded-full text-amber-600">
                    <Clock3 size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2d1b35]">{language === "vi" ? "Chờ thanh toán" : "Awaiting Payment Scan"}</h4>
                    <p className="text-xs text-[#a88a9f] mt-1 leading-relaxed">
                      {language === "vi" ? "Quét mã VietQR này tại quầy thanh toán, hoặc sử dụng liên kết thanh toán bên dưới." : "Scan this VietQR at the checkout desk, or use the payment link below."}
                    </p>
                  </div>

                  {selectedTransaction.qrCode && (
                    <div className="flex flex-col items-center bg-[#f9fafb] p-3 rounded-2xl border border-[#f1e7ed]">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedTransaction.qrCode)}`}
                        alt="Payment QR Code"
                        className="w-[150px] h-[150px] object-contain border border-[#f1e7ed] p-1.5 bg-white rounded-xl shadow-xs"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <button
                      onClick={() => handleCopyLink(selectedTransaction.checkoutUrl)}
                      className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-xl bg-white border border-[#f1e7ed] hover:border-[#ea4f93]/40 text-xs font-bold text-[#2d1b35] transition hover:bg-[#fff7fb] active:scale-[0.98]"
                    >
                      <Copy size={13} />
                      {language === "vi" ? "Sao chép liên kết thanh toán" : "Copy Checkout Link"}
                    </button>

                    {selectedTransaction.checkoutUrl && (
                      <a
                        href={selectedTransaction.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-xl bg-[#ea4f93] hover:bg-[#db4386] text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
                      >
                        <ExternalLink size={13} />
                        {language === "vi" ? "Đi đến Cổng thanh toán" : "Go to Checkout Portal"}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Policy Notes */}
              <div className="bg-white rounded-2xl p-4 text-xs text-[#7f6478] space-y-1.5 border border-[#f1e7ed]">
                <div className="flex items-center gap-1.5 font-bold text-[#2d1b35]">
                  <AlertCircle size={14} className="text-[#ea4f93]" />
                  <span>{language === "vi" ? "Chính sách giao dịch Nailify" : "Nailify Transaction Policy"}</span>
                </div>
                <p className="leading-relaxed text-[#7f6478]">
                  {language === "vi" ? "Tất cả các khoản thanh toán được xử lý thông qua cổng PayOS/VietQR của bên thứ ba. Các chính sách hoàn tiền đặt trước đặt chỗ tiêu chuẩn được áp dụng theo hướng dẫn của Chi nhánh Nailify." : "All payments processed via third-party PayOS/VietQR gateways. Standard booking reservation refund policies apply according to Nailify Branch guidelines."}
                </p>
              </div>

              {/* Close Modal Footer */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDrawerVisible(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition active:scale-[0.98]"
                >
                  {language === "vi" ? "Đóng hóa đơn" : "Close Receipt"}
                </button>
                {selectedTransaction.status?.toLowerCase() === "paid" && (
                  <button
                    onClick={() => setRefundConfirmVisible(true)}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-600 rounded-xl transition active:scale-[0.98]"
                  >
                    {language === "vi" ? "Hoàn tiền" : "Refund Payment"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Confirmation Modal */}
      <RefundConfirmModal
        open={refundConfirmVisible}
        onCancel={() => setRefundConfirmVisible(false)}
        onConfirm={handleConfirmRefund}
        transaction={selectedTransaction}
      />
    </div>
  );
}