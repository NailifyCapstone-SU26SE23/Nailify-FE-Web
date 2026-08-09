import dayjs from "dayjs";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  RefreshCcw,
  Scissors,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchStaffSchedules } from "../services/staffScheduleService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_MARKERS = Array.from({ length: 12 }, (_, index) => 7 + index);
const EVENT_PALETTES = [
  "bg-[#d8f5e5] text-[#275c45]",
  "bg-[#fde9cf] text-[#7a4a20]",
  "bg-[#fce0df] text-[#7b3f41]",
  "bg-[#dce9ff] text-[#25466d]",
  "bg-[#ede4ff] text-[#5a3f82]",
  "bg-[#fff2b9] text-[#735c1e]",
  "bg-[#d6f3f0] text-[#215f62]",
];

function startOfIsoWeek(value) {
  const currentDay = dayjs(value);
  const weekDay = currentDay.day();
  const shift = weekDay === 0 ? -6 : 1 - weekDay;
  return currentDay.add(shift, "day").startOf("day");
}

function endOfIsoWeek(value) {
  return startOfIsoWeek(value).add(6, "day").endOf("day");
}

function getPaletteClass(index) {
  return EVENT_PALETTES[index % EVENT_PALETTES.length];
}

function getStatusDotClass(status) {
  const normalized = String(status || "").trim().toLowerCase();

  if (["confirmed", "working", "active"].includes(normalized)) {
    return "bg-[#39b980]";
  }

  if (["pending", "draft"].includes(normalized)) {
    return "bg-[#ffb648]";
  }

  if (["off", "dayoff", "leave", "holiday"].includes(normalized)) {
    return "bg-[#9ca3af]";
  }

  return "bg-[#7c6cff]";
}

function formatTimeLabel(value) {
  return value ? dayjs(value).format("HH:mm") : "--:--";
}

function formatDurationLabel(startValue, endValue) {
  if (!startValue || !endValue) {
    return "--";
  }

  const minutes = Math.max(dayjs(endValue).diff(dayjs(startValue), "minute"), 0);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
}

function getScheduleBlockStyle(schedule) {
  if (!schedule?.shiftStart || !schedule?.shiftEnd) {
    return {
      left: "2%",
      width: "14%",
    };
  }

  const dayStart = dayjs(schedule.shiftStart).startOf("day").hour(7);
  const startOffset = Math.max(dayjs(schedule.shiftStart).diff(dayStart, "minute"), 0);
  const endOffset = Math.min(dayjs(schedule.shiftEnd).diff(dayStart, "minute"), 12 * 60);
  const safeDuration = Math.max(endOffset - startOffset, 45);

  return {
    left: `${(startOffset / (12 * 60)) * 100}%`,
    width: `${(safeDuration / (12 * 60)) * 100}%`,
  };
}

function SideNavItem({ active, icon: Icon, label, meta }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[22px] px-4 py-4 text-sm transition ${active ? "bg-[linear-gradient(180deg,#fff9f7_0%,#fff5f1_100%)] text-[#231d1c] shadow-[0_12px_24px_rgba(247,122,105,0.08)]" : "text-[#69708a]"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={active ? "text-[#f57c67]" : "text-[#7f869f]"} />
        <span className="text-[15px] font-medium">{label}</span>
      </div>
      {meta ? <span className="h-2 w-2 rounded-full bg-[#f57c67]" /> : null}
    </div>
  );
}

function EventCard({ schedule, paletteClass }) {
  return (
    <div className={`rounded-[20px] px-4 py-4 shadow-[0_12px_24px_rgba(26,32,60,0.06)] ${paletteClass}`}>
      <p className="text-[13px] font-semibold">{formatTimeLabel(schedule.shiftStart)} - {formatTimeLabel(schedule.shiftEnd)}</p>
      <p className="mt-2 text-[15px] font-bold">{schedule.status || "Shift"}</p>
      <p className="mt-2 text-[13px] opacity-70">{formatDurationLabel(schedule.shiftStart, schedule.shiftEnd)}</p>
    </div>
  );
}

