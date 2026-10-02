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
import { ActionButtons } from "../../../../shared/components/common/ActionButtons";
import {
  fetchSystemSummary,
  fetchWithdrawalRequests,
} from "../services/withdrawRequestService";
import { WITHDRAWAL_STATUS } from "../../../../shared/utils/statusFormatters";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";
import { DateRangePicker } from "../../../../shared/components/ui/DateRangePicker";

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
      render: (status) => {
        const statusObj = WITHDRAWAL_STATUS[status];
        if (statusObj) {
          return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${statusObj.tone}`}>
              {language === "vi" ? statusObj.vi : statusObj.en}
            </span>
          );
        }
        return <Tag>{status}</Tag>;
      },
    },

    {
      title: isVi ? "Thao tác" : "Action",
      key: "action",
      fixed: "center",
      width: 90,
      render: (_, record) => (
        <div className="flex justify-center">
          <ActionButtons
            onView={(event) => {
              event.stopPropagation();
              navigate(getAdminWithdrawRequestDetailRoute(record.withdrawalRequestId));
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full pb-10 font-sans p-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        {summary && (
          <TopMetricsRow metrics={topMetrics} className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-3" />
        )}

        <Card className="shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex w-full flex-col sm:flex-row justify-between items-end">
              <div className="flex items-center gap-3">
                <DateRangePicker
                  value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                  onChange={(dates) => {
                    setDateRange(dates ? [dates[0].startOf('day').valueOf(), dates[1].endOf('day').valueOf()] : null);
                  }}
                  className="w-full sm:w-[280px]"
                />
                <Select
                  allowClear
                  placeholder={isVi ? "Lọc theo trạng thái" : "Filter by Status"}
                  className="w-full sm:w-48"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={["Pending", "Approved", "Rejected", "Completed"].map((s) => ({
                    value: s,
                    label: WITHDRAWAL_STATUS[s] ? (language === "vi" ? WITHDRAWAL_STATUS[s].vi : WITHDRAWAL_STATUS[s].en) : s,
                  }))}
                />
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
