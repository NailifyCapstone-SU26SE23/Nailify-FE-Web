import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  History,
  Info,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  User,
  LogOut,
  Bell,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { getBookingDetailById } from "../services/mockBookings";
import { useAuth } from "../../../core/auth/hooks/useAuth";

// Helper components
const Card = ({ children, className = "" }) => (
  <div className={`rounded-[24px] bg-white p-6 shadow-[0_10px_40px_rgba(236,72,153,0.04)] border border-pink-50/50 ${className}`}>
    {children}
  </div>
);

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={18} className="text-pink-500" />
    <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h3>
  </div>
);

SectionTitle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
};

const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: "bg-pink-50 text-pink-500",
    warning: "bg-amber-50 text-amber-600",
    success: "bg-emerald-50 text-emerald-600",
    secondary: "bg-slate-50 text-slate-500",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${styles[variant]}`}>
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "warning", "success", "secondary"]),
};

export function StaffBookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [booking, setBooking] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // Default to Consultation

  useEffect(() => {
    const data = getBookingDetailById(bookingId);
    if (data) {
      setBooking(data);
      setChecklist(data.checklist);
    }
  }, [bookingId]);

  const toggleCheckItem = (id) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleStartService = () => {
    setCurrentStep(3); // Move to Start Service step
    // In real app, call API to update status to "In Service"
  };

  if (!booking) return <div className="p-8 text-center text-slate-400">Loading booking details...</div>;

  const steps = ["Booking Detail", "Consultation", "Confirm Design", "Start Service"];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
      {/* Header with Logout & Notifications since we hide Dashboard Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-[#3f2240] tracking-tight">Booking Detail & Consultation</h1>
            <p className="text-sm text-slate-400 font-medium">Review booking and confirm nail design with customer before starting service</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 text-pink-500 font-bold text-xs border border-pink-100">
            #{booking.id}
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 font-bold text-xs border border-amber-100">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {booking.status}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button 
              onClick={logout}
              className="p-2 rounded-xl border border-pink-100 bg-white text-pink-500 hover:bg-pink-50 transition-colors shadow-sm"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
            <button 
              className="p-2 rounded-xl border border-pink-100 bg-white text-pink-500 hover:bg-pink-50 transition-colors shadow-sm"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-md ml-2">
              H
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex items-center justify-between px-8 py-6 bg-white rounded-[24px] border border-pink-50/50 shadow-sm">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-3 relative flex-1 last:flex-none">
            <div 
              onClick={() => setCurrentStep(idx)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer ${
                idx <= currentStep ? "bg-pink-500 text-white shadow-lg shadow-pink-200" : "bg-slate-50 text-slate-300 border border-slate-100"
              }`}
            >
              {idx + 1}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-wider ${idx <= currentStep ? "text-slate-800" : "text-slate-300"}`}>{step}</span>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-[1px] mx-4 transition-all duration-300 ${idx < currentStep ? "bg-pink-500" : "bg-slate-100"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Information */}
          <Card>
            <SectionTitle icon={User} title="Customer Information" />
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="relative">
                  <img src={booking.customer.avatar} alt={booking.customer.name} className="w-20 h-20 rounded-[20px] object-cover ring-4 ring-pink-50" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{booking.customer.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">{booking.customer.phone}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider">
                  <Star size={10} fill="currentColor" />
                  {booking.customer.membership}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Last Booking</p>
                  <p className="text-sm font-bold text-slate-700">{booking.customer.lastBooking}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Visits</p>
                  <p className="text-sm font-bold text-slate-700">{booking.customer.totalVisits}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Preferred Shape</p>
                  <p className="text-sm font-bold text-slate-700">{booking.customer.preferredShape}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Preferred Length</p>
                  <p className="text-sm font-bold text-slate-700">{booking.customer.preferredLength}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-pink-50/50 border border-pink-100/50">
              <div className="flex gap-3">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-500 h-fit">
                  <Info size={16} />
                </div>
                <p className="text-xs font-bold text-pink-500 leading-relaxed italic">
                  <span className="uppercase tracking-wider">Allergy Note:</span> {booking.customer.allergyNote}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[11px] font-medium text-slate-400">
              <span className="font-bold text-slate-500">Customer Preferences:</span> {booking.customer.preferences}
            </p>
          </Card>

          {/* Booking Information */}
          <Card>
            <SectionTitle icon={Calendar} title="Booking Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-pink-50 bg-[#fffafd] group hover:border-pink-200 transition-all duration-300">
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-2">Service</p>
                <p className="text-sm font-bold text-slate-800">{booking.appointment.service}</p>
                <p className="text-[11px] font-medium text-pink-400 mt-1">{booking.appointment.addon}</p>
              </div>
              <div className="p-4 rounded-2xl border border-pink-50 bg-[#fffafd] group hover:border-pink-200 transition-all duration-300">
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-2">Appointment</p>
                <p className="text-sm font-bold text-slate-800">{booking.appointment.time}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">{booking.appointment.date}</p>
              </div>
              <div className="p-4 rounded-2xl border border-pink-50 bg-[#fffafd] group hover:border-pink-200 transition-all duration-300">
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-2">Duration</p>
                <p className="text-sm font-bold text-slate-800">{booking.appointment.duration}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">Est. end {booking.appointment.endTime}</p>
              </div>
              <div className="p-4 rounded-2xl border border-pink-50 bg-[#fffafd] group hover:border-pink-200 transition-all duration-300">
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-2">Assigned Chair</p>
                <p className="text-sm font-bold text-slate-800">{booking.appointment.chair}</p>
                <p className="text-[11px] font-medium text-pink-400 mt-1">{booking.appointment.section}</p>
              </div>
              <div className="p-4 rounded-2xl border border-pink-50 bg-[#fffafd] group hover:border-pink-200 transition-all duration-300">
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-2">Deposit Paid</p>
                <p className="text-sm font-bold text-emerald-500">{booking.appointment.deposit}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">{booking.appointment.paymentStatus}</p>
              </div>
              <div className="p-4 rounded-2xl border border-pink-50 bg-[#fffafd] group hover:border-pink-200 transition-all duration-300">
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-2">Staff Artist</p>
                <p className="text-sm font-bold text-slate-800">{booking.appointment.staffArtist}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">{booking.appointment.staffRole}</p>
              </div>
            </div>
          </Card>

          {/* Current Selected Nail Design */}
          <Card>
            <SectionTitle icon={Sparkles} title="Current Selected Nail Design" />
            <div className="flex flex-col md:flex-row gap-8">
              <img src={booking.selectedDesign.image} alt={booking.selectedDesign.name} className="w-full md:w-56 h-56 rounded-[32px] object-cover shadow-2xl shadow-pink-100 ring-8 ring-pink-50/30" />
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-2xl font-black text-[#ea4f93] tracking-tight">{booking.selectedDesign.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  {[
                    ["Shape", booking.selectedDesign.shape],
                    ["Length", booking.selectedDesign.length],
                    ["Color", booking.selectedDesign.color],
                    ["Finish", booking.selectedDesign.finish],
                    ["Decoration", booking.selectedDesign.decoration],
                    ["Base", booking.selectedDesign.base],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{label}</p>
                      <p className="text-xs font-extrabold text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {booking.selectedDesign.tags.map((tag, i) => (
                    <span key={tag} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 ${
                      i === 0 ? "bg-pink-100 text-pink-500" :
                      i === 1 ? "bg-violet-100 text-violet-500" :
                      i === 2 ? "bg-sky-100 text-sky-500" : "bg-emerald-100 text-emerald-500"
                    }`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Consultation */}
          <Card>
            <SectionTitle icon={MessageSquare} title="Customer Consultation" />
            <p className="text-sm font-bold text-slate-700 text-center mb-6">Does the customer want to continue with the selected nail design — <span className="text-pink-500">{booking.selectedDesign.name}</span>?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="flex-1 max-w-[300px] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#ea4f93] text-white font-black text-sm shadow-[0_12px_24px_rgba(234,79,147,0.32)] transition-all duration-300 hover:opacity-95 hover:-translate-y-1">
                <CheckCircle2 size={18} />
                Confirm Current Design
              </button>
              <button className="flex-1 max-w-[300px] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-pink-100 text-pink-500 font-black text-sm transition-all duration-300 hover:bg-pink-50 hover:border-pink-200">
                <Search size={18} />
                Choose Another Design
              </button>
            </div>
          </Card>

          {/* Staff Notes */}
          <Card>
            <SectionTitle icon={Pencil} title="Staff Notes" />
            <div className="space-y-6">
              {[
                ["Customer Requests", "customerRequests"],
                ["Design Adjustments", "designAdjustments"],
                ["Notes Before Service", "notesBeforeService"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">{label}</label>
                  <textarea
                    className="w-full min-h-[80px] p-4 rounded-2xl bg-[#fff6f9] border border-pink-50 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all duration-300 resize-none placeholder:text-pink-200"
                    defaultValue={booking.staffNotes[key]}
                    placeholder={`Enter ${label.toLowerCase()} here...`}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Final Confirmation Checklist - UPDATED to use state */}
          <Card>
            <SectionTitle icon={CheckCircle2} title="Final Confirmation Checklist" />
            <div className="space-y-3 mb-8">
              {checklist.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => toggleCheckItem(item.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                    item.checked ? "bg-pink-50/50 border-pink-100" : "bg-white border-slate-100 hover:border-pink-100"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    item.checked ? "bg-[#ea4f93] text-white shadow-lg shadow-pink-200" : "border-2 border-slate-100 group-hover:border-pink-200"
                  }`}>
                    {item.checked && <CheckCircle2 size={14} />}
                  </div>
                  <span className={`text-sm font-bold ${item.checked ? "text-slate-800" : "text-slate-400"}`}>{item.label}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleStartService}
                disabled={!checklist.every(i => i.checked)}
                className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] text-white font-black text-base transition-all duration-300 ${
                  checklist.every(i => i.checked) 
                    ? "bg-[#ea4f93] shadow-[0_20px_40px_rgba(234,79,147,0.32)] hover:opacity-95 hover:scale-[1.01] active:scale-[0.99]" 
                    : "bg-slate-200 cursor-not-allowed"
                }`}
              >
                Proceed to Service Session
              </button>
              <div className="grid grid-cols-3 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-100 text-slate-500 text-[11px] font-bold transition-all duration-300 hover:bg-slate-50">
                  Open Design Studio
                </button>
                <button className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-100 text-slate-500 text-[11px] font-bold transition-all duration-300 hover:bg-slate-50">
                  Update Booking
                </button>
                <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-100 text-slate-500 text-[11px] font-bold transition-all duration-300 hover:bg-slate-50"
                >
                  Back to Queue
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Session Status */}
          <Card>
            <SectionTitle icon={Clock} title="Session Status" />
            <div className="space-y-4">
              {[
                ["Status", booking.status, "warning"],
                ["Staff Artist", booking.appointment.staffArtist],
                ["Chair", `${booking.appointment.chair} — VIP`],
                ["Time Slot", `${booking.appointment.time} — ${booking.appointment.endTime}`],
              ].map(([label, value, variant]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-pink-50 last:border-0">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{label}</span>
                  {variant ? <Badge variant={variant}>{value}</Badge> : <span className="text-xs font-black text-slate-700">{value}</span>}
                </div>
              ))}
            </div>
          </Card>

          {/* Customer History */}
          <Card>
            <SectionTitle icon={History} title="Customer History" />
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Favorite Styles</p>
                <div className="flex flex-wrap gap-1.5">
                  {booking.customerHistory.favoriteStyles.map((style, i) => (
                    <span key={style} className={`px-3 py-1 rounded-full text-[9px] font-black ${
                      i % 4 === 0 ? "bg-pink-50 text-pink-400" :
                      i % 4 === 1 ? "bg-violet-50 text-violet-400" :
                      i % 4 === 2 ? "bg-sky-50 text-sky-400" : "bg-emerald-50 text-emerald-400"
                    }`}>
                      {style}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Previous Nail Shapes</p>
                <p className="text-xs font-bold text-slate-700">{booking.customerHistory.previousShapes.join(" • ")}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Last Uploaded Photo</p>
                <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-pink-200 transition-all duration-300">
                  <img src={booking.customerHistory.lastPhoto.url} alt="Last set" className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-700">{booking.customerHistory.lastPhoto.name}</p>
                    <p className="text-[9px] font-medium text-slate-400">{booking.customerHistory.lastPhoto.date}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Suggested Designs */}
          <Card>
            <SectionTitle icon={Sparkles} title="Suggested Designs" />
            <div className="space-y-4">
              {booking.suggestedDesigns.map((design) => (
                <div key={design.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 bg-[#fffafd] group cursor-pointer hover:border-pink-200 hover:bg-white transition-all duration-300">
                  <img src={design.image} alt={design.name} className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex-1">
                    <h5 className="text-[13px] font-bold text-slate-800">{design.name}</h5>
                    <p className="text-[10px] font-medium text-slate-400">{design.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-pink-500 transition-colors" />
                </div>
              ))}
            </div>
          </Card>

          {/* Next Actions */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <ChevronRight size={12} className="text-pink-500" />
              Next Actions
            </p>
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-pink-50 bg-white text-pink-500 font-black text-xs transition-all duration-300 hover:bg-pink-50 hover:border-pink-100">
              <Pencil size={14} />
              Update Booking
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-pink-50 bg-white text-pink-500 font-black text-xs transition-all duration-300 hover:bg-pink-50 hover:border-pink-100">
              <Search size={14} />
              Open Design Studio
            </button>
            <button 
              onClick={handleStartService}
              className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-[20px] bg-[#ea4f93] text-white font-black text-sm shadow-xl shadow-pink-100 transition-all duration-300 hover:opacity-95 hover:-translate-y-1"
            >
              <Play size={16} fill="currentColor" />
              Start Service
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