export function StaffSchedulesPage() {
  const [currentWeek, setCurrentWeek] = useState(() => startOfIsoWeek(dayjs()));
  const [selectedDate, setSelectedDate] = useState(() => dayjs().startOf("day"));
  const [scheduleRows, setScheduleRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => dayjs());
  const { language } = useLanguage();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(dayjs());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSchedules = async () => {
      try {
        setIsLoading(true);
        setError("");

        const rows = await fetchStaffSchedules({
          startDate: currentWeek.startOf("day").toISOString(),
          endDate: endOfIsoWeek(currentWeek).toISOString(),
        });

        if (!isMounted) {
          return;
        }

        setScheduleRows(rows);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load staff schedules:", loadError);
        setScheduleRows([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load schedules.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSchedules();

    return () => {
      isMounted = false;
    };
  }, [currentWeek]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => currentWeek.add(index, "day")),
    [currentWeek],
  );

  const groupedByDay = useMemo(
    () => weekDays.map((day, index) => ({
      day,
      rowLabel: day.format("dddd"),
      paletteClass: getPaletteClass(index),
      schedules: scheduleRows
        .filter((item) => dayjs(item.workDate).isSame(day, "day"))
        .sort((left, right) => dayjs(left.shiftStart).valueOf() - dayjs(right.shiftStart).valueOf()),
    })),
    [scheduleRows, weekDays],
  );

  const upcomingSchedules = useMemo(
    () => [...scheduleRows]
      .filter((item) => dayjs(item.shiftEnd || item.workDate).isAfter(dayjs().subtract(1, "minute")))
      .sort((left, right) => dayjs(left.shiftStart).valueOf() - dayjs(right.shiftStart).valueOf())
      .slice(0, 3),
    [scheduleRows],
  );

  const totalProcedures = scheduleRows.length;
  const activeWeekContainsToday = useMemo(
    () => weekDays.some((day) => day.isSame(now, "day")),
    [now, weekDays],
  );
  const todayMarkerPosition = useMemo(() => {
    if (!activeWeekContainsToday) {
      return null;
    }

    const dayStart = now.startOf("day").hour(7);
    const minutesSinceStart = now.diff(dayStart, "minute");

    if (minutesSinceStart < 0 || minutesSinceStart > 12 * 60) {
      return null;
    }

    return `${(minutesSinceStart / (12 * 60)) * 100}%`;
  }, [activeWeekContainsToday, now]);

  return (
    <section className="relative min-h-full overflow-hidden rounded-[36px] ">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,#ff9f95_0%,rgba(255,159,149,0)_72%)] opacity-70 blur-2xl" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,#ffe4de_0%,rgba(255,228,222,0)_72%)] blur-2xl" />
      </div>

      <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white shadow-[0_24px_90px_rgba(226,143,128,0.16)]">
        <div className="grid min-h-[760px]">
          <main className="bg-[linear-gradient(180deg,#ffffff_0%,#fffefd_100%)]">
            <div className="border-b border-[#eef0f5] px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentWeek(startOfIsoWeek(dayjs()));
                    setSelectedDate(dayjs().startOf("day"));
                  }}
                  className="inline-flex items-center gap-3 rounded-2xl border border-[#eef0f5] bg-white px-3 py-2 text-[#1f2435] shadow-[0_8px_20px_rgba(25,35,68,0.04)]"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#f0f2f6] bg-[#fff9f6] text-[#f57c67]">
                    <ArrowLeft size={15} />
                  </span>
                  <span className="text-[16px] font-bold">{language === "vi" ? "Lịch làm việc hàng ngày" : "Daily schedule"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentWeek((current) => current.clone())}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#eef0f5] bg-white px-4 py-2 text-sm font-semibold text-[#4d556d]"
                >
                  <RefreshCcw size={14} className="text-[#f57c67]" />
                  {language === "vi" ? "Tải lại" : "Refresh"}
                </button>
              </div>
            </div>

            <div className="px-6 py-6 bg-[linear-gradient(135deg,#fff6f1_0%,#fffaf7_42%,#ffe3dc_100%)]">
              {error ? (
                <div className="mb-4 rounded-2xl border border-[#ffd9d3] bg-[#fff5f2] px-4 py-3 text-sm font-medium text-[#d36557]">
                  {error}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[24px] border border-[#eef0f5] bg-[#fbfcff]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f5] px-4 py-4">
                  <div>
                    <p className="text-[15px] font-bold text-[#1f2435]">{language === "vi" ? "Lịch làm việc theo tuần" : "Daily schedule (staff week view)"}</p>
                    <p className="mt-1 text-sm text-[#8f97aa]">
                      {currentWeek.format("DD MMM YYYY")} - {endOfIsoWeek(currentWeek).format("DD MMM YYYY")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const nextWeek = currentWeek.subtract(7, "day");
                        setCurrentWeek(nextWeek);
                        setSelectedDate(nextWeek);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#eef0f5] bg-white text-[#6c758e]"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextWeek = currentWeek.add(7, "day");
                        setCurrentWeek(nextWeek);
                        setSelectedDate(nextWeek);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#eef0f5] bg-white text-[#6c758e]"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <div className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#5d657d]">
                      {language === "vi" ? `${totalProcedures} lịch trong tuần này` : `${totalProcedures} schedules this week`}
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-hidden">
                  <div className="relative w-full">
                    {todayMarkerPosition ? (
                      <div className="pointer-events-none absolute inset-y-0 left-[150px] right-0 z-20">
                        <div
                          className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-[#f57c67]/80"
                          style={{ left: todayMarkerPosition }}
                        />
                        <div
                          className="absolute top-0 h-[42px] w-[4px] -translate-x-1/2 rounded-full bg-[#f57c67]"
                          style={{ left: todayMarkerPosition }}
                        />
                      </div>
                    ) : null}

                    <div className="relative">
                      <div className="grid grid-cols-[150px_repeat(12,minmax(0,1fr))] border-b border-[#eef0f5] text-sm text-[#707892]">
                        <div className="px-4 py-4 font-semibold text-[#8e95aa]">{language === "vi" ? "Ngày" : "Day"}</div>
                        {HOUR_MARKERS.map((hour) => (
                          <div key={`header-${hour}`} className="border-l border-[#f3f5f8] px-1 py-4 text-center text-xs font-medium sm:px-2 lg:px-3 lg:text-sm">
                            {String(hour).padStart(2, "0")}:00
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      {groupedByDay.map((group, rowIndex) => {
                        const isSelected = group.day.isSame(selectedDate, "day");
                        const isToday = group.day.isSame(now, "day");

                        return (
                          <button
                            key={group.day.format("YYYY-MM-DD")}
                            type="button"
                            onClick={() => setSelectedDate(group.day)}
                            className={`relative grid w-full grid-cols-[150px_repeat(12,minmax(0,1fr))] border-b border-[#eef0f5] text-left transition ${isSelected ? "bg-[#fffaf7]" : "bg-white"
                              }`}
                          >
                            <div className="px-3 py-4 lg:px-4">
                              <p className={`text-sm font-bold lg:text-[15px] ${isSelected ? "text-[#1f2435]" : "text-[#31364a]"}`}>
                                {group.rowLabel}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-[#8790a5] lg:text-sm">
                                <span>{group.day.format("DD MMM")}</span>
                                {isToday ? <span className="h-2 w-2 rounded-full bg-[#f57c67]" /> : null}
                              </div>
                              <p className="mt-2 text-xs text-[#8f97aa] lg:text-sm">
                                 {group.schedules.length > 0
                                   ? (language === "vi" ? `${group.schedules.length} ca làm` : `${group.schedules.length} shift${group.schedules.length > 1 ? "s" : ""}`)
                                   : (language === "vi" ? "Không có ca" : "No shifts")}
                               </p>
                            </div>

                            {HOUR_MARKERS.map((hour) => (
                              <div key={`${group.day.format("YYYY-MM-DD")}-${hour}`} className="min-h-[82px] border-l border-[#f3f5f8]" />
                            ))}

                            <div className="pointer-events-none absolute inset-y-0 left-[150px] right-0">
                              {group.schedules.map((schedule, scheduleIndex) => (
                                <div
                                  key={schedule.scheduleId || `${schedule.workDate}-${schedule.shiftStart}-${scheduleIndex}`}
                                  className={`pointer-events-auto absolute top-3 bottom-3 z-10 flex min-w-[120px] items-start rounded-[14px] px-3 py-2 text-left shadow-[0_6px_16px_rgba(31,36,53,0.08)] ${getPaletteClass(rowIndex + scheduleIndex)
                                    }`}
                                  style={getScheduleBlockStyle(schedule)}
                                >
                                  <div>
                                    <p className="text-[11px] font-semibold">
                                      {formatTimeLabel(schedule.shiftStart)}
                                    </p>
                                    <p className="mt-1 text-sm font-bold">{schedule.status || "Shift"}</p>
                                    <div className="mt-1 flex items-center gap-2 text-[11px] opacity-80">
                                      <span className={`h-2 w-2 rounded-full ${getStatusDotClass(schedule.status)}`} />
                                      <span>{formatDurationLabel(schedule.shiftStart, schedule.shiftEnd)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}
