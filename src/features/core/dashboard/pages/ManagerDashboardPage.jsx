import { useState } from "react";
import {
  Armchair,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Footprints,
  Users,
} from "lucide-react";
import { Modal } from "antd";
import { PropTypes } from "../../../../shared/utils/propTypes";

const metricCards = [
  {
    icon: CalendarDays,
    label: "Today's Bookings",
    value: "34",
    delta: "+12%",
    deltaTone: "bg-[#eaf9ee] text-[#2fa25f]",
    tint: "from-[#ff5e95] to-[#ff7f4f]",
    glow: "bg-[#ffe8e3]",
  },
  {
    icon: Footprints,
    label: "Walk-in Customers",
    value: "7",
    delta: "+5",
    deltaTone: "bg-[#eaf9ee] text-[#2fa25f]",
    tint: "from-[#a74ce6] to-[#7d38dd]",
    glow: "bg-[#efe2ff]",
  },
  {
    icon: Users,
    label: "Available Staff",
    value: "3",
    delta: "3 Free",
    deltaTone: "bg-[#eaf9ee] text-[#2fa25f]",
    tint: "from-[#2fc5a9] to-[#2a9d8f]",
    glow: "bg-[#dff7f2]",
  },
  {
    icon: Armchair,
    label: "Occupied Chairs",
    value: "6",
    delta: "6/12",
    deltaTone: "bg-[#ffe7ef] text-[#ea4f93]",
    tint: "from-[#ff8352] to-[#ff5f6f]",
    glow: "bg-[#ffe9de]",
  },
  {
    icon: CircleDollarSign,
    label: "Daily Revenue",
    value: "$1,840",
    delta: "+12%",
    deltaTone: "bg-[#eaf9ee] text-[#2fa25f]",
    tint: "from-[#ff4f98] to-[#d92e7a]",
    glow: "bg-[#ffe2ee]",
  },
  {
    icon: Clock3,
    label: "Average Wait Time",
    value: "18m",
    delta: "+10min",
    deltaTone: "bg-[#fff0dd] text-[#db8520]",
    tint: "from-[#ffad33] to-[#ff7f4f]",
    glow: "bg-[#fff0dd]",
  },
];

