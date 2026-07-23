import {
  CalendarDays,
  CircleDollarSign,
  Users,
  AlertCircle,
  Percent,
  Clock3,
  GripHorizontal,
  Pin,
  PinOff,
  EyeOff,
  Settings2,
  Eye,
  RotateCcw
} from "lucide-react";
import { Spin, Alert, DatePicker, Segmented, Modal, Avatar, Rate, Dropdown, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import {
  useManagerDashboard,
  useSalonStaffs,
  useNailArtistDashboard,
  useUserDetail
} from "../hooks/useAdminDashboard";
import { loadAuthSession } from "../../auth/model/authStorage";
import { PropTypes } from "../../../../shared/utils/propTypes";
import ReactECharts from "echarts-for-react";

// Admin/Tech Light Theme Palette
const THEME_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"];
const TEXT_PRIMARY = "#1e293b";
const TEXT_SECONDARY = "#64748b";
const BORDER_COLOR = "#e2e8f0";
const GRID_COLOR = "#f1f5f9";

const getSalonId = () => {
  const session = loadAuthSession();
  return session?.user?.salonId || session?.salonId;
};

const defaultWidgets = [
  { id: 'revenueBreakdown', title: 'Revenue Breakdown', visible: true, pinned: false },
  { id: 'keyRatios', title: 'Key Ratios', visible: true, pinned: false },
  { id: 'retentionRate', title: 'Customer Retention Rate', visible: true, pinned: false },
  { id: 'peakHours', title: 'Peak Hours Heatmap', visible: true, pinned: false },
  { id: 'artistLeaderboard', title: 'Artist Leaderboard', visible: true, pinned: false },
  { id: 'staffLeaveAlerts', title: 'Staff Leave Alerts', visible: true, pinned: false },
  { id: 'staffDirectory', title: 'Staff Directory', visible: true, pinned: false },
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

function WidgetWrapper({ id, widget, onPin, onHide, onDragStart, onDragOver, onDrop, onDragEnter, children, isPinned, fullWidth }) {
  return (
    <div
      draggable={!isPinned}
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={`relative group h-full flex flex-col ${isPinned ? 'col-span-full' : (fullWidth ? 'lg:col-span-2' : '')}`}
    >
      <Card className={`flex flex-col h-full ${isPinned ? 'min-h-[400px]' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {!isPinned && (
              <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                <GripHorizontal size={18} />
              </div>
            )}
            <h3 className={`font-bold text-slate-800 ${isPinned ? 'text-[18px]' : 'text-[15px]'}`}>{widget.title}</h3>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onPin(id)}
              className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors"
              title={isPinned ? "Unpin widget" : "Pin to top"}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button
              onClick={() => onHide(id)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
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
  fullWidth: PropTypes.bool,
};

export function ManagerDashboardPage() {
  const salonId = getSalonId();
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [filterMode, setFilterMode] = useState("Week");
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('managerDashboardWidgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return defaultWidgets;
  });

  const [draggedWidgetId, setDraggedWidgetId] = useState(null);

  useEffect(() => {
    localStorage.setItem('managerDashboardWidgets', JSON.stringify(widgets));
  }, [widgets]);

  const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
  const endDate = dateRange?.[1]?.format("YYYY-MM-DD");

  let groupBy = "Day";
  if (filterMode === "Year") {
    groupBy = "Month";
  } else if (filterMode === "Month") {
    groupBy = "Day";
  }

  const { data, isLoading, isError } = useManagerDashboard(salonId, startDate, endDate, groupBy);
  const { data: staffData, isLoading: isStaffLoading } = useSalonStaffs(salonId);

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    const today = dayjs();
    switch (mode) {
      case "Day":
        setDateRange([today, today]);
        break;
      case "Week":
        setDateRange([today.subtract(7, 'day'), today]);
        break;
      case "Month":
        setDateRange([today.startOf('month'), today.endOf('month')]);
        break;
      case "Year":
        setDateRange([today.startOf('year'), today.endOf('year')]);
        break;
      default:
        break;
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (dates) {
      setFilterMode("Custom");
    }
  };

  const handleDragStart = (e, id) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) return;

    setWidgets((prev) => {
      const newWidgets = [...prev];
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidgetId);
      const targetIndex = newWidgets.findIndex(w => w.id === targetId);

      const [draggedItem] = newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, draggedItem);
      return newWidgets;
    });
    setDraggedWidgetId(null);
  };

  const handleDragEnter = (e, id) => {
    e.preventDefault();
  };

  const togglePin = (id) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, pinned: !w.pinned } : w));
  };

  const toggleHide = (id) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const resetLayout = () => {
    setWidgets(defaultWidgets);
  };

  if (!salonId) {
    return (
      <div className="p-10 max-w-2xl mx-auto">
        <Alert message="Salon Missing" description="No salon assigned to this manager." type="error" showIcon />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 max-w-2xl mx-auto bg-slate-50">
        <Alert message="System Error" description="Unable to load manager dashboard data. Please check your connection." type="error" showIcon />
      </div>
    );
  }

  const completed = data?.totalCompletedBookings || 0;
  const pending = data?.totalPendingBookings || 0;
  const completionRate = (completed + pending) > 0 ? (completed / (completed + pending)) * 100 : 0;

  const topMetrics = [
    { label: "Today's Revenue", value: data?.todaysRevenue ? `${data.todaysRevenue.toLocaleString("vi-VN")} ₫` : "0 ₫", color: "#0ea5e9" },
    { label: "Avg Ticket Value", value: data?.averageTicketValue ? `${data.averageTicketValue.toLocaleString("vi-VN")} ₫` : "0 ₫", color: "#10b981" },
    { label: "Completed Bookings", value: completed, color: "#f59e0b" },
    { label: "Pending Bookings", value: pending, color: "#8b5cf6" },
    { label: "Staff Utilization", value: data?.staffUtilizationRate ? `${data.staffUtilizationRate.toFixed(1)}%` : "0%", color: "#ec4899" },
  ];

  // ==========================================
  // ECharts Configurations
  // ==========================================
  const commonTooltip = { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: BORDER_COLOR, borderWidth: 1, padding: 12, textStyle: { color: TEXT_PRIMARY, fontSize: 12, fontFamily: 'sans-serif' } };
  const commonAxisLabel = { color: TEXT_SECONDARY, fontSize: 11, fontFamily: 'sans-serif' };
  const commonSplitLine = { lineStyle: { type: 'dashed', color: GRID_COLOR } };

  const revenueBreakdownOption = {
    color: THEME_COLORS,
    tooltip: { ...commonTooltip, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: { color: TEXT_SECONDARY, fontSize: 11 }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['65%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: data?.revenueBreakdown?.labels?.map((label, i) => ({
          name: label,
          value: data.revenueBreakdown.datasets[0].data[i]
        })) || []
      }
    ]
  };

  const createRingOption = (value, name, color) => ({
    series: [
      {
        type: 'pie',
        radius: ['75%', '90%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        hoverAnimation: false,
        label: {
          show: true,
          position: 'center',
          formatter: `${value.toFixed(0)}%`,
          fontSize: 20,
          fontWeight: 'bold',
          color: TEXT_PRIMARY
        },
        data: [
          { value: value, name: name, itemStyle: { color: color } },
          { value: 100 - value, name: '', itemStyle: { color: GRID_COLOR }, tooltip: { show: false } }
        ]
      }
    ]
  });

  const staffUtilOption = createRingOption(data?.staffUtilizationRate || 0, 'Staff Utilization', '#10b981');
  const cancelRateOption = createRingOption(data?.cancellationRate || 0, 'Cancellation Rate', '#0ea5e9');
  const completionRateOption = createRingOption(completionRate, 'Completion Rate', '#6366f1');

  const retentionOption = {
    color: ['#0ea5e9'],
    tooltip: { ...commonTooltip, trigger: 'axis' },
    grid: { left: '2%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data?.customerRetentionRate?.labels || [], axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    yAxis: { type: 'value', axisLabel: { ...commonAxisLabel, formatter: '{value}%' }, splitLine: commonSplitLine },
    series: [
      {
        name: 'Retention',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: '#0ea5e9' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(14,165,233,0.3)' }, { offset: 1, color: 'rgba(14,165,233,0)' }]
          }
        },
        data: data?.customerRetentionRate?.datasets?.[0]?.data || []
      }
    ]
  };

  const peakHoursOption = {
    color: ['#f59e0b', '#10b981', '#6366f1'],
    tooltip: { ...commonTooltip, trigger: 'axis' },
    legend: { top: 0, right: 0, icon: 'circle', textStyle: { color: TEXT_SECONDARY, fontSize: 11 } },
    grid: { left: '2%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: data?.peakHoursHeatmap?.labels || [], axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    yAxis: { type: 'value', axisLabel: commonAxisLabel, splitLine: commonSplitLine },
    series: [
      {
        name: 'Bookings',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        data: data?.peakHoursHeatmap?.datasets?.[0]?.data || []
      }
    ]
  };

  const renderWidgetContent = (id, isPinned) => {
    switch (id) {
      case 'revenueBreakdown':
        return <ReactECharts option={revenueBreakdownOption} style={{ height: isPinned ? '350px' : '280px', width: '100%' }} opts={{ renderer: 'svg' }} />;
      case 'keyRatios':
        return (
          <div className={`flex ${isPinned ? 'h-[350px]' : 'h-[280px]'} items-center justify-around w-full`}>
            <div className="flex flex-col items-center w-1/3">
              <ReactECharts option={staffUtilOption} style={{ height: isPinned ? '250px' : '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
              <span className="text-[13px] font-bold text-slate-600 mt-[-20px]">Staff Util</span>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <ReactECharts option={cancelRateOption} style={{ height: isPinned ? '250px' : '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
              <span className="text-[13px] font-bold text-slate-600 mt-[-20px]">Cancel Rate</span>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <ReactECharts option={completionRateOption} style={{ height: isPinned ? '250px' : '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
              <span className="text-[13px] font-bold text-slate-600 mt-[-20px]">Completion</span>
            </div>
          </div>
        );
      case 'retentionRate':
        return <ReactECharts option={retentionOption} style={{ height: isPinned ? '350px' : '280px', width: '100%' }} opts={{ renderer: 'svg' }} />;
      case 'peakHours':
        return <ReactECharts option={peakHoursOption} style={{ height: isPinned ? '350px' : '280px', width: '100%' }} opts={{ renderer: 'svg' }} />;
      case 'artistLeaderboard':
        return (
          <div className="flex-1 overflow-auto h-full w-full">
            <table className="min-w-full text-left border-collapse w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3 font-bold">Artist Name</th>
                  <th className="px-3 py-3 font-bold text-center">Bookings</th>
                  <th className="px-3 py-3 font-bold text-right">Revenue</th>
                  <th className="px-3 py-3 font-bold text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {[...(data?.artistPerformanceLeaderboard || [])]
                  .sort((a, b) => (b.completedBookings || 0) - (a.completedBookings || 0))
                  .map((artist, i) => (
                    <tr
                      key={artist.artistId || i}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        const matchedStaff = staffData?.items?.find(s => s.staffId === artist.artistId) || { staffId: artist.artistId, firstName: artist.artistName };
                        setSelectedStaff(matchedStaff);
                      }}
                    >
                      <td className="px-3 py-3 text-[13px] font-bold text-slate-800">{artist.artistName}</td>
                      <td className="px-3 py-3 text-[13px] font-semibold text-center text-slate-600">{artist.completedBookings}</td>
                      <td className="px-3 py-3 text-[13px] font-bold text-right text-emerald-600">{artist.revenueGenerated.toLocaleString("vi-VN")} ₫</td>
                      <td className="px-3 py-3 text-[13px] font-bold text-center text-amber-500">
                        <div className="flex items-center justify-center gap-1">
                          <Rate disabled allowHalf value={artist.averageRating} className="text-[12px] text-amber-400" />
                        </div>
                      </td>
                    </tr>
                  ))}
                {(!data?.artistPerformanceLeaderboard || data.artistPerformanceLeaderboard.length === 0) && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-sm text-slate-500">No artist data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'staffLeaveAlerts':
        return (
          <div className="flex flex-col gap-3 h-full overflow-auto pr-2 w-full">
            {data?.staffLeaveAlerts?.length > 0 ? (
              data.staffLeaveAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700 shrink-0">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">{alert.artistName}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs font-medium">
                      <span>Date: {dayjs(alert.breakDate).format("DD/MM/YYYY")}</span>
                      <span>Time: {alert.startTime} - {alert.endTime}</span>
                    </div>
                    <p className="mt-1 text-xs opacity-90 truncate max-w-[400px]" title={alert.reason}>
                      Reason: {alert.reason}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm font-medium text-slate-500 w-full">
                No leave alerts for this period.
              </div>
            )}
          </div>
        );
      case 'staffDirectory':
        const getInitials = (firstName, lastName) =>
          `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
        return (
          <div className="flex-1 h-full overflow-auto w-full">
            {isStaffLoading ? (
              <div className="flex items-center justify-center py-10 h-full">
                <Spin />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {staffData?.items?.map((staff) => (
                  <div
                    key={staff.userId}
                    className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:shadow-md cursor-pointer transition-all bg-white hover:border-sky-200"
                    onClick={() => setSelectedStaff(staff)}
                  >
                    <StaffAvatar
                      staff={staff}
                      size={56}
                      className="mb-2 border border-slate-100 !bg-pink-500 !text-white font-bold shadow-sm"
                    />
                    <span className="text-sm font-bold text-slate-800 text-center line-clamp-1 w-full">{staff.firstName} {staff.lastName}</span>
                    <span className="text-xs text-slate-500 font-medium">{staff.email}</span>
                  </div>
                ))}
                {(!staffData?.items || staffData.items.length === 0) && (
                  <div className="col-span-full text-center py-6 text-sm text-slate-500 w-full">
                    No staff members found.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const hiddenWidgets = widgets.filter(w => !w.visible);

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
        onClick: resetLayout,
        danger: true,
      }
    ].filter(Boolean),
  };

  const pinnedWidgets = widgets.filter(w => w.pinned && w.visible);
  const unpinnedWidgets = widgets.filter(w => !w.pinned && w.visible);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 bg-white px-8 py-5 shadow-sm border-b border-slate-200 md:flex-row md:items-center md:justify-between z-10 sticky top-0">
        <div>
          <h1 className="text-[22px] font-black tracking-tight text-slate-900">Manager Dashboard</h1>
          <p className="text-[13px] text-slate-500 font-medium">Overview of salon operations</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Dropdown menu={layoutMenuProps} trigger={['click']} placement="bottomRight">
            <Button icon={<Settings2 size={16} className="text-slate-500" />} className="border-slate-200 font-medium text-slate-700 bg-white shadow-sm">
              Customize
            </Button>
          </Dropdown>
          <Segmented
            options={["Day", "Week", "Month", "Year", "Custom"]}
            value={filterMode}
            onChange={handleFilterModeChange}
            className="rounded-md bg-slate-100 p-1 font-semibold"
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            className="rounded-md border-slate-200 hover:border-sky-500 focus:border-sky-500"
            format="YYYY-MM-DD"
          />
        </div>
      </div>

      <div className="p-8 space-y-6 mx-auto w-full bg-[radial-gradient(circle_at_top_right,rgba(255,227,160,.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,193,220,.22),transparent_35%),linear-gradient(to_right,#f7dbe7_1px,transparent_1px),linear-gradient(to_bottom,#f7dbe7_1px,transparent_1px)]">
        {/* Top Metrics Row */}
        <div className="flex flex-wrap justify-between gap-4 py-4 px-2">
          {topMetrics.map((metric, i) => (
            <div key={i} className="flex flex-1 min-w-[150px] flex-col items-center justify-center relative bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <span className="text-[28px] font-black tracking-tight" style={{ color: TEXT_PRIMARY }}>
                {metric.value}
              </span>
              <span className="text-[13px] font-bold mt-1 text-center" style={{ color: TEXT_SECONDARY }}>
                {metric.label}
              </span>
              <div
                className="mt-4 h-1 w-full max-w-[120px] rounded-full opacity-80"
                style={{ backgroundColor: metric.color, boxShadow: `0 2px 10px ${metric.color}80` }}
              />
            </div>
          ))}
        </div>

        {/* Pinned Widgets Section */}
        {pinnedWidgets.length > 0 && (
          <div className="flex flex-col gap-6">
            {pinnedWidgets.map((widget) => (
              <WidgetWrapper
                key={widget.id}
                id={widget.id}
                widget={widget}
                isPinned={true}
                onPin={togglePin}
                onHide={toggleHide}
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

        {/* Unpinned Widgets Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {unpinnedWidgets.map((widget) => (
            <WidgetWrapper
              key={widget.id}
              id={widget.id}
              widget={widget}
              isPinned={false}
              onPin={togglePin}
              onHide={toggleHide}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={handleDrop}
              fullWidth={widget.id === 'staffDirectory'}
            >
              {renderWidgetContent(widget.id, false)}
            </WidgetWrapper>
          ))}
        </div>
      </div>

      {/* Staff Detail Modal */}
      <StaffDetailModal
        staff={selectedStaff}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setSelectedStaff(null)}
      />
    </div>
  );
}

const StaffAvatar = ({ staff, size = 56, className }) => {
  const [error, setError] = useState(false);
  const getInitials = (f, l) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();

  useEffect(() => {
    setError(false);
  }, [staff.avatarUrl]);

  return (
    <Avatar
      size={size}
      src={!error ? staff.avatarUrl : undefined}
      onError={() => {
        setError(true);
        return false;
      }}
      className={className}
    >
      {getInitials(staff.firstName, staff.lastName)}
    </Avatar>
  );
};

// Staff Detail Modal Component
function StaffDetailModal({ staff, startDate, endDate, onClose }) {
  const { data: userDetail, isLoading: isUserLoading } = useUserDetail(staff?.userId);
  const { data: dashboard, isLoading: isDashboardLoading } = useNailArtistDashboard(staff?.staffId, startDate, endDate);

  const isLoading = isUserLoading || isDashboardLoading;

  const [avatarError, setAvatarError] = useState(false);
  const getInitials = (fullName) =>
    fullName
      ?.trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  useEffect(() => {
    setAvatarError(false);
  }, [staff]);

  const getChartData = () => {
    let labels = dashboard?.earningsTracker?.labels || [];
    let data = dashboard?.earningsTracker?.datasets?.[0]?.data || [];

    if (labels.length === 0 && startDate && endDate) {
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      const diff = end.diff(start, 'day');
      
      labels = [];
      data = [];
      
      if (diff >= 0 && diff <= 31) {
        for (let i = 0; i <= diff; i++) {
          labels.push(start.add(i, 'day').format('DD/MM'));
          data.push(0);
        }
      } else {
        labels = [start.format('DD/MM/YY'), end.format('DD/MM/YY')];
        data = [0, 0];
      }
    }
    return { labels, data };
  };

  const chartData = getChartData();

  return (
    <Modal
      title={<span className="text-slate-800 font-bold">Staff Information</span>}
      open={!!staff}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={500}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spin />
        </div>
      ) : (
        <div className="flex flex-col gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center gap-4">
            <Avatar
              size={64}
              src={!avatarError ? userDetail?.avatarUrl : undefined}
              onError={() => {
                setAvatarError(true);
                return false;
              }}
              className="shrink-0 border border-slate-200 !bg-pink-500 text-white font-bold"
            >
              {getInitials(`${userDetail?.firstName || ""} ${userDetail?.lastName || ""}`)}
            </Avatar>
            <div>
              <h3 className="text-[17px] font-black text-slate-800">{userDetail?.firstName} {userDetail?.lastName}</h3>
              <p className="text-[13px] font-medium text-slate-500">{userDetail?.email}</p>
              <p className="text-[13px] font-medium text-slate-500">{userDetail?.phone || "No phone number"}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <h4 className="text-[13px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Performance ({dayjs(startDate).format("DD/MM/YY")} - {dayjs(endDate).format("DD/MM/YY")})</h4>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-[14px] font-semibold text-slate-700">Estimated Earnings</span>
                <span className="font-black text-emerald-600 text-[18px]">
                  {dashboard?.estimatedEarnings ? dashboard.estimatedEarnings.toLocaleString("vi-VN") : "0"} ₫
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[14px] font-medium text-slate-600">Completed Appointments</span>
                <span className="font-bold text-slate-800">{dashboard?.completedAppointmentsCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[14px] font-medium text-slate-600">Average Rating</span>
                <div className="flex items-center gap-2">
                  <Rate disabled allowHalf value={dashboard?.averageRatingScore || 0} className="text-amber-400 text-sm" />
                  <span className="font-bold text-amber-500">{dashboard?.averageRatingScore || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {dashboard && (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <h4 className="text-[13px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Earnings Tracker</h4>
              <ReactECharts
                option={{
                  color: ['#10b981'],
                  tooltip: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderWidth: 1, padding: 12, textStyle: { color: '#1e293b', fontSize: 12, fontFamily: 'sans-serif' }, trigger: 'axis' },
                  grid: { left: '2%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
                  xAxis: { type: 'category', boundaryGap: false, data: chartData.labels, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'sans-serif' } },
                  yAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'sans-serif' }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } },
                  series: [
                    {
                      name: 'Earnings',
                      type: 'line',
                      smooth: true,
                      showSymbol: false,
                      lineStyle: { width: 2, color: '#10b981' },
                      areaStyle: {
                        color: {
                          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                          colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.3)' }, { offset: 1, color: 'rgba(16,185,129,0)' }]
                        }
                      },
                      data: chartData.data
                    }
                  ]
                }}
                style={{ height: '220px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          )}

          {dashboard?.recentFeedback?.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <h4 className="text-[13px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Recent Feedback</h4>
              <div className="flex flex-col gap-3">
                {dashboard.recentFeedback.map((fb, idx) => (
                  <div key={idx} className="flex gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-sky-100">
                    <Avatar className="bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-bold shrink-0 mt-0.5 shadow-sm">
                      {getInitials(fb.customerName)?.slice(0, 2) || "U"}
                    </Avatar>
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-[13px] text-slate-800 block">{fb.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{dayjs(fb.date).format("MMM DD, YYYY • HH:mm")}</span>
                        </div>
                        <div className="bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center">
                          <Rate disabled allowHalf value={fb.score} className="text-[10px] text-amber-500 m-0" />
                        </div>
                      </div>
                      {fb.comment && (
                        <div className="mt-2.5 bg-slate-50 p-2.5 rounded-lg text-[12px] text-slate-600 border border-slate-100 leading-relaxed italic relative">
                          "{fb.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
