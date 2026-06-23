import { Spin, Alert, DatePicker, Pagination, ConfigProvider } from "antd";
import { Palette, Heart, Eye, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
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

function formatVND(amount) {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function CustomerNailCard({ nail }) {
  const initials = nail.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "CN";
  const isPreset = nail.basedOnNailVariantId !== null;
  return (
    <div className="rounded-[18px] border border-[#f8deea] bg-[#fffafb] p-5 transition-all duration-300 hover:shadow-[0_10px_24px_rgba(236,72,153,0.12)] hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {nail.imageUrl ? (
            <img
              src={nail.imageUrl}
              alt={nail.name}
              className="h-14 w-14 rounded-[14px] object-cover border-3 border-white shadow-md"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-sm font-bold text-white shadow-md">
              {initials}
            </div>
          )}
          <div>
            <h4 className="text-base font-extrabold text-[#3f2240]">{nail.name || "Untitled Design"}</h4>
            <p className="text-xs text-[#c08aa4]">
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
        <div className="rounded-[14px] border border-[#f4c7da] bg-[#fff9fc] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Price</p>
          <p className="text-sm font-semibold text-[#ea4f93]">{formatVND(nail.price)}</p>
        </div>
        <div className="rounded-[14px] border border-[#f4c7da] bg-[#fff9fc] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Duration</p>
          <p className="text-sm font-semibold text-[#3f2240]">
            {nail.duration ? `${nail.duration} mins` : "N/A"}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#f4c7da] bg-[#fff9fc] p-3">
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
          <p className="text-[10px] text-[#e1447f]">Rejected: {nail.rejectReason}</p>
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
  const [nails, setNails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 3 per row, 2 rows max

  useEffect(() => {
    loadCustomerNails();
  }, []);

  const loadCustomerNails = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchCustomerNails();
      setNails(data || []);
    } catch (err) {
      console.error("Failed to load customer nails:", err);
      setError(err.message || "Failed to load customer nails.");
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="flex min-h-full flex-col gap-4">
        <Card className="p-0">
          <div className="flex flex-col gap-4 border-b border-[#f6dce7] p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_6px_16px_rgba(234,79,147,0.3)]">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#402542]">Customer Nails</h2>
                <p className="text-sm text-[#c08aa4]">Manage customer nail designs</p>
              </div>
            </div>
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              placeholder="Select date"
              allowClear
              className="h-10 rounded-full border border-[#f5d0e4] bg-[#fff9fc] text-xs text-[#5c4158] outline-none transition placeholder:text-[#d198b0] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/20"
              suffixIcon={<Calendar size={16} className="text-[#c08aa4]" />}
            />
          </div>

          <div className="p-6">
            <SectionHeading
              title="All Customer Nails"
              subtitle={`${filteredNails.length} designs${selectedDate ? " (filtered)" : ""}`}
            />

            {filteredNails.length === 0 ? (
              <div className="py-16 text-center">
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
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedNails.map((nail) => (
                    <Link
                      key={nail.customerNailId || nail.id}
                      to={`${ROUTES.managerCustomerNails}/${nail.customerNailId || nail.id}`}
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
      </div>
    </ConfigProvider>
  );
}
