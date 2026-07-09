import {
  CalendarDays,
  Clock3,
  Search,
  Sparkles,
  UserRound,
  Save,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";

const SERVICE_FILTERS = [
  "All Services",
  "Basic Nail",
  "Gel Nail",
  "Nail Art",
  "Gel Extension",
  "Hand Spa",
  "Removal",
  "Custom Design",
];

const SERVICE_CARDS = [
  {
    id: "classic-manicure",
    name: "Classic Manicure",
    duration: "30 min",
    price: "$25",
    image: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "gel-nail-color",
    name: "Gel Nail Color",
    duration: "45 min",
    price: "$45",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "chrome-nail-art",
    name: "Chrome Nail Art",
    duration: "60 min",
    price: "$65",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "french-tip-design",
    name: "French Tip Design",
    duration: "50 min",
    price: "$55",
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "gel-extension",
    name: "Gel Extension",
    duration: "90 min",
    price: "$85",
    image: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "luxury-hand-spa",
    name: "Luxury Hand Spa",
    duration: "45 min",
    price: "$55",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "gel-removal",
    name: "Gel Removal",
    duration: "20 min",
    price: "$15",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "k-beauty-custom",
    name: "K-Beauty Custom",
    duration: "75 min",
    price: "$90",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "classic-pedicure",
    name: "Classic Pedicure",
    duration: "40 min",
    price: "$35",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80",
  },
];

const MOCK_CUSTOMERS = [
  {
    id: "cust-001",
    name: "Sophia Nguyen",
    phone: "0912 345 678",
    email: "sophia.nguyen@email.com",
    tier: "Gold Member",
  },
  {
    id: "cust-002",
    name: "Emma Tran",
    phone: "0908 222 114",
    email: "emma.tran@email.com",
    tier: "New Member",
  },
  {
    id: "cust-003",
    name: "Linh Pham",
    phone: "0935 618 420",
    email: "linh.pham@email.com",
    tier: "Silver Member",
  },
  {
    id: "cust-004",
    name: "Mia Le",
    phone: "0987 441 220",
    email: "mia.le@email.com",
    tier: "Walk-in Guest",
  },
  {
    id: "cust-005",
    name: "Chloe Vo",
    phone: "0978 611 204",
    email: "chloe.vo@email.com",
    tier: "VIP Member",
  },
  {
    id: "cust-006",
    name: "Ngoc Minh",
    phone: "0978 611 204",
    email: "ngoc.minh@email.com",
    tier: "VIP Member",
  },
];

const TIME_SLOTS = [
  { time: "10:00 - 10:30 AM", status: "Available", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
  { time: "10:30 - 11:00 AM", status: "Busy", tone: "border-[#ffd6df] bg-[#fff3f7] text-[#df4f84]" },
  { time: "11:00 - 11:30 AM", status: "Reserved", tone: "border-[#ffd8aa] bg-[#fff5e8] text-[#de861e]" },
  { time: "11:30 AM - 12:00 PM", status: "Available", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
  { time: "12:00 - 12:30 PM", status: "Busy", tone: "border-[#ffd6df] bg-[#fff3f7] text-[#df4f84]" },
  { time: "12:30 - 1:00 PM", status: "Available", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
  { time: "1:00 - 1:30 PM", status: "Busy", tone: "border-[#ffd6df] bg-[#fff3f7] text-[#df4f84]" },
  { time: "1:30 - 2:00 PM", status: "Reserved", tone: "border-[#ffd8aa] bg-[#fff5e8] text-[#de861e]" },
  { time: "2:00 - 2:30 PM", status: "Available", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
  { time: "2:30 - 3:15 PM", status: "Recommended", tone: "border-[#f5c0d5] bg-[#fff0f6] text-[#df4f84]" },
  { time: "3:15 - 4:00 PM", status: "Recommended", tone: "border-[#f5c0d5] bg-[#fff0f6] text-[#df4f84]" },
  { time: "4:00 - 5:00 PM", status: "Available", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
];

const RECOMMENDED_SLOTS = [
  { time: "2:30 PM", note: "Hana • Available • Est. wait: 5 min" },
  { time: "3:15 PM", note: "Lily • Available • Est. wait: 10 min" },
  { time: "4:00 PM", note: "Emma • Available • Est. wait: 0 min" },
];

const ARTISTS = [
  {
    name: "Hana",
    status: "Available Now",
    specialties: ["Chrome Nail", "K-Beauty", "Nail Art"],
    rating: "4.9",
    bookings: "1 booking today",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Lily",
    status: "Finishing Soon",
    specialties: ["French Tip", "Gel Extension", "Ombre"],
    rating: "4.8",
    bookings: "3 bookings today",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Emma",
    status: "Available Now",
    specialties: ["Custom Design", "Hand Spa", "Nail Art"],
    rating: "4.7",
    bookings: "2 bookings today",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Bob",
    status: "Available Now",
    specialties: ["Custom Design", "Hand Spa", "Nail Art"],
    rating: "4.7",
    bookings: "2 bookings today",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
  },
];

const SMART_SUGGESTIONS = [
  {
    label: "Recommended Staff",
    value: "Hana",
    note: "Best match for Chrome Nail & K-Beauty",
  },
  {
    label: "Suggested Slot",
    value: "2:30 PM today",
    note: "Lowest wait time",
  },
  {
    label: "Add-on Services",
    value: "Luxury Hand Spa (+$55) • Gel Removal (+$15)",
    note: "",
  },
];

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "Not selected";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateValue));
}

function DashboardCard({ title, description, icon, children, className = "" }) {
  const Icon = icon;

  return (
    <section className={`rounded-[22px] border border-[#f5d6e3] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)] ${className}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ec4899_0%,#fb7185_100%)] text-white">
          {Icon ? <Icon size={12} /> : null}
        </span>
        <div>
          <h2 className="text-sm font-extrabold text-[#d83982]">{title}</h2>
          <p className="mt-1 text-[11px] text-[#c495ab]">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ReceptionistWalkInBookingCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState(
    location.state?.prefillCustomerName ?? "",
  );
  const [selectedFilter, setSelectedFilter] = useState(SERVICE_FILTERS[0]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedDate, setSelectedDate] = useState("2026-05-12");
  const [selectedSlot, setSelectedSlot] = useState(RECOMMENDED_SLOTS[0].time);
  const [selectedArtist, setSelectedArtist] = useState("Hana");
  const [selectedCustomer, setSelectedCustomer] = useState(() => {
    const prefilledCustomerName = location.state?.prefillCustomerName;

    if (prefilledCustomerName) {
      return {
        id: "prefill-customer",
        name: prefilledCustomerName,
        phone: "Newly registered",
        email: "Added from registration flow",
        tier: "New Member",
      };
    }

    return MOCK_CUSTOMERS[0];
  });

  const selectedServices = useMemo(
    () => SERVICE_CARDS.filter((service) => selectedServiceIds.includes(service.id)),
    [selectedServiceIds],
  );
  const estimatedPrice = useMemo(
    () =>
      selectedServices.reduce((sum, service) => sum + Number(service.price.replace("$", "")), 0),
    [selectedServices],
  );
  const estimatedDuration = useMemo(
    () =>
      selectedServices.reduce((sum, service) => sum + Number(service.duration.replace(" min", "")), 0),
    [selectedServices],
  );

  const filteredServices = useMemo(() => {
    return SERVICE_CARDS.filter((service) => {
      if (selectedFilter === "All Services") {
        return true;
      }

      const normalizedFilter = selectedFilter.toLowerCase();
      return service.name.toLowerCase().includes(normalizedFilter.split(" ")[0]);
    });
  }, [selectedFilter]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = customerSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return MOCK_CUSTOMERS.filter((customer) =>
      [customer.name, customer.phone, customer.email, customer.tier]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [customerSearchQuery]);

  const handleToggleService = (serviceId) => {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((item) => item !== serviceId)
        : [...current, serviceId],
    );
  };

  const handleCreate = () => {
    setShowCreateConfirm(false);
    navigate(ROUTES.receptionistBookings, {
      state: {
        flashMessage: `Walk-in booking created for ${selectedCustomer?.name || "new guest"}.`,
      },
    });
  };

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="rounded-[24px] border border-[#f3d7e3] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.05)] sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#412643]">Walk-in Customer Booking</h1>
            <p className="mt-1 text-sm text-[#c092a8]">
              Create booking and check-in for walk-in customers
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 lg:items-end">
            <div className="text-sm text-[#b48ca0]">
              Tuesday, May 12, 2026
              <div className="text-lg font-extrabold text-[#eb4f94]">9:16:53 PM</div>
            </div>
            <span className="inline-flex rounded-full border border-[#f4cadc] bg-[#fff2f8] px-3 py-1 text-[11px] font-bold text-[#ea4f93]">
              Walk-in
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <DashboardCard
            title="Customer Search"
            description="Search for an existing customer by phone number or email address"
            icon={Search}
          >
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b48ca0]" />
                <input
                  value={customerSearchQuery}
                  onChange={(event) => setCustomerSearchQuery(event.target.value)}
                  placeholder="Search customer by phone number or email..."
                  className="h-12 w-full rounded-2xl border border-[#f3d4e1] bg-[#fff9fc] pl-11 pr-4 text-sm text-[#5c4559] outline-none placeholder:text-[#d19ab3] focus:border-[#ee6cb5]"
                />
              </label>
              <button
                type="button"
                className="rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(236,72,153,0.18)]"
              >
                Search
              </button>
              <Link
                to={ROUTES.receptionistCustomersCreate}
                state={{ continueToBooking: true }}
                className="inline-flex items-center justify-center rounded-xl border border-[#f3d4e1] bg-white px-5 py-3 text-sm font-bold text-[#ea4f93]"
              >
                + Register New Customer
              </Link>
            </div>

            {customerSearchQuery.trim() ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredCustomers.map((customer) => {
                  const isSelected = selectedCustomer?.id === customer.id;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearchQuery(customer.name);
                      }}
                      className={`rounded-[18px] border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-[#ea4f93] bg-[#fff3f8] shadow-[0_10px_24px_rgba(236,72,153,0.12)]"
                          : "border-[#f4d6e2] bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-[#432744]">{customer.name}</p>
                          <p className="mt-1 text-[11px] text-[#b48ca0]">{customer.phone}</p>
                          <p className="mt-1 text-[11px] text-[#b48ca0]">{customer.email}</p>
                        </div>
                        <span className="rounded-full bg-[#fff1f7] px-2.5 py-1 text-[10px] font-bold text-[#ea4f93]">
                          {customer.tier}
                        </span>
                      </div>
                      <div className="mt-4">
                        <span
                          className={`inline-flex rounded-xl px-3 py-2 text-[11px] font-bold ${
                            isSelected
                              ? "bg-[image:var(--gradient-accent)] text-white"
                              : "border border-[#f3cadb] bg-white text-[#ea4f93]"
                          }`}
                        >
                          {isSelected ? "Selected Customer" : "Select Customer"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {customerSearchQuery.trim() && !filteredCustomers.length ? (
              <div className="mt-4 rounded-[18px] border border-[#f4d6e2] bg-[#fff8fb] px-4 py-5 text-sm text-[#b48ca0]">
                No mock customer matched your search. Try name, phone, or email.
              </div>
            ) : null}
          </DashboardCard>

          <DashboardCard
            title="Service Selection"
            description="Select one or more services for this booking"
            icon={Sparkles}
          >
            <div className="flex flex-wrap gap-2">
              {SERVICE_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    selectedFilter === filter
                      ? "bg-[#ea4f93] text-white"
                      : "border border-[#f2d7e3] bg-white text-[#ca8fa8]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {filteredServices.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleToggleService(service.id)}
                    className={`overflow-hidden rounded-[18px] border bg-white text-left transition ${
                      isSelected
                        ? "border-[#ea4f93] shadow-[0_10px_24px_rgba(236,72,153,0.14)]"
                        : "border-[#f5d6e3]"
                    }`}
                  >
                    <div className="h-24 overflow-hidden">
                      <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-[#432744]">{service.name}</p>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-[#b48ca0]">{service.duration}</span>
                        <span className="font-bold text-[#ea4f93]">from {service.price}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-[18px] border border-[#f4cbdb] bg-[linear-gradient(180deg,#fff6fa_0%,#fff9fc_100%)] px-4 py-4">
              <p className="text-xs font-bold text-[#ea4f93]">Live Booking Summary</p>
              <p className="mt-3 text-sm text-[#c195ab]">
                {selectedServices.length
                  ? selectedServices.map((service) => service.name).join(", ")
                  : "No services selected yet"}
              </p>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Booking Schedule"
            description="Select a date and available time slot for this walk-in booking"
            icon={CalendarDays}
          >
            <div className="rounded-[20px] border border-[#f7dce8] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <button type="button" className="rounded-full border border-[#f4d3e0] px-2 py-1 text-xs text-[#c893ad]">
                  ‹
                </button>
                <p className="text-sm font-bold text-[#432744]">May 2026</p>
                <button type="button" className="rounded-full border border-[#f4d3e0] px-2 py-1 text-xs text-[#c893ad]">
                  ›
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] text-[#bf95ab]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
                {Array.from({ length: 31 }, (_, index) => {
                  const day = index + 1;
                  const isSelected = day === 12;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(`2026-05-${String(day).padStart(2, "0")}`)}
                      className={`rounded-xl py-2 text-xs font-bold ${
                        isSelected ? "bg-[#ea4f93] text-white" : "text-[#5e4a57]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-[#432744]">Available Time Slots</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlot(slot.time.split(" - ")[0])}
                      className={`rounded-[14px] border px-3 py-3 text-left ${slot.tone}`}
                    >
                      <p className="text-[11px] font-bold">{slot.time}</p>
                      <p className="mt-1 text-[10px]">{slot.status}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-[#432744]">Recommended Available Slots</p>
                <div className="mt-3 space-y-3">
                  {RECOMMENDED_SLOTS.map((slot) => (
                    <div
                      key={slot.time}
                      className="flex flex-col gap-3 rounded-[16px] border border-[#f4cadb] bg-[#fff3f8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#ea4f93]">{slot.time}</p>
                        <p className="mt-1 text-[11px] text-[#b3899e]">{slot.note}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(slot.time)}
                        className="rounded-xl border border-[#f2b8d0] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Staff Artist Assignment"
            description="Select a nail artist for this booking"
            icon={UserRound}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ARTISTS.map((artist) => (
                <div
                  key={artist.name}
                  className={`rounded-[18px] border p-4 ${
                    selectedArtist === artist.name ? "border-[#ea4f93] bg-[#fff7fb]" : "border-[#f5d7e4] bg-white"
                  }`}
                >
                  <div className="mx-auto h-14 w-14 overflow-hidden rounded-full border-2 border-[#f4bfd5]">
                    <img src={artist.image} alt={artist.name} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-3 text-center text-sm font-bold text-[#432744]">{artist.name}</p>
                  <p className="mt-1 text-center text-[11px] text-[#b48ca0]">• {artist.status}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {artist.specialties.map((item) => (
                      <span key={item} className="rounded-full border border-[#f3cada] px-2 py-1 text-[10px] font-bold text-[#df4f84]">
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-center text-xs font-bold text-[#ea4f93]">★ {artist.rating}</p>
                  <p className="mt-1 text-center text-[11px] text-[#b48ca0]">{artist.bookings}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedArtist(artist.name)}
                      className="rounded-xl bg-[image:var(--gradient-accent)] px-3 py-2 text-[11px] font-bold text-white"
                    >
                      Assign
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-[#f4d0de] bg-white px-3 py-2 text-[11px] font-bold text-[#ea4f93]"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Walk-in Booking Summary"
            description="Review booking details before confirmation"
            icon={Clock3}
          >
            <div className="rounded-[16px] bg-[image:var(--gradient-accent)] px-4 py-5 text-white">
              <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
                <p className="text-4xl font-black">W-07</p>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/80">Walk-in Queue Number</p>
                  <p className="text-lg font-bold">Estimated Wait ~15 min</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[14px] border border-[#cbe6d5] bg-[#eff9f1] px-4 py-3 text-sm font-bold text-[#2f9557]">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} />
                Ready for Check-in
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Customer Name", selectedCustomer?.name || "Not set"],
                ["Assigned Staff", selectedArtist || "Not assigned"],
                ["Selected Services", selectedServices.length ? selectedServices.map((item) => item.name).join(", ") : "None selected"],
                ["Booking Time", selectedSlot || "Not selected"],
                ["Est. Duration", estimatedDuration ? `${estimatedDuration} min` : "0 min"],
                ["Estimated Price", estimatedPrice ? `$${estimatedPrice}` : "$0"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[16px] bg-[#fff1f7] px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c99db2]">{label}</p>
                  <p className="mt-2 text-sm font-bold text-[#432744]">{value}</p>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Final Actions"
            description="Confirm the booking and check-in the customer"
            icon={Save}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCreateConfirm(true)}
                  className="rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white"
                >
                  Confirm Walk-in Booking
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-[#67c274] px-5 py-3 text-sm font-bold text-white"
                >
                  Check-in Customer
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button type="button" className="rounded-xl border border-[#f3d0de] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]">
                  Save Draft
                </button>
                <button type="button" className="rounded-xl border border-[#f3d0de] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]">
                  Cancel Booking
                </button>
                <button type="button" className="rounded-xl border border-[#f3d0de] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]">
                  Send Booking Confirmation
                </button>
              </div>
            </div>
          </DashboardCard>
        </div>

        <aside className="space-y-4">
          <DashboardCard title="Salon Status" description="" icon={Clock3}>
            <div className="space-y-3 text-sm">
              {[
                ["Current Occupancy", "8 / 12", "text-[#ea4f93]"],
                ["Waiting Customers", "3", "text-[#ea4f93]"],
                ["Available Chairs", "4", "text-[#432744]"],
                ["Average Wait Time", "~15 min", "text-[#432744]"],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-[#f7dce8] pb-3 last:border-b-0 last:pb-0">
                  <span className="text-[#b48ca0]">{label}</span>
                  <span className={`font-extrabold ${tone}`}>{value}</span>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard title="Staff Availability" description="" icon={UserRound}>
            <div className="space-y-3">
              {ARTISTS.slice(0, 4).map((artist, index) => (
                <div key={artist.name} className="flex items-center gap-3">
                  <img src={artist.image} alt={artist.name} className="h-8 w-8 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#432744]">{artist.name}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    index % 2 === 0 ? "bg-[#e8f8ed] text-[#2f9557]" : "bg-[#ffe9f0] text-[#df4f84]"
                  }`}>
                    {index % 2 === 0 ? "Available" : "Busy"}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard title="Queue Status" description="" icon={Clock3}>
            <div className="text-center">
              <p className="text-5xl font-black text-[#ea4f93]">W-07</p>
              <p className="mt-2 text-xs text-[#bc93a8]">Current Walk-in Number</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[14px] bg-[#fff1f7] px-3 py-4 text-center">
                <p className="text-lg font-extrabold text-[#ea4f93]">3</p>
                <p className="text-[10px] text-[#bc93a8]">In Queue</p>
              </div>
              <div className="rounded-[14px] bg-[#fff1f7] px-3 py-4 text-center">
                <p className="text-lg font-extrabold text-[#ea4f93]">~15m</p>
                <p className="text-[10px] text-[#bc93a8]">Est. Wait</p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Smart Suggestions" description="" icon={Sparkles}>
            <div className="space-y-3">
              {SMART_SUGGESTIONS.map((item) => (
                <div key={item.label} className="rounded-[16px] border border-[#f2d3e1] bg-[#fff7fb] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c99db2]">{item.label}</p>
                  <p className="mt-2 text-xs font-bold text-[#432744]">{item.value}</p>
                  {item.note ? <p className="mt-1 text-[11px] text-[#b58ea1]">{item.note}</p> : null}
                </div>
              ))}
            </div>
          </DashboardCard>
        </aside>
      </div>

      <ActionConfirmModal
        open={showCreateConfirm}
        intent="success"
        title="Create Walk-in Booking"
        subtitle="This will continue the receptionist walk-in flow."
        description="Confirm to create this walk-in booking with the selected guest, services, slot, and artist."
        confirmText="Confirm Walk-in Booking"
        cancelText="Review Again"
        confirmIcon={Save}
        onConfirm={handleCreate}
        onCancel={() => setShowCreateConfirm(false)}
        highlights={[
          selectedCustomer?.name || "Walk-in guest",
          selectedServices.length ? selectedServices.map((item) => item.name).join(", ") : "No service selected",
          selectedArtist || "No artist selected",
        ]}
        details={[
          { label: "Booking Date", value: formatDateLabel(selectedDate) },
          { label: "Booking Time", value: selectedSlot || "Not selected" },
        ]}
        warnings={["This receptionist create flow is UI-only for now and does not persist to backend create APIs yet."]}
      />
    </section>
  );
}
