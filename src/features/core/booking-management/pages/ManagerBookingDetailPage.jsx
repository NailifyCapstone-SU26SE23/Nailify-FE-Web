import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { BOOKING_ROLE_CONFIG, getMockBookingById } from "../services/mockBookings";
import { ROLES } from "../../../../shared/constants/roles";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];

const designImages = [
  { className: "row-span-2 min-h-[220px] bg-gradient-to-br from-[#ffd6e8] via-[#ffb8d2] to-[#f8a4c8]" },
  { className: "min-h-[104px] bg-gradient-to-br from-[#fff0f6] via-[#ffe0ec] to-[#ffc9de]" },
  { className: "min-h-[104px] bg-gradient-to-br from-[#f3e8ff] via-[#e9d5ff] to-[#d8b4fe]" },
  { className: "min-h-[104px] bg-gradient-to-br from-[#fff7ed] via-[#ffedd5] to-[#fed7aa]" },
  { className: "min-h-[104px] bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]" },
];

const customizationLayers = [
  {
    title: "Base Color Layer",
    description: "Soft pink gradient base",
    meta: "Complexity: Easy · Time: 15 min",
    selected: true,
  },
  {
    title: "3D Floral Art",
    description: "White & gold floral accents",
    meta: "Complexity: High · Time: 45 min",
    selected: true,
  },
  {
    title: "Chrome Finish",
    description: "Mirror chrome powder overlay",
    meta: "Complexity: Medium · Time: 20 min",
    selected: false,
  },
  {
    title: "Rhinestone Details",
    description: "Crystal accents on ring finger",
    meta: "Complexity: Medium · Time: 25 min",
    selected: true,
  },
  {
    title: "Matte Top Coat",
    description: "Velvet matte finish",
    meta: "Complexity: Easy · Time: 10 min",
    selected: true,
  },
  {
    title: "French Tip Accent",
    description: "Classic white tip variation",
    meta: "Complexity: Easy · Time: 15 min",
    selected: false,
  },
];

const pricingLayers = [
  { name: "Base Color Layer", note: "Soft pink gradient", price: "$15.00" },
  { name: "3D Floral Art", note: "White & gold accents", price: "$35.00" },
  { name: "Rhinestone Details", note: "Crystal accents", price: "$20.00" },
  { name: "Matte Top Coat", note: "Velvet finish", price: "$10.00" },
];

const extraServiceOptions = [
  "Nails cleaning — $12",
  "Gel Base — $12",
  "Build Nail Shape — $12",
];

const skillRequirements = [
  { icon: "🎯", title: "PRECISION", description: "Clean lines & even application", stars: 4, level: "4★ Advanced" },
  { icon: "✋", title: "NAIL FORM", description: "Almond shape sculpting", stars: 3, level: "3★ Intermediate" },
  { icon: "🎨", title: "3D DESIGN", description: "Floral & dimensional art", stars: 5, level: "5★ Expert" },
  { icon: "🌈", title: "COLOR BLEND", description: "Gradient & ombre work", stars: 4, level: "4★ Advanced" },
  { icon: "✨", title: "MATERIAL", description: "Gel & powder handling", stars: 3, level: "3★ Intermediate" },
  { icon: "⚡", title: "SPEED", description: "Efficient multi-layer work", stars: 3, level: "3★ Intermediate" },
];

