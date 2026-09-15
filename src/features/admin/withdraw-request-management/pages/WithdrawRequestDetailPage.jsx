import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Modal, Spin, Tag, Typography, Form, Input, Avatar } from "antd";
import toast from "react-hot-toast";
import {
  ArrowLeft, CheckCircle, XCircle, Landmark, Calendar, User, Clock, NotebookPen,
  BanknoteArrowUp, CheckCircle2, AlertCircle, Mail, Phone, CreditCard, Copy
} from "lucide-react";
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

  function BankField({ icon: Icon, label, value, action }) {
    return (
      <div className="rounded-2xl border border-[#F3E2EC] bg-gradient-to-br from-white to-[#FFF9FB] p-4 transition hover:border-[#F3D6E5] hover:shadow-[0_4px_16px_-6px_rgba(232,79,147,0.15)]">
        <div className="flex items-center gap-2 mb-2">
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF0F5] text-[#E84F93]">
              <Icon size={13} />
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9E8497]">
            {label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">{value}</div>
          {action}
        </div>
      </div>
    );
  }

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
    <div className="w-full flex flex-col gap-4 font-sans">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60">
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

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
          <Card
            bordered={false}
            className="!shadow-[0_12px_32px_-8px_rgba(219,70,117,0.06)]
                !rounded-3xl overflow-hidden
                !border !border-[#F3E2EC]
                !h-full flex flex-col
                [&_.ant-card-body]:flex
                [&_.ant-card-body]:flex-1
                [&_.ant-card-body]:flex-col
                [&_.ant-card-body]:justify-center"
            title={
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EE] text-[#E84F93]">
                  <User size={16} />
                </span>
                <span className="text-sm font-bold text-[#2B182B] tracking-tight">
                  {isVi ? "Thông tin khách hàng" : "Customer Profile"}
                </span>
              </div>
            }
          >
            {customer ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <Avatar
                  src={customer.avatarUrl}
                  size={200}
                  className="!border-4 !border-white shadow-[0_8px_24px_-6px_rgba(232,79,147,0.35)] !bg-gradient-to-br !from-[#FF7AB8] !to-[#E84F93] !text-white !text-2xl !font-bold"
                >
                  {customer.firstName?.[0]}
                  {customer.lastName?.[0]}
                </Avatar>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-[#2B182B] tracking-tight !m-0">
                    {customer.firstName} {customer.lastName}
                  </h3>

                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="flex items-center justify-center gap-1.5 text-md font-medium text-[#9E8497] hover:text-[#E84F93] transition"
                    >
                      <Mail size={12} />
                      <span className="truncate max-w-[220px]">{customer.email}</span>
                    </a>
                  )}

                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex items-center justify-center gap-1.5 text-md font-medium text-[#9E8497] hover:text-[#E84F93] transition"
                    >
                      <Phone size={12} />
                      <span>{customer.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">
                  {isVi ? "Mã khách hàng" : "Customer ID"}
                </p>
                <p className="font-mono text-sm font-bold text-[#2B182B] break-all">
                  {detail.customerId}
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card
            bordered={false}
            className="!shadow-[...] !rounded-3xl overflow-hidden !border !border-[#F3E2EC] !h-full flex flex-col [&_.ant-card-body]:flex [&_.ant-card-body]:flex-col"
            title={
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EE] text-[#E84F93]">
                  <Landmark size={16} />
                </span>
                <span className="text-sm font-bold text-[#2B182B] tracking-tight">
                  {isVi ? "Chi tiết rút tiền" : "Withdrawal Details"}
                </span>
              </div>
            }
          >
            {/* ── Amount hero ── */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 p-5 mb-4">
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-200/30 blur-2xl" />

              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700/80 mb-1">
                    <BanknoteArrowUp size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                      {isVi ? "Số tiền yêu cầu" : "Requested Amount"}
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-emerald-600 tracking-tight tabular-nums">
                    {formatCurrency(detail.amount)}
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-[11px] font-semibold text-blue-700">
                    <Calendar size={12} className="text-blue-500" />
                    {isVi ? "Tạo lúc" : "Created"}:{" "}
                    {detail.createdAt
                      ? dayjs(detail.createdAt).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm")
                      : "-"}
                  </span>

                  {detail.processedAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                      <Clock size={12} className="text-emerald-500" />
                      {isVi ? "Đã xử lý lúc" : "Processed"}:{" "}
                      {dayjs(detail.processedAt).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <BankField
                icon={Landmark}
                label={isVi ? "Ngân hàng" : "Bank"}
                value={
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#2B182B]">{detail.bankCode}</span>
                    <span className="text-xs text-[#9E8497] truncate">{detail.bankName}</span>
                  </div>
                }
              />

              <BankField
                icon={User}
                label={isVi ? "Chủ tài khoản" : "Account Holder"}
                value={
                  <span className="text-sm font-bold text-[#2B182B] uppercase tracking-wide truncate">
                    {detail.accountHolderName}
                  </span>
                }
              />

              <div className="md:col-span-2">
                <BankField
                  icon={CreditCard}
                  label={isVi ? "Số tài khoản" : "Account Number"}
                  value={
                    <span className="font-mono text-xl font-bold tracking-[0.15em] text-[#2B182B]">
                      {detail.accountNumber}
                    </span>
                  }
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(detail.accountNumber);
                        toast.success(isVi ? "Đã sao chép số tài khoản!" : "Account number copied!");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#F3D6E5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#E84F93] hover:bg-[#FFF0F5] hover:border-[#E84F93] transition"
                    >
                      <Copy size={12} />
                      {isVi ? "Sao chép" : "Copy"}
                    </button>
                  }
                />
              </div>
            </div>

            {/* ── Transaction Reference ── */}
            {detail.transactionReference && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-1">
                    {isVi ? "Mã giao dịch" : "Transaction Reference"}
                  </p>
                  <p className="text-sm font-semibold text-blue-900 font-mono break-all">
                    {detail.transactionReference}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(detail.transactionReference);
                    toast.success(isVi ? "Đã sao chép mã!" : "Reference copied!");
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition"
                >
                  <Copy size={12} />
                  {isVi ? "Sao chép" : "Copy"}
                </button>
              </div>
            )}

            {/* ── Admin Note ── */}
            {detail.adminNote && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <NotebookPen size={14} className="text-[#E84F93]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9E8497]">
                    {isVi ? "Ghi chú quản trị" : "Admin Note"}
                  </span>
                </div>
                <div className="rounded-2xl border-l-4 border-l-[#E84F93] border-y border-r border-[#F3D6E5]/60 bg-gradient-to-r from-[#FFF5FA]/70 to-[#FFF0F5]/30 p-4">
                  <p className="text-sm text-[#2B182B] leading-relaxed whitespace-pre-wrap">
                    {detail.adminNote}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {isPending && (
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              form.resetFields();
              setIsRejectModalVisible(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#FECDD3] bg-white px-6 h-12 text-sm font-bold text-[#E11D48] hover:bg-[#FEF2F2] hover:border-[#E11D48] transition shadow-2xs"
          >
            <XCircle size={18} />
            {isVi ? "Từ chối yêu cầu" : "Reject Request"}
          </button>

          <button
            type="button"
            onClick={() => {
              form.resetFields();
              setIsApproveModalVisible(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#047857] px-6 h-12 text-sm font-bold text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_10px_28px_-6px_rgba(16,185,129,0.6)] hover:brightness-105 active:scale-[0.98] transition"
          >
            <CheckCircle size={18} />
            {isVi ? "Phê duyệt yêu cầu" : "Approve Request"}
          </button>
        </div>
      )}

      <Modal
        open={isApproveModalVisible}
        onCancel={() => setIsApproveModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
        width={520}
        styles={{
          content: { padding: 0, borderRadius: 24, overflow: "hidden", border: "none" },
          mask: { backdropFilter: "blur(6px)", backgroundColor: "rgba(64, 37, 66, 0.4)" },
        }}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#10B981] to-[#047857] px-6 pt-6 pb-6 text-white font-sans">
          <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <CheckCircle2 size={22} className="drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {isVi ? "Phê duyệt yêu cầu rút tiền" : "Approve Withdraw Request"}
              </h2>
              <p className="mt-1 text-xs text-emerald-50/90 font-medium leading-relaxed">
                {isVi
                  ? "Xác nhận rằng bạn đã chuyển khoản cho người dùng."
                  : "Confirm that you have transferred the funds to the user."}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-6 pt-6 space-y-2 font-sans">
          {/* Amount highlight */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80 mb-1">
              {isVi ? "Số tiền chuyển khoản" : "Amount to Transfer"}
            </p>
            <p className="text-2xl font-bold text-emerald-700 tracking-tight">
              {formatCurrency(detail.amount)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-800/70 font-medium leading-relaxed">
              {isVi
                ? "Số tiền này sẽ được đánh dấu là đã chuyển vào tài khoản ngân hàng của người dùng."
                : "This amount will be marked as transferred to the user's bank account."}
            </p>
          </div>

          <Form form={form} layout="vertical" onFinish={handleApprove} requiredMark={false}>
            <Form.Item
              name="transactionReference"
              label={
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b7282]">
                  {isVi ? "Mã giao dịch (Tùy chọn)" : "Transaction Reference (Optional)"}
                </span>
              }
            >
              <Input
                size="large"
                placeholder={isVi ? "Nhập mã giao dịch ngân hàng" : "Enter bank transaction code"}
                className="rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="adminNote"
              label={
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b7282]">
                  {isVi ? "Ghi chú quản trị (Tùy chọn)" : "Admin Note (Optional)"}
                </span>
              }
            >
              <TextArea
                rows={3}
                placeholder={isVi ? "Nhập ghi chú" : "Enter any notes about this approval"}
                className="rounded-xl"
                style={{ resize: "none" }}
              />
            </Form.Item>
          </Form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#F3E2EC] bg-[#FFFDFE] px-6 py-4">
          <Button
            onClick={() => setIsApproveModalVisible(false)}
            className="rounded-xl font-bold"
          >
            {isVi ? "Hủy" : "Cancel"}
          </Button>
          <Button
            onClick={() => form.submit()}
            loading={actionLoading}
            className="!rounded-xl
              !font-bold
              !text-white
             !bg-gradient-to-br from-[#10B981] to-[#047857]
              !border-none
              !shadow-md
              hover:!shadow-lg
              hover:!brightness-105"
          >
            {isVi ? "Xác nhận phê duyệt" : "Confirm Approve"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={isRejectModalVisible}
        onCancel={() => setIsRejectModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
        width={520}
        styles={{
          content: { padding: 0, borderRadius: 24, overflow: "hidden", border: "none" },
          mask: { backdropFilter: "blur(6px)", backgroundColor: "rgba(64, 37, 66, 0.4)" },
        }}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E11D48] to-[#9F1239] px-6 pt-6 pb-6 text-white font-sans">
          <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <XCircle size={22} className="drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {isVi ? "Từ chối yêu cầu rút tiền" : "Reject Withdraw Request"}
              </h2>
              <p className="mt-1 text-xs text-rose-50/90 font-medium leading-relaxed">
                {isVi
                  ? "Số tiền sẽ được hoàn trả lại vào ví của người dùng."
                  : "The amount will be refunded to the user's wallet."}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-6 pt-6 space-y-5 font-sans">
          {/* Refund notice */}
          <div className="flex gap-3 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-white p-4">
            <AlertCircle size={18} className="shrink-0 text-[#E11D48] mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#9F1239]">
                {isVi ? "Hoàn tiền tự động" : "Automatic Refund"}
              </p>
              <p className="mt-0.5 text-[11px] text-[#BE123C]/80 leading-relaxed font-medium">
                {isVi
                  ? "Số tiền yêu cầu sẽ được hoàn trả ngay vào ví của người dùng sau khi từ chối."
                  : "The requested amount will be refunded to the user's wallet immediately upon rejection."}
              </p>
            </div>
          </div>

          <Form form={form} layout="vertical" onFinish={handleReject} requiredMark={false}>
            <Form.Item
              name="adminNote"
              label={
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b7282]">
                  {isVi ? "Lý do từ chối" : "Reason for Rejection"}{" "}
                  <span className="text-[#E11D48]">*</span>
                </span>
              }
              rules={[
                {
                  required: true,
                  message: isVi
                    ? "Vui lòng cung cấp lý do từ chối"
                    : "Please provide a reason for rejecting this request.",
                },
              ]}
              className="mb-0"
            >
              <TextArea
                rows={4}
                placeholder={isVi ? "Nhập lý do từ chối" : "Enter reason for rejection"}
                className="rounded-xl"
                style={{ resize: "none" }}
              />
            </Form.Item>
          </Form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#F3E2EC] bg-[#FFFDFE] px-6 py-4">
          <Button
            onClick={() => setIsRejectModalVisible(false)}
            className="rounded-xl font-bold"
          >
            {isVi ? "Hủy" : "Cancel"}
          </Button>
          <Button
            danger
            type="primary"
            onClick={() => form.submit()}
            loading={actionLoading}
            className="rounded-xl font-bold shadow-md hover:shadow-lg"
          >
            {isVi ? "Xác nhận từ chối" : "Confirm Reject"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
