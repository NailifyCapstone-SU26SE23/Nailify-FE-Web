import { Modal } from "antd";
import {
  ArrowRightLeft,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  Download,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTES, getAdminStaffUpdateRoute } from "../../../../shared/constants/routes";
import {
  STAFF_FILTER_OPTIONS,
  STAFF_LEAVE_LIST,
  STAFF_LOW_RATING_ALERTS,
  STAFF_MODAL_STYLES,
  STAFF_QUICK_ACTIONS,
  STAFF_SUMMARY,
  STAFF_TOP_PERFORMERS,
  getStaffListWithUpdates,
  getStaffInitials,
  matchesStaffFilter,
} from "../services/mockStaff";
import { PropTypes } from "../../../../shared/utils/propTypes";

const SUMMARY_ICON_MAP = {
  briefcase: BriefcaseBusiness,
  calendarClock: CalendarClock,
  shieldCheck: ShieldCheck,
  sparkles: Sparkles,
  users: Users,
};

const QUICK_ACTION_ICON_MAP = {
  arrowRightLeft: ArrowRightLeft,
  barChart: BarChart3,
  briefcase: BriefcaseBusiness,
  calendarClock: CalendarClock,
  clock: Clock3,
  plus: Plus,
};

function CloseIconButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

CloseIconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

function StatCard({ item }) {
  const Icon = SUMMARY_ICON_MAP[item.icon] ?? Users;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br ${item.accent} p-4 shadow-[0_18px_35px_rgba(226,93,143,0.08)]`}
    >
      <div className="absolute right-[-12px] top-[-12px] h-12 w-12 rounded-full bg-white/45" />
      <div className={`mb-4 flex h-8 w-8 items-center justify-center rounded-lg ${item.iconBg}`}>
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <p className="text-[30px] font-bold leading-none text-slate-800">{item.title}</p>
      <p className="mt-2 text-[12px] font-semibold text-slate-500">{item.label}</p>
      <p className={`mt-1 text-[11px] font-semibold ${item.noteColor}`}>{item.note}</p>
    </div>
  );
}

StatCard.propTypes = {
  item: PropTypes.shape({
    accent: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    iconBg: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    noteColor: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
};

function AvatarBadge({ member }) {
  if (member.image) {
    return (
      <img
        src={member.image}
        alt={member.name}
        className="h-14 w-14 rounded-full object-cover shadow-sm"
      />
    );
  }

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${member.avatarTone} text-[18px] font-black text-white shadow-sm`}
    >
      {member.initials}
    </div>
  );
}

