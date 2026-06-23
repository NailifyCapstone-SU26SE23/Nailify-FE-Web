import { X, XCircle, Clock, User, DollarSign, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Modal, Spin, message, Input, Checkbox, Select } from "antd";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { rejectBooking } from "../services/bookingsService";

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
      message.warning("Please select a rejection reason");
      return;
    }

    if (!isConfirmed) {
      message.warning("Please confirm the rejection");
      return;
    }

    try {
      setIsLoading(true);
      await rejectBooking(bookingId);
      message.success("Booking rejected successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      console.error("Failed to reject booking:", err);
      message.error(err.message || "Failed to reject booking.");
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
      <div className="bg-gradient-to-r from-[#ffe6ec] via-[#fad5e5] to-[#f8c4d8] px-6 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e1447f] text-white shadow-lg">
            <XCircle size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#402542]">Reject Booking</h2>
            <p className="mt-1 text-xs text-[#b5849a]">This will decline the booking request</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="-mt-6 rounded-t-[24px] bg-white px-6 pt-8 pb-6 space-y-5">
        {/* Alert Banner */}
        <div className="flex gap-3 rounded-xl border border-[#ffd4e5] bg-[#fffaf8] p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#e1447f]" />
          <div>
            <p className="text-xs font-bold text-[#8b4f6d]">Important</p>
            <p className="mt-1 text-xs text-[#b5849a] leading-relaxed">
              Rejecting this booking will notify the customer and may impact their trust. Use this only when necessary.
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
                  <User size={14} className="text-[#e1447f]" />
                  <span className="text-[#7a6176]">Customer:</span>
                  <span className="font-semibold text-[#402542]">{booking.customerName}</span>
                </div>
              )}
              {booking.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#7a6176]">Phone:</span>
                  <span className="font-semibold text-[#402542]">{booking.phone}</span>
                </div>
              )}
              {booking.date && booking.time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-[#e1447f]" />
                  <span className="text-[#7a6176]">Requested:</span>
                  <span className="font-semibold text-[#402542]">
                    {booking.date} at {booking.time}
                  </span>
                </div>
              )}
              {booking.totalPrice && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-[#e1447f]" />
                  <span className="text-[#7a6176]">Amount:</span>
                  <span className="font-semibold text-[#e1447f]">{booking.totalPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide text-[#7a6176]">
            Rejection Reason <span className="text-[#e1447f]">*</span>
          </label>
          <Select
            value={reason || undefined}
            onChange={setReason}
            placeholder="Select a reason..."
            disabled={isLoading}
            options={REJECT_REASONS}
            style={{
              width: "100%",
            }}
          />
        </div>

        {/* Details Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide text-[#7a6176]">
            Rejection Message <span className="text-[#e1447f]">*</span>
          </label>
          <Input.TextArea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Explain why this booking is being rejected. This message will be sent to the customer..."
            rows={3}
            maxLength={300}
            disabled={isLoading}
            className="border-[#e8d5dd] text-sm"
            style={{
              borderRadius: "12px",
              fontFamily: "inherit",
            }}
            status={details.length === 0 ? "error" : ""}
          />
          <p className={`text-[10px] ${details.length === 0 ? "text-[#e1447f]" : "text-[#c08aa4]"}`}>
            {details.length}/300 - {details.length === 0 ? "Required" : ""}
          </p>
        </div>

        {/* Info Box */}
        <div className="space-y-2 rounded-xl border border-[#ffd4e5] bg-[#fffaf8] p-3">
          <p className="text-xs font-semibold text-[#402542]">Customer will be notified:</p>
          <ul className="space-y-1 text-xs text-[#7a6176]">
            <li>• Rejection reason and message</li>
            <li>• Available time to rebook</li>
            <li>• Contact information for support</li>
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
            I confirm to <span className="font-semibold text-[#e1447f]">reject this booking</span> and notify the customer
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
            onClick={handleReject}
            className="flex-1 rounded-full bg-[#e1447f] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#c9366b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading || !reason || !details || !isConfirmed}
          >
            {isLoading && <Spin size="small" />}
            {isLoading ? "Rejecting..." : (
              <>
                <XCircle size={14} />
                Reject Booking
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