import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Modal, Spin, Tag, Typography, Form, Input, Avatar, Space, Divider } from "antd";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle, XCircle, Landmark, CreditCard, Calendar, User, Wallet as WalletIcon, Clock, NotebookPen, BanknoteArrowUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  fetchWithdrawalRequestDetail,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  fetchWalletById,
  fetchCustomerById,
} from "../services/withdrawRequestService";
import {
  getWithdrawRequestStatusColor,
  getWithdrawRequestStatusLabel,
} from "../utils/withdrawRequestUtils";

const { Title, Text } = Typography;
const { TextArea } = Input;

export function WithdrawRequestDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === "vi";
  const [form] = Form.useForm();

  const [detail, setDetail] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setError("");

    try {
      const data = await fetchWithdrawalRequestDetail(requestId);
      setDetail(data);

      if (data.customerId) {
        try {
          const custData = await fetchCustomerById(data.customerId);
          setCustomer(custData);
        } catch (e) {
          console.error("Failed to fetch customer", e);
        }
      }

      if (data.walletId) {
        try {
          const walletData = await fetchWalletById(data.walletId);
          setWallet(walletData);
        } catch (e) {
          console.error("Failed to fetch wallet", e);
        }
      }
    } catch (err) {
      setError(err.message || isVi ? "Không thể tải thông tin yêu cầu" : "Failed to load request detail.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleApprove = async (values) => {
    setActionLoading(true);
    try {
      await approveWithdrawalRequest(requestId, {
        adminNote: values.adminNote || "",
        transactionReference: values.transactionReference || "",
      });
      toast.success(isVi ? "Đã duyệt yêu cầu rút tiền thành công." : "Withdrawal request approved successfully.");
      setIsApproveModalVisible(false);
      form.resetFields();
      loadDetail(); // Reload data
    } catch (err) {
      toast.error(err.message || isVi ? "Không thể duyệt yêu cầu" : "Failed to approve request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (values) => {
    setActionLoading(true);
    try {
      await rejectWithdrawalRequest(requestId, {
        adminNote: values.adminNote,
      });
      toast.success(isVi ? "Đã từ chối yêu cầu rút tiền thành công." : "Withdrawal request rejected successfully.");
      setIsRejectModalVisible(false);
      form.resetFields();
      loadDetail(); // Reload data
    } catch (err) {
      toast.error(err.message || isVi ? "Không thể từ chối yêu cầu" : "Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert message="Error" description={error} type="error" showIcon />
        <Button onClick={() => navigate(ROUTES.adminWithdrawRequests)} className="mt-4">
          {isVi ? "Quay lại danh sách" : "Back to List"}
        </Button>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const isPending = detail.status === "Pending";

  return (
    <div className="w-full flex flex-col gap-8 p-6 font-sans pb-12">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate(ROUTES.adminWithdrawRequests)}
            className="!flex !items-center !text-slate-500 !hover:text-slate-800 !bg-slate-100 !hover:bg-slate-200 !border-0 !h-10 !px-4 !rounded-xl"
          >
            {isVi ? "Quay lại" : "Back"}
          </Button>
          <div>
            <Title level={2} className="!m-0 !text-2xl !font-bold tracking-tight text-[#2d1b35]">
              {isVi ? "Chi tiết yêu cầu rút tiền" : "Withdraw Request Detail"}
            </Title>
          </div>
        </div>
        <Tag color={getWithdrawRequestStatusColor(detail.status)} className="text-sm px-4 py-1.5 rounded-full font-medium border-0 m-0 text-center">
          {getWithdrawRequestStatusLabel(detail.status, language)}
        </Tag>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Wallet */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card title={<div className="flex items-center gap-2"><User size={18} className="text-[#ea4f93]" />{isVi ? "Thông tin khách hàng" : "Customer Profile"}</div>} bordered={false} className="shadow-sm rounded-2xl overflow-hidden">
            {customer ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <Avatar src={customer.avatarUrl} size={80} className="border-4 border-slate-50 shadow-sm text-2xl bg-blue-100 text-blue-600">
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </Avatar>
                <div>
                  <Title level={4} className="!m-0 !text-lg">{customer.firstName} {customer.lastName}</Title>
                  <Text className="text-slate-500 block text-sm">{customer.email}</Text>
                  <Text className="text-slate-500 block text-sm">{customer.phone}</Text>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <Text type="secondary">{isVi ? "Mã khách hàng:" : "Customer ID:"}</Text>
                <Text copyable className="font-mono block mt-1">{detail.customerId}</Text>
              </div>
            )}
          </Card>

          <Card title={<div className="flex items-center gap-2"><WalletIcon size={18} className="text-[#ea4f93]" /> {isVi ? "Tổng quan ví" : "Wallet Summary"}</div>} bordered={false} className="shadow-sm rounded-2xl overflow-hidden">
            {wallet ? (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <Text className="!text-slate-500 !font-medium !text-xs  !tracking-wider">{isVi ? "Hạng" : "Tier"}</Text>
                  <Tag color="gold" className="m-0 border-0 font-bold px-3 py-1 rounded-full">{wallet.tierName}</Tag>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <Text className="!text-slate-500 !font-medium !text-xs  !tracking-wider">{isVi ? "Điểm hiện tại" : "Current Points"}</Text>
                  <Text strong className="!text-yellow-800">{wallet.loyaltyPoint}</Text>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <Text className="!text-slate-500 !font-medium !text-xs  !tracking-wider">{isVi ? "Tổng điểm" : "Lifetime Points"}</Text>
                  <Text strong className="!text-green-800">{wallet.lifetimePoints}</Text>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <Text type="secondary">{isVi ? "Mã ví:" : "Wallet ID:"}</Text>
                <Text copyable className="font-mono block mt-1">{detail.walletId}</Text>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Request Details & Bank Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title={<div className="flex items-center gap-2"><Landmark size={18} className="text-[#ea4f93]" /> {isVi ? "Chi tiết rút tiền" : "Withdrawal Details"}</div>} bordered={false} className="shadow-sm rounded-2xl overflow-hidden">

            <div className="flex flex-col md:flex-row gap-6 p-6 bg-pink-50/50 rounded-xl border border-pink-100 mb-6 items-center justify-between">
              <div className="flex flex-col items-center justify-center">
                <Text className="text-pink-600 font-bold flex items-center gap-2 tracking-[0.15em] text-[10px] block mb-1"><BanknoteArrowUp size={20} /> {isVi ? "Số tiền yêu cầu" : "Requested Amount"}</Text>
                <Text className="text-3xl sm:text-4xl font-bold !text-green-600 tracking-tight">{formatCurrency(detail.amount)}</Text>
              </div>
              <div className="flex flex-col items-end text-right gap-2">
                <div className="flex items-center gap-1.5 text-blue-700 bg-blue-100/50 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">
                  <Calendar size={14} className="text-blue-500" /> {isVi ? "Tạo lúc" : "Created"}: {detail.createdAt ? dayjs(detail.createdAt).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm") : "-"}
                </div>
                {detail.processedAt && (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                    <Clock size={14} className="text-emerald-500" /> {isVi ? "Đã xử lý lúc" : "Processed"}: {dayjs(detail.processedAt).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm")}
                  </div>
                )}
              </div>
            </div>

            <Title level={5} className="!mb-4 !mt-2 text-slate-700">{isVi ? "Thông tin ngân hàng" : "Bank Information"}</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center h-full">
                <Text className="!text-slate-400 !text-[13px] !font-bold  !tracking-[0.15em] !block !mb-1">{isVi ? "Mã / Tên ngân hàng" : "Bank Code / Name"}</Text>
                <div className="flex items-center gap-2">
                  <Text strong className="!text-base !text-slate-800 block">{detail.bankCode}</Text>
                  <Text className="!text-slate-600 !text-sm">{detail.bankName}</Text>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center h-full">
                <Text className="!text-slate-400 !text-[13px] !font-bold  !tracking-[0.15em] !block !mb-1">{isVi ? "Chủ tài khoản" : "Account Holder"}</Text>
                <Text strong className="!text-base !text-slate-800 !block ">{detail.accountHolderName}</Text>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2 flex items-center justify-between">
                <div>
                  <Text className="!text-slate-400 !text-[13px] !font-bold  !tracking-[0.15em] !block !mb-1">{isVi ? "Số tài khoản" : "Account Number"}</Text>
                  <Text strong className="!text-xl !tracking-widest !font-mono !text-slate-800">{detail.accountNumber}</Text>
                </div>
                <Button type="text" className="!text-[#ea4f93] !bg-[#ea4f93]/10 !hover:bg-[#ea4f93]/20 !font-semibold" onClick={() => {
                  navigator.clipboard.writeText(detail.accountNumber);
                  toast.success("Account number copied!");
                }}>
                  {isVi ? "Sao chép" : "Copy"}
                </Button>
              </div>
            </div>

            {detail.transactionReference && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div>
                  <Text className="text-blue-600 text-xs font-bold tracking-wider block mb-1">{isVi ? "Mã giao dịch" : "Transaction Reference"}</Text>
                  <Text strong className="!text-blue-900 font-semibold">{detail.transactionReference}</Text>
                </div>
                <Button type="text" className="!text-blue-600 !bg-blue-100 !hover:bg-blue-200 !font-semibold" onClick={() => {
                  navigator.clipboard.writeText(detail.transactionReference);
                  toast.success("Reference copied!");
                }}>
                  {isVi ? "Sao chép" : "Copy"}
                </Button>
              </div>
            )}

            {detail.adminNote && (
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <NotebookPen className="text-[#ea4f93]" size={20} />
                  <Text className="text-slate-500 text-xs font-bold tracking-wider">{isVi ? "Ghi chú quản trị" : "Admin Note"}</Text>
                </div>
                <div className="p-4 bg-slate-50 border border-pink-500 rounded-xl flex items-center gap-2">
                  <Text className="text-slate-700">{detail.adminNote}</Text>
                </div>
              </div>
            )}
          </Card>

          {isPending && (
            <div className="flex justify-end gap-4 mt-2">
              <Button
                danger
                icon={<XCircle size={18} />}
                size="large"
                className="flex items-center gap-2 px-6 rounded-xl h-12 text-base font-medium"
                onClick={() => {
                  form.resetFields();
                  setIsRejectModalVisible(true);
                }}
              >
                {isVi ? "Từ chối yêu cầu" : "Reject Request"}
              </Button>
              <Button
                type="primary"
                icon={<CheckCircle size={18} />}
                size="large"
                className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] border-0 px-6 rounded-xl h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  form.resetFields();
                  setIsApproveModalVisible(true);
                }}
              >
                {isVi ? "Phê duyệt yêu cầu" : "Approve Request"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        title={isVi ? "Phê duyệt yêu cầu rút tiền" : "Approve Withdraw Request"}
        open={isApproveModalVisible}
        onCancel={() => setIsApproveModalVisible(false)}
        footer={null}
      >
        <Alert
          message={isVi ? "Bạn sắp phê duyệt yêu cầu này." : "You are about to approve this request."}
          description={<>{isVi ? "Số tiền <b>{formatCurrency(detail.amount)}</b> sẽ được đánh dấu là đã chuyển khoản cho người dùng." : "The amount <b>{formatCurrency(detail.amount)}</b> will be marked as transferred to the user's bank account."}</>}
          type="info"
          showIcon
          className="mb-4"
        />
        <Form form={form} layout="vertical" onFinish={handleApprove}>
          <Form.Item
            name="transactionReference"
            label={isVi ? "Mã giao dịch (Tùy chọn)" : "Transaction Reference (Optional)"}
          >
            <Input placeholder={isVi ? "Nhập mã giao dịch ngân hàng" : "Enter bank transaction code"} />
          </Form.Item>
          <Form.Item
            name="adminNote"
            label={isVi ? "Ghi chú quản trị (Tùy chọn)" : "Admin Note (Optional)"}
          >
            <TextArea rows={4} placeholder={isVi ? "Nhập ghi chú" : "Enter any notes about this approval"} />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsApproveModalVisible(false)}>{isVi ? "Hủy" : "Cancel"}</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading} className="bg-green-600 hover:bg-green-700">
              {isVi ? "Xác nhận phê duyệt" : "Confirm Approve"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={isVi ? "Từ chối yêu cầu rút tiền" : "Reject Withdraw Request"}
        open={isRejectModalVisible}
        onCancel={() => setIsRejectModalVisible(false)}
        footer={null}
      >
        <Alert
          message={isVi ? "Bạn sắp từ chối yêu cầu này." : "You are about to reject this request."}
          description={isVi ? "Số tiền yêu cầu sẽ được hoàn trả vào ví của người dùng." : "The requested amount will be refunded to the user's wallet."}
          type="warning"
          showIcon
          className="mb-4"
        />
        <Form form={form} layout="vertical" onFinish={handleReject}>
          <Form.Item
            name="adminNote"
            label={isVi ? "Lý do từ chối (Bắt buộc)" : "Reason for Rejection (Required)"}
            rules={[{ required: true, message: isVi ? "Vui lòng cung cấp lý do từ chối" : "Please provide a reason for rejecting this request." }]}
          >
            <TextArea rows={4} placeholder={isVi ? "Nhập lý do từ chối" : "Enter reason for rejection"} />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsRejectModalVisible(false)}>{isVi ? "Hủy" : "Cancel"}</Button>
            <Button danger type="primary" htmlType="submit" loading={actionLoading}>
              {isVi ? "Xác nhận từ chối" : "Confirm Reject"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
