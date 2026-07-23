import {
  AlarmClock,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Clock,
  DollarSign,
  Eye,
  FileText,
  LoaderCircle,
  MessageSquareText,
  Play,
  Quote,
  RefreshCcw,
  Sparkles,
  SquareCheckBig,
  Star,
  Trophy,
  User,
  GripHorizontal,
  Pin,
  PinOff,
  EyeOff,
  RotateCcw,
  LayoutDashboard,
  Settings2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { buildAvatarDataUrl } from "../../../../shared/utils/avatar";
import { useEffect, useMemo, useState, useRef } from "react";
import { Table, Tag, Rate, DatePicker, Segmented, Dropdown, Button, Tooltip } from "antd";
import ReactECharts from "echarts-for-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { StaffBookingNotesModal } from "../../../../shared/bookings/components/StaffBookingNotesModal";
import {
  getStaffBookingDetailRoute,
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../../../shared/constants/routes";
import {
  buildStaffServiceSessionPayload,
  fetchStaffBookings,
  formatCurrency,
  formatTimeValue,
  getStaffSessionUser,
  normalizeStaffBooking,
  startStaffBookingService,
} from "../../../staff/bookings/services/staffBookingService";
import { useStaffDashboard, useStaffSkills } from "../hooks/useAdminDashboard";

const DEFAULT_BOOKING_PAGE_SIZE = 10;

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
            <h3 className={`font-extrabold text-[#432744] ${isPinned ? 'text-base' : 'text-sm'}`}>{widget.title}</h3>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onPin(id)}
              className="p-1.5 text-[#c28ca6] hover:text-[#ea4f93] hover:bg-[#fff1f5] rounded-md transition-colors"
              title={isPinned ? "Unpin widget" : "Pin to top"}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button
              onClick={() => onHide(id)}
              className="p-1.5 text-[#c28ca6] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Hide widget"
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

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${item.iconClassName}`}>
        <Icon size={16} />
      </div>
      <p className="mt-4 text-[11px] font-medium text-[#b08a9f]">{item.label}</p>
      <p className="mt-1 text-[1.7rem] font-extrabold leading-none text-[#3f2b3f]">{item.value}</p>
      <p className="mt-2 text-[11px] font-medium text-[#d597b3]">{item.note}</p>
    </article>
  );
}

function StatusChip({ label, className }) {
  return (
    <span className={`inline-flex max-w-full break-words rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-normal ${className}`}>
      {label}
    </span>
  );
}

function Panel({ title, icon: Icon, children, action }) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon size={14} className="text-[#ea4f93]" /> : null}
          <h3 className="min-w-0 text-sm font-extrabold text-[#432744]">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
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
          <p className="break-words text-xs font-bold text-[#432744]">{booking.services.join(", ") || "--"}</p>
          <p className="mt-1 break-words text-[11px] text-[#8a7082]">{booking.uiBranch || "--"}</p>
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

        const message = loadError instanceof Error ? loadError.message : "Failed to load today's bookings.";
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
  }, [bookingPagination.currentPage, bookingPagination.pageSize, startDate, endDate, sessionUser?.staffId]);

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

  const metrics = useMemo(() => {
    return [
      {
        label: "Pending",
        value: dashboardData?.remainingAppointmentsCount || 0,
        note: "Remaining today",
        icon: CalendarDays,
        iconClassName: "bg-[#fff1f6] text-[#ea4f93]",
      },
      {
        label: "Completed",
        value: dashboardData?.completedAppointmentsCount || 0,
        note: "Appointments done",
        icon: ClipboardList,
        iconClassName: "bg-[#eefcf3] text-[#35b56b]",
      },
      {
        label: "Earnings",
        value: dashboardData?.estimatedEarnings ? `${dashboardData.estimatedEarnings.toLocaleString()} đ` : "0 đ",
        note: "Estimated total",
        icon: DollarSign,
        iconClassName: "bg-[#ecfdf5] text-[#10b981]",
      },
      {
        label: "Rating",
        value: dashboardData?.averageRatingScore || 0,
        note: "Average score",
        icon: Star,
        iconClassName: "bg-[#fffbeb] text-[#f59e0b]",
      },
      {
        label: "Next",
        value: dashboardData?.nextCustomer || "--",
        note: "Upcoming customer",
        icon: AlarmClock,
        iconClassName: "bg-[#edf7ff] text-[#4ea1ff]",
      },
    ];
  }, [dashboardData]);

  const earningsOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: dashboardData?.earningsTracker?.labels || [],
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: dashboardData?.earningsTracker?.datasets?.[0]?.data || [],
        type: 'line'
      }
    ]
  }), [dashboardData]);

  const serviceTimeOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: dashboardData?.serviceTimeEfficiency?.labels || [],
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: dashboardData?.serviceTimeEfficiency?.datasets?.[0]?.data || [],
        type: 'bar'
      }
    ]
  }), [dashboardData]);

  const skillRadarOption = useMemo(() => {
    if (!staffSkillsData || staffSkillsData.length === 0) return {};
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['Skill Level'],
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
          name: 'Skills',
          type: 'radar',
          data: [
            {
              value: staffSkillsData.map(skill => skill.level),
              name: 'Skill Level',
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
  }, [staffSkillsData]);

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
    toast.success("Dashboard layout reset to default");
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
                label={`${bookingPagination.totalItems} bookings`}
                className="border border-[#f6d3e3] bg-[#fff1f6] text-[#b48aa0]"
              />
            </div>
            <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
              {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm text-[#b38a9f]">
                  <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                  Loading today&apos;s schedule...
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
                        No bookings found for today.
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
                          Previous
                        </button>
                        <span className="text-xs font-bold text-[#866f80]">
                          Page {bookingPagination.currentPage}/{bookingPagination.totalPages}
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
                          Next
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
                      locale={{ emptyText: "No bookings found for today." }}
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
            {isDashboardLoading ? <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" /> : "No earnings data"}
          </div>
        );
      case 'serviceTimeEfficiency':
        return dashboardData?.serviceTimeEfficiency ? (
          <ReactECharts option={serviceTimeOption} style={{ height: isPinned ? '380px' : '280px', width: '100%' }} opts={{ renderer: 'svg' }} />
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-[#aa8a99]">
            {isDashboardLoading ? <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" /> : "No efficiency data"}
          </div>
        );
      case 'skillOverview':
        return staffSkillsData && staffSkillsData.length > 0 ? (
          <ReactECharts option={skillRadarOption} style={{ height: isPinned ? '380px' : '280px', width: '100%' }} opts={{ renderer: 'svg' }} />
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-[#aa8a99]">
            {isSkillsLoading ? <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" /> : "No skills data"}
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
                        <p className="text-xs font-medium text-slate-500">Client Name</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-medium italic text-slate-600 line-clamp-3 min-h-[60px]">
                      {fb.comment || "No comment provided."}
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
          <p className="text-sm text-[#8a7082] p-4">No recent feedback available.</p>
        );
      case 'myScheduleOutline':
        return dashboardData?.mySchedule && dashboardData.mySchedule.length > 0 ? (
          <div className="relative min-h-[600px] w-full overflow-y-auto overflow-x-hidden bg-white rounded-[20px] p-4">
            <div className="absolute top-0 left-0 w-full h-[840px] pointer-events-none">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="flex h-[60px] border-b border-slate-100/50">
                  <span className="w-16 text-xs text-slate-400 font-medium pt-2 pl-2">
                    {String(i + 8).padStart(2, '0')}.00
                  </span>
                </div>
              ))}
            </div>
            <div className="relative w-full h-[840px] ml-16 pr-4 pt-[10px]">
              {dashboardData.mySchedule.map((scheduleItem, idx) => {
                const [h, m] = scheduleItem.startTime.split(':').map(Number);
                const top = ((h - 8) * 60) + m;
                const height = Math.max(30, scheduleItem.durationMinutes);

                const colors = [
                  "bg-[#eef2ff] border-l-[#6366f1] text-[#4338ca]",
                  "bg-[#fff7ed] border-l-[#f97316] text-[#c2410c]",
                  "bg-[#ecfeff] border-l-[#06b6d4] text-[#0e7490]",
                ];
                const colorClass = colors[idx % colors.length];

                const endMins = m + scheduleItem.durationMinutes;
                const endH = h + Math.floor(endMins / 60);
                const endM = endMins % 60;
                const endTimeStr = `${String(endH).padStart(2, '0')}.${String(endM).padStart(2, '0')}`;

                return (
                  <Tooltip
                    key={idx}
                    placement="topLeft"
                    title={
                      <div className="text-xs">
                        <div><strong className="text-[#ea4f93]">Type:</strong> {scheduleItem.type}</div>
                        {scheduleItem.type === 'Booking' && <div><strong className="text-[#ea4f93]">Customer:</strong> {scheduleItem.customerName}</div>}
                        <div><strong className="text-[#ea4f93]">Duration:</strong> {scheduleItem.durationMinutes} min</div>
                      </div>
                    }
                  >
                    <div
                      className={`absolute left-2 right-2 rounded-r-md border-l-4 p-3 shadow-sm flex flex-col justify-center overflow-hidden transition-all hover:shadow-md cursor-pointer z-10 hover:z-20 ${colorClass}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <h4 className="text-xs font-bold leading-tight line-clamp-1">{scheduleItem.customerName || scheduleItem.type}</h4>
                      {height >= 40 && (
                        <div className="mt-1 flex items-center gap-1 opacity-80">
                          <Clock size={10} />
                          <span className="text-[10px]">{String(h).padStart(2, '0')}.{String(m).padStart(2, '0')} - {endTimeStr}</span>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8a7082] p-4">No schedule items available for selected dates.</p>
        );
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
        toast.success("Service started successfully.");
        openServiceSession(updatedBooking);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to start service.";
        toast.error(message);
      }
    };

    if (isInProgressBooking) {
      return [
        { key: "view", label: "View Booking", icon: Eye, onSelect: () => navigate(detailRoute) },
        {
          key: "continue",
          label: "Continue Service",
          icon: Play,
          onSelect: () => void openServiceSession(),
        },
        {
          key: "notes",
          label: "View Notes",
          icon: FileText,
          onSelect: () => setSelectedStaffNotesBooking(booking),
        },
      ];
    }

    return [
      { key: "view", label: "View Booking", icon: Eye, onSelect: () => navigate(detailRoute) },
      ...(!isCancelledBooking && !isPendingBooking && !isCompletedBooking && !isServiceCompletedBooking
        ? [{
          key: "start",
          label: "Start Service",
          icon: Play,
          onSelect: () => void startService(),
        }]
        : []),
      ...(!isCancelledBooking && !isPendingBooking && !isCheckedInBooking && !isCompletedBooking && !isServiceCompletedBooking
        ? [{
          key: "complete",
          label: "Complete Service",
          icon: SquareCheckBig,
          onSelect: () => navigate(detailRoute, { state: { staffAction: "complete" } }),
        }]
        : []),
      {
        key: "notes",
        label: "View Notes",
        icon: FileText,
        onSelect: () => setSelectedStaffNotesBooking(booking),
      },
    ];
  };

  const greetingName = sessionUser?.fullName || sessionUser?.email || "Artist";
  const tablePagination = useMemo(
    () => ({
      current: bookingPagination.currentPage,
      pageSize: bookingPagination.pageSize,
      total: bookingPagination.totalItems,
      showSizeChanger: true,
      pageSizeOptions: ["5", "10", "20", "50"],
      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bookings`,
    }),
    [bookingPagination.currentPage, bookingPagination.pageSize, bookingPagination.totalItems],
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
      title: "Date & Time",
      key: "time",
      render: (_, booking) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[#8a7082]">{formatDate(booking.bookingDateTime || booking.startTimeValue)}</span>
          <span className="text-sm font-bold text-[#3f2b3f]">{formatBookingWindow(booking)}</span>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
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
    // {
    //   title: "Service",
    //   key: "service",
    //   render: (_, booking) => <span className="text-sm text-[#6d5669]">{booking.services.join(", ") || "--"}</span>,
    // },
    // {
    //   title: "Design",
    //   key: "design",
    //   render: (_, booking) => (
    //     booking.previewImage ? (
    //       <img crossOrigin="anonymous"
    //         src={booking.previewImage}
    //         alt={booking.service}
    //         className="h-9 w-9 rounded-xl object-cover shadow-sm"
    //         loading="lazy"
    //         referrerPolicy="no-referrer"
    //       />
    //     ) : (
    //       <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1f6] text-[10px] font-bold text-[#ea4f93]">
    //         --
    //       </div>
    //     )
    //   ),
    // },
    {
      title: "Price",
      key: "price",
      render: (_, booking) => <span className="font-bold text-[#ea4f93]">{booking.totalPriceLabel || "--"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <StatusChip label={value} className={getStatusTone(value)} />,
    },
    {
      title: "Action",
      key: "action",
      render: (_, booking) => <ActionDropdown items={getActionItems(booking)} />,
    },
  ]), [getActionItems]);

  const hiddenWidgets = widgets.filter(w => !w.visible);

  const toggleHide = (id) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const layoutMenuProps = {
    items: [
      ...hiddenWidgets.map((w) => ({
        key: `restore-${w.id}`,
        label: `Show ${w.title}`,
        icon: <Eye size={16} />,
        onClick: () => toggleHide(w.id),
      })),
      hiddenWidgets.length > 0 ? { type: 'divider' } : null,
      {
        key: 'reset',
        label: 'Reset Layout',
        icon: <RotateCcw size={16} />,
        onClick: handleResetLayout,
        danger: true,
      }
    ].filter(Boolean),
  };

  return (
    <>
      <section className="flex min-h-full w-full min-w-0 flex-col gap-4 overflow-x-hidden bg-[linear-gradient(180deg,#fff9fc_0%,#fff5fa_100%)]">
        <div className="flex w-full min-w-0 flex-col gap-4 rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-3 shadow-[0_14px_30px_rgba(236,72,153,0.05)] sm:p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff9ccb_0%,#ea4f93_100%)] text-white shadow-md">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-[#432744]">Good morning, {greetingName}!</h1>
                <p className="text-sm text-[#b5859f]">Welcome to your dashboard overview.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                options={["Day", "Week", "Month", "Year"]}
                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  if (val === "Day") setDateRange([dayjs(), dayjs()]);
                  else if (val === "Week") setDateRange([dayjs().subtract(7, "day"), dayjs()]);
                  else if (val === "Month") setDateRange([dayjs().subtract(1, "month"), dayjs()]);
                  else setDateRange([dayjs().subtract(1, "year"), dayjs()]);
                }}
                className="bg-[#fff1f5] p-1 font-bold shadow-sm"
              />
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates || [dayjs(), dayjs()]);
                  setFilterMode("Custom");
                }}
                className="rounded-lg border-[#f2bfd4] font-bold text-[#432744] hover:border-[#ea4f93] focus:border-[#ea4f93] shadow-sm"
                style={{ padding: "6px 12px" }}
              />
              <Dropdown
                menu={layoutMenuProps}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="default" className="flex items-center gap-2 rounded-lg border-[#f2bfd4] font-bold text-[#8a7082] shadow-sm hover:border-[#ea4f93] hover:text-[#ea4f93]">
                  <Settings2 size={16} />
                  Customize
                </Button>
              </Dropdown>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#f2bfd4] bg-white px-4 py-2 text-sm font-bold text-[#ea4f93] shadow-sm hover:bg-[#fff9fc]"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-[16px] border border-[#f7d4df] bg-[#fff3f7] px-4 py-3 text-sm font-medium text-[#d14c84]">
              {error}
            </div>
          ) : null}

          <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((item) => (
              <MetricCard key={item.label} item={item} />
            ))}
          </div>

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

          <div className="grid w-full min-w-0 gap-4">
            <div className="min-w-0 space-y-4">
              {/* <div className="grid w-full min-w-0 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Current Customer">
                {currentBooking ? (
                  <>
                    <div className="flex items-start gap-3">
                      <img
                        src={buildAvatarDataUrl(currentBooking.customerName)}
                        alt={currentBooking.customerName}
                        className="h-12 w-12 rounded-full border border-[#f6d3e3]"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#432744]">{currentBooking.customerName}</p>
                        <p className="mt-1 break-words text-[11px] text-[#c28ca6]">
                          {currentBooking.uiId}
                          <span className="hidden sm:inline"> | </span>
                          <span className="block sm:inline">{formatDate(currentBooking.bookingDateTime)}</span>
                          <span className="hidden sm:inline"> | </span>
                          <span className="block sm:inline">{currentBooking.bookingTime}</span>
                        </p>
                        <StatusChip label={currentBooking.service} className="mt-2 bg-[#fff1f5] text-[#f06292]" />
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[18px] bg-[#f7eef4]">
                      {currentBooking.previewImage ? (
                        <img crossOrigin="anonymous"
                          src={currentBooking.previewImage}
                          alt={currentBooking.service}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center text-sm text-[#b38a9f]">
                          No reference image available
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-3 break-words text-[11px] leading-5 text-[#866d80]">
                      <div>
                        <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Services</p>
                        <p className="mt-1">{currentBooking.services.join(", ") || "--"}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Booking Status</p>
                        <p className="mt-1">{currentBooking.status}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Booked At</p>
                          <p className="mt-1">{currentBooking.bookingTime} | Est. {currentBooking.duration}</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Total</p>
                          <p className="mt-1">{currentBooking.totalPriceLabel}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#8a7082]">No current customer assigned.</p>
                )}
              </Panel>

              <Panel
                title="Performance Snapshot"
                action={(
                  <StatusChip
                    label="Today"
                    className="border border-[#f6d3e3] bg-[#fff1f6] text-[#b48aa0]"
                  />
                )}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [String(bookingPagination.totalItems), "Assigned Bookings", `${bookingPagination.totalPages} pages`],
                    [String(bookings.filter((booking) => booking.status === "Completed").length), "Completed", "Current page"],
                    [String(bookings.reduce((sum, booking) => sum + booking.services.length, 0)), "Service Items", "Current page"],
                    [formatCurrency(bookings.reduce((sum, booking) => sum + booking.totalPriceValue, 0)), "Revenue", `Page ${bookingPagination.currentPage}`],
                  ].map(([value, label, note]) => (
                    <div
                      key={label}
                      className="rounded-[16px] border border-[#f8dce8] bg-[#fff9fc] px-4 py-3"
                    >
                      <p className="text-xl font-extrabold text-[#ea4f93]">{value}</p>
                      <p className="mt-1 text-xs font-bold text-[#432744]">{label}</p>
                      <p className="mt-1 text-[11px] text-[#c28ca6]">{note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[18px] border border-[#f8dce8] bg-[#fff9fc] p-4">
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-[#ea4f93]" />
                    <p className="text-xs font-extrabold text-[#432744]">Revenue Breakdown</p>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-[#8a6f83]">
                    {sortedBookings.slice(0, 4).map((booking) => (
                      <div key={booking.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="break-words">{booking.customerName}</span>
                        <span className="font-bold text-[#ea4f93]">{booking.totalPriceLabel}</span>
                      </div>
                    ))}
                    {!sortedBookings.length ? <p className="text-[#b38a9f]">No revenue items for today.</p> : null}
                  </div>
                </div>
              </Panel>
            </div> */}
            </div>

            {/* <aside className="min-w-0 space-y-4">
            <Panel title="Next Customer" icon={Sparkles}>
              {nextBooking ? (
                <>
                  <div className="flex items-start gap-3">
                    <img crossOrigin="anonymous"
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nextBooking.customerName)}&background=fde7ef&color=8f365c&bold=true`}
                      alt={nextBooking.customerName}
                      className="h-11 w-11 rounded-full border border-[#f6d3e3]"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#432744]">{nextBooking.customerName}</p>
                      <p className="mt-1 break-words text-[11px] text-[#c28ca6]">{nextBooking.services.join(", ") || "--"}</p>
                    </div>
                  </div>

                  <div className="mt-4 break-words rounded-[14px] border border-[#f6d3e3] bg-[#fff1f5] px-3 py-2 text-xs font-bold text-[#ea4f93]">
                    {nextBooking.bookingTime} | {nextBooking.status}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      ["Duration", nextBooking.duration],
                      ["Price", nextBooking.totalPriceLabel],
                      ["Salon", nextBooking.uiBranch],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[14px] border border-[#f8dce8] bg-[#fff9fc] px-3 py-3 text-center"
                      >
                        <p className="text-[10px] text-[#c28ca6]">{label}</p>
                        <p className="mt-1 text-xs font-extrabold text-[#432744]">{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#8a7082]">No next customer scheduled.</p>
              )}
            </Panel> */}

            {/* <Panel title="Session Timer" icon={Clock3}>
              <div className="text-center">
                <p className="break-all text-[1.7rem] font-extrabold tracking-[0.04em] text-[#d94e85] sm:text-[2.2rem] sm:tracking-[0.08em]">
                  00:00:00
                </p>
                <p className="mt-2 text-[11px] text-[#c28ca6]">Session timer remains UI-only</p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white"
                >
                  Start Session
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-[#f6d3e3] bg-[#fff1f5] px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                >
                  Reset
                </button>
              </div>
            </Panel> */}

            {/* <Panel title="Break Schedule" icon={TimerReset}>
              <div className="space-y-3">
                {BREAK_SCHEDULE.map((item) => (
                  <div
                    key={item.time}
                    className="rounded-[14px] border border-[#f8dce8] bg-[#fff9fc] px-3 py-3"
                  >
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <p className="text-xs font-extrabold text-[#432744]">{item.time}</p>
                      <StatusChip label={item.badge} className={item.tone} />
                    </div>
                    <p className="mt-1 text-[11px] text-[#c28ca6]">{item.note}</p>
                  </div>
                ))}
              </div>
            </Panel> */}

            {/* <Panel title="Latest Review" icon={MessageSquareText}>
              <div className="flex items-center gap-1 text-[#f5a623]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={12} fill="currentColor" />
                ))}
              </div>

              <p className="mt-3 break-words text-[12px] leading-6 text-[#6f5b6d]">
                Review data is not returned by the booking API yet. This card remains a placeholder for staff feedback.
              </p>

              <div className="mt-4">
                <p className="text-xs font-extrabold text-[#ea4f93]">{currentBooking?.customerName || "--"}</p>
                <p className="mt-1 text-[11px] text-[#c28ca6]">{currentBooking?.bookingTime || "--"} session</p>
              </div>
            </Panel>
          </aside> */}
          </div>
        </div>
      </section>
      <StaffBookingNotesModal
        open={Boolean(selectedStaffNotesBooking)}
        booking={selectedStaffNotesBooking}
        onClose={() => setSelectedStaffNotesBooking(null)}
      />
    </>
  );
}

