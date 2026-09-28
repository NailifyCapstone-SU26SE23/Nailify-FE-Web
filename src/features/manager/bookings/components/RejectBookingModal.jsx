import { X, XCircle, Clock, User, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, Input, Checkbox, Select } from "antd";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { rejectBooking } from "../services/bookingsService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const REJECT_REASONS = {
  en: [
    { label: "Customer not responding to calls/messages", value: "no_response" },
    { label: "Invalid or incomplete booking details", value: "invalid_details" },
    { label: "Requested service currently unavailable", value: "service_unavailable" },
    { label: "Deposit or payment verification issue", value: "payment_issue" },
    { label: "Policy violation or suspicious activity", value: "suspicious" },
    { label: "Other reason", value: "other" },
  ],
  vi: [
    { label: "Khách hàng không phản hồi cuộc gọi/tin nhắn", value: "no_response" },
    { label: "Thông tin đặt lịch không hợp lệ hoặc chưa đầy đủ", value: "invalid_details" },
    { label: "Dịch vụ yêu cầu hiện không khả dụng", value: "service_unavailable" },
    { label: "Vấn đề xác minh tiền cọc hoặc thanh toán", value: "payment_issue" },
    { label: "Vi phạm chính sách hoặc hoạt động đáng ngờ", value: "suspicious" },
    { label: "Lý do khác", value: "other" },
  ],
};

