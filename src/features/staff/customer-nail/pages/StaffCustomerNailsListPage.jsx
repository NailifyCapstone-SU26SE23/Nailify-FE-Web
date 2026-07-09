import { Spin, Alert, Pagination, ConfigProvider } from "antd";
import { Palette, CheckCircle2, XCircle, RefreshCw, Sparkles, Clock3, Eye, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStaffArtistId } from "../../bookings/services/staffBookingService";
import { fetchCustomerNailRequests, fetchStaffCustomerNailRequests } from "../../../manager/customer-nail/services/customerNailsService";

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[18px] border border-[#f8deea] bg-white p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] ${className}`}
    >
      {children}
    </article>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

function getStatusTone(status) {
  switch (status) {
    case "Approved":
    case "Reviewed":
    case "Quoted":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Rejected":
      return "bg-[#ffe6ec] text-[#e1447f]";
    case "Pending":
    case "PendingReview":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Assigned":
      return "bg-[#e0f2fe] text-[#0369a1]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatVND(amount) {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDuration(duration) {
  if (!duration) return "N/A";
  return `${duration} mins`;
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

function RequestCard({ request }) {
  const nail = request.customerNail || request;
  const initials = nail.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "CN";
  const statusLabel = request.status || nail.status || "Assigned";

  // Deterministic skill requirements based on design metadata for thesis mapping
  const skillReqs = {
    A: ((nail.nailShapeId || 1) % 3) + 2, // Nail Shape Level
    B: ((nail.nailSurfaceId || 1) % 3) + 2, // Coating/Finish Level
    C: Math.min(5, Math.max(1, ((nail.customerNailComponents || nail.nailComponents || []).length % 3) + 2)), // Accessory Complexity
    D: Math.min(5, Math.max(1, ((nail.nailShapeId || 1) + (nail.nailSurfaceId || 1)) % 3 + 2)) // Detail Art Level
  };

  return (
    <div className="group rounded-[24px] border border-[#f5cee1] bg-gradient-to-b from-white to-[#fff9fb] p-5 shadow-[0_10px_28px_rgba(236,72,153,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#ea4f93] hover:shadow-[0_20px_40px_rgba(236,72,153,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {nail.imageUrl ? (
            <img crossOrigin="anonymous"
              src={nail.imageUrl}
              alt={nail.name}
              className="h-16 w-16 rounded-[18px] border-4 border-white object-cover shadow-[0_12px_24px_rgba(236,72,153,0.08)] transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#ff9ac2] via-[#ea4f93] to-[#c63d79] text-sm font-bold text-white shadow-[0_10px_20px_rgba(234,79,147,0.18)]">
              {initials}
            </div>
          )}
          <div>
            <h4 className="text-base font-extrabold text-[#3f2240] transition group-hover:text-[#ea4f93]">
              {nail.name || "Untitled Design"}
            </h4>
            <p className="mt-1 text-xs font-semibold text-[#c08aa4]">
              {nail.nailShape?.name || "Custom Shape"} • {nail.nailSurface?.name || "Custom Surface"}
            </p>
          </div>
        </div>
      </div>

      {/* Skill Mapping Requirements */}
      <div className="mt-4 rounded-xl bg-[#fff0f6]/60 border border-[#fbdde9] p-2.5">
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#b87c9b] mb-1.5 flex items-center gap-1">
          <Sparkles size={10} className="text-[#ea4f93]" />
          Skill Requirements (Complexity A-D)
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 border border-[#fce7f3] text-[10px]">
            <span className="font-bold text-[#b87c9b]">Shape (A):</span>
            <span className="font-black text-[#ea4f93]">{skillReqs.A}★</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 border border-[#fce7f3] text-[10px]">
            <span className="font-bold text-[#b87c9b]">Coating (B):</span>
            <span className="font-black text-[#ea4f93]">{skillReqs.B}★</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 border border-[#fce7f3] text-[10px]">
            <span className="font-bold text-[#b87c9b]">Accessory (C):</span>
            <span className="font-black text-[#ea4f93]">{skillReqs.C}★</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 border border-[#fce7f3] text-[10px]">
            <span className="font-bold text-[#b87c9b]">Art (D):</span>
            <span className="font-black text-[#ea4f93]">{skillReqs.D}★</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-[16px] border border-[#f5cee1] bg-white/70 p-2.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">Estimate Price</p>
          <p className="mt-0.5 text-xs font-bold text-[#ea4f93]">{formatVND(request.price || nail.price)}</p>
        </div>
        <div className="rounded-[16px] border border-[#f5cee1] bg-white/70 p-2.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">Duration</p>
          <p className="mt-0.5 text-xs font-bold text-[#3f2240]">{formatDuration(request.duration || nail.duration)}</p>
        </div>
        <div className="rounded-[16px] border border-[#f5cee1] bg-white/70 p-2.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#c08aa4]">Assigned</p>
          <p className="mt-0.5 text-[10px] font-bold text-[#3f2240] truncate">
            {formatDate(request.createdAt || nail.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#fdebf3] pt-3.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${getStatusTone(statusLabel)}`}>
          {statusLabel === "Approved" || statusLabel === "Reviewed" || statusLabel === "Quoted" ? (
            <CheckCircle2 size={11} />
          ) : statusLabel === "Rejected" ? (
            <XCircle size={11} />
          ) : (
            <Clock3 size={11} />
          )}
          {statusLabel}
        </span>

        <span className="flex items-center gap-1 text-[11px] font-bold text-[#ea4f93] transition-all group-hover:gap-1.5">
          {statusLabel === "Assigned" ? "Start Review" : "View Review"}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}

export function StaffCustomerNailsListPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const staffArtistId = useMemo(() => {
    try {
      return getStaffArtistId();
    } catch {
      return null;
    }
  }, []);

  const loadRequests = useCallback(async (options = {}) => {
    if (!staffArtistId) {
      setError("Please log in as a Staff Artist to view assigned reviews.");
      setIsLoading(false);
      return;
    }
    const { silent = false } = options;
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");

      // Fetch requests specifically assigned to this staff artist
      const data = await fetchStaffCustomerNailRequests(staffArtistId);
      setRequests(data || []);
    } catch (err) {
      console.error("Failed to load custom nail requests:", err);
      setError(err.message || "Failed to load custom nail requests.");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [staffArtistId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Auto refresh
  useEffect(() => {
    if (!staffArtistId) return undefined;
    const intervalId = window.setInterval(() => {
      loadRequests({ silent: true });
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadRequests, staffArtistId]);

  // Calculate paginated requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return requests.slice(startIndex, startIndex + itemsPerPage);
  }, [requests, currentPage]);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "Assigned").length;
    const reviewed = requests.filter((r) => r.status === "Reviewed" || r.status === "Quoted").length;
    const approved = requests.filter((r) => r.status === "Approved").length;

    return [
      {
        title: "Total Assigned",
        value: total,
        note: "All tasks assigned to you",
        icon: Sparkles,
        toneClassName: "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]",
      },
      {
        title: "Pending Review",
        value: pending,
        note: "Needs your quote/estimation",
        icon: Clock3,
        toneClassName: "bg-gradient-to-br from-[#f5b455] to-[#db8520]",
      },
      {
        title: "Reviewed / Quoted",
        value: reviewed,
        note: "Estimate submitted to manager",
        icon: Eye,
        toneClassName: "bg-gradient-to-br from-[#7c8cff] to-[#4755b8]",
      },
      {
        title: "Approved / Completed",
        value: approved,
        note: "Approved by manager & customer",
        icon: CheckCircle2,
        toneClassName: "bg-gradient-to-br from-[#5dd18d] to-[#2fa25f]",
      },
    ];
  }, [requests]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!staffArtistId) {
    return (
      <div className="p-6">
        <Alert
          message="Authentication Required"
          description="You must be logged in as a Staff Artist to access the review board."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Custom Reviews"
          description={error}
          type="error"
          showIcon
          action={
            <button
              onClick={() => loadRequests()}
              className="text-xs font-semibold text-[#ea4f93] hover:underline"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" tip="Loading assigned design requests..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#ea4f93",
          borderRadius: 16,
        },
      }}
    >
      <div className="flex min-h-full flex-col gap-5 p-1">
        {/* Header Hero */}
        <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,#fff0f8_0%,#fffafb_52%,#fff5fb_100%)] p-0 shadow-[0_18px_36px_rgba(236,72,153,0.12)]">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_10px_22px_rgba(234,79,147,0.28)]">
                  <Palette size={22} />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-[#402542]">Custom Review Requests</h2>
                  <p className="text-sm text-[#b07a94]">Review customer designs, formulate pricing estimates, and draft quotes.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${isRefreshing
                ? "bg-white text-[#ea4f93] shadow-[0_8px_18px_rgba(234,79,147,0.12)]"
                : "bg-white/80 text-[#9b7b8f]"
                }`}>
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Refreshing..." : "Auto refresh active"}
              </div>
            </div>
          </div>
          <div className="grid gap-4 border-t border-white/70 bg-white/45 p-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.title} {...item} />
            ))}
          </div>
        </Card>

        {/* Request Grid */}
        <Card className="p-0">
          <div className="border-b border-[#f6dce7] p-6">
            <SectionHeading
              title="Assigned Workboard"
              subtitle={`${requests.length} designs assigned to you for valuation.`}
            />
          </div>

          <div className="p-6">
            {requests.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#f2c7da] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] py-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f8]">
                  <Palette size={32} className="text-[#ea4f93]" />
                </div>
                <p className="text-sm text-[#c08aa4]">You don't have any custom review requests assigned yet.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedRequests.map((request) => (
                    <Link
                      key={request.customerNailRequestId || request.customerNailId || request.id}
                      to={`/staff/customer-nails/${request.customerNailRequestId || request.customerNailId || request.id}`}
                      className="block"
                    >
                      <RequestCard request={request} />
                    </Link>
                  ))}
                </div>
                {requests.length > itemsPerPage && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      current={currentPage}
                      pageSize={itemsPerPage}
                      total={requests.length}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper={false}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}

