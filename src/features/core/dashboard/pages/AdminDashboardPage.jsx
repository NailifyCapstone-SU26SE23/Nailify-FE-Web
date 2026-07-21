import {
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Store,
  UserRound,
  Users,
  X,
  Activity
} from "lucide-react";
import { Modal, Table, Spin, Alert, DatePicker, Segmented } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useAdminDashboard, useSalonDetails, useManagersList, useSalonsList, useStaffsList } from "../hooks/useAdminDashboard";
import { PropTypes } from "../../../../shared/utils/propTypes";
import ReactECharts from "echarts-for-react";

// Technical Light Theme Palette
const TECH_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16"];
const TEXT_PRIMARY = "#1e293b";
const TEXT_SECONDARY = "#64748b";
const BORDER_COLOR = "#e2e8f0";
const GRID_COLOR = "#f1f5f9";

function Card({ className = "", children }) {
  return (
    <article
      className={`bg-white border border-slate-200 p-5 ${className}`}
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
    <div className="mb-5 border-b border-slate-200 pb-2">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

export function AdminDashboardPage() {
  const [selectedSalonId, setSelectedSalonId] = useState(null);

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

  const { data, isLoading, isError } = useAdminDashboard(startDate, endDate, groupBy);
  const { data: salonDetails, isLoading: isLoadingSalon } = useSalonDetails(selectedSalonId);
  const { data: managersList } = useManagersList();
  const { data: salonsList } = useSalonsList();
  const { data: staffsList } = useStaffsList();

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

  const salonPerformanceRows = useMemo(() => {
    if (!salonsList) return [];

    return salonsList.map((salon) => {
      const salonId = salon.salonId || salon.id;
      const salonName = salon.name;

      // Find revenue from topPerformingSalons (default to 0 if not found)
      let revenue = 0;
      if (data?.topPerformingSalons?.labels) {
        const topIndex = data.topPerformingSalons.labels.findIndex(label => label === salonName);
        if (topIndex !== -1) {
          revenue = data.topPerformingSalons.datasets[0].data[topIndex];
        }
      }

      // Find manager
      let managerName = "N/A";
      if (salonId && managersList?.items) {
        const manager = managersList.items.find(m => m.salonId === salonId);
        if (manager) {
          managerName = `${manager.firstName} ${manager.lastName}`;
        }
      }

      return {
        id: salonId,
        name: salonName,
        manager: managerName,
        revenue: revenue,
        originalId: salonId
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [data, salonsList, managersList]);

  const salonPerformanceColumns = useMemo(() => ([
    {
      title: "SALON",
      key: "name",
      render: (_, salon) => (
        <div>
          <p className="font-bold text-slate-800 text-sm">{salon.name}</p>

        </div>
      ),
    },
    {
      title: "MANAGER",
      dataIndex: "manager",
      key: "manager",
      render: (value) => <span className="text-sm font-bold text-slate-800">{value}</span>,
    },
    {
      title: "REVENUE",
      dataIndex: "revenue",
      key: "revenue",
      render: (value) => <span className="text-sm font-mono text-emerald-600">{value ? value.toLocaleString("vi-VN") + " ₫" : "0 ₫"}</span>,
    },
    {
      title: "ACTION",
      key: "action",
      render: (_, salon) => (
        <button
          type="button"
          onClick={() => salon.originalId && setSelectedSalonId(salon.originalId)}
          className={`text-[10px] font-bold uppercase tracking-widest border-b transition-colors ${salon.originalId ? 'text-sky-600 hover:text-sky-800 border-transparent hover:border-sky-800' : 'text-slate-400 border-transparent cursor-not-allowed'}`}
          disabled={!salon.originalId}
        >
          VIEW
        </button>
      ),
    },
  ]), []);

  const topSalonsData = useMemo(() => {
    if (!salonsList) return [];
    return salonsList.map((salon) => {
      let revenue = 0;
      if (data?.topPerformingSalons?.labels) {
        const topIndex = data.topPerformingSalons.labels.findIndex(label => label === salon.name);
        if (topIndex !== -1) {
          revenue = data.topPerformingSalons.datasets[0].data[topIndex];
        }
      }
      return {
        name: salon.name,
        value: revenue
      };
    }).sort((a, b) => a.value - b.value); // sort ascending for ECharts horizontal bar
  }, [salonsList, data]);

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

  const metricCards = [
    { label: "TOTAL REVENUE", value: `${(data?.totalPlatformRevenue || 0).toLocaleString("vi-VN")}`, unit: "VND", trend: "+12.5%" },
    { label: "CUSTOMERS", value: data?.totalRegisteredCustomers || 0, unit: "USERS", trend: "+8.2%" },
    { label: "ACTIVE SALONS", value: data?.totalActiveSalons || 0, unit: "LOCATIONS", trend: "+2" },
    { label: "ACTIVE STAFF", value: data?.totalActiveStaff || 0, unit: "STAFF", trend: "+5" },
    { label: "AVG RATING", value: (data?.platformAverageRating || 0).toFixed(1), unit: "/ 5.0", trend: "+0.2" },
  ];

  // ==========================================
  // ECharts Configurations (Technical Style)
  // ==========================================

  const commonTooltip = { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: BORDER_COLOR, borderWidth: 1, padding: 12, textStyle: { color: TEXT_PRIMARY, fontSize: 12, fontFamily: 'monospace' } };
  const commonAxisLabel = { color: TEXT_SECONDARY, fontSize: 11, fontFamily: 'monospace' };
  const commonSplitLine = { lineStyle: { type: 'dashed', color: GRID_COLOR } };

  // 1. Stacked Line Chart (Revenue Trajectory)
  const stackedLineOption = {
    color: ['#0ea5e9'],
    tooltip: { ...commonTooltip, trigger: 'axis' },
    grid: { left: '2%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data?.revenueTrend?.labels || [], axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    yAxis: { type: 'value', axisLabel: commonAxisLabel, splitLine: commonSplitLine },
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
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(14,165,233,0.3)' }, { offset: 1, color: 'rgba(14,165,233,0)' }]
          }
        },
        data: data?.revenueTrend?.datasets?.[0]?.data || []
      }
    ]
  };

  // 2. Line Race (Customer Acquisition)
  const lineRaceOption = {
    animationDuration: 3000,
    color: ['#10b981'],
    tooltip: { ...commonTooltip, trigger: 'axis' },
    grid: { left: '2%', right: '8%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: data?.userGrowth?.labels || [], axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    yAxis: { type: 'value', axisLabel: commonAxisLabel, splitLine: commonSplitLine },
    series: [
      {
        name: 'New Customers',
        type: 'line',
        smooth: false,
        showSymbol: false,
        endLabel: { show: true, formatter: '{c}', color: '#10b981', fontSize: 12, fontFamily: 'monospace', distance: 8 },
        labelLayout: { moveOverlap: 'shiftY' },
        lineStyle: { width: 2, color: '#10b981' },
        data: data?.userGrowth?.datasets?.[0]?.data || []
      }
    ]
  };

  // 3. Referer of a Website (Service Demand Pie Chart)
  const pieData = data?.globalServicePopularity?.labels?.map((label, i) => ({
    name: label,
    value: data.globalServicePopularity.datasets[0].data[i]
  })).slice(0, 6) || [];

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

  // 4. Basic Radar Chart (Salon Ratings)
  const radarIndicator = data?.salonRatingDistribution?.map(rating => ({
    name: rating.salonName,
    max: 5
  })) || [{ name: 'N/A', max: 5 }];

  const radarData = data?.salonRatingDistribution?.map(rating => rating.averageRating) || [0];

  const radarOption = {
    color: ['#6366f1'],
    tooltip: { ...commonTooltip, trigger: 'item' },
    radar: {
      indicator: radarIndicator,
      splitArea: { areaStyle: { color: ['#f8fafc', '#f1f5f9'] } },
      axisLine: { lineStyle: { color: BORDER_COLOR } },
      splitLine: { lineStyle: { color: BORDER_COLOR } },
      axisName: { color: TEXT_SECONDARY, fontSize: 11, fontFamily: 'monospace' }
    },
    series: [
      {
        name: 'Average Rating',
        type: 'radar',
        data: [{ value: radarData, name: 'Average Rating' }],
        symbol: 'rect',
        symbolSize: 6,
        itemStyle: { color: '#6366f1' },
        areaStyle: { color: 'rgba(99,102,241,0.2)' },
        lineStyle: { width: 1.5 }
      }
    ]
  };

  // 5. Share Dataset (Campaign Effectiveness)
  const datasetSource = [['Promotion', 'Revenue', 'Discount']];
  if (data?.globalPromotionPerformance) {
    data.globalPromotionPerformance.forEach(promo => {
      datasetSource.push([promo.promotionName, promo.revenueGenerated, promo.discountGiven]);
    });
  }

  const shareDatasetOption = {
    color: ['#0ea5e9', '#f59e0b'],
    legend: { top: 0, right: 0, textStyle: { color: TEXT_SECONDARY, fontSize: 11, fontFamily: 'monospace' }, icon: 'rect' },
    tooltip: { ...commonTooltip, trigger: 'axis', axisPointer: { type: 'line' } },
    dataset: { source: datasetSource },
    grid: { left: '2%', right: '2%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    yAxis: { axisLabel: { ...commonAxisLabel, formatter: (value) => `${(value / 1000).toLocaleString("vi-VN")}k ₫` }, splitLine: commonSplitLine },
    series: [
      { type: 'bar', barWidth: 16 },
      { type: 'bar', barWidth: 16 }
    ]
  };

  // 6. Top Performing Salons (Horizontal Bar)
  const topSalonsOption = {
    color: ['#14b8a6'],
    tooltip: { ...commonTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '2%', right: '6%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: { ...commonAxisLabel, formatter: (val) => `${(val / 1000).toLocaleString("vi-VN")}k ₫` }, splitLine: commonSplitLine },
    yAxis: { type: 'category', data: topSalonsData.map(d => d.name), axisLine: { lineStyle: { color: BORDER_COLOR } }, axisLabel: commonAxisLabel },
    series: [
      {
        name: 'Revenue',
        type: 'bar',
        data: topSalonsData.map(d => d.value),
        barWidth: 12,
        itemStyle: { color: '#14b8a6' }
      }
    ]
  };

  return (
    <section className="
min-h-full
bg-[#fff9fb]
bg-[radial-gradient(circle_at_top_right,rgba(255,227,160,.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,193,220,.22),transparent_35%),linear-gradient(to_right,#f7dbe7_1px,transparent_1px),linear-gradient(to_bottom,#f7dbe7_1px,transparent_1px)]
bg-[size:auto,auto,24px_24px,24px_24px]
p-6 lg:p-8
font-sans
">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* Header Section */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-slate-900 uppercase">
              System Dashboard
            </h1>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">Data Telemetry & Monitoring</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white border border-slate-200">
              <Segmented
                options={['Day', 'Week', 'Month', 'Year']}
                value={filterMode === "Custom" ? null : filterMode}
                onChange={handleFilterModeChange}
                className="bg-transparent font-mono text-xs rounded-none [&_.ant-segmented-item-selected]:bg-slate-800 [&_.ant-segmented-item-selected]:text-white [&_.ant-segmented-item]:rounded-none"
              />
            </div>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              className="border border-slate-200 bg-white rounded-none font-mono text-xs h-[32px]"
              format="DD/MM/YYYY"
            />
          </div>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 border-b border-slate-200 pb-6">
          {metricCards.map((card, index) => (
            <div key={card.label} className="relative px-4 first:border-l-0 border-l border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">{card.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-light text-slate-900 tracking-tight">{card.value}</span>
                <span className="text-xs font-mono text-slate-400">{card.unit}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-emerald-600">
                <ArrowUpRight size={10} />
                <span>{card.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-[380px] flex flex-col">
            <SectionHeading title="Global Service Popularity" subtitle="Referer dataset analysis" />
            <div className="flex-1 w-full">
              <ReactECharts option={refererPieOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>

          <Card className="h-[380px] flex flex-col">
            <SectionHeading title="Salon Rating Distribution" subtitle="Radar dimensional analysis" />
            <div className="flex-1 w-full">
              <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-[380px] flex flex-col">
            <SectionHeading title="Revenue Trend" subtitle="Stacked timeline series" />
            <div className="flex-1 w-full">
              <ReactECharts option={stackedLineOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>

          <Card className="h-[380px] flex flex-col">
            <SectionHeading title="User Growth" subtitle="Race tracking metrics" />
            <div className="flex-1 w-full">
              <ReactECharts option={lineRaceOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>
        </div>

        {/* Charts Row 3 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-[420px] flex flex-col">
            <SectionHeading title="Global Promotion Performance" subtitle="Shared dataset comparative" />
            <div className="flex-1 w-full">
              <ReactECharts option={shareDatasetOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>

          <Card className="h-[420px] flex flex-col">
            <SectionHeading title="Top Performing Salons" subtitle="Top performing salons by revenue" />
            <div className="flex-1 w-full">
              <ReactECharts option={topSalonsOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>
        </div>

        {/* Table Row */}
        <Card className="overflow-hidden flex flex-col">
          <SectionHeading title="Ranked Salons by Revenue" subtitle="Live active salon revenue" />
          <div className="flex-1 overflow-auto -mx-2">
            <Table
              rowKey="id"
              columns={salonPerformanceColumns}
              dataSource={salonPerformanceRows}
              pagination={false}
              size="small"
              className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-slate-100 [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-slate-200 [&_.ant-table-thead_th]:!text-slate-500 [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!tracking-widest [&_.ant-table-tbody_tr>td]:!border-b [&_.ant-table-tbody_tr>td]:!border-slate-100 [&_.ant-table-tbody_tr:hover>td]:!bg-slate-50 transition-colors rounded-none"
            />
          </div>
        </Card>

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
        styles={{
          content: { padding: 0, borderRadius: 0, border: "1px solid #e2e8f0" },
          mask: { backgroundColor: "rgba(241,245,249,0.8)" },
        }}
      >
        <div className="bg-white">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Salon Details</h3>

            </div>
            <button
              type="button"
              onClick={() => setSelectedSalonId(null)}
              className="text-slate-400 hover:text-slate-800 transition-colors"
            >
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
                  
                  const managerCount = managersList?.items?.filter(m => m.salonId === selectedSalonId)?.length || 0;
                  const staffCount = staffsList?.items?.filter(s => s.salonId === selectedSalonId)?.length || 0;
                  
                  return [
                    { label: "NAME", value: salonDetails.name },
                    { label: "MANAGER", value: selectedRow?.manager },
                    { label: "MANAGERS COUNT", value: managerCount },
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
            <button
              className="w-full mt-6 py-2 border border-slate-800 text-slate-800 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-colors"
              onClick={() => setSelectedSalonId(null)}
            >
              CLOSE
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
