import { useEffect, useMemo, useState } from "react";
import { Modal, Spin, message } from "antd";
import { BriefcaseBusiness, Mail, Phone, UserRound } from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { assignArtistToBooking, fetchSalonStaff } from "../services/bookingsService";

function getStaffDisplayName(staff) {
  const rawName = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ").trim();
  if (rawName) return rawName;
  return staff?.fullName || staff?.name || staff?.email || "Unknown staff";
}

function getStaffKey(staff) {
  return staff?.staffArtistId || staff?.staffId || staff?.id || "";
}

function getStaffInitials(staff) {
  const name = getStaffDisplayName(staff);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AssignArtistModal({
  open,
  onClose,
  bookingId,
  salonId,
  onSuccess,
}) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const normalizedSalonId = String(salonId || "").trim();
    if (!normalizedSalonId) return;

    let isCancelled = false;

    (async () => {
      try {
        setIsLoadingStaff(true);
        setSelectedStaff(null);
        const staff = await fetchSalonStaff(normalizedSalonId);
        if (isCancelled) return;
        setStaffList(Array.isArray(staff) ? staff : []);
      } catch (err) {
        console.error("Failed to load salon staff:", err);
        message.error(err.message || "Failed to load salon staff.");
        if (!isCancelled) setStaffList([]);
      } finally {
        if (!isCancelled) setIsLoadingStaff(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [open, salonId]);

  const normalizedBookingId = useMemo(() => String(bookingId || "").trim(), [bookingId]);
  const selectedStaffName = selectedStaff ? getStaffDisplayName(selectedStaff) : "";

  const handleConfirmAssign = async () => {
    const staffKey = getStaffKey(selectedStaff);

    if (!normalizedBookingId) {
      message.error("Booking ID is required.");
      return;
    }
    if (!staffKey) {
      message.error("Please select a staff artist.");
      return;
    }

    try {
      setIsSubmitting(true);
      await assignArtistToBooking(normalizedBookingId, staffKey);
      message.success("Artist assigned successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to assign artist:", err);
      message.error(err.message || "Failed to assign artist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onOk={handleConfirmAssign}
      onCancel={() => {
        onClose();
        setSelectedStaff(null);
      }}
      confirmLoading={isSubmitting}
      okText="Confirm"
      cancelText="Cancel"
      okButtonProps={{
        style: { backgroundColor: "#ea4f93", color: "#fff", borderRadius: 9999, fontWeight: 700 },
        disabled: !selectedStaff,
      }}
      cancelButtonProps={{ style: { borderRadius: 9999, fontWeight: 700 } }}
      width={760}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: 28, overflow: "hidden" },
        body: { padding: 0 },
        mask: { backdropFilter: "blur(6px)" },
      }}
    >
      <div className="bg-[linear-gradient(135deg,#fff0f8_0%,#fff5fb_100%)] px-6 pb-10 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ea4f93] text-white">
            <UserRound size={20} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#402542]">Assign Staff Artist</h3>
            <p className="mt-1 text-sm text-[#b06484]">
              Choose the best staff artist to take ownership of this booking.
            </p>
          </div>
        </div>
      </div>
      <div className="-mt-6 rounded-[28px] bg-white px-6 pb-6 pt-6">
        <div className="mb-4 rounded-2xl border border-[#f6d8e6] bg-[#fffafb] p-4">
          <p className="text-sm text-[#6f5568]">
            Browse the available staff below. The selected artist will be assigned to this booking
            immediately after confirmation.
          </p>
          {selectedStaff ? (
            <p className="mt-2 text-sm font-semibold text-[#ea4f93]">
              Selected: {selectedStaffName}
            </p>
          ) : null}
        </div>
        {isLoadingStaff ? (
          <div className="flex items-center justify-center py-8">
            <Spin tip="Loading staff..." />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {staffList.length === 0 ? (
              <p className="text-sm text-[#c08aa4]">No staff available.</p>
            ) : (
              staffList.map((staff) => {
                const key = getStaffKey(staff);
                const isSelected = key && selectedStaff && getStaffKey(selectedStaff) === key;
                const name = getStaffDisplayName(staff);

                return (
                  <div
                    key={key || `${name}-${staff?.email || ""}`}
                    onClick={() => setSelectedStaff(staff)}
                    className={`cursor-pointer rounded-[24px] border p-4 transition ${
                      isSelected
                        ? "border-[#ea4f93] bg-[linear-gradient(180deg,#fff0f8_0%,#fff7fb_100%)] shadow-[0_14px_28px_rgba(234,79,147,0.12)]"
                        : "border-[#f4c7da] bg-white hover:border-[#ea4f93] hover:shadow-[0_12px_24px_rgba(236,72,153,0.08)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                          isSelected
                            ? "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]"
                            : "bg-gradient-to-br from-[#d8c4ff] to-[#8b5cf6]"
                        }`}
                      >
                        {getStaffInitials(staff)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-extrabold text-[#3f2240]">{name}</p>
                          {staff?.role ? (
                            <span className="inline-flex rounded-full bg-[#fce7f3] px-2.5 py-1 text-[10px] font-bold text-[#ea4f93]">
                              {staff.role}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                            <Mail size={12} className="text-[#c08aa4]" />
                            <span>{staff.email || "No email"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                            <Phone size={12} className="text-[#c08aa4]" />
                            <span>{staff.phone || staff.phoneNumber || "No phone"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                            <BriefcaseBusiness size={12} className="text-[#c08aa4]" />
                            <span>{staff.specialty || staff.role || "Staff Artist"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                            <UserRound size={12} className="text-[#c08aa4]" />
                            <span>ID: {key || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

AssignArtistModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bookingId: PropTypes.string,
  salonId: PropTypes.string,
  onSuccess: PropTypes.func,
};
