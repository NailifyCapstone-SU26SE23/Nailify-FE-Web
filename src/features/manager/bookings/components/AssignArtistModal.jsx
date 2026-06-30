import { useEffect, useMemo, useState } from "react";
import { Modal, Spin } from "antd";
import { BriefcaseBusiness, Clock, Mail, Phone, UserRound } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { assignArtistToBooking, assignArtistToBookingOld, fetchSalonStaff, fetchArtistBusySlots } from "../services/bookingsService";

function getStaffDisplayName(staff) {
  const rawName = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ").trim();
  if (rawName) return rawName;
  return staff?.fullName || staff?.name || staff?.email || "Unknown staff";
}

function getStaffKey(staff) {
  return staff?.staffId || staff?.staffArtistId || staff?.userId || staff?.id || "";
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
  booking
}) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busySlots, setBusySlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingBusySlots, setIsLoadingBusySlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotData, setSelectedSlotData] = useState(null);

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
        const artists = (staff || []).filter(
          (member) =>
            member.role === "Staff_Artist" ||
            member.role === "StaffArtist" ||
            (member.role && member.role.toLowerCase().includes("artist"))
        );
        setStaffList(artists);
      } catch (err) {
        console.error("Failed to load salon staff:", err);
        toast.error("Failed to load salon staff.");
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

  // Fetch slots when selectedStaff or booking changes
  useEffect(() => {
    if (!selectedStaff || !booking) {
      setBusySlots([]);
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    const staffKey = getStaffKey(selectedStaff);
    if (!staffKey) {
      console.warn("No staffKey found in selectedStaff:", selectedStaff);
      return;
    }

    const rawBookingDate = booking?.bookingDate || booking?.createdAt;
    if (!rawBookingDate) {
      console.warn("No booking date found in booking object!");
      return;
    }

    // ✅ FIX: Format đúng ISO datetime mà API yêu cầu (2026-06-24T00:00:00Z)
    let isoBookingDate;
    try {
      isoBookingDate = dayjs(rawBookingDate).toISOString();
      console.log("ISO booking date for API:", isoBookingDate);
    } catch (e) {
      console.error("Error formatting date:", e);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingBusySlots(true);
      setBusySlots([]);
      setAvailableSlots([]);
      setSelectedSlot(null);

      try {
        console.log("Calling fetchArtistBusySlots with:", { staffKey, isoBookingDate });
        const response = await fetchArtistBusySlots(staffKey, isoBookingDate);
        console.log("fetchArtistBusySlots response:", response);

        if (response && Array.isArray(response.timeSlots)) {
          const available = response.timeSlots.filter(s => s?.isAvailable);
          const busy = response.timeSlots.filter(s => !s?.isAvailable);
          setAvailableSlots(available);
          setBusySlots(busy);
        } else if (response && Array.isArray(response.busySlots)) {
          setBusySlots(response.busySlots);
          setAvailableSlots([]);
        } else {
          console.warn("Unexpected response shape:", response);
          setAvailableSlots([]);
          setBusySlots([]);
        }
      } catch (err) {
        console.error("Error in fetchSlots:", err);
        toast.error("The nail artist has no scheduled appointments for this day.");
        setAvailableSlots([]);
        setBusySlots([]);
      } finally {
        setIsLoadingBusySlots(false);
      }
    };

    fetchSlots();
  }, [selectedStaff, booking]);

  const handleConfirmAssign = async () => {
    const staffKey = getStaffKey(selectedStaff);

    if (!normalizedBookingId) {
      toast.error("Booking ID is required.");
      return;
    }
    if (!staffKey) {
      toast.error("Please select a staff artist.");
      return;
    }
    if (!selectedSlotData) {
      toast.error("Please select an available time slot.");
      return;
    }

    try {
      setIsSubmitting(true);
      const bookingDate = booking?.bookingDate || booking?.createdAt;
      // ✅ FIX: Dùng ISO format cho bookingDate
      const isoBookingDate = bookingDate ? dayjs(bookingDate).toISOString() : null;

      await Promise.all([
        assignArtistToBookingOld(normalizedBookingId, staffKey, selectedSlotData),
        assignArtistToBooking(normalizedBookingId, staffKey, selectedSlotData, isoBookingDate, booking?.bookingItems || [])
      ]);

      toast.success("Artist assigned successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to assign artist:", err);
      toast.error("Failed to assign artist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canConfirm = selectedStaff && selectedSlotData;

  return (
    <Modal
      title={null}
      open={open}
      onOk={handleConfirmAssign}
      onCancel={() => {
        onClose();
        setSelectedStaff(null);
        setSelectedSlot(null);
        setSelectedSlotData(null);
      }}
      confirmLoading={isSubmitting}
      okText="Confirm"
      cancelText="Cancel"
      okButtonProps={{
        style: { backgroundColor: "#ea4f93", color: "#fff", borderRadius: 9999, fontWeight: 700 },
        disabled: !canConfirm,
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
              Choose the best staff artist and available time slot for this booking.
            </p>
          </div>
        </div>
      </div>
      <div className="-mt-6 rounded-[28px] bg-white px-6 pb-6 pt-6">
        <div className="mb-4 rounded-2xl border border-[#f6d8e6] bg-[#fffafb] p-4">
          {!selectedStaff ? (
            <p className="text-sm text-[#6f5568]">
              Browse the available staff below. Select a staff member to view their available time slots.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-sm font-bold text-white">
                    {getStaffInitials(selectedStaff)}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#3f2240]">{selectedStaffName}</p>
                    {selectedStaff?.role ? (
                      <span className="inline-flex rounded-full bg-[#fce7f3] px-2.5 py-0.5 text-[10px] font-bold text-[#ea4f93]">
                        {selectedStaff.role}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaff(null);
                    setSelectedSlot(null);
                    setSelectedSlotData(null);
                  }}
                  className="text-xs font-semibold text-[#b06484] hover:text-[#ea4f93]"
                >
                  Change staff
                </button>
              </div>

              {selectedSlotData ? (
                <p className="text-sm font-semibold text-[#2fa25f] mb-4">
                  ✓ Selected Slot: {selectedSlotData.startTime} - {selectedSlotData.endTime}
                </p>
              ) : null}

              <div className="space-y-4">
                {/* Available slots */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2fa25f] mb-3 flex items-center gap-1.5">
                    <Clock size={14} />
                    Available slots
                  </p>
                  {isLoadingBusySlots ? (
                    <div className="flex items-center justify-center py-3">
                      <Spin size="small" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot, index) => {
                        const slotKey = `${slot.startTime || "s"}-${slot.endTime || "e"}-${index}`;
                        const isSelected = selectedSlot === slotKey;
                        return (
                          <button
                            key={slotKey}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(isSelected ? null : slotKey);
                              setSelectedSlotData(isSelected ? null : {
                                startTime: slot.startTime,
                                endTime: slot.endTime
                              });
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${isSelected
                              ? "bg-[#2fa25f] text-white shadow-[0_4px_12px_rgba(47,162,95,0.3)]"
                              : "bg-[#eaf9ee] text-[#2fa25f] hover:bg-[#2fa25f] hover:text-white hover:shadow-[0_4px_12px_rgba(47,162,95,0.25)]"
                              }`}
                          >
                            <Clock size={10} />
                            {`${slot.startTime} - ${slot.endTime}`}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#c08aa4]">No available slots found for this date.</p>
                  )}
                </div>

                {/* Busy slots */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#b06484] mb-3 flex items-center gap-1.5">
                    <Clock size={14} />
                    Busy slots (not available)
                  </p>
                  {isLoadingBusySlots ? (
                    <div className="flex items-center justify-center py-3">
                      <Spin size="small" />
                    </div>
                  ) : busySlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {busySlots.map((slot, index) => (
                        <span
                          key={`${slot.startTime || "s"}-${slot.endTime || "e"}-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#ffe6ec] px-2.5 py-1 text-[10px] font-bold text-[#e1447f] cursor-not-allowed opacity-70"
                        >
                          <Clock size={10} />
                          {`${slot.startTime} - ${slot.endTime}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#c08aa4]">No busy slots for this date.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {!selectedStaff && (
          isLoadingStaff ? (
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
                  const name = getStaffDisplayName(staff);

                  return (
                    <div
                      key={key || `${name}-${staff?.email || ""}`}
                      onClick={() => {
                        setSelectedStaff(staff);
                        setSelectedSlot(null);
                        setSelectedSlotData(null);
                      }}
                      className="cursor-pointer rounded-[24px] border border-[#f4c7da] bg-white p-4 transition hover:border-[#ea4f93] hover:shadow-[0_12px_24px_rgba(236,72,153,0.08)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d8c4ff] to-[#8b5cf6] text-sm font-bold text-white">
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
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
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
  booking: PropTypes.object,
};