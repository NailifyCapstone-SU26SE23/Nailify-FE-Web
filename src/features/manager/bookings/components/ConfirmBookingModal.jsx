import { Check, X, Clock, User, DollarSign } from "lucide-react";
import { useState } from "react";
import { Modal, Spin } from "antd";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { confirmBooking } from "../services/bookingsService";
import { motion } from "framer-motion";

export function ConfirmBookingModal({
  open,
  onClose,
  bookingId,
  onSuccess,
  booking = {},
}) {
  const [isLoading, setIsLoading] = useState(false);
  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await confirmBooking(bookingId);
      toast.success("Booking confirmed successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to confirm booking:", err);
      toast.error("Failed to confirm booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      destroyOnClose
      width={480}
      styles={{
        content: { padding: 0, borderRadius: 28, overflow: "hidden", border: "none" },
        mask: { backdropFilter: "blur(6px)", backgroundColor: "rgba(64, 37, 66, 0.4)" },
      }}
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2fa25f] to-[#1c7e47] px-6 pt-8 pb-10 text-white">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-black/10 blur-lg"></div>
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-inner">
            <Check size={26} className="drop-shadow-md animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Duyệt Lịch Hẹn</h2>
            <p className="mt-1 text-xs text-emerald-100/90 font-medium">Kiểm tra thông tin và xác nhận đặt lịch của khách hàng</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="-mt-6 rounded-t-[28px] bg-white px-6 pt-8 pb-6 space-y-5 relative z-10">
        {/* Booking Details */}
        {Object.keys(booking).length > 0 && (
          <div className="space-y-3 rounded-2xl border border-[#eaf9f2] bg-gradient-to-b from-[#f8fdfb] to-[#f2faf5] p-4 shadow-[0_4px_16px_rgba(47,162,95,0.02)]">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#2fa25f]/80">
              Thông tin chi tiết
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
              {booking.bookingId && (
                <div className="col-span-2 flex items-center justify-between border-b border-[#e2f5ec] pb-2 text-xs">
                  <span className="font-semibold text-[#8b7282]">Mã lịch hẹn:</span>
                  <span className="font-extrabold text-[#402542] font-mono">{booking.bookingId}</span>
                </div>
              )}
              {booking.customerName && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e2f7eb] text-[#2fa25f] shadow-sm">
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e2f7eb] text-[#2fa25f] shadow-sm">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8e7b89] font-semibold uppercase tracking-wider">Thời gian</p>
                    <p className="font-extrabold text-[#402542] text-[13px]">{booking.time} ({booking.date})</p>
                  </div>
                </div>
              )}
              {booking.totalPrice && (
                <div className="col-span-2 flex items-center justify-between border-t border-[#e2f5ec] pt-2 mt-1 text-xs">
                  <span className="font-semibold text-[#8e7b89]">Tổng giá trị:</span>
                  <span className="text-base font-black text-[#2fa25f]">{booking.totalPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}



        {/* Info Box */}
        <div className="rounded-2xl border border-[#d1fad7] bg-[#f4fdf6] p-4 flex gap-3 shadow-[0_2px_12px_rgba(47,162,95,0.03)]">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2fa25f] text-white text-[10px] font-bold">✓</div>
          <div>
            <p className="text-xs font-extrabold text-[#1d6b3e]">Hành động này sẽ:</p>
            <ul className="mt-1 space-y-1 text-xs text-[#446b53] font-medium leading-relaxed">
              <li>• Chuyển trạng thái đặt lịch sang <strong>Confirmed</strong></li>
              <li>• Khóa trạng thái lịch hẹn, thợ làm móng sẽ được giữ chỗ</li>
              <li>• Tự động gửi thông báo lịch hẹn thành công cho khách hàng</li>
            </ul>
          </div>
        </div>

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
            onClick={handleConfirm}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#ea4f93] to-[#ef629f] text-xs font-bold text-white shadow-[0_4px_14px_rgba(234,79,147,0.25)] hover:shadow-[0_6px_20px_rgba(234,79,147,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spin size="small" className="text-white" />
            ) : (
              <>
                <Check size={14} />
                Xác nhận duyệt
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

ConfirmBookingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bookingId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  booking: PropTypes.object,
};