import { useEffect, useMemo, useState } from "react";
import { Modal, Spin } from "antd";
import { BriefcaseBusiness, Check, Mail, Phone, UserRound, Star, BrushCleaning } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { assignArtistToBooking, fetchAvailableArtistsForBooking, fetchArtistBusySlots } from "../services/bookingsService";
import { motion } from "framer-motion";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

function getStaffDisplayName(staff) {
  const { language } = useLanguage();
  const rawName = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ").trim();
  if (rawName) return rawName;
  return staff?.fullName || staff?.name || staff?.email || (language === "vi" ? "Chưa có nhân viên" : "Unknown staff");
}

function getStaffKey(staff) {
  return staff?.nailArtistId || staff?.staffId || staff?.staffArtistId || staff?.userId || staff?.id || "";
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

function calculateEndTime(startTime, durationMinutes) {
  if (!startTime) return null;
  const parts = startTime.split(":");
  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10) || 0;
  if (isNaN(hours)) return null;

  const duration = parseInt(durationMinutes, 10) || 60;
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  const hasSeconds = parts.length >= 3;
  const mm = String(endMinutes).padStart(2, "0");
  const hh = String(endHours).padStart(2, "0");
  if (hasSeconds) {
    const ss = parts[2] || "00";
    return `${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}`;
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
  const { language } = useLanguage();

  const bookingDate = booking?.bookingDate || booking?.createdAt;
  const startTime = booking?.startTime;

  useEffect(() => {
    if (!open) return;

    const normalizedBookingId = String(bookingId || "").trim();
    if (!normalizedBookingId) return;

    let isCancelled = false;

    (async () => {
      try {
        setIsLoadingStaff(true);
        setSelectedStaff(null);
        
        const data = await fetchAvailableArtistsForBooking(normalizedBookingId);
        if (isCancelled) return;
        
        let fetchedStaffList = Array.isArray(data) ? data : [];
        const queryDate = bookingDate ? dayjs(bookingDate).format("YYYY-MM-DD") : null;
        const duration = booking?.totalDuration || 60;
        
        if (queryDate && startTime) {
           const bookingStart = dayjs(`${queryDate}T${startTime}`);
           const bookingEnd = bookingStart.add(duration, 'minute');

           fetchedStaffList = await Promise.all(fetchedStaffList.map(async (staff) => {
             try {
               const staffKey = getStaffKey(staff);
               if (!staffKey) return { ...staff, isBusy: false };
               
               const slotsData = await fetchArtistBusySlots(staffKey, queryDate);
               const timeSlots = slotsData?.timeSlots || [];
               
               const isBusy = timeSlots.some(slot => {
                 const slotStart = dayjs(`${queryDate}T${slot.startTime}`);
                 const slotEnd = dayjs(`${queryDate}T${slot.endTime}`);
                 if (slotStart.isBefore(bookingEnd) && bookingStart.isBefore(slotEnd)) {
                   return slot.isAvailable === false;
                 }
                 return false;
               });
               
               return { ...staff, isBusy };
             } catch (err) {
               console.warn("Could not fetch availability for staff", getStaffKey(staff), err);
               // If error is because they are off today
               if (err.message && err.message.includes("không có lịch làm việc")) {
                 return { ...staff, isBusy: true };
               }
             }
             return { ...staff, isBusy: false };
           }));
        }
        
        if (isCancelled) return;
        
        setStaffList(fetchedStaffList);
      } catch (err) {
        console.error("Failed to load staff artists:", err);
        toast.error(language === "vi" ? "Lỗi khi tải danh sách nhân viên" : "Failed to load staff artists.");
        if (!isCancelled) setStaffList([]);
      } finally {
        if (!isCancelled) setIsLoadingStaff(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [open, bookingId, bookingDate, startTime, language]);

  const normalizedBookingId = useMemo(() => String(bookingId || "").trim(), [bookingId]);
  const selectedStaffName = selectedStaff ? getStaffDisplayName(selectedStaff) : "";



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

    try {
      setIsSubmitting(true);
      const bookingDate = booking?.bookingDate || booking?.createdAt;
      const isoBookingDate = bookingDate ? dayjs(bookingDate).toISOString() : null;
      const queryDate = bookingDate ? dayjs(bookingDate).format("YYYY-MM-DD") : null;

      const startTime = booking?.startTime;
      const duration = booking?.totalDuration || 60;
      const endTime = calculateEndTime(startTime, duration);
      const slotInfo = startTime ? { startTime, endTime } : null;

      await assignArtistToBooking(normalizedBookingId, staffKey, slotInfo, isoBookingDate, booking?.bookingItems || []);

      toast.success(language === "vi" ? "Phân công thợ thành công!" : "Artist assigned successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to assign artist:", err);
      toast.error(err.message || (language === "vi" ? "Phân công thợ thất bại." : "Failed to assign artist."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canConfirm = !!selectedStaff;

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
              {language === "vi" ? "Chọn thợ làm móng để phân công cho lịch hẹn này." : "Select an artist to assign to this booking."}
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
        <div className="mb-6 rounded-2xl border border-[#f3d7e7] bg-[#fffafd] p-5">
          <p className="text-sm text-[#6a5064] leading-relaxed">
            {language === "vi" ? "Duyệt qua danh sách nhân viên bên dưới. Chọn một nhân viên để phân công." : "Browse the available staff below. Select a staff member to assign."}
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
                const isSelected = selectedStaff && getStaffKey(selectedStaff) === key;

                return (
                  <motion.div
                    key={key || `${name}-${staff?.email || ""}`}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (staff.isBusy) {
                        toast.error(language === "vi" ? "Thợ này đang bận trong khung giờ của lịch hẹn." : "This staff is busy during this booking's time slot.");
                        return;
                      }
                      if (isSelected) {
                        setSelectedStaff(null);
                      } else {
                        setSelectedStaff(staff);
                      }
                    }}
                    className={`cursor-pointer rounded-[28px] border p-5 transition-all duration-300 ${
                      staff.isBusy
                        ? "opacity-60 grayscale-[30%] cursor-not-allowed border-[#f5e6eb] bg-[#fcf9fa]"
                        : isSelected
                        ? "border-[#ea4f93] bg-gradient-to-br from-white to-[#fff0f8] shadow-[0_15px_35px_rgba(234,79,147,0.15)]"
                        : "border-[#f0cfe1] bg-gradient-to-br from-white to-[#fffafd] hover:border-[#ea4f93] hover:shadow-[0_15px_35px_rgba(236,72,153,0.12)]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        whileHover={{ scale: 1.08 }}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d6c1ff] to-[#8b5cf6] text-base font-extrabold text-white shadow-[0_4px_12px_rgba(139,92,246,0.2)] overflow-hidden"
                      >
                        {staff?.avatarUrl ? (
                          <img
                            crossOrigin="anonymous"
                            src={staff.avatarUrl}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getStaffInitials(staff)
                        )}
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-base font-extrabold text-[#3d1f3f] truncate">{name}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            {staff.isBusy && (
                              <span className="rounded-full bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-0.5 text-[10px] font-bold text-[#DC2626]">
                                {language === "vi" ? "Đang bận" : "Busy"}
                              </span>
                            )}
                            {isSelected && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ea4f93] text-white shadow-[0_4px_10px_rgba(234,79,147,0.3)]">
                                <Check size={14} strokeWidth={3} />
                              </span>
                            )}
                            {staff.status && !staff.isBusy && (
                              <span className="rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-[10px] font-bold text-[#047857]">
                                {staff.status}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Contact info if available, otherwise skills */}
                        {(staff.email || staff.phone || staff.phoneNumber || staff.specialty || staff.role) ? (
                          <div className="mt-4 space-y-2">
                            {staff.email && (
                              <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                <Mail size={14} className="text-[#b88ca8]" />
                                <span className="truncate">{staff.email}</span>
                              </div>
                            )}
                            {(staff.phone || staff.phoneNumber) && (
                              <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                <Phone size={14} className="text-[#b88ca8]" />
                                <span className="truncate">{staff.phone || staff.phoneNumber}</span>
                              </div>
                            )}
                            {(staff.specialty || staff.role) && (
                              <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                <BriefcaseBusiness size={14} className="text-[#b88ca8]" />
                                <span className="truncate">{staff.specialty || staff.role}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {(staff.skills ?? []).length ? (
                              staff.skills.map((skill, index) => (
                                <span
                                  key={`${skill?.skillTypeName || "skill"}-${index}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 text-[10px] font-bold text-[#B45309]"
                                >
                                  <Star size={9} className="fill-current" />
                                  {skill?.skillTypeName || "Skill"} Lv.{skill?.level ?? 0}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] px-2 py-0.5 text-[10px] font-bold text-[#6D28D9]">
                                <BrushCleaning size={9} />
                                Nail Staff
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
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