export function RejectBookingModal({
  open,
  onClose,
  bookingId,
  onSuccess,
  booking = {},
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { language } = useLanguage();

  const handleReject = async () => {
    if (!reason) {
      toast(language === "vi" ? "Vui lòng chọn lý do từ chối" : "Please select a rejection reason", { icon: "⚠️" });
      return;
    }

    if (!isConfirmed) {
      toast(language === "vi" ? "Vui lòng xác nhận việc từ chối" : "Please confirm the rejection", { icon: "⚠️" });
      return;
    }

    try {
      setIsLoading(true);
      const fullReason = details ? `${reason} - ${details}` : reason;
      await rejectBooking(bookingId, fullReason);
      toast.success(language === "vi" ? "Từ chối yêu cầu đặt lịch thành công!" : "Booking rejected successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      console.error("Failed to reject booking:", err);
      toast.error(language === "vi" ? "Lỗi từ chối yêu cầu đặt lịch!" : "Failed to reject booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setReason("");
    setDetails("");
    setIsConfirmed(false);
  };

  function formatPriceVND(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      destroyOnClose
      width={820}
      styles={{
        content: { overflow: "hidden", border: "none" },
        mask: { backdropFilter: "blur(6px)", backgroundColor: "rgba(64, 37, 66, 0.4)" },
      }}
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#e1447f] to-[#b32b5d] px-6 pt-4 pb-4 text-white font-sans">
        <div className="relative flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{language === "vi" ? "Từ chối yêu cầu đặt lịch" : "Reject Booking"}</h2>
            <p className="mt-1 text-xs text-rose-100/90 font-medium">{language === "vi" ? "Hành động này sẽ từ chối yêu cầu đặt lịch của khách hàng" : "This action will reject the customer's appointment request"}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white px-6 pt-6 space-y-5 relative z-10 font-sans">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch">
          {/* LEFT — Booking Details */}
          <div className="flex flex-col space-y-3 rounded-2xl border border-[#ffd4e5]/60 bg-gradient-to-b from-[#fffcfd] to-[#fff5f8] p-4 shadow-[0_4px_16px_rgba(225,68,127,0.02)]">
            {Object.keys(booking).length > 0 ? (
              <div className="flex flex-1 flex-col justify-between gap-4">
                {/* Customer */}
                {booking.customerName && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                      {language === "vi" ? "Khách hàng" : "Customer"}
                    </label>
                    <div className="flex h-10 items-center gap-2 rounded-xl border border-[#f0d9e8] bg-white px-3 text-xs">
                      <User size={14} className="shrink-0 text-[#e1447f]" />
                      <span className="font-semibold text-[#402542]">{booking.customerName}</span>
                    </div>
                  </div>
                )}

                {/* Time Slot */}
                {booking.date && booking.time && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                      {language === "vi" ? "Thời gian đặt lịch" : "Time Slot"}
                    </label>
                    <div className="flex h-10 items-center gap-2 rounded-xl border border-[#f0d9e8] bg-white px-3 text-xs">
                      <Clock size={14} className="shrink-0 text-[#e1447f]" />
                      <span className="font-semibold text-[#402542]">
                        {booking.time} ({booking.date})
                      </span>
                    </div>
                  </div>
                )}

                {/* Total Value */}
                {booking.totalPrice && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                      {language === "vi" ? "Tổng giá trị" : "Total Value"}
                    </label>
                    <div className="flex h-10 items-center rounded-xl border border-[#f0d9e8] bg-white px-3 text-xs">
                      <span className="text-base font-bold text-[#e1447f]">{formatPriceVND(booking.totalPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="pt-1 text-xs text-[#c49aaf]">
                {language === "vi" ? "Không có thông tin đặt lịch" : "No booking information available"}
              </p>
            )}
          </div>

          {/* RIGHT — Reason + Notes */}
          <div className="flex flex-col gap-4">
            {/* Reason Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                {language === "vi" ? "Lý do từ chối" : "Rejection Reason"}{" "}
                <span className="text-[#e1447f] font-bold">*</span>
              </label>
              <Select
                value={reason || undefined}
                onChange={setReason}
                placeholder={language === "vi" ? "Chọn lý do từ chối" : "Select rejection reason..."}
                disabled={isLoading}
                options={REJECT_REASONS[language] ?? REJECT_REASONS.en}
                style={{ width: "100%" }}
              />
            </div>

            {/* Details Field — grows to fill remaining height */}
            <div className="flex flex-1 flex-col space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                {language === "vi" ? "Ghi chú thêm (Tùy chọn)" : "Additional Notes (Optional)"}
              </label>
              <Input.TextArea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  language === "vi"
                    ? "Nhập ghi chú thêm về việc từ chối này..."
                    : "Provide additional details regarding this rejection..."
                }
                maxLength={300}
                disabled={isLoading}
                className="flex-1 border-[#f0d9e8] focus:border-[#ea4f93] hover:border-[#ea4f93] focus:shadow-[0_0_0_2px_rgba(234,79,147,0.1)] text-xs rounded-xl transition-all"
                style={{
                  fontFamily: "inherit",
                  resize: "none",
                  minHeight: "96px",
                }}
              />
              <div className="flex justify-end">
                <span className="text-[9px] font-bold text-[#c49aaf] bg-[#fff5f9] px-2 py-0.5 rounded-full border border-[#fce4ee]">
                  {details.length}/300
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <Checkbox
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
          disabled={isLoading}
          className="text-xs"
        >
          <span className="text-[#7a6176] font-medium">
            {language === "vi" ? "Tôi xác nhận rằng tôi muốn từ chối yêu cầu đặt lịch này" : "I confirm that I want to reject this appointment"}
          </span>
        </Checkbox>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 h-11 rounded-xl border border-[#f0d9e8] bg-white text-xs font-bold text-[#402542] hover:text-[#ea4f93] hover:border-[#ea4f93] hover:bg-[#fffcfd] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <X size={14} />
            {language === "vi" ? "Giữ yêu cầu" : "Keep Request"}
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#e1447f] to-[#b32b5d] text-xs font-bold text-white shadow-[0_4px_14px_rgba(225,68,127,0.25)] hover:shadow-[0_6px_20px_rgba(225,68,127,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading || !reason || !isConfirmed}
          >
            {isLoading ? (
              <Spin size="small" className="text-white" />
            ) : (
              <>
                <XCircle size={14} />
                {language === "vi" ? "Xác nhận từ chối" : "Confirm Rejection"}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal >
  );
}

RejectBookingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bookingId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  booking: PropTypes.object,
};