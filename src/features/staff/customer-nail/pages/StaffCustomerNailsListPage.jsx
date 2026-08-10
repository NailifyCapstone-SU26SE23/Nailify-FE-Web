import { Spin, Alert, Pagination, ConfigProvider } from "antd";
import { Palette, CheckCircle2, XCircle, RefreshCw, Sparkles, Clock3, Eye, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStaffArtistId } from "../../bookings/services/staffBookingService";
import { fetchCustomerNailRequests, fetchStaffCustomerNailRequests } from "../../../manager/customer-nail/services/customerNailsService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

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

function RequestCard({ request, language }) {
  const nail = request.customerNail || request;
  const initials = nail.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "CN";
  const statusLabel = request.status || nail.status || "Assigned";

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white border border-[#fdf7f9] shadow-[0_10px_35px_rgba(236,72,153,0.05)] transition-all duration-500 hover:-translate-y-1 hover:rotate-1 hover:shadow-[0_20px_50px_rgba(236,72,153,0.15)]">
      {/* 🎨 TOP: Large Nail Preview */}
      <div className="relative h-[220px] w-full overflow-hidden bg-gradient-to-b from-[#fffbfd] to-[#fff5f9] perspective-1000">
        <div className="absolute -bottom-4 left-1/2 h-6 w-[70%] -translate-x-1/2 rounded-full bg-pink-200/50 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {nail.imageUrl ? (
          <img crossOrigin="anonymous"
            src={nail.imageUrl}
            alt={nail.name}
            className="pointer-events-none h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:-rotate-2"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d4af37] to-[#c5a059] text-4xl font-serif text-white shadow-inner">
            {initials}
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5 z-10">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold shadow-sm backdrop-blur-md bg-white/90 ${getStatusTone(statusLabel)}`}>
            {statusLabel === "Approved" || statusLabel === "Reviewed" || statusLabel === "Quoted" ? (
              <CheckCircle2 size={10} />
            ) : statusLabel === "Rejected" ? (
              <XCircle size={10} />
            ) : (
              <Clock3 size={10} />
            )}
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col p-5">
        <h4 className="line-clamp-1 text-lg font-serif font-bold text-[#3f2240] transition-colors duration-300 group-hover:text-[#ea4f93]">
          {nail.name || "Untitled Design"}
        </h4>
        <p className="mt-0.5 text-[11px] font-medium text-[#a988a0]">
          {nail.nailShape?.name || "Custom Shape"} • {nail.nailSurface?.name || "Custom Surface"}
        </p>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-[#fff0f6] border border-[#fbcfe8] p-2.5">
          <span className="text-[10px] font-bold text-[#c08aa4]">{language === "vi" ? "Thành phần tùy chỉnh" : "Custom Components"}</span>
          <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-extrabold text-[#ea4f93] shadow-2xs">
            {(nail.customerNailComponents || nail.nailComponents || []).length} {language === "vi" ? "Phụ kiện" : "Add-ons"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#fdf0f5] pt-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#c08aa4]">{language === "vi" ? "Giá ước tính" : "Est. Price"}</p>
            <p className="mt-0.5 text-xs font-bold text-[#d4af37]">{formatVND(request.price || nail.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#c08aa4]">{language === "vi" ? "Thời lượng" : "Duration"}</p>
            <p className="mt-0.5 text-xs font-bold text-[#3f2240]">{formatDuration(request.duration || nail.duration)}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#ea4f93] transition-all group-hover:gap-1.5">
            {statusLabel === "Assigned" ? (language === "vi" ? "Bắt đầu đánh giá" : "Start Review") : (language === "vi" ? "Xem đánh giá" : "View Review")}
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function StaffCustomerNailsListPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const staffArtistId = useMemo(() => {
    try {
      return getStaffArtistId();
    } catch {
      return null;
    }
  }, []);

  const loadRequests = useCallback(async (options = {}) => {
    if (!staffArtistId) {
      setError(language === "vi" ? "Vui lòng đăng nhập với vai trò Thợ Nail để xem đơn hàng được phân công." : "Please log in as a Staff Artist to view assigned reviews.");
      setIsLoading(false);
      return;
    }
    const { silent = false } = options;
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError("");

      // Fetch requests specifically assigned to this staff artist
      const data = await fetchStaffCustomerNailRequests(staffArtistId);
      setRequests(data || []);
    } catch (err) {
      console.error("Failed to load custom nail requests:", err);
      setError(err.message || (language === "vi" ? "Không tải được yêu cầu thiết kế." : "Failed to load custom nail requests."));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [staffArtistId, language]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);



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
        title: language === "vi" ? "Tổng được phân công" : "Total Assigned",
        value: total,
        note: language === "vi" ? "Tất cả nhiệm vụ được giao cho bạn" : "All tasks assigned to you",
        icon: Sparkles,
        toneClassName: "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]",
      },
      {
        title: language === "vi" ? "Chờ đánh giá" : "Pending Review",
        value: pending,
        note: language === "vi" ? "Cần báo giá / ước tính của bạn" : "Needs your quote/estimation",
        icon: Clock3,
        toneClassName: "bg-gradient-to-br from-[#f5b455] to-[#db8520]",
      },
      {
        title: language === "vi" ? "Đã xét / Báo giá" : "Reviewed / Quoted",
        value: reviewed,
        note: language === "vi" ? "Ước tính đã gửi cho quản lý" : "Estimate submitted to manager",
        icon: Eye,
        toneClassName: "bg-gradient-to-br from-[#7c8cff] to-[#4755b8]",
      },
      {
        title: language === "vi" ? "Được duyệt / Hoàn thành" : "Approved / Completed",
        value: approved,
        note: language === "vi" ? "Được quản lý & khách hàng duyệt" : "Approved by manager & customer",
        icon: CheckCircle2,
        toneClassName: "bg-gradient-to-br from-[#5dd18d] to-[#2fa25f]",
      },
    ];
  }, [requests, language]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!staffArtistId) {
    return (
      <div className="p-6">
        <Alert
          message={language === "vi" ? "Yêu cầu xác thực" : "Authentication Required"}
          description={language === "vi" ? "Bạn phải đăng nhập với vai trò Thợ Nail để truy cập bảng đánh giá." : "You must be logged in as a Staff Artist to access the review board."}
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
          message={language === "vi" ? "Lỗi tải đánh giá tùy chỉnh" : "Error Loading Custom Reviews"}
          description={error}
          type="error"
          showIcon
          action={
            <button
              onClick={() => loadRequests()}
              className="text-xs font-semibold text-[#ea4f93] hover:underline"
            >
              {language === "vi" ? "Thử lại" : "Retry"}
            </button>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" tip={language === "vi" ? "Đang tải yêu cầu thiết kế được giao..." : "Loading assigned design requests..."} />
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
          {/* Empty top row removed */}
          <div className="grid gap-4 bg-white/45 p-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.title} {...item} />
            ))}
          </div>
        </Card>

        {/* Request Grid */}
        <Card className="p-0">
          <div className="flex flex-col gap-4 border-b border-[#f6dce7] p-6 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              title={language === "vi" ? "Tất cả yêu cầu thiết kế" : "All Design Requests"}
              subtitle={language === "vi" ? "Hiển thị các bản nộp mới nhất được giao cho bạn" : "Showing latest submissions assigned to you"}
            />
          </div>

          <div className="p-6">
            {requests.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#f2c7da] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] py-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f8]">
                  <Palette size={32} className="text-[#ea4f93]" />
                </div>
                <p className="text-sm text-[#c08aa4]">{language === "vi" ? "Bạn chưa được giao yêu cầu thiết kế nào." : "You don't have any custom review requests assigned yet."}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {paginatedRequests.map((request) => (
                    <div key={request.customerNailRequestId || request.customerNailId || request.id}>
                      <Link
                        to={`/staff/customer-nails/${request.customerNailRequestId || request.customerNailId || request.id}`}
                        className="block h-full"
                      >
                        <RequestCard request={request} language={language} />
                      </Link>
                    </div>
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

