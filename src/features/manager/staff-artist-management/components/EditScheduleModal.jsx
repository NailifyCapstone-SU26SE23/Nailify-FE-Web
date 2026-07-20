import React, { useState, useEffect, useMemo } from "react";
import { Modal, Select, Spin, message } from "antd";
import { Clock3, CheckCircle2, AlertCircle, X } from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { patchSchedule, fetchArtistSchedules, createSchedule } from "../services/nailArtistsService";
import dayjs from "dayjs";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = [
  { key: "Mon", label: "Monday",    offset: 0 },
  { key: "Tue", label: "Tuesday",   offset: 1 },
  { key: "Wed", label: "Wednesday", offset: 2 },
  { key: "Thu", label: "Thursday",  offset: 3 },
  { key: "Fri", label: "Friday",    offset: 4 },
  { key: "Sat", label: "Saturday",  offset: 5 },
  { key: "Sun", label: "Sunday",    offset: 6 },
];

const STATUS_META = {
  Active: {
    label: "Active",
    color: "bg-[#eaf9ee] text-[#2fa25f] border-[#2fa25f]/30",
    dot: "bg-[#2fa25f]",
  },
  Off: {
    label: "Day Off",
    color: "bg-gray-100 text-gray-600 border-gray-300",
    dot: "bg-gray-400",
  },
  Leave: {
    label: "On Leave",
    color: "bg-[#fff0dd] text-[#db8520] border-[#db8520]/30",
    dot: "bg-[#db8520]",
  },
};

