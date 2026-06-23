import { Check, X, Clock, User, DollarSign } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, message, Input, Checkbox } from "antd";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { confirmBooking } from "../services/bookingsService";

export function ConfirmBookingModal({
  open,
  onClose,
  bookingId,
  onSuccess,
  booking = {},
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [note, setNote] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!isConfirmed) {
      message.warning("Please confirm that you want to proceed");
      return;
    }

    try {
      setIsLoading(true);
      await confirmBooking(bookingId);
      message.success("Booking confirmed successfully!");
      onSuccess?.();
      onClose();
      setNote("");
      setIsConfirmed(false);
    } catch (err) {
      console.error("Failed to confirm booking:", err);
      message.error(err.message || "Failed to confirm booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNote("");
    setIsConfirmed(false);
    onClose();
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
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#eaf9ee] via-[#e0f5eb] to-[#d8f0e4] px-6 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2fa25f] text-white shadow-lg">
            <Check size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#402542]">Confirm Booking</h2>
            <p className="mt-1 text-xs text-[#7a9a7e]">Review and confirm this booking</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="-mt-6 rounded-t-[24px] bg-white px-6 pt-8 pb-6 space-y-5">
        {/* Booking Details */}
        {Object.keys(booking).length > 0 && (
          <div className="space-y-3 rounded-2xl border border-[#e8f5f0] bg-[#f8fffe] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#7a9a7e]">
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
                  <User size={14} className="text-[#2fa25f]" />
                  <span className="text-[#7a6176]">Customer:</span>
                  <span className="font-semibold text-[#402542]">{booking.customerName}</span>
                </div>
              )}
              {booking.date && booking.time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-[#2fa25f]" />
                  <span className="text-[#7a6176]">Time:</span>
                  <span className="font-semibold text-[#402542]">
                    {booking.date} at {booking.time}
                  </span>
                </div>
              )}
              {booking.totalPrice && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-[#2fa25f]" />
                  <span className="text-[#7a6176]">Total:</span>
                  <span className="font-semibold text-[#2fa25f]">{booking.totalPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Note Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide text-[#7a6176]">
            Internal Note (Optional)
          </label>
          <Input.TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add any internal note about this confirmation..."
            rows={3}
            maxLength={200}
            disabled={isLoading}
            className="border-[#e8d5dd] text-sm"
            style={{
              borderRadius: "12px",
              fontFamily: "inherit",
            }}
          />
          <p className="text-[10px] text-[#c08aa4]">{note.length}/200</p>
        </div>

        {/* Info Box */}
        <div className="space-y-2 rounded-xl border border-[#fff0dd] bg-[#fffafb] p-3">
          <p className="text-xs font-semibold text-[#402542]">✓ Confirmation will:</p>
          <ul className="space-y-1 text-xs text-[#7a6176]">
            <li>• Mark booking as confirmed</li>
            <li>• Lock the booking status</li>
            <li>• Notify the customer automatically</li>
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
            I confirm this booking should be marked as <span className="font-semibold text-[#2fa25f]">confirmed</span>
          </span>
        </Checkbox>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] transition hover:bg-[#fff7fb] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <X size={14} className="inline mr-2" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-full bg-[#2fa25f] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1e8a4e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading || !isConfirmed}
          >
            {isLoading && <Spin size="small" />}
            {isLoading ? "Processing..." : (
              <>
                <Check size={14} />
                Confirm Booking
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