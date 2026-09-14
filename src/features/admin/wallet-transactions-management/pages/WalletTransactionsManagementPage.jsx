import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, DatePicker, Select, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { Calendar, Eye, RefreshCw, Search, WalletCards, X } from "lucide-react";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import {
  fetchAdminWalletById,
  fetchAdminWalletTransactionDetail,
  fetchAdminWalletTransactions,
} from "../services/walletTransactionsManagementService";
import { WalletTransactionDetailModal } from "../components/WalletTransactionDetailModal";
import {
  WALLET_TRANSACTION_STATUSES,
  WALLET_TRANSACTION_TYPES,
  getWalletReferenceTypeLabel,
  getWalletTransactionStatusColor,
  getWalletTransactionStatusLabel,
  getWalletTransactionTypeColor,
  getWalletTransactionTypeLabel,
} from "../utils/walletTransactionUtils";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export function WalletTransactionsManagementPage() {
  const { t, language } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [metaData, setMetaData] = useState({ currentPage: 1, pageSize: 10, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    type: undefined,
    status: undefined,
    dateRange: null,
    search: "",
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [walletOwner, setWalletOwner] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadTransactions = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchAdminWalletTransactions({
        pageNumber,
        pageSize: 10,
        type: filters.type,
        status: filters.status,
        fromDate: filters.dateRange?.[0]?.format("YYYY-MM-DD"),
        toDate: filters.dateRange?.[1]?.format("YYYY-MM-DD"),
      });

      setTransactions(response.items);
      setMetaData(response.metaData);
    } catch (err) {
      setError(err.message || t("walletTransactions.loadFailed"));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange, filters.status, filters.type, t]);

  useEffect(() => {
    // Loading server data is the intended synchronization for filter changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTransactions(1);
  }, [loadTransactions]);

  const handleViewDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedDetail(null);
    setWalletOwner(null);

    try {
      const detail = await fetchAdminWalletTransactionDetail(id);
      setSelectedDetail(detail);

      if (detail?.walletId) {
        try {
          const owner = await fetchAdminWalletById(detail.walletId);
          setWalletOwner(owner);
        } catch (ownerErr) {
          console.error("Failed to load wallet owner detail", ownerErr);
        }
      }
    } catch (err) {
      console.error("Failed to load wallet transaction detail", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    if (!search) {
      return transactions;
    }

    return transactions.filter((transaction) =>
      [
        transaction.walletTransactionId,
        transaction.walletId,
        transaction.referenceId,
        transaction.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [filters.search, transactions]);

  const metrics = useMemo(() => {
    const completed = filteredTransactions.filter((item) => item.status === "Completed").length;
    const pending = filteredTransactions.filter((item) => item.status === "Pending").length;

    return [
      {
        label: t("walletTransactions.totalTransactions"),
        value: metaData.totalItems || filteredTransactions.length,
        icon: WalletCards,
        color: "#ec4899",
      },
      {
        label: t("walletTransactions.completedOnPage"),
        value: completed,
        icon: WalletCards,
        color: "#10b981",
      },
      {
        label: t("walletTransactions.pendingOnPage"),
        value: pending,
        icon: WalletCards,
        color: "#f59e0b",
      },
    ];
  }, [filteredTransactions, metaData.totalItems, t]);

  const columns = [
    {
      title: t("walletTransactions.referenceId"),
      dataIndex: "referenceId",
      key: "referenceId",
      width: 220,
      render: (value) => (
        <Text copyable className="font-mono text-xs font-bold text-[#ea4f93]">
          {value || "-"}
        </Text>
      ),
    },
    {
      title: t("walletTransactions.amount"),
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (value) => (
        <Text strong className={`font-mono text-sm ${Number(value) < 0 ? "!text-rose-600" : "!text-emerald-600"}`}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: t("walletTransactions.type"),
      dataIndex: "type",
      key: "type",
      width: 170,
      render: (value) => (
        <Tag color={getWalletTransactionTypeColor(value)}>
          {getWalletTransactionTypeLabel(value, language)}
        </Tag>
      ),
    },
    {
      title: t("walletTransactions.referenceType"),
      dataIndex: "referenceType",
      key: "referenceType",
      width: 160,
      render: (value) => getWalletReferenceTypeLabel(value, language),
    },
    {
      title: t("walletTransactions.status"),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value) => (
        <Tag color={getWalletTransactionStatusColor(value)}>
          {getWalletTransactionStatusLabel(value, language)}
        </Tag>
      ),
    },
    {
      title: t("walletTransactions.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (value) => (
        <div className="flex items-center gap-1.5 text-xs text-[#7f6478]">
          <Calendar size={13} className="text-[#a88a9f]" />
          <span className="font-medium">{value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-"}</span>
        </div>
      ),
    },
    {
      title: t("walletTransactions.actions"),
      key: "actions",
      fixed: "right",
      width: 90,
      render: (_, record) => (
        <div className="flex justify-end">
          <button
            type="button"
            title={t("walletTransactions.view")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#7f6478] shadow-xs transition-all duration-300 hover:border-[#ea4f93] hover:bg-[#ea4f93] hover:text-white active:scale-95"
            onClick={(event) => {
              event.stopPropagation();
              handleViewDetail(record.walletTransactionId);
            }}
          >
            <Eye size={13} className="stroke-[2]" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full pb-10 font-sans">
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
              {t("walletTransactions.title")}
            </Title>
            <Text className="block max-w-[65ch] !text-xs !leading-relaxed !text-[#a88a9f] md:!text-sm">
              {t("walletTransactions.subtitle")}
            </Text>
          </div>

          <button
            type="button"
            onClick={() => loadTransactions(1)}
            className="flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-[#2d1b35] shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-[#ea4f93]/30 hover:shadow-[0_4px_20px_rgba(234,79,147,0.08)] active:scale-[0.98] md:self-auto"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {t("walletTransactions.refresh")}
          </button>
        </div>

        <TopMetricsRow metrics={metrics} className="grid gap-6 md:grid-cols-3" />

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200/75 bg-white/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
              <input
                type="text"
                value={filters.search}
                placeholder={t("walletTransactions.searchPlaceholder")}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-[#fafaf9]/30 py-3 pl-11 pr-10 text-xs text-[#2d1b35] transition-all duration-300 placeholder:text-[#a88a9f] focus:border-[#ea4f93] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#ea4f93]/10 md:text-sm"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a88a9f] hover:text-[#2d1b35]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
              <Select
                allowClear
                className="!h-11 !w-full sm:!w-48"
                placeholder={t("walletTransactions.filterType")}
                options={WALLET_TRANSACTION_TYPES.map((type) => ({
                  value: type,
                  label: getWalletTransactionTypeLabel(type, language),
                }))}
                value={filters.type}
                onChange={(type) => setFilters((prev) => ({ ...prev, type }))}
              />
              <Select
                allowClear
                className="!h-11 !w-full sm:!w-44"
                placeholder={t("walletTransactions.filterStatus")}
                options={WALLET_TRANSACTION_STATUSES.map((status) => ({
                  value: status,
                  label: getWalletTransactionStatusLabel(status, language),
                }))}
                value={filters.status}
                onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
              />
              <RangePicker
                className="!h-11 !w-full sm:!w-auto"
                value={filters.dateRange}
                placeholder={[
                  t("walletTransactions.startDate"),
                  t("walletTransactions.endDate"),
                ]}
                onChange={(dateRange) => setFilters((prev) => ({ ...prev, dateRange }))}
                disabledDate={(date) => date && date > dayjs().endOf("day").add(365, "day")}
              />
            </div>
          </div>

          {error && (
            <Alert
              type="warning"
              showIcon
              message={t("walletTransactions.loadFailed")}
              description={error}
            />
          )}

          <div className="overflow-hidden rounded-lg border border-slate-200/60 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
            <Table
              columns={columns}
              dataSource={filteredTransactions}
              rowKey="walletTransactionId"
              loading={loading}
              scroll={{ x: "max-content" }}
              rowClassName="group cursor-pointer transition-all duration-300 hover:bg-[#fff9fc]/40"
              className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-thead_th]:!bg-[#fff9fb] [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-[0.14em] [&_.ant-table-thead_th]:!text-[#a88a9f] [&_.ant-table-tbody_.ant-table-row>td]:!border-b [&_.ant-table-tbody_.ant-table-row>td]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row>td]:!py-4 [&_.ant-table-tbody_.ant-table-row>td]:!text-[12px] [&_.ant-table-tbody_.ant-table-row>td]:!text-[#5b4256] [&_.ant-table-tbody_.ant-table-row:hover>td]:!bg-[#fff9fb]"
              onRow={(record) => ({
                onClick: () => handleViewDetail(record.walletTransactionId),
              })}
              pagination={{
                current: metaData.currentPage || 1,
                pageSize: 10,
                total: metaData.totalItems || filteredTransactions.length,
                showSizeChanger: false,
                showTotal: (total, range) => t("walletTransactions.paginationTotal", {
                  start: range[0],
                  end: range[1],
                  total,
                }),
                onChange: (page) => loadTransactions(page),
              }}
              locale={{
                emptyText: t("walletTransactions.emptyText"),
              }}
            />
          </div>
        </div>
      </div>

      <WalletTransactionDetailModal
        open={detailOpen}
        loading={detailLoading}
        transaction={selectedDetail}
        walletOwner={walletOwner}
        onClose={() => {
          setDetailOpen(false);
          setSelectedDetail(null);
          setWalletOwner(null);
        }}
        t={t}
        language={language}
      />
    </div>
  );
}