const staffMembers = [
  { name: "Tina L.", role: "Nail Artist", status: "Busy", avatarTone: "from-[#ffc5de] to-[#ea4f93]", phone: "+65 9123 4567", email: "tina@nailify.com", experience: "5 years", skills: ["Gel Nails", "Nail Art", "Acrylic"] },
  { name: "Mei K.", role: "Nail Artist", status: "Available", avatarTone: "from-[#b8f0d8] to-[#2fc5a9]", phone: "+65 8234 5678", email: "mei@nailify.com", experience: "3 years", skills: ["French Tips", "Gel Manicure", "Nail Design"] },
  { name: "Priya S.", role: "Nail Artist", status: "Busy", avatarTone: "from-[#ffd0e2] to-[#f04f91]", phone: "+65 9345 6789", email: "priya@nailify.com", experience: "4 years", skills: ["Acrylic Full Set", "Nail Art", "Gel Pedicure"] },
  { name: "Jess T.", role: "Nail Artist", status: "On Break", avatarTone: "from-[#ffe0b2] to-[#ff9800]", phone: "+65 8456 7890", email: "jess@nailify.com", experience: "2 years", skills: ["Basic Manicure", "Polish Change"] },
  { name: "Lily N.", role: "Nail Artist", status: "Available", avatarTone: "from-[#d8c4ff] to-[#8b5cf6]", phone: "+65 9567 8901", email: "lily@nailify.com", experience: "6 years", skills: ["3D Nail Art", "Ombre", "Gel Extensions"] },
  { name: "Chloe W.", role: "Nail Artist", status: "Busy", avatarTone: "from-[#ffc5de] to-[#ea4f93]", phone: "+65 8678 9012", email: "chloe@nailify.com", experience: "3 years", skills: ["French Manicure", "Gel Nails", "Nail Design"] },
  { name: "Sophie P.", role: "Nail Artist", status: "Available", avatarTone: "from-[#b8f0d8] to-[#2fc5a9]", phone: "+65 9789 0123", email: "sophie@nailify.com", experience: "4 years", skills: ["Acrylic", "Gel Pedicure", "Nail Art"] },
  { name: "Mia T.", role: "Nail Artist", status: "Busy", avatarTone: "from-[#ffd0e2] to-[#f04f91]", phone: "+65 8890 1234", email: "mia@nailify.com", experience: "2 years", skills: ["Basic Manicure", "Polish Change"] },
  { name: "Rachel L.", role: "Nail Artist", status: "On Break", avatarTone: "from-[#ffe0b2] to-[#ff9800]", phone: "+65 9901 2345", email: "rachel@nailify.com", experience: "5 years", skills: ["Gel Nails", "Acrylic", "Nail Design"] },
  { name: "Amanda K.", role: "Nail Artist", status: "Available", avatarTone: "from-[#d8c4ff] to-[#8b5cf6]", phone: "+65 8012 3456", email: "amanda@nailify.com", experience: "3 years", skills: ["French Tips", "Gel Manicure"] },
  { name: "Fiona N.", role: "Nail Artist", status: "Busy", avatarTone: "from-[#ffc5de] to-[#ea4f93]", phone: "+65 9123 4568", email: "fiona@nailify.com", experience: "4 years", skills: ["Nail Art", "Ombre", "Gel Extensions"] },
  { name: "Siti R.", role: "Nail Artist", status: "Available", avatarTone: "from-[#b8f0d8] to-[#2fc5a9]", phone: "+65 8234 5679", email: "siti@nailify.com", experience: "2 years", skills: ["Basic Manicure", "Gel Nails"] },
  { name: "Hana Y.", role: "Nail Artist", status: "Busy", avatarTone: "from-[#ffd0e2] to-[#f04f91]", phone: "+65 9345 6780", email: "hana@nailify.com", experience: "6 years", skills: ["3D Nail Art", "Acrylic Full Set", "Nail Design"] },
  { name: "Clara M.", role: "Nail Artist", status: "Available", avatarTone: "from-[#d8c4ff] to-[#8b5cf6]", phone: "+65 8456 7891", email: "clara@nailify.com", experience: "3 years", skills: ["French Manicure", "Gel Pedicure"] },
];

const queueItems = [
  { label: "Waiting Customers", value: "5", tone: "bg-[#fff0dd] text-[#db8520]" },
  { label: "Current Bookings", value: "6", tone: "bg-[#ffe7ef] text-[#ea4f93]" },
  { label: "Delayed Bookings", value: "2", tone: "bg-[#ffe6ec] text-[#e1447f]" },
  { label: "No-shows", value: "1", tone: "bg-[#f3f4f6] text-[#6b7280]" },
];

const scheduleRows = [
  {
    time: "09:00 AM",
    customer: "Sarah Chen",
    phone: "+65 9123 4567",
    service: "Gel Manicure",
    nailSet: "Classic Almond Medium",
    price: "$45",
    artist: "Tina L.",
    status: "Completed",
    action: "View",
    initials: "SC",
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
    notes: "Customer wants a bit sensitive to strong chemicals - use fragrance-free products"
  },
  {
    time: "09:30 AM",
    customer: "Emily Wong",
    phone: "+65 8234 5678",
    service: "Nail Art Design",
    nailSet: "Square Short",
    price: "$65",
    artist: "Mei K.",
    status: "In Progress",
    action: "View",
    initials: "EW",
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
    notes: "Requested cherry blossom design - reference photo saved in app"
  },
  {
    time: "10:00 AM",
    customer: "Jessica Tan",
    phone: "+65 9345 6789",
    service: "Acrylic Full Set",
    nailSet: "Coffin Long",
    price: "$85",
    artist: "Priya S.",
    status: "Checked In",
    action: "View",
    initials: "JT",
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
    notes: "First time getting acrylics"
  },
  {
    time: "10:30 AM",
    customer: "Grace Teo",
    phone: "+65 8456 7890",
    service: "French Tip",
    nailSet: "Oval Medium",
    price: "$40",
    artist: "Jess T.",
    status: "Waiting",
    action: "View",
    initials: "GT",
    avatarTone: "from-[#ffe0b2] to-[#ff9800]",
    notes: "Regular customer - prefers pink base"
  },
  {
    time: "11:00 AM",
    customer: "Wendy Chua",
    phone: "+65 9567 8901",
    service: "Gel Pedicure",
    nailSet: "Natural Toenails",
    price: "$55",
    artist: "Lily N.",
    status: "Cancelled",
    action: "View",
    initials: "WC",
    avatarTone: "from-[#ffd0e2] to-[#f04f91]",
    notes: "Cancelled due to illness"
  },
];

