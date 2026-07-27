import React, { useState, useEffect, useMemo } from "react";
import { Modal, DatePicker, Input } from "antd";
import { Calendar, Clock, Edit3, Check, X, Sparkles, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { managerSuggestTime } from "../services/bookingsService";
import { fetchSalonById } from "../../../admin/salon-management/services/salonsService";
import { getSalonIdAsync } from "../../staff-artist-management/services/nailArtistsService";

function generateSlotsFromTimes(openTimeStr = "08:00", closeTimeStr = "20:00") {
  const parseMin = (tStr) => {
    if (!tStr) return 480;
    const [h, m] = String(tStr).split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const fmtMin = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const startMin = parseMin(openTimeStr);
  const endMin = parseMin(closeTimeStr);
  const slots = [];

  for (let current = startMin; current < endMin; current += 30) {
    slots.push(fmtMin(current));
  }
  return slots;
}

export function ProposeRescheduleModal({
  open,
  onClose,
  bookingId,
  booking,
  onSuccess,
}) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeStr, setSelectedTimeStr] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedSalonHours, setFetchedSalonHours] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadSalonHours = async () => {
      try {
        const sId = booking?.salonId ? String(booking.salonId) : (await getSalonIdAsync());
        if (sId) {
          const salonData = await fetchSalonById(sId);
          if (!cancelled && Array.isArray(salonData?.operatingHours) && salonData.operatingHours.length > 0) {
            setFetchedSalonHours(salonData.operatingHours);
          }
        }
      } catch (err) {
        console.error("Failed to fetch salon operating hours:", err);
      }
    };
    loadSalonHours();
    return () => { cancelled = true; };
  }, [open, booking?.salonId]);

  // Overall Min Open & Max Close across all salon operating days
  const overallHours = useMemo(() => {
    const list = fetchedSalonHours || [];
    const openDays = list.filter((item) => !item.isClosed);
    if (!openDays.length) {
      return { openTimeStr: "08:00", closeTimeStr: "22:00" };
    }

    const parseMin = (t) => {
      const [h, m] = String(t || "08:00").split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const minOpen = Math.min(...openDays.map((item) => parseMin(item.openTime)));
    const maxClose = Math.max(...openDays.map((item) => parseMin(item.closeTime)));

    const fmtMin = (min) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    return {
      openTimeStr: fmtMin(minOpen),
      closeTimeStr: fmtMin(maxClose),
    };
  }, [fetchedSalonHours]);

  // Derived Salon Operating Hours & Slots for selected date
  const dayOperatingInfo = useMemo(() => {
    if (!selectedDate) {
      return {
        isClosed: false,
        openTimeStr: overallHours.openTimeStr,
        closeTimeStr: overallHours.closeTimeStr,
        label: `Select a date to filter hours (${overallHours.openTimeStr} – ${overallHours.closeTimeStr})`,
        slots: generateSlotsFromTimes(overallHours.openTimeStr, overallHours.closeTimeStr),
      };
    }

    const dayOfWeek = selectedDate.day(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const list = fetchedSalonHours || [];
    const dayMatch = list.find((item) => item.dayOfWeek === dayOfWeek);

    if (!dayMatch) {
      return {
        isClosed: false,
        openTimeStr: overallHours.openTimeStr,
        closeTimeStr: overallHours.closeTimeStr,
        label: `Operating Hours: ${overallHours.openTimeStr} – ${overallHours.closeTimeStr}`,
        slots: generateSlotsFromTimes(overallHours.openTimeStr, overallHours.closeTimeStr),
      };
    }

    if (dayMatch.isClosed) {
      return {
        isClosed: true,
        openTimeStr: null,
        closeTimeStr: null,
        label: `Salon is Closed on ${dayMatch.dayName || "this day"}`,
        slots: [],
      };
    }

    const openTimeStr = dayMatch.openTime ? String(dayMatch.openTime).substring(0, 5) : overallHours.openTimeStr;
    const closeTimeStr = dayMatch.closeTime ? String(dayMatch.closeTime).substring(0, 5) : overallHours.closeTimeStr;
    const slots = generateSlotsFromTimes(openTimeStr, closeTimeStr);

    return {
      isClosed: false,
      openTimeStr,
      closeTimeStr,
      label: `${dayMatch.dayName || "Operating Hours"}: ${openTimeStr} – ${closeTimeStr}`,
      slots,
    };
  }, [selectedDate, fetchedSalonHours, overallHours]);

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTimeStr("");
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select a new appointment date.");
      return;
    }
    if (dayOperatingInfo.isClosed) {
      toast.error("Salon is closed on the selected date. Please choose another date.");
      return;
    }
    if (!selectedTimeStr) {
      toast.error("Please pick a new start time slot.");
      return;
    }

    const dateStr = selectedDate.format("YYYY-MM-DD");
    const timeStr = `${selectedTimeStr}:00`;

    try {
      setLoading(true);
      await managerSuggestTime(bookingId, {
        suggestedDate: dateStr,
        suggestedTime: timeStr,
        reason: reason.trim() || "Salon manager proposed alternative time slot.",
      });

      toast.success("Reschedule proposal sent to customer!", { icon: "📅" });
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error("Failed to propose reschedule:", err);
      toast.error(err.message || "Failed to send proposal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      closable={false}
      centered
      width={540}
      styles={{ content: { padding: 0, borderRadius: 32, overflow: "hidden" } }}
    >
      <div className="bg-white p-6 md:p-7 font-sans relative">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#E84F93]/10 blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F3E2EC] pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EE] text-[#E84F93] shadow-xs">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#2B182B] tracking-tight">Propose New Time</h3>
              <p className="text-xs text-[#9E8497] font-medium">Suggest an alternative date or slot to customer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-[#9E8497] hover:bg-[#FFF0F5] hover:text-[#E84F93] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Info Callout Card */}
        {booking && (
          <div className="mb-5 rounded-2xl border border-[#F3D6E5]/80 bg-gradient-to-r from-[#FFF5FA] to-[#FFF0F5]/50 p-4 text-xs text-[#2B182B] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#9E8497] uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Sparkles size={12} className="text-[#E84F93]" /> Current Appointment
              </span>
              <span className="font-bold text-[#E84F93] text-[11px]">#{String(booking.bookingId || "").slice(0, 8).toUpperCase()}</span>
            </div>
            <p className="font-extrabold text-[#2B182B] text-sm mt-1">
              {booking.date} · <span className="text-[#E84F93]">{booking.time}</span>
            </p>
          </div>
        )}

        {/* Form Body */}
        <div className="space-y-5">
          {/* Step 1: Select New Date */}
          <div>
            <label className="block text-xs font-bold text-[#2B182B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={14} className="text-[#E84F93]" /> 1. Select New Date
            </label>
            <DatePicker
              value={selectedDate}
              onChange={(d) => {
                setSelectedDate(d);
                setSelectedTimeStr("");
              }}
              disabledDate={(current) => current && current < dayjs().startOf("day")}
              className="w-full rounded-2xl border-[#F3D7E4] py-2.5 px-3.5 focus:border-[#E84F93] text-xs font-medium shadow-2xs"
              placeholder="Click to choose new appointment date"
            />
          </div>

          {/* Step 2: Pick Start Time Slot (Dynamic from Salon Operating Hours) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#2B182B] uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-[#E84F93]" /> 2. Pick Start Time Slot
              </label>
              <span className="text-[11px] font-extrabold text-[#E84F93]">
                {dayOperatingInfo.label}
              </span>
            </div>

            {dayOperatingInfo.isClosed ? (
              <div className="rounded-2xl border border-[#FECDD3] bg-[#FEF2F2] p-4 text-center text-xs text-[#E11D48] flex items-center justify-center gap-2">
                <AlertTriangle size={16} />
                <span>Salon is Closed on this day. Please select a different date.</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1 p-1.5 bg-[#FAF6F8] rounded-2xl border border-[#F3E2EC]">
                {dayOperatingInfo.slots.map((slot) => {
                  const isSelected = selectedTimeStr === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeStr(slot)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all text-center ${isSelected
                        ? "bg-gradient-to-r from-[#E84F93] to-[#F43F5E] text-white shadow-md scale-105"
                        : "bg-white text-[#2B182B] border border-[#F3D7E4]/70 hover:border-[#E84F93] hover:bg-[#FFF0F5]"
                        }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Reason / Instructions */}
          <div>
            <label className="block text-xs font-bold text-[#2B182B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Edit3 size={14} className="text-[#E84F93]" /> 3. Reason or Note to Customer
            </label>
            <Input.TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g., Requested nail artist is fully booked at 1:30 PM, proposing 3:00 PM instead..."
              className="rounded-2xl border-[#F3D7E4] focus:border-[#E84F93] p-3 text-xs font-medium shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#F3E2EC]">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-[#F3D7E4] px-5 py-2.5 text-xs font-bold text-[#2B182B] hover:bg-[#FAF0F5] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || dayOperatingInfo.isClosed}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E84F93] to-[#F43F5E] px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              <Check size={16} />
              {loading ? "Sending Proposal..." : "Send Proposal"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
