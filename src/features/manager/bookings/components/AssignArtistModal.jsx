import { useEffect, useMemo, useState } from "react";
import { Modal, Spin } from "antd";
import { BriefcaseBusiness, Check, Clock, Mail, Phone, UserRound } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { assignArtistToBooking, assignArtistToBookingOld, fetchSalonStaff, fetchArtistBusySlots } from "../services/bookingsService";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

function getStaffDisplayName(staff) {
  const { language } = useLanguage();
  const rawName = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ").trim();
  if (rawName) return rawName;
  return staff?.fullName || staff?.name || staff?.email || (language === "vi" ? "Chưa có nhân viên" : "Unknown staff");
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
  const { language } = useLanguage();

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
        toast.error(language === "vi" ? "Lỗi khi tải danh sách nhân viên" : "Failed to load salon staff.");
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
        toast.error(language === "vi" ? "Nhân viên chưa có lịch hẹn vào ngày này" : "The Staff Artist has no scheduled appointments for this day.");
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
      toast.error(language === "vi" ? "Booking ID không được để trống" : "Booking ID is required.");
      return;
    }
    if (!staffKey) {
      toast.error(language === "vi" ? "Vui lòng chọn nhân viên" : "Please select a staff artist.");
      return;
    }
    if (!selectedSlotData) {
      toast.error(language === "vi" ? "Vui lòng chọn khung giờ" : "Please select an available time slot.");
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
      okText={language === "vi" ? "Xác nhận" : "Confirm"}
      cancelText={language === "vi" ? "Hủy" : "Cancel"}
      okButtonProps={{
        style: {
          backgroundColor: "#ea4f93",
          color: "#fff",
          borderRadius: 9999,
          fontWeight: 700,
          padding: "8px 20px"
        },
        disabled: !canConfirm,
      }}
      cancelButtonProps={{
        style: {
          borderRadius: 9999,
          fontWeight: 700,
          padding: "8px 20px"
        }
      }}
      width={800}
      centered
      destroyOnClose
      styles={{
        content: {
          padding: 0,
          borderRadius: 32,
          overflow: "hidden"
        },
        body: { padding: 0 },
        mask: { backdropFilter: "blur(8px)" },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-br from-[#fff0f8] via-[#fff5fb] to-[#fff9ff] px-7 pb-12 pt-7"
      >
        <div className="flex items-center gap-5">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_15px_30px_rgba(234,79,147,0.25)]"
          >
            <UserRound size={24} />
          </motion.div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#3d1f3f] tracking-tight">{language === "vi" ? "Phân công thợ làm móng" : "Assign Staff Artist"}</h3>
            <p className="mt-2 text-sm text-[#9a5f7f]">
              {language === "vi" ? "Chọn thợ làm móng và khung giờ để phân công cho lịch hẹn này." : "Select an artist and time slot to assign to this booking."}
            </p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        className="-mt-8 rounded-[32px] bg-white px-7 pb-7 pt-7"
      >
        <AnimatePresence mode="wait">
          {!selectedStaff ? (
            <motion.div
              key="staff-list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 rounded-2xl border border-[#f3d7e7] bg-[#fffafd] p-5">
                <p className="text-sm text-[#6a5064] leading-relaxed">
                  {language === "vi" ? "Duyệt qua danh sách nhân viên bên dưới. Chọn một nhân viên để xem các khung giờ có sẵn của họ." : "Browse the available staff below. Select a staff member to view their available time slots."}
                </p>
              </div>
              {isLoadingStaff ? (
                <div className="flex items-center justify-center py-12">
                  <Spin tip={language === "vi" ? "Đang tải danh sách nhân viên..." : "Loading salon staff..."} size="large" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {staffList.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-[#a67f98]">
                      <UserRound size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-base">{language === "vi" ? "Hiện không có nhân viên nào" : "No staff available right now."}</p>
                    </div>
                  ) : (
                    staffList.map((staff) => {
                      const key = getStaffKey(staff);
                      const name = getStaffDisplayName(staff);

                      return (
                        <motion.div
                          key={key || `${name}-${staff?.email || ""}`}
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedStaff(staff);
                            setSelectedSlot(null);
                            setSelectedSlotData(null);
                          }}
                          className="cursor-pointer rounded-[28px] border border-[#f0cfe1] bg-gradient-to-br from-white to-[#fffafd] p-5 transition-all duration-300 hover:border-[#ea4f93] hover:shadow-[0_15px_35px_rgba(236,72,153,0.12)]"
                        >
                          <div className="flex items-start gap-4">
                            <motion.div
                              whileHover={{ scale: 1.08 }}
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d6c1ff] to-[#8b5cf6] text-base font-extrabold text-white shadow-[0_4px_12px_rgba(139,92,246,0.2)]"
                            >
                              {getStaffInitials(staff)}
                            </motion.div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-extrabold text-[#3d1f3f] truncate">{name}</p>
                                {staff?.role ? (
                                  <span className="inline-flex items-center rounded-full bg-[#fde7f3] px-3 py-1 text-[10px] font-extrabold text-[#e1447f]">
                                    {staff.role}
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                  <Mail size={14} className="text-[#b88ca8]" />
                                  <span className="truncate">{staff.email || "No email provided"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                  <Phone size={14} className="text-[#b88ca8]" />
                                  <span className="truncate">{staff.phone || staff.phoneNumber || "No phone number"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                  <BriefcaseBusiness size={14} className="text-[#b88ca8]" />
                                  <span className="truncate">{staff.specialty || staff.role || "Staff Artist"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="slots-list"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 rounded-2xl border border-[#f3d7e7] bg-[#fffafd] p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-base font-extrabold text-white shadow-[0_4px_12px_rgba(234,79,147,0.2)]"
                    >
                      {getStaffInitials(selectedStaff)}
                    </motion.div>
                    <div>
                      <p className="text-base font-extrabold text-[#3d1f3f]">{selectedStaffName}</p>
                      {selectedStaff?.role ? (
                        <span className="inline-flex items-center rounded-full bg-[#fde7f3] px-3 py-1 text-[10px] font-extrabold text-[#e1447f]">
                          {selectedStaff.role}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setSelectedStaff(null);
                      setSelectedSlot(null);
                      setSelectedSlotData(null);
                    }}
                    className="px-4 py-2 text-xs font-extrabold text-[#9a5f7f] hover:text-[#ea4f93] bg-[#fff0f8] rounded-full transition-all duration-200 hover:bg-[#fde7f3]"
                  >
                    ← {language === "vi" ? "Thay đổi nghệ sĩ" : "Change staff"}
                  </motion.button>
                </div>

                {selectedSlotData && (
                  <div className="mb-5 rounded-xl border border-[#d1f0de] bg-gradient-to-r from-[#eaf9ee] to-[#e6fff3] px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#2fa25f]">
                      <Check size={16} />
                      {language === "vi" ? "Khung giờ đã chọn: " : "Selected Slot: "} {selectedSlotData.startTime} - {selectedSlotData.endTime}
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Available slots */}
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#2fa25f] mb-4 flex items-center gap-2">
                      <Clock size={16} />
                      {language === "vi" ? "Khung giờ trống: " : "Available slots: "}
                    </p>
                    {isLoadingBusySlots ? (
                      <div className="flex items-center justify-center py-5">
                        <Spin size="default" />
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {availableSlots.map((slot, index) => {
                          const slotKey = `${slot.startTime || "s"}-${slot.endTime || "e"}-${index}`;
                          const isSelected = selectedSlot === slotKey;
                          return (
                            <motion.button
                              key={slotKey}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => {
                                setSelectedSlot(isSelected ? null : slotKey);
                                setSelectedSlotData(isSelected ? null : {
                                  startTime: slot.startTime,
                                  endTime: slot.endTime
                                });
                              }}
                              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold transition-all duration-200 ${isSelected
                                ? "bg-gradient-to-r from-[#2fa25f] to-[#4fc07a] text-white shadow-[0_5px_15px_rgba(47,162,95,0.35)]"
                                : "bg-[#eaf9ee] text-[#2fa25f] hover:bg-gradient-to-r hover:from-[#2fa25f] hover:to-[#4fc07a] hover:text-white hover:shadow-[0_5px_15px_rgba(47,162,95,0.25)]"
                                }`}
                            >
                              <Clock size={14} />
                              {`${slot.startTime} - ${slot.endTime}`}
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#b8d9c7] bg-[#f7fffa] px-4 py-4 text-xs text-[#759984]">
                        <Clock size={16} className="opacity-60" />
                        <span>{language === "vi" ? "Không tìm thấy khung giờ trống." : "No available slots found for this date."}</span>
                      </div>
                    )}
                  </div>

                  {/* Busy slots */}
                  {busySlots.length > 0 && (
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-[#a65a7d] mb-4 flex items-center gap-2">
                        <Clock size={16} />
                        {language === "vi" ? "Khung giờ bận" : "Busy slots"}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {busySlots.map((slot, index) => (
                          <span
                            key={`${slot.startTime || "s"}-${slot.endTime || "e"}-${index}`}
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffe6ec] to-[#ffd7e1] px-4 py-2.5 text-xs font-extrabold text-[#e1447f] cursor-not-allowed opacity-75"
                          >
                            <Clock size={14} />
                            {`${slot.startTime} - ${slot.endTime}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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