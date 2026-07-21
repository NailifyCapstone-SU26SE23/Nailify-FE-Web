import {
  CalendarDays,
  CircleDollarSign,
  Users,
  AlertCircle,
  Percent,
  Clock3,
} from "lucide-react";
import { Spin, Alert, DatePicker, Segmented } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useManagerDashboard } from "../hooks/useAdminDashboard";
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

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

export function ManagerDashboardPage() {
  const salonId = getSalonId();
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [filterMode, setFilterMode] = useState("Week");

  const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
  const endDate = dateRange?.[1]?.format("YYYY-MM-DD");

  let groupBy = "Day";
  if (filterMode === "Year") {
    groupBy = "Month";
  } else if (filterMode === "Month") {
    groupBy = "Day";
  }

  const { data, isLoading, isError } = useManagerDashboard(salonId, startDate, endDate, groupBy);

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

  // 1. Revenue Breakdown (Donut)
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

  // Helper for Circular Progress Ring
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

  // 3. Customer Retention Rate (Smooth Line, like image left bottom)
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

  // 4. Peak Hours (Line chart with markers, like image right bottom)
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Header & Controls */}
      <div className="mb-4 flex flex-col gap-4 bg-white px-8 py-5 shadow-sm border-b border-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[22px] font-black tracking-tight text-slate-900">Manager Dashboard</h1>
          <p className="text-[13px] text-slate-500 font-medium">Overview of salon operations</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

      <div className="p-8 pt-2 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Top Metrics Row (Inspired by the image layout) */}
        <div className="flex flex-wrap justify-between gap-4 py-4 px-2">
          {topMetrics.map((metric, i) => (
            <div key={i} className="flex flex-1 min-w-[150px] flex-col items-center justify-center relative">
              <span className="text-[28px] font-black tracking-tight" style={{ color: TEXT_PRIMARY }}>
                {metric.value}
              </span>
              <span className="text-[13px] font-bold mt-1" style={{ color: TEXT_SECONDARY }}>
                {metric.label}
              </span>
              <div 
                className="mt-4 h-1 w-full max-w-[120px] rounded-full opacity-80" 
                style={{ backgroundColor: metric.color, boxShadow: `0 2px 10px ${metric.color}80` }}
              />
            </div>
          ))}
        </div>

        {/* Middle Row: Donut Chart & Rings */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionHeading title="Revenue Breakdown" />
            <ReactECharts option={revenueBreakdownOption} style={{ height: '280px' }} opts={{ renderer: 'svg' }} />
          </Card>
          
          <Card>
            <SectionHeading title="Key Ratios" />
            <div className="flex h-[280px] items-center justify-around">
              <div className="flex flex-col items-center w-1/3">
                <ReactECharts option={staffUtilOption} style={{ height: '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
                <span className="text-[13px] font-bold text-slate-600 mt-[-20px]">Staff Util</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <ReactECharts option={cancelRateOption} style={{ height: '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
                <span className="text-[13px] font-bold text-slate-600 mt-[-20px]">Cancel Rate</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <ReactECharts option={completionRateOption} style={{ height: '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
                <span className="text-[13px] font-bold text-slate-600 mt-[-20px]">Completion</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Row: Line Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionHeading title="Customer Retention Trend" />
            <ReactECharts option={retentionOption} style={{ height: '300px' }} opts={{ renderer: 'svg' }} />
          </Card>
          
          <Card>
            <SectionHeading title="Peak Hours Heatmap" />
            <ReactECharts option={peakHoursOption} style={{ height: '300px' }} opts={{ renderer: 'svg' }} />
          </Card>
        </div>

        {/* Tables Row: Leaderboard & Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <SectionHeading title="Artist Leaderboard" />
            <div className="flex-1 overflow-auto mt-2">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3 font-bold">Artist Name</th>
                    <th className="px-3 py-3 font-bold text-center">Bookings</th>
                    <th className="px-3 py-3 font-bold text-right">Revenue</th>
                    <th className="px-3 py-3 font-bold text-center">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.artistPerformanceLeaderboard?.map((artist, i) => (
                    <tr key={artist.artistId || i} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 text-[13px] font-bold text-slate-800">{artist.artistName}</td>
                      <td className="px-3 py-3 text-[13px] font-semibold text-center text-slate-600">{artist.completedBookings}</td>
                      <td className="px-3 py-3 text-[13px] font-bold text-right text-emerald-600">{artist.revenueGenerated.toLocaleString("vi-VN")} ₫</td>
                      <td className="px-3 py-3 text-[13px] font-bold text-center text-amber-500">{artist.averageRating} / 5</td>
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
          </Card>

          <Card>
            <SectionHeading title="Staff Leave Alerts" />
            {data?.staffLeaveAlerts?.length > 0 ? (
              <div className="flex flex-col gap-3 mt-4">
                {data.staffLeaveAlerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
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
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm font-medium text-slate-500">
                No leave alerts for this period.
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
