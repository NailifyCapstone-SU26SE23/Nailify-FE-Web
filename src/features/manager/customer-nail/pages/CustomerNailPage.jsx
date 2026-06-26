import { Spin, Alert, DatePicker, Pagination, ConfigProvider, Modal } from "antd";
import { Palette, Heart, Eye, Calendar, CheckCircle2, XCircle, RefreshCw, Sparkles, Clock3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchCustomerNails } from "../services/customerNailsService";

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[18px] border border-[#f8deea] bg-white p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

function getStatusTone(status) {
  switch (status) {
    case "Approved":
    case "Reviewed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Rejected":
      return "bg-[#ffe6ec] text-[#e1447f]";
    case "Pending":
    case "PendingReview":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Draft":
      return "bg-[#f3f4f6] text-[#6b7280]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatVND(amount, status) {
  if (amount === null || amount === undefined || amount === 0) {
    if (status === "PendingReview" || status === "Assigned") {
      return "Pending Quote";
    }
    return "0 ₫";
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function formatDuration(duration, status) {
  if (duration === null || duration === undefined || duration === "" || duration === 0) {
    if (status === "PendingReview" || status === "Assigned") {
      return "Pending Quote";
    }
    return "0 mins";
  }
  return `${duration} mins`;
}

function getCardColorStyle(customColor) {
  if (!customColor) return { backgroundColor: '#fdf2f8' };
  try {
    const parsed = typeof customColor === 'string' ? JSON.parse(customColor) : customColor;
    if (parsed.mode === 'solid' && parsed.color) {
      return { backgroundColor: parsed.color };
    }
    if (parsed.mode === 'gradient' && Array.isArray(parsed.gradient)) {
      return { background: `linear-gradient(to bottom, ${parsed.gradient.join(', ')})` };
    }
    if (parsed.mode === 'perFinger' && Array.isArray(parsed.fingers)) {
      const colors = parsed.fingers.map(f => f.color).filter(Boolean);
      if (colors.length > 0) {
        if (colors.length === 1) return { backgroundColor: colors[0] };
        return { background: `linear-gradient(to right, ${colors.slice(0, 3).join(', ')})` };
      }
    }
  } catch (e) { }
  return { backgroundColor: '#fdf2f8' };
}

function StatCard({ title, value, note, icon: Icon, toneClassName }) {
  return (
    <div className="rounded-[22px] border border-[#f6dce7] bg-white/90 p-4 shadow-[0_10px_24px_rgba(236,72,153,0.06)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#402542]">{value}</p>
          <p className="mt-1 text-xs text-[#a07c90]">{note}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_8px_18px_rgba(236,72,153,0.16)] ${toneClassName}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  note: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  toneClassName: PropTypes.string.isRequired,
};

function CustomerNailCard({ nail }) {
  const initials = nail.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "CN";
  const isPreset = nail.basedOnNailVariantId !== null;
  const cardColorStyle = getCardColorStyle(nail.customColor);

  const maskStyle = nail.nailShape?.imageUrl ? {
    maskImage: `url(${nail.nailShape.imageUrl})`,
    WebkitMaskImage: `url(${nail.nailShape.imageUrl})`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  } : {};

  return (
    <div className="group rounded-[24px] border border-[#f8deea] bg-[linear-gradient(180deg,#fffafb_0%,#fff6fa_100%)] p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(236,72,153,0.14)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-12 shrink-0 rounded-t-[14px] rounded-b-[4px] border border-[#f4c1d8] bg-white shadow-[0_6px_14px_rgba(236,72,153,0.05)] overflow-hidden flex items-center justify-center">
            {nail.imageUrl ? (
              <img
                src={nail.imageUrl}
                alt={nail.name}
                className="h-full w-full object-cover pointer-events-none"
              />
            ) : nail.nailShape?.imageUrl ? (
              <>
                <div className="absolute inset-0 w-full h-full" style={{ ...maskStyle, ...cardColorStyle }} />
                <img
                  src={nail.nailShape.imageUrl}
                  alt={nail.name}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80 pointer-events-none"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-[10px] font-bold text-white uppercase">
                {initials}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-base font-extrabold text-[#3f2240] transition group-hover:text-[#ea4f93]">{nail.name || "Untitled Design"}</h4>
            <p className="mt-1 text-xs text-[#c08aa4]">
              {nail.nailShape?.name || "Custom Shape"} • {nail.nailSurface?.name || "Custom Surface"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nail.isFavorite && <Heart size={16} className="text-[#ea4f93] fill-[#ea4f93]" />}
          {nail.isPublic && <Eye size={16} className="text-[#6b7280]" />}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-[16px] border border-[#f4c7da] bg-white/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Price</p>
          <p className="text-sm font-semibold text-[#ea4f93]">{formatVND(nail.price, nail.status)}</p>
        </div>
        <div className="rounded-[16px] border border-[#f4c7da] bg-white/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Duration</p>
          <p className="text-sm font-semibold text-[#3f2240]">{formatDuration(nail.duration, nail.status)}</p>
        </div>
        <div className="rounded-[16px] border border-[#f4c7da] bg-white/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Created</p>
          <p className="text-sm font-semibold text-[#3f2240]">
            {formatDate(nail.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${getStatusTone(nail.status)}`}>
          {nail.status === "Approved" ? <CheckCircle2 size={12} /> : nail.status === "Rejected" ? <XCircle size={12} /> : <Calendar size={12} />}
          {nail.status || "Draft"}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${isPreset ? "bg-[#e7ecff] text-[#4755b8]" : "bg-[#fef3c7] text-[#d97706]"}`}>
          {isPreset ? "Preset" : "Custom Design"}
        </span>
        {nail.rejectReason && (
          <p className="text-[10px] text-[#e1447f] font-medium">Rejected: {nail.rejectReason}</p>
        )}
      </div>
    </div>
  );
}

CustomerNailCard.propTypes = {
  nail: PropTypes.shape({
    customerNailId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    imageUrl: PropTypes.string,
    price: PropTypes.number,
    duration: PropTypes.number,
    createdAt: PropTypes.string,
    status: PropTypes.string,
    isFavorite: PropTypes.bool,
    isPublic: PropTypes.bool,
    rejectReason: PropTypes.string,
    nailShape: PropTypes.shape({ name: PropTypes.string }),
    nailSurface: PropTypes.shape({ name: PropTypes.string }),
  }).isRequired,
};

export function CustomerNailPage() {
  const navigate = useNavigate();
  const [nails, setNails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPendingReviewModalOpen, setIsPendingReviewModalOpen] = useState(false);
  const [pendingReviewModalNail, setPendingReviewModalNail] = useState(null);
  const itemsPerPage = 6; // 3 per row, 2 rows max

  const seenPendingReviewIdsRef = useRef(new Set());
  const hasInitializedPendingReviewRef = useRef(false);
  const modalTimerRef = useRef(null);

  const normalizeStatusKey = useCallback((status) => {
    return String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "");
  }, []);

  const isPendingReviewStatus = useCallback((status) => {
    return normalizeStatusKey(status) === "pendingreview";
  }, [normalizeStatusKey]);

  const openPendingReviewModal = useCallback((nail) => {
    setPendingReviewModalNail(nail);
    setIsPendingReviewModalOpen(true);

    if (modalTimerRef.current) {
      window.clearTimeout(modalTimerRef.current);
    }

    modalTimerRef.current = window.setTimeout(() => {
      setIsPendingReviewModalOpen(false);
    }, 3000);
  }, []);

  const loadCustomerNails = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");
      const data = await fetchCustomerNails();
      const nextNails = data || [];
      setNails(nextNails);

      const pendingNails = nextNails.filter((item) => isPendingReviewStatus(item?.status));
      const pendingIds = pendingNails
        .map((item) => String(item?.customerNailId || item?.id || "").trim())
        .filter(Boolean);

      if (!hasInitializedPendingReviewRef.current) {
        pendingIds.forEach((id) => seenPendingReviewIdsRef.current.add(id));
        hasInitializedPendingReviewRef.current = true;
        return;
      }

      pendingNails.forEach((item) => {
        const id = String(item?.customerNailId || item?.id || "").trim();
        if (!id) return;
        if (seenPendingReviewIdsRef.current.has(id)) return;

        seenPendingReviewIdsRef.current.add(id);
        openPendingReviewModal(item);
      });
    } catch (err) {
      console.error("Failed to load customer nails:", err);
      setError(err.message || "Failed to load customer nails.");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [isPendingReviewStatus, openPendingReviewModal]);

  useEffect(() => {
    Promise.resolve().then(() => loadCustomerNails());
  }, [loadCustomerNails]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadCustomerNails({ silent: true });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [loadCustomerNails]);

  useEffect(() => {
    return () => {
      if (modalTimerRef.current) {
        window.clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  // Filter nails by date
  const filteredNails = useMemo(() => {
    if (!selectedDate) {
      return nails;
    }

    return nails.filter(nail => {
      if (!nail.createdAt) return false;
      const nailDate = dayjs(nail.createdAt);
      return nailDate.isSame(selectedDate, "day");
    });
  }, [nails, selectedDate]);

  // Calculate paginated nails
  const paginatedNails = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNails.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNails, currentPage]);

  const summaryStats = useMemo(() => {
    const pendingReviewCount = nails.filter((nail) => isPendingReviewStatus(nail.status)).length;
    const approvedCount = nails.filter((nail) => nail.status === "Approved").length;
    const reviewedCount = nails.filter((nail) => nail.status === "Reviewed").length;
    const rejectedCount = nails.filter((nail) => nail.status === "Rejected").length;

    return [
      {
        title: "Total Designs",
        value: nails.length,
        note: "all customer requests",
        icon: Sparkles,
        toneClassName: "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]",
      },
      {
        title: "Pending Review",
        value: pendingReviewCount,
        note: "needs manager attention",
        icon: Clock3,
        toneClassName: "bg-gradient-to-br from-[#f5b455] to-[#db8520]",
      },
      {
        title: "Reviewed",
        value: reviewedCount,
        note: "waiting for final action",
        icon: Calendar,
        toneClassName: "bg-gradient-to-br from-[#7c8cff] to-[#4755b8]",
      },
      {
        title: "Approved",
        value: approvedCount,
        note: "confirmed by manager",
        icon: CheckCircle2,
        toneClassName: "bg-gradient-to-br from-[#5dd18d] to-[#2fa25f]",
      },
      {
        title: "Rejected",
        value: rejectedCount,
        note: "sent back with feedback",
        icon: XCircle,
        toneClassName: "bg-gradient-to-br from-[#f089ad] to-[#e1447f]",
      },
    ];
  }, [isPendingReviewStatus, nails]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCurrentPage(1); // Reset page when date changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of the grid when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="min-h-full">
        <Alert
          message="Error Loading Customer Nails"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spin size="large" tip="Loading customer nails..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ea4f93',
          borderRadius: 16,
        },
      }}
    >
      <div className="flex min-h-full flex-col gap-5">
        <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,#fff0f8_0%,#fffafb_52%,#fff5fb_100%)] p-0 shadow-[0_18px_36px_rgba(236,72,153,0.12)]">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_10px_22px_rgba(234,79,147,0.28)]">
                  <Palette size={22} />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-[#402542]">Customer Nails</h2>
                  <p className="text-sm text-[#b07a94]">Manage customer nail designs and monitor new requests in real time.</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#8f6b80]">
                The page refreshes automatically every 3 seconds so managers can catch new custom design submissions as soon as they arrive.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${isRefreshing
                ? "bg-white text-[#ea4f93] shadow-[0_8px_18px_rgba(234,79,147,0.12)]"
                : "bg-white/80 text-[#9b7b8f]"
                }`}>
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Refreshing..." : "Auto refresh every 3s"}
              </div>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                placeholder="Select date"
                allowClear
                className="h-11 min-w-[220px] rounded-full border border-[#f5d0e4] bg-white/90 text-xs text-[#5c4158] outline-none transition placeholder:text-[#d198b0] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/20"
                suffixIcon={<Calendar size={16} className="text-[#c08aa4]" />}
              />
            </div>
          </div>
          <div className="grid gap-4 border-t border-white/70 bg-white/45 p-6 sm:grid-cols-2 xl:grid-cols-5">
            {summaryStats.map((item) => (
              <StatCard key={item.title} {...item} />
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-[#f6dce7] p-6">
            <SectionHeading
              title="All Customer Nails"
              subtitle={`${filteredNails.length} designs${selectedDate ? " (filtered by selected date)" : " available in the current salon workspace"}`}
            />
          </div>

          <div className="p-6">
            {filteredNails.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#f2c7da] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] py-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f8]">
                  <Palette size={32} className="text-[#ea4f93]" />
                </div>
                <p className="text-sm text-[#c08aa4]">
                  {selectedDate ? "No customer nails found for selected date" : "No customer nails found"}
                </p>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="mt-4 rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-6 py-2.5 text-xs font-bold text-[#ea4f93] hover:bg-[#fff0f8]"
                  >
                    Clear date filter
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedNails.map((nail) => (
                    <Link
                      key={nail.customerNailRequestId || nail.customerNailId || nail.id}
                      to={`${ROUTES.managerCustomerNails}/${nail.customerNailRequestId || nail.customerNailId || nail.id}`}
                      className="block"
                    >
                      <CustomerNailCard nail={nail} />
                    </Link>
                  ))}
                </div>
                {filteredNails.length > itemsPerPage && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      current={currentPage}
                      pageSize={itemsPerPage}
                      total={filteredNails.length}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper={false}
                      showTotal={(total) => `Total ${total} items`}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Modal
          open={isPendingReviewModalOpen}
          footer={null}
          closable={false}
          centered
          destroyOnClose
          onCancel={() => setIsPendingReviewModalOpen(false)}
          styles={{
            content: { padding: 0, borderRadius: 28, overflow: "hidden", maxWidth: 460 },
            body: { padding: 0 },
            mask: { backdropFilter: "blur(8px)", background: "rgba(64, 37, 66, 0.28)" },
          }}
        >
          <div className="bg-[linear-gradient(135deg,#fff0f8_0%,#ffeaf4_100%)] px-6 pb-10 pt-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_12px_24px_rgba(234,79,147,0.28)]">
              <Sparkles size={24} />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-xl font-extrabold text-[#402542]">New Pending Review Request</h3>
              <p className="mt-2 text-sm text-[#a46a87]">
                A new customer nail request needs manager attention.
              </p>
            </div>
          </div>
          <div className="-mt-6 rounded-[28px] bg-white px-6 pb-6 pt-6">
            <div className="rounded-[22px] border border-[#f5d4e3] bg-[linear-gradient(180deg,#fffafb_0%,#fff6fa_100%)] p-5 text-center shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Design Name</p>
              <p className="mt-2 text-lg font-extrabold text-[#3f2240]">
                {pendingReviewModalNail?.name || "Untitled Design"}
              </p>
              <p className="mt-2 text-sm text-[#8d6d80]">
                This modal closes automatically in about 3 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const id = pendingReviewModalNail?.customerNailRequestId || pendingReviewModalNail?.customerNailId || pendingReviewModalNail?.id;
                setIsPendingReviewModalOpen(false);
                if (id) {
                  navigate(`${ROUTES.managerCustomerNails}/${id}`);
                }
              }}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#ea4f93] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.18)] transition hover:bg-[#df4588]"
            >
              Open Request
            </button>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
