import { Modal } from "antd";
import {
  ArrowRightLeft,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  Mail,
  Phone,
  Star,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES, getManagerStaffUpdateRoute } from "../../../../shared/constants/routes";
import {
  LOW_RATING_ALERTS,
  PERFORMANCE_OVERVIEW,
  QUICK_ACTIONS,
  SCHEDULE_DAY_KEYS,
  SCHEDULE_STATUS_STYLES,
  STAFF_ALERTS,
  STAFF_ARTISTS,
  STAFF_FILTER_TABS,
  STAFF_MINI_STATS,
  STAFF_ON_LEAVE,
  STAFF_STATUS_STYLES,
  STAFF_SUMMARY_STATS,
  TOP_PERFORMER,
  WEEKLY_SCHEDULE,
  WORKLOAD_BALANCE,
  filterStaffByStatus,
  getStaffInitials,
} from "../services/mockStaffArtists";

const SUMMARY_ICON_MAP = {
  users: Users,
  check: CheckCircle2,
  star: Star,
  clipboard: ClipboardList,
};

const ACTION_ICON_MAP = {
  calendar: CalendarDays,
  award: Award,
  chart: BarChart3,
  arrow: ArrowRightLeft,
};

// ── Shared components ─────────────────────────────────────────────────────────

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[18px] border border-[#f8deea] bg-white p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

function SummaryStatCard({ item }) {
  const Icon = SUMMARY_ICON_MAP[item.icon] ?? Users;

  return (
    <Card className="p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.iconClassName}`}>
        <Icon size={16} />
      </div>
      <p className="mt-3 text-[1.65rem] font-extrabold leading-none text-[#3b2241]">{item.value}</p>
      <p className="mt-2 text-[13px] font-semibold text-[#7f6478]">{item.label}</p>
    </Card>
  );
}

SummaryStatCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    iconClassName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

// ── Staff Detail Modal (Ant Design) ──────────────────────────────────────────

function StaffDetailModal({ staff, onClose }) {
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
      {staff && (
        <>
          {/* Pink gradient header */}
          <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 pt-6 pb-10">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${staff.avatarTone} ring-4 ring-white/40 text-xl font-black text-white shadow-lg`}
              >
                {getStaffInitials(staff.name)}
              </div>
              <div>
                <h2 className="text-[20px] font-black text-white">{staff.name}</h2>
                <p className="text-[12px] font-semibold text-white/80">{staff.role}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STAFF_STATUS_STYLES[staff.status]}`}>
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

          {/* Body */}
          <div className="-mt-6 space-y-4 rounded-[24px] bg-white px-6 pt-6 pb-6">
            {/* Booking & Revenue stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Today", value: staff.stats?.today ?? "—", sub: "bookings" },
                { label: "This Month", value: staff.stats?.month ?? "—", sub: "bookings" },
                { label: "Revenue", value: staff.stats?.revenue ?? "—", sub: "total" },
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  className="rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-3 py-3 text-center"
                >
                  <p className="text-[18px] font-black text-[#ea4f93]">{value}</p>
                  <p className="text-[10px] font-bold text-[#c08aa4]">{label}</p>
                  <p className="text-[9px] text-[#d4afc0]">{sub}</p>
                </div>
              ))}
            </div>

            {/* Extended metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[14px] border border-[#f8deea] bg-[#fff6fb] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Avg / Work Day</p>
                <p className="mt-1 text-[16px] font-black text-[#3f2240]">{avgPerDay}</p>
                <p className="text-[9px] text-[#d4afc0]">bookings per day</p>
              </div>
              <div className="rounded-[14px] border border-[#f8deea] bg-[#fff6fb] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Rating</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Star size={14} fill="#fbbf24" className="text-[#fbbf24]" />
                  <p className="text-[16px] font-black text-[#3f2240]">{staff.rating?.toFixed(1) ?? "—"}</p>
                </div>
                <p className="text-[9px] text-[#d4afc0]">customer rating</p>
              </div>
            </div>

            {/* Contact */}
            {(staff.email || staff.phone) && (
              <div className="space-y-2 rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Contact</p>
                {staff.email && (
                  <div className="flex items-center gap-2 text-[12px] text-[#7a6176]">
                    <Mail size={12} className="text-[#ea4f93]" />
                    <span>{staff.email}</span>
                  </div>
                )}
                {staff.phone && (
                  <div className="flex items-center gap-2 text-[12px] text-[#7a6176]">
                    <Phone size={12} className="text-[#ea4f93]" />
                    <span>{staff.phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* Skills */}
            {staff.skills?.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">
                  Skills & Specialties
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {staff.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#ffe7ef] px-3 py-1 text-[11px] font-bold text-[#ea4f93]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Link
                to={getManagerStaffUpdateRoute(staff.id)}
                className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-90"
              >
                Edit Profile
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[#f4c1d8] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
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
};

// ── StaffArtistCard (with View button) ───────────────────────────────────────

function StaffArtistCard({ staff, onView }) {
  return (
    <div className="rounded-[16px] border border-[#f8deea] bg-[#fffafb] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${staff.avatarTone} text-xs font-bold text-white`}
        >
          {getStaffInitials(staff.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-[#402542]">{staff.name}</p>
          <p className="text-xs text-[#c08aa4]">{staff.role}</p>
          <div className="mt-1 flex items-center gap-1 text-[#fbbf24]">
            <Star size={12} fill="currentColor" />
            <span className="text-xs font-bold text-[#ea4f93]">{staff.rating.toFixed(1)}</span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STAFF_STATUS_STYLES[staff.status]}`}
        >
          {staff.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {staff.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[#ffe7ef] px-2 py-0.5 text-[9px] font-bold text-[#ea4f93]"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          [staff.stats.today, "Today's Bookings"],
          [staff.stats.month, "This Month"],
          [staff.stats.revenue, "Revenue"],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="text-sm font-extrabold text-[#402542]">{value}</p>
            <p className="mt-0.5 text-[9px] text-[#c08aa4]">{label}</p>
          </div>
        ))}
      </div>

      {/* View + Edit buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onView(staff)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#f4c1d8] bg-white py-2 text-xs font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
        >
          <Eye size={12} />
          View
        </button>
        <Link
          to={getManagerStaffUpdateRoute(staff.id)}
          className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2 text-xs font-bold text-white shadow-[0_6px_14px_rgba(234,79,147,0.18)] transition hover:opacity-90"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  );
}

StaffArtistCard.propTypes = {
  staff: PropTypes.shape({
    avatarTone: PropTypes.string.isRequired,
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
  }).isRequired,
  onView: PropTypes.func.isRequired,
};

function ScheduleCell({ value }) {
  if (value === "Off") {
    return <span className="text-[11px] text-[#c08aa4]">Off</span>;
  }

  return (
    <span className="inline-block rounded-md bg-[#ffe7ef] px-2 py-1 text-[10px] font-bold text-[#ea4f93]">
      {value}
    </span>
  );
}

ScheduleCell.propTypes = {
  value: PropTypes.string.isRequired,
};

// ── Quick Action Modals ─────────────────────────────────────────────────────

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
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 py-6">
          <h2 className="text-xl font-extrabold text-white">Edit Schedule</h2>
          <p className="text-sm text-white/80 mt-1">Update staff working hours and breaks</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Select Staff */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Select Staff</label>
            <select className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]">
              <option>Choose a staff member...</option>
              {STAFF_ARTISTS.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
            </select>
          </div>

          {/* Weekday Select */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Day</label>
            <div className="grid grid-cols-7 gap-2">
              {SCHEDULE_DAY_KEYS.map(day => (
                <button key={day} type="button" className="py-2 rounded-lg border border-[#f4c1d8] text-xs font-bold text-[#c08aa4] hover:bg-[#fff7fb] hover:text-[#ea4f93]">
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Start Time</label>
              <input type="time" className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">End Time</label>
              <input type="time" className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]" />
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Break Duration</label>
            <select className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]">
              <option>30 minutes</option>
              <option>45 minutes</option>
              <option>1 hour</option>
              <option>1.5 hours</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#f4c1d8] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-90"
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
    setSkills(skills.map(skill => 
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
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10"/>
                <path d="M18 20V4"/>
                <path d="M6 20v-4"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#3f2240]">Skills & Specialties</h2>
              <p className="text-sm text-[#c08aa4] mt-1">Đánh giá kỹ năng theo từng hạng mục (Level 1-5)</p>
            </div>
          </div>
          <select className="rounded-2xl border border-[#f4c1d8] bg-[#f8f4f8] px-5 py-2.5 text-sm font-bold text-[#6b5b73] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Expert</option>
          </select>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Select Staff */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Select Staff</label>
            <select className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]">
              <option>Choose a staff member...</option>
              {STAFF_ARTISTS.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
            </select>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-2 gap-4">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-2xl border border-[#fde2f3] bg-[#fffafc] p-5 shadow-[0_4px_20px_rgba(234,79,147,0.08)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#3f2240]">{skill.name}</h3>
                    <span className="text-sm font-semibold text-[#c08aa4]">{skill.vietnamese}</span>
                  </div>
                  <span className="rounded-full bg-[#ffe7ef] px-3 py-1 text-xs font-extrabold text-[#ea4f93]">
                    Level {skill.level}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => updateSkillLevel(skill.id, level)}
                    >
                      <div 
                        className={`w-full h-3 rounded-full transition-all duration-200 ${level <= skill.level ? 'bg-[#ea4f93]' : 'bg-[#f8e8f2] hover:bg-[#f5cde0]'}`} 
                      />
                      <span className={`text-xs font-bold ${level <= skill.level ? 'text-[#ea4f93]' : 'text-[#c08aa4]'}`}>{level}</span>
                    </button>
                  ))}
                </div>

                {/* Feedback */}
                <p className="text-sm font-semibold text-[#ea4f93]">{skill.feedback}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#f4c1d8] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-90"
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
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 py-6">
          <h2 className="text-xl font-extrabold text-white">View Performance</h2>
          <p className="text-sm text-white/80 mt-1">Detailed performance metrics and analytics</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Select Staff */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Select Staff</label>
            <select className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]">
              <option>Choose a staff member...</option>
              {STAFF_ARTISTS.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
            </select>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Total Bookings</p>
              <p className="text-[20px] font-extrabold text-[#ea4f93] mt-1">156</p>
              <p className="text-[10px] text-[#c08aa4] mt-1">This month</p>
            </div>
            <div className="rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Revenue</p>
              <p className="text-[20px] font-extrabold text-[#ea4f93] mt-1">$8,240</p>
              <p className="text-[10px] text-[#c08aa4] mt-1">This month</p>
            </div>
            <div className="rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Avg Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[20px] font-extrabold text-[#ea4f93]">4.8</p>
                <Star size={16} fill="#fbbf24" className="text-[#fbbf24]" />
              </div>
              <p className="text-[10px] text-[#c08aa4] mt-1">From 124 reviews</p>
            </div>
            <div className="rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">No-Shows</p>
              <p className="text-[20px] font-extrabold text-[#ea4f93] mt-1">3</p>
              <p className="text-[10px] text-[#c08aa4] mt-1">This month</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#f4c1d8] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
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
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 py-6">
          <h2 className="text-xl font-extrabold text-white">Transfer Staff</h2>
          <p className="text-sm text-white/80 mt-1">Move staff to another branch or shift</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Select Staff */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Select Staff to Transfer</label>
            <select className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]">
              <option>Choose a staff member...</option>
              {STAFF_ARTISTS.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
            </select>
          </div>

          {/* Select Branch */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Select Target Branch</label>
            <select className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]">
              <option>Main Salon (Downtown)</option>
              <option>West End Branch</option>
              <option>East Side Location</option>
              <option>North Mall Salon</option>
            </select>
          </div>

          {/* Effective Date */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Effective Date</label>
            <input type="date" className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]" />
          </div>

          {/* Reason */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] block mb-2">Reason for Transfer</label>
            <textarea className="w-full rounded-xl border border-[#f8deea] bg-[#fffafb] px-4 py-2.5 text-sm text-[#402542] focus:outline-none focus:ring-2 focus:ring-[#ea4f93]" rows={3} placeholder="Enter reason for transfer..." />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#f4c1d8] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-90"
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

// ── Main page ─────────────────────────────────────────────────────────────────

export function StaffManagementPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewingStaff, setViewingStaff] = useState(null);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [isAssignSkillModalOpen, setIsAssignSkillModalOpen] = useState(false);
  const [isViewPerformanceModalOpen, setIsViewPerformanceModalOpen] = useState(false);
  const [isTransferStaffModalOpen, setIsTransferStaffModalOpen] = useState(false);

  const filteredStaff = useMemo(
    () => filterStaffByStatus(STAFF_ARTISTS, activeFilter),
    [activeFilter],
  );

  // Helper to find action by label
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
    <section className="flex min-h-full flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAFF_SUMMARY_STATS.map((item) => (
          <SummaryStatCard key={item.label} item={item} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = ACTION_ICON_MAP[action.icon] ?? CalendarDays;
          const handler = getActionHandler(action.label);

          return (
            <button
              key={action.label}
              type="button"
              onClick={handler}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_8px_18px_rgba(236,72,153,0.06)] transition hover:bg-[#fff7fb]"
            >
              <Icon size={14} />
              {action.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading
                title="Staff Artist Management"
                subtitle="Manage staff schedules, skills, ratings, and performance"
              />
              <Link
                to={ROUTES.managerStaffArtistsCreate}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#ea4f93] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:bg-[#df4588]"
              >
                <UserPlus size={14} />
                Add Staff Artist
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {STAFF_MINI_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-2.5 text-center"
                >
                  <p className="text-lg font-extrabold text-[#ea4f93]">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] text-[#c08aa4]">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {STAFF_FILTER_TABS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={
                    activeFilter === filter
                      ? "rounded-full bg-[#ea4f93] px-4 py-1.5 text-[11px] font-bold text-white"
                      : "rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-1.5 text-[11px] font-bold text-[#c08aa4]"
                  }
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStaff.map((staff) => (
                <StaffArtistCard
                  key={staff.id}
                  staff={staff}
                  onView={setViewingStaff}
                />
              ))}
            </div>

            {filteredStaff.length === 0 ? (
              <div className="mt-5 rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-8 text-center text-sm text-[#8a7082]">
                No staff artists matched the current filter.
              </div>
            ) : null}
          </Card>

          <Card className="p-0">
            <div className="flex flex-col gap-3 border-b border-[#f6dce7] p-5 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading title="Weekly Schedule" />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-1.5 text-[11px] font-bold text-[#ea4f93]"
              >
                <CalendarDays size={12} />
                This Week
              </button>
            </div>
            <div className="overflow-x-auto p-5 pt-0">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-[#f6dce7] bg-[#fffafd] text-[10px] uppercase tracking-[0.14em] text-[#c693ad]">
                    <th className="px-3 py-3">Staff</th>
                    {SCHEDULE_DAY_KEYS.map((day) => (
                      <th key={day} className="px-2 py-3 text-center">
                        {day}
                      </th>
                    ))}
                    <th className="px-3 py-3">Break</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKLY_SCHEDULE.map((row) => (
                    <tr key={row.name} className="border-b border-[#fbe7ef] last:border-b-0">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.avatarTone} text-[9px] font-bold text-white`}
                          >
                            {getStaffInitials(row.name)}
                          </div>
                          <span className="text-sm font-semibold text-[#402542]">{row.name}</span>
                        </div>
                      </td>
                      {SCHEDULE_DAY_KEYS.map((day) => (
                        <td key={day} className="px-2 py-3 text-center">
                          <ScheduleCell value={row.days[day]} />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-xs text-[#7a6176]">{row.break}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${SCHEDULE_STATUS_STYLES[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading title="Performance Overview" />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-1.5 text-[11px] font-bold text-[#ea4f93]"
              >
                <TrendingUp size={12} />
                This Month
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {PERFORMANCE_OVERVIEW.map((item) => (
                <div
                  key={item.name}
                  className="rounded-[16px] border border-[#f8deea] bg-[#fffafb] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${item.avatarTone} text-[10px] font-bold text-white`}
                    >
                      {getStaffInitials(item.name)}
                    </div>
                    <div>
                      <p className="font-extrabold text-[#402542]">{item.name}</p>
                      <p className="text-xs text-[#c08aa4]">{item.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      [item.metrics.completed, "Completed Bookings"],
                      [item.metrics.rating, "Avg Rating"],
                      [item.metrics.revenue, "Revenue"],
                      [item.metrics.satisfaction, "Satisfaction"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-[12px] border border-[#f8deea] bg-white px-3 py-2"
                      >
                        <p className="text-sm font-extrabold text-[#ea4f93]">{value}</p>
                        <p className="mt-0.5 text-[9px] text-[#c08aa4]">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[12px] border border-[#f8deea] bg-white p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c08aa4]">
                      Testimonial
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[#7a6176]">
                      &ldquo;{item.testimonial}&rdquo;
                    </p>
                    <p className="mt-2 text-[11px] font-bold text-[#ea4f93]">— {item.client}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Star size={16} className="text-[#f59e0b]" fill="#f59e0b" />
              <SectionHeading title="Top Performer" />
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br p-1 ring-4 ring-[#f3ebff]">
                <div
                  className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${TOP_PERFORMER.avatarTone} text-lg font-bold text-white`}
                >
                  {getStaffInitials(TOP_PERFORMER.name)}
                </div>
              </div>
              <p className="mt-4 font-extrabold text-[#402542]">{TOP_PERFORMER.name}</p>
              <p className="text-xs text-[#c08aa4]">{TOP_PERFORMER.role}</p>
              <div className="mt-3 rounded-full bg-gradient-to-r from-[#fef3c7] via-[#fde68a] to-[#fbbf24] px-4 py-1.5 text-[10px] font-bold text-[#92400e]">
                {TOP_PERFORMER.badge}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  [TOP_PERFORMER.stats.bookings, "Bookings"],
                  [TOP_PERFORMER.stats.rating, "Rating"],
                  [TOP_PERFORMER.stats.revenue, "Revenue"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-2 py-2">
                    <p className="text-sm font-extrabold text-[#ea4f93]">{value}</p>
                    <p className="text-[9px] text-[#c08aa4]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock3 size={16} className="text-[#ea4f93]" />
              <SectionHeading title="Staff On Leave" />
            </div>
            <div className="space-y-3">
              {STAFF_ON_LEAVE.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${item.avatarTone} text-[9px] font-bold text-white`}
                    >
                      {getStaffInitials(item.name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#402542]">{item.name}</p>
                      <p className="text-[10px] text-[#c08aa4]">{item.dates}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#ffe6ec] px-2 py-0.5 text-[10px] font-bold text-[#e1447f]">
                    {item.days}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Star size={16} className="text-[#e1447f]" />
              <SectionHeading title="Low Rating Alert" />
            </div>
            <div className="space-y-3">
              {LOW_RATING_ALERTS.map((alert) => (
                <div
                  key={alert.name}
                  className="rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#402542]">{alert.name}</p>
                    <span className="text-xs font-bold text-[#ea4f93]">{alert.rating} ★</span>
                  </div>
                  <p className={`mt-1 text-[11px] ${alert.tone}`}>{alert.message}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Staff Alerts" subtitle="Ratings needing attention" />
            <div className="mt-4 space-y-3">
              {STAFF_ALERTS.map((alert) => (
                <div
                  key={alert.name}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-bold text-[#402542]">{alert.name}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${alert.tone}`}>
                      {alert.message}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#ea4f93]">{alert.rating}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Workload Balance" />
            <div className="mt-4 space-y-4">
              {WORKLOAD_BALANCE.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.avatarTone} text-[9px] font-bold text-white`}
                  >
                    {getStaffInitials(item.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#402542]">{item.name}</span>
                      <span className="font-bold text-[#ea4f93]">{item.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#fbe1ec]">
                      <div
                        className="h-full rounded-full bg-[#ea4f93]"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {/* Staff Detail Modal */}
      <StaffDetailModal
        staff={viewingStaff}
        onClose={() => setViewingStaff(null)}
      />

      {/* Quick Action Modals */}
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