const urgentIssues = [
  {
    title: "Late Customer",
    description: "Grace Teo is 15 minutes late for her 10:30 AM appointment.",
    tone: "border-[#ffe0b2] bg-[#fff8eb] text-[#c9770a]",
    dot: "bg-[#ff9800]",
  },
  {
    title: "Staff Absence",
    description: "Jess T. requested an emergency leave — reassign 2 bookings.",
    tone: "border-[#f8c4d8] bg-[#fff0f6] text-[#e1447f]",
    dot: "bg-[#ea4f93]",
  },
  {
    title: "Customer Complaint",
    description: "Sarah Chen reported chipped polish after 1 day — follow up needed.",
    tone: "border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]",
    dot: "bg-[#8b5cf6]",
  },
];

const scheduleFilters = ["All", "Waiting", "In Progress", "Completed"];

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

function getStaffStatusTone(status) {
  switch (status) {
    case "Busy":
      return "bg-[#ffe7ef] text-[#ea4f93]";
    case "On Break":
      return "bg-[#fff0dd] text-[#db8520]";
    default:
      return "bg-[#eaf9ee] text-[#2fa25f]";
  }
}

function getBookingStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "In Progress":
      return "bg-[#ffe7ef] text-[#ea4f93]";
    case "Checked In":
      return "bg-[#e7ecff] text-[#4755b8]";
    case "Waiting":
      return "bg-[#fff0dd] text-[#db8520]";
    default:
      return "bg-[#ffe6ec] text-[#e1447f]";
  }
}

function StaffCard({ name, role, status, avatarTone, onClick, skills }) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-2 py-3 text-center cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone} text-xs font-bold text-white shadow-sm`}
      >
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")}
      </div>
      <p className="mt-2 text-[11px] font-bold text-[#402542]">{name}</p>
      <p className="mt-0.5 text-[10px] text-[#c08aa4]">{role}</p>
      <span
        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${getStaffStatusTone(status)}`}
      >
        {status}
      </span>
      {/* Show first 1 skill */}
      {skills && skills.length > 0 && (
        <div className="mt-2 w-full overflow-hidden">
          <p className="text-[8px] text-[#c08aa4] truncate px-1">
            {skills[0]}
            {skills.length > 1 && ` +${skills.length - 1}`}
          </p>
        </div>
      )}
    </div>
  );
}

StaffCard.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  avatarTone: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  skills: PropTypes.arrayOf(PropTypes.string),
};