/** 09:00→17:00, 30-min slots */
const TIME_SLOTS_30MIN = [
  { start: "09:00", end: "09:30" },
  { start: "09:30", end: "10:00" },
  { start: "10:00", end: "10:30" },
  { start: "10:30", end: "11:00" },
  { start: "11:00", end: "11:30" },
  { start: "11:30", end: "12:00" },
  { start: "12:00", end: "12:30" },
  { start: "12:30", end: "13:00" },
  { start: "13:00", end: "13:30" },
  { start: "13:30", end: "14:00" },
  { start: "14:00", end: "14:30" },
  { start: "14:30", end: "15:00" },
  { start: "15:00", end: "15:30" },
  { start: "15:30", end: "16:00" },
  { start: "16:00", end: "16:30" },
  { start: "16:30", end: "17:00" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayOfWeek(date) {
  const d = dayjs(date);
  const day = d.day();
  return d.add(day === 0 ? -6 : 1 - day, "day").startOf("day");
}

/** Map schedules → { Mon: [s1, s2, …], … } sorted by shiftStart */
function buildDayMap(schedules) {
  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = {};
  (schedules || []).forEach((s) => {
    const dateVal = s.date || s.workDate || s.scheduleDate || s.day;
    if (!dateVal) return;
    const rawDay = dayjs(dateVal).day();
    const key = rawDay === 0 ? "Sun" : DAY_NAMES[rawDay - 1];
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });
  Object.keys(map).forEach((k) => {
    map[k].sort((a, b) =>
      String(a.shiftStart || a.startTime || "").localeCompare(
        String(b.shiftStart || b.startTime || "")
      )
    );
  });
  return map;
}

/** "HH:mm" → "HH:mm:ss" */
function toApiTime(t) {
  if (!t) return null;
  const parts = t.split(":");
  return `${(parts[0] || "00").padStart(2, "0")}:${(parts[1] || "00").padStart(2, "0")}:00`;
}

/** decimal hour → "HH:mm" */
function decimalToHHMM(dec) {
  if (dec == null || isNaN(dec)) return "09:00";
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Map a time range (e.g. "09:00"–"11:30") to slot indices.
 * Only slots fully WITHIN [startStr, endStr] are included.
 */
function rangeToSlotIndices(startStr, endStr) {
  if (!startStr || !endStr) return [];
  const s = String(startStr).substring(0, 5);
  const e = String(endStr).substring(0, 5);
  const indices = [];
  TIME_SLOTS_30MIN.forEach((slot, idx) => {
    if (slot.start >= s && slot.end <= e) indices.push(idx);
  });
  return indices;
}

/**
 * Group sorted selected slot indices into contiguous runs.
 * Returns [{shiftStart, shiftEnd}, …]
 */
function groupContiguous(selectedIndices) {
  if (!selectedIndices?.length) return [];
  const sorted = [...selectedIndices].sort((a, b) => a - b);
  const groups = [];
  let run = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      run.push(sorted[i]);
    } else {
      groups.push(run);
      run = [sorted[i]];
    }
  }
  groups.push(run);
  return groups.map((g) => ({
    shiftStart: TIME_SLOTS_30MIN[g[0]].start,
    shiftEnd:   TIME_SLOTS_30MIN[g[g.length - 1]].end,
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditScheduleModal({
  open,
  onClose,
  schedule,
  staffArtists = [],
  monday: timelineMondayProp,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("PATCH");

  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const [modalMonday, setModalMonday] = useState(() => getMondayOfWeek(dayjs()));
  const modalSunday = modalMonday.add(6, "day");

  // { Mon: [scheduleObj, …], … }
  const [weekMap, setWeekMap] = useState({});
  const [loadingWeek, setLoadingWeek] = useState(false);

  const [selectedDays, setSelectedDays] = useState({});

  const [editStatus, setEditStatus] = useState("Active");
  /** Set of slot indices (0-15) that are selected = working */
  const [selectedSlots, setSelectedSlots] = useState(
    () => TIME_SLOTS_30MIN.map((_, i) => i)
  );

  // ── Init from schedule prop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (schedule) {
      setSelectedStaffId(schedule.artistId ?? null);

      const dateVal =
        schedule.workDate ||
        schedule.rawSchedule?.workDate ||
        schedule.rawSchedule?.date;

      setModalMonday(
        dateVal
          ? getMondayOfWeek(dateVal)
          : timelineMondayProp
          ? getMondayOfWeek(timelineMondayProp)
          : getMondayOfWeek(dayjs())
      );

      setEditStatus(schedule.status || schedule.rawSchedule?.status || "Active");

      // Pre-select slots from all active shifts of this day
      const schedulesList =
        schedule.schedules || (schedule.rawSchedule ? [schedule.rawSchedule] : []);
      const activeShifts = schedulesList.filter((s) => {
        const st = (s.status || s.scheduleStatus || "").toLowerCase();
        return st !== "off" && st !== "leave";
      });

      const preselectedIndices = new Set();
      activeShifts.forEach((s) => {
        const rawStart = s.shiftStart || s.startTime || s.start;
        const rawEnd   = s.shiftEnd   || s.endTime   || s.end;
        const startStr = typeof rawStart === "number"
          ? decimalToHHMM(rawStart)
          : String(rawStart || "");
        const endStr = typeof rawEnd === "number"
          ? decimalToHHMM(rawEnd)
          : String(rawEnd || "");
        rangeToSlotIndices(startStr, endStr).forEach((i) =>
          preselectedIndices.add(i)
        );
      });

      setSelectedSlots(
        activeShifts.length > 0
          ? [...preselectedIndices]
          : TIME_SLOTS_30MIN.map((_, i) => i)
      );

      if (dateVal) {
        const rawDay = dayjs(dateVal).day();
        const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayKey = rawDay === 0 ? "Sun" : DAY_NAMES[rawDay - 1];
        setSelectedDays({ [dayKey]: true });
      } else {
        setSelectedDays({});
      }
    } else {
      setSelectedStaffId(null);
      setModalMonday(
        timelineMondayProp
          ? getMondayOfWeek(timelineMondayProp)
          : getMondayOfWeek(dayjs())
      );
      setSelectedDays({});
      setEditStatus("Active");
      setSelectedSlots(TIME_SLOTS_30MIN.map((_, i) => i));
    }
  }, [open, schedule, timelineMondayProp]);

  // ── Fetch weekly schedules for selected staff ───────────────────────────────
  useEffect(() => {
    if (!open || !selectedStaffId) {
      setWeekMap({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingWeek(true);
      try {
        const data = await fetchArtistSchedules(selectedStaffId, {
          startDate: modalMonday.format("YYYY-MM-DDT00:00:00"),
          endDate:   modalSunday.format("YYYY-MM-DDT23:59:59"),
        });
        if (!cancelled) setWeekMap(buildDayMap(data));
      } catch {
        if (!cancelled) setWeekMap({});
      } finally {
        if (!cancelled) setLoadingWeek(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, selectedStaffId, modalMonday]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isNonWorking = editStatus === "Off" || editStatus === "Leave";

  const totalWorkingHours = useMemo(
    () => (isNonWorking ? 0 : selectedSlots.length * 0.5),
    [selectedSlots, isNonWorking]
  );

  const isTimeInvalid = !isNonWorking && selectedSlots.length === 0;

  // Slot helpers
  const selectAllSlots  = () => setSelectedSlots(TIME_SLOTS_30MIN.map((_, i) => i));
  const clearAllSlots   = () => setSelectedSlots([]);
  const applyPreset = (hours) => {
    const count = hours * 2; // 30-min slots per hour
    setSelectedSlots(Array.from({ length: count }, (_, i) => i));
  };
  const toggleSlot = (idx) =>
    setSelectedSlots((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );

  const staffName =
    schedule?.name ||
    staffArtists.find((s) => String(s.id) === String(selectedStaffId))?.name ||
    "Select staff";

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedStaffId) {
      message.error("Please select a staff member.");
      return;
    }
    if (isTimeInvalid) {
      message.error("Please select at least one time slot.");
      return;
    }

    // Target groups from slot selection
    const targetGroups = isNonWorking ? [] : groupContiguous(selectedSlots);

    /**
     * For a given day's existing schedules + target groups:
     * - Reuse existing records where possible (PATCH)
     * - Create new records if more groups than existing records
     * - Set extra existing records to Off if fewer groups than existing records
     */
    const reconcileDay = (existingSchedules, workDateStr) => {
      const ops = [];
      const n = existingSchedules.length;

      if (targetGroups.length === 0) {
        // Mark all as Off/Leave
        existingSchedules.forEach((s) => {
          ops.push(
            patchSchedule(s.id || s.scheduleId, {
              workDate: workDateStr,
              shiftStart: null,
              shiftEnd: null,
              status: editStatus,
            })
          );
        });
      } else {
        const m = targetGroups.length;
        const maxLen = Math.max(n, m);
        for (let i = 0; i < maxLen; i++) {
          if (i < m && i < n) {
            // Update existing record
            ops.push(
              patchSchedule(existingSchedules[i].id || existingSchedules[i].scheduleId, {
                workDate: workDateStr,
                shiftStart: toApiTime(targetGroups[i].shiftStart),
                shiftEnd:   toApiTime(targetGroups[i].shiftEnd),
                status: "Active",
              })
            );
          } else if (i < m && i >= n) {
            // Create new record
            ops.push(
              createSchedule({
                nailArtistId: selectedStaffId,
                workDate: workDateStr,
                shiftStart: toApiTime(targetGroups[i].shiftStart),
                shiftEnd:   toApiTime(targetGroups[i].shiftEnd),
                status: "Active",
              })
            );
          } else {
            // Extra old record → deactivate
            ops.push(
              patchSchedule(existingSchedules[i].id || existingSchedules[i].scheduleId, {
                workDate: workDateStr,
                shiftStart: null,
                shiftEnd: null,
                status: "Off",
              })
            );
          }
        }
      }
      return ops;
    };

    try {
      setLoading(true);

      const formatDate = (s) => {
        const d = s?.workDate || s?.date || s?.scheduleDate;
        return d ? dayjs(d).format("YYYY-MM-DDT00:00:00.000[Z]") : null;
      };

      let daysToProcess = [];

      if (method === "PUT") {
        daysToProcess = DAYS_OF_WEEK.filter((d) => weekMap[d.key]?.length > 0);
        if (daysToProcess.length === 0) {
          message.warning("No existing schedules found for this week.");
          return;
        }
      } else {
        daysToProcess = DAYS_OF_WEEK.filter(
          (d) => selectedDays[d.key] && weekMap[d.key]?.length > 0
        );
        if (daysToProcess.length === 0) {
          message.error("Please select at least one day that has an existing schedule.");
          return;
        }
      }

      const allOps = daysToProcess.flatMap((d) => {
        const daySchedules = weekMap[d.key];
        const workDate =
          formatDate(daySchedules[0]) ||
          modalMonday.add(d.offset, "day").format("YYYY-MM-DDT00:00:00.000[Z]");
        return reconcileDay(daySchedules, workDate);
      });

      await Promise.all(allOps);
      message.success(
        `Schedules updated for ${daysToProcess.length} day(s).`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update schedule:", err);
      message.error(err.message || "Failed to update schedule.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const leftColWidth = !isNonWorking ? "col-span-3" : "col-span-3";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={selectedStaffId ? 760 : 460}
      centered
      destroyOnClose
      closable={false}
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(6px)" },
      }}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#ff8ebb] via-[#ff7ba4] to-[#ea4f93] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
            <Clock3 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
              Edit Schedule
            </p>
            <h3 className="truncate text-sm font-bold text-white">{staffName}</h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className={`grid gap-4 ${selectedStaffId ? "grid-cols-5" : "grid-cols-1"}`}>

          {/* ── Left column ── */}
          <div className={`space-y-4 ${selectedStaffId ? leftColWidth : "col-span-1"}`}>

            {/* Update Method */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#a88a9f]">
                Update Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "PUT",   label: "Full Update",    sub: "Apply to all days of the week" },
                  { value: "PATCH", label: "Partial Update", sub: "Select specific days to edit" },
                ].map((opt) => {
                  const isActive = method === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMethod(opt.value)}
                      className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-all ${
                        isActive
                          ? "border-transparent bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] text-white shadow-sm"
                          : "border-[#f1e7ed] bg-white text-[#a88a9f] hover:border-[#ea4f93]/30"
                      }`}
                    >
                      <span className="text-[11px] font-bold">{opt.label}</span>
                      <span className={`mt-0.5 text-[9px] font-medium ${isActive ? "text-white/75" : "text-[#c0a8ba]"}`}>
                        {opt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Staff */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#a88a9f]">
                Staff
              </label>
              {schedule ? (
                <div className="flex h-10 items-center rounded-xl border border-[#f1e7ed] bg-[#fffafd] px-4 text-sm font-semibold text-[#2d1b35]">
                  {schedule.name}
                </div>
              ) : (
                <Select
                  value={selectedStaffId}
                  onChange={(val) => {
                    setSelectedStaffId(val);
                    setSelectedDays({});
                    setWeekMap({});
                  }}
                  className="w-full"
                  size="large"
                  placeholder="Choose a staff member..."
                  options={staffArtists.map((s) => ({ value: s.id, label: s.name }))}
                />
              )}
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#a88a9f]">
                New Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(STATUS_META).map(([key, meta]) => {
                  const isActive = editStatus === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditStatus(key)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${
                        isActive
                          ? `${meta.color} ring-2 ring-offset-1 ring-current`
                          : "border-[#f1e7ed] bg-white text-[#a88a9f] hover:border-[#ea4f93]/30"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? meta.dot : "bg-[#c0a8ba]"}`} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Working Hours — slot grid */}
            {!isNonWorking && (
              <div>
                {/* Header row */}
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#a88a9f]">
                    Working Hours
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[4, 6, 8].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => applyPreset(h)}
                        className="rounded-full border border-[#f1c6dd] bg-white px-2 py-0.5 text-[9px] font-semibold text-[#ea4f93] transition hover:bg-[#fff5fa]"
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select / Clear helpers */}
                <div className="mb-2 flex items-center justify-between border-b border-rose-50 pb-1.5">
                  <span className="text-[9.5px] text-slate-400">
                    Deselect slots to create breaks:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllSlots}
                      className="text-[9.5px] font-bold text-[#ea4f93] hover:underline"
                    >
                      All
                    </button>
                    <span className="text-[9.5px] text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllSlots}
                      className="text-[9.5px] font-bold text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* 4-column grid of 30-min slots */}
                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_SLOTS_30MIN.map((slot, idx) => {
                    const on = selectedSlots.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleSlot(idx)}
                        className={`rounded-xl border px-1 py-1 text-center transition-all duration-150 ${
                          on
                            ? "border-[#ea4f93] bg-[#fff5fa] shadow-sm"
                            : "border-slate-100 bg-[#fafafa] hover:border-[#ea4f93]/30 hover:bg-[#fffbfc]"
                        }`}
                      >
                        <span className={`block text-[9.5px] font-bold leading-none ${
                          on ? "text-[#ea4f93]" : "text-slate-400"
                        }`}>
                          {slot.start}
                        </span>
                        <span className={`block text-[8px] leading-none mt-0.5 ${
                          on ? "text-[#ea4f93]/60" : "text-slate-300"
                        }`}>
                          {slot.end}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Summary: working hours + shift block preview */}
                <div className="mt-2.5 space-y-1.5">
                  {isTimeInvalid ? (
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-red-500">
                      <AlertCircle size={11} />
                      Please select at least one time slot
                    </p>
                  ) : (
                    <>
                      <p className="flex items-center gap-1 text-[10px] font-semibold text-[#2fa25f]">
                        <CheckCircle2 size={11} />
                        {totalWorkingHours.toFixed(1)}h working
                        {groupContiguous(selectedSlots).length > 1 && (
                          <span className="ml-1 text-[#a88a9f]">
                            ({groupContiguous(selectedSlots).length} shifts)
                          </span>
                        )}
                      </p>
                      {/* Live preview of shift blocks */}
                      <div className="flex flex-wrap gap-1">
                        {groupContiguous(selectedSlots).map((g, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-0.5 rounded-full border border-[#ea4f93]/30 bg-[#fff0f8] px-2 py-0.5 text-[9.5px] font-bold text-[#ea4f93]"
                          >
                            {g.shiftStart} → {g.shiftEnd}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-full border border-[#f1c6dd] bg-white py-2 text-[11px] font-bold text-[#ea4f93] transition hover:bg-[#fffafd] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || isTimeInvalid || !selectedStaffId}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2 text-[11px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-95 disabled:opacity-50"
              >
                {loading ? <Spin size="small" className="brightness-200" /> : "Save Changes"}
              </button>
            </div>
          </div>

          {/* ── Right column: weekly view ── */}
          {selectedStaffId && (
            <div className="col-span-2">
              <div className="rounded-2xl border border-rose-100 bg-[#fffafd] p-3 flex flex-col h-full">
                {/* Week nav */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMonday((p) => p.subtract(1, "week"))}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#f1c6dd] bg-white text-[#ea4f93] text-sm font-bold hover:bg-[#fff5fa] transition"
                  >
                    &#8249;
                  </button>
                  <p className="flex-1 text-center text-[10px] font-bold text-[#2d1b35]">
                    {modalMonday.format("MMM DD")} &mdash; {modalSunday.format("MMM DD, YYYY")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalMonday((p) => p.add(1, "week"))}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#f1c6dd] bg-white text-[#ea4f93] text-sm font-bold hover:bg-[#fff5fa] transition"
                  >
                    &#8250;
                  </button>
                </div>

                {loadingWeek ? (
                  <div className="flex flex-1 items-center justify-center py-8">
                    <Spin size="small" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 flex-1">
                    {DAYS_OF_WEEK.map((day) => {
                      const dayDate     = modalMonday.add(day.offset, "day");
                      const daySchedules = weekMap[day.key] || [];
                      const hasShift    = daySchedules.length > 0;
                      const isPartial   = method === "PATCH";
                      const isSelected  = isPartial && Boolean(selectedDays[day.key]);

                      const shiftLabel = hasShift
                        ? daySchedules
                            .map((s) => {
                              const st = s.shiftStart || s.startTime || "";
                              const en = s.shiftEnd   || s.endTime   || "";
                              const st2 = (s.status || s.scheduleStatus || "").toLowerCase();
                              if (st2 === "off" || st2 === "leave" || !st || !en)
                                return st2 === "leave" ? "On Leave" : "Day Off";
                              return `${String(st).slice(0, 5)}–${String(en).slice(0, 5)}`;
                            })
                            .join(", ")
                        : null;

                      let cardClass =
                        "relative flex items-center gap-2 rounded-lg border p-2 transition-all duration-200 ";
                      if (!hasShift) {
                        cardClass += "border-[#f5e8ef] bg-[#fdf8fc] opacity-40 cursor-not-allowed";
                      } else if (isPartial) {
                        cardClass += isSelected
                          ? "border-[#ea4f93] bg-[#fff5fa] shadow-sm cursor-pointer"
                          : "border-rose-100 bg-white hover:border-rose-200 cursor-pointer";
                      } else {
                        cardClass += "border-[#ea4f93]/40 bg-[#fff5fa] cursor-default";
                      }

                      return (
                        <div
                          key={day.key}
                          className={cardClass}
                          onClick={() => {
                            if (!hasShift || !isPartial) return;
                            setSelectedDays((p) => ({ ...p, [day.key]: !p[day.key] }));
                          }}
                        >
                          {isPartial && hasShift && (
                            <input
                              type="checkbox"
                              readOnly
                              checked={isSelected}
                              className="h-3.5 w-3.5 accent-[#ea4f93] pointer-events-none"
                            />
                          )}
                          {!isPartial && hasShift && (
                            <CheckCircle2 size={11} className="shrink-0 text-[#ea4f93]" />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700">
                                {day.label}
                              </span>
                              <span className="text-[8px] text-slate-400">
                                {dayDate.format("MMM DD")}
                              </span>
                            </div>
                            {hasShift && shiftLabel ? (
                              <span className="mt-0.5 block truncate rounded-md bg-[#ffe8f2] px-1.5 py-0.5 text-[8px] font-bold leading-none text-[#ea4f93]">
                                {shiftLabel}
                              </span>
                            ) : (
                              <span className="mt-0.5 text-[8px] leading-none text-slate-300">
                                No shift
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loadingWeek && (
                  <p className="mt-2 text-center text-[9px] text-[#a88a9f]">
                    {method === "PUT"
                      ? `Full Update: ${Object.keys(weekMap).length} day(s)`
                      : "Partial: select days to edit"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

EditScheduleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  schedule: PropTypes.object,
  staffArtists: PropTypes.array,
  monday: PropTypes.object,
  onSuccess: PropTypes.func,
};
