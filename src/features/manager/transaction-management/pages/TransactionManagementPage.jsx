import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, Modal, message, Select, Spin, Alert } from "antd";
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
  Check
} from "lucide-react";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { fetchTransactions, fetchBookingById } from "../services/transactionService";
import dayjs from "dayjs";
import { RefundConfirmModal } from "../components/RefundConfirmModal";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionsData, setTransactionsData] = useState({ items: [], totalCount: 0, totalPages: 1 });
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
      const data = await fetchTransactions({ pageNumber: currentPage, pageSize });
      
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
  }, [currentPage, pageSize]);

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
    message.success("Payment checkout link copied to clipboard!");
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard!`);
  };

  const handleConfirmRefund = () => {
    message.info("Tính năng đang được hoàn thiện (This feature is under development)");
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
    <div className="min-h-[100dvh] bg-[#fafaf9] p-6 lg:p-8 font-sans relative overflow-hidden">
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
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ea4f93]">Manager Portal</span>
            </div>
            <h1 className="text-3xl font-black text-[#2d1b35] tracking-tight md:text-4xl">
              Transactions History
            </h1>
            <p className="text-xs md:text-sm text-[#a88a9f] max-w-[65ch] leading-relaxed">
              Track and audit all payments processed for customer bookings. Access checkout links and dynamic pay codes.
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="flex self-start md:self-auto items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4.5 py-3 text-xs font-bold text-[#2d1b35] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(234,79,147,0.08)] hover:border-[#ea4f93]/30 transition-all duration-300 active:scale-[0.98]"
          >
            <RefreshCw size={13} className={`${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>

        {/* Bento Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Metric */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#f1e7ed]/60 bg-white/70 backdrop-blur-md p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border-l-4 border-l-emerald-500/80 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_50px_-15px_rgba(234,79,147,0.06)] group">
            <span className="absolute top-4 right-4 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a88a9f]">Total Revenue</span>
            </div>
            <div className="mt-5">
              <span className="text-3xl md:text-4xl font-mono font-bold text-[#2d1b35] tracking-tight">
                {formatCurrency(metrics.totalRevenue)}
              </span>
              <p className="mt-2 text-xs text-[#a88a9f] group-hover:text-[#2d1b35]/70 transition-colors">Calculated from successful transactions</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#f1e7ed]/60 bg-white/70 backdrop-blur-md p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border-l-4 border-l-indigo-500/80 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_50px_-15px_rgba(234,79,147,0.06)] group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a88a9f]">Success Rate</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                <CreditCard size={15} />
              </span>
            </div>
            <div className="mt-5">
              <span className="text-3xl md:text-4xl font-mono font-bold text-[#2d1b35] tracking-tight">
                {metrics.successRate}%
              </span>
              <p className="mt-2 text-xs text-[#a88a9f] group-hover:text-[#2d1b35]/70 transition-colors">
                {metrics.paidCount} of {metrics.totalCount} transactions completed
              </p>
            </div>
          </div>

          {/* Pending Count */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#f1e7ed]/60 bg-white/70 backdrop-blur-md p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border-l-4 border-l-amber-500/80 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_50px_-15px_rgba(234,79,147,0.06)] group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a88a9f]">Pending Payments</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                <Clock3 size={15} />
              </span>
            </div>
            <div className="mt-5">
              <span className="text-3xl md:text-4xl font-mono font-bold text-[#2d1b35] tracking-tight">
                {metrics.pendingCount}
              </span>
              <p className="mt-2 text-xs text-[#a88a9f] group-hover:text-[#2d1b35]/70 transition-colors">Awaiting scan or checkout completion</p>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/75 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
            <input
              type="text"
              placeholder="Search by customer, order code..."
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
            <span className="text-[10px] font-bold text-[#a88a9f] uppercase tracking-wider">Status:</span>
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-40 h-11 select-premium-antd"
              popupClassName="select-premium-dropdown"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "paid", label: "Paid" },
                { value: "pending", label: "Pending" },
                { value: "expired", label: "Expired" },
                { value: "canceled", label: "Canceled" }
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
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] animate-pulse">Loading transactions...</p>
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
                    Retry
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
              <h3 className="text-sm font-bold text-[#2d1b35]">No Transactions Found</h3>
              <p className="mt-1 text-xs text-[#a88a9f] max-w-[40ch] leading-relaxed">
                There are no transaction records matching your current filter settings. Try modifying filters or search query.
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
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75">
                      <th className="px-6 py-4.5 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] w-[12%]">Order Code</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] w-[20%]">Customer & Location</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] w-[12%]">Total Price</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] w-[14%]">Deposit Paid</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] w-[14%]">Remaining Balance</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] w-[15%]">Created At</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] w-[10%]">Status</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] text-right w-[3%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedTransactions.map((tx) => (
                      <motion.tr
                        key={tx.transactionId}
                        variants={fadeInUp}
                        className="group border-l-4 border-l-transparent hover:border-l-[#ea4f93] hover:bg-[#fff9fc]/40 transition-all duration-300 cursor-pointer"
                        onClick={() => {
                          setSelectedTransaction(tx);
                          setDrawerVisible(true);
                        }}
                      >
                        {/* Order Code */}
                        <td className="px-6 py-5.5 font-mono font-bold text-sm text-[#ea4f93]">
                          #{tx.orderCode || "N/A"}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-5.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full font-black text-xs shrink-0 shadow-xs ${getAvatarColor(tx.customerName)}`}>
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
                        </td>

                        {/* Total Price */}
                        <td className="px-6 py-5.5 font-mono font-bold text-[#2d1b35] text-sm">
                          {tx.booking?.totalPrice != null ? formatCurrency(tx.booking.totalPrice) : formatCurrency(tx.amount)}
                        </td>

                        {/* Deposit Paid */}
                        <td className="px-6 py-5.5 font-mono font-bold text-[#ea4f93] text-sm">
                          {tx.amountDue != null ? formatCurrency(tx.amountDue) : (tx.booking?.amountDue != null ? formatCurrency(tx.booking.amountDue) : "-")}
                        </td>

                        {/* Remaining Balance */}
                        <td className="px-6 py-5.5 font-mono font-bold text-[#2fa25f] text-sm">
                          {tx.amountPaid != null ? formatCurrency(tx.amountPaid) : (tx.booking?.amountPaid != null ? formatCurrency(tx.booking.amountPaid) : "-")}
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-5.5 text-xs text-[#7f6478]">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#a88a9f]" />
                            <span className="font-medium">{dayjs(tx.createdAt).format("DD MMM YYYY, HH:mm")}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5.5">
                          {renderStatusBadge(tx.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5.5 text-right" onClick={(e) => e.stopPropagation()}>
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
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {transactionsData.totalPages > 1 && (
                <div className="flex justify-between items-center px-6 py-4.5 border-t border-slate-100 bg-slate-50/30">
                  <span className="text-xs text-[#a88a9f]">
                    Showing <span className="font-bold text-[#2d1b35]">{processedTransactions.length}</span> items
                  </span>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={transactionsData.totalPages}
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
              <span className="text-[10px] text-[#a88a9f] font-bold uppercase tracking-wider block leading-none mb-1">Receipt Detail</span>
              <span className="font-mono text-sm font-black text-[#2d1b35]">
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                      selectedTransaction.amount === bookingDetails.amountDue
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
                <h2 className="text-4xl font-mono font-black text-[#2d1b35] tracking-tight">
                  {formatCurrency(selectedTransaction.amount)}
                </h2>
                <p className="text-xs text-[#a88a9f]">
                  Order code <span className="font-mono font-bold text-[#2d1b35]">#{selectedTransaction.orderCode}</span>
                </p>
              </div>

              {/* Thermal Invoice Printout Panel */}
              <div className="bg-[#faf8f5] border border-[#e6decb] p-5 rounded-[1.75rem] shadow-[0_8px_24px_rgba(97,76,60,0.03)] relative overflow-hidden text-[#4a3f35] border-t-4 border-t-[#ea4f93]">
                {/* Dashed edge header */}
                <div className="text-center pb-3.5 border-b border-dashed border-[#e6decb] space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#a88a9f]">Nailify Receipt</h3>
                  <div className="font-mono text-[9px] text-[#a88a9f]">
                    {dayjs(selectedTransaction.createdAt).format("DD MMM YYYY, HH:mm")}
                  </div>
                </div>

                {/* Customer & Salon Details inside Receipt */}
                <div className="py-3.5 space-y-2 border-b border-dashed border-[#e6decb] text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#a88a9f] shrink-0">Customer</span>
                    <span className="font-bold text-[#2d1b35] text-right truncate">{selectedTransaction.customerName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#a88a9f] shrink-0">Salon</span>
                    <span className="font-bold text-[#ea4f93] text-right truncate">{selectedTransaction.salonName || "Nailify Salon"}</span>
                  </div>
                  {bookingDetails && (
                    <div className="flex justify-between gap-3 border-t border-dashed border-[#e6decb]/40 pt-2 mt-1.5">
                      <span className="text-[#a88a9f] shrink-0">Loại thanh toán</span>
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
                            <span className="text-[#a88a9f]">Discount (Promo & Loyalty)</span>
                            <span className="font-mono text-emerald-600 font-medium">
                              {bookingDetails.discount > 0 ? "-" : ""}{formatCurrency(Math.abs(bookingDetails.discount))}
                            </span>
                          </div>
                        )
                      )}

                      <div className="flex justify-between border-t border-dashed border-[#e6decb] pt-2">
                        <span className="text-[#a88a9f] font-bold">Total Price</span>
                        <span className="font-mono font-bold text-[#2d1b35]">{formatCurrency(bookingDetails.totalPrice)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#a88a9f]">Deposit paid</span>
                        <span className="font-mono text-[#ea4f93] font-bold">{formatCurrency(bookingDetails.amountDue)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#a88a9f]">Remaining balance</span>
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
                    Nailify Inc — Thank You
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-2.5 shadow-xs">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#ea4f93]">Timeline</h4>

                <div className="flex justify-between text-xs">
                  <span className="text-[#a88a9f]">Created</span>
                  <span className="text-[#2d1b35] font-medium">{dayjs(selectedTransaction.createdAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                </div>

                {selectedTransaction.paidAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a88a9f]">Paid</span>
                    <span className="text-[#2fa25f] font-semibold">{dayjs(selectedTransaction.paidAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                  </div>
                )}

                {selectedTransaction.expiresAt && !selectedTransaction.paidAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a88a9f]">Expires</span>
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
                    <h4 className="text-sm font-bold text-[#2d1b35]">Awaiting Payment Scan</h4>
                    <p className="text-xs text-[#a88a9f] mt-1 leading-relaxed">
                      Scan this VietQR at the checkout desk, or use the payment link below.
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
                      Copy Checkout Link
                    </button>

                    {selectedTransaction.checkoutUrl && (
                      <a
                        href={selectedTransaction.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-xl bg-[#ea4f93] hover:bg-[#db4386] text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
                      >
                        <ExternalLink size={13} />
                        Go to Checkout Portal
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Policy Notes */}
              <div className="bg-white rounded-2xl p-4 text-xs text-[#7f6478] space-y-1.5 border border-[#f1e7ed]">
                <div className="flex items-center gap-1.5 font-bold text-[#2d1b35]">
                  <AlertCircle size={14} className="text-[#ea4f93]" />
                  <span>Nailify Transaction Policy</span>
                </div>
                <p className="leading-relaxed text-[#7f6478]">
                  {selectedTransaction.policy || "All payments processed via third-party PayOS/VietQR gateways. Standard booking reservation refund policies apply according to Nailify Branch guidelines."}
                </p>
              </div>

              {/* Close Modal Footer */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDrawerVisible(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition active:scale-[0.98]"
                >
                  Close Receipt
                </button>
                {selectedTransaction.status?.toLowerCase() === "paid" && (
                  <button
                    onClick={() => setRefundConfirmVisible(true)}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-600 rounded-xl transition active:scale-[0.98]"
                  >
                    Refund Payment
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