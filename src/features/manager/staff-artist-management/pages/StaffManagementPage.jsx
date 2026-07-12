import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  Phone,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Search,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Modal, Spin, Alert, DatePicker } from "antd";
import { Link } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES, getManagerStaffUpdateRoute } from "../../../../shared/constants/routes";
import {
  LOW_RATING_ALERTS,
  PERFORMANCE_OVERVIEW,
  QUICK_ACTIONS,
  SCHEDULE_DAY_KEYS,
  SCHEDULE_STATUS_STYLES,
  STAFF_FILTER_TABS,
  STAFF_ON_LEAVE,
  STAFF_STATUS_STYLES,
  TOP_PERFORMER,
  WEEKLY_SCHEDULE,
  filterStaffByStatus,
  getStaffInitials,
} from "../services/mockStaffArtists";
import { fetchNailArtists, fetchNailArtistById, fetchSchedules } from "../services/nailArtistsService";
import { Pagination } from "../../../../shared/components/common/Pagination";
import dayjs from "dayjs";

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

function StaffDetailModal({ staff, onClose, loading }) {
  const avgPerDay =
    staff?.stats?.month && staff.stats.month > 0
      ? (staff.stats.month / 26).toFixed(1)
      : "—";

  return (
    <Modal
      open={!!staff}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" tip="Loading artist detail..." />
        </div>
      ) : staff && (
        <>
          <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 pt-6 pb-10">
            <div className="flex items-center gap-4">
              {staff.avatarUrl ? (
                <img
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  src={staff.avatarUrl}
                  alt={staff.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white/40 shadow-lg"
                />
              ) : (
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${staff.avatarTone} ring-4 ring-white/40 text-xl font-black text-white shadow-lg`}
                >
                  {getStaffInitials(staff.name)}
                </div>
              )}
              <div>
                <h2 className="text-[20px] font-extrabold text-white">{staff.name}</h2>
                <p className="text-[12px] font-semibold text-white/80">{staff.role}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STAFF_STATUS_STYLES[staff.status]}`}>
                    {staff.status}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-white/90">
                    <Star size={11} fill="currentColor" className="text-yellow-300" />
                    {staff.rating?.toFixed(1) ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-6 space-y-4 rounded-[24px] bg-white px-6 pt-6 pb-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Today", value: staff.stats?.today ?? "—", sub: "bookings" },
                { label: "This Month", value: staff.stats?.month ?? "—", sub: "bookings" },
                { label: "Revenue", value: staff.stats?.revenue ?? "—", sub: "total" },
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-3 py-3 text-center"
                >
                  <p className="text-[16px] font-extrabold text-[#ea4f93]">{value}</p>
                  <p className="text-[10px] font-semibold text-[#9a5f7f]">{label}</p>
                  <p className="text-[9px] text-[#9a5f7f]">{sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a5f7f]">Avg / Work Day</p>
                <p className="mt-1 text-[16px] font-extrabold text-[#2d1b35]">{avgPerDay}</p>
                <p className="text-[9px] text-[#9a5f7f]">bookings per day</p>
              </div>
              <div className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a5f7f]">Rating</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Star size={14} fill="#fbbf24" className="text-[#fbbf24]" />
                  <p className="text-[16px] font-extrabold text-[#2d1b35]">{staff.rating?.toFixed(1) ?? "—"}</p>
                </div>
                <p className="text-[9px] text-[#9a5f7f]">customer rating</p>
              </div>
            </div>

            {(staff.email || staff.phone) && (
              <div className="space-y-2 rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a5f7f]">Contact</p>
                {staff.email && (
                  <div className="flex items-center gap-2 text-[13px] text-[#7f6478]">
                    <Mail size={14} className="text-[#ea4f93]" />
                    <span>{staff.email}</span>
                  </div>
                )}
                {staff.phone && (
                  <div className="flex items-center gap-2 text-[13px] text-[#7f6478]">
                    <Phone size={14} className="text-[#ea4f93]" />
                    <span>{staff.phone}</span>
                  </div>
                )}
              </div>
            )}

            {staff.skills?.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a5f7f]">
                  Skills & Specialties
                </p>
                <div className="flex flex-wrap gap-2">
                  {staff.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#ffe7ef] px-3 py-1.5 text-[11px] font-semibold text-[#ea4f93]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Link
                to={getManagerStaffUpdateRoute(staff.id)}
                className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-95"
              >
                Edit Profile
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[#f1c6dd] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fffafd]"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

StaffDetailModal.propTypes = {
  staff: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

function StaffArtistCard({ staff, onView }) {
  const visibleSkills = staff.skills.slice(0, 2);
  const extraSkillsCount = staff.skills.length - visibleSkills.length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="group flex h-full min-w-0 flex-col rounded-2xl border border-[#f1e7ed] bg-white p-5 shadow-[0_4px_20px_-8px_rgba(45,27,53,0.1)] transition-colors duration-300 hover:border-[#ea4f93]/40"
    >
      <div className="flex items-start gap-4">
        {staff.avatarUrl ? (
          <img
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            src={staff.avatarUrl}
            alt={staff.name}
            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-2 ring-[#fff5fa]"
          />
        ) : (
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${staff.avatarTone} text-base font-bold text-white ring-2 ring-[#fff5fa]`}
          >
            {getStaffInitials(staff.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#2d1b35]">
              {staff.name}
            </h3>
            <StatusPill status={staff.status} />
          </div>
          <p className="mt-0.5 text-[13px] text-[#a88a9f]">{staff.role}</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#fff8fb] px-2 py-0.5">
            <Star size={12} fill="#fbbf24" className="text-[#fbbf24]" />
            <span className="text-[12px] font-semibold text-[#2d1b35]">
              {staff.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-h-[28px] flex-wrap gap-1.5">
        {visibleSkills.length > 0 ? (
          <>
            {visibleSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-[#fff0f6] px-2.5 py-1 text-[11px] font-medium text-[#ea4f93]"
              >
                {skill}
              </span>
            ))}
            {extraSkillsCount > 0 && (
              <span className="rounded-md bg-[#f5eef2] px-2.5 py-1 text-[11px] font-medium text-[#a88a9f]">
                +{extraSkillsCount}
              </span>
            )}
          </>
        ) : (
          <span className="rounded-md border border-dashed border-[#f1c6dd] px-2.5 py-1 text-[11px] text-[#c8a6bb]">
            Skills are not assigned
          </span>
        )}
      </div>

      <div className="mt-4 flex divide-x divide-[#f1e7ed] rounded-xl border border-[#f1e7ed] bg-[#fffafd]">
        {[
          [Clock3, staff.stats.today, "Today"],
          [CalendarDays, staff.stats.month, "This Month"],
          [TrendingUp, staff.stats.revenue, "Revenue"],
        ].map(([Icon, value, label]) => (
          <div key={label} className="flex flex-1 flex-col items-center px-2 py-3">
            <Icon size={14} className="mb-1 text-[#ea4f93]" />
            <p className="text-sm font-bold text-[#2d1b35]">{value}</p>
            <p className="mt-0.5 text-[10px] text-[#a88a9f]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-2 pt-4">
        <button
          type="button"
          onClick={() => onView(staff)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#f1c6dd] py-2.5 text-[12px] font-semibold text-[#ea4f93] transition hover:bg-[#fff5fa] active:scale-[0.98]"
        >
          <Eye size={14} />
          View
        </button>
        <Link
          to={getManagerStaffUpdateRoute(staff.id)}
          className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-[12px] font-semibold text-white shadow-[0_6px_16px_rgba(234,79,147,0.2)] transition hover:opacity-95 active:scale-[0.98]"
        >
          Edit
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
    skills: PropTypes.arrayOf(PropTypes.string).isRequired,
    stats: PropTypes.shape({
      month: PropTypes.number.isRequired,
      revenue: PropTypes.string.isRequired,
      today: PropTypes.number.isRequired,
    }).isRequired,
    status: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onView: PropTypes.func.isRequired,
};

function EditScheduleModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      <div className="bg-white">
        <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 py-6">
          <h2 className="text-xl font-bold text-white">Edit Schedule</h2>
          <p className="text-sm text-white/80 mt-1">Update staff working hours and breaks</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Select Staff</label>
            <select className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10">
              <option>Choose a staff member...</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Day</label>
            <div className="grid grid-cols-7 gap-2">
              {SCHEDULE_DAY_KEYS.map((day) => (
                <button key={day} type="button" className="py-2 rounded-[12px] border border-[#f1c6dd] text-[11px] font-semibold text-[#a88a9f] hover:bg-[#fffafd] hover:text-[#ea4f93]">
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Start Time</label>
              <input type="time" className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">End Time</label>
              <input type="time" className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Break Duration</label>
            <select className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10">
              <option>30 minutes</option>
              <option>45 minutes</option>
              <option>1 hour</option>
              <option>1.5 hours</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#f1c6dd] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fffafd]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-95"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

EditScheduleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

function AssignSkillModal({ open, onClose }) {
  const [skills, setSkills] = useState([
    { 
      id: 0,
      name: "Precision", 
      vietnamese: "Độ chính xác", 
      level: 1, 
      feedback: "Sơn lem, viền không đều" 
    },
    { 
      id: 1,
      name: "Color", 
      vietnamese: "Màu sắc", 
      level: 1, 
      feedback: "Chọn màu chưa hợp, dễ lệch tone" 
    },
    { 
      id: 2,
      name: "Form", 
      vietnamese: "Form móng", 
      level: 1, 
      feedback: "Form lệch, không cân đối" 
    },
    { 
      id: 3,
      name: "Material", 
      vietnamese: "Vật liệu", 
      level: 1, 
      feedback: "Không kiểm soát được gel/bột" 
    },
    { 
      id: 4,
      name: "Design", 
      vietnamese: "Thẩm mỹ", 
      level: 1, 
      feedback: "Làm theo mẫu, không sáng tạo" 
    },
    { 
      id: 5,
      name: "Speed", 
      vietnamese: "Tốc độ", 
      level: 1, 
      feedback: ">120 phút – Rất chậm" 
    }
  ]);

  const updateSkillLevel = (skillId, newLevel) => {
    setSkills(skills.map((skill) => 
      skill.id === skillId ? { ...skill, level: newLevel } : skill
    ));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      <div className="bg-white">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] flex items-center justify-center">
              <Award size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2d1b35]">Skills & Specialties</h2>
              <p className="text-[13px] text-[#a88a9f] mt-1">Đánh giá kỹ năng theo từng hạng mục (Level 1-5)</p>
            </div>
          </div>
          <select className="rounded-[20px] border border-[#f1c6dd] bg-[#fffafd] px-4 py-2.5 text-[13px] font-semibold text-[#a88a9f] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Expert</option>
          </select>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Select Staff</label>
            <select className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10">
              <option>Choose a staff member...</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] p-5 shadow-[0_4px_20px_rgba(234,79,147,0.08)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#2d1b35]">{skill.name}</h3>
                    <span className="text-[13px] font-semibold text-[#a88a9f]">{skill.vietnamese}</span>
                  </div>
                  <span className="rounded-full bg-[#ffe7ef] px-3 py-1 text-[11px] font-bold text-[#ea4f93]">
                    Level {skill.level}
                  </span>
                </div>

                <div className="flex gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => updateSkillLevel(skill.id, level)}
                    >
                      <div 
                        className={`w-full h-2 rounded-full transition-all duration-200 ${level <= skill.level ? 'bg-[#ea4f93]' : 'bg-[#f1e7ed] hover:bg-[#fde7ef]'}`} 
                      />
                      <span className={`text-[10px] font-bold ${level <= skill.level ? 'text-[#ea4f93]' : 'text-[#a88a9f]'}`}>{level}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[13px] font-semibold text-[#ea4f93]">{skill.feedback}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#f1c6dd] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fffafd]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-95"
            >
              Save Skills
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

AssignSkillModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

function ViewPerformanceModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      <div className="bg-white">
        <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 py-6">
          <h2 className="text-xl font-bold text-white">View Performance</h2>
          <p className="text-sm text-white/80 mt-1">Detailed performance metrics and analytics</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Select Staff</label>
            <select className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10">
              <option>Choose a staff member...</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a88a9f]">Total Bookings</p>
              <p className="text-[20px] font-bold text-[#ea4f93] mt-1">156</p>
              <p className="text-[10px] text-[#a88a9f] mt-1">This month</p>
            </div>
            <div className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a88a9f]">Revenue</p>
              <p className="text-[20px] font-bold text-[#ea4f93] mt-1">$8,240</p>
              <p className="text-[10px] text-[#a88a9f] mt-1">This month</p>
            </div>
            <div className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a88a9f]">Avg Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[20px] font-bold text-[#ea4f93]">4.8</p>
                <Star size={16} fill="#fbbf24" className="text-[#fbbf24]" />
              </div>
              <p className="text-[10px] text-[#a88a9f] mt-1">From 124 reviews</p>
            </div>
            <div className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a88a9f]">No-Shows</p>
              <p className="text-[20px] font-bold text-[#ea4f93] mt-1">3</p>
              <p className="text-[10px] text-[#a88a9f] mt-1">This month</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#f1c6dd] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fffafd]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

ViewPerformanceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

function TransferStaffModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={540}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      <div className="bg-white">
        <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 py-6">
          <h2 className="text-xl font-bold text-white">Transfer Staff</h2>
          <p className="text-sm text-white/80 mt-1">Move staff to another branch or shift</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Select Staff to Transfer</label>
            <select className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10">
              <option>Choose a staff member...</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Select Target Branch</label>
            <select className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10">
              <option>Main Salon (Downtown)</option>
              <option>West End Branch</option>
              <option>East Side Location</option>
              <option>North Mall Salon</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Effective Date</label>
            <input type="date" className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10" />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a88a9f] block mb-2">Reason for Transfer</label>
            <textarea className="w-full rounded-[20px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3 text-sm text-[#2d1b35] focus:outline-none focus:ring-2 focus:ring-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10" rows={3} placeholder="Enter reason for transfer..." />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#f1c6dd] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fffafd]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-95"
            >
              Confirm Transfer
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

TransferStaffModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

function InsightStrip() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <PremiumCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffedd5] to-[#d69e2e] text-white">
            <Star size={18} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a88a9f]">
              Top Performer
            </p>
            <p className="truncate text-sm font-bold text-[#2d1b35]">{TOP_PERFORMER.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#ea4f93]">{TOP_PERFORMER.stats.rating}</p>
            <p className="text-[10px] text-[#a88a9f]">{TOP_PERFORMER.stats.bookings} bookings</p>
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
            <p className="text-sm font-bold text-[#2d1b35]">Low Rating Alerts</p>
            <p className="text-[11px] text-[#a88a9f]">Needs attention</p>
          </div>
        </div>
        <div className="space-y-2">
          {LOW_RATING_ALERTS.slice(0, 2).map((alert) => (
            <div key={alert.name} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="truncate font-medium text-[#2d1b35]">{alert.name}</span>
              <span className="shrink-0 font-bold text-[#ea4f93]">{alert.rating}</span>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}

function pickField(entry, keys) {
  for (const key of keys) {
    if (entry?.[key] !== undefined && entry[key] !== null && entry[key] !== "") {
      return entry[key];
    }
  }
  return null;
}

function mapSchedulesToTimeline(artists, schedules, startOfWeekDate) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  return artists.map((artist) => {
    // Initialize days with "Off"
    const days = {
      Mon: { status: "Off" },
      Tue: { status: "Off" },
      Wed: { status: "Off" },
      Thu: { status: "Off" },
      Fri: { status: "Off" },
      Sat: { status: "Off" },
      Sun: { status: "Off" },
    };

    // Filter schedules for this artist
    const artistSchedules = schedules.filter(s => {
      const scheduleArtistId = s.artistId || s.nailArtistId || s.staffId || s.userId || s.user?.id;
      return String(scheduleArtistId) === String(artist.id);
    });

    artistSchedules.forEach((schedule) => {
      const dateVal = schedule.date || schedule.workDate || schedule.scheduleDate || schedule.day;
      if (!dateVal) return;

      const scheduleDate = dayjs(dateVal);
      const rawDay = scheduleDate.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dayKey = rawDay === 0 ? "Sun" : dayNames[rawDay - 1];

      const startVal = schedule.startTime || schedule.start || schedule.from || schedule.checkIn;
      const endVal = schedule.endTime || schedule.end || schedule.to || schedule.checkOut;
      const statusVal = schedule.status || schedule.scheduleStatus || "Active";

      if (statusVal.toLowerCase() === "off" || statusVal.toLowerCase() === "leave" || !startVal || !endVal) {
        days[dayKey] = { status: "Off" };
      } else {
        const parseTimeToHours = (timeStr) => {
          if (!timeStr) return 9;
          const parts = String(timeStr).split(":");
          const hour = parseInt(parts[0], 10);
          const min = parts[1] ? parseInt(parts[1], 10) : 0;
          return hour + min / 60;
        };

        const startHour = parseTimeToHours(startVal);
        const endHour = parseTimeToHours(endVal);

        const formatTime = (hourVal) => {
          const h = Math.floor(hourVal);
          const m = Math.round((hourVal - h) * 60);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        days[dayKey] = {
          status: statusVal,
          start: startHour,
          end: endHour,
          label: `${formatTime(startHour)} - ${formatTime(endHour)}`,
        };
      }
    });

    return {
      id: artist.id,
      name: artist.name,
      avatarTone: artist.avatarTone || "from-[#ff8ebb] to-[#ea4f93]",
      avatarUrl: artist.avatarUrl,
      status: artist.status,
      days,
    };
  });
}

function TimelineSchedule({ 
  weeklySchedules, 
  loading, 
  selectedDayTab, 
  setSelectedDayTab,
  monday,
  sunday,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = monday.add(i, 'day');
      days.push({
        key: dayNames[i],
        label: dayNames[i],
        dateStr: d.format("MMM DD"),
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

      <div className="mb-6 flex flex-wrap gap-1.5 bg-[#fff0f6]/50 p-1 rounded-xl w-fit">
        {weekDays.map((day) => {
          const isActive = selectedDayTab === day.key;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDayTab(day.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#ea4f93] text-white shadow-sm"
                  : "text-[#7f6478] hover:bg-[#fff0f6]"
              }`}
            >
              {day.label} ({day.dateStr})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" tip="Loading schedules..." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="flex border-b border-[#f1e7ed] pb-4">
              <div className="w-48 shrink-0" />
              {hours.map((hour) => (
                <div key={hour} className="flex-1 text-center text-[11px] font-semibold text-[#a88a9f]">
                  {hour}:00
                </div>
              ))}
            </div>

            {weeklySchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-semibold text-[#5c4559]">No staff schedules found</p>
                <p className="mt-1 text-xs text-[#a88a9f]">There are no schedules registered for this week</p>
              </div>
            ) : (
              weeklySchedules.map((staff) => {
                const dayData = staff.days[selectedDayTab];
                const isOff = !dayData || dayData.status === "Off";
                
                return (
                  <div key={staff.id} className="flex py-4 border-b border-[#f1e7ed] last:border-0 items-center">
                    <div className="w-48 shrink-0 flex items-center gap-3 pr-4">
                      {staff.avatarUrl ? (
                        <img
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          src={staff.avatarUrl}
                          alt={staff.name}
                          className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-2 ring-[#fff5fa]"
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${staff.avatarTone} text-[12px] font-bold text-white`}
                        >
                          {getStaffInitials(staff.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#2d1b35] truncate">{staff.name}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${SCHEDULE_STATUS_STYLES[staff.status] || "bg-gray-100 text-gray-600"}`}>
                          {staff.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 relative h-12 bg-[#fffafd] rounded-[14px] overflow-hidden flex items-center">
                      {isOff ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
                          <span className="text-[11px] font-semibold text-[#a88a9f]">Day Off</span>
                        </div>
                      ) : (() => {
                        const { start, end, label } = dayData;
                        const startPercent = Math.max(0, Math.min(100, ((start - 8) / 12) * 100));
                        const widthPercent = Math.max(0, Math.min(100 - startPercent, ((end - start) / 12) * 100));

                        return (
                          <div
                            className="absolute top-1 bottom-1 rounded-[8px] bg-gradient-to-r from-[#ff8ebb]/20 to-[#ea4f93]/30 border border-[#ea4f93]/30 flex items-center justify-center"
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`
                            }}
                          >
                            <span className="text-[10px] font-bold text-[#ea4f93] whitespace-nowrap px-2">
                              {label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
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
};

export function StaffManagementPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewingStaff, setViewingStaff] = useState(null);
  const [viewingStaffDetail, setViewingStaffDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [isAssignSkillModalOpen, setIsAssignSkillModalOpen] = useState(false);
  const [isViewPerformanceModalOpen, setIsViewPerformanceModalOpen] = useState(false);
  const [isTransferStaffModalOpen, setIsTransferStaffModalOpen] = useState(false);
  const [staffArtists, setStaffArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState("Mon");
  
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

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setLoadingSchedules(true);
        const startStr = monday.format("YYYY-MM-DDT00:00:00");
        const endStr = sunday.format("YYYY-MM-DDT23:59:59");
        const data = await fetchSchedules({
          startDate: startStr,
          endDate: endStr,
          pageSize: 200
        });
        setSchedules(data || []);
      } catch (err) {
        console.error("Failed to load schedules:", err);
      } finally {
        setLoadingSchedules(false);
      }
    };
    loadSchedules();
  }, [monday, sunday]);

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

  const weeklySchedules = useMemo(() => {
    return mapSchedulesToTimeline(staffArtists, schedules, monday);
  }, [staffArtists, schedules, monday]);


  const mapApiArtistToUiFormat = (apiArtist) => {
    console.log("Mapping API artist:", apiArtist);
    return {
      id: apiArtist.staffId || apiArtist.userId || apiArtist.id || `artist-${Math.random()}`,
      name: `${apiArtist.firstName || ""} ${apiArtist.lastName || ""}`.trim() || "Unnamed Artist",
      role: apiArtist.role || "Nail Artist",
      rating: apiArtist.averageRating || 4.5,
      status: apiArtist.status || "Active",
      skills: [],
      stats: {
        today: 0,
        month: 0,
        revenue: "$0",
      },
      avatarTone: "from-[#ff8ebb] to-[#ea4f93]",
      avatarUrl: apiArtist.avatarUrl || "",
      email: apiArtist.email || "",
      phone: apiArtist.phone || "",
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
        const data = await fetchNailArtists();
        const mappedData = Array.isArray(data)
          ? data.map(mapApiArtistToUiFormat)
          : [];
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

  const filteredStaff = useMemo(
    () => {
      let filtered = filterStaffByStatus(staffArtists, activeFilter);
      
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
    [staffArtists, activeFilter, query],
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
      value: staffArtists.length,
      icon: Users,
      tone: "bg-[#ffe8f2] text-[#ea4f93]",
    },
    {
      label: "Active Today",
      value: staffArtists.filter((s) => s.status === "Active").length,
      icon: CheckCircle2,
      tone: "bg-[#eaf9ee] text-[#2fa25f]",
    },
    {
      label: "Average Rating",
      value: staffArtists.length > 0 
        ? (staffArtists.reduce((acc, s) => acc + s.rating, 0) / staffArtists.length).toFixed(1)
        : "0",
      icon: Star,
      tone: "bg-[#fff0dd] text-[#db8520]",
    },
    {
      label: "Completed Services",
      value: staffArtists.reduce((acc, s) => acc + s.stats.month, 0),
      icon: CalendarDays,
      tone: "bg-[#e7ecff] text-[#4755b8]",
    },
  ], [staffArtists]);

  const handlePageChange = (newPage) => setCurrentPage(newPage);

  const getActionHandler = (label) => {
    switch (label) {
      case "Edit Schedule": return () => setIsEditScheduleModalOpen(true);
      case "Assign Skill": return () => setIsAssignSkillModalOpen(true);
      case "View Performance": return () => setIsViewPerformanceModalOpen(true);
      case "Transfer Staff": return () => setIsTransferStaffModalOpen(true);
      default: return () => {};
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
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-5">
            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {summaryStats.map((stat) => (
                  <PremiumCard key={stat.label} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                        <stat.icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl font-bold text-[#2d1b35]">{stat.value}</p>
                        <p className="truncate text-[11px] text-[#8b7382]">{stat.label}</p>
                      </div>
                    </div>
                  </PremiumCard>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp}>
              <InsightStrip />
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2">
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
                    className="inline-flex items-center gap-2 rounded-xl border border-[#f1c6dd] bg-white px-4 py-2 text-[11px] font-semibold text-[#ea4f93] transition hover:bg-[#fffafd] active:scale-[0.98]"
                  >
                    <Icon size={14} />
                    {action.label}
                  </button>
                );
              })}
              <Link
                to={ROUTES.managerStaffArtistsCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_6px_16px_rgba(234,79,147,0.2)] transition hover:opacity-95 active:scale-[0.98]"
              >
                <UserPlus size={14} />
                Add Staff Artist
              </Link>
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
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              isActive
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
                      className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                        query.trim() || selectedDate || activeFilter !== "All"
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
                              onView={(selectedStaff) => {
                                setViewingStaff(selectedStaff);
                                fetchArtistDetail(selectedStaff.id);
                              }}
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
                selectedDayTab={selectedDayTab}
                setSelectedDayTab={setSelectedDayTab}
                monday={monday}
                sunday={sunday}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onCurrentWeek={handleCurrentWeek}
              />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <PremiumCard className="p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionHeading
                    title="Performance Overview"
                    subtitle="Top performers this month"
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
                  {PERFORMANCE_OVERVIEW.map((item) => (
                    <div
                      key={item.name}
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
                  ))}
                </div>
              </PremiumCard>
            </motion.div>
        </motion.div>
      )}

      <StaffDetailModal
        staff={viewingStaff}
        onClose={() => setViewingStaff(null)}
        loading={loadingDetail}
      />
      <EditScheduleModal
        open={isEditScheduleModalOpen}
        onClose={() => setIsEditScheduleModalOpen(false)}
      />
      <AssignSkillModal
        open={isAssignSkillModalOpen}
        onClose={() => setIsAssignSkillModalOpen(false)}
      />
      <ViewPerformanceModal
        open={isViewPerformanceModalOpen}
        onClose={() => setIsViewPerformanceModalOpen(false)}
      />
      <TransferStaffModal
        open={isTransferStaffModalOpen}
        onClose={() => setIsTransferStaffModalOpen(false)}
      />
    </section>
  );
}
