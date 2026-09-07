import { useState, useEffect } from "react";
import { Table, Modal, Descriptions, Tag, Button, Typography, Space, Divider, Avatar, Collapse, Tooltip, Input, Select } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { fetchLoyaltyTransactions, fetchLoyaltyTransactionDetail, fetchCustomers, fetchCustomerDetail } from "../services/loyaltyTransactionsManagementService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { formatDate } from "../../../../shared/utils/formatDate";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";
import { Gift, TrendingDown, TrendingUp } from "lucide-react";

const { Title, Text } = Typography;

const CustomerInfoCell = ({ customerId, customersMap }) => {
  const customer = customersMap[customerId];

  if (!customer) return <Text type="secondary">Unknown ({customerId?.substring(0, 8)}...)</Text>;

  return (
    <Space direction="vertical" size={0}>
      <Text strong>{customer.firstName} {customer.lastName}</Text>
      <Text type="secondary" className="text-xs">{customer.phone || customer.email}</Text>
    </Space>
  );
};

export function LoyaltyTransactionsManagementPage() {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);

  // New map for customers
  const [customersMap, setCustomersMap] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetchLoyaltyTransactions({ pageNumber: 1, pageSize: 1000 });
      setData(response.items);
    } catch (error) {
      console.error("Failed to load loyalty transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Fetch all customers once
    fetchCustomers()
      .then(customers => {
        const map = {};
        customers.forEach(c => map[c.userId] = c);
        setCustomersMap(map);
      })
      .catch(console.error);
  }, []);

  const handleViewDetail = async (id) => {
    setDetailModalVisible(true);
    setLoadingDetail(true);
    setCustomerDetail(null);
    try {
      const detail = await fetchLoyaltyTransactionDetail(id);
      setSelectedDetail(detail);

      const customerId = detail?.customerId || detail?.userId;
      if (customerId) {
        try {
          const cust = await fetchCustomerDetail(customerId);
          setCustomerDetail(cust);
        } catch (err) {
          console.error("Failed to load customer details", err);
        }
      }
    } catch (error) {
      console.error("Failed to load loyalty transaction detail", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderTypeTag = (type) => {
    let color = "blue";
    let displayText = type;

    if (type === "Earned" || type === "Earn") {
      color = "green";
      displayText = isVi ? "Tích điểm" : "Earned";
    } else if (type === "Redeemed" || type === "Redeem" || type === "Burn") {
      color = "volcano";
      displayText = isVi ? "Đổi điểm" : "Redeemed";
    }

    return <Tag color={color}>{displayText}</Tag>;
  };

  const columns = [
    {
      title: t("loyaltyTransactions.customer") || "Customer",
      dataIndex: "customerId",
      key: "customerId",
      render: (customerId) => <CustomerInfoCell customerId={customerId} customersMap={customersMap} />
    },
    {
      title: t("loyaltyTransactions.points") || "Points",
      dataIndex: "points",
      key: "points",
      sorter: (a, b) => a.points - b.points,
      render: (points, record) => {
        const isDeduct = record.transactionType === "Redeemed" || record.transactionType === "Redeem" || record.transactionType === "Burn";
        return (
          <Text strong type={isDeduct ? "danger" : "success"}>
            {isDeduct && points > 0 ? "-" : (points > 0 && !isDeduct ? "+" : "")}{points}
          </Text>
        );
      },
    },
    {
      title: t("loyaltyTransactions.type") || "Type",
      dataIndex: "transactionType",
      key: "transactionType",
      sorter: (a, b) => a.transactionType.localeCompare(b.transactionType),
      render: (type) => renderTypeTag(type),
    },
    {
      title: t("loyaltyTransactions.createdAt") || "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt || a.createdDate) - new Date(b.createdAt || b.createdDate),
      render: (date) => formatDate(date),
    },
    {
      title: isVi ? "Thao tác" : "Actions",
      key: "actions",
      render: (_, record) => (
        <Tooltip title={isVi ? "Xem chi tiết" : "View Details"}>
          <Button
            className="!rounded-full !border-[#c9799f] !text-[#c9799f] hover:!border-pink-500 hover:!text-pink-500 hover:!bg-pink-50"
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.loyaltyTransactionId || record.id)}
          />
        </Tooltip>
      ),
    },
  ];

  const filteredData = data.filter((item) => {
    if (filterType && item.transactionType !== filterType) {
      if (filterType === "Earned" && item.transactionType !== "Earn") return false;
      if (filterType === "Redeemed" && item.transactionType !== "Redeem" && item.transactionType !== "Burn") return false;
    }

    if (searchTerm) {
      const cust = customersMap[item.customerId || item.userId];
      if (!cust) return false;

      const term = searchTerm.toLowerCase();
      const matchName = `${cust.firstName} ${cust.lastName}`.toLowerCase().includes(term);
      const matchPhone = cust.phone && cust.phone.includes(term);

      if (!matchName && !matchPhone) return false;
    }

    return true;
  });

  const pointsIssued = filteredData.filter(d => d.transactionType === "Earned" || d.transactionType === "Earn").reduce((acc, curr) => acc + curr.points, 0);
  const pointsRedeemed = filteredData.filter(d => d.transactionType === "Redeemed" || d.transactionType === "Redeem" || d.transactionType === "Burn").reduce((acc, curr) => acc + Math.abs(curr.points), 0);

  const metrics = [
    {
      label: isVi ? "Tổng giao dịch" : "Total Transactions",
      value: filteredData.length || 0,
      icon: Gift,
      color: "#ec4899",
    },
    {
      label: isVi ? "Điểm đã cấp (Trang này)" : "Points Issued (This Page)",
      value: pointsIssued,
      icon: TrendingUp,
      color: "#10b981",
    },
    {
      label: isVi ? "Điểm đã đổi (Trang này)" : "Points Redeemed (This Page)",
      value: pointsRedeemed,
      icon: TrendingDown,
      color: "#f43f5e",
    }
  ];

  return (
    <div className="flex min-h-full flex-col gap-6 pb-10">

      <TopMetricsRow metrics={metrics} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" />

      <div className="rounded-lg border border-[#f5e3ed] bg-white p-5 shadow-sm">

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input.Search
            placeholder={isVi ? "Tìm kiếm khách hàng..." : "Search customer..."}
            allowClear
            className="w-full sm:max-w-xs"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Space>
            <Select
              placeholder={isVi ? "Loại giao dịch" : "Transaction Type"}
              allowClear
              className="w-40"
              options={[
                { value: "Earned", label: isVi ? "Tích điểm" : "Earned" },
                { value: "Redeemed", label: isVi ? "Đổi điểm" : "Redeemed" },
              ]}
              onChange={(value) => setFilterType(value)}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.loyaltyTransactionId || record.id}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      </div>

      <Modal
        title={t("loyaltyTransactions.transactionDetails") || "Transaction Details"}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedDetail(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {loadingDetail ? (
          <div className="flex justify-center p-10">
            <Text type="secondary">{t("loyaltyTransactions.loading") || "Loading..."}</Text>
          </div>
        ) : selectedDetail ? (
          <>
            <Descriptions bordered column={1} size="small" className="!my-4">
              <Descriptions.Item label={t("loyaltyTransactions.points") || "Points"}>
                <Text strong type={selectedDetail.transactionType === "Redeemed" || selectedDetail.transactionType === "Redeem" || selectedDetail.transactionType === "Burn" ? "danger" : "success"}>
                  {selectedDetail.points}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t("loyaltyTransactions.type") || "Type"}>
                {renderTypeTag(selectedDetail.transactionType)}
              </Descriptions.Item>
              <Descriptions.Item label={t("loyaltyTransactions.createdAt") || "Created At"}>
                {formatDate(selectedDetail.createdAt || selectedDetail.createdDate)}
              </Descriptions.Item>
              {selectedDetail.description && (
                <Descriptions.Item label="Description">
                  {selectedDetail.description}
                </Descriptions.Item>
              )}
            </Descriptions>
            <Collapse
              className="mt-8 mb-2"
              items={[
                {
                  key: '1',
                  label: <Text strong>{isVi ? "Thông tin khách hàng" : "Customer Information"}</Text>,
                  children: customerDetail ? (
                    (() => {
                      const cust = customerDetail;
                      return (
                        <Descriptions bordered column={1} size="small">
                          <Descriptions.Item label={isVi ? "Họ và tên" : "Name"}>
                            <Space>
                              <Avatar src={cust.avatarUrl}>
                                {!cust.avatarUrl && cust.firstName?.charAt(0)}
                              </Avatar>
                              <Text strong>{cust.firstName} {cust.lastName}</Text>
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label={isVi ? "Email" : "Email"}>
                            {cust.email || "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label={isVi ? "Số điện thoại" : "Phone"}>
                            {cust.phone || "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label={isVi ? "Điểm hiện tại" : "Current Points"}>
                            <Text type="success" strong>{cust.loyaltyPoint}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label={isVi ? "Tổng điểm tích lũy" : "Lifetime Points"}>
                            <Text strong>{cust.lifetimePoints}</Text>
                          </Descriptions.Item>
                          {/* <Descriptions.Item label={isVi ? "Kiểu móng yêu thích" : "Preferred Styles"}>
                            {cust.preferredStyles?.length > 0
                              ? cust.preferredStyles.map(s => <Tag color="purple" key={s}>{s}</Tag>)
                              : "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label={isVi ? "Màu sắc yêu thích" : "Preferred Colors"}>
                            {cust.preferredColors?.length > 0
                              ? cust.preferredColors.map(c => <Tag color="magenta" key={c}>{c}</Tag>)
                              : "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label={isVi ? "Tình trạng móng" : "Nail Condition"}>
                            {cust.nailCondition || "-"}
                          </Descriptions.Item> */}
                        </Descriptions>
                      );
                    })()
                  ) : (
                    <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Text type="secondary">{isVi ? "Không có thông tin khách hàng" : "Customer details not available"}</Text>
                    </div>
                  )
                }
              ]}
            />
          </>
        ) : (
          <div className="flex justify-center p-10">
            <Text type="secondary">{isVi ? "Không tải được chi tiết" : "Failed to load details"}</Text>
          </div>
        )}
      </Modal>
    </div>
  );
}
