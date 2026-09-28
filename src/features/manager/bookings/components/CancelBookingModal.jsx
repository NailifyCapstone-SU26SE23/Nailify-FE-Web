import { X, XCircle, Clock, User, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, Input, Checkbox, Select } from "antd";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { cancelBooking } from "../services/bookingsService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const CANCEL_REASONS = {
  en: [
    { label: "Customer requested cancellation", value: "customer_request" },
    { label: "Staff artist unavailable", value: "staff_unavailable" },
    { label: "Salon closed / Holiday", value: "salon_closed" },
    { label: "Double booking conflict", value: "double_booking" },
    { label: "Other reason", value: "other" },
  ],
  vi: [
    { label: "Khách hàng yêu cầu hủy", value: "customer_request" },
    { label: "Nhân viên/Nghệ sĩ không khả dụng", value: "staff_unavailable" },
    { label: "Salon đóng cửa / Ngày lễ", value: "salon_closed" },
    { label: "Trùng lịch đặt", value: "double_booking" },
    { label: "Lý do khác", value: "other" },
  ],
};

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

  function formatPriceVND(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
  }
  
  const handleCancelBooking = async () => {
    if (!reason) {
      toast(isVi ? "Vui lòng chọn lý do hủy" : "Please select a cancellation reason", { icon: "⚠️" });
      return;
    }

    if (!isConfirmed) {
      toast(isVi ? "Vui lòng xác nhận việc hủy" : "Please confirm the cancellation", { icon: "⚠️" });
      return;
    }

    try {
      setIsLoading(true);
      const fullReason = details ? `${reason} - ${details}` : reason;

      await cancelBooking(bookingId, {
        reason: fullReason,
        holdToken: booking?.holdToken,
        customerRequest: reason === "customer_request" ? true : null,
      });

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
      width={820}
      styles={{
        content: { overflow: "hidden", border: "none" },
        mask: { backdropFilter: "blur(6px)", backgroundColor: "rgba(64, 37, 66, 0.4)" },
      }}
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#db8520] to-[#b36611] px-6 pt-4 pb-4 text-white font-sans">
        <div className="relative flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isVi ? "Hủy lịch hẹn" : "Cancel Booking"}
            </h2>
            <p className="mt-1 text-xs text-amber-100/90 font-medium">
              {isVi
                ? "Thao tác này sẽ hủy yêu cầu đặt lịch của khách hàng"
                : "This action will cancel the customer's appointment request"}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white px-6 pt-6 space-y-5 relative z-10 font-sans">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch">
          {/* LEFT — Booking Details */}
          <div className="flex flex-col space-y-3 rounded-2xl border border-[#ffdcb5]/60 bg-gradient-to-b from-[#fffcf8] to-[#fff6ec] p-4 shadow-[0_4px_16px_rgba(219,133,32,0.02)]">
            {Object.keys(booking).length > 0 ? (
              <div className="flex flex-1 flex-col justify-between gap-4">
                {/* Customer */}
                {booking.customerName && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                      {isVi ? "Khách hàng" : "Customer"}
                    </label>
                    <div className="flex h-10 items-center gap-2 rounded-xl border border-[#f0e0cc] bg-white px-3 text-xs">
                      <User size={14} className="shrink-0 text-[#db8520]" />
                      <span className="font-semibold text-[#402542]">{booking.customerName}</span>
                    </div>
                  </div>
                )}

                {/* Time Slot */}
                {booking.date && booking.time && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                      {isVi ? "Thời gian đặt lịch" : "Time Slot"}
                    </label>
                    <div className="flex h-10 items-center gap-2 rounded-xl border border-[#f0e0cc] bg-white px-3 text-xs">
                      <Clock size={14} className="shrink-0 text-[#db8520]" />
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
                      {isVi ? "Tổng giá trị" : "Total Value"}
                    </label>
                    <div className="flex h-10 items-center rounded-xl border border-[#f0e0cc] bg-white px-3 text-xs">
                      <span className="text-base font-bold text-[#db8520]">
                        {formatPriceVND ? formatPriceVND(booking.totalPrice) : booking.totalPrice}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="pt-1 text-xs text-[#c49aaf]">
                {isVi ? "Không có thông tin đặt lịch" : "No booking information available"}
              </p>
            )}
          </div>

          {/* RIGHT — Reason + Notes */}
          <div className="flex flex-col gap-4">
            {/* Reason Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                {isVi ? "Lý do hủy" : "Cancellation Reason"}{" "}
                <span className="text-[#db8520] font-bold">*</span>
              </label>
              <Select
                value={reason || undefined}
                onChange={setReason}
                placeholder={isVi ? "Chọn lý do hủy..." : "Select cancellation reason..."}
                disabled={isLoading}
                options={CANCEL_REASONS[language] ?? CANCEL_REASONS.en}
                style={{ width: "100%" }}
              />
            </div>

            {/* Details Field — grows to fill remaining height */}
            <div className="flex flex-1 flex-col space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b7282]">
                {isVi ? "Ghi chú thêm (Tùy chọn)" : "Additional Notes (Optional)"}
              </label>
              <Input.TextArea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  isVi
                    ? "Cung cấp thông tin chi tiết về việc hủy này..."
                    : "Provide additional details regarding this cancellation..."
                }
                maxLength={300}
                disabled={isLoading}
                className="flex-1 border-[#f0e0cc] focus:border-[#db8520] hover:border-[#db8520] focus:shadow-[0_0_0_2px_rgba(219,133,32,0.1)] text-xs rounded-xl transition-all"
                style={{
                  fontFamily: "inherit",
                  resize: "none",
                  minHeight: "96px",
                }}
              />
              <div className="flex justify-end">
                <span className="text-[9px] font-bold text-[#c49aaf] bg-[#fff8ee] px-2 py-0.5 rounded-full border border-[#fce8cc]">
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
            {isVi
              ? "Tôi đã đọc, hiểu và đồng ý hủy lịch hẹn này"
              : "I have read, understood, and agree to cancel this booking"}
          </span>
        </Checkbox>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 h-11 rounded-xl border border-[#f0e0cc] bg-white text-xs font-bold text-[#402542] hover:text-[#db8520] hover:border-[#db8520] hover:bg-[#fffcf7] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <X size={14} />
            {isVi ? "Giữ lại lịch hẹn" : "Keep Booking"}
          </button>
          <button
            type="button"
            onClick={handleCancelBooking}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#db8520] to-[#b36611] text-xs font-bold text-white shadow-[0_4px_14px_rgba(219,133,32,0.25)] hover:shadow-[0_6px_20px_rgba(219,133,32,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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