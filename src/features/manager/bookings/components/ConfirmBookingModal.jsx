import { Check, X, Clock, User, DollarSign } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, Input } from "antd";
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
  const [note, setNote] = useState("");

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await confirmBooking(bookingId);
      toast.success("Booking confirmed successfully!");
      onSuccess?.();
      onClose();
      setNote("");
    } catch (err) {
      console.error("Failed to confirm booking:", err);
      toast.error("Failed to confirm booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      destroyOnClose
      width={540}
      styles={{
        content: { padding: 0, borderRadius: 32, overflow: "hidden" },
        mask: { backdropFilter: "blur(8px)" },
      }}
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-br from-[#eaf9ee] via-[#e0f5eb] to-[#d7f0e3] px-7 pt-7 pb-11"
      >
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#36b969] to-[#2fa25f] text-white shadow-[0_15px_30px_rgba(47,162,95,0.25)]"
          >
            <Check size={24} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#244933] tracking-tight">Confirm Booking</h2>
            <p className="mt-2 text-sm text-[#6a997c]">Review and confirm this booking</p>
          </div>
        </div>
      </motion.div>

      {/* Body */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        className="-mt-8 rounded-[32px] bg-white px-7 pt-9 pb-7 space-y-6"
      >
        {/* Booking Details */}
        {Object.keys(booking).length > 0 && (
          <div className="space-y-3 rounded-2xl border border-[#e8f5f0] bg-[#f8fffe] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#7a9a7e]">
              Booking details
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
            Internal note (Optional)
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

        {/* Action Buttons */}
        <div className="flex gap-4 pt-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-full border border-[#e2c5d4] bg-white px-5 py-3 text-xs font-extrabold text-[#7a6176] transition-all duration-300 hover:bg-[#fffafd] hover:border-[#d9b0c7] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <X size={16} className="inline mr-2" />
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-full bg-gradient-to-r from-[#ff6aa0] to-[#ea4f93] px-5 py-3 text-xs font-extrabold text-white transition-all duration-300 hover:from-[#ea4f93] hover:to-[#c9366b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(234,79,147,0.3)]"
            disabled={isLoading}
          >
            {isLoading && <Spin size="small" />}
            {isLoading ? "Processing..." : (
              <>
                <Check size={16} />
                Confirm booking
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
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