AvatarBadge.propTypes = {
  member: PropTypes.shape({
    avatarTone: PropTypes.string,
    image: PropTypes.string,
    initials: PropTypes.string,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

function StaffProfileCard({ member, onEdit, onTransfer }) {
  return (
    <div className="rounded-[20px] border border-rose-100/80 bg-white p-4 shadow-[0_12px_28px_rgba(226,93,143,0.07)]">
      <div className="flex flex-col items-center text-center">
        <AvatarBadge member={member} />
        <h3 className="mt-3 text-[15px] font-black text-slate-800">{member.name}</h3>
        <p className="text-[10px] font-semibold text-slate-400">
          {member.role} · #{member.id}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {member.tags.map((tag) => (
          <span
            key={`${member.id}-${tag.label}`}
            className={`rounded-full px-2 py-1 text-[9px] font-bold ${tag.tone}`}
          >
            {tag.label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#fff7fa] px-3 py-3 text-center">
        <div>
          <p className="text-[16px] font-black text-slate-800">{member.rating}</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Rating
          </p>
        </div>
        <div>
          <p className="text-[16px] font-black text-slate-800">{member.bookings}</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Bookings
          </p>
        </div>
        <div>
          <p className="text-[16px] font-black text-slate-800">{member.retention}</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Retention
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] font-semibold text-slate-400">
        Current Salon: <span className="text-rose-400">{member.salon}</span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(member)}
          className="rounded-xl border border-rose-100 bg-[#fafafa] px-3 py-2.5 text-[10px] font-bold text-slate-600 transition hover:bg-rose-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onTransfer(member)}
          className="rounded-xl border border-rose-100 bg-[#fafafa] px-3 py-2.5 text-[10px] font-bold text-slate-600 transition hover:bg-rose-50"
        >
          Transfer
        </button>
      </div>
      <button
        type="button"
        className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#b57edc] to-[#9b6fd4] px-3 py-2.5 text-[10px] font-bold text-white shadow-[0_8px_18px_rgba(155,111,212,0.28)] transition hover:opacity-95"
      >
        Performance
      </button>
    </div>
  );
}

StaffProfileCard.propTypes = {
  member: PropTypes.shape({
    bookings: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    rating: PropTypes.string.isRequired,
    retention: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    salon: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        tone: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onTransfer: PropTypes.func.isRequired,
};

function QuickActionButton({ item, to }) {
  const Icon = QUICK_ACTION_ICON_MAP[item.icon] ?? Plus;

  const content = (
    <>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.text} transition group-hover:scale-110`}
      >
        <Icon size={16} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-700">{item.label}</p>
        <p className="text-[9px] font-medium text-slate-400">{item.desc}</p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group flex flex-col items-center gap-2 rounded-2xl border border-rose-50 bg-white px-3 py-4 text-center transition hover:border-rose-100 hover:shadow-[0_8px_20px_rgba(226,93,143,0.10)]"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="group flex flex-col items-center gap-2 rounded-2xl border border-rose-50 bg-white px-3 py-4 text-center transition hover:border-rose-100 hover:shadow-[0_8px_20px_rgba(226,93,143,0.10)]"
    >
      {content}
    </button>
  );
}

QuickActionButton.propTypes = {
  item: PropTypes.shape({
    bg: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  to: PropTypes.string,
};

function PerformerAvatar({ person }) {
  if (person.image) {
    return (
      <img
        src={person.image}
        alt={person.name}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${person.avatarTone} text-[9px] font-black text-white`}
    >
      {person.initials}
    </div>
  );
}

PerformerAvatar.propTypes = {
  person: PropTypes.shape({
    avatarTone: PropTypes.string,
    image: PropTypes.string,
    initials: PropTypes.string,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

export function StaffManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [staffList, setStaffList] = useState(getStaffListWithUpdates);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    setStaffList(getStaffListWithUpdates());
  }, [location.pathname]);

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filteredStaff = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return staffList.filter((member) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [member.name, member.role, member.salon, member.id]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesSearch && matchesStaffFilter(member, activeFilter);
    });
  }, [activeFilter, searchTerm, staffList]);

  const handleEditStaff = (member) => {
    navigate(getAdminStaffUpdateRoute(member.id));
  };

  const handleTransferStaff = (member) => {
    setSelectedStaff(member);
    setShowTransferModal(true);
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      {flashMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-700">
          {flashMessage}
        </div>
      ) : null}

      <header className="mb-5 flex flex-col gap-4 rounded-[28px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-slate-800">
            Staff Management
          </h1>
          <p className="text-[12px] font-medium text-slate-400">
            Manage staff artists, managers, schedules, and performance
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-full border border-rose-100 bg-[#fff6f9] px-4 py-2 shadow-inner shadow-rose-50">
            <Search size={14} className="text-rose-300" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-[12px] text-slate-500 outline-none placeholder:text-rose-200 sm:w-48"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <Download size={13} />
            Export
          </button>
          <Link
            to={ROUTES.adminStaffCreate}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Plus size={14} />
            Add Staff
          </Link>
        </div>
      </header>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STAFF_SUMMARY.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {STAFF_FILTER_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveFilter(option.key)}
                className={`rounded-full px-4 py-2 text-[11px] font-semibold transition ${
                  activeFilter === option.key
                    ? "bg-rose-500 text-white shadow-[0_6px_14px_rgba(226,93,143,0.28)]"
                    : "bg-white text-slate-500 hover:bg-rose-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <section className="rounded-[24px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-black text-slate-800">Featured Staff Profiles</h2>
                <p className="text-[11px] font-medium text-slate-400">
                  Top performers, managers, and active team members
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-[11px] font-bold text-rose-400 transition hover:text-rose-500"
              >
                View All Profiles
              </button>
            </div>

            {filteredStaff.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredStaff.map((member) => (
                  <StaffProfileCard
                    key={member.id}
                    member={member}
                    onEdit={handleEditStaff}
                    onTransfer={handleTransferStaff}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-6 py-10 text-center">
                <p className="text-[14px] font-bold text-slate-700">No staff matched your filters</p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Try another keyword or switch the active tab.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] border border-rose-100 bg-gradient-to-b from-[#f7e7fb] to-[#fff7fa] p-4 shadow-[0_18px_32px_rgba(226,93,143,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[13px] font-black text-slate-800">Quick Actions</h3>
              <span className="rounded-full border border-rose-100 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-rose-400">
                6 actions
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STAFF_QUICK_ACTIONS.map((item) => (
                <QuickActionButton
                  key={item.label}
                  item={item}
                  to={item.label === "Add Staff" ? ROUTES.adminStaffCreate : undefined}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_18px_32px_rgba(226,93,143,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                <Sparkles size={14} className="text-rose-500" />
                <span>Top Performing Staff</span>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-rose-500">
                This Month
              </span>
            </div>
            <div className="space-y-3">
              {STAFF_TOP_PERFORMERS.map((person) => (
                <div
                  key={person.name}
                  className="flex items-center gap-2.5 rounded-2xl border border-rose-50 px-3 py-2.5"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${person.color}`}
                  >
                    {person.rank}
                  </div>
                  <PerformerAvatar person={person} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-slate-700">{person.name}</p>
                    <p className="truncate text-[10px] font-medium text-slate-400">{person.meta}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-amber-500">
                    <Star size={11} fill="currentColor" strokeWidth={0} />
                    {person.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_18px_32px_rgba(226,93,143,0.08)]">
            <div className="mb-4 flex items-center gap-2 text-[12px] font-bold text-slate-700">
              <Clock3 size={14} className="text-rose-500" />
              <span>Staff On Leave</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">
                12 staff
              </span>
            </div>
            <div className="space-y-3">
              {STAFF_LEAVE_LIST.map((person) => (
                <div
                  key={person.name}
                  className="flex items-center gap-3 rounded-2xl border border-rose-50 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff3f8] text-[10px] font-black text-rose-500">
                    {getStaffInitials(person.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-slate-700">{person.name}</p>
                    <p className="truncate text-[10px] font-medium text-slate-400">{person.note}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${person.tone}`}>
                    {person.tag}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-full border border-rose-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-500 transition hover:bg-rose-50"
            >
              View All On Leave
            </button>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_18px_32px_rgba(226,93,143,0.08)]">
            <div className="mb-4 flex items-center gap-2 text-[12px] font-bold text-slate-700">
              <TriangleAlert size={14} className="text-rose-500" />
              <span>Low Rating Alert</span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-500">
                2 staff
              </span>
            </div>
            <div className="space-y-3">
              {STAFF_LOW_RATING_ALERTS.map((person) => (
                <div key={person.name} className="rounded-2xl border border-rose-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 text-[10px] font-black text-white">
                        {getStaffInitials(person.name)}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">{person.name}</p>
                        <p className="text-[10px] font-medium text-slate-400">{person.detail}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-rose-200 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-rose-500 transition hover:bg-rose-50"
                    >
                      {person.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-gradient-to-r from-[#f6a7bf] to-[#eb5b92] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_18px_rgba(226,93,143,0.2)] transition hover:opacity-95"
            >
              Send Performance Notice
            </button>
          </div>
        </aside>
      </div>

      <Modal
        open={showTransferModal}
        onCancel={() => setShowTransferModal(false)}
        footer={null}
        closable={false}
        width={420}
        styles={STAFF_MODAL_STYLES}
      >
        {selectedStaff ? (
          <div>
            <div className="bg-gradient-to-r from-[#b57edc] to-[#9b6fd4] px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/20 p-2">
                    <ArrowRightLeft size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-white">Transfer Staff</h3>
                    <p className="text-[11px] text-white/70">Move to another salon branch</p>
                  </div>
                </div>
                <CloseIconButton onClick={() => setShowTransferModal(false)} />
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-[13px] text-slate-600">
                Transfer <span className="font-bold text-slate-800">{selectedStaff.name}</span> from{" "}
                <span className="font-bold text-rose-500">{selectedStaff.salon}</span>.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="rounded-full border border-rose-200 bg-white px-4 py-2 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="rounded-full bg-gradient-to-r from-[#b57edc] to-[#9b6fd4] px-4 py-2 text-[11px] font-bold text-white shadow-[0_10px_20px_rgba(155,111,212,0.22)] transition hover:opacity-95"
                >
                  Continue Transfer
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