const staffArtists = [
  {
    name: "Luna Park",
    specialty: "3D Art Specialist",
    rating: "4.9",
    reviews: 128,
    tags: ["3D Expert", "Gel Master"],
    years: "5 yrs",
    weekly: "12",
    onTime: "98%",
    selected: true,
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
  },
  {
    name: "Aria Nguyen",
    specialty: "Nail Art Designer",
    rating: "4.8",
    reviews: 96,
    tags: ["Ombre Pro", "French Tips"],
    years: "4 yrs",
    weekly: "10",
    onTime: "95%",
    selected: false,
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
  },
  {
    name: "Chloe Davis",
    specialty: "Gel & Acrylic Expert",
    rating: "4.7",
    reviews: 84,
    tags: ["Acrylic Set", "Chrome"],
    years: "6 yrs",
    weekly: "8",
    onTime: "97%",
    selected: false,
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
  },
];

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[18px] border border-[#f8deea] bg-white p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] md:p-6 ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-xl font-bold text-[#3f2240]">{children}</h2>
      {subtitle ? <p className="mt-1 text-sm text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
};

function SummaryField({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">{label}</p>
      <div className="mt-1.5 text-sm font-bold text-[#402542]">{children}</div>
    </div>
  );
}

SummaryField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function StarRating({ count, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5 text-[#fbbf24]">
      {Array.from({ length: max }, (_, index) => (
        <Star
          key={index}
          size={12}
          fill={index < count ? "currentColor" : "none"}
          className={index < count ? "" : "text-[#e5e7eb]"}
        />
      ))}
    </div>
  );
}

StarRating.propTypes = {
  count: PropTypes.number.isRequired,
  max: PropTypes.number,
};

export function ManagerBookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [selectedArtist, setSelectedArtist] = useState("Luna Park");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [flashMessage, setFlashMessage] = useState("");

  const rawBooking = getMockBookingById(bookingId);

  const booking = useMemo(
    () => ({
      id: bookingId,
      displayId: rawBooking?.id?.replace("BKG", "BK") ?? "#BK-2024-0519",
      status: "Pending Review",
      dateTime: rawBooking
        ? `${rawBooking.bookingDate} · ${rawBooking.bookingTime}`
        : "May 22, 2024 · 2:00 PM",
      branch: rawBooking?.branch ?? "Downtown Plaza",
      customerName: rawBooking?.customerName ?? "Emily Rodriguez",
      bookingType: "Custom Nail Design",
      deposit: "$35.00",
      estimatedTotal: "$125.00",
      phone: rawBooking?.customerPhone ?? "+1 (555) 234-5678",
      email: "emily.r@email.com",
      memberTier: "Gold Member",
      previousBookings: "24",
      avgRating: "4.9",
      noShowRate: "0%",
      preferredStyles: ["French Tips", "Ombre", "3D Art"],
      specialNote:
        "Allergic to acrylic powder — prefers gel-based products only. Has sensitive skin around cuticles.",
      nailShape: "Almond",
      dominantColors: ["Soft Pink", "White", "Gold"],
      currentTotal: "$105.00",
    }),
    [bookingId, rawBooking],
  );

  if (!rawBooking) {
    return <Navigate to={roleConfig.listRoute} replace />;
  }

  const customerInitials = booking.customerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const visibleArtists = staffArtists.slice(carouselIndex, carouselIndex + 2);

  const handleAccept = () => {
    setFlashMessage(`Booking accepted and assigned to ${selectedArtist}.`);
    setTimeout(() => {
      navigate(roleConfig.listRoute, {
        state: { flashMessage: `Booking ${booking.displayId} accepted successfully.` },
      });
    }, 1200);
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={ROUTES.managerDashboard} className="text-[#c08aa4] transition hover:text-[#ea4f93]">
          Dashboard
        </Link>
        <span className="text-[#e8c4d4]">/</span>
        <Link to={roleConfig.listRoute} className="font-semibold text-[#ea4f93]">
          Bookings
        </Link>
        <span className="text-[#e8c4d4]">/</span>
        <span className="font-semibold text-[#7f6478]">Booking Detail</span>
      </nav>

      {flashMessage ? (
        <div className="rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
          {flashMessage}
        </div>
      ) : null}

      <Card>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryField label="Booking ID">{booking.displayId}</SummaryField>
          <SummaryField label="Status">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0dd] px-3 py-1 text-xs font-bold text-[#db8520]">
              <Clock3 size={12} />
              {booking.status}
            </span>
          </SummaryField>
          <SummaryField label="Booking Date & Time">{booking.dateTime}</SummaryField>
          <SummaryField label="Salon Branch">{booking.branch}</SummaryField>
          <SummaryField label="Customer Name">{booking.customerName}</SummaryField>
          <SummaryField label="Booking Type">{booking.bookingType}</SummaryField>
          <SummaryField label="Deposit Paid">
            <span className="text-[#2fa25f]">{booking.deposit}</span>
          </SummaryField>
          <SummaryField label="Estimated Total">{booking.estimatedTotal}</SummaryField>
        </div>
      </Card>

      <Card>
        <SectionTitle>Customer Information</SectionTitle>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffc5de] to-[#ea4f93] text-lg font-bold text-white">
            {customerInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold text-[#402542]">{booking.customerName}</h3>
              <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[10px] font-bold text-[#b45309]">
                {booking.memberTier}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#7a6176]">
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} className="text-[#ea4f93]" />
                {booking.phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} className="text-[#ea4f93]" />
                {booking.email}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            [booking.previousBookings, "Previous Bookings"],
            [booking.avgRating, "Avg Rating"],
            [booking.noShowRate, "No-Show Rate"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-3 text-center"
            >
              <p className="text-2xl font-extrabold text-[#ea4f93]">{value}</p>
              <p className="mt-1 text-[11px] text-[#c08aa4]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#c08aa4]">Preferred Styles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {booking.preferredStyles.map((style) => (
              <span
                key={style}
                className="rounded-full bg-[#ffe7ef] px-3 py-1 text-[11px] font-bold text-[#ea4f93]"
              >
                {style}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-[14px] border border-[#fde68a] bg-[#fffbeb] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#d97706]" />
            <div>
              <p className="text-sm font-extrabold text-[#92400e]">Special Notes</p>
              <p className="mt-1 text-sm leading-6 text-[#a16207]">{booking.specialNote}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {[
            ["View History", UserRound],
            ["Chat", MessageCircle],
            ["Call", Phone],
          ].map(([label, Icon]) => (
            <button
              key={label}
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] transition hover:bg-[#fff7fb] sm:flex-none sm:min-w-[140px]"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle subtitle="Customer reference images for this design">
            Custom Nail Design Review
          </SectionTitle>
          <span className="rounded-full bg-[#ffe7ef] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
            Uploaded by Customer
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
          {designImages.map((image, index) => (
            <div
              key={index}
              className={`rounded-[14px] ${image.className} ${index === 0 ? "md:col-span-2" : ""}`}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[#c08aa4]">Nail Shape</p>
            <p className="mt-1 font-serif text-lg font-bold text-[#402542]">{booking.nailShape}</p>
          </div>
          <div>
            <p className="text-xs text-[#c08aa4]">Dominant Colors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {booking.dominantColors.map((color) => (
                <span
                  key={color}
                  className="rounded-full bg-[#ffe7ef] px-3 py-1 text-[11px] font-bold text-[#ea4f93]"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffe7ef] text-[#ea4f93]">
            <Palette size={15} />
          </div>
          <SectionTitle>Customer Selected Layers for Customization</SectionTitle>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {customizationLayers.map((layer) => (
            <div
              key={layer.title}
              className={`rounded-[14px] border p-4 ${
                layer.selected
                  ? "border-[#b8e6cc] bg-[#fafffe]"
                  : "border-[#f0f0f0] bg-[#fafafa]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {layer.selected ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2fa25f]" />
                  ) : (
                    <X size={16} className="mt-0.5 shrink-0 text-[#9ca3af]" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#402542]">{layer.title}</p>
                    <p className="mt-0.5 text-xs text-[#c08aa4]">{layer.description}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    layer.selected
                      ? "bg-[#eaf9ee] text-[#2fa25f]"
                      : "bg-[#f3f4f6] text-[#9ca3af]"
                  }`}
                >
                  {layer.selected ? "Selected" : "Not Selected"}
                </span>
              </div>
              <p className="mt-2 pl-6 text-[11px] text-[#c08aa4]">{layer.meta}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-[#c08aa4]">Total Selected Layers</p>
            <p className="text-sm font-extrabold text-[#ea4f93]">4 Layers · Est. 110 minutes</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-[#c08aa4]">Overall Complexity</p>
            <p className="text-sm font-extrabold text-[#ea4f93]">High</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffe7ef] text-[#ea4f93]">
              <span className="text-sm">💰</span>
            </div>
            <SectionTitle>Layer Pricing & Extra Services</SectionTitle>
          </div>
          <span className="text-[11px] font-bold text-[#ea4f93]">Real-time Total</span>
        </div>

        <div className="space-y-3">
          {pricingLayers.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 border-b border-[#fbe7ef] pb-3 last:border-b-0">
              <div>
                <p className="text-sm font-semibold text-[#402542]">{item.name}</p>
                <p className="text-[11px] text-[#c08aa4]">{item.note}</p>
              </div>
              <p className="text-sm font-bold text-[#402542]">{item.price}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[14px] border border-[#f8deea] bg-[#fff7fb] p-4">
          <p className="text-sm font-extrabold text-[#402542]">+ Add Custom Service</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select className="h-10 flex-1 rounded-xl border border-[#f5d7e4] bg-white px-3 text-sm text-[#5c4559] outline-none focus:border-[#ef6bb4]">
              <option>Select service</option>
              {extraServiceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Price"
              className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-white px-3 text-sm text-[#5c4559] outline-none focus:border-[#ef6bb4] sm:w-28"
            />
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#ea4f93] px-4 text-xs font-bold text-white"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[#c08aa4]">Example: + nails cleaning — 20.000 VND</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-[#c08aa4]">Updated Service Total</p>
            <p className="text-sm font-extrabold text-[#ea4f93]">4 Layers + 0 Extra Services</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-[#c08aa4]">Current Total</p>
            <p className="text-2xl font-extrabold text-[#ea4f93]">{booking.currentTotal}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffe7ef] text-[#ea4f93]">
            <UserRound size={15} />
          </div>
          <SectionTitle subtitle="Skill levels required to perform this nail design">
            Staff Skill Requirements
          </SectionTitle>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {skillRequirements.map((skill) => (
            <div
              key={skill.title}
              className="rounded-[14px] border border-[#f8deea] bg-[#fffafb] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{skill.icon}</span>
                  <div>
                    <p className="text-xs font-extrabold tracking-wide text-[#402542]">{skill.title}</p>
                    <p className="mt-0.5 text-[11px] text-[#c08aa4]">{skill.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StarRating count={skill.stars} />
                      <span className="text-[10px] font-bold text-[#ea4f93]">{skill.level}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-[#f4c1d8] bg-white px-3 py-1 text-[10px] font-bold text-[#7f6478]"
                >
                  Select level
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-[14px] border border-[#ddd6fe] bg-[#f5f3ff] p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-[#7c3aed]" />
          <p className="text-xs leading-5 text-[#6d28d9]">
            These requirements are used for automatic staff matching. Adjust levels to refine artist
            recommendations.
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle>Select Staff Artists</SectionTitle>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCarouselIndex((current) => Math.max(0, current - 1))}
            disabled={carouselIndex === 0}
            className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0f0f0] bg-white text-[#9ca3af] shadow-sm disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="grid gap-4 px-6 md:grid-cols-2">
            {visibleArtists.map((artist) => {
              const isSelected = selectedArtist === artist.name;

              return (
                <div
                  key={artist.name}
                  className={`rounded-[16px] border p-4 transition ${
                    isSelected
                      ? "border-[#8b5cf6] bg-[#faf5ff] shadow-[0_0_0_1px_#8b5cf6]"
                      : "border-[#f8deea] bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${artist.avatarTone} text-xs font-bold text-white`}
                    >
                      {artist.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[#402542]">{artist.name}</p>
                      <p className="text-xs text-[#c08aa4]">{artist.specialty}</p>
                      <p className="mt-1 text-xs font-bold text-[#ea4f93]">
                        {artist.rating} ({artist.reviews} reviews)
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {artist.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#ffe7ef] px-2 py-0.5 text-[9px] font-bold text-[#ea4f93]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      [artist.years, "Years Exp"],
                      [artist.weekly, "This Week"],
                      [artist.onTime, "On-Time"],
                    ].map(([value, label]) => (
                      <div key={label}>
                        <p className="text-sm font-extrabold text-[#402542]">{value}</p>
                        <p className="text-[9px] text-[#c08aa4]">{label}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedArtist(artist.name)}
                    className={`mt-4 w-full rounded-full py-2 text-xs font-bold transition ${
                      isSelected
                        ? "bg-[#8b5cf6] text-white"
                        : "border border-[#f4c1d8] bg-white text-[#7f6478]"
                    }`}
                  >
                    {isSelected ? "SELECTED" : "SELECT TO DO"}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              setCarouselIndex((current) => Math.min(staffArtists.length - 2, current + 1))
            }
            disabled={carouselIndex >= staffArtists.length - 2}
            className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0f0f0] bg-white text-[#9ca3af] shadow-sm disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm font-bold text-[#6b7280] transition hover:bg-[#f3f4f6]"
        >
          <Info size={16} />
          Request More Info
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm font-bold text-[#6b7280] transition hover:bg-[#f3f4f6]"
        >
          <Palette size={16} />
          Suggest Alternative
        </button>
        <button
          type="button"
          onClick={() =>
            navigate(roleConfig.listRoute, {
              state: { flashMessage: `Booking ${booking.displayId} was rejected.` },
            })
          }
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-bold text-[#dc2626] transition hover:bg-[#fee2e2]"
        >
          <X size={16} />
          Reject Booking
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ea4f93] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.25)] transition hover:bg-[#df4588]"
        >
          <Check size={16} />
          Accept & Assign Artist
        </button>
      </div>
    </section>
  );
}
