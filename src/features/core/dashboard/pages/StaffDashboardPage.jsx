import {
  AlarmClock,
  CalendarDays,
  ClipboardList,
  Clock,
  DollarSign,
  Eye,
  FileText,
  LoaderCircle,
  Play,
  Quote,
  RefreshCcw,
  SquareCheckBig,
  Star,
  User,
  GripHorizontal,
  Pin,
  PinOff,
  EyeOff,
  RotateCcw,
  Settings2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { buildAvatarDataUrl } from "../../../../shared/utils/avatar";
import { useEffect, useMemo, useState, useRef } from "react";
import { Table, Rate, DatePicker, Segmented, Dropdown, Button, Tooltip } from "antd";
import ReactECharts from "echarts-for-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { StaffBookingNotesModal } from "../../../staff/bookings/components/StaffBookingNotesModal";
import {
  getStaffBookingDetailRoute,
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../../../shared/constants/routes";
import {
  buildStaffServiceSessionPayload,
  fetchStaffBookings,
  formatTimeValue,
  getStaffSessionUser,
  normalizeStaffBooking,
  startStaffBookingService,
} from "../../../staff/bookings/services/staffBookingService";
import { useStaffDashboard, useStaffSkills } from "../hooks/useAdminDashboard";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

const DEFAULT_BOOKING_PAGE_SIZE = 10;

// 1. CỐ ĐỊNH DATA TIẾNG ANH (Không dịch ở đây để tránh lỗi lưu vào localStorage)
const defaultWidgets = [
  { id: 'todaysSchedule', title: 'Today\'s Schedule', visible: true, pinned: false },
  { id: 'myScheduleOutline', title: 'My Schedule Outline', visible: true, pinned: false },
  { id: 'recentFeedback', title: 'Recent Feedback', visible: true, pinned: false },
  { id: 'earningsTracker', title: 'Earnings Tracker', visible: true, pinned: false },
  { id: 'serviceTimeEfficiency', title: 'Service Time Efficiency', visible: true, pinned: false },
  { id: 'skillOverview', title: 'Skill Overview', visible: true, pinned: false },
];

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function WidgetWrapper({ id, widget, onPin, onHide, onDragStart, onDragOver, onDrop, onDragEnter, children, isPinned, className = "" }) {
  // 2. GỌI HOOK BÊN TRONG COMPONENT WIDGETWRAPPER
  const { t, language } = useLanguage();

  // Tạo một hàm nhỏ để dịch động tiêu đề dựa vào ID của widget
  const getWidgetTitle = (id, fallback) => {
    const titles = {
      todaysSchedule: language === "vi" ? "Lịch hôm nay" : "Today's Schedule",
      myScheduleOutline: language === "vi" ? "Lịch của tôi" : "My Schedule Outline",
      recentFeedback: language === "vi" ? "Đánh giá gần đây" : "Recent Feedback",
      earningsTracker: language === "vi" ? "Theo dõi thu nhập" : "Earnings Tracker",
      serviceTimeEfficiency: language === "vi" ? "Hiệu quả thời gian" : "Service Time Efficiency",
      skillOverview: language === "vi" ? "Tổng quan kỹ năng" : "Skill Overview"
    };
    return t(`staff.dashboard.widgets.${id}`) || titles[id] || fallback;
  };

  return (
    <div
      draggable={!isPinned}
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={`relative group h-full flex flex-col ${isPinned ? 'col-span-full' : ''} ${className}`}
    >
      <Card className={`flex flex-col h-full border-[#f6dbe8] shadow-[0_4px_12px_rgba(234,79,147,0.05)] ${isPinned ? 'min-h-[300px]' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {!isPinned && (
              <div className="cursor-grab active:cursor-grabbing text-[#c28ca6] hover:text-[#ea4f93]">
                <GripHorizontal size={18} />
              </div>
            )}
            {/* IN TITLE ĐÃ ĐƯỢC DỊCH RA MÀN HÌNH */}
            <h3 className={`font-extrabold text-[#432744] ${isPinned ? 'text-base' : 'text-sm'}`}>
              {getWidgetTitle(id, widget.title)}
            </h3>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onPin(id)}
              className="p-1.5 text-[#c28ca6] hover:text-[#ea4f93] hover:bg-[#fff1f5] rounded-md transition-colors"
              title={isPinned ? (language === "vi" ? "Bỏ ghim" : "Unpin widget") : (language === "vi" ? "Ghim lên đầu" : "Pin to top")}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button
              onClick={() => onHide(id)}
              className="p-1.5 text-[#c28ca6] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title={language === "vi" ? "Ẩn tiện ích" : "Hide widget"}
            >
              <EyeOff size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </Card>
    </div>
  );
}
WidgetWrapper.propTypes = {
  id: PropTypes.string,
  widget: PropTypes.object,
  onPin: PropTypes.func,
  onHide: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  onDragEnter: PropTypes.func,
  children: PropTypes.node,
  isPinned: PropTypes.bool,
  className: PropTypes.string,
};

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatBookingWindow(booking) {
  const startTime = formatTimeValue(booking?.startTimeValue);

  if (!booking?.totalDuration || startTime === "--") {
    return startTime;
  }

  const [hours, minutes] = startTime.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return startTime;
  }

  const endDate = new Date();
  endDate.setHours(hours, minutes + Number(booking.totalDuration || 0), 0, 0);
  const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

  return `${startTime} - ${endTime}`;
}

function getStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-[#e9fbef] text-[#2ca865]";
    case "In Progress":
    case "CheckedIn":
      return "bg-[#eaf2ff] text-[#5e8df7]";
    case "Confirmed":
      return "bg-[#eefcf3] text-[#35b56b]";
    case "Pending":
      return "bg-[#fff4df] text-[#df8e1d]";
    case "Cancelled":
      return "bg-[#fff1f5] text-[#f06292]";
    default:
      return "bg-[#f4f5f7] text-[#8b95a7]";
  }
}



function StatusChip({ label, className }) {
  return (
    <span className={`inline-flex max-w-full break-words rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-normal ${className}`}>
      {label}
    </span>
  );
}

function MobileBookingCard({ booking, actions }) {
  return (
    <article className="w-full min-w-0 rounded-[18px] border border-[#f8dce8] bg-[#fff9fc] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#432744]">{booking.customerName}</p>
          <div className="mt-1 flex flex-col">
            <span className="text-[11px] font-semibold text-[#8a7082]">{formatDate(booking.bookingDateTime || booking.startTimeValue)}</span>
            <span className="text-[11px] text-[#c28ca6]">{formatBookingWindow(booking)}</span>
          </div>
        </div>
        <StatusChip label={booking.status} className={getStatusTone(booking.status)} />
      </div>

      <div className="mt-4 flex min-w-0 items-center gap-3">
        {booking.previewImage ? (
          <img crossOrigin="anonymous"
            src={booking.previewImage}
            alt={booking.service}
            className="h-12 w-12 rounded-2xl object-cover shadow-sm"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f6] text-[10px] font-bold text-[#ea4f93]">
            --
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-bold text-[#432744]">{booking.services.join(", ")}</p>
          <p className="mt-1 break-words text-[11px] text-[#8a7082]">{booking.uiBranch}</p>
        </div>

        <div className="shrink-0">
          <ActionDropdown items={actions} />
        </div>
      </div>
    </article>
  );
}

export function StaffDashboardPage() {
  const navigate = useNavigate();

  // 3. GỌI HOOK BÊN TRONG FUNCTION COMPONENT CHÍNH
  const { t, language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [selectedStaffNotesBooking, setSelectedStaffNotesBooking] = useState(null);
  const [bookingPagination, setBookingPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: DEFAULT_BOOKING_PAGE_SIZE,
    totalItems: 0,
    hasPrevious: false,
    hasNext: false,
    firstRowOnPage: 0,
    lastRowOnPage: 0,
  });

  const sessionUser = getStaffSessionUser();
  const greetingName = sessionUser?.fullName || sessionUser?.email || (language === "vi" ? "Thợ Nail" : "Artist");

  const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
  const [filterMode, setFilterMode] = useState("Day");

  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('staffDashboardWidgets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return defaultWidgets;
  });
  const [draggedWidgetId, setDraggedWidgetId] = useState(null);

  useEffect(() => {
    localStorage.setItem('staffDashboardWidgets', JSON.stringify(widgets));
  }, [widgets]);

  const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
  const endDate = dateRange?.[1]?.format("YYYY-MM-DD");

  const { data: dashboardData, isLoading: isDashboardLoading } = useStaffDashboard(sessionUser?.staffId, startDate, endDate);
  const { data: staffSkillsData, isLoading: isSkillsLoading } = useStaffSkills(sessionUser?.staffId);

  const feedbackScrollRef = useRef(null);
  const scrollFeedback = (direction) => {
    if (feedbackScrollRef.current) {
      const scrollAmount = 330;
      feedbackScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchStaffBookings({
          includePagination: true,
          pageNumber: bookingPagination.currentPage,
          pageSize: bookingPagination.pageSize,
          startDate: startDate,
          endDate: endDate,
        });

        if (!isMounted) {
          return;
        }

        const normalizedBookings = Array.isArray(response?.items)
          ? response.items.map(normalizeStaffBooking)
          : [];
        setBookings(normalizedBookings);
        setBookingPagination((current) => ({
          ...current,
          ...(response?.pagination ?? {}),
        }));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : (language === "vi" ? "Không thể tải lịch hẹn hôm nay." : "Failed to load today's bookings.");
        setError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBookings();

    return () => {
      isMounted = false;
    };
  }, [bookingPagination.currentPage, bookingPagination.pageSize, startDate, endDate, sessionUser?.staffId, language]);

  const sortedBookings = useMemo(
    () => [...bookings].sort((left, right) => left.bookingTime.localeCompare(right.bookingTime)),
    [bookings],
  );

  const currentBooking = useMemo(
    () => sortedBookings.find((booking) => ["In Progress", "CheckedIn", "Confirmed"].includes(booking.status)) ?? sortedBookings[0] ?? null,
    [sortedBookings],
  );
  const nextBooking = useMemo(
    () => sortedBookings.find((booking) => ["Pending", "Confirmed"].includes(booking.status)) ?? sortedBookings[1] ?? currentBooking,
    [currentBooking, sortedBookings],
  );

  // 4. DỊCH DỮ LIỆU ĐƯỢC TÍNH TOÁN BÊN TRONG useMemo
  const metrics = useMemo(() => {
    return [
      {
        label: language === 'vi' ? 'Đang chờ' : 'Pending',
        value: dashboardData?.remainingAppointmentsCount || 0,
        note: language === 'vi' ? 'Còn lại trong ngày' : 'Remaining today',
        icon: CalendarDays,
        color: "#ec4899",
      },
      {
        label: language === 'vi' ? 'Hoàn thành' : 'Completed',
        value: dashboardData?.completedAppointmentsCount || 0,
        note: language === 'vi' ? 'Đã phục vụ xong' : 'Appointments done',
        icon: ClipboardList,
        color: "#10b981",
      },
      {
        label: language === 'vi' ? 'Thu nhập' : 'Earnings',
        value: dashboardData?.estimatedEarnings ? dashboardData.estimatedEarnings.toLocaleString() : "0",
        unit: "₫",
        note: language === 'vi' ? 'Tổng dự tính' : 'Estimated total',
        icon: DollarSign,
        color: "#0ea5e9",
      },
      {
        label: language === 'vi' ? 'Đánh giá' : 'Rating',
        value: dashboardData?.averageRatingScore || 0,
        note: language === 'vi' ? 'Điểm trung bình' : 'Average score',
        icon: Star,
        color: "#f59e0b",
      },
      {
        label: language === 'vi' ? 'Kế tiếp' : 'Next',
        value: typeof dashboardData?.nextCustomer === "object" && dashboardData?.nextCustomer !== null
          ? (dashboardData.nextCustomer.customerName)
          : (dashboardData?.nextCustomer),
        note: language === 'vi' ? 'Khách sắp tới' : 'Upcoming customer',
        icon: AlarmClock,
        color: "#8b5cf6",
      },
    ];
  }, [dashboardData, language]);

  const getEmptyTimeLabels = () => {
    if (!startDate || !endDate) return { labels: [language === 'vi' ? 'Trống' : 'No Data'], data: [0] };
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diff = end.diff(start, 'day');

    let labels = [];
    let data = [];
    if (diff >= 0 && diff <= 31) {
      for (let i = 0; i <= diff; i++) {
        labels.push(start.add(i, 'day').format('DD/MM'));
        data.push(0);
      }
    } else if (diff > 31 && diff <= 366) {
      const months = end.diff(start, 'month');
      for (let i = 0; i <= months; i++) {
        labels.push(start.add(i, 'month').format('MM/YYYY'));
        data.push(0);
      }
    } else {
      const years = end.diff(start, 'year');
      for (let i = 0; i <= years; i++) {
        labels.push(start.add(i, 'year').format('YYYY'));
        data.push(0);
      }
    }

    if (labels.length === 0) {
      labels = [language === 'vi' ? 'Trống' : 'No Data'];
      data = [0];
    }
    return { labels, data };
  };

  const earningsOption = useMemo(() => {
    const hasData = dashboardData?.earningsTracker?.labels?.length > 0;
    const emptyData = getEmptyTimeLabels();
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '2%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: hasData ? dashboardData.earningsTracker.labels : emptyData.labels,
      },
      yAxis: {
        type: 'value',
        max: (val) => val.max === 0 ? 100000 : null,
        axisLabel: { formatter: (value) => `${(value / 1000).toLocaleString("vi-VN")}k ₫` }
      },
      series: [
        {
          data: hasData ? dashboardData.earningsTracker.datasets[0].data : emptyData.data,
          type: 'line',
          itemStyle: { color: '#0ea5e9' },
          areaStyle: { color: 'rgba(14, 165, 233, 0.2)' }
        }
      ]
    };
  }, [dashboardData, startDate, endDate, language]);

  const serviceTimeOption = useMemo(() => {
    const hasData = dashboardData?.serviceTimeEfficiency?.labels?.length > 0;
    const emptyData = getEmptyTimeLabels();
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '2%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: hasData ? dashboardData.serviceTimeEfficiency.labels : emptyData.labels,
      },
      yAxis: {
        type: 'value',
        max: (val) => val.max === 0 ? 60 : null,
        axisLabel: { formatter: language === "vi" ? '{value} phút' : '{value} mins' }
      },
      series: [
        {
          data: hasData ? dashboardData.serviceTimeEfficiency.datasets[0].data : emptyData.data,
          type: 'bar',
          itemStyle: { color: '#10b981' }
        }
      ]
    };
  }, [dashboardData, startDate, endDate, language]);

  const skillRadarOption = useMemo(() => {
    if (!staffSkillsData || staffSkillsData.length === 0) return {};
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: [language === 'vi' ? 'Cấp độ kỹ năng' : 'Skill Level'],
        bottom: 0
      },
      radar: {
        indicator: staffSkillsData.map(skill => ({
          name: skill.skillTypeName,
          max: 5
        })),
        radius: '65%'
      },
      series: [
        {
          name: language === 'vi' ? 'Kỹ năng' : 'Skills',
          type: 'radar',
          data: [
            {
              value: staffSkillsData.map(skill => skill.level),
              name: language === 'vi' ? 'Cấp độ kỹ năng' : 'Skill Level',
              areaStyle: {
                color: 'rgba(234, 79, 147, 0.2)'
              },
              lineStyle: {
                color: '#ea4f93'
              },
              itemStyle: {
                color: '#ea4f93'
              }
            }
          ]
        }
      ]
    };
  }, [staffSkillsData, language]);

  const handleDragStart = (e, id) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedWidgetId(id);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, targetId) => {
    e.preventDefault();
    if (draggedWidgetId === targetId) return;

    const newWidgets = [...widgets];
    const draggedIdx = newWidgets.findIndex(w => w.id === draggedWidgetId);
    const targetIdx = newWidgets.findIndex(w => w.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;
    if (newWidgets[draggedIdx].pinned || newWidgets[targetIdx].pinned) return;

    const [draggedWidget] = newWidgets.splice(draggedIdx, 1);
    newWidgets.splice(targetIdx, 0, draggedWidget);
    setWidgets(newWidgets);
  };

  const handleDrop = (e, id) => {
    e.preventDefault();
    e.currentTarget.classList.remove("opacity-50");
    setDraggedWidgetId(null);
  };

  const handlePin = (id) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.id === id);
      if (!widget) return prev;

      const newPinnedState = !widget.pinned;
      const updated = prev.map(w => w.id === id ? { ...w, pinned: newPinnedState } : w);

      const pinned = updated.filter(w => w.pinned);
      const unpinned = updated.filter(w => !w.pinned);
      return [...pinned, ...unpinned];
    });
  };

  const handleHide = (id) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: false } : w));
  };

  const handleResetLayout = () => {
    setWidgets(defaultWidgets);
    localStorage.removeItem('staffDashboardWidgets');
    toast.success(language === "vi" ? "Đã đặt lại bố cục mặc định" : "Dashboard layout reset to default");
  };

  const pinnedWidgets = widgets.filter(w => w.pinned && w.visible);
  const unpinnedWidgets = widgets.filter(w => !w.pinned && w.visible);

  const renderWidgetContent = (id, isPinned = false) => {
    switch (id) {
      case 'todaysSchedule':
        return (
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between">
              <StatusChip
                label={language === "vi" ? `${bookingPagination.totalItems} Lịch hẹn` : `${bookingPagination.totalItems} bookings`}
                className="border border-[#f6d3e3] bg-[#fff1f6] text-[#b48aa0]"
              />
            </div>
            <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
              {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm text-[#b38a9f]">
                  <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                  {language === "vi" ? "Đang tải lịch hôm nay..." : "Loading today's schedule..."}
                </div>
              ) : (
                <>
                  <div className="space-y-3 p-3 md:hidden">
                    {sortedBookings.map((booking) => (
                      <MobileBookingCard
                        key={booking.id}
                        booking={booking}
                        actions={getActionItems(booking)}
                      />
                    ))}
                    {!sortedBookings.length ? (
                      <div className="px-4 py-10 text-center text-sm text-[#8a7082]">
                        {language === "vi" ? "Không tìm thấy lịch hẹn nào." : "No bookings found for today."}
                      </div>
                    ) : null}
                    {bookingPagination.totalPages > 1 ? (
                      <div className="flex items-center justify-between gap-3 border-t border-[#f8dce8] px-1 pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setBookingPagination((current) => ({
                              ...current,
                              currentPage: Math.max(1, current.currentPage - 1),
                            }))
                          }
                          disabled={!bookingPagination.hasPrevious}
                          className="rounded-xl border border-[#f2bfd4] bg-white px-3 py-2 text-xs font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {language === "vi" ? "Trước" : "Previous"}
                        </button>
                        <span className="text-xs font-bold text-[#866f80]">
                          {language === "vi" ? "Trang" : "Page"} {bookingPagination.currentPage}/{bookingPagination.totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setBookingPagination((current) => ({
                              ...current,
                              currentPage: Math.min(current.totalPages, current.currentPage + 1),
                            }))
                          }
                          disabled={!bookingPagination.hasNext}
                          className="rounded-xl border border-[#f2bfd4] bg-white px-3 py-2 text-xs font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {language === "vi" ? "Tiếp" : "Next"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="hidden md:block">
                    <Table
                      rowKey="id"
                      columns={bookingColumns}
                      dataSource={sortedBookings}
                      pagination={tablePagination}
                      onChange={handleTableChange}
                      scroll={{ x: 980 }}
                      locale={{ emptyText: language === "vi" ? "Không có lịch hẹn nào." : "No bookings found for today." }}
                    />
                  </div>
                </>
              )}
            </section>
          </div>
        );
      case 'earningsTracker':
        return dashboardData?.earningsTracker ? (
          <ReactECharts option={earningsOption} style={{ height: isPinned ? '380px' : '280px', width: '100%' }} opts={{ renderer: 'svg' }} />
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-[#aa8a99]">
            {isDashboardLoading ? <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" /> : (language === "vi" ? "Chưa có dữ liệu thu nhập" : "No earnings data")}
          </div>
        );
      case 'serviceTimeEfficiency':
        return dashboardData?.serviceTimeEfficiency ? (
          <ReactECharts option={serviceTimeOption} style={{ height: isPinned ? '380px' : '280px', width: '100%' }} opts={{ renderer: 'svg' }} />
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-[#aa8a99]">
            {isDashboardLoading ? <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" /> : (language === "vi" ? "Chưa có dữ liệu hiệu suất" : "No efficiency data")}
          </div>
        );
      case 'skillOverview':
        return staffSkillsData && staffSkillsData.length > 0 ? (
          <ReactECharts option={skillRadarOption} style={{ height: isPinned ? '380px' : '280px', width: '100%' }} opts={{ renderer: 'svg' }} />
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-[#aa8a99]">
            {isSkillsLoading ? <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" /> : (language === "vi" ? "Chưa có dữ liệu kỹ năng" : "No skills data")}
          </div>
        );
      case 'recentFeedback':
        return dashboardData?.recentFeedback && dashboardData.recentFeedback.length > 0 ? (
          <div className="relative flex w-full items-center">
            <button onClick={() => scrollFeedback('left')} className="absolute left-2 z-10 p-2 rounded-full bg-white border border-slate-200 hover:bg-[#ea4f93] hover:border-[#ea4f93] hover:text-white text-slate-500 transition-colors shadow-md">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => scrollFeedback('right')} className="absolute right-2 z-10 p-2 rounded-full bg-white border border-slate-200 hover:bg-[#ea4f93] hover:border-[#ea4f93] hover:text-white text-slate-500 transition-colors shadow-md">
              <ChevronRight size={24} />
            </button>

            <div ref={feedbackScrollRef} className="flex w-full gap-6 overflow-x-auto px-14 py-6 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {dashboardData.recentFeedback.map((fb, i) => {
                const borderColors = ["border-b-[#f97316] border-r-[#f97316]", "border-b-[#0ea5e9] border-r-[#0ea5e9]", "border-b-[#ef4444] border-r-[#ef4444]"];
                const iconBgColors = ["bg-[#f97316]", "bg-[#0ea5e9]", "bg-[#ef4444]"];
                const currentBorder = borderColors[i % borderColors.length];
                const currentBg = iconBgColors[i % iconBgColors.length];

                return (
                  <div key={i} className={`relative flex min-w-[250px] max-w-[350px] shrink-0 snap-center flex-col justify-between rounded-[20px] border border-slate-200 border-b-8 border-r-8 bg-white p-6 shadow-sm ${currentBorder}`}>
                    <div className={`absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-white shadow-md ${currentBg}`}>
                      <User size={20} />
                    </div>
                    <div className="flex items-start gap-4">
                      <Quote className="text-slate-200 fill-slate-200" size={48} />
                      <div className="mt-2">
                        <h4 className={`text-lg font-bold ${currentBg.replace('bg-', 'text-')}`}>{fb.customerName}</h4>
                        <p className="text-xs font-medium text-slate-500">{language === "vi" ? "Khách hàng" : "Client Name"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-medium italic text-slate-600 line-clamp-3 min-h-[60px]">
                      {fb.comment || (language === "vi" ? "Không có lời bình luận." : "No comment provided.")}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <Rate disabled defaultValue={fb.score} className={`text-[16px] ${currentBg.replace('bg-', 'text-')}`} />
                      <span className="text-sm font-bold text-slate-700">{fb.score.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8a7082] p-4">{language === "vi" ? "Không có đánh giá gần đây." : "No recent feedback available."}</p>
        );
      case 'myScheduleOutline': {
        if (!dashboardData?.mySchedule || dashboardData.mySchedule.length === 0) {
          return <p className="text-sm text-[#8a7082] p-4">{language === "vi" ? "Không có lịch trình trong thời gian này." : "No schedule items available for selected dates."}</p>;
        }

        const uniqueDates = Array.from(new Set(dashboardData.mySchedule.map(item => dayjs(item.date).format("YYYY-MM-DD")))).sort();

        return (
          <div className="flex flex-col h-[600px] w-full bg-white rounded-[20px] p-2">
            <div className="w-full h-full overflow-auto custom-scrollbar">
              <div style={{ minWidth: `${Math.max(uniqueDates.length * 150 + 64, 100)}%` }}>

                {/* Header Row for Dates */}
                <div className="flex ml-16 mb-2 sticky top-0 z-30 bg-white/95 backdrop-blur-sm pt-4">
                  {uniqueDates.map(date => (
                    <div key={date} className="flex-1 min-w-[100px] max-w-[150px] text-center pb-2">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {dayjs(date).format("ddd")}
                      </div>
                      <div className="text-lg font-bold text-gray-700">
                        {dayjs(date).format("DD")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline Body */}
                <div className="relative w-full h-[840px]">
                  {/* Background Times */}
                  <div className="absolute top-0 left-0 w-full h-[840px] pointer-events-none z-0">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const hour = i + 8;
                      const timeLabel = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                      return (
                        <div key={i} className="flex h-[60px] border-b border-gray-100">
                          <span className="w-16 text-[10px] text-gray-400 font-medium pr-2 text-right sticky left-0 bg-white/95 backdrop-blur-sm z-20 flex items-start justify-end" style={{ marginTop: '-8px' }}>
                            {timeLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Timeline Columns */}
                  <div className="relative w-full h-[840px] ml-16 flex z-10">
                    {uniqueDates.map((date, colIdx) => {
                      const dailySchedules = dashboardData.mySchedule.filter(s => dayjs(s.date).format("YYYY-MM-DD") === date);
                      return (
                        <div key={date} className={`flex-1 relative min-w-[100px] max-w-[150px] border-l border-gray-100 ${colIdx === uniqueDates.length - 1 ? 'border-r border-gray-100' : ''}`}>
                          {dailySchedules.map((scheduleItem, idx) => {
                            const [h, m] = scheduleItem.startTime.split(':').map(Number);
                            const top = ((h - 8) * 60) + m;
                            const height = Math.max(30, scheduleItem.durationMinutes);

                            const colors = [
                              "bg-[#e5f1ff] text-[#1f77d0] border-[#93c5fd]",
                              "bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe]",
                              "bg-[#ffe4e6] text-[#be123c] border-[#fda4af]",
                              "bg-[#dcfce7] text-[#15803d] border-[#86efac]",
                            ];
                            const colorClass = colors[idx % colors.length];
                            const [bgClass, textClass, borderClass] = colorClass.split(' ');

                            const endMins = m + scheduleItem.durationMinutes;
                            const endH = h + Math.floor(endMins / 60);
                            const endM = endMins % 60;
                            const formatTime = (hour, min) => {
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const h12 = hour % 12 || 12;
                              const minStr = min > 0 ? `:${String(min).padStart(2, '0')}` : '';
                              return `${h12}${minStr} ${ampm}`;
                            };
                            const timeRangeStr = `${formatTime(h, m)} - ${formatTime(endH, endM)}`;

                            return (
                              <Tooltip
                                key={idx}
                                placement="topLeft"
                                title={
                                  <div className="text-xs">
                                    <div><strong className="text-[#ea4f93]">{language === "vi" ? "Ngày:" : "Date:"}</strong> {dayjs(scheduleItem.date).format("DD/MM/YYYY")}</div>
                                    <div><strong className="text-[#ea4f93]">{language === "vi" ? "Loại:" : "Type:"}</strong> {scheduleItem.type}</div>
                                    {scheduleItem.type === 'Booking' && <div><strong className="text-[#ea4f93]">{language === "vi" ? "Khách hàng:" : "Customer:"}</strong> {scheduleItem.customerName}</div>}
                                    <div><strong className="text-[#ea4f93]">{language === "vi" ? "Thời lượng:" : "Duration:"}</strong> {scheduleItem.durationMinutes} {language === "vi" ? "phút" : "min"}</div>
                                  </div>
                                }
                              >
                                <div
                                  className={`absolute left-[2px] right-[2px] rounded p-2 flex flex-col overflow-hidden transition-all hover:shadow-md cursor-pointer z-10 hover:z-20 ${bgClass} ${textClass}`}
                                  style={{ top: `${top}px`, height: `${height}px` }}
                                >
                                  {height >= 40 ? (
                                    <>
                                      <span className={`text-[10px] font-medium opacity-90 pb-1 mb-1 border-b border-dashed ${borderClass}`}>
                                        {timeRangeStr}
                                      </span>
                                      <h4 className="text-[11px] font-semibold leading-tight line-clamp-2">{scheduleItem.customerName || scheduleItem.type}</h4>
                                    </>
                                  ) : (
                                    <h4 className="text-[11px] font-semibold leading-tight line-clamp-1 truncate flex items-center gap-1">
                                      <span className="text-[10px] opacity-80 whitespace-nowrap">{formatTime(h, m)}</span>
                                      {scheduleItem.customerName || scheduleItem.type}
                                    </h4>
                                  )}
                                </div>
                              </Tooltip>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const getActionItems = (booking) => {
    const detailRoute = getStaffBookingDetailRoute(booking.id);
    const normalizedBookingStatus = String(booking?.status || booking?.uiStatus || "").trim().toLowerCase();
    const isPendingBooking = ["pending", "approved"].includes(normalizedBookingStatus);
    const isCheckedInBooking = normalizedBookingStatus === "checkedin";
    const isInProgressBooking = normalizedBookingStatus === "inprogress";
    const isCompletedBooking = normalizedBookingStatus === "completed";
    const isServiceCompletedBooking = normalizedBookingStatus === "servicecompleted";
    const isCancelledBooking = ["cancelled", "canceled"].includes(normalizedBookingStatus);
    const openServiceSession = (bookingDetail = booking) => {
      navigate(getStaffBookingServiceSessionRoute(booking.id), {
        state: {
          serviceSession: {
            ...buildStaffServiceSessionPayload(bookingDetail, {
              backRoute: detailRoute,
              designUpdateRoute: getStaffBookingDesignStudioRoute(booking.id),
            }),
            started: isInProgressBooking,
            completed: false,
          },
        },
      });
    };
    const startService = async () => {
      try {
        const updatedBooking = await startStaffBookingService(booking.id);
        toast.success(language === "vi" ? "Bắt đầu dịch vụ thành công." : "Service started successfully.");
        openServiceSession(updatedBooking);
      } catch (error) {
        const message = error instanceof Error ? error.message : (language === "vi" ? "Lỗi khi bắt đầu dịch vụ." : "Failed to start service.");
        toast.error(message);
      }
    };

    if (isInProgressBooking) {
      return [
        { key: "view", label: language === "vi" ? "Xem lịch hẹn" : "View Booking", icon: Eye, onSelect: () => navigate(detailRoute) },
        {
          key: "continue",
          label: language === "vi" ? "Tiếp tục làm" : "Continue Service",
          icon: Play,
          onSelect: () => void openServiceSession(),
        },
        {
          key: "notes",
          label: language === "vi" ? "Ghi chú" : "View Notes",
          icon: FileText,
          onSelect: () => setSelectedStaffNotesBooking(booking),
        },
      ];
    }

    return [
      { key: "view", label: language === "vi" ? "Xem lịch hẹn" : "View Booking", icon: Eye, onSelect: () => navigate(detailRoute) },
      ...(!isCancelledBooking && !isPendingBooking && !isCompletedBooking && !isServiceCompletedBooking
        ? [{
          key: "start",
          label: language === "vi" ? "Bắt đầu làm" : "Start Service",
          icon: Play,
          onSelect: () => void startService(),
        }]
        : []),
      ...(!isCancelledBooking && !isPendingBooking && !isCheckedInBooking && !isCompletedBooking && !isServiceCompletedBooking
        ? [{
          key: "complete",
          label: language === "vi" ? "Hoàn thành" : "Complete Service",
          icon: SquareCheckBig,
          onSelect: () => navigate(detailRoute, { state: { staffAction: "complete" } }),
        }]
        : []),
      {
        key: "notes",
        label: language === "vi" ? "Ghi chú" : "View Notes",
        icon: FileText,
        onSelect: () => setSelectedStaffNotesBooking(booking),
      },
    ];
  };

  const tablePagination = useMemo(
    () => ({
      current: bookingPagination.currentPage,
      pageSize: bookingPagination.pageSize,
      total: bookingPagination.totalItems,
      showSizeChanger: true,
      pageSizeOptions: ["5", "10", "20", "50"],
      showTotal: (total, range) => language === "vi" ? `${range[0]}-${range[1]} của ${total} lịch hẹn` : `${range[0]}-${range[1]} of ${total} bookings`,
    }),
    [bookingPagination.currentPage, bookingPagination.pageSize, bookingPagination.totalItems, language],
  );

  const handleTableChange = (pagination) => {
    const nextPage = Number(pagination?.current || 1);
    const nextPageSize = Number(pagination?.pageSize || DEFAULT_BOOKING_PAGE_SIZE);

    setBookingPagination((current) => ({
      ...current,
      currentPage: nextPageSize !== current.pageSize ? 1 : nextPage,
      pageSize: nextPageSize,
    }));
  };

  const bookingColumns = useMemo(() => ([
    {
      title: language === "vi" ? "Ngày & Giờ" : "Date & Time",
      key: "time",
      sorter: (a, b) => (a.bookingTime || "").localeCompare(b.bookingTime || ""),
      render: (_, booking) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[#8a7082]">{formatDate(booking.bookingDateTime || booking.startTimeValue)}</span>
          <span className="text-sm font-bold text-[#3f2b3f]">{formatBookingWindow(booking)}</span>
        </div>
      ),
    },
    {
      title: language === "vi" ? "Khách hàng" : "Customer",
      key: "customer",
      sorter: (a, b) => (a.customerName || "").localeCompare(b.customerName || ""),
      render: (_, booking) => (
        <div className="flex items-center gap-3">
          <img
            src={buildAvatarDataUrl(booking.customerName)}
            alt={booking.customerName}
            className="h-9 w-9 rounded-full border border-[#f6d3e3]"
            loading="lazy"
          />
          <p className="text-sm font-bold text-[#432744]">{booking.customerName}</p>
        </div>
      ),
    },
    {
      title: language === "vi" ? "Giá" : "Price",
      key: "price",
      sorter: (a, b) => (a.totalPriceValue || 0) - (b.totalPriceValue || 0),
      render: (_, booking) => <span className="font-bold text-[#ea4f93]">{booking.totalPriceLabel}</span>,
    },
    {
      title: language === "vi" ? "Trạng thái" : "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (value) => <StatusChip label={value} className={getStatusTone(value)} />,
    },
    {
      title: language === "vi" ? "Hành động" : "Action",
      key: "action",
      render: (_, booking) => <ActionDropdown items={getActionItems(booking)} />,
    },
  ]), [getActionItems, language]);

  const hiddenWidgets = widgets.filter(w => !w.visible);

  const layoutMenuProps = {
    items: [
      ...hiddenWidgets.map((w) => ({
        key: `restore-${w.id}`,
        label: language === "vi" ? `Hiển thị ${w.title}` : `Show ${w.title}`,
        icon: <Eye size={16} />,
        onClick: () => toggleHide(w.id),
      })),
      hiddenWidgets.length > 0 ? { type: 'divider' } : null,
      {
        key: 'reset',
        label: language === "vi" ? 'Đặt lại bố cục' : 'Reset Layout',
        icon: <RotateCcw size={16} />,
        onClick: handleResetLayout,
        danger: true,
      }
    ].filter(Boolean),
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 font-sans">
        {/* Header & Controls */}
        <div
          className="
                  sticky top-[-20px] z-50
                  flex flex-col gap-4
                  border-b border-white/30
                  bg-[linear-gradient(135deg,rgba(255,236,244,0.8)_0%,rgba(255,248,220,0.8)_100%)]
                  backdrop-blur-xl
                  shadow-[0_8px_24px_rgba(236,72,153,0.08)]
                  px-8 py-5
                  md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
              {language === "vi"
                ? (new Date().getHours() < 12 ? `Chào buổi sáng, ${greetingName}!` : `Chào buổi chiều, ${greetingName}!`)
                : `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${greetingName}!`
              }
            </h1>
            <p className="text-[13px] text-slate-500 font-medium">
              {language === "vi" ? "Chào mừng bạn đến với trang tổng quan." : "Welcome to your dashboard overview."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Dropdown menu={layoutMenuProps} trigger={['click']} placement="bottomRight">
              <Button icon={<Settings2 size={16} className="text-slate-500" />} className="border-slate-200 font-medium text-slate-700 bg-white shadow-sm">
                {language === "vi" ? "Tùy chỉnh" : "Customize"}
              </Button>
            </Dropdown>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-[32px] items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              {language === "vi" ? "Làm mới" : "Refresh"}
            </button>
            <Segmented
              options={[
                { label: language === "vi" ? "Ngày" : "Day", value: "Day" },
                { label: language === "vi" ? "Tuần" : "Week", value: "Week" },
                { label: language === "vi" ? "Tháng" : "Month", value: "Month" },
                { label: language === "vi" ? "Năm" : "Year", value: "Year" },
                { label: language === "vi" ? "Tùy chọn" : "Custom", value: "Custom" }
              ]}
              value={filterMode}
              onChange={(val) => {
                setFilterMode(val);
                if (val === "Day") setDateRange([dayjs(), dayjs()]);
                else if (val === "Week") setDateRange([dayjs().subtract(7, "day"), dayjs()]);
                else if (val === "Month") setDateRange([dayjs().subtract(1, "month"), dayjs()]);
                else setDateRange([dayjs().subtract(1, "year"), dayjs()]);
              }}
              className="rounded-md bg-slate-100 p-1 font-semibold"
            />
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates || [dayjs(), dayjs()]);
                setFilterMode("Custom");
              }}
              className="rounded-md border-slate-200 hover:border-sky-500 focus:border-sky-500"
              format="YYYY-MM-DD"
            />
          </div>
        </div>

        <div className="mx-auto w-full space-y-6 p-8
                        bg-[#fff9fb]
                        bg-[radial-gradient(circle_at_top_right,rgba(255,191,73,.55),transparent_38%),radial-gradient(circle_at_top_left,rgba(255,121,198,.35),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,163,196,.45),transparent_35%),linear-gradient(to_right,#f3c7db_1px,transparent_1px),linear-gradient(to_bottom,#f3c7db_1px,transparent_1px)]
                      ">

          {error ? (
            <div className="rounded-[16px] border border-[#f7d4df] bg-[#fff3f7] px-4 py-3 text-sm font-medium text-[#d14c84]">
              {error}
            </div>
          ) : null}

          <TopMetricsRow metrics={metrics} />

          {/* Pinned Widgets Section */}
          {pinnedWidgets.length > 0 && (
            <div className="flex flex-col gap-4">
              {pinnedWidgets.map((widget) => (
                <WidgetWrapper
                  key={widget.id}
                  id={widget.id}
                  widget={widget}
                  isPinned={true}
                  onPin={handlePin}
                  onHide={handleHide}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDrop={handleDrop}
                >
                  {renderWidgetContent(widget.id, true)}
                </WidgetWrapper>
              ))}
            </div>
          )}

          {unpinnedWidgets.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {unpinnedWidgets.map((widget) => {
                const isFullWidth = ['todaysSchedule', 'myScheduleOutline', 'recentFeedback'].includes(widget.id);
                return (
                  <WidgetWrapper
                    key={widget.id}
                    id={widget.id}
                    widget={widget}
                    isPinned={false}
                    onPin={handlePin}
                    onHide={handleHide}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDrop={handleDrop}
                    className={isFullWidth ? "col-span-1 lg:col-span-2" : ""}
                  >
                    {renderWidgetContent(widget.id, false)}
                  </WidgetWrapper>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <StaffBookingNotesModal
        open={Boolean(selectedStaffNotesBooking)}
        booking={selectedStaffNotesBooking}
        onClose={() => setSelectedStaffNotesBooking(null)}
      />
    </>
  );
}