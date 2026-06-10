import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Filter,
  Search,
  Star,
  UserPlus,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  BOOKING_ROWS,
  BOOKING_STATUS_STYLES,
} from "../services/mockBookings";
import { getStaffBookingDetailRoute } from "../../../../shared/constants/routes";
import { useAuth } from "../../../core/auth/hooks/useAuth";

const MetricCard = ({ icon: Icon, label, value, note, iconClassName }) => (
  <article className="rounded-[24px] border border-pink-50 bg-white p-5 shadow-[0_10px_40px_rgba(236,72,153,0.04)]">
    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${iconClassName}`}>
      <Icon size={18} />
    </div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
      {label}
    </p>
    <div className="mt-1 flex items-baseline gap-2">
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <span className="text-[11px] font-bold text-emerald-500">{note}</span>
    </div>
  </article>
);

MetricCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  note: PropTypes.string.isRequired,
  iconClassName: PropTypes.string.isRequired,
};

const BookingCard = ({ booking }) => {
  return (
    <div className="group relative rounded-[28px] border border-pink-50 bg-white p-5 shadow-[0_10px_30px_rgba(236,72,153,0.03)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(236,72,153,0.08)] hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 text-pink-500 font-black text-sm border-2 border-white shadow-sm">
            {booking.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-[15px] group-hover:text-pink-500 transition-colors">{booking.customerName}</h4>
            <p className="text-[11px] text-slate-400 font-medium">{booking.customerPhone}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${BOOKING_STATUS_STYLES[booking.status] || "bg-slate-50 text-slate-500"}`}>
          {booking.status === "Confirmed" && <CheckCircle2 size={14} />}
          {booking.status === "Pending" && <Clock3 size={14} />}
          {booking.status === "Cancelled" && <XCircle size={14} />}
          {booking.status === "In Service" && <Play size={14} fill="currentColor" />}
          {booking.status}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-slate-600">
          <Sparkles className="text-pink-400" size={14} />
          <span className="text-xs font-bold">{booking.service}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays className="text-slate-300" size={14} />
            <span className="text-[11px] font-bold">{booking.bookingDate}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Clock3 className="text-slate-300" size={14} />
            <span className="text-[11px] font-bold">{booking.bookingTime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-pink-50/50">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Price</span>
          <span className="text-sm font-black text-slate-800">{booking.total}</span>
        </div>
        <Link 
          to={getStaffBookingDetailRoute(booking.id)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-pink-50 text-pink-500 font-black text-xs transition-all duration-300 hover:bg-pink-500 hover:text-white shadow-sm"
        >
          Manage
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};

BookingCard.propTypes = {
  booking: PropTypes.object.isRequired,
};

export function StaffBookingListPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const staffName = user?.fullName || "Ariana Vo";

  const filteredBookings = useMemo(() => {
    return BOOKING_ROWS.filter(booking => {
      const matchesStaff = booking.staffName === staffName;
      const matchesTab = activeTab === "All" || booking.status === activeTab;
      const matchesSearch = booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           booking.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStaff && matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery, staffName]);

  const stats = [
    { label: "Assigned Today", value: "8", note: "+2 vs yesterday", icon: CalendarDays, iconClassName: "bg-pink-50 text-pink-500" },
    { label: "Pending Confirm", value: "3", note: "Awaiting review", icon: Clock3, iconClassName: "bg-amber-50 text-amber-500" },
    { label: "Completed", value: "53", note: "+7 this week", icon: CheckCircle2, iconClassName: "bg-emerald-50 text-emerald-500" },
    { label: "Rating Avg", value: "4.9", note: "Top 5%", icon: Star, iconClassName: "bg-violet-50 text-violet-500" },
    { label: "In Service", value: "1", note: "Active now", icon: Play, iconClassName: "bg-sky-50 text-sky-500" },
  ];

  const tabs = ["All", "Pending", "Confirmed", "In Service", "Completed"];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search customer or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3 rounded-[20px] bg-white border border-pink-50 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-200 transition-all w-full md:w-[300px] shadow-sm shadow-pink-100/20"
            />
          </div>
          <button className="p-3 rounded-[20px] bg-white border border-pink-50 text-slate-400 hover:text-pink-500 transition-colors shadow-sm shadow-pink-100/20">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Tabs & List */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-xs font-black transition-all duration-300 whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-[#ea4f93] text-white shadow-lg shadow-pink-200" 
                  : "bg-white text-slate-400 border border-pink-50 hover:bg-pink-50 hover:text-pink-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-dashed border-pink-100">
            <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center text-pink-200 mb-4">
              <CalendarDays size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No bookings found</h3>
            <p className="text-sm text-slate-400">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
