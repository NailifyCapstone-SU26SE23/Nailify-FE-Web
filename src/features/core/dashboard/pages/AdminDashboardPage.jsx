import {
  CircleDollarSign,
  Store,
  UserRound,
  Users,
  X,
  Activity,
  GripHorizontal,
  Pin,
  PinOff,
  EyeOff,
  Settings2,
  Eye,
  RotateCcw
} from "lucide-react";
import { Modal, Table, Spin, Alert, DatePicker, Segmented, Dropdown, Button } from "antd";
import dayjs from "dayjs";
import { useMemo, useState, useEffect } from "react";
import { useAdminDashboard, useSalonDetails, useManagersList, useSalonsList, useSalonStaffByRole } from "../hooks/useAdminDashboard";
import { PropTypes } from "../../../../shared/utils/propTypes";
import ReactECharts from "echarts-for-react";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

// Technical Light Theme Palette
const TECH_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16"];
const TEXT_PRIMARY = "#1e293b";
const TEXT_SECONDARY = "#64748b";
const BORDER_COLOR = "#e2e8f0";
const GRID_COLOR = "#f1f5f9";

function Card({ className = "", children }) {
  return (
    <article
      className={`bg-white border border-slate-200 p-5 shadow-sm rounded-lg ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

const defaultWidgets = [
  { id: 'globalServicePopularity', title: 'Global Service Popularity', subtitle: 'Referer dataset analysis', visible: true, pinned: false },
  { id: 'salonRatingDistribution', title: 'Salon Rating Distribution', subtitle: 'Radar dimensional analysis', visible: true, pinned: false },
  { id: 'revenueTrend', title: 'Revenue Trend', subtitle: 'Stacked timeline series', visible: true, pinned: false },
  { id: 'userGrowth', title: 'User Growth', subtitle: 'Race tracking metrics', visible: true, pinned: false },
  { id: 'globalPromotionPerformance', title: 'Global Promotion Performance', subtitle: 'Shared dataset comparative', visible: true, pinned: false },
  { id: 'topPerformingSalons', title: 'Top Performing Salons', subtitle: 'Top performing salons by revenue', visible: true, pinned: false },
  { id: 'rankedSalons', title: 'Ranked Salons by Revenue', subtitle: 'Live active salon revenue', visible: true, pinned: false },
];

function WidgetWrapper({ id, widget, onPin, onHide, onDragStart, onDragOver, onDrop, onDragEnter, children, isPinned }) {
  const { t, language } = useLanguage();
  const isFullWidth = ['rankedSalons'].includes(id);

  return (
    <div
      draggable={!isPinned}
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={`relative group h-full flex flex-col ${isPinned ? 'col-span-full' : (isFullWidth ? 'lg:col-span-2' : '')}`}
    >
      <Card className={`flex flex-col h-full ${isPinned ? 'min-h-[450px]' : 'h-[380px]'}`}>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            {!isPinned && (
              <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                <GripHorizontal size={18} />
              </div>
            )}
            <div>
              <h3 className={`font-bold text-slate-800 uppercase tracking-widest ${isPinned ? 'text-[15px]' : 'text-sm'}`}>
                {t(`adminDashboard.widgets.${id}`) || widget.title}
              </h3>
              {widget.subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{widget.subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onPin(id)}
              className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors"
              title={isPinned ? t("adminDashboard.widgetActions.unpin") : t("adminDashboard.widgetActions.pin")}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button
              onClick={() => onHide(id)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title={t("adminDashboard.widgetActions.hide")}
            >
              <EyeOff size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col w-full">
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

export function AdminDashboardPage() {
  const { t, language } = useLanguage();
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [filterMode, setFilterMode] = useState("Week");

  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('adminDashboardWidgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to defaultWidgets
      }
    }
    return defaultWidgets;
  });

  const [draggedWidgetId, setDraggedWidgetId] = useState(null);

  useEffect(() => {
    localStorage.setItem('adminDashboardWidgets', JSON.stringify(widgets));
  }, [widgets]);

  const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
  const endDate = dateRange?.[1]?.format("YYYY-MM-DD");

  let groupBy = "Day";
  if (filterMode === "Year") {
    groupBy = "Month";
  } else if (filterMode === "Month") {
    groupBy = "Day";
  }

  const { data, isLoading, isError } = useAdminDashboard(startDate, endDate, groupBy);
  const { data: salonDetails, isLoading: isLoadingSalon } = useSalonDetails(selectedSalonId);
  const { data: managersList } = useManagersList();
  const { data: salonsList } = useSalonsList();

  const { data: salonManagers } = useSalonStaffByRole(selectedSalonId, "Manager");
  const { data: salonReceptionists } = useSalonStaffByRole(selectedSalonId, "Receptionist");
  const { data: salonStaffArtists } = useSalonStaffByRole(selectedSalonId, "Staff_Artist");

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

  const handleDragEnter = (e) => {
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

  const salonPerformanceRows = useMemo(() => {
    if (!salonsList) return [];
    return salonsList.map((salon) => {
      const salonId = salon.salonId || salon.id;
      const salonName = salon.name;
      let revenue = 0;
      if (data?.topPerformingSalons?.labels) {
        const topIndex = data.topPerformingSalons.labels.findIndex(label =>
          label.trim().toLowerCase() === salonName.trim().toLowerCase()
        );
        if (topIndex !== -1) {
          revenue = data.topPerformingSalons.datasets[0].data[topIndex];
        }
      }
      let managerName = "N/A";
      if (salonId && managersList?.items) {
        const manager = managersList.items.find(m => m.salonId === salonId);
        if (manager) {
          managerName = `${manager.firstName} ${manager.lastName}`;
        }
      }
      return { id: salonId, name: salonName, manager: managerName, revenue: revenue, originalId: salonId };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [data, salonsList, managersList]);

  const salonPerformanceColumns = useMemo(() => ([
    {
      title: t("adminDashboard.table.salon").toUpperCase(),
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (_, salon) => (
        <div>
          <p className="font-bold text-slate-800 text-sm">{salon.name}</p>
        </div>
      ),
    },
    {
      title: t("adminDashboard.table.manager").toUpperCase(),
      dataIndex: "manager",
      key: "manager",
      sorter: (a, b) => (a.manager || "").localeCompare(b.manager || ""),
      render: (value) => <span className="text-sm font-bold text-slate-800">{value}</span>,
    },
    {
      title: t("adminDashboard.table.revenue").toUpperCase(),
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a, b) => (a.revenue || 0) - (b.revenue || 0),
      render: (value) => <span className="text-sm font-mono text-emerald-600">{value ? value.toLocaleString("vi-VN") + " ₫" : "0 ₫"}</span>,
    },
    {
      title: t("userManagement.table.actions").toUpperCase(),
      key: "action",
      render: (_, salon) => (
        <button
          type="button"
          onClick={() => salon.originalId && setSelectedSalonId(salon.originalId)}
          className={`text-[10px] font-bold uppercase tracking-widest border-b transition-colors ${salon.originalId ? 'text-sky-600 hover:text-sky-800 border-transparent hover:border-sky-800' : 'text-slate-400 border-transparent cursor-not-allowed'}`}
          disabled={!salon.originalId}
        >
          {t("view") || "VIEW"}
        </button>
      ),
    },
  ]), [t]);

  const topSalonsData = useMemo(() => {
    if (!salonsList) return [];
    return salonsList.map((salon) => {
      let revenue = 0;
      if (data?.topPerformingSalons?.labels) {
        const topIndex = data.topPerformingSalons.labels.findIndex(label =>
          label.trim().toLowerCase() === salon.name.trim().toLowerCase()
        );
        if (topIndex !== -1) {
          revenue = data.topPerformingSalons.datasets[0].data[topIndex];
        }
      }
      return { name: salon.name, value: revenue };
    }).sort((a, b) => a.value - b.value);
  }, [salonsList, data]);

  const salonRatingData = useMemo(() => {
    if (!salonsList) return [];
    return salonsList.map((salon) => {
      let rating = 0;
      if (data?.salonRatingDistribution?.length) {
        const found = data.salonRatingDistribution.find(r =>
          r.salonName.trim().toLowerCase() === salon.name.trim().toLowerCase()
        );
        if (found) {
          rating = found.averageRating;
        }
      }
      return { name: salon.name, value: rating };
    }).sort((a, b) => a.value - b.value);
  }, [salonsList, data]);

  const metricCards = useMemo(() => [
    { label: t("adminDashboard.table.revenue"), value: `${(data?.totalPlatformRevenue || 0).toLocaleString("vi-VN")}`, unit: "VND", trend: "+12.5%", icon: CircleDollarSign, color: '#0ea5e9' },
    { label: t("userManagement.metric.clientAccounts"), value: `${data?.totalRegisteredCustomers || 0}`, unit: "USERS", trend: "+8.2%", icon: Users, color: '#10b981' },
    { label: t("menus.admin-salons"), value: `${data?.totalActiveSalons || 0}`, unit: "LOCATIONS", trend: "+2", icon: Store, color: '#f59e0b' },
    { label: t("menus.admin-staff"), value: `${data?.totalActiveStaff || 0}`, unit: "STAFF", trend: "+5", icon: UserRound, color: '#8b5cf6' },
    { label: t("adminDashboard.widgets.salonRatingDistribution"), value: `${data?.platformAverageRating || 0}`, unit: "/ 5.0", trend: "+0.2", icon: Activity, color: '#ec4899' },
  ], [data, t]);

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
        <Alert message="System Error" description="Unable to load dashboard data. Please check your connection." type="error" showIcon className="border-red-200" />
      </div>
    );
  }

  // ECharts Configs
  const commonTooltip = { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: BORDER_COLOR, borderWidth: 1, padding: 12, textStyle: { color: TEXT_PRIMARY, fontSize: 12, fontFamily: 'monospace' } };
  const commonAxisLabel = { color: TEXT_SECONDARY, fontSize: 11, fontFamily: 'monospace' };
  const commonSplitLine = { lineStyle: { type: 'dashed', color: GRID_COLOR } };

  const getEmptyTimeLabels = () => {
    if (!startDate || !endDate) return { labels: ['No Data'], data: [0] };
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
    } else {
      labels = [start.format('DD/MM/YY'), end.format('DD/MM/YY')];
      data = [0, 0];
    }
    return { labels, data };
  };

  const emptyTimeData = getEmptyTimeLabels();

  const stackedLineOption = {
    color: ['#0ea5e9'],
    tooltip: { ...commonTooltip, trigger: 'axis' },
    grid: { left: '2%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data?.revenueTrend?.labels?.length ? data.revenueTrend.labels : emptyTimeData.labels, axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    yAxis: { type: 'value', axisLabel: commonAxisLabel, splitLine: commonSplitLine, max: (val) => val.max === 0 ? 100000 : null },
    series: [
      {
        name: 'Revenue',
        type: 'line',
        stack: 'Total',
        smooth: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#0ea5e9' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(14,165,233,0.3)' }, { offset: 1, color: 'rgba(14,165,233,0)' }] }
        },
        data: data?.revenueTrend?.datasets?.[0]?.data?.length ? data.revenueTrend.datasets[0].data : emptyTimeData.data
      }
    ]
  };

  const lineRaceOption = {
    animationDuration: 3000,
    color: ['#10b981'],
    tooltip: { ...commonTooltip, trigger: 'axis' },
    grid: { left: '2%', right: '8%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: data?.userGrowth?.labels?.length ? data.userGrowth.labels : emptyTimeData.labels, axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    yAxis: { type: 'value', axisLabel: commonAxisLabel, splitLine: commonSplitLine, max: (val) => val.max === 0 ? 100 : null },
    series: [
      {
        name: 'New Customers',
        type: 'line',
        smooth: false,
        showSymbol: false,
        endLabel: { show: true, formatter: '{c}', color: '#10b981', fontSize: 12, fontFamily: 'monospace', distance: 8 },
        labelLayout: { moveOverlap: 'shiftY' },
        lineStyle: { width: 2, color: '#10b981' },
        data: data?.userGrowth?.datasets?.[0]?.data?.length ? data.userGrowth.datasets[0].data : emptyTimeData.data
      }
    ]
  };

  const pieData = data?.globalServicePopularity?.labels?.length
    ? data.globalServicePopularity.labels.map((label, i) => ({
      name: label,
      value: data.globalServicePopularity.datasets[0].data[i]
    })).slice(0, 6)
    : [{ name: 'No Data', value: 0 }];

  const refererPieOption = {
    color: TECH_COLORS,
    tooltip: { ...commonTooltip, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'middle', itemGap: 12, textStyle: { color: TEXT_SECONDARY, fontSize: 11, fontFamily: 'monospace' }, icon: 'rect' },
    series: [
      {
        name: 'Bookings',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data: pieData,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false }
      }
    ]
  };

  const ratingBarRaceOption = {
    color: ['#6366f1'],
    tooltip: { ...commonTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '2%', right: '10%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 5,
      axisLine: { lineStyle: { color: BORDER_COLOR } },
      axisLabel: commonAxisLabel,
      splitLine: commonSplitLine
    },
    yAxis: {
      type: 'category',
      data: salonRatingData.length ? salonRatingData.map(d => d.name) : ['No Data'],
      axisLine: { lineStyle: { color: BORDER_COLOR } },
      axisLabel: commonAxisLabel
    },
    series: [
      {
        name: 'Average Rating',
        type: 'bar',
        data: salonRatingData.length ? salonRatingData.map(d => d.value) : [0],
        barWidth: 12,
        itemStyle: { color: '#6366f1', borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          valueAnimation: true,
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#6366f1'
        }
      }
    ]
  };

  const datasetSource = [['Promotion', 'Revenue', 'Discount']];
  if (data?.globalPromotionPerformance && data.globalPromotionPerformance.length > 0) {
    data.globalPromotionPerformance.forEach(promo => { datasetSource.push([promo.promotionName, promo.revenueGenerated, promo.discountGiven]); });
  } else {
    datasetSource.push(['No Data', 0, 0]);
  }

  const shareDatasetOption = {
    color: ['#0ea5e9', '#f59e0b'],
    legend: { top: 0, right: 0, textStyle: { color: TEXT_SECONDARY, fontSize: 11, fontFamily: 'monospace' }, icon: 'rect' },
    tooltip: { ...commonTooltip, trigger: 'axis', axisPointer: { type: 'line' } },
    dataset: { source: datasetSource },
    grid: { left: '2%', right: '2%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    yAxis: { axisLabel: { ...commonAxisLabel, formatter: (value) => `${(value / 1000).toLocaleString("vi-VN")}k ₫` }, splitLine: commonSplitLine, max: (val) => val.max === 0 ? 100000 : null },
    series: [{ type: 'bar', barWidth: 16 }, { type: 'bar', barWidth: 16 }]
  };

  const topSalonsOption = {
    color: ['#14b8a6'],
    tooltip: { ...commonTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '2%', right: '6%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'value', max: (val) => val.max === 0 ? 100000 : null, axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: { ...commonAxisLabel, formatter: (val) => `${(val / 1000).toLocaleString("vi-VN")}k ₫` }, splitLine: commonSplitLine },
    yAxis: { type: 'category', data: topSalonsData.length ? topSalonsData.map(d => d.name) : ['No Data'], axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    series: [{ name: 'Revenue', type: 'bar', data: topSalonsData.length ? topSalonsData.map(d => d.value) : [0], barWidth: 12, itemStyle: { color: '#14b8a6' } }]
  };

  const renderWidgetContent = (id, isPinned) => {
    const chartHeight = isPinned ? '400px' : '300px';
    switch (id) {
      case 'globalServicePopularity': return <ReactECharts option={refererPieOption} style={{ height: chartHeight, width: '100%' }} />;
      case 'salonRatingDistribution': return <ReactECharts option={ratingBarRaceOption} style={{ height: chartHeight, width: '100%' }} />;
      case 'revenueTrend': return <ReactECharts option={stackedLineOption} style={{ height: chartHeight, width: '100%' }} />;
      case 'userGrowth': return <ReactECharts option={lineRaceOption} style={{ height: chartHeight, width: '100%' }} />;
      case 'globalPromotionPerformance': return <ReactECharts option={shareDatasetOption} style={{ height: chartHeight, width: '100%' }} />;
      case 'topPerformingSalons': return <ReactECharts option={topSalonsOption} style={{ height: chartHeight, width: '100%' }} />;
      case 'rankedSalons':
        return (
          <div className={`flex-1 overflow-auto -mx-2 ${isPinned ? 'max-h-[400px]' : 'max-h-[300px]'}`}>
            <Table
              rowKey="id"
              columns={salonPerformanceColumns}
              dataSource={salonPerformanceRows}
              pagination={false}
              size="small"
              className="custom-admin-table h-full [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-slate-100 [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-slate-200 [&_.ant-table-thead_th]:!text-slate-500 [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!tracking-widest [&_.ant-table-tbody_tr>td]:!border-b [&_.ant-table-tbody_tr>td]:!border-slate-100 [&_.ant-table-tbody_tr:hover>td]:!bg-slate-50 transition-colors rounded-none"
            />
          </div>
        );
      default: return null;
    }
  };

  const hiddenWidgets = widgets.filter(w => !w.visible);
  const layoutMenuProps = {
    items: [
      ...hiddenWidgets.map((w) => ({
        key: `restore-${w.id}`,
        label: `${t("view") || "Show"} ${t(`adminDashboard.widgets.${w.id}`) || w.title}`,
        icon: <Eye size={16} />,
        onClick: () => toggleHide(w.id),
      })),
      hiddenWidgets.length > 0 ? { type: 'divider' } : null,
      { key: 'reset', label: t("adminDashboard.resetLayout"), icon: <RotateCcw size={16} />, onClick: resetLayout, danger: true }
    ].filter(Boolean),
  };

  const pinnedWidgets = widgets.filter(w => w.pinned && w.visible);
  const unpinnedWidgets = widgets.filter(w => !w.pinned && w.visible);

  return (
    <div className="flex min-h-screen flex-col text-slate-800 font-sans">
      {/* Header & Controls */}
      {/* <div className="flex flex-col gap-4 bg-white px-8 py-5 shadow-sm border-b border-slate-200 md:flex-row md:items-center md:justify-between z-50 sticky top-0"> */}
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
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{t("menus.admin-dashboard")}</h1>
          <p className="text-[13px] text-slate-500 font-medium">{t("header.dashboard.desc")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Dropdown menu={layoutMenuProps} trigger={['click']} placement="bottomRight">
            <Button icon={<Settings2 size={16} className="text-slate-500" />} className="border-slate-200 font-medium text-slate-700 bg-white shadow-sm">
              {t("shared.customize") || "Customize"}
            </Button>
          </Dropdown>
          <Segmented
            options={[
              { label: t("adminDashboard.day"), value: "Day" },
              { label: t("adminDashboard.week"), value: "Week" },
              { label: t("adminDashboard.month"), value: "Month" },
              { label: t("adminDashboard.year"), value: "Year" },
              { label: t("adminDashboard.custom"), value: "Custom" },
            ]}
            value={filterMode}
            onChange={handleFilterModeChange}
            className="rounded-md bg-slate-100 p-1 font-semibold text-slate-700"
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            className="rounded-md border-slate-200 hover:border-sky-500 focus:border-sky-500"
            format="YYYY-MM-DD"
          />
        </div>
      </div>

      <div
        className="mx-auto w-full space-y-6 p-8">
        {/* Top Metrics Row */}
        <TopMetricsRow metrics={metricCards} />

        {/* Pinned Widgets Section */}
        {pinnedWidgets.length > 0 && (
          <div className="flex flex-col gap-6">
            {pinnedWidgets.map((widget) => (
              <WidgetWrapper
                key={widget.id} id={widget.id} widget={widget} isPinned={true}
                onPin={togglePin} onHide={toggleHide} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={handleDrop}
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
              key={widget.id} id={widget.id} widget={widget} isPinned={false}
              onPin={togglePin} onHide={toggleHide} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={handleDrop}
            >
              {renderWidgetContent(widget.id, false)}
            </WidgetWrapper>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={Boolean(selectedSalonId)}
        onCancel={() => setSelectedSalonId(null)}
        footer={null}
        closable={false}
        width={400}
        centered
        destroyOnClose
        styles={{ content: { padding: 0, borderRadius: 0, border: "1px solid #e2e8f0" }, mask: { backgroundColor: "rgba(241,245,249,0.8)" } }}
      >
        <div className="bg-white">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Salon Details</h3>
            </div>
            <button type="button" onClick={() => setSelectedSalonId(null)} className="text-slate-400 hover:text-slate-800 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="p-6">
            {isLoadingSalon ? (
              <div className="flex justify-center p-4"><Spin /></div>
            ) : salonDetails ? (
              <div className="space-y-4">
                {(() => {
                  const selectedRow = salonPerformanceRows.find(row => row.originalId === selectedSalonId);
                  const managerCount = salonManagers?.metaData?.totalItems || 0;
                  const receptionistCount = salonReceptionists?.metaData?.totalItems || 0;
                  const staffCount = salonStaffArtists?.metaData?.totalItems || 0;
                  return [
                    { label: "NAME", value: salonDetails.name },
                    { label: "MANAGER", value: selectedRow?.manager },
                    { label: "MANAGERS COUNT", value: managerCount },
                    { label: "RECEPTIONISTS COUNT", value: receptionistCount },
                    { label: "STAFF COUNT", value: staffCount },
                    { label: "REVENUE", value: selectedRow ? `${(selectedRow.revenue || 0).toLocaleString("vi-VN")} ₫` : "0 ₫" },
                    { label: "STATUS", value: salonDetails.status },
                    { label: "PHONE", value: salonDetails.phone },
                    { label: "ADDRESS", value: salonDetails.address },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                      <span className="text-sm font-mono text-slate-900 text-right ml-4">{value || "N/A"}</span>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm py-4 font-mono">Failed to load data.</div>
            )}
            <button className="w-full mt-6 py-2 border border-slate-800 text-slate-800 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-colors" onClick={() => setSelectedSalonId(null)}>
              CLOSE
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
