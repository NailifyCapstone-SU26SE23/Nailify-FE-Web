import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  Users,
  Edit3,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Sun,
  Moon,
  Zap,
  TrendingUp,
  MoreVertical,
  Check,
  Briefcase,
  Star,
  Layers,
  Repeat,
  Info,
  Eye,
  EyeOff,
  ShieldAlert,
  AlarmClock,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Spin, Alert, Modal, DatePicker, Select, TimePicker, Input, Tooltip, Progress } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { EmergencyOffModal } from "../../staff-artist-management/components/EmergencyOffModal";
import {
  fetchNailArtists,
  fetchSchedulesBySalonId,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSalonId,
  getSalonIdAsync,
} from "../../staff-artist-management/services/nailArtistsService";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.03,
    },
  },
};

function formatTimeSpan(timeSpanStr) {
  if (!timeSpanStr) return "N/A";
  const parts = String(timeSpanStr).trim().split(":");
  if (parts.length < 2) return timeSpanStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function calculateShiftHours(shiftStart, shiftEnd) {
  if (!shiftStart || !shiftEnd) return 0;
  const startParts = String(shiftStart).split(":").map(Number);
  const endParts = String(shiftEnd).split(":").map(Number);
  const startMinutes = (startParts[0] || 0) * 60 + (startParts[1] || 0);
  const endMinutes = (endParts[0] || 0) * 60 + (endParts[1] || 0);
  return Math.max(0, Math.round(((endMinutes - startMinutes) / 60) * 10) / 10);
}

// Generate time options for clean 30-min interval dropdowns
const TIME_OPTIONS = [
  { label: "08:00 AM", value: "08:00" },
  { label: "08:30 AM", value: "08:30" },
  { label: "09:00 AM", value: "09:00" },
  { label: "09:30 AM", value: "09:30" },
  { label: "10:00 AM", value: "10:00" },
  { label: "10:30 AM", value: "10:30" },
  { label: "11:00 AM", value: "11:00" },
  { label: "11:30 AM", value: "11:30" },
  { label: "12:00 PM", value: "12:00" },
  { label: "12:30 PM", value: "12:30" },
  { label: "01:00 PM", value: "13:00" },
  { label: "01:30 PM", value: "13:30" },
  { label: "02:00 PM", value: "14:00" },
  { label: "02:30 PM", value: "14:30" },
  { label: "03:00 PM", value: "15:00" },
  { label: "03:30 PM", value: "15:30" },
  { label: "04:00 PM", value: "16:00" },
  { label: "04:30 PM", value: "16:30" },
  { label: "05:00 PM", value: "17:00" },
  { label: "05:30 PM", value: "17:30" },
  { label: "06:00 PM", value: "18:00" },
  { label: "06:30 PM", value: "18:30" },
  { label: "07:00 PM", value: "19:00" },
  { label: "07:30 PM", value: "19:30" },
  { label: "08:00 PM", value: "20:00" },
  { label: "08:30 PM", value: "20:30" },
  { label: "09:00 PM", value: "21:00" },
  { label: "09:30 PM", value: "21:30" },
  { label: "10:00 PM", value: "22:00" },
  { label: "10:30 PM", value: "22:30" },
  { label: "11:00 PM", value: "23:00" },
  { label: "11:30 PM", value: "23:30" },
];

// Determine shift badge styling based on start/end hours
function getShiftTheme(shiftStart, shiftEnd) {
  const startHour = parseInt(String(shiftStart).split(":")[0], 10) || 8;
  const hours = calculateShiftHours(shiftStart, shiftEnd);

  if (hours <= 2 && hours > 0) {
    return {
      bg: "bg-gradient-to-r from-[#F5F3FF] via-[#EDE9FE] to-[#F5F3FF]",
      border: "border-[#C4B5FD]",
      text: "text-[#5B21B6]",
      badgeBg: "bg-[#7C3AED]/15 text-[#6D28D9]",
      dot: "bg-[#8B5CF6]",
      label: "Short Shift",
      icon: Zap,
    };
  } else if (hours >= 10) {
    return {
      bg: "bg-gradient-to-r from-[#ECFDF5] via-[#D1FAE5] to-[#ECFDF5]",
      border: "border-[#86EFAC]",
      text: "text-[#065F46]",
      badgeBg: "bg-[#059669]/15 text-[#047857]",
      dot: "bg-[#10B981]",
      label: "Full Day Shift",
      icon: Star,
    };
  } else if (startHour < 11) {
    return {
      bg: "bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE] to-[#EFF6FF]",
      border: "border-[#93C5FD]",
      text: "text-[#1E40AF]",
      badgeBg: "bg-[#2563EB]/15 text-[#1D4ED8]",
      dot: "bg-[#3B82F6]",
      label: "Morning Shift",
      icon: Sun,
    };
  } else {
    return {
      bg: "bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB]",
      border: "border-[#FDE68A]",
      text: "text-[#92400E]",
      badgeBg: "bg-[#D97706]/15 text-[#B45309]",
      dot: "bg-[#F59E0B]",
      label: "Evening Shift",
      icon: Moon,
    };
  }
}

// Preset color themes for staff avatars
const AVATAR_GRADIENTS = [
  { grad: "from-[#EC4899] to-[#8B5CF6]", ring: "ring-[#EC4899]/30" },
  { grad: "from-[#3B82F6] to-[#1D4ED8]", ring: "ring-[#3B82F6]/30" },
  { grad: "from-[#10B981] to-[#047857]", ring: "ring-[#10B981]/30" },
  { grad: "from-[#F59E0B] to-[#D97706]", ring: "ring-[#F59E0B]/30" },
  { grad: "from-[#8B5CF6] to-[#6D28D9]", ring: "ring-[#8B5CF6]/30" },
  { grad: "from-[#F43F5E] to-[#BE123C]", ring: "ring-[#F43F5E]/30" },
  { grad: "from-[#06B6D4] to-[#0E7490]", ring: "ring-[#06B6D4]/30" },
];

export function ManagerSchedulesPage() {
  const { t, language } = useLanguage();
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => dayjs().startOf("week").add(1, "day"));
  const [staffList, setStaffList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Add/Edit
  const [formArtistId, setFormArtistId] = useState(null);
  const [formWorkDate, setFormWorkDate] = useState(dayjs());
  const [formStartTimeStr, setFormStartTimeStr] = useState("08:00");
  const [formEndTimeStr, setFormEndTimeStr] = useState("17:00");
  const [formStatus, setFormStatus] = useState("Active");
  const [activePreset, setActivePreset] = useState("MORNING");

  // View & Filter toggles
  const [showShiftTimes, setShowShiftTimes] = useState(true);
  const [selectedDayKey, setSelectedDayKey] = useState("ALL"); // "ALL" | "MON" | "TUE" | ...

  // Emergency Off Modal State (BR-05)
  const [isEmergencyOffModalOpen, setIsEmergencyOffModalOpen] = useState(false);
  const [selectedEmergencyArtist, setSelectedEmergencyArtist] = useState(null);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(selectedWeekStart.add(i, "day"));
    }
    return days;
  }, [selectedWeekStart]);

  const displayedWeekDays = useMemo(() => {
    if (selectedDayKey === "ALL") return weekDays;
    return weekDays.filter((d) => d.format("ddd").toUpperCase() === selectedDayKey);
  }, [weekDays, selectedDayKey]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const salonId = (await getSalonIdAsync()) || getSalonId();
      if (!salonId) {
        setError("No salon ID found in session. Please log in as a salon manager.");
        setIsLoading(false);
        return;
      }

      const startDateStr = selectedWeekStart.format("YYYY-MM-DD");
      const endDateStr = selectedWeekStart.add(6, "day").format("YYYY-MM-DD");

      const [artistsData, schedulesData] = await Promise.all([
        fetchNailArtists(salonId),
        fetchSchedulesBySalonId(salonId, {
          startDate: startDateStr,
          endDate: endDateStr,
        }),
      ]);

      const rawArtists = Array.isArray(artistsData) ? artistsData : artistsData?.items || [];
      const mappedArtists = rawArtists.map((a, idx) => {
        const fullName =
          a.account?.fullName ||
          (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.fullName || a.name || "Nail Artist");
        const theme = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
        return {
          id: a.nailArtistId || a.id || a.staffId || a.userId,
          nailArtistId: a.nailArtistId || a.id,
          accountId: a.accountId || a.userId || a.id,
          name: fullName,
          phone: a.account?.phone || a.phone || "",
          avatar: a.account?.avatarUrl || a.avatarUrl || "",
          initials: fullName
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          gradient: theme.grad,
          ring: theme.ring,
          specialty: idx % 2 === 0 ? "Senior Gel Specialist" : "Nail Art Master",
        };
      });

      setStaffList(mappedArtists);
      setSchedulesList(Array.isArray(schedulesData) ? schedulesData : []);
    } catch (err) {
      console.error("Failed to load staff schedules:", err);
      setError(err.message || "Failed to load staff schedules.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWeekStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived filtered staff
  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  // Map schedules by artist & date
  const scheduleMatrix = useMemo(() => {
    const map = new Map();
    schedulesList.forEach((s) => {
      const scheduleArtistId = s.nailArtistId || s.artistId;
      const dateKey = dayjs(s.workDate || s.date).format("YYYY-MM-DD");
      const matchingStaff = staffList.find(
        (st) =>
          st.id === scheduleArtistId ||
          st.nailArtistId === scheduleArtistId ||
          st.accountId === scheduleArtistId
      );
      const targetId = matchingStaff ? matchingStaff.id : scheduleArtistId;
      const key = `${targetId}_${dateKey}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return map;
  }, [schedulesList, staffList]);

  // Stats calculation
  const totalWeeklyHours = useMemo(() => {
    return schedulesList.reduce((acc, s) => acc + calculateShiftHours(s.shiftStart, s.shiftEnd), 0);
  }, [schedulesList]);

  const activeTodayCount = useMemo(() => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    return schedulesList.filter((s) => dayjs(s.workDate).format("YYYY-MM-DD") === todayStr).length;
  }, [schedulesList]);

  // Handlers
  const handleOpenAddModal = (artistId = null, date = dayjs()) => {
    setFormArtistId(artistId || (staffList[0]?.id || null));
    setFormWorkDate(date);
    setFormStartTimeStr("08:00");
    setFormEndTimeStr("17:00");
    setFormStatus("Active");
    setActivePreset("MORNING");
    setIsAddModalOpen(true);
  };

  const handleApplyPreset = (type, startStr, endStr) => {
    setActivePreset(type);
    setFormStartTimeStr(startStr);
    setFormEndTimeStr(endStr);
    toast.success(`Applied shift preset: ${startStr} - ${endStr}`, { icon: <AlarmClock size={12} /> });
  };

  const handleOpenEditModal = (schedule) => {
    setSelectedScheduleForEdit(schedule);
    const matchingStaff = staffList.find(
      (st) =>
        st.id === schedule.nailArtistId ||
        st.nailArtistId === schedule.nailArtistId ||
        st.accountId === schedule.nailArtistId
    );
    setFormArtistId(matchingStaff ? matchingStaff.id : (schedule.nailArtistId || schedule.artistId));
    setFormWorkDate(dayjs(schedule.workDate));

    const startStr = String(schedule.shiftStart || "08:00:00").slice(0, 5);
    const endStr = String(schedule.shiftEnd || "17:00:00").slice(0, 5);
    setFormStartTimeStr(startStr);
    setFormEndTimeStr(endStr);
    setFormStatus(schedule.status || "Active");
    setIsEditModalOpen(true);
  };

  const handleCreateScheduleSubmit = async () => {
    if (!formArtistId) {
      toast.error("Please select a staff artist");
      return;
    }
    setIsSubmitting(true);
    try {
      await createSchedule({
        nailArtistId: formArtistId,
        workDate: formWorkDate.format("YYYY-MM-DD"),
        shiftStart: `${formStartTimeStr}:00`,
        shiftEnd: `${formEndTimeStr}:00`,
        status: formStatus,
      });
      toast.success("Shift schedule created successfully!", { icon: "✨" });
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to create schedule:", err);
      toast.error(err.message || "Failed to create schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditScheduleSubmit = async () => {
    if (!selectedScheduleForEdit) return;
    setIsSubmitting(true);
    try {
      await updateSchedule(selectedScheduleForEdit.scheduleId || selectedScheduleForEdit.id, {
        nailArtistId: formArtistId,
        workDate: formWorkDate.format("YYYY-MM-DD"),
        shiftStart: `${formStartTimeStr}:00`,
        shiftEnd: `${formEndTimeStr}:00`,
        status: formStatus,
      });
      toast.success("Shift schedule updated!", { icon: "📝" });
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to update schedule:", err);
      toast.error(err.message || "Failed to update schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScheduleClick = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to delete this shift schedule?")) return;
    try {
      await deleteSchedule(scheduleId);
      toast.success("Shift schedule deleted", { icon: "🗑️" });
      loadData();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      toast.error(err.message || "Failed to delete schedule");
    }
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex min-h-[100dvh] flex-col gap-6 bg-[#FAF6F8] p-4 lg:p-8 font-sans"
    >
      {/* Luxury Rose Pink Hero Header */}
      <motion.div variants={fadeInUp}>
        <div className="relative overflow-hidden rounded-[32px] border border-[#F3D6E5] bg-gradient-to-r from-[#FFF0F5] via-[#FFF6FA] to-[#FFE4EE] p-6 lg:p-8 text-[#2B182B] shadow-[0_15px_40px_rgba(232,79,147,0.12)]">
          {/* Ambient Glow Elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-[#E84F93]/20 via-[#FF75A8]/15 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-gradient-to-tr from-[#E5C158]/20 via-[#C99635]/10 to-transparent blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4.5">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#F7E7CE] via-[#E5C158] to-[#C99635] text-white shadow-[0_10px_25px_rgba(201,150,53,0.35)] border border-white/60 shrink-0">
                <CalendarIcon size={30} className="drop-shadow-md text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E84F93]/30 bg-[#E84F93]/10 px-3.5 py-1 text-[11px] font-bold text-[#E84F93] backdrop-blur-md shadow-xs">
                  <Sparkles size={13} className="text-[#E84F93] animate-pulse" />
                  <span>{language === "vi" ? "Quản lý lịch làm việc" : "Salon Staff Rostering & Scheduling"}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#2B182B] mt-1.5 tracking-tight ">
                  {language === "vi" ? "Lịch làm việc" : "Staff Schedules"}
                </h1>
                <p className="mt-1 text-xs lg:text-sm text-[#8C6682] font-semibold leading-relaxed">
                  {t("manager.schedules.desc") || "Manage weekly shifts, workload capacity, and staff rosters in real-time"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOpenAddModal()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E84F93] via-[#EC4899] to-[#F43F5E] px-6 py-3 text-xs font-bold text-white shadow-[0_10px_25px_rgba(232,79,147,0.35)] hover:shadow-xl transition-all"
              >
                <Plus size={17} />
                <span>{language === "vi" ? "Thêm lịch làm việc" : "Add Shift Schedule"}</span>
              </motion.button>
            </div>
          </div>

          {/* 4 Premium SaaS Glassmorphism Metric Cards */}
          <div className="grid gap-3.5 pt-6 mt-6 border-t border-[#F3D6E5] grid-cols-2 md:grid-cols-4">
            <div className="rounded-2xl border border-[#F3D6E5] bg-white/80 p-4 backdrop-blur-md hover:border-[#E84F93] transition shadow-2xs group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{language === "vi" ? "Nhân viên" : "Salon Staff"}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E84F93]/15 text-[#E84F93] group-hover:scale-110 transition">
                  <Users size={16} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-[#2B182B]">{staffList.length}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[10px] text-[#8C6682] font-semibold">{language === "vi" ? "Nhân viên làm việc" : "Active Nail Artists"}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#F3D6E5] bg-white/80 p-4 backdrop-blur-md hover:border-[#10B981] transition shadow-2xs group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{language === "vi" ? "Ca làm việc hôm nay" : "Shifts Today"}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] group-hover:scale-110 transition">
                  <UserCheck size={16} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-[#059669]">{activeTodayCount}</p>
              <p className="text-[10px] text-[#8C6682] font-semibold mt-1">{language === "vi" ? "Nhân viên làm việc hôm nay" : "Staff On Duty Today"}</p>
            </div>

            <div className="rounded-2xl border border-[#F3D6E5] bg-white/80 p-4 backdrop-blur-md hover:border-[#6366F1] transition shadow-2xs group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{language === "vi" ? "Ca làm việc" : "Scheduled Hours"}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6366F1]/15 text-[#6366F1] group-hover:scale-110 transition">
                  <Clock size={16} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-[#4F46E5]">{totalWeeklyHours}h</p>
              <p className="text-[10px] text-[#8C6682] font-semibold mt-1">{language === "vi" ? "Tổng giờ làm việc" : "Total Hours This Week"}</p>
            </div>

            <div className="rounded-2xl border border-[#F3D6E5] bg-white/80 p-4 backdrop-blur-md hover:border-[#F59E0B] transition shadow-2xs group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{language === "vi" ? "Tuần làm việc" : "Week Span"}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] group-hover:scale-110 transition">
                  <CalendarIcon size={16} />
                </div>
              </div>
              <p className="mt-2 text-xs font-bold text-[#B45309] py-1">
                {selectedWeekStart.format("MMM D")} – {selectedWeekStart.add(6, "day").format("MMM D, YYYY")}
              </p>
              <p className="text-[10px] text-[#8C6682] font-semibold">{language === "vi" ? "Tuần làm việc" : "Week Span"}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {error && <Alert message="Error Loading Schedules" description={error} type="error" showIcon className="rounded-2xl shadow-xs" />}

      {/* Control Bar & Week Navigation */}
      <motion.div variants={fadeInUp} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-5 rounded-[24px] border border-[#F3E2EC] shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedWeekStart((prev) => prev.subtract(1, "week"))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3D6E5] text-[#9E8497] hover:bg-[#FFF0F5] hover:text-[#E84F93] transition shadow-2xs"
            title="Previous Week"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setSelectedWeekStart(dayjs().startOf("week").add(1, "day"))}
            className="rounded-xl border border-[#F3D6E5] bg-gradient-to-r from-[#FFF0F5] to-[#FFE4EE] px-4 py-2 text-xs font-bold text-[#E84F93] hover:from-[#FFE4EE] hover:to-[#FFD6E7] transition shadow-2xs flex items-center gap-2"
          >
            <CalendarIcon size={14} />
            <span>{language === "vi" ? "Tuần này" : "Current Week"}</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedWeekStart((prev) => prev.add(1, "week"))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3D6E5] text-[#9E8497] hover:bg-[#FFF0F5] hover:text-[#E84F93] transition shadow-2xs"
            title="Next Week"
          >
            <ChevronRight size={18} />
          </button>

          <div className="ml-3 pl-3 border-l border-[#F3E2EC] flex items-center gap-2.5">
            <DatePicker
              value={selectedWeekStart}
              onChange={(d) => {
                if (d) {
                  // Jump to Monday of selected week
                  const monday = d.day() === 0 ? d.subtract(6, "day") : d.startOf("week").add(1, "day");
                  setSelectedWeekStart(monday);
                }
              }}
              format="[Week of] MMM D, YYYY"
              allowClear={false}
              className="h-10 rounded-xl border-[#F3D7E4] bg-[#FFFDFE] text-xs font-bold text-[#2B182B] hover:border-[#E84F93] focus:border-[#E84F93] transition"
            />
            <span className="text-xs font-bold text-[#2B182B] hidden xl:inline-block">
              ({selectedWeekStart.format("MMMM D")} – {selectedWeekStart.add(6, "day").format("MMMM D, YYYY")})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Emergency Off Duty Button (BR-05) */}
          <button
            type="button"
            onClick={() => {
              const defaultArtist = staffList[0] || null;
              setSelectedEmergencyArtist(defaultArtist);
              setIsEmergencyOffModalOpen(true);
            }}
            className="h-10 rounded-xl border border-[#FECDD3] bg-gradient-to-r from-[#FEF2F2] to-[#FEE2E2] px-3.5 text-xs font-bold text-[#E11D48] hover:bg-[#FEE2E2] transition shadow-2xs flex items-center gap-2"
            title="Manager trigger Emergency Off for artist leave"
          >
            <ShieldAlert size={15} />
            <span>{t("manager.schedules.emergencyOff") || "Emergency Off"}</span>
          </button>

          {/* Toggle Shift Times Button */}
          <button
            type="button"
            onClick={() => setShowShiftTimes((prev) => !prev)}
            className={`h-10 rounded-xl border px-3.5 text-xs font-bold transition flex items-center gap-2 ${showShiftTimes
              ? "border-[#E84F93] bg-[#FFF0F5] text-[#E84F93] shadow-2xs"
              : "border-[#F3D7E4] bg-white text-[#9E8497] hover:border-[#F0B7CF]"
              }`}
            title="Toggle working time visibility for staff shifts"
          >
            {showShiftTimes ? <Eye size={15} /> : <EyeOff size={15} />}
            <span>{showShiftTimes ? language === 'vi' ? 'Giờ làm việc: Hiển thị' : 'Shift Times: Visible' : language === 'vi' ? 'Giờ làm việc: Ẩn' : 'Shift Times: Hidden'}</span>
          </button>

          <div className="relative min-w-[240px]">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8497]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm thợ nail...' : 'Search staff artist...'}
              className="h-10 w-full rounded-xl border border-[#F3D7E4] bg-[#FFFDFE] pl-10 pr-4 text-xs font-medium text-[#2B182B] outline-none hover:border-[#F0B7CF] focus:border-[#E84F93] transition"
            />
          </div>
        </div>
      </motion.div>

      {/* Day Focus Filter Bar */}
      <motion.div variants={fadeInUp} className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold uppercase text-[#9E8497] tracking-wider mr-1 flex items-center gap-1.5 shrink-0">
          <Filter size={13} className="text-[#E84F93]" />
          <span>{language === 'vi' ? 'Ngày làm việc:' : 'Focus Day:'}</span>
        </span>
        <button
          type="button"
          onClick={() => setSelectedDayKey("ALL")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${selectedDayKey === "ALL"
            ? "bg-[#2B182B] text-white shadow-xs"
            : "bg-white text-[#8C6682] border border-[#F3D6E5] hover:border-[#E84F93]"
            }`}
        >
          {language === 'vi' ? 'Cả tuần' : 'All 7 Days'}
        </button>

        {weekDays.map((d) => {
          const dayKey = d.format("ddd").toUpperCase();
          const isToday = d.isSame(dayjs(), "day");
          const isSelected = selectedDayKey === dayKey;

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => setSelectedDayKey(isSelected ? "ALL" : dayKey)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${isSelected
                ? "bg-gradient-to-r from-[#E84F93] to-[#F43F5E] text-white shadow-xs"
                : isToday
                  ? "bg-[#FFF0F5] text-[#E84F93] border border-[#E84F93]/30"
                  : "bg-white text-[#8C6682] border border-[#F3D6E5] hover:border-[#E84F93]"
                }`}
            >
              <span>{d.format("ddd")} {d.format("MMM D")}</span>
              {isToday && (
                <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[#E84F93]"}`} />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Staff Schedules Grid Table */}
      {isLoading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-[28px] bg-white border border-[#F3E2EC]">
          <Spin size="large" tip="Loading staff schedules..." />
        </div>
      ) : (
        <motion.div variants={fadeInUp} className="overflow-x-auto rounded-[30px] border border-[#F3E2EC] bg-white shadow-xs">
          <table className="w-full min-w-[1000px] table-fixed border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#FFF5F8] via-[#FFF9FB] to-[#FFF5F8] text-xs font-bold text-[#2B182B] border-b border-[#F3E2EC]">
                <th className="w-64 p-4.5 text-left border-r border-[#F3E2EC]">
                  <div className="flex items-center gap-2 text-[#2B182B] font-bold uppercase text-[11px] tracking-wider">
                    <Users size={15} className="text-[#E84F93]" />
                    <span>{language === 'vi' ? 'Thợ nail' : 'Staff Artist'} ({filteredStaff.length})</span>
                  </div>
                </th>
                {displayedWeekDays.map((d) => {
                  const isToday = d.isSame(dayjs(), "day");
                  const dayKey = d.format("ddd").toUpperCase();
                  const isSelected = selectedDayKey === dayKey;

                  return (
                    <th
                      key={d.format("YYYY-MM-DD")}
                      onClick={() => setSelectedDayKey(isSelected ? "ALL" : dayKey)}
                      className={`p-4 text-center border-r border-[#F3E2EC] last:border-r-0 transition cursor-pointer select-none ${isSelected
                        ? "bg-[#FFF0F5] border-b-2 border-b-[#E84F93]"
                        : isToday
                          ? "bg-gradient-to-b from-[#FFF0F5] via-[#FFE4EE] to-[#FFF0F5] border-b-2 border-b-[#E84F93]"
                          : "hover:bg-[#FFF5F8]"
                        }`}
                      title="Click to focus on this day"
                    >
                      <p className={`text-[10px] uppercase font-bold tracking-widest ${isToday || isSelected ? "text-[#E84F93]" : "text-[#9E8497]"}`}>
                        {d.format("ddd")}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span className={`text-base font-bold ${isToday || isSelected ? "text-[#E84F93]" : "text-[#2B182B]"}`}>
                          {d.format("MMM D")}
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-gradient-to-r from-[#E84F93] to-[#F43F5E] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-2xs">
                            {language === 'vi' ? 'Hôm nay' : 'Today'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={displayedWeekDays.length + 1} className="py-20 text-center text-xs text-[#9E8497]">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0F5] text-[#E84F93]">
                        <Users size={32} />
                      </div>
                      <p className="font-bold text-sm text-[#5C4559]">{language === 'vi' ? 'Không tìm thấy thợ' : 'No staff artists found'}</p>
                      <p className="text-xs text-[#A88A9F]">{language === 'vi' ? 'Thử tìm kiếm tên khác hoặc thêm thợ vào tiệm.' : 'Try searching another name or add staff to this salon.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  return (
                    <tr key={staff.id} className="border-b border-[#F7E7EE] last:border-b-0 hover:bg-[#FFFDFE] transition">
                      {/* Staff Profile Cell */}
                      <td className="p-4 align-middle border-r border-[#F3E2EC] bg-[#FFFCFD] group/staff">
                        <div className="flex items-center gap-3">
                          <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${staff.gradient} text-xs font-bold text-white shadow-sm ring-2 ${staff.ring} border border-white/60`}>
                            {staff.initials}
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#10B981]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#2B182B] truncate">{staff.name}</p>
                            <p className="text-[10px] text-[#9E8497] font-semibold truncate">{staff.phone || staff.specialty}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmergencyArtist(staff);
                              setIsEmergencyOffModalOpen(true);
                            }}
                            title={`Kích hoạt Nghỉ Khẩn Cấp cho ${staff.name}`}
                            className="opacity-0 group-hover/staff:opacity-100 p-1.5 rounded-lg text-[#E11D48] hover:bg-[#FEF2F2] hover:text-[#991B1B] transition cursor-pointer shrink-0"
                          >
                            <ShieldAlert size={15} />
                          </button>
                        </div>
                      </td>

                      {/* Displayed Days Shifts Cells */}
                      {displayedWeekDays.map((day) => {
                        const dateKey = day.format("YYYY-MM-DD");
                        const cellKey = `${staff.id}_${dateKey}`;
                        const shifts = scheduleMatrix.get(cellKey) || [];
                        const isToday = day.isSame(dayjs(), "day");

                        return (
                          <td
                            key={dateKey}
                            className={`p-2.5 align-middle border-r border-[#F3E2EC] last:border-r-0 transition ${isToday ? "bg-[#FFF9FB]" : ""
                              }`}
                          >
                            <div className="min-h-[72px] space-y-2 flex flex-col justify-center">
                              {shifts.length === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddModal(staff.id, day)}
                                  className="w-full h-[65px] rounded-2xl border border-dashed border-transparent hover:border-[#F3D6E5] hover:bg-[#FFF0F5]/70 text-transparent hover:text-[#E84F93] transition flex flex-col items-center justify-center gap-1 group cursor-pointer"
                                >
                                  <Plus size={15} className="opacity-0 group-hover:opacity-100 transition text-[#E84F93]" />
                                  <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition">
                                    + Assign Shift
                                  </span>
                                </button>
                              ) : (
                                shifts.map((s) => {
                                  const theme = getShiftTheme(s.shiftStart, s.shiftEnd);
                                  const IconComponent = theme.icon;

                                  return (
                                    <motion.div
                                      key={s.scheduleId || s.id}
                                      whileHover={{ scale: 1.03 }}
                                      className={`group relative rounded-2xl border ${theme.border} ${theme.bg} p-2.5 text-xs ${theme.text} shadow-2xs hover:shadow-md transition`}
                                    >
                                      {showShiftTimes && (
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="flex items-center gap-1.5">
                                            <span className={`h-2 w-2 rounded-full ${theme.dot} animate-pulse`} />
                                            <span className="text-[11px] font-bold tracking-tight">
                                              {formatTimeSpan(s.shiftStart)} – {formatTimeSpan(s.shiftEnd)}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5">
                                        <span className={`inline-flex items-center gap-1 rounded-md ${theme.badgeBg} px-2 py-0.5 text-[9px] font-bold`}>
                                          <IconComponent size={10} />
                                          {theme.label}
                                        </span>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                          <Tooltip title="Edit shift">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditModal(s)}
                                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-[#2B182B] hover:bg-white hover:text-[#E84F93] shadow-2xs transition"
                                            >
                                              <Edit3 size={11} />
                                            </button>
                                          </Tooltip>
                                          <Tooltip title="Delete shift">
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteScheduleClick(s.scheduleId || s.id)}
                                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-[#B91C1C] hover:bg-white hover:text-[#991B1B] shadow-2xs transition"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* --- Ultra Luxury Add Shift Modal --- */}
      <Modal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        centered
        width={520}
        styles={{ content: { padding: 0, borderRadius: 32, overflow: "hidden", boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)" } }}
      >
        <div className="bg-white font-sans">
          {/* Luxury Rose Gold Header */}
          <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FFF6FA] to-[#FFF0F5] p-6 flex items-center justify-between border-b border-[#F3D6E5]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E84F93] to-[#F43F5E] text-white shadow-md shadow-[#E84F93]/30">
                <Plus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2B182B]  tracking-tight">{language === 'vi' ? "Thêm ca làm việc" : "Add Staff Work Shift"}</h3>
                <p className="text-xs text-[#9E8497] font-semibold">{language === 'vi' ? "Lịch làm việc" : "Add shift schedule to salon nail artist"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#F3D6E5] text-[#9E8497] hover:bg-[#FFF0F5] hover:text-[#E84F93] shadow-2xs transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5 text-xs font-bold text-[#2B182B]">
            {/* Quick Shift Presets */}
            <div>
              <label className="block mb-2 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">
                {language === 'vi' ? "Chọn ca làm việc" : "Select Shift Preset"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("MORNING", "08:00", "16:00")}
                  className={`rounded-2xl border p-2.5 text-left transition flex flex-col justify-between ${activePreset === "MORNING"
                    ? "border-[#3B82F6] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] text-[#1E40AF] ring-2 ring-[#3B82F6]/30 shadow-xs"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#93C5FD] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1">☀️ {language === 'vi' ? "Buổi sáng" : "Morning"}</span>
                    {activePreset === "MORNING" && <Check size={13} className="text-[#3B82F6]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 opacity-80">08:00 AM - 04:00 PM</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("EVENING", "12:00", "20:00")}
                  className={`rounded-2xl border p-2.5 text-left transition flex flex-col justify-between ${activePreset === "EVENING"
                    ? "border-[#F59E0B] bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] text-[#92400E] ring-2 ring-[#F59E0B]/30 shadow-xs"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#FDE68A] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1">🌙 {language === 'vi' ? "Buổi tối" : "Evening"}</span>
                    {activePreset === "EVENING" && <Check size={13} className="text-[#F59E0B]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 opacity-80">12:00 PM - 08:00 PM</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("FULLDAY", "08:00", "23:30")}
                  className={`rounded-2xl border p-2.5 text-left transition flex flex-col justify-between ${activePreset === "FULLDAY"
                    ? "border-[#10B981] bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] text-[#065F46] ring-2 ring-[#10B981]/30 shadow-xs"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#86EFAC] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1">⭐ {language === 'vi' ? "Cả ngày" : "Full Day"}</span>
                    {activePreset === "FULLDAY" && <Check size={13} className="text-[#10B981]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 opacity-80">08:00 AM - 11:30 PM</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("SHORT", "08:00", "09:00")}
                  className={`rounded-2xl border p-2.5 text-left transition flex flex-col justify-between ${activePreset === "SHORT"
                    ? "border-[#8B5CF6] bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] text-[#5B21B6] ring-2 ring-[#8B5CF6]/30 shadow-xs"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#C4B5FD] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1"><Zap size={12} /> {language === 'vi' ? "Ngắn" : "Short"}</span>
                    {activePreset === "SHORT" && <Check size={13} className="text-[#8B5CF6]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 opacity-80">08:00 AM - 09:00 AM</span>
                </button>
              </div>
            </div>

            {/* Select Staff Artist with Rich Options */}
            <div>
              <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">{language === 'vi' ? "Chọn thợ làm móng" : "Select Staff Artist"}</label>
              <Select
                value={formArtistId}
                onChange={(val) => setFormArtistId(val)}
                className="w-full h-12"
                placeholder={language === 'vi' ? "Chọn thợ làm móng" : "Select Staff Artist"}
                options={staffList.map((s) => ({
                  label: (
                    <div className="flex items-center gap-2.5 py-0.5">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${s.gradient} text-[10px] font-bold text-white shrink-0`}>
                        {s.initials}
                      </div>
                      <span className="font-bold text-[#2B182B] text-xs">{s.name}</span>
                      {s.phone && <span className="text-[10px] text-[#9E8497] font-semibold">({s.phone})</span>}
                    </div>
                  ),
                  value: s.id,
                }))}
              />
            </div>

            <div>
              <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">{language === 'vi' ? "Ngày làm việc" : "Work Date"}</label>
              <DatePicker
                value={formWorkDate}
                onChange={(d) => d && setFormWorkDate(d)}
                format="DD/MM/YYYY"
                className="w-full h-12 border-[#F3D7E4] rounded-xl text-xs font-bold"
              />
            </div>

            {/* Custom Clean Time Selects */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">{language === 'vi' ? "Giờ bắt đầu" : "Shift Start Time"}</label>
                <Select
                  value={formStartTimeStr}
                  onChange={(val) => setFormStartTimeStr(val)}
                  className="w-full h-12"
                  options={TIME_OPTIONS}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">{language === 'vi' ? "Giờ kết thúc" : "Shift End Time"}</label>
                <Select
                  value={formEndTimeStr}
                  onChange={(val) => setFormEndTimeStr(val)}
                  className="w-full h-12"
                  options={TIME_OPTIONS}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">{language === 'vi' ? "Trạng thái ca làm" : "Shift Status"}</label>
              <Select
                value={formStatus}
                onChange={(val) => setFormStatus(val)}
                className="w-full h-12"
                options={[
                  { label: "Active", value: "Active" },
                  { label: "Available", value: "Available" },
                ]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#F3E2EC]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full border border-[#F3D7E4] px-6 py-3 text-xs font-bold text-[#2B182B] hover:bg-[#FAF0F5] transition"
              >
                {language === 'vi' ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleCreateScheduleSubmit}
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-[#E84F93] via-[#EC4899] to-[#F43F5E] px-7 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition"
              >
                {isSubmitting ? (language === 'vi' ? "Đang lưu..." : "Saving...") : (language === 'vi' ? "Tạo lịch làm việc" : "Create Shift Schedule")}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* --- Ultra Luxury Edit Shift Modal --- */}
      <Modal
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        centered
        width={520}
        styles={{ content: { padding: 0, borderRadius: 32, overflow: "hidden", boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)" } }}
      >
        <div className="bg-white font-sans">
          {/* Luxury Rose Gold Header */}
          <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FFF6FA] to-[#FFF0F5] p-6 flex items-center justify-between border-b border-[#F3D6E5]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E84F93] to-[#F43F5E] text-white shadow-md shadow-[#E84F93]/30">
                <Edit3 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2B182B]  tracking-tight">Edit Staff Work Shift</h3>
                <p className="text-xs text-[#9E8497] font-semibold">Modify shift details or hours</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#F3D6E5] text-[#9E8497] hover:bg-[#FFF0F5] hover:text-[#E84F93] shadow-2xs transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5 text-xs font-bold text-[#2B182B]">
            {/* Quick Shift Presets */}
            <div>
              <label className="block mb-2 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">
                Select Shift Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("MORNING", "08:00", "16:00")}
                  className={`rounded-2xl border p-2.5 text-left transition flex flex-col justify-between ${activePreset === "MORNING"
                    ? "border-[#3B82F6] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] text-[#1E40AF] ring-2 ring-[#3B82F6]/30 shadow-xs"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#93C5FD] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1">☀️ Morning</span>
                    {activePreset === "MORNING" && <Check size={13} className="text-[#3B82F6]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 opacity-80">08:00 AM - 04:00 PM</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("EVENING", "12:00", "20:00")}
                  className={`rounded-2xl border p-2.5 text-left transition flex flex-col justify-between ${activePreset === "EVENING"
                    ? "border-[#F59E0B] bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] text-[#92400E] ring-2 ring-[#F59E0B]/30 shadow-xs"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#FDE68A] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1">🌙 Evening</span>
                    {activePreset === "EVENING" && <Check size={13} className="text-[#F59E0B]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 opacity-80">12:00 PM - 08:00 PM</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("FULLDAY", "08:00", "23:30")}
                  className={`rounded-2xl border p-2.5 text-left transition flex flex-col justify-between ${activePreset === "FULLDAY"
                    ? "border-[#10B981] bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] text-[#065F46] ring-2 ring-[#10B981]/30 shadow-xs"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#86EFAC] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1">⭐ Full Day</span>
                    {activePreset === "FULLDAY" && <Check size={13} className="text-[#10B981]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 opacity-80">08:00 AM - 11:30 PM</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("SHORT", "08:00", "09:00")}
                  className={`rounded-2xl border p-2.5 text-left transition flex flex-col justify-between ${activePreset === "SHORT"
                    ? "border-[#8B5CF6] bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] text-[#5B21B6] ring-2 ring-[#8B5CF6]/30 shadow-xs"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#C4B5FD] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1"><Zap size={12} /> Short</span>
                    {activePreset === "SHORT" && <Check size={13} className="text-[#8B5CF6]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 opacity-80">08:00 AM - 09:00 AM</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">Staff Artist</label>
              <Select
                value={formArtistId}
                onChange={(val) => setFormArtistId(val)}
                className="w-full h-12"
                options={staffList.map((s) => ({
                  label: (
                    <div className="flex items-center gap-2.5 py-0.5">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${s.gradient} text-[10px] font-bold text-white shrink-0`}>
                        {s.initials}
                      </div>
                      <span className="font-bold text-[#2B182B] text-xs">{s.name}</span>
                      {s.phone && <span className="text-[10px] text-[#9E8497] font-semibold">({s.phone})</span>}
                    </div>
                  ),
                  value: s.id,
                }))}
              />
            </div>

            <div>
              <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">Work Date</label>
              <DatePicker
                value={formWorkDate}
                onChange={(d) => d && setFormWorkDate(d)}
                format="DD/MM/YYYY"
                className="w-full h-12 border-[#F3D7E4] rounded-xl text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">Shift Start Time</label>
                <Select
                  value={formStartTimeStr}
                  onChange={(val) => setFormStartTimeStr(val)}
                  className="w-full h-12"
                  options={TIME_OPTIONS}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">Shift End Time</label>
                <Select
                  value={formEndTimeStr}
                  onChange={(val) => setFormEndTimeStr(val)}
                  className="w-full h-12"
                  options={TIME_OPTIONS}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-[#9E8497] uppercase text-[10px] tracking-widest font-bold">Shift Status</label>
              <Select
                value={formStatus}
                onChange={(val) => setFormStatus(val)}
                className="w-full h-12"
                options={[
                  { label: "Active", value: "Active" },
                  { label: "Available", value: "Available" },
                ]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#F3E2EC]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full border border-[#F3D7E4] px-6 py-3 text-xs font-bold text-[#2B182B] hover:bg-[#FAF0F5] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditScheduleSubmit}
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-[#E84F93] via-[#EC4899] to-[#F43F5E] px-7 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition"
              >
                {isSubmitting ? "Updating..." : "Update Shift Schedule"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Emergency Off Modal (BR-05) */}
      <EmergencyOffModal
        open={isEmergencyOffModalOpen}
        onClose={() => setIsEmergencyOffModalOpen(false)}
        artist={selectedEmergencyArtist}
        artists={staffList}
        onSuccess={() => loadData()}
      />
    </motion.section>
  );
}
