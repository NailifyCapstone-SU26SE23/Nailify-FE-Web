import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, message, Select, Spin, Alert, Table } from "antd";
import {
  Search,
  Eye,
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Clock,
  Wallet,
  Calendar,
  RefreshCw,
  AlertCircle,
  X,
  CreditCard,
  Clock3,
  SlidersHorizontal, CircleX, CircleCheck, ListFilter
} from "lucide-react";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";
import { fetchAdminTransactions, fetchAdminTransactionById } from "../services/transactionService";
import { fetchBookingById } from "../../../manager/transaction-management/services/transactionService";
import dayjs from "dayjs";
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

// Dynamic salon metrics are fetched via API in background
export function TransactionOverviewPage() {
  const { t, language } = useLanguage();
  // Salons selection state
  const [salons, setSalons] = useState([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [salonsError, setSalonsError] = useState(null);
  const [salonSearchQuery, setSalonSearchQuery] = useState("");
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [salonStatusFilter, setSalonStatusFilter] = useState("all");
  const [salonSortOption, setSalonSortOption] = useState("name");
  const [salonMetrics, setSalonMetrics] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Transactions state for selected salon
  const [transactionsData, setTransactionsData] = useState({ items: [], totalCount: 0, totalPages: 1 });
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Receipt Modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  const loadSalonMetrics = async (salonsList) => {
    setLoadingMetrics(true);
    const metricsMap = {};
    try {
      await Promise.all(
        salonsList.map(async (salon) => {
          try {
            const data = await fetchAdminTransactions({ pageNumber: 1, pageSize: 10, salonId: salon.id });
            const items = data.items || [];
            const paidItems = items.filter(t => t.status?.toLowerCase() === "paid");
            const totalRevenue = paidItems.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const successRate = items.length > 0
              ? Math.round((paidItems.length / items.length) * 100)
              : 0;
            metricsMap[salon.id] = {
              txCount: items.length,
              successRate,
              totalRevenue
            };
          } catch (err) {
            console.error(`Failed to load metrics for salon ${salon.id}:`, err);
            metricsMap[salon.id] = { txCount: 0, successRate: 0, totalRevenue: 0 };
          }
        })
      );
      setSalonMetrics(metricsMap);
    } catch (err) {
      console.error("Error aggregating salon metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Load Salons
  const loadSalons = async () => {
    setLoadingSalons(true);
    setSalonsError(null);
    try {
      const response = await fetchAdminSalons({ pageIndex: 1, pageSize: 10 });
      const items = response.items || [];
      setSalons(items);
      loadSalonMetrics(items);
    } catch (err) {
      setSalonsError(err.message || "Failed to load salons list.");
    } finally {
      setLoadingSalons(false);
    }
  };

  useEffect(() => {
    loadSalons();
  }, []);

  // Load Transactions when Selected Salon or Page changes
  const loadTransactions = async () => {
    if (!selectedSalon) return;
    setLoadingTransactions(true);
    setTransactionsError(null);
    try {
      const data = await fetchAdminTransactions({
        pageNumber: currentPage,
        pageSize,
        salonId: selectedSalon.id
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
      setTransactionsError(err.message || "Failed to fetch transactions for selected salon.");
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (selectedSalon) {
      loadTransactions();
    }
  }, [selectedSalon, currentPage, pageSize]);

  // Load booking details and transaction detail when selected transaction changes
  useEffect(() => {
    const loadDetails = async () => {
      if (selectedTransaction?.transactionId) {
        setLoadingBooking(true);
        setBookingDetails(null);
        setTransactionDetails(null);
        try {
          // Fetch transaction detail
          const txDetail = await fetchAdminTransactionById(selectedTransaction.transactionId);
          setTransactionDetails(txDetail);

          // Fetch booking detail if bookingId exists
          const bookingIdToUse = txDetail?.bookingId || selectedTransaction.bookingId;
          if (bookingIdToUse) {
            const data = await fetchBookingById(bookingIdToUse);
            setBookingDetails(data);
          }
        } catch (err) {
          console.error("Error loading details:", err);
        } finally {
          setLoadingBooking(false);
        }
      } else {
        setBookingDetails(null);
        setTransactionDetails(null);
      }
    };

    loadDetails();
  }, [selectedTransaction]);

  // Client side filtering & sorting for salons search
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
    } else if (salonSortOption === "revenue") {
      items.sort((a, b) => {
        const revA = salonMetrics[a.id]?.totalRevenue || 0;
        const revB = salonMetrics[b.id]?.totalRevenue || 0;
        return revB - revA;
      });
    }

    return items;
  }, [salons, salonStatusFilter, salonSearchQuery, salonSortOption, salonMetrics]);

  // Client side transaction search/filtering
  const totalNetworkRevenue = useMemo(() => {
    return Object.values(salonMetrics).reduce((sum, m) => sum + (m.totalRevenue || 0), 0);
  }, [salonMetrics]);

  const totalTxLogs = useMemo(() => {
    return Object.values(salonMetrics).reduce((sum, m) => sum + (m.txCount || 0), 0);
  }, [salonMetrics]);

  const avgSuccessRate = useMemo(() => {
    const values = Object.values(salonMetrics).filter(m => m.txCount > 0);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, m) => acc + (m.successRate || 0), 0);
    return Math.round(sum / values.length);
  }, [salonMetrics]);

  const processedTransactions = useMemo(() => {
    let items = transactionsData.items || [];

    if (statusFilter !== "all") {
      items = items.filter(t => t.status?.toLowerCase() === statusFilter.toLowerCase());
    }

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

  // Determine if server is returning paginated data or a flat array of all records
  const isServerPaginated = useMemo(() => {
    const totalPages = transactionsData.metaData?.totalPages || transactionsData.totalPages || 1;
    const totalCount = transactionsData.metaData?.totalItems || transactionsData.totalCount || transactionsData.items?.length || 0;
    return totalPages > 1;
  }, [transactionsData]);

  // Calculate actual total pages for client-side or server-side pagination
  const totalPages = useMemo(() => {
    if (isServerPaginated) {
      return transactionsData.metaData?.totalPages || transactionsData.totalPages || 1;
    }
    return Math.max(1, Math.ceil(processedTransactions.length / pageSize));
  }, [isServerPaginated, transactionsData, processedTransactions.length, pageSize]);

  // Paginated/Sliced transactions for display
  const displayedTransactions = useMemo(() => {
    if (isServerPaginated) {
      return processedTransactions;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return processedTransactions.slice(startIndex, startIndex + pageSize);
  }, [isServerPaginated, processedTransactions, currentPage, pageSize]);

  // Recalculate metrics for selected salon
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

  const handleBackToSalons = () => {
    setSelectedSalon(null);
    setTransactionsData({ items: [], totalCount: 0, totalPages: 1 });
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("all");
  };

  const renderStatusBadge = (status) => {
    const normStatus = String(status || "").toLowerCase();
    const isVi = language === "vi";
    switch (normStatus) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {isVi ? "Đã thanh toán" : "Paid"}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce"></span>
            {isVi ? "Chờ xử lý" : "Pending"}
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
            {isVi ? "Hết hạn" : "Expired"}
          </span>
        );
      case "canceled":
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            {isVi ? "Đã hủy" : "Canceled"}
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

  const transactionColumns = useMemo(() => {
    return [
      {
        title: t("adminTransactions.orderCode"),
        dataIndex: "orderCode",
        key: "orderCode",
        width: "12%",
        sorter: (a, b) => (a.orderCode || "").localeCompare(b.orderCode || ""),
        render: (value) => <span className="font-mono font-bold text-sm text-[#ea4f93]">#{value || "N/A"}</span>
      },
      {
        title: t("adminTransactions.customerLocation"),
        key: "customer",
        width: "20%",
        sorter: (a, b) => (a.customerName || "").localeCompare(b.customerName || ""),
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
        title: t("adminTransactions.totalPrice"),
        key: "totalPrice",
        width: "12%",
        sorter: (a, b) => {
          const valA = a.booking?.totalPrice != null ? a.booking.totalPrice : a.amount;
          const valB = b.booking?.totalPrice != null ? b.booking.totalPrice : b.amount;
          return (Number(valA) || 0) - (Number(valB) || 0);
        },
        render: (_, tx) => (
          <span className="font-mono font-bold text-[#2d1b35] text-sm">
            {tx.booking?.totalPrice != null ? formatCurrency(tx.booking.totalPrice) : formatCurrency(tx.amount)}
          </span>
        )
      },
      {
        title: t("adminTransactions.depositPaid"),
        key: "depositPaid",
        width: "14%",
        sorter: (a, b) => {
          const valA = a.amountDue != null ? a.amountDue : a.booking?.amountDue;
          const valB = b.amountDue != null ? b.amountDue : b.booking?.amountDue;
          return (Number(valA) || 0) - (Number(valB) || 0);
        },
        render: (_, tx) => (
          <span className="font-mono font-bold text-[#ea4f93] text-sm">
            {tx.amountDue != null ? formatCurrency(tx.amountDue) : (tx.booking?.amountDue != null ? formatCurrency(tx.booking.amountDue) : "-")}
          </span>
        )
      },
      {
        title: language === "vi" ? "Còn lại phải trả" : "Remaining Balance",
        key: "remainingBalance",
        width: "14%",
        sorter: (a, b) => {
          const valA = a.amountPaid != null ? a.amountPaid : a.booking?.amountPaid;
          const valB = b.amountPaid != null ? b.amountPaid : b.booking?.amountPaid;
          return (Number(valA) || 0) - (Number(valB) || 0);
        },
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
        width: "15%",
        sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
        render: (value) => (
          <div className="flex items-center gap-1.5 text-xs text-[#7f6478]">
            <Calendar size={13} className="text-[#a88a9f]" />
            <span className="font-medium">{dayjs(value).format("DD MMM YYYY, HH:mm")}</span>
          </div>
        )
      },
      {
        title: t("adminTransactions.status"),
        dataIndex: "status",
        key: "status",
        width: "10%",
        sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
        render: (status) => renderStatusBadge(status)
      },
      {
        title: language === "vi" ? "Hành động" : "Actions",
        key: "actions",
        width: "3%",
        align: "right",
        render: (_, tx) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(tx);
              setModalVisible(true);
            }}
            title={language === "vi" ? "Xem chi tiết biên lai giao dịch" : "View transaction receipt details"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#7f6478] hover:text-white hover:bg-[#ea4f93] hover:border-[#ea4f93] shadow-xs transition-all duration-300 active:scale-95"
          >
            <Eye size={13} className="stroke-[2]" />
          </button>
        )
      }
    ];
  }, [language, t]);

  return (
    <div className="min-h-[100dvh] p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#ea4f93]/7 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[300px] left-[-100px] -z-10 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#ffa26f]/4 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Page Header */}
        {selectedSalon && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">


            {selectedSalon && (
              <button
                onClick={handleBackToSalons}
                className="flex self-start md:self-auto items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4.5 py-3 text-xs font-bold text-[#2d1b35] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-[#ea4f93]/30 transition-all duration-300 active:scale-[0.98]"
              >
                <ArrowLeft size={13} />
                {t("adminTransactions.backToSalons")}
              </button>
            )}
          </div>)}

        {/* STATE 1: Salon Grid Selection */}
        {!selectedSalon ? (
          <div className="space-y-6">
            {/* Global Network Overview Stats */}
            {salons.length > 0 && (
              <TopMetricsRow
                metrics={[
                  {
                    label: t("adminTransactions.networkSalons"),
                    value: salons.length,
                    icon: Store,
                    color: '#ea4f93', // pink
                  },
                  {
                    label: t("adminTransactions.networkRevenue"),
                    value: loadingMetrics ? <Spin size="small" /> : formatCurrency(totalNetworkRevenue),
                    icon: Wallet,
                    color: '#059669', // emerald
                  },
                  {
                    label: t("adminTransactions.auditedLogs"),
                    value: loadingMetrics ? <Spin size="small" /> : t("adminTransactions.filesCount", { count: totalTxLogs }),
                    icon: CreditCard,
                    color: '#4f46e5', // indigo
                  },
                  {
                    label: t("adminTransactions.avgSuccessRate"),
                    value: loadingMetrics ? <Spin size="small" /> : avgSuccessRate,
                    unit: loadingMetrics ? '' : '%',
                    icon: AlertCircle,
                    color: '#d97706', // amber
                  }
                ]}
                className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              />
            )}

            {/* Salon Search & Filters Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-slate-200/75 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
                <input
                  type="text"
                  placeholder={t("adminTransactions.searchSalons")}
                  value={salonSearchQuery}
                  onChange={(e) => setSalonSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/30 focus:outline-hidden focus:bg-white focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300"
                />
              </div>

              {/* Status pills and Sort drop-down */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Status pills */}
                <div className="relative grid grid-cols-3 items-center gap-1.5 bg-[#fcf9fb] p-1 rounded-xl border border-[#f1e7ed]">
                  {/* Sliding active background */}
                  <div
                    className="
                              absolute
                              top-1
                              bottom-1
                              left-1
                              w-[calc((100%-20px)/3)]
                              rounded-lg
                              bg-[#ea4f93]
                              shadow-[0_3px_10px_rgba(234,79,147,0.18)]
                              pointer-events-none
                              transition-transform
                              duration-300
                              ease-[cubic-bezier(0.4,0,0.2,1)]
                            "
                    style={{
                      transform:
                        salonStatusFilter === "all"
                          ? "translateX(0)"
                          : salonStatusFilter === "open"
                            ? "translateX(calc(100% + 6px))"
                            : "translateX(calc((100% + 6px) * 2))",
                    }}
                  />

                  {[
                    {
                      value: "all",
                      labelVi: "Tất cả",
                      labelEn: "All",
                      icon: ListFilter,
                    },
                    {
                      value: "open",
                      labelVi: "Mở cửa",
                      labelEn: "Open",
                      icon: CircleCheck,
                    },
                    {
                      value: "closed",
                      labelVi: "Đóng cửa",
                      labelEn: "Closed",
                      icon: CircleX,
                    },
                  ].map(({ value, labelVi, labelEn, icon: Icon }) => {
                    const isActive = salonStatusFilter === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSalonStatusFilter(value)}
                        className={`
                                  relative z-10
                                  w-full
                                  inline-flex items-center justify-center gap-1
                                  px-2 py-1
                                  rounded-xl
                                  text-xs font-semibold
                                  whitespace-nowrap
                                  transition-colors duration-200
                                  focus:outline-none
                                  ${isActive
                            ? "text-white"
                            : "text-[#7f6478] hover:text-[#2d1b35]"
                          }`}
                      >
                        <Icon
                          size={14}
                          strokeWidth={2}
                          className={`
                                    transition-all duration-300
                                    ${isActive
                              ? "text-white scale-105"
                              : "text-[#a88a9f] scale-100"
                            }`}
                        />

                        <span>
                          {language === "vi" ? labelVi : labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sort Option dropdown */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Select
                    value={salonSortOption}
                    onChange={(val) => setSalonSortOption(val)}
                    className="w-36 h-10 select-premium-antd"
                    popupClassName="select-premium-dropdown"
                    prefix={
                      <SlidersHorizontal
                        size={15}
                        strokeWidth={2}
                        className="text-[#ea4f93]"
                      />
                    }
                    options={[
                      {
                        value: "name",
                        label: t("adminTransactions.salonName"),
                      },
                      {
                        value: "rating",
                        label: t("adminTransactions.rating"),
                      },
                      {
                        value: "revenue",
                        label: t("adminTransactions.revenue"),
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            {loadingSalons ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white/40 backdrop-blur-xs rounded-3xl border border-slate-200/60 shadow-xs">
                <Spin size="large" />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] animate-pulse">
                  {t("adminTransactions.loadingSalons")}
                </p>
              </div>
            ) : salonsError ? (
              <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                <Alert
                  message={t("adminTransactions.loadSalonsFailed")}
                  description={salonsError}
                  type="warning"
                  showIcon
                  action={
                    <button
                      onClick={loadSalons}
                      className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      {t("adminTransactions.retry")}
                    </button>
                  }
                />
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-200/60 shadow-xs">
                <Store size={36} className="text-[#a88a9f] mb-3 stroke-[1.2]" />
                <h3 className="text-sm font-bold text-[#2d1b35]">
                  {t("adminTransactions.noSalonsFound")}
                </h3>
                <p className="mt-1 text-xs text-[#a88a9f] max-w-[40ch]">
                  {t("adminTransactions.noBranchesMatch")}
                </p>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredSalons.map((salon) => {
                  const salonMetric = salonMetrics[salon.id] || { txCount: 0, successRate: 100, totalRevenue: 0 };
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
                            {language === "vi"
                              ? ({ Open: "Mở cửa", Closed: "Đóng cửa" }[salon.status] || salon.status || "Hoạt động")
                              : (salon.status)
                            }
                          </span>

                          <div className="absolute bottom-3 left-3 bg-[#2d1b35]/70 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                            ★ {salon.rating || "4.8"} ({salon.reviews || "120"} {t("adminTransactions.reviews")})
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
                              <span>{salon.hours || (t("adminTransactions.hoursNotListed"))}</span>
                            </div>
                          </div>

                          {/* Audit Metrics Panel inside Card */}
                          <div className="space-y-3 pt-1">
                            {/* Miniature success rate bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-[#7f6478]">
                                <span>{t("adminTransactions.auditSuccessRate")}</span>
                                <span className="font-mono text-[#ea4f93]">
                                  {isMetricLoading ? (
                                    <Spin size="small" className="scale-75" />
                                  ) : salonMetric.txCount === 0 ? (
                                    "N/A"
                                  ) : (
                                    `${salonMetric.successRate}%`
                                  )}
                                </span>
                              </div>
                              <div className="w-full bg-[#fcf9fb] h-1.5 rounded-full overflow-hidden border border-[#f1e7ed]">
                                <div
                                  className="bg-gradient-to-r from-[#ea4f93] to-[#ffa26f] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${isMetricLoading || salonMetric.txCount === 0 ? 0 : salonMetric.successRate}%` }}
                                />
                              </div>
                            </div>

                            {/* Quick stats columns */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-[#a88a9f] block mb-0.5">
                                  {t("adminTransactions.auditedRev")}
                                </span>
                                <span className="font-mono text-xs font-bold text-[#2d1b35]">
                                  {isMetricLoading ? "..." : formatCurrency(salonMetric.totalRevenue)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-[#a88a9f] block mb-0.5">
                                  {t("adminTransactions.volumeLogs")}
                                </span>
                                <span className="font-mono text-xs font-bold text-[#2d1b35]">
                                  {isMetricLoading ? "..." : (t("adminTransactions.filesCount", { count: salonMetric.txCount }))}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#ea4f93]">
                        <span>{t("adminTransactions.reviewTransactions")}</span>
                        <span className="h-8 w-8 rounded-full bg-[#ea4f93]/10 text-[#ea4f93] flex items-center justify-center group-hover:bg-[#ea4f93] group-hover:text-white transition-colors duration-300 shadow-2xs">
                          →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        ) : (
          /* STATE 2: Transactions list audit for selected Salon */
          <div className="space-y-8">

            {/* Bento Metrics Cards */}
            <TopMetricsRow
              metrics={[
                {
                  label: t("adminTransactions.selectedSalonRevenue"),
                  value: formatCurrency(metrics.totalRevenue),
                  icon: Wallet,
                  color: '#10b981', // emerald
                  note: t("adminTransactions.totalAuditedPaid")
                },
                {
                  label: t("adminTransactions.transactionSuccessRate"),
                  value: metrics.successRate,
                  unit: '%',
                  icon: CreditCard,
                  color: '#6366f1', // indigo
                  note: language === "vi"
                    ? `${metrics.paidCount} trên tổng số ${metrics.totalCount} bản ghi`
                    : `${metrics.paidCount} of ${metrics.totalCount} transaction logs`
                },
                {
                  label: t("adminTransactions.pendingPayments"),
                  value: metrics.pendingCount,
                  icon: Clock3,
                  color: '#f59e0b', // amber
                  note: t("adminTransactions.unsettledRecords")
                }
              ]}
              className="grid gap-6 grid-cols-1 md:grid-cols-3"
            />

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-slate-200/75 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              {/* Search bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
                <input
                  type="text"
                  placeholder={t("adminTransactions.searchTransactions")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/30 focus:outline-hidden focus:bg-white focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300"
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
                <Select
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  className="w-40 h-11 select-premium-antd"
                  popupClassName="select-premium-dropdown"
                  prefix={
                    <ListFilter
                      size={15}
                      strokeWidth={2}
                      className="text-[#ea4f93]"
                    />
                  }
                  options={[
                    {
                      value: "all",
                      label: t("adminTransactions.allStatuses"),
                    },
                    {
                      value: "paid",
                      label: t("adminTransactions.paid"),
                    },
                    {
                      value: "pending",
                      label: t("adminTransactions.pending"),
                    },
                    {
                      value: "expired",
                      label: t("adminTransactions.expired"),
                    },
                    {
                      value: "canceled",
                      label: t("adminTransactions.canceled"),
                    },
                  ]}
                />
              </div>
            </div>

            {/* Transactions Grid/Table */}
            <AnimatePresence mode="wait">
              {loadingTransactions ? (
                <motion.div
                  key="loading-tx"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200/60 shadow-xs"
                >
                  <Spin size="large" />
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] animate-pulse">
                    {t("adminTransactions.loadingLogs")}
                  </p>
                </motion.div>
              ) : transactionsError ? (
                <motion.div
                  key="error-tx"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100"
                >
                  <Alert
                    message={t("adminTransactions.fetchWarning")}
                    description={transactionsError}
                    type="warning"
                    showIcon
                    action={
                      <button
                        onClick={loadTransactions}
                        className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                      >
                        {t("adminTransactions.retry")}
                      </button>
                    }
                  />
                </motion.div>
              ) : processedTransactions.length === 0 ? (
                <motion.div
                  key="empty-tx"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-3xl border border-slate-200/60 shadow-xs"
                >
                  <div className="p-4 rounded-full bg-slate-50 text-[#a88a9f] mb-4">
                    <AlertCircle size={30} className="stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2d1b35]">
                    {t("adminTransactions.noTransactions")}
                  </h3>
                  <p className="mt-1 text-xs text-[#a88a9f] max-w-[40ch] leading-relaxed">
                    {t("adminTransactions.noLogsMatch")}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="table-tx"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="overflow-hidden bg-white rounded-lg border border-slate-200/60 shadow-[0_12px_40px_rgba(0,0,0,0.02)]"
                >
                  <div className="overflow-x-auto">
                    <Table
                      rowKey="transactionId"
                      columns={transactionColumns}
                      dataSource={displayedTransactions}
                      pagination={false}
                      onRow={(record) => ({
                        onClick: () => {
                          setSelectedTransaction(record);
                          setModalVisible(true);
                        },
                        className: "cursor-pointer"
                      })}
                      size="middle"
                      rowClassName="group hover:bg-[#fff9fc]/40 transition-all duration-300 cursor-pointer"
                      className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fff7fb] [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-thead_th]:!text-[#8f7484] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!text-[12px] [&_.ant-table-tbody_.ant-table-row>td]:!border-b [&_.ant-table-tbody_.ant-table-row>td]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row:hover>td]:!bg-[#fff5fb] transition-colors"
                    />
                  </div>

                  {/* Pagination footer */}
                  {processedTransactions.length > 0 && (
                    <div className="flex justify-between items-center px-6 py-4.5 border-t border-slate-100 bg-slate-50/30">
                      <span className="text-xs text-[#a88a9f]">
                        {language === "vi"
                          ? <span>Đang hiển thị <span className="font-bold text-[#2d1b35]">{displayedTransactions.length}</span> / <span className="font-bold text-[#2d1b35]">{transactionsData.metaData?.totalItems || transactionsData.totalCount || processedTransactions.length}</span> mục</span>
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
        )}
      </div>

      {/* Hide scrollbar styles */}
      <style>{`
        .receipt-scroll::-webkit-scrollbar { width: 0; height: 0; }
        .receipt-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* READ-ONLY Receipt Audit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#ea4f93]/10 text-[#ea4f93]">
              <Wallet size={16} className="stroke-[2]" />
            </span>
            <div className="text-left">
              <span className="text-[10px] text-[#a88a9f] font-bold uppercase tracking-wider block leading-none mb-1">
                {language === "vi" ? "Chi tiết Biên lai Kiểm toán" : "Audit Receipt Details"}
              </span>
              <span className="font-mono text-sm font-bold text-[#2d1b35]">
                #{selectedTransaction?.orderCode || "N/A"}
              </span>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
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

              {/* Status and Amount summary */}
              <div className="text-center space-y-2.5 pb-1">
                <div className="flex justify-center items-center gap-2">
                  {renderStatusBadge((transactionDetails || selectedTransaction).status)}
                  {bookingDetails && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${(transactionDetails || selectedTransaction).amount === bookingDetails.amountDue
                      ? "bg-[#fff2f7] text-[#ea4f93] border-[#ea4f93]/20"
                      : (transactionDetails || selectedTransaction).amount === bookingDetails.amountPaid
                        ? "bg-indigo-50 text-indigo-700 border-indigo-500/20"
                        : (transactionDetails || selectedTransaction).amount === bookingDetails.totalPrice
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500/20"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                      {(transactionDetails || selectedTransaction).amount === bookingDetails.amountDue
                        ? (language === "vi" ? "Đặt cọc (Deposit)" : "Deposit")
                        : (transactionDetails || selectedTransaction).amount === bookingDetails.amountPaid
                          ? (language === "vi" ? "Thanh toán còn lại" : "Remaining balance")
                          : (transactionDetails || selectedTransaction).amount === bookingDetails.totalPrice
                            ? (language === "vi" ? "Thanh toán 100%" : "Full payment")
                            : (language === "vi" ? "Thanh toán" : "Payment")}
                    </span>
                  )}
                </div>
                <h2 className="text-4xl font-mono font-bold text-[#2d1b35] tracking-tight">
                  {formatCurrency((transactionDetails || selectedTransaction).amount)}
                </h2>
                <p className="text-xs text-[#a88a9f]">
                  {language === "vi" ? "Mã đơn hàng" : "Order code"} <span className="font-mono font-bold text-[#2d1b35]">#{(transactionDetails || selectedTransaction).orderCode}</span>
                </p>
              </div>

              {/* Thermal Invoice Printout Panel */}
              <div className="bg-[#faf8f5] border border-[#e6decb] p-5 rounded-[1.75rem] shadow-[0_8px_24px_rgba(97,76,60,0.03)] relative overflow-hidden text-[#4a3f35] border-t-4 border-t-[#ea4f93]">
                {/* Torn paper top border */}
                <div className="text-center pb-3.5 border-b border-dashed border-[#e6decb] space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#a88a9f]">
                    {language === "vi" ? "Hóa đơn Nailify" : "Nailify Receipt"}
                  </h3>
                  <div className="font-mono text-[9px] text-[#a88a9f]">
                    {dayjs((transactionDetails || selectedTransaction).createdAt).format("DD MMM YYYY, HH:mm")}
                  </div>
                </div>

                {/* Customer & Salon Details inside Receipt */}
                <div className="py-3.5 space-y-2 border-b border-dashed border-[#e6decb] text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#a88a9f] shrink-0">{language === "vi" ? "Khách hàng" : "Customer"}</span>
                    <span className="font-bold text-[#2d1b35] text-right truncate">{(transactionDetails || selectedTransaction).customerName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#a88a9f] shrink-0">{language === "vi" ? "Chi nhánh" : "Salon"}</span>
                    <span className="font-bold text-[#ea4f93] text-right truncate">{(transactionDetails || selectedTransaction).salonName || "Nailify Salon"}</span>
                  </div>
                  {bookingDetails && (
                    <div className="flex justify-between gap-3 border-t border-dashed border-[#e6decb]/40 pt-2 mt-1.5">
                      <span className="text-[#a88a9f] shrink-0">{language === "vi" ? "Loại thanh toán" : "Payment Type"}</span>
                      <span className="font-bold text-[#2d1b35] text-right">
                        {(transactionDetails || selectedTransaction).amount === bookingDetails.amountDue
                          ? (language === "vi" ? "Đặt cọc (Deposit)" : "Deposit")
                          : (transactionDetails || selectedTransaction).amount === bookingDetails.amountPaid
                            ? (language === "vi" ? "Thanh toán còn lại" : "Remaining balance")
                            : (transactionDetails || selectedTransaction).amount === bookingDetails.totalPrice
                              ? (language === "vi" ? "Thanh toán 100%" : "Full payment")
                              : (language === "vi" ? "Thanh toán đơn hàng" : "Order Payment")}
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
                        <span className="text-[#a88a9f]">
                          {language === "vi" ? "Tạm tính" : "Subtotal"}
                        </span>
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
                            <span className="text-[#a88a9f]">
                              {language === "vi" ? "Giảm giá (Khuyến mãi & Khách thân thiết)" : "Discount (Promo & Loyalty)"}
                            </span>
                            <span className="font-mono text-emerald-600 font-medium">
                              {bookingDetails.discount > 0 ? "-" : ""}{formatCurrency(Math.abs(bookingDetails.discount))}
                            </span>
                          </div>
                        )
                      )}

                      <div className="flex justify-between border-t border-dashed border-[#e6decb] pt-2">
                        <span className="text-[#a88a9f] font-bold">
                          {t("adminTransactions.totalPrice")}
                        </span>
                        <span className="font-mono font-bold text-[#2d1b35]">{formatCurrency(bookingDetails.totalPrice)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#a88a9f]">
                          {language === "vi" ? "Đã trả" : "Amount paid"}
                        </span>
                        <span className="font-mono text-[#ea4f93] font-bold">{formatCurrency(bookingDetails.amountDue)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#a88a9f]">
                          {language === "vi" ? "Còn lại phải trả" : "Remaining balance"}
                        </span>
                        <span className="font-mono text-[#2d1b35] font-semibold">{formatCurrency(bookingDetails.amountPaid)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#a88a9f] italic text-center py-2">
                      {(transactionDetails || selectedTransaction).bookingId
                        ? (language === "vi" ? `Không thể tải chi tiết cho lịch đặt #${(transactionDetails || selectedTransaction).bookingId.slice(0, 8)}` : `Could not load details for booking #${(transactionDetails || selectedTransaction).bookingId.slice(0, 8)}`)
                        : (language === "vi" ? "Không có lịch đặt nào liên kết với giao dịch này." : "No linked booking for this transaction.")}
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
                    {language === "vi" ? "Nailify Inc — Xin Cảm Ơn" : "Nailify Inc — Thank You"}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-2.5 shadow-xs">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#ea4f93]">
                  {language === "vi" ? "Mốc thời gian" : "Timeline"}
                </h4>

                <div className="flex justify-between text-xs">
                  <span className="text-[#a88a9f]">{language === "vi" ? "Khởi tạo" : "Created"}</span>
                  <span className="text-[#2d1b35] font-medium">{dayjs((transactionDetails || selectedTransaction).createdAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                </div>

                {(transactionDetails || selectedTransaction).paidAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a88a9f]">{t("adminTransactions.paid")}</span>
                    <span className="text-[#2fa25f] font-semibold">{dayjs((transactionDetails || selectedTransaction).paidAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                  </div>
                )}

                {(transactionDetails || selectedTransaction).expiresAt && !(transactionDetails || selectedTransaction).paidAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a88a9f]">{language === "vi" ? "Hết hạn" : "Expires"}</span>
                    <span className="text-[#db8520] font-semibold">{dayjs((transactionDetails || selectedTransaction).expiresAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                  </div>
                )}
              </div>

              {/* Policy Notes */}
              <div className="bg-white rounded-2xl p-4 text-xs text-[#7f6478] space-y-1.5 border border-[#f1e7ed]">
                <div className="flex items-center gap-1.5 font-bold text-[#2d1b35]">
                  <AlertCircle size={14} className="text-[#ea4f93]" />
                  <span>
                    {language === "vi" ? "Chính sách Giao dịch Nailify" : "Nailify Transaction Policy"}
                  </span>
                </div>
                <p className="leading-relaxed text-[#7f6478]">
                  {(transactionDetails || selectedTransaction).policy || (language === "vi" ? "Tất cả các khoản thanh toán được xử lý qua cổng PayOS/VietQR của bên thứ ba. Chính sách hoàn tiền đặt cọc tiêu chuẩn áp dụng theo hướng dẫn của chi nhánh Nailify." : "All payments processed via third-party PayOS/VietQR gateways. Standard booking reservation refund policies apply according to Nailify Branch guidelines.")}
                </p>
              </div>

              {/* Read-Only Modal Action Button */}
              <button
                onClick={() => setModalVisible(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition active:scale-[0.98]"
              >
                {language === "vi" ? "Đóng Chi Tiết Kiểm Toán" : "Close Audit Details"}
              </button>

            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
