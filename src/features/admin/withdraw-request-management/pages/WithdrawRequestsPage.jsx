import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Select, Statistic, Table, Tag, Tooltip, Typography, DatePicker } from "antd";
import { Eye, RefreshCw, Wallet, Snowflake, Users, ArrowDownToLine, ArrowUpFromLine, Clock, WalletCards, Calendar, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { getAdminWithdrawRequestDetailRoute } from "../../../../shared/constants/routes";
import {
  fetchSystemSummary,
  fetchWithdrawalRequests,
} from "../services/withdrawRequestService";
import {
  WITHDRAW_REQUEST_STATUSES,
  getWithdrawRequestStatusColor,
  getWithdrawRequestStatusLabel,
} from "../utils/withdrawRequestUtils";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

const { Title, Text } = Typography;

export function WithdrawRequestsPage() {
  const { t, language } = useLanguage();
  const isVi = language === "vi";
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [requests, setRequests] = useState([]);
  const [metaData, setMetaData] = useState({ currentPage: 1, pageSize: 10, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchSystemSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load summary", err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchWithdrawalRequests({
        pageNumber,
        pageSize: 10,
        status: statusFilter,
      });

      setRequests(response.items);
      setMetaData(response.metaData);
    } catch (err) {
      setError(err.message || "Failed to load withdrawal requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadRequests(1);
  }, [loadRequests]);

  const handleTableChange = (pagination) => {
    loadRequests(pagination.current);
  };

  const displayedRequests = useMemo(() => {
    let items = requests || [];
    if (dateRange && dateRange.length === 2) {
      const start = dayjs(dateRange[0]).startOf('day').valueOf();
      const end = dayjs(dateRange[1]).endOf('day').valueOf();
      items = items.filter(req => {
        const reqDate = dayjs(req.createdAt).valueOf();
        return reqDate >= start && reqDate <= end;
      });
    }
    return items;
  }, [requests, dateRange]);

  const topMetrics = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: isVi ? "Tổng số dư" : "Total Balance",
        value: summary.totalUserBalance,
        unit: "VND",
        icon: Wallet,
        color: "#3b82f6",
      },
      {
        label: isVi ? "Tổng số dư đóng băng" : "Total Frozen",
        value: summary.totalFrozenBalance,
        unit: "VND",
        icon: Snowflake,
        color: "#64748b",
      },
      {
        label: isVi ? "Ví hoạt động" : "Active Wallets",
        value: summary.totalActiveWallets,
        icon: Users,
        color: "#10b981",
      },
      {
        label: isVi ? "Tổng nạp" : "Total Deposited",
        value: summary.totalDepositedAmount,
        unit: "VND",
        icon: ArrowDownToLine,
        color: "#8b5cf6",
      },
      {
        label: isVi ? "Tổng rút" : "Total Withdrawn",
        value: summary.totalWithdrawnAmount,
        unit: "VND",
        icon: ArrowUpFromLine,
        color: "#f59e0b",
      },
      {
        label: isVi ? "Yêu cầu đang chờ xử lý" : "Pending Requests",
        value: summary.pendingWithdrawalRequests,
        icon: Clock,
        color: "#ef4444",
      }
    ];
  }, [summary, t, isVi]);

  const columns = [
    {
      title: isVi ? "Ngày tạo" : "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => (
        <div className="flex items-center gap-1.5 text-xs text-[#7f6478]">
          <Calendar size={13} className="text-[#a88a9f]" />
          <span className="font-medium">
            {date ? dayjs(date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm") : "-"}
          </span>
        </div>
      ),
    },
    {
      title: isVi ? "Thông tin ngân hàng" : "Bank Info",
      key: "bankInfo",
      width: 250,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span className="font-semibold">{record.bankCode}</span>
          <span className="text-[#a88a9f] font-mono text-xs">{record.accountNumber}</span>
          <span className="text-xs uppercase text-gray-600 mt-1">{record.accountHolderName}</span>
        </div>
      ),
    },
    {
      title: isVi ? "Số tiền" : "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => (
        <Text strong className="font-mono text-sm !text-rose-600">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: isVi ? "Trạng thái" : "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => (
        <Tag color={getWithdrawRequestStatusColor(status)}>
          {getWithdrawRequestStatusLabel(status, language)}
        </Tag>
      ),
    },

    {
      title: isVi ? "Thao tác" : "Action",
      key: "action",
      fixed: "right",
      width: 90,
      render: (_, record) => (
        <div className="flex justify-center">
          <Tooltip title="View Detail">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#7f6478] shadow-xs transition-all duration-300 hover:border-[#ea4f93] hover:bg-[#ea4f93] hover:text-white active:scale-95"
              onClick={(event) => {
                event.stopPropagation();
                navigate(getAdminWithdrawRequestDetailRoute(record.withdrawalRequestId));
              }}
            >
              <Eye size={13} className="stroke-[2]" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full pb-10 font-sans p-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        <div className="flex flex-col gap-4 border-b border-slate-200/60 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-[#ea4f93]/10 p-2 text-[#ea4f93]">
                <WalletCards size={18} className="stroke-[2]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ea4f93]">
                {language === "vi" ? "Quản trị ví" : "Wallet Admin"}
              </span>
            </div>
            <Title level={2} className="!mb-0 !text-3xl !font-bold !tracking-tight !text-[#2d1b35] md:!text-4xl">
              {language === "vi" ? "Quản lý và xét duyệt các yêu cầu rút tiền" : "Withdraw Requests"}
            </Title>
            <Text className="block max-w-[65ch] !text-xs !leading-relaxed !text-[#a88a9f] md:!text-sm">
              {language === "vi" ? "Quản lý và xét duyệt các yêu cầu rút tiền của khách hàng." : "Manage and approve customer withdrawal requests."}
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Button
              icon={<RefreshCw size={16} />}
              onClick={() => {
                loadSummary();
                loadRequests(metaData.currentPage);
              }}
              className="flex items-center gap-2"
            >
              {language === "vi" ? "Làm mới" : "Refresh"}
            </Button>
          </div>
        </div>

        {summary && (
          <TopMetricsRow metrics={topMetrics} className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-3" />
        )}

        <Card className="shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex w-full flex-col sm:flex-row gap-3 sm:w-auto">
              <DatePicker.RangePicker
                value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                onChange={(dates) => {
                  setDateRange(dates ? [dates[0].startOf('day').valueOf(), dates[1].endOf('day').valueOf()] : null);
                }}
                className="w-full sm:w-[280px]"
                format="DD/MM/YYYY"
              />
              <Select
                allowClear
                placeholder={isVi ? "Lọc theo trạng thái" : "Filter by Status"}
                className="w-full sm:w-48"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: WITHDRAW_REQUEST_STATUSES.PENDING, label: getWithdrawRequestStatusLabel(WITHDRAW_REQUEST_STATUSES.PENDING, language) },
                  { value: WITHDRAW_REQUEST_STATUSES.APPROVED, label: getWithdrawRequestStatusLabel(WITHDRAW_REQUEST_STATUSES.APPROVED, language) },
                  { value: WITHDRAW_REQUEST_STATUSES.REJECTED, label: getWithdrawRequestStatusLabel(WITHDRAW_REQUEST_STATUSES.REJECTED, language) },
                  { value: WITHDRAW_REQUEST_STATUSES.COMPLETED, label: getWithdrawRequestStatusLabel(WITHDRAW_REQUEST_STATUSES.COMPLETED, language) },
                ]}
              />
            </div>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon className="mb-4" />
          )}

          <Table
            columns={columns}
            dataSource={displayedRequests}
            rowKey="withdrawalRequestId"
            loading={loading}
            pagination={{
              current: metaData.currentPage,
              pageSize: metaData.pageSize,
              total: metaData.totalItems,
              showSizeChanger: false,
            }}
            onChange={handleTableChange}
            scroll={{ x: 800 }}
          />
        </Card>
      </div>
    </div>
  );
}
