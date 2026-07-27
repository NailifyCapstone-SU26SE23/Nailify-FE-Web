import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lock,
  Mail,
  Phone,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Search,
  AlertCircle,
  Calendar,
  X,
  Sparkles,
  Clock,
  UserCog,
} from "lucide-react";
import { Modal, Spin, Alert, DatePicker, Drawer, message, Select, TimePicker as AntdTimePicker } from "antd";
import { Link } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES, getManagerStaffUpdateRoute } from "../../../../shared/constants/routes";
import {
  QUICK_ACTIONS,
  SCHEDULE_DAY_KEYS,
  SCHEDULE_STATUS_STYLES,
  STAFF_FILTER_TABS,
  STAFF_ON_LEAVE,
  STAFF_STATUS_STYLES,
  filterStaffByStatus,
  getStaffInitials,
} from "../services/mockStaffArtists";
import { fetchBookingsBySalonId } from "../../bookings/services/bookingsService";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import {
  fetchNailArtists,
  fetchNailArtistById,
  fetchSchedules,
  fetchNailArtistSkills,
  fetchArtistSchedules,
  fetchSchedulesBySalonId,
  createSchedule,
  getSalonId,
  getSalonIdAsync,
} from "../services/nailArtistsService";
import { Pagination } from "../../../../shared/components/common/Pagination.jsx";
import { TimePicker } from "../../../../shared/components/ui/TimePicker.jsx";
import { StaffAvatar } from "../../../../shared/components/common/StaffAvatar.jsx";
import dayjs from "dayjs";

// Import separated modals
import { EditScheduleModal } from "../components/EditScheduleModal";
import { TransferStaffModal } from "../components/TransferStaffModal";
import { StaffDetailModal } from "../components/StaffDetailModal";


