import { X, XCircle, Clock, User, DollarSign, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, Input, Checkbox, Select } from "antd";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { rejectBooking } from "../services/bookingsService";
import { motion } from "framer-motion";

const REJECT_REASONS = [
  { label: "Customer not responding", value: "no_response" },
  { label: "Invalid booking details", value: "invalid_details" },
  { label: "Service not available", value: "service_unavailable" },
  { label: "Payment issues", value: "payment_issue" },
  { label: "Suspicious activity", value: "suspicious" },
  { label: "Other", value: "other" },
];

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

  const handleReject = async () => {
    if (!reason) {
      toast("Please select a rejection reason", { icon: "⚠️" });
      return;
    }

    if (!isConfirmed) {
      toast("Please confirm the rejection", { icon: "⚠️" });
      return;
    }

    try {
      setIsLoading(true);
      const fullReason = details ? `${reason} - ${details}` : reason;
      await rejectBooking(bookingId, fullReason);
      toast.success("Booking rejected successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      console.error("Failed to reject booking:", err);
      toast.error("Failed to reject booking.");
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#e1447f] to-[#b32b5d] px-6 pt-8 pb-10 text-white">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-black/10 blur-lg"></div>
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-inner">
            <XCircle size={26} className="drop-shadow-md animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Từ Chối Lịch Hẹn</h2>
            <p className="mt-1 text-xs text-rose-100/90 font-medium">Hành động này sẽ từ chối đặt lịch của khách hàng</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="-mt-6 rounded-t-[28px] bg-white px-6 pt-8 pb-6 space-y-5 relative z-10">
        {/* Alert Banner */}
        <div className="flex gap-3 rounded-2xl border border-[#ffd4e5] bg-[#fffafc] p-4 shadow-[0_2px_8px_rgba(225,68,127,0.03)]">
          <AlertTriangle size={18} className="shrink-0 text-[#e1447f] mt-0.5" />
          <div>
            <p className="text-xs font-extrabold text-[#7c284b]">Lưu ý quan trọng</p>
            <p className="mt-1 text-xs text-[#a3526e] leading-relaxed font-medium">
              Từ chối đặt lịch sẽ gửi thông báo trực tiếp đến khách hàng. Vui lòng chọn lý do và điền lời nhắn phù hợp.
            </p>
          </div>
        </div>

        {/* Booking Details */}
        {Object.keys(booking).length > 0 && (
          <div className="space-y-3 rounded-2xl border border-[#f9cbdc]/60 bg-gradient-to-b from-[#fffcfd] to-[#fff5f8] p-4 shadow-[0_4px_16px_rgba(225,68,127,0.02)]">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#e1447f]/80">
              Chi tiết lịch hẹn
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
              {booking.bookingId && (
                <div className="col-span-2 flex items-center justify-between border-b border-[#f9cbdc]/30 pb-2 text-xs">
                  <span className="font-semibold text-[#8b7282]">Mã lịch hẹn:</span>
                  <span className="font-extrabold text-[#402542] font-mono">{booking.bookingId}</span>
                </div>
              )}
              {booking.customerName && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ffe4ee] text-[#e1447f] shadow-sm">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8e7b89] font-semibold uppercase tracking-wider">Khách hàng</p>
                    <p className="font-extrabold text-[#402542] text-[13px]">{booking.customerName}</p>
                  </div>
                </div>
              )}
              {booking.date && booking.time && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ffe4ee] text-[#e1447f] shadow-sm">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8e7b89] font-semibold uppercase tracking-wider">Thời gian yêu cầu</p>
                    <p className="font-extrabold text-[#402542] text-[13px]">{booking.time} ({booking.date})</p>
                  </div>
                </div>
              )}
              {booking.totalPrice && (
                <div className="col-span-2 flex items-center justify-between border-t border-[#f9cbdc]/30 pt-2 mt-1 text-xs">
                  <span className="font-semibold text-[#8e7b89]">Tổng số tiền:</span>
                  <span className="text-base font-black text-[#e1447f]">{booking.totalPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reason Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#8b7282]">
            Lý do từ chối <span className="text-[#e1447f] font-bold">*</span>
          </label>
          <Select
            value={reason || undefined}
            onChange={setReason}
            placeholder="Chọn lý do từ chối..."
            disabled={isLoading}
            options={REJECT_REASONS}
            style={{
              width: "100%",
            }}
          />
        </div>

        {/* Details Field */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#8b7282]">
            Lời nhắn đến khách hàng <span className="text-[#e1447f] font-bold">*</span>
          </label>
          <Input.TextArea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Giải thích lý do từ chối để hỗ trợ khách hàng đổi lịch..."
            rows={3}
            maxLength={300}
            disabled={isLoading}
            className="border-[#f0d9e8] focus:border-[#ea4f93] hover:border-[#ea4f93] focus:shadow-[0_0_0_2px_rgba(234,79,147,0.1)] text-xs rounded-xl transition-all"
            style={{
              fontFamily: "inherit",
              resize: "none",
            }}
            status={details.length === 0 ? "error" : ""}
          />
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-[#e1447f]">{details.length === 0 ? "Bắt buộc điền lời nhắn" : ""}</span>
            <span className="text-[9px] font-extrabold text-[#c49aaf] bg-[#fff5f9] px-2 py-0.5 rounded-full border border-[#fce4ee]">{details.length}/300</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="space-y-2 rounded-2xl border border-[#ffd4e5] bg-[#fffdfb] p-4 shadow-[0_2px_8px_rgba(225,68,127,0.02)]">
          <p className="text-xs font-extrabold text-[#7c284b]">Khách hàng sẽ nhận được thông tin:</p>
          <ul className="space-y-1 text-xs text-[#a3526e] font-medium leading-relaxed">
            <li>• Lý do từ chối cụ thể cùng với tin nhắn chi tiết</li>
            <li>• Hướng dẫn cách thức đặt lại lịch hẹn vào khung giờ trống khác</li>
            <li>• Hotline liên hệ hỗ trợ trực tiếp khi có thắc mắc</li>
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
            Tôi xác nhận <span className="font-extrabold text-[#e1447f]">từ chối lịch hẹn này</span> và gửi tin nhắn đến khách hàng
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
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#e1447f] to-[#f25e97] text-xs font-bold text-white shadow-[0_4px_14px_rgba(225,68,127,0.25)] hover:shadow-[0_6px_20px_rgba(225,68,127,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading || !reason || !details || !isConfirmed}
          >
            {isLoading ? (
              <Spin size="small" className="text-white" />
            ) : (
              <>
                <XCircle size={14} />
                Xác nhận từ chối
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

RejectBookingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bookingId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  booking: PropTypes.object,
};