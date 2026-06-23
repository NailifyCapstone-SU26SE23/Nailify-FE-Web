import { Check, X } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, message } from "antd";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { confirmBooking } from "../services/bookingsService";

export function ConfirmBookingModal({
  open,
  onClose,
  bookingId,
  onSuccess,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await confirmBooking(bookingId);
      message.success("Booking confirmed successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to confirm booking:", err);
      message.error(err.message || "Failed to confirm booking.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      <div className="bg-gradient-to-r from-[#eaf9ee] to-[#d8f0e4] px-6 pt-6 pb-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2fa25f] text-white">
            <Check size={20} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#402542]">Confirm Booking</h2>
          </div>
        </div>
      </div>
      <div className="-mt-6 space-y-4 rounded-[24px] bg-white px-6 pt-6 pb-6">
        <div className="space-y-3">
          <p className="text-sm text-[#7a6176]">
            Are you sure you want to confirm this booking?
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
            disabled={isLoading}
          >
            <X size={14} className="inline mr-2" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-full bg-[#2fa25f] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1e8a4e]"
            disabled={isLoading}
          >
            {isLoading ? <Spin size="small" className="mr-2" /> : <Check size={14} className="inline mr-2" />}
            {isLoading ? "Processing..." : "Confirm"}
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
};