const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Status metadata for the Create Shift modal's segmented control
const SHIFT_STATUS_META = {
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

const SHIFT_DURATION_PRESETS = [
  { label: "4h", hours: 4 },
  { label: "6h", hours: 6 },
  { label: "8h", hours: 8 },
];

// Guard rail: the create-shift endpoint only accepts one date per call, so a
// date range is expanded into one request per day. Cap the range so a
// misclick (e.g. picking a whole year) can't fire off hundreds of requests.
const MAX_BULK_SHIFT_DAYS = 31;
const HIGH_RATING_THRESHOLD = 4.5;

function getBookingArtistId(booking) {
  const artistId = booking?.staffId || booking?.nailArtistId || booking?.staffArtistId || booking?.artistId;
  return artistId ? String(artistId) : null;
}

function isCompletedBooking(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "completed" || normalized === "servicecompleted";
}

function getBookingRating(booking) {
  const rawRating =
    booking?.rating ??
    booking?.serviceRating ??
    booking?.reviewRating ??
    booking?.customerRating ??
    booking?.feedbackRating ??
    booking?.artistRating;
  const parsed = Number(rawRating);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseBookingDate(booking) {
  const rawDate = booking?.bookingDate || booking?.createdAt;
  return rawDate ? dayjs(rawDate) : null;
}

function buildArtistBookingStats(bookings = []) {
  const today = dayjs().startOf("day");
  const monthStart = dayjs().startOf("month");
  const statsMap = new Map();

  bookings.forEach((booking) => {
    const artistId = getBookingArtistId(booking);
    if (!artistId) return;

    if (!statsMap.has(artistId)) {
      statsMap.set(artistId, {
        artistId,
        todayCount: 0,
        monthCompleted: 0,
        monthRevenue: 0,
        totalCompleted: 0,
        ratedCount: 0,
        ratingSum: 0,
        highRatedCount: 0,
      });
    }

    const stats = statsMap.get(artistId);
    const bookingDate = parseBookingDate(booking);
    const completed = isCompletedBooking(booking.status);
    const totalPrice = Number(booking.totalPrice) || 0;
    const bookingRating = getBookingRating(booking);

    if (completed) {
      stats.totalCompleted += 1;

      if (bookingDate?.isSame(today, "day")) {
        stats.todayCount += 1;
      }

      if (bookingDate && (bookingDate.isSame(monthStart, "day") || bookingDate.isAfter(monthStart))) {
        stats.monthCompleted += 1;
        stats.monthRevenue += totalPrice;
      }
    }

    if (bookingRating !== null) {
      stats.ratedCount += 1;
      stats.ratingSum += bookingRating;
      if (bookingRating >= HIGH_RATING_THRESHOLD) {
        stats.highRatedCount += 1;
      }
    }
  });

  return statsMap;
}

function formatCompactRevenue(amount) {
  const value = Number(amount) || 0;
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return formatCurrency(value);
}

function buildPerformanceInsights(staffArtists = [], bookings = []) {
  const bookingStats = buildArtistBookingStats(bookings);
  const performers = staffArtists.map((staff) => {
    const artistId = String(staff.id);
    const stats = bookingStats.get(artistId) || {
      todayCount: 0,
      monthCompleted: 0,
      monthRevenue: 0,
      totalCompleted: 0,
      ratedCount: 0,
      ratingSum: 0,
      highRatedCount: 0,
    };

    const bookingAvgRating = stats.ratedCount > 0
      ? stats.ratingSum / stats.ratedCount
      : null;
    const effectiveRating = bookingAvgRating ?? (Number(staff.rating) || 0);
    const satisfaction = stats.ratedCount > 0
      ? `${Math.round((stats.highRatedCount / stats.ratedCount) * 100)}%`
      : "—";

    return {
      id: artistId,
      name: staff.name,
      role: staff.role,
      avatarTone: staff.avatarTone,
      rating: effectiveRating,
      completedCount: stats.monthCompleted,
      stats: {
        today: stats.todayCount,
        month: stats.monthCompleted,
        revenue: formatCompactRevenue(stats.monthRevenue),
        monthRevenue: stats.monthRevenue,
      },
      metrics: {
        completed: String(stats.monthCompleted),
        rating: effectiveRating.toFixed(1),
        revenue: formatCurrency(stats.monthRevenue),
        satisfaction,
      },
    };
  });

  const sortByCompletedDesc = (a, b) => {
    if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
    return a.name.localeCompare(b.name);
  };

  const sortByCompletedAsc = (a, b) => {
    if (a.completedCount !== b.completedCount) return a.completedCount - b.completedCount;
    return a.name.localeCompare(b.name);
  };

  const mostCompletedStaff = [...performers].sort(sortByCompletedDesc)[0] || null;

  const leastCompletedStaff = [...performers]
    .sort(sortByCompletedAsc)
    .slice(0, 2)
    .map((performer) => ({
      name: performer.name,
      completed: String(performer.completedCount),
    }));

  const topCompletedPerformers = [...performers]
    .sort(sortByCompletedDesc)
    .slice(0, 3);

  return {
    performers,
    mostCompletedStaff: mostCompletedStaff
      ? {
        name: mostCompletedStaff.name,
        completed: String(mostCompletedStaff.completedCount),
      }
      : null,
    leastCompletedStaff,
    topCompletedPerformers,
    completedServices: performers.reduce((sum, performer) => sum + performer.stats.month, 0),
  };
}

// Expand an inclusive [start, end] dayjs range into an array of dayjs dates,
// one per day. Assumes start <= end.
function getDatesInRange(start, end) {
  const totalDays = end.startOf("day").diff(start.startOf("day"), "day");
  const dates = [];
  for (let i = 0; i <= totalDays; i += 1) {
    dates.push(start.add(i, "day"));
  }
  return dates;
}

const DAYS_OF_WEEK = [
  { key: "Mon", label: "Monday", offset: 0 },
  { key: "Tue", label: "Tuesday", offset: 1 },
  { key: "Wed", label: "Wednesday", offset: 2 },
  { key: "Thu", label: "Thursday", offset: 3 },
  { key: "Fri", label: "Friday", offset: 4 },
  { key: "Sat", label: "Saturday", offset: 5 },
  { key: "Sun", label: "Sunday", offset: 6 },
];

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

function PremiumCard({ className = "", children, noHover = false }) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-[#f1e7ed] bg-white shadow-[0_8px_30px_-12px_rgba(45,27,53,0.08)] transition-all duration-300 ease-out ${!noHover ? "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(45,27,53,0.12)]" : ""} ${className}`}
    >
      {children}
    </article>
  );
}

PremiumCard.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  noHover: PropTypes.bool,
};

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[#2d1b35] tracking-tight">{title}</h3>
      {subtitle ? <p className="mt-1.5 text-xs text-[#a88a9f] leading-relaxed">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f]">{label}</p>
      <div className="mt-2 text-sm font-medium text-[#2d1b35] break-all">{children}</div>
    </div>
  );
}

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function StatusPill({ status }) {
  const isActive = status === "Active";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${isActive ? "bg-[#eaf9ee] text-[#2fa25f] border-transparent" : "bg-[#fff0dd] text-[#db8520] border-transparent"}`}>
      {status}
    </span>
  );
}

StatusPill.propTypes = {
  status: PropTypes.string.isRequired,
};

function StaffArtistCard({ staff, onOpenDrawer }) {
  // Extract skill names from skill objects
  const skillNames = staff.skills.map(skill => skill.skillTypeName || skill.name || "Skill");
  const visibleSkills = skillNames.slice(0, 2);
  const extraSkillsCount = skillNames.length - visibleSkills.length;

  const handleCardClick = () => {
    onOpenDrawer(staff.id);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenDrawer(staff.id);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${staff.name}`}
      className="group flex h-full min-w-0 cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:border-[#E84F93]/40 hover:shadow-md focus:outline-none"
    >
      <div className="flex items-start gap-4">
        {/* Clean Circular Avatar with Green Status Dot */}
        <div className="relative shrink-0">
          <StaffAvatar
            staff={{ ...staff, initials: getStaffInitials(staff.name) }}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs"
            fallbackClassName={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${staff.avatarTone} text-base font-black text-white ring-2 ring-slate-100 shadow-2xs`}
          />
          {staff.status === "Active" && (
            <span
              className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Active Now"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-extrabold leading-snug text-slate-900 font-serif">
              {staff.name}
            </h3>
            <StatusPill status={staff.status} />
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{staff.role}</p>

          {/* Clean Rating Stars with Dark Text */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-0.5">
            <Star size={13} fill="#EAB308" className="text-amber-500 shrink-0" />
            <span className="text-xs font-extrabold text-slate-900">
              {staff.rating.toFixed(1)} <span className="text-slate-400 font-normal">/ 5.0</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pastel Skill Pills */}
      <div className="mt-4 flex min-h-[28px] flex-wrap gap-1.5">
        {visibleSkills.length > 0 ? (
          <>
            {visibleSkills.map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-pink-50 text-[#E84F93] border border-[#F3D6E5] px-3 py-1 text-[11px] font-bold"
              >
                {skill}
              </span>
            ))}
            {extraSkillsCount > 0 && (
              <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-bold">
                +{extraSkillsCount}
              </span>
            )}
          </>
        ) : (
          <span className="rounded-full bg-slate-50 border border-dashed border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-400">
            Skills not assigned
          </span>
        )}
      </div>

      {/* Mini Performance Stats Bar */}
      <div className="mt-4 flex divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
        {[
          [Clock3, staff.stats.today, "Today"],
          [CalendarDays, staff.stats.month, "This Month"],
          [TrendingUp, staff.stats.revenue, "Revenue"],
        ].map(([Icon, value, label]) => (
          <div key={label} className="flex flex-1 flex-col items-center px-1">
            <Icon size={13} className="mb-0.5 text-[#E84F93]" />
            <p className="text-xs font-extrabold text-slate-900">{value}</p>
            <p className="text-[10px] font-medium text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Action Button: Clean Secondary Outline Button with Icon */}
      <div className="mt-auto pt-4">
        <Link
          to={getManagerStaffUpdateRoute(staff.id)}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 px-4 text-xs font-bold text-slate-700 hover:border-[#E84F93] hover:text-[#E84F93] hover:bg-[#FFF0F5]/50 transition-all shadow-2xs"
        >
          <UserCog size={14} />
          <span>Edit Profile</span>
        </Link>
      </div>
    </motion.article>
  );
}

StaffArtistCard.propTypes = {
  staff: PropTypes.shape({
    avatarTone: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
    name: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    skills: PropTypes.arrayOf(PropTypes.object).isRequired,
    stats: PropTypes.shape({
      month: PropTypes.number.isRequired,
      revenue: PropTypes.string.isRequired,
      today: PropTypes.number.isRequired,
    }).isRequired,
    status: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onOpenDrawer: PropTypes.func.isRequired,
};





function InsightStrip({ mostCompletedStaff, leastCompletedStaff, loadingBookings }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <PremiumCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffedd5] to-[#d69e2e] text-white">
            <Star size={18} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a88a9f]">
              Most Completed
            </p>
            {loadingBookings ? (
              <p className="text-sm text-[#a88a9f]">Loading...</p>
            ) : mostCompletedStaff ? (
              <p className="truncate text-sm font-bold text-[#2d1b35]">{mostCompletedStaff.name}</p>
            ) : (
              <p className="text-sm text-[#a88a9f]">No data yet</p>
            )}
          </div>
          <div className="text-right">
            {loadingBookings ? (
              <p className="text-sm text-[#a88a9f]">—</p>
            ) : mostCompletedStaff ? (
              <>
                <p className="text-sm font-bold text-[#ea4f93]">{mostCompletedStaff.completed}</p>
                <p className="text-[10px] text-[#a88a9f]">completed bookings</p>
              </>
            ) : (
              <p className="text-[10px] text-[#a88a9f]">This month</p>
            )}
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0f6] text-[#ea4f93]">
            <Clock3 size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#2d1b35]">Staff On Leave</p>
            <p className="text-[11px] text-[#a88a9f]">{STAFF_ON_LEAVE.length} upcoming</p>
          </div>
        </div>
        <div className="space-y-2">
          {STAFF_ON_LEAVE.slice(0, 2).map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="truncate font-medium text-[#2d1b35]">{item.name}</span>
              <span className="shrink-0 rounded-md bg-[#ffe6ec] px-2 py-0.5 text-[10px] font-bold text-[#e1447f]">
                {item.days}
              </span>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0f6] text-[#ea4f93]">
            <AlertCircle size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#2d1b35]">Least Completed</p>
            <p className="text-[11px] text-[#a88a9f]">Fewest bookings this month</p>
          </div>
        </div>
        <div className="space-y-2">
          {loadingBookings ? (
            <p className="text-[12px] text-[#a88a9f]">Loading...</p>
          ) : leastCompletedStaff.length > 0 ? (
            leastCompletedStaff.map((staff) => (
              <div key={staff.name} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="truncate font-medium text-[#2d1b35]">{staff.name}</span>
                <span className="shrink-0 font-bold text-[#ea4f93]">{staff.completed}</span>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-[#a88a9f]">No staff data available</p>
          )}
        </div>
      </PremiumCard>
    </div>
  );
}

InsightStrip.propTypes = {
  mostCompletedStaff: PropTypes.shape({
    name: PropTypes.string.isRequired,
    completed: PropTypes.string.isRequired,
  }),
  leastCompletedStaff: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      completed: PropTypes.string.isRequired,
    }),
  ).isRequired,
  loadingBookings: PropTypes.bool.isRequired,
};

function pickField(entry, keys) {
  for (const key of keys) {
    if (entry?.[key] !== undefined && entry[key] !== null && entry[key] !== "") {
      return entry[key];
    }
  }
  return null;
}

function mapSchedulesToTimeline(artists, schedules, startOfWeekDate) {
  const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const extractDateStr = (val) => {
    if (!val) return "";
    const str = String(val);
    if (str.length >= 10 && str[4] === '-' && str[7] === '-') {
      return str.slice(0, 10);
    }
    return dayjs(val).format("YYYY-MM-DD");
  };

  return artists.map((artist) => {
    const days = {};

    for (let i = 0; i < 7; i++) {
      const dayDate = startOfWeekDate.add(i, "day");
      const dateStr = dayDate.format("YYYY-MM-DD");
      const dayKey = dayKeys[i];

      // Find matching schedules for this artist on this exact date
      const daySchedules = (schedules || []).filter((s) => {
        const sDate = extractDateStr(s.workDate || s.date || s.scheduleDate);
        if (sDate !== dateStr) return false;

        const sNailArtistId = String(s.nailArtistId || s.artistId || s.nailArtist?.nailArtistId || s.nailArtist?.id || "").toLowerCase();
        const sAccountId = String(s.staffId || s.userId || s.accountId || s.user?.id || s.nailArtist?.accountId || "").toLowerCase();

        const aNailArtistId = String(artist.nailArtistId || artist.id || "").toLowerCase();
        const aAccountId = String(artist.accountId || artist.staffId || artist.userId || "").toLowerCase();

        return (
          (sNailArtistId && (sNailArtistId === aNailArtistId || sNailArtistId === aAccountId)) ||
          (sAccountId && (sAccountId === aNailArtistId || sAccountId === aAccountId))
        );
      });

      if (daySchedules.length > 0) {
        const primarySchedule = daySchedules[0];
        const statusVal = primarySchedule.status || "Active";
        const isOff = statusVal.toLowerCase() === "off" || statusVal.toLowerCase() === "leave" || statusVal.toLowerCase() === "inactive";

        const labels = daySchedules.map((s) => {
          const start = s.shiftStart ? String(s.shiftStart).slice(0, 5) : "08:00";
          const end = s.shiftEnd ? String(s.shiftEnd).slice(0, 5) : "17:00";
          return `${start} - ${end}`;
        }).join("\n");

        days[dayKey] = {
          id: primarySchedule.scheduleId || primarySchedule.id || `sched-${i}`,
          status: isOff ? (statusVal === "Leave" ? "Leave" : "Off") : statusVal,
          label: labels || "08:00 - 17:00",
          rawSchedule: primarySchedule,
          schedules: daySchedules,
        };
      } else {
        days[dayKey] = { status: "Off" };
      }
    }

    return {
      ...artist,
      days,
    };
  });
}

function TimelineSchedule({
  weeklySchedules,
  loading,
  monday,
  sunday,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onEditSchedule
}) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = monday.add(i, 'day');
      days.push({
        key: dayNames[i],
        label: dayNames[i],
        dateStr: d.format("MMM DD"),
        date: d,
      });
    }
    return days;
  }, [monday]);

  return (
    <PremiumCard className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading title="Weekly Schedule" subtitle="View and manage staff working hours" />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevWeek}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#f1c6dd] bg-white text-[#ea4f93] hover:bg-[#fff5fa] transition"
            >
              &lt;
            </button>
            <span className="text-xs font-bold text-[#2d1b35] min-w-[150px] text-center">
              {monday.format("MMM DD, YYYY")} - {sunday.format("MMM DD, YYYY")}
            </span>
            <button
              type="button"
              onClick={onNextWeek}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#f1c6dd] bg-white text-[#ea4f93] hover:bg-[#fff5fa] transition"
            >
              &gt;
            </button>
          </div>

          <button
            type="button"
            onClick={onCurrentWeek}
            className="inline-flex items-center gap-2 rounded-full border border-[#f1c6dd] bg-[#fffafd] px-4 py-2 text-[11px] font-semibold text-[#ea4f93] hover:bg-[#fff0f6] transition"
          >
            <Calendar size={14} />
            This Week
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" tip="Loading schedules..." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            {/* Header Row */}
            <div className="flex border-b border-[#f0e8f0]/80 pb-3 mb-1">
              <div className="w-48 shrink-0" />
              {weekDays.map((day) => {
                const isToday = day.dateStr === dayjs().format("MMM DD");
                return (
                  <div key={day.key} className="flex-1 text-center">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isToday ? "text-[#ea4f93]" : "text-[#b3a0ae]"}`}>{day.label}</p>
                    <span className={`inline-flex items-center justify-center rounded-xl px-2 py-0.5 text-[11px] font-extrabold shadow-sm ${isToday
                      ? "bg-gradient-to-br from-[#ff7ab8] to-[#ea4f93] text-white shadow-[0_2px_8px_rgba(234,79,147,0.3)]"
                      : "bg-[#f9f3f8] text-[#8d7a8a] border border-[#f0e8f0]"
                      }`}>{day.dateStr}</span>
                  </div>
                );
              })}
            </div>

            {weeklySchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-semibold text-[#5c4559]">No staff schedules found</p>
                <p className="mt-1 text-xs text-[#a88a9f]">There are no schedules registered for this week</p>
              </div>
            ) : (
              weeklySchedules.map((staff) => (
                <div key={staff.id} className="flex py-3 border-b border-[#f6eff5]/90 last:border-0 items-center hover:bg-[#fdf9fc]/60 rounded-xl transition-colors">
                  {/* Staff Info */}
                  <div className="w-48 shrink-0 flex items-center gap-2.5 pr-3">
                    <div className="relative shrink-0">
                      <StaffAvatar
                        staff={{ ...staff, initials: getStaffInitials(staff.name) }}
                        className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                        fallbackClassName={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${staff.avatarTone} text-[12px] font-bold text-white shadow-sm`}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#2d1b35] truncate leading-tight">{staff.name}</p>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide ${SCHEDULE_STATUS_STYLES[staff.status] || "bg-gray-100 text-gray-600"}`}>
                        {staff.status}
                      </span>
                    </div>
                  </div>

                  {/* Days */}
                  {weekDays.map((day) => {
                    const dayData = staff.days[day.key];
                    const isOff = !dayData || dayData.status === "Off" || dayData.status === "Leave";
                    const isLeave = dayData?.status === "Leave";
                    const hasSchedule = !!dayData?.id;

                    // Extract shift arrays
                    const shiftLabels = !isOff && dayData?.label ? dayData.label.split("\n") : [];
                    const isSplitShift = shiftLabels.length > 1;

                    // Determine card style
                    let containerClass = "relative min-h-[84px] rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 p-2 group/cell overflow-hidden ";
                    if (hasSchedule) {
                      if (isOff) {
                        if (isLeave) {
                          containerClass += "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 cursor-pointer hover:shadow-md";
                        } else {
                          containerClass += "bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/50 cursor-pointer hover:bg-slate-100";
                        }
                      } else {
                        containerClass += "bg-gradient-to-br from-[#edfbf4] to-[#d4f5e2] border border-emerald-200/80 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 shadow-sm";
                      }
                    } else {
                      containerClass += "bg-white/70 border border-slate-100 cursor-pointer hover:bg-[#fff8fb] hover:border-rose-200/50 group";
                    }

                    return (
                      <div key={day.key} className="flex-1 px-0.5">
                        <div
                          onClick={() => onEditSchedule && onEditSchedule(staff, day.key, dayData)}
                          className={containerClass}
                        >
                          {/* Decorative shimmer blob for active cells */}
                          {!isOff && hasSchedule && (
                            <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-emerald-400/10 blur-xl" />
                          )}

                          {isOff ? (
                            <div className="flex flex-col items-center gap-1">
                              {isLeave ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">On Leave</span>
                                  <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[8px] font-bold text-amber-600">Approved</span>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[9px] font-semibold text-slate-300 tracking-wide group-hover/cell:opacity-0 transition-opacity">— Off —</span>
                                  <span className="absolute inset-0 flex flex-col items-center justify-center text-[9px] font-black text-[#E84F93] opacity-0 group-hover/cell:opacity-100 transition-opacity bg-pink-50/95 rounded-2xl border border-pink-200/60 gap-1">
                                    <span className="text-[16px] leading-none">✦</span>
                                    Assign Shift
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 w-full justify-center items-center">
                              {isSplitShift && (
                                <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-2 py-0.5 text-[7.5px] font-black text-white uppercase tracking-widest shadow-sm">
                                  <span>⚡ Split ({shiftLabels.length})</span>
                                </div>
                              )}
                              <div className="flex flex-col gap-1 w-full">
                                {shiftLabels.map((shift, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl bg-white/90 backdrop-blur-sm text-emerald-800 text-[9.5px] font-extrabold tracking-tight border border-emerald-200/80 shadow-sm w-full text-center"
                                  >
                                    <Clock size={9} className="text-emerald-500 shrink-0" />
                                    <span>{shift}</span>
                                  </span>
                                ))}
                              </div>
                              {!isSplitShift && (
                                <span className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest block leading-none mt-0.5">
                                  {dayData?.duration ? `${dayData.duration}h` : dayData?.status || "Active"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </PremiumCard>
  );
}

TimelineSchedule.propTypes = {
  weeklySchedules: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  selectedDayTab: PropTypes.string.isRequired,
  setSelectedDayTab: PropTypes.func.isRequired,
  monday: PropTypes.object.isRequired,
  sunday: PropTypes.object.isRequired,
  onPrevWeek: PropTypes.func.isRequired,
  onNextWeek: PropTypes.func.isRequired,
  onCurrentWeek: PropTypes.func.isRequired,
  onEditSchedule: PropTypes.func,
};

export function StaffManagementPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewingStaff, setViewingStaff] = useState(null);
  const [viewingStaffDetail, setViewingStaffDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [isTransferStaffModalOpen, setIsTransferStaffModalOpen] = useState(false);
  const [salonId, setSalonId] = useState(null);
  const [staffArtists, setStaffArtists] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);
  const [staffSkills, setStaffSkills] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  const [monday, setMonday] = useState(() => {
    const today = dayjs();
    const currentDay = today.day();
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    return today.add(daysToMonday, "day");
  });

  const [sunday, setSunday] = useState(() => {
    const today = dayjs();
    const currentDay = today.day();
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    return today.add(daysToMonday, "day").add(6, "day");
  });

  // Schedule Edit/Create states
  const [editingSchedule, setEditingSchedule] = useState(null);

  const initialScheduleState = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.key] = false;
    return acc;
  }, {});
  const [newShiftSchedule, setNewShiftSchedule] = useState(initialScheduleState);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState(
    TIME_SLOTS_30MIN.map((_, idx) => idx)
  );
  const [newShiftStatus, setNewShiftStatus] = useState("Active");

  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [isCreateShiftModalOpen, setIsCreateShiftModalOpen] = useState(false);

  // Modal has its own week state so user can navigate independently of the timeline
  const [modalMonday, setModalMonday] = useState(monday);
  const modalSunday = modalMonday.add(6, "day");
  const [modalWeekSchedules, setModalWeekSchedules] = useState({});
  const [loadingModalSchedules, setLoadingModalSchedules] = useState(false);

  const loadSchedules = useCallback(async () => {
    try {
      setLoadingSchedules(true);
      const activeSalonId = salonId || (await getSalonIdAsync()) || getSalonId();
      if (!activeSalonId) {
        setSchedules([]);
        return;
      }

      const startStr = monday.subtract(1, "day").format("YYYY-MM-DD");
      const endStr = sunday.add(1, "day").format("YYYY-MM-DD");

      const data = await fetchSchedulesBySalonId(activeSalonId, {
        startDate: startStr,
        endDate: endStr,
      });

      const list = Array.isArray(data) ? data : data?.items || [];
      console.log("Timeline loaded salon schedules:", list);
      setSchedules(list);
    } catch (err) {
      console.error("Failed to load schedules:", err);
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }, [salonId, monday, sunday]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handlePrevWeek = () => {
    const prevMon = monday.subtract(1, 'week');
    setMonday(prevMon);
    setSunday(prevMon.add(6, 'day'));
  };

  const handleNextWeek = () => {
    const nextMon = monday.add(1, 'week');
    setMonday(nextMon);
    setSunday(nextMon.add(6, 'day'));
  };

  const handleCurrentWeek = () => {
    const today = dayjs();
    const currentDay = today.day();
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const currentMon = today.add(daysToMonday, 'day');
    setMonday(currentMon);
    setSunday(currentMon.add(6, 'day'));
  };

  // Handle opening staff detail drawer
  const handleOpenDrawer = useCallback((artistId) => {
    setIsDrawerOpen(true);
    setIsLoadingDrawer(false);
    setIsLoadingSkills(false);

    // Find the staff in our already loaded list
    const staff = staffArtists.find(s => s.id === artistId);
    console.log("Opening drawer for staff:", staff);

    if (staff) {
      setSelectedStaff(staff);
      setStaffSkills(staff.skills); // Use skills we already have!
    } else {
      setSelectedStaff(null);
      setStaffSkills([]);
    }
  }, [staffArtists]);

  const handleEditSchedule = (staff, dayKey, dayData) => {
    setEditingSchedule({
      id: dayData.id,
      name: staff.name,
      artistId: staff.id,
      workDate: dayData.rawSchedule?.workDate || dayData.rawSchedule?.date,
      start: dayData.start,
      end: dayData.end,
      status: dayData.status,
      rawSchedule: dayData.rawSchedule,
      schedules: dayData.schedules || (dayData.rawSchedule ? [dayData.rawSchedule] : []),
    });
    setIsEditScheduleModalOpen(true);
  };

  // Derived: shift duration in hours for the Create Shift modal (null if invalid/incomplete)
  const shiftDurationHours = useMemo(() => {
    if (newShiftStatus !== "Active") return 0;
    return selectedTimeSlots.length * 0.5;
  }, [newShiftStatus, selectedTimeSlots]);

  // Only Active shifts require a valid, positive time range
  const isShiftTimeInvalid = newShiftStatus === "Active" && selectedTimeSlots.length === 0;

  const applyShiftDurationPreset = (hours) => {
    const slotCount = hours * 2;
    const newSelected = [];
    for (let i = 0; i < slotCount; i++) {
      newSelected.push(i);
    }
    setSelectedTimeSlots(newSelected);
  };

  const resetShiftForm = () => {
    setNewShiftSchedule(initialScheduleState);
    setSelectedTimeSlots(TIME_SLOTS_30MIN.map((_, idx) => idx));
    setNewShiftStatus("Active");
  };

  const handleScheduleChange = (dayKey, checked) => {
    setNewShiftSchedule(prev => ({
      ...prev,
      [dayKey]: checked
    }));
  };

  // Fetch the selected staff's existing schedules for the modal's current week
  useEffect(() => {
    if (!isCreateShiftModalOpen || !selectedStaff?.id) {
      setModalWeekSchedules({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingModalSchedules(true);
      try {
        const data = await fetchArtistSchedules(selectedStaff.id, {
          startDate: modalMonday.format("YYYY-MM-DDT00:00:00"),
          endDate: modalSunday.format("YYYY-MM-DDT23:59:59"),
        });
        if (cancelled) return;
        const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const map = {};
        (data || []).forEach((s) => {
          const dateVal = s.date || s.workDate || s.scheduleDate || s.day;
          if (!dateVal) return;
          const d = dayjs(dateVal);
          const rawDay = d.day(); // 0 = Sun
          const key = rawDay === 0 ? "Sun" : DAY_NAMES[rawDay - 1];
          map[key] = s;
        });
        setModalWeekSchedules(map);
      } catch {
        if (!cancelled) setModalWeekSchedules({});
      } finally {
        if (!cancelled) setLoadingModalSchedules(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isCreateShiftModalOpen, selectedStaff, modalMonday]);

  const handleOpenCreateShiftModal = () => {
    // Sync modal week to the current timeline week when opening
    setModalMonday(monday);
    resetShiftForm();
    setIsCreateShiftModalOpen(true);
  };

  const handleModalPrevWeek = () => setModalMonday((prev) => prev.subtract(1, "week"));
  const handleModalNextWeek = () => setModalMonday((prev) => prev.add(1, "week"));

  const handleCreateShift = async () => {
    if (!selectedStaff?.id) {
      message.error("No staff selected.");
      return;
    }

    // Skip days that already have an existing schedule
    const daysToCreate = DAYS_OF_WEEK.filter(
      (day) => newShiftSchedule[day.key] && !modalWeekSchedules[day.key]
    );

    if (daysToCreate.length === 0) {
      message.error("Please select at least one available day.");
      return;
    }

    if (isShiftTimeInvalid) {
      message.error("Please select at least one time slot.");
      return;
    }

    const getContiguousTimeGroups = (selectedIndices) => {
      if (!selectedIndices || selectedIndices.length === 0) return [];
      const sorted = [...selectedIndices].sort((a, b) => a - b);
      const groups = [];
      let currentGroup = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) {
          currentGroup.push(sorted[i]);
        } else {
          groups.push(currentGroup);
          currentGroup = [sorted[i]];
        }
      }
      groups.push(currentGroup);
      return groups.map((group) => {
        const startIdx = group[0];
        const endIdx = group[group.length - 1];
        return {
          shiftStart: TIME_SLOTS_30MIN[startIdx].start,
          shiftEnd: TIME_SLOTS_30MIN[endIdx].end,
        };
      });
    };

    try {
      setIsCreatingShift(true);

      const formatTimeWithSeconds = (timeStr) => {
        if (!timeStr) return "00:00:00";
        const parts = timeStr.split(":");
        const h = parts[0] ? parts[0].padStart(2, '0') : "00";
        const m = parts[1] ? parts[1].padStart(2, '0') : "00";
        const s = parts[2] ? parts[2].padStart(2, '0') : "00";
        return `${h}:${m}:${s}`;
      };

      const isWorkingShift = newShiftStatus === "Active";
      const promises = [];

      if (isWorkingShift) {
        const timeGroups = getContiguousTimeGroups(selectedTimeSlots);
        daysToCreate.forEach((day) => {
          const workDate = modalMonday.add(day.offset, "day");
          timeGroups.forEach((group) => {
            const payload = {
              nailArtistId: selectedStaff.id,
              workDate: workDate.format("YYYY-MM-DDT00:00:00.000[Z]"),
              shiftStart: formatTimeWithSeconds(group.shiftStart),
              shiftEnd: formatTimeWithSeconds(group.shiftEnd),
              status: newShiftStatus,
            };
            promises.push(createSchedule(payload));
          });
        });
      } else {
        daysToCreate.forEach((day) => {
          const workDate = modalMonday.add(day.offset, "day");
          const payload = {
            nailArtistId: selectedStaff.id,
            workDate: workDate.format("YYYY-MM-DDT00:00:00.000[Z]"),
            shiftStart: null,
            shiftEnd: null,
            status: newShiftStatus,
          };
          promises.push(createSchedule(payload));
        });
      }

      await Promise.all(promises);
      message.success("New shifts created successfully!");

      resetShiftForm();
      setIsCreateShiftModalOpen(false);
      loadSchedules();
    } catch (err) {
      console.error("Failed to create shift:", err);
      message.error(err.message || "Failed to create shifts.");
    } finally {
      setIsCreatingShift(false);
    }
  };

  const weeklySchedules = useMemo(() => {
    return mapSchedulesToTimeline(staffArtists, schedules, monday);
  }, [staffArtists, schedules, monday]);


  const mapApiArtistToUiFormat = (apiArtist) => {
    console.log("Mapping API artist:", apiArtist);
    const fullName =
      apiArtist.account?.fullName ||
      (apiArtist.firstName && apiArtist.lastName
        ? `${apiArtist.firstName} ${apiArtist.lastName}`
        : apiArtist.fullName || apiArtist.name || "Nail Artist");

    const artistId = apiArtist.nailArtistId || apiArtist.id || apiArtist.staffId || apiArtist.userId;
    const accountId = apiArtist.accountId || apiArtist.account?.id || apiArtist.userId;

    return {
      id: artistId,
      nailArtistId: apiArtist.nailArtistId || apiArtist.id,
      accountId: accountId,
      staffId: apiArtist.staffId || apiArtist.id,
      userId: accountId,
      name: fullName,
      role: apiArtist.role || "Staff_Artist",
      rating: apiArtist.averageRating || apiArtist.rating || 4.5,
      status: apiArtist.status || "Active",
      skills: apiArtist.skills || [],
      stats: {
        today: 0,
        month: 0,
        revenue: "$0",
      },
      avatarTone: "from-[#ff8ebb] to-[#ea4f93]",
      avatarUrl: apiArtist.account?.avatarUrl || apiArtist.avatarUrl || "",
      email: apiArtist.account?.email || apiArtist.email || "",
      phone: apiArtist.account?.phone || apiArtist.phone || "",
    };
  };

  const fetchArtistDetail = async (artistId) => {
    try {
      setLoadingDetail(true);
      const detail = await fetchNailArtistById(artistId);
      console.log("Fetched artist detail:", detail);
      const mappedDetail = mapApiArtistToUiFormat(detail);
      setViewingStaffDetail(mappedDetail);
      setViewingStaff(mappedDetail);
    } catch (err) {
      console.error("Failed to fetch artist detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    const loadNailArtists = async () => {
      try {
        setLoading(true);
        setError(null);

        const activeSalonId = (await getSalonIdAsync()) || getSalonId();
        if (activeSalonId) {
          setSalonId(activeSalonId);
        }

        const data = await fetchNailArtists(activeSalonId);
        const mappedDataPromises = Array.isArray(data)
          ? data.map(async (apiArtist) => {
            const artist = mapApiArtistToUiFormat(apiArtist);
            try {
              const skills = await fetchNailArtistSkills(apiArtist.nailArtistId || apiArtist.staffId || apiArtist.id || apiArtist.userId);
              artist.skills = skills;
            } catch (err) {
              console.warn("Failed to load skills for artist", artist.id, err);
              artist.skills = [];
            }
            return artist;
          })
          : [];
        const mappedData = await Promise.all(mappedDataPromises);
        setStaffArtists(mappedData);
      } catch (err) {
        console.error("Failed to load nail artists:", err);
        setError(err.message || "Failed to load staff artists");
      } finally {
        setLoading(false);
      }
    };

    loadNailArtists();
  }, []);

  const loadBookings = useCallback(async () => {
    if (!salonId) return;

    try {
      setLoadingBookings(true);
      const result = await fetchBookingsBySalonId(salonId, { pageNumber: 1, pageSize: 1000, isAdmin: true });
      const apiBookings = result?.items || (Array.isArray(result) ? result : []);
      setBookings(apiBookings);
    } catch (err) {
      console.error("Failed to load bookings for performance insights:", err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [salonId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const performanceInsights = useMemo(
    () => buildPerformanceInsights(staffArtists, bookings),
    [staffArtists, bookings],
  );

  const staffArtistsWithStats = useMemo(() => {
    const statsById = new Map(
      performanceInsights.performers.map((performer) => [String(performer.id), performer]),
    );

    return staffArtists.map((staff) => {
      const performer = statsById.get(String(staff.id));
      if (!performer) return staff;

      return {
        ...staff,
        stats: performer.stats,
      };
    });
  }, [staffArtists, performanceInsights.performers]);

  const filteredStaff = useMemo(
    () => {
      let filtered = filterStaffByStatus(staffArtistsWithStats, activeFilter);

      if (query.trim() !== "") {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter((staff) =>
          staff.name.toLowerCase().includes(lowerQuery) ||
          staff.role.toLowerCase().includes(lowerQuery) ||
          staff.status.toLowerCase().includes(lowerQuery)
        );
      }

      return filtered;
    },
    [staffArtistsWithStats, activeFilter, query],
  );

  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStaff, currentPage]);

  const filteredTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage));
  }, [filteredStaff.length]);

  const summaryStats = useMemo(() => [
    {
      label: "Total Staff",
      value: staffArtistsWithStats.length,
      icon: Users,
      tone: "bg-[#ffe8f2] text-[#ea4f93]",
    },
    {
      label: "Active Today",
      value: staffArtistsWithStats.filter((s) => s.status === "Active").length,
      icon: CheckCircle2,
      tone: "bg-[#eaf9ee] text-[#2fa25f]",
    },
    {
      label: "Average Rating",
      value: staffArtistsWithStats.length > 0
        ? (staffArtistsWithStats.reduce((acc, s) => acc + s.rating, 0) / staffArtistsWithStats.length).toFixed(1)
        : "0",
      icon: Star,
      tone: "bg-[#fff0dd] text-[#db8520]",
    },
    {
      label: "Completed Services",
      value: performanceInsights.completedServices,
      icon: CalendarDays,
      tone: "bg-[#e7ecff] text-[#4755b8]",
    },
  ], [staffArtistsWithStats, performanceInsights.completedServices]);

  const handlePageChange = (newPage) => setCurrentPage(newPage);

  const getActionHandler = (label) => {
    switch (label) {
      case "Edit Schedule": return () => setIsEditScheduleModalOpen(true);
      case "Transfer Staff": return () => setIsTransferStaffModalOpen(true);
      default: return () => { };
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1400px] space-y-5">
      {error && (
        <Alert
          message="Error Loading Staff"
          description={error}
          type="error"
          showIcon
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spin size="large" tip="Loading staff artists..." />
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
          {/* Luxury Rose Pink Hero Header */}
          <motion.div variants={fadeInUp}>
            <div className="relative overflow-hidden rounded-[32px] border border-[#F3D6E5] bg-gradient-to-r from-[#FFF0F5] via-[#FFF6FA] to-[#FFE4EE] p-6 lg:p-8 text-[#2B182B] shadow-[0_15px_40px_rgba(232,79,147,0.12)]">
              {/* Ambient Glow Elements */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-[#E84F93]/20 via-[#FF75A8]/15 to-transparent blur-3xl" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-gradient-to-tr from-[#E5C158]/20 via-[#C99635]/10 to-transparent blur-3xl" />

              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4.5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#F7E7CE] via-[#E5C158] to-[#C99635] text-white shadow-[0_10px_25px_rgba(201,150,53,0.35)] border border-white/60 shrink-0">
                    <Users size={30} className="drop-shadow-md text-white" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#E84F93]/30 bg-[#E84F93]/10 px-3.5 py-1 text-[11px] font-extrabold text-[#E84F93] backdrop-blur-md shadow-xs">
                      <Sparkles size={13} className="text-[#E84F93] animate-pulse" />
                      <span>Salon Staff & Artisan Roster</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-[#2B182B] mt-1.5 tracking-tight font-serif">
                      Staff Artists
                    </h1>
                    <p className="mt-1 text-xs lg:text-sm text-[#8C6682] font-semibold leading-relaxed">
                      Manage staff rosters, artisan profiles, workload performance, and skills
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = {
                      "calendar": CalendarDays,
                      "award": Award,
                      "chart": BarChart3,
                      "arrow": ArrowRightLeft,
                    }[action.icon] || CalendarDays;
                    const handler = getActionHandler(action.label);

                    return (
                      <button
                        key={action.label}
                        type="button"
                        onClick={handler}
                        className="inline-flex items-center gap-2 rounded-full border border-[#F3D6E5] bg-white/90 px-4 py-2.5 text-xs font-extrabold text-[#E84F93] shadow-2xs hover:bg-[#FFF0F5] transition"
                      >
                        <Icon size={14} />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                  <Link
                    to={ROUTES.managerStaffArtistsCreate}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E84F93] via-[#EC4899] to-[#F43F5E] px-6 py-2.5 text-xs font-black text-white shadow-[0_10px_25px_rgba(232,79,147,0.35)] hover:shadow-xl transition-all"
                  >
                    <UserPlus size={16} />
                    <span>Add Staff Artist</span>
                  </Link>
                </div>
              </div>

              {/* 4 Clean 4-Column KPI Cards */}
              <div className="grid gap-4 pt-6 mt-6 border-t border-slate-200/60 grid-cols-2 lg:grid-cols-4">
                {summaryStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs hover:border-[#E84F93]/40 transition group">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{stat.label}</p>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone} group-hover:scale-105 transition`}>
                        <stat.icon size={16} />
                      </div>
                    </div>
                    <p className="mt-2.5 text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <PremiumCard className="overflow-hidden p-0">
              <div className="border-b border-[#f1e7ed] bg-[#fffafd] px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <SectionHeading
                    title="Staff Artists"
                    subtitle="View and manage your nail artists"
                  />
                  <div className="flex flex-wrap gap-2">
                    {STAFF_FILTER_TABS.map((filter) => {
                      const count = filter === "All" ? staffArtists.length : staffArtists.filter(s => s.status === filter).length;
                      const isActive = activeFilter === filter;
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isActive
                            ? "bg-[#ea4f93] text-white shadow-[0_4px_12px_rgba(234,79,147,0.25)]"
                            : "border border-[#f3d7e4] bg-white text-[#7f6478] hover:border-[#ea4f93]/30 hover:text-[#ea4f93]"
                            }`}
                        >
                          {filter}
                          <span className={isActive ? "rounded bg-white/20 px-1.5 py-0.5 text-[10px]" : "rounded bg-[#fff0f6] px-1.5 py-0.5 text-[10px] text-[#c86d98]"}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
                  <label className="group relative block">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a88a9f] group-focus-within:text-[#ea4f93]" />
                    <input
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Search by name, role, or status..."
                      className="h-10 w-full rounded-xl border border-[#f3d7e4] bg-white pl-10 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#c8b0bf] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/10"
                    />
                  </label>

                  <DatePicker
                    value={selectedDate}
                    onChange={(d) => setSelectedDate(d)}
                    placeholder="Select date"
                    className="h-10 w-full rounded-xl border border-[#f3d7e4]"
                    suffixIcon={<Calendar size={14} className="text-[#a88a9f]" />}
                  />

                  <button
                    type="button"
                    onClick={() => { setQuery(""); setSelectedDate(null); setActiveFilter("All"); setCurrentPage(1); }}
                    disabled={!query.trim() && !selectedDate && activeFilter === "All"}
                    className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${query.trim() || selectedDate || activeFilter !== "All"
                      ? "border-[#f3d7e4] bg-white text-[#ea4f93] hover:bg-[#fff5fa]"
                      : "cursor-not-allowed border-[#f5e8ef] bg-[#fffafb] text-[#d6b9c8]"
                      }`}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {filteredStaff.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f8] text-[#ea4f93]">
                      <Search size={22} />
                    </div>
                    <p className="text-base font-semibold text-[#5c4559]">No staff artists found</p>
                    <p className="mt-1 max-w-xs text-xs text-[#a88a9f]">
                      Try adjusting your filters or search term
                    </p>
                    <button
                      type="button"
                      onClick={() => { setQuery(""); setSelectedDate(null); setActiveFilter("All"); setCurrentPage(1); }}
                      className="mt-4 rounded-xl bg-[#ea4f93] px-4 py-2 text-xs font-semibold text-white transition active:scale-[0.98]"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <AnimatePresence mode="popLayout">
                        {paginatedStaff.map((staff) => (
                          <StaffArtistCard
                            key={staff.id}
                            staff={staff}
                            onOpenDrawer={handleOpenDrawer}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                    {filteredTotalPages > 1 && (
                      <div className="mt-6 flex justify-end border-t border-[#f1e7ed] pt-5">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={filteredTotalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </PremiumCard>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <TimelineSchedule
              weeklySchedules={weeklySchedules}
              loading={loadingSchedules}
              monday={monday}
              sunday={sunday}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onCurrentWeek={handleCurrentWeek}
              onEditSchedule={handleEditSchedule}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <PremiumCard className="p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeading
                  title="Performance Overview"
                  subtitle="Staff with the most completed bookings this month"
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#f1c6dd] bg-[#fffafd] px-4 py-2 text-[11px] font-semibold text-[#ea4f93]"
                >
                  <TrendingUp size={14} />
                  This Month
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {loadingBookings ? (
                  <div className="col-span-full flex items-center justify-center py-10">
                    <Spin tip="Loading performance data..." />
                  </div>
                ) : performanceInsights.topCompletedPerformers.length > 0 ? (
                  performanceInsights.topCompletedPerformers.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#f1e7ed] bg-[#fffafd] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.avatarTone} text-sm font-bold text-white`}
                        >
                          {getStaffInitials(item.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#2d1b35]">{item.name}</p>
                          <p className="text-[12px] text-[#a88a9f]">{item.role}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {[
                          [item.metrics.completed, "Bookings"],
                          [item.metrics.rating, "Rating"],
                          [item.metrics.revenue, "Revenue"],
                          [item.metrics.satisfaction, "Satisfaction"],
                        ].map(([value, label]) => (
                          <div
                            key={label}
                            className="rounded-lg border border-[#f1e7ed] bg-white px-3 py-2"
                          >
                            <p className="text-sm font-bold text-[#ea4f93]">{value}</p>
                            <p className="text-[10px] text-[#a88a9f]">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-xl border border-dashed border-[#f1c6dd] bg-[#fffafd] px-4 py-8 text-center text-sm text-[#a88a9f]">
                    No completed bookings this month yet
                  </div>
                )}
              </div>
            </PremiumCard>
          </motion.div>
        </motion.div>
      )}

      {/* Staff Detail Drawer */}
      <Drawer
        title={null}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedStaff(null);
          // Reset shift creation form state
          resetShiftForm();
        }}
        size="large"
        styles={{
          body: { padding: 0 },
          section: { background: "#fafafa" }
        }}
        placement="right"
        mask={true}
        maskClosable={true}
        destroyOnClose
        closable={false}
      >
        {isLoadingDrawer ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : selectedStaff ? (
          <div className="bg-[#fafafa] h-full flex flex-col">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#ff8ebb] via-[#ff7ba4] to-[#ffaab6] shadow-md p-6 rounded-b-3xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <StaffAvatar
                    staff={{
                      ...selectedStaff,
                      name: selectedStaff.name,
                      initials: getStaffInitials(selectedStaff.name),
                    }}
                    className="h-14 w-14 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                    fallbackClassName="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white text-2xl font-bold border-2 border-white/30 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/85">Staff Details</p>
                    <h2 className="text-xl font-bold text-white mt-1 truncate">
                      {selectedStaff.name}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setSelectedStaff(null);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 flex-shrink-0"
                >
                  <X size={20} color="#ffffff" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {selectedStaff.role && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
                    {selectedStaff.role}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Personal Information */}
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f1e7ed]">
                <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <InfoItem label="Name">{selectedStaff.name || '-'}</InfoItem>
                  <InfoItem label="Email">{selectedStaff.email || '-'}</InfoItem>
                  <InfoItem label="Phone Number">{selectedStaff.phone || '-'}</InfoItem>
                </div>
              </div>

              {/* Account Information */}
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f1e7ed]">
                <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Account Information</h3>
                <div className="space-y-4">
                  <InfoItem label="Role">{selectedStaff.role || '-'}</InfoItem>
                  <InfoItem label="Status">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-[#eaf9ee] text-[#2fa25f]">
                      {selectedStaff.status || 'Active'}
                    </span>
                  </InfoItem>
                </div>
              </div>

              {/* Skills Section */}
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f1e7ed]">
                <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Skills &amp; Specialties</h3>
                {isLoadingSkills ? (
                  <div className="flex justify-center py-4">
                    <Spin size="small" />
                  </div>
                ) : staffSkills.length > 0 ? (
                  <div className="space-y-3">
                    {staffSkills.map((skill, index) => {
                      const level = skill.level ? Math.min(Math.max(Math.round(Number(skill.level)), 0), 5) : 0;
                      return (
                        <div
                          key={skill.id || index}
                          className="flex items-center justify-between rounded-xl bg-[#fff8fc] px-4 py-3 border border-[#f1e7ed]"
                        >
                          <span className="text-sm font-semibold text-[#2d1b35]">
                            {skill.skillTypeName || skill.name || 'Skill'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={i < level ? 'text-[#ea4f93] text-sm' : 'text-[#e0c8d8] text-sm'}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-1.5 text-[11px] font-medium text-[#a88a9f]">{level}/5</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#a88a9f]">No skills assigned yet</p>
                )}
              </div>

              {/* Update Button + Create Shift */}
              <div className="pt-4 border-t border-[#f1e7ed] space-y-3">
                <Link
                  to={getManagerStaffUpdateRoute(selectedStaff.id || selectedStaff.userId || selectedStaff.staffId)}
                  onClick={() => {
                    setIsDrawerOpen(false);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#ea4f93] bg-white px-4 py-3 text-xs font-bold text-[#ea4f93] shadow-lg transition-all hover:bg-[#fff0f8] hover:border-[#ea4f93] hover:scale-[1.02]"
                >
                  <UserPlus size={14} />
                  Update Profile
                </Link>
                <button
                  type="button"
                  onClick={handleOpenCreateShiftModal}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-4 py-3 text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.02]"
                >
                  <CalendarDays size={14} />
                  Create New Shift
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Create New Shift Modal */}
      <Modal
        open={isCreateShiftModalOpen}
        onCancel={() => {
          setIsCreateShiftModalOpen(false);
          resetShiftForm();
        }}
        footer={null}
        closable={false}
        centered
        width={newShiftStatus === "Active" ? 860 : 480}
        destroyOnClose
        styles={{
          content: { padding: 0, borderRadius: 24, overflow: "hidden" },
          mask: { backdropFilter: "blur(6px)" },
        }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#ff8ebb] via-[#ff7ba4] to-[#ea4f93] px-6 py-5">
          <button
            type="button"
            onClick={() => {
              setIsCreateShiftModalOpen(false);
              resetShiftForm();
            }}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
              <CalendarDays size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">New Shift</p>
              <h3 className="truncate text-base font-bold text-white">
                {selectedStaff?.name || "Select staff"}
              </h3>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className={`grid gap-6 ${newShiftStatus === "Active" ? "grid-cols-1 md:grid-cols-[1.15fr_1fr]" : "grid-cols-1"}`}>
            {/* Column 1: Days & Status */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-rose-100 bg-[#fffafd] p-4">
                {/* Week navigation */}
                <div className="mb-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleModalPrevWeek}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#f1c6dd] bg-white text-[#ea4f93] hover:bg-[#fff5fa] transition text-xs font-bold"
                  >
                    &#8249;
                  </button>
                  <h4 className="text-sm font-bold text-[#2d1b35] text-center flex-1">
                    {modalMonday.format("MMM DD")} &mdash; {modalSunday.format("MMM DD, YYYY")}
                  </h4>
                  <button
                    type="button"
                    onClick={handleModalNextWeek}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#f1c6dd] bg-white text-[#ea4f93] hover:bg-[#fff5fa] transition text-xs font-bold"
                  >
                    &#8250;
                  </button>
                </div>

                {loadingModalSchedules ? (
                  <div className="flex items-center justify-center py-6">
                    <Spin size="small" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const dayDate = modalMonday.add(day.offset, "day");
                      const date = dayDate.format("DD");
                      const isChecked = newShiftSchedule[day.key];
                      const existingSchedule = modalWeekSchedules[day.key];
                      const hasExisting = Boolean(existingSchedule);

                      // Summarise existing shift into a compact badge (start time only, or status)
                      const existingLabel = hasExisting
                        ? (() => {
                          const s = existingSchedule;
                          const st = s.shiftStart || s.startTime || s.start || "";
                          if (st) return st.slice(0, 5);
                          return (s.status || "Busy").slice(0, 5);
                        })()
                        : null;

                      return (
                        <label
                          key={day.key}
                          className={`relative flex min-h-[86px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center transition-all duration-200 ${hasExisting
                            ? "cursor-not-allowed border-[#f1e7ed] bg-[#f6f6f6]"
                            : isChecked
                              ? "border-[#ea4f93] bg-[#fff5fa] shadow-sm ring-1 ring-[#ea4f93]/25"
                              : "border-rose-100 bg-white hover:border-rose-200 hover:shadow-sm"
                            }`}
                        >
                          {hasExisting ? (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ece7ea] text-[#a88a9f]">
                              <Lock size={9} />
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(event) => handleScheduleChange(day.key, event.target.checked)}
                              className="h-3.5 w-3.5 rounded border-rose-200 accent-[#ea4f93]"
                            />
                          )}
                          <span className="w-full truncate text-[11px] font-bold leading-none text-slate-700">
                            {day.key}
                          </span>
                          <span className="text-[10px] font-medium leading-none text-slate-400">{date}</span>
                          {hasExisting && (
                            <span className="mt-0.5 w-full truncate rounded-md bg-[#ffe8f2] px-1 py-0.5 text-[9px] font-bold leading-none text-[#ea4f93]">
                              {existingLabel}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-[#b39aac]">
                  <Lock size={10} />
                  Days with a lock icon already have a schedule and can&apos;t be selected
                </p>
              </div>

              {/* Status segmented control */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f]">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(SHIFT_STATUS_META).map(([key, meta]) => {
                    const isActive = newShiftStatus === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewShiftStatus(key)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${isActive
                          ? `${meta.color} ring-2 ring-offset-1 ring-current`
                          : "border-[#f1e7ed] bg-white text-[#a88a9f] hover:border-[#ea4f93]/30"
                          }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column 2: Working hours — only relevant when the shift is Active */}
            {newShiftStatus === "Active" && (
              <div className="border-t pt-5 md:border-t-0 md:pt-0 md:border-l md:pl-6 border-[#f1e7ed] flex flex-col justify-between">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f]">
                      Working Hours
                    </label>
                    <div className="flex gap-1.5">
                      {SHIFT_DURATION_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyShiftDurationPreset(preset.hours)}
                          className="rounded-full border border-[#f1c6dd] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#ea4f93] transition hover:bg-[#fff5fa]"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots Helpers */}
                  <div className="mb-3 flex items-center justify-between border-b border-rose-50 pb-2">
                    <span className="text-[10px] text-slate-400">Select working intervals:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTimeSlots(TIME_SLOTS_30MIN.map((_, i) => i))}
                        className="text-[10px] font-bold text-[#ea4f93] hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-[10px] text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTimeSlots([])}
                        className="text-[10px] font-bold text-slate-500 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Time Slots Selector Grid */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS_30MIN.map((slot, idx) => {
                      const isSelected = selectedTimeSlots.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedTimeSlots((prev) =>
                              prev.includes(idx)
                                ? prev.filter((i) => i !== idx)
                                : [...prev, idx]
                            );
                          }}
                          className={`rounded-xl border py-1.5 text-center text-[9.5px] font-bold tracking-tight transition-all duration-150 ${isSelected
                            ? "border-[#ea4f93] bg-[#fff5fa] text-[#ea4f93] shadow-sm"
                            : "border-slate-100 bg-[#fafafa] text-slate-500 hover:border-[#ea4f93]/30 hover:bg-[#fffbfc]"
                            }`}
                        >
                          {slot.start} - {slot.end}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live validation / duration preview */}
                <div className="mt-3">
                  {isShiftTimeInvalid ? (
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-500">
                      <AlertCircle size={12} />
                      Please select at least one time slot
                    </p>
                  ) : (
                    shiftDurationHours > 0 && (
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2fa25f]">
                        <CheckCircle2 size={12} />
                        {shiftDurationHours.toFixed(1)}h total working duration
                      </p>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Unified Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateShiftModalOpen(false);
                resetShiftForm();
              }}
              className="rounded-xl px-5 py-2.5 text-xs font-semibold text-[#a88a9f] hover:bg-[#fff5fa] hover:text-[#2d1b35] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateShift}
              disabled={isCreatingShift || isShiftTimeInvalid}
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#ea4f93] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#ea4f93]/20 transition hover:bg-[#d63d81] disabled:opacity-50"
            >
              {isCreatingShift ? <Spin size="small" className="brightness-200" /> : "Create Schedule"}
            </button>
          </div>
        </div>
      </Modal>
      <EditScheduleModal
        open={isEditScheduleModalOpen}
        onClose={() => {
          setIsEditScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        schedule={editingSchedule}
        staffArtists={staffArtists}
        monday={monday}
        onSuccess={() => loadSchedules()}
      />
      <TransferStaffModal
        open={isTransferStaffModalOpen}
        onClose={() => setIsTransferStaffModalOpen(false)}
        salonId={salonId}
        onSuccess={() => loadNailArtists()}
      />
    </section>
  );
}