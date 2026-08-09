import { X, XCircle, Clock, User, DollarSign, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, Input, Checkbox, Select } from "antd";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { cancelBooking } from "../services/bookingsService";
import { motion } from "framer-motion";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const CANCEL_REASONS = [
  { label: "Customer requested cancellation", value: "customer_request" },
  { label: "Staff artist unavailable", value: "staff_unavailable" },
  { label: "Salon closed / Holiday", value: "salon_closed" },
  { label: "Double booking conflict", value: "double_booking" },
  { label: "Other reason", value: "other" },
];

export function CancelBookingModal({
  open,
  onClose,
  bookingId,
  onSuccess,
  booking = {},
}) {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleCancelBooking = async () => {
    if (!reason) {
      toast("Please select a cancellation reason", { icon: "⚠️" });
      return;
    }

    if (!isConfirmed) {
      toast("Please confirm the cancellation", { icon: "⚠️" });
      return;
    }

    try {
      setIsLoading(true);
      const fullReason = details ? `${reason} - ${details}` : reason;
      await cancelBooking(bookingId, fullReason, booking?.holdToken);
      toast.success(isVi ? "Đã hủy lịch hẹn thành công!" : "Booking cancelled successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      toast.error(isVi ? "Đã hủy lịch hẹn thất bại." : "Failed to cancel booking.");
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

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      destroyOnClose
      width={500}
      styles={{
        content: { padding: 0, borderRadius: 28, overflow: "hidden", border: "none" },
        mask: { backdropFilter: "blur(6px)", backgroundColor: "rgba(64, 37, 66, 0.4)" },
      }}
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#db8520] to-[#b36611] px-6 pt-8 pb-10 text-white font-sans">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-black/10 blur-lg"></div>
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-inner">
            <XCircle size={26} className="drop-shadow-md animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{isVi ? "Hủy lịch hẹn" : "Cancel Booking"}</h2>
            <p className="mt-1 text-xs text-amber-100/90 font-medium">{isVi ? "Thao tác này sẽ hủy yêu cầu đặt lịch của khách hàng" : "This action will cancel the customer's appointment request"}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="-mt-6 rounded-t-[28px] bg-white px-6 pt-8 pb-6 space-y-5 relative z-10 font-sans">
        {/* Warning Alert */}
        <div className="flex gap-3 rounded-2xl border border-[#ffecca] bg-[#fffbf4] p-4 shadow-[0_2px_8px_rgba(219,133,32,0.03)]">
          <AlertCircle size={18} className="shrink-0 text-[#db8520] mt-0.5" />
          <div>
            <p className="text-xs font-extrabold text-[#7c4d16]">{isVi ? "Thông báo quan trọng" : "Important Notice"}</p>
            <p className="mt-1 text-xs text-[#a3723b] leading-relaxed font-medium">
              {isVi ? "Hủy lịch hẹn sẽ gửi thông báo tự động đến khách hàng và có thể ảnh hưởng đến trải nghiệm dịch vụ của họ." : "Cancelling an appointment will trigger an automated notification to the customer and may impact their service experience."}
            </p>
          </div>
        </div>

        {/* Booking Details */}
        {Object.keys(booking).length > 0 && (
          <div className="space-y-3 rounded-2xl border border-[#ffdcb5]/60 bg-gradient-to-b from-[#fffcf8] to-[#fff6ec] p-4 shadow-[0_4px_16px_rgba(219,133,32,0.02)]">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#db8520]/80">
              {isVi ? "Chi tiết lịch hẹn" : "Booking Details"}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
              {booking.customerName && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fff0dd] text-[#db8520] shadow-sm">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8e7b89] font-semibold uppercase tracking-wider">{isVi ? "Khách hàng" : "Customer"}</p>
                    <p className="font-extrabold text-[#402542] text-[13px]">{booking.customerName}</p>
                  </div>
                </div>
              )}
              {booking.date && booking.time && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fff0dd] text-[#db8520] shadow-sm">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8e7b89] font-semibold uppercase tracking-wider">{isVi ? "Thời gian" : "Time Slot"}</p>
                    <p className="font-extrabold text-[#402542] text-[13px]">{booking.time} ({booking.date})</p>
                  </div>
                </div>
              )}
              {booking.totalPrice && (
                <div className="col-span-2 flex items-center justify-between border-t border-[#ffdcb5]/30 pt-2 mt-1 text-xs">
                  <span className="font-semibold text-[#8e7b89]">{isVi ? "Tổng giá trị:" : "Total Amount:"}</span>
                  <span className="text-base font-bold text-[#db8520]">{booking.totalPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reason Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
            {isVi ? "Lý do hủy" : "Cancellation Reason"} <span className="text-[#db8520] font-bold">*</span>
          </label>
          <Select
            value={reason || undefined}
            onChange={setReason}
            placeholder={isVi ? "Chọn lý do hủy..." : "Select cancellation reason..."}
            disabled={isLoading}
            options={CANCEL_REASONS}
            style={{
              width: "100%",
            }}
          />
        </div>

        {/* Details Field */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
            {isVi ? "Ghi chú thêm (Tùy chọn)" : "Additional Notes (Optional)"}
          </label>
          <Input.TextArea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={isVi ? "Cung cấp thông tin chi tiết về việc hủy này..." : "Provide additional details regarding this cancellation..."}
            rows={3}
            maxLength={300}
            disabled={isLoading}
            className="border-[#f0d9e8] focus:border-[#ea4f93] hover:border-[#ea4f93] focus:shadow-[0_0_0_2px_rgba(234,79,147,0.1)] text-xs rounded-xl transition-all"
            style={{
              fontFamily: "inherit",
              resize: "none",
            }}
          />
          <div className="flex justify-end">
            <span className="text-[9px] font-extrabold text-[#c49aaf] bg-[#fff5f9] px-2 py-0.5 rounded-full border border-[#fce4ee]">{details.length}/300</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="space-y-2 rounded-2xl border border-[#ffdcb5]/60 bg-[#fffdfb] p-4 shadow-[0_2px_8px_rgba(219,133,32,0.02)]">
          <p className="text-xs font-extrabold text-[#7c4d16]">{isVi ? "Sau khi hủy:" : "After cancellation:"}</p>
          <ul className="space-y-1 text-xs text-[#a3723b] font-medium leading-relaxed">
            <li>{isVi ? "Khách hàng sẽ nhận được thông báo hủy lịch hẹn" : "Customer will receive a cancellation update notification"}</li>
            <li>{isVi ? "Trạng thái lịch hẹn sẽ được đặt là Hủy vĩnh viễn" : "Booking status will be set to Cancelled permanently"}</li>
            <li>{isVi ? "Việc hoàn tiền đặt cọc (nếu có) sẽ tuân theo điều khoản của salon" : "Deposit refunds (if applicable) will follow salon terms"}</li>
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <Checkbox
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
          disabled={isLoading}
          className="text-xs"
        >
          <span className="text-[#7a6176] font-medium">
            {isVi ? "Tôi đã đọc, hiểu và đồng ý hủy lịch hẹn này" : "I have read, understood, and agree to cancel this booking"} <span className="font-extrabold text-[#db8520]"></span>
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
            {isVi ? "Giữ lại lịch hẹn" : "Keep Booking"}
          </button>
          <button
            type="button"
            onClick={handleCancelBooking}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#db8520] to-[#e89c3c] text-xs font-bold text-white shadow-[0_4px_14px_rgba(219,133,32,0.25)] hover:shadow-[0_6px_20px_rgba(219,133,32,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading || !reason || !isConfirmed}
          >
            {isLoading ? (
              <Spin size="small" className="text-white" />
            ) : (
              <>
                <XCircle size={14} />
                {isVi ? "Xác nhận hủy" : "Confirm Cancellation"}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

CancelBookingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bookingId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  booking: PropTypes.object,
};