export function ManagerDashboardPage() {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
    setIsStaffModalOpen(true);
  };

  const handleActionClick = (row) => {
    setSelectedSchedule(row);
    setIsScheduleModalOpen(true);
  };

  // Filter schedule rows based on active filter
  const filteredScheduleRows = activeFilter === "All" 
    ? scheduleRows 
    : scheduleRows.filter(row => row.status === activeFilter);

  return (
    <>
      <section className="flex min-h-full flex-col gap-4 gap-y-6">
        

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metricCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card key={card.label} className="relative overflow-hidden">
                <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full ${card.glow}`} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.tint} text-white shadow-[0_8px_16px_rgba(236,72,153,0.15)]`}
                    >
                      <Icon size={17} />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${card.deltaTone}`}>
                      {card.delta}
                    </span>
                  </div>
                  <p className="mt-4 text-[1.75rem] font-extrabold leading-none text-[#3b2241]">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#7f6478]">{card.label}</p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Card>
            <SectionHeading
              title="Staff Availability"
              subtitle="8 staff members on shift today"
            />
            <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-7">
              {staffMembers.map((staff) => (
                <StaffCard
                  key={staff.name}
                  name={staff.name}
                  role={staff.role}
                  status={staff.status}
                  avatarTone={staff.avatarTone}
                  skills={staff.skills}
                  onClick={() => handleStaffClick(staff)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeading
              title="Queue Overview"
              subtitle="Live queue status as of now"
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {queueItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex min-h-[88px] flex-col items-center justify-center rounded-[14px] px-3 py-4 text-center ${item.tone}`}
                >
                  <p className="text-2xl font-extrabold leading-none">{item.value}</p>
                  <p className="mt-2 text-[10px] font-semibold leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-0">
          <div className="flex flex-col gap-4 border-b border-[#f6dce7] p-5 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              title="Today's Schedule"
              subtitle="24 appointments · Last updated 5 min ago"
            />
            <div className="flex flex-wrap gap-2">
              {scheduleFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={
                    activeFilter === filter
                      ? "rounded-full bg-[#ea4f93] px-4 py-1.5 text-xs font-bold text-white shadow-[0_8px_16px_rgba(234,79,147,0.2)] transition-all"
                      : "rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-1.5 text-xs font-bold text-[#c08aa4] hover:border-[#ea4f93] hover:text-[#ea4f93] transition-all"
                  }
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto p-5 pt-0">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-[#f6dce7] text-[10px] uppercase tracking-[0.16em] text-[#c693ad]">
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Service</th>
                  <th className="px-3 py-3">Staff Artist</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredScheduleRows.map((row) => (
                  <tr key={`${row.time}-${row.customer}`} className="border-b border-[#fbe7ef] last:border-b-0">
                    <td className="px-3 py-4 text-sm font-semibold text-[#402542]">{row.time}</td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.avatarTone} text-[10px] font-bold text-white`}
                        >
                          {row.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#402542]">{row.customer}</p>
                          <p className="text-[11px] text-[#c08aa4]">{row.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-[#7a6176]">{row.service}</td>
                    <td className="px-3 py-4 text-sm text-[#7a6176]">{row.artist}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${getBookingStatusTone(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => handleActionClick(row)}
                        className="rounded-full border border-[#f4c7da] bg-[#fff6fa] px-3 py-1.5 text-xs font-bold text-[#e84d92] hover:bg-[#ea4f93] hover:text-white transition-colors"
                      >
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionHeading title="Quick Status" />
            <div className="mt-5 space-y-4">
              {[
                ["Salon Status", "Open", "bg-[#eaf9ee] text-[#2fa25f]"],
                ["Queue Capacity", "75% Full", "bg-[#ffe7ef] text-[#ea4f93]"],
                ["Next Break", "12:00 PM", "bg-[#fff0dd] text-[#db8520]"],
                ["Closing Time", "8:00 PM", "bg-[#f3f4f6] text-[#6b7280]"],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#7f6478]">{label}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-[#7f6478]">Capacity Bar</span>
                <span className="font-bold text-[#ea4f93]">12/16 chairs</span>
              </div>
              <div className="h-2.5 rounded-full bg-[#fbe1ec]">
                <div className="h-full w-3/4 rounded-full bg-[#ea4f93]" />
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeading title="Urgent Issues" subtitle="3 items need attention" />
            <div className="mt-5 space-y-3">
              {urgentIssues.map((issue) => (
                <div
                  key={issue.title}
                  className={`rounded-[14px] border p-4 ${issue.tone}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${issue.dot}`} />
                    <div>
                      <p className="text-sm font-extrabold">{issue.title}</p>
                      <p className="mt-1 text-xs leading-5 opacity-90">{issue.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Staff Modal */}
      <Modal
        title={false}
        open={isStaffModalOpen}
        onCancel={() => setIsStaffModalOpen(false)}
        footer={false}
        centered
        width={500}
        styles={{
          body: { padding: 0 }
        }}
      >
        {selectedStaff && (
          <div className="bg-white rounded-[20px] overflow-hidden">
            {/* Header with gradient background */}
            <div className={`bg-gradient-to-r ${selectedStaff.avatarTone} p-8 text-center`}>
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-4xl font-bold text-white shadow-lg backdrop-blur-sm">
                {selectedStaff.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <h2 className="mt-4 text-2xl font-extrabold text-white">{selectedStaff.name}</h2>
              <p className="text-sm text-white/90">{selectedStaff.role}</p>
              <span
                className={`mt-3 inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-bold text-white`}
              >
                {selectedStaff.status}
              </span>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Info Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fffafb] border border-[#f8deea]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8deea] text-[#ea4f93]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-[#c08aa4]">Phone</p>
                    <p className="text-sm font-bold text-[#402542]">{selectedStaff.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fffafb] border border-[#f8deea]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8deea] text-[#ea4f93]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-[#c08aa4]">Email</p>
                    <p className="text-sm font-bold text-[#402542]">{selectedStaff.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fffafb] border border-[#f8deea]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8deea] text-[#ea4f93]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-[#c08aa4]">Experience</p>
                    <p className="text-sm font-bold text-[#402542]">{selectedStaff.experience}</p>
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div>
                <p className="text-[10px] font-bold text-[#c08aa4] uppercase tracking-wider mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.skills.map((skill, index) => (
                    <span key={index} className="rounded-full bg-[#fff0f6] px-3 py-1 text-[11px] font-semibold text-[#ea4f93] border border-[#f8deea]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="w-full mt-2 rounded-full bg-gradient-to-r from-[#ff4f98] to-[#ea4f93] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_16px_rgba(234,79,147,0.2)] hover:shadow-[0_8px_20px_rgba(234,79,147,0.3)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Detail Modal */}
      <Modal
        title={false}
        open={isScheduleModalOpen}
        onCancel={() => setIsScheduleModalOpen(false)}
        footer={false}
        centered
        width={520}
        styles={{
          body: { padding: 0 }
        }}
      >
        {selectedSchedule && (
          <div className="bg-white rounded-[20px] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#ff4f98] to-[#ff7f4f] p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-white/90 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                <span className="text-sm font-semibold">{selectedSchedule.time}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">{selectedSchedule.customer}</h2>
              <p className="text-sm text-white/90 mt-1">{selectedSchedule.phone}</p>
              <span
                className={`mt-3 inline-flex rounded-full px-4 py-1 text-xs font-bold ${getBookingStatusTone(selectedSchedule.status)}`}
              >
                {selectedSchedule.status}
              </span>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Service & Nail Set */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#fffafb] border border-[#f8deea]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea4f93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span className="text-[10px] font-bold uppercase text-[#c08aa4]">Service</span>
                  </div>
                  <p className="text-sm font-bold text-[#402542]">{selectedSchedule.service}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#fffafb] border border-[#f8deea]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea4f93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span className="text-[10px] font-bold uppercase text-[#c08aa4]">Nail Set</span>
                  </div>
                  <p className="text-sm font-bold text-[#402542]">{selectedSchedule.nailSet}</p>
                </div>
              </div>

              {/* Price & Artist */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#fff0f6] to-[#ffe4f0] border border-[#f8deea]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea4f93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span className="text-[10px] font-bold uppercase text-[#c08aa4]">Price</span>
                  </div>
                  <p className="text-xl font-extrabold text-[#ea4f93]">{selectedSchedule.price}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#fffafb] border border-[#f8deea]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea4f93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span className="text-[10px] font-bold uppercase text-[#c08aa4]">Artist</span>
                  </div>
                  <p className="text-sm font-bold text-[#402542]">{selectedSchedule.artist}</p>
                </div>
              </div>

              {/* Notes (if any) */}
              {selectedSchedule.notes && (
                <div className="p-4 rounded-xl bg-[#fff8ed] border border-[#ffe0b2]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#db8520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span className="text-[10px] font-bold uppercase text-[#c08aa4]">Notes</span>
                  </div>
                  <p className="text-sm text-[#7a6176]">{selectedSchedule.notes}</p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-full mt-2 rounded-full bg-gradient-to-r from-[#ff4f98] to-[#ff7f4f] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_16px_rgba(234,79,147,0.2)] hover:shadow-[0_8px_20px_rgba(234,79,147,0.3)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
