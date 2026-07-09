import { X, XCircle, Clock, User, DollarSign, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, Input, Checkbox, Select } from "antd";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { cancelBooking } from "../services/bookingsService";

const CANCEL_REASONS = [
  { label: "Customer requested", value: "customer_request" },
  { label: "Staff unavailable", value: "staff_unavailable" },
  { label: "Salon closed", value: "salon_closed" },
  { label: "Double booking", value: "double_booking" },
  { label: "Other", value: "other" },
];

export function CancelBookingModal({
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
      toast.success("Booking cancelled successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      toast.error("Failed to cancel booking.");
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
      width={520}
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#fff0dd] via-[#fae8d0] to-[#f5d0a0] px-6 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#db8520] text-white shadow-lg">
            <XCircle size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#402542]">Cancel Booking</h2>
            <p className="mt-1 text-xs text-[#a8825e]">This action cannot be undone</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="-mt-6 rounded-t-[24px] bg-white px-6 pt-8 pb-6 space-y-5">
        {/* Warning Alert */}
        <div className="flex gap-3 rounded-xl border border-[#ffe6cc] bg-[#fffaf2] p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#db8520]" />
          <div>
            <p className="text-xs font-bold text-[#8b6f47]">Warning</p>
            <p className="mt-1 text-xs text-[#a8825e] leading-relaxed">
              Cancelling this booking will notify the customer and may affect their satisfaction rating.
            </p>
          </div>
        </div>

        {/* Booking Details */}
        {Object.keys(booking).length > 0 && (
          <div className="space-y-3 rounded-2xl border border-[#f4d6e3] bg-[#fffafb] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#c08aa4]">
              Booking Details
            </h3>
            <div className="space-y-2">
              {booking.bookingId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7a6176]">Booking ID:</span>
                  <span className="font-semibold text-[#402542]">{booking.bookingId}</span>
                </div>
              )}
              {booking.customerName && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-[#db8520]" />
                  <span className="text-[#7a6176]">Customer:</span>
                  <span className="font-semibold text-[#402542]">{booking.customerName}</span>
                </div>
              )}
              {booking.date && booking.time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-[#db8520]" />
                  <span className="text-[#7a6176]">Scheduled:</span>
                  <span className="font-semibold text-[#402542]">
                    {booking.date} at {booking.time}
                  </span>
                </div>
              )}
              {booking.totalPrice && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-[#db8520]" />
                  <span className="text-[#7a6176]">Total:</span>
                  <span className="font-semibold text-[#db8520]">{booking.totalPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide text-[#7a6176]">
            Cancellation reason <span className="text-[#db8520]">*</span>
          </label>
          <Select
            value={reason || undefined}
            onChange={setReason}
            placeholder="Select a reason..."
            disabled={isLoading}
            options={CANCEL_REASONS}
            style={{
              width: "100%",
            }}
          />
        </div>

        {/* Details Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide text-[#7a6176]">
            Additional details (Optional)
          </label>
          <Input.TextArea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide more context about the cancellation..."
            rows={3}
            maxLength={300}
            disabled={isLoading}
            className="border-[#e8d5dd] text-sm"
            style={{
              borderRadius: "12px",
              fontFamily: "inherit",
            }}
          />
          <p className="text-[10px] text-[#c08aa4]">{details.length}/300</p>
        </div>

        {/* Info Box */}
        <div className="space-y-2 rounded-xl border border-[#ffe6cc] bg-[#fffaf2] p-3">
          <p className="text-xs font-semibold text-[#402542]">Upon cancellation:</p>
          <ul className="space-y-1 text-xs text-[#7a6176]">
            <li>• Customer will receive cancellation notification</li>
            <li>• Booking status will be locked</li>
            <li>• Deposit will be handled per policy</li>
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <Checkbox
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
          disabled={isLoading}
          className="text-sm"
        >
          <span className="text-[#7a6176]">
            I understand and confirm to <span className="font-semibold text-[#db8520]">cancel this booking</span>
          </span>
        </Checkbox>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-full border border-[#e3e3e3] bg-white px-4 py-2.5 text-xs font-bold text-[#6b6b6b] transition hover:bg-[#f9f9f9] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <X size={14} className="inline mr-2" />
            Keep booking
          </button>
          <button
            type="button"
            onClick={handleCancelBooking}
            className="flex-1 rounded-full bg-[#db8520] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#c8781d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading || !reason || !isConfirmed}
          >
            {isLoading && <Spin size="small" />}
            {isLoading ? "Cancelling..." : (
              <>
                <XCircle size={14} />
                Cancel booking
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