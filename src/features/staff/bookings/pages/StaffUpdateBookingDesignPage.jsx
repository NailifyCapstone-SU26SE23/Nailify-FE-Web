import {
  ArrowRight,
  Check,
  CircleAlert,
  ClipboardCheck,
  DollarSign,
  FilePenLine,
  Plus,
  Sparkles,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { getMockBookingById } from "../../../core/booking-management/services/mockBookings";
import {
  getStaffBookingDesignStudioRoute,
  getStaffBookingDetailRoute,
  getStaffBookingServiceSessionRoute,
  ROUTES,
} from "../../../../shared/constants/routes";

function SectionTitle({ icon: Icon, title, badge }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-[#ea4f93]" />
        <h2 className="text-sm font-extrabold text-[#3f2b3f]">{title}</h2>
      </div>
      {badge ? (
        <span className="rounded-full border border-[#cbeed5] bg-[#f0fff4] px-3 py-1 text-[10px] font-bold text-[#21a55f]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

SectionTitle.propTypes = {
  badge: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
};

function Tag({ children, className = "" }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}

Tag.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

function PriceCard({ label, value, note, accent = false }) {
  return (
    <article className={`rounded-[18px] border p-4 ${accent ? "border-[#f2bfd4] bg-[linear-gradient(135deg,#fff4f9_0%,#ffeef7_100%)]" : "border-[#f4dbe7] bg-[#fff9fc]"}`}>
      <p className="text-[10px] font-medium text-[#a88a9d]">{label}</p>
      <p className={`mt-3 text-[1.5rem] font-extrabold ${accent ? "text-[#ea4f93]" : "text-[#3f2b3f]"}`}>{value}</p>
      <p className="mt-2 text-[10px] text-[#b690a4]">{note}</p>
    </article>
  );
}

PriceCard.propTypes = {
  accent: PropTypes.bool,
  label: PropTypes.string.isRequired,
  note: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

function ConfirmationRow({ item, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-[16px] border px-4 py-4 text-left transition ${
        checked
          ? "border-[#bfe8ca] bg-[#effcf3]"
          : "border-[#f4dbe7] bg-[#fffafb] hover:bg-[#fff6fa]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          checked ? "border-[#20a760] bg-[#20a760] text-white" : "border-[#e6cddd] bg-white text-transparent"
        }`}
      >
        <Check size={12} />
      </span>
      <span>
        <span className="block text-sm font-bold text-[#3f2b3f]">{item.title}</span>
        <span className="mt-1 block text-[11px] text-[#a88a9d]">{item.note}</span>
      </span>
    </button>
  );
}

ConfirmationRow.propTypes = {
  checked: PropTypes.bool.isRequired,
  item: PropTypes.shape({
    note: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
};

function AddonRow({ item }) {
  const iconMap = {
    chrome: Star,
    repair: Check,
    spa: Sparkles,
  };
  const Icon = iconMap[item.kind] ?? Sparkles;
  const toneMap = {
    emerald: "bg-[#ecfdf3] text-[#22a865] border-[#caedd5]",
    pink: "bg-[#fff1f7] text-[#ea4f93] border-[#f2bfd4]",
    violet: "bg-[#f4efff] text-[#8059eb] border-[#d9cbff]",
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#f4dbe7] bg-[#fffafb] p-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${toneMap[item.tone]}`}>
          <Icon size={14} />
        </span>
        <div>
          <p className="text-xs font-extrabold text-[#3f2b3f]">{item.title}</p>
          <p className="mt-1 text-[10px] text-[#a88a9d]">{item.note}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold text-[#ea4f93]">{item.price}</span>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md bg-[image:var(--gradient-accent)] text-white"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

AddonRow.propTypes = {
  item: PropTypes.shape({
    kind: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    tone: PropTypes.string.isRequired,
  }).isRequired,
};

export function StaffUpdateBookingDesignPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams();
  const booking = getMockBookingById(bookingId);
  const payload = location.state?.designUpdate;

  const fallbackData = useMemo(() => {
    if (!booking) {
      return null;
    }

    return {
      bookingCode: booking.id.replace("BKG", "BK"),
      statusLabel: "Updating Design",
      summaryStatus: "Updating Design",
      customer: "Minh Thornton",
      staffArtist: "Sophie Lee",
      appointment: "Today, 2:30 PM",
      chair: "Chair #3",
      previousDesign: {
        name: "Classic French Manicure",
        shortName: "Classic French",
        price: "$45.00",
        duration: "45 min",
        image: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=800&q=80",
      },
      newDesign: {
        name: "Pink Ombre Chrome Floral",
        shortName: "Pink Ombre Chrome",
        price: "$78.00",
        duration: "75 min",
        image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80",
      },
      serviceSummary: {
        shape: ["Almond"],
        length: ["Medium Long"],
        colors: ["Blush Pink", "Deep Rose", "Pearl White"],
        finish: ["Chrome Mirror", "Ombre Fade"],
        decorations: ["Floral Art", "Rhinestones", "Foil Accent"],
        extras: ["Gel Top Coat", "Cuticle Care"],
      },
      pricing: {
        originalPrice: "$45.00",
        newPrice: "$78.00",
        additionalCost: "+$33.00",
        additionalNote: "To be collected",
        updatedDuration: "75 min",
        durationNote: "+30 min added",
        warning: "Additional payment required - customer must pay an extra $33.00 before service begins.",
      },
      designStatus: {
        previousDesign: "Classic French",
        newDesign: "Pink Ombre Chrome",
        designSelected: "Confirmed",
        bookingUpdated: "Pending",
        customerAgreed: "Pending",
      },
      addOns: [
        { title: "Hand Spa", note: "Moisturizing treatment", price: "+$18", tone: "pink", kind: "spa" },
        { title: "Chrome Upgrade", note: "Mirror chrome powder", price: "+$12", tone: "violet", kind: "chrome" },
        { title: "Nail Repair", note: "Fix broken nails", price: "+$8", tone: "emerald", kind: "repair" },
      ],
      confirmations: [
        {
          key: "reviewed",
          title: "Customer reviewed new design",
          note: "Customer has seen and approved the Pink Ombre Chrome Floral design preview",
          checked: true,
        },
        {
          key: "price",
          title: "Customer accepted updated price",
          note: "Customer agrees to pay $78.00 total (+$33.00 additional charge)",
          checked: false,
        },
        {
          key: "duration",
          title: "Customer accepted updated duration",
          note: "Customer acknowledges service will take approximately 75 minutes",
          checked: false,
        },
      ],
    };
  }, [booking]);

  const data = payload ?? fallbackData;
  const [confirmations, setConfirmations] = useState(data?.confirmations ?? []);

  if (!data) {
    return <Navigate to={ROUTES.staffBookings} replace />;
  }

  const toggleConfirmation = (key) => {
    setConfirmations((current) =>
      current.map((item) =>
        item.key === key ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const allConfirmed = confirmations.every((item) => item.checked);
  const designStudioRoute = getStaffBookingDesignStudioRoute(bookingId);
  const detailRoute = getStaffBookingDetailRoute(bookingId);
  const serviceSessionRoute = getStaffBookingServiceSessionRoute(bookingId);

  const handleOpenServiceSession = () => {
    navigate(serviceSessionRoute, {
      state: {
        serviceSession: {
          bookingCode: data.bookingCode,
          customerName: data.customer,
          customerPhone: booking?.customerPhone ?? "+84 912 345 678",
          customerAvatar:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80",
          serviceLabel: data.newDesign.name,
          staffArtist: data.staffArtist,
          chair: data.chair,
          appointmentTime: `${data.appointment} • ${data.newDesign.duration}`,
          estimatedDuration: data.pricing.updatedDuration,
          designName: data.newDesign.name,
          totalPrice: data.pricing.newPrice,
          backRoute: detailRoute,
          designUpdateRoute: location.pathname,
          confirmations: [
            "Customer identity confirmed",
            "Service design confirmed",
            "Price confirmed",
            "Before photo uploaded",
          ],
        },
      },
    });
  };

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f9_100%)]">
      <div className="rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
              <SectionTitle icon={FilePenLine} title="Design Comparison" badge="Step 1 of 4" />
              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)]">
                <div className="rounded-[20px] border border-[#f4dbe7] bg-[#fffafb] p-3">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                    Previous Design
                  </p>
                  <div className="overflow-hidden rounded-[16px]">
                    <img
                      src={data.previousDesign.image}
                      alt={data.previousDesign.name}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="mt-4 text-base font-extrabold text-[#3f2b3f]">{data.previousDesign.name}</p>
                  <div className="mt-3 flex gap-2">
                    <Tag className="border-[#f2bfd4] bg-[#fff1f7] text-[#ea4f93]">{data.previousDesign.price}</Tag>
                    <Tag className="border-[#f4dbe7] bg-white text-[#ab8ea0]">{data.previousDesign.duration}</Tag>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(180deg,#fff6fa_0%,#fffdfd_100%)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-white shadow-[0_12px_24px_rgba(236,72,153,0.24)]">
                    <ArrowRight size={18} />
                  </div>
                  <p className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#ea4f93]">
                    Updated Design
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#f2bfd4] bg-[linear-gradient(135deg,#fff6fa_0%,#ffeef7_100%)] p-3">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ea4f93]">
                    New Design
                  </p>
                  <div className="overflow-hidden rounded-[16px]">
                    <img
                      src={data.newDesign.image}
                      alt={data.newDesign.name}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="mt-4 text-base font-extrabold text-[#3f2b3f]">{data.newDesign.name}</p>
                  <div className="mt-3 flex gap-2">
                    <Tag className="border-[#f2bfd4] bg-[#fff1f7] text-[#ea4f93]">{data.newDesign.price}</Tag>
                    <Tag className="border-[#f4dbe7] bg-white text-[#ab8ea0]">{data.newDesign.duration}</Tag>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
              <SectionTitle icon={ClipboardCheck} title="Updated Service Summary" badge="Design Updated" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  ["Shape", data.serviceSummary.shape, "pink"],
                  ["Length", data.serviceSummary.length, "violet"],
                  ["Colors", data.serviceSummary.colors, "pink"],
                  ["Finish", data.serviceSummary.finish, "amber"],
                  ["Decorations", data.serviceSummary.decorations, "pink"],
                  ["Extra Services", data.serviceSummary.extras, "green"],
                ].map(([label, values, tone]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">{label}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {values.map((value) => (
                        <Tag
                          key={value}
                          className={
                            tone === "violet"
                              ? "border-[#d9cbff] bg-[#f3efff] text-[#7e5ae9]"
                              : tone === "amber"
                                ? "border-[#f1ddb2] bg-[#fff4dc] text-[#cb8a18]"
                                : tone === "green"
                                  ? "border-[#cdeed7] bg-[#effcf3] text-[#22a865]"
                                  : "border-[#f2bfd4] bg-[#fff1f7] text-[#ea4f93]"
                          }
                        >
                          {value}
                        </Tag>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
              <SectionTitle icon={DollarSign} title="Price Difference" />
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <PriceCard
                  label="Original Price"
                  value={data.pricing.originalPrice}
                  note={data.previousDesign.shortName}
                />
                <PriceCard
                  label="New Price"
                  value={data.pricing.newPrice}
                  note={data.newDesign.shortName}
                />
                <PriceCard
                  label="Additional Cost"
                  value={data.pricing.additionalCost}
                  note={data.pricing.additionalNote}
                  accent
                />
                <PriceCard
                  label="Updated Duration"
                  value={data.pricing.updatedDuration}
                  note={data.pricing.durationNote}
                />
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-[14px] border border-[#f1ddb2] bg-[linear-gradient(135deg,#fff4dc_0%,#ffe9b7_100%)] px-4 py-3 text-sm text-[#9a6610]">
                <CircleAlert size={18} className="mt-0.5 shrink-0" />
                <p className="font-semibold">{data.pricing.warning}</p>
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
              <SectionTitle icon={Check} title="Customer Confirmation" />
              <div className="mt-5 space-y-3">
                {confirmations.map((item) => (
                  <ConfirmationRow
                    key={item.key}
                    item={item}
                    checked={item.checked}
                    onToggle={() => toggleConfirmation(item.key)}
                  />
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
              <SectionTitle icon={FilePenLine} title="Booking Update Actions" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!allConfirmed}
                  className={`rounded-[12px] px-4 py-3 text-xs font-bold transition ${
                    allConfirmed
                      ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
                      : "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                  }`}
                >
                  Confirm Updated Booking
                </button>
                <button
                  type="button"
                  className="rounded-[12px] border border-[#f2bfd4] bg-white px-4 py-3 text-xs font-bold text-[#ea4f93]"
                >
                  Save & Continue
                </button>
                <button
                  type="button"
                  onClick={() => navigate(designStudioRoute)}
                  className="rounded-[12px] border border-[#ddd0d8] bg-white px-4 py-3 text-xs font-bold text-[#856f80]"
                >
                  Return to Design Studio
                </button>
                <button
                  type="button"
                  onClick={() => navigate(detailRoute)}
                  className="rounded-[12px] border border-[#ddd0d8] bg-white px-4 py-3 text-xs font-bold text-[#856f80]"
                >
                  Back to Booking Detail
                </button>
                <button
                  type="button"
                  className="sm:col-span-2 rounded-[12px] border border-[#f0c2cf] bg-[#fff4f7] px-4 py-3 text-xs font-bold text-[#d84b80]"
                >
                  Cancel Changes
                </button>
              </div>
            </article>
          </div>

          <aside className="space-y-4">
            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4">
              <SectionTitle icon={ClipboardCheck} title="Booking Summary" />
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["Customer", data.customer],
                  ["Staff Artist", data.staffArtist],
                  ["Appointment", data.appointment],
                  ["Chair", data.chair],
                  ["Status", data.summaryStatus],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3 last:border-b-0 last:pb-0">
                    <span className="text-[11px] text-[#a98c9f]">{label}</span>
                    <span className="text-right text-xs font-extrabold text-[#3f2b3f]">
                      {label === "Status" ? (
                        <Tag className="border-[#f1ddac] bg-[#fff4da] text-[#bd8517]">{value}</Tag>
                      ) : (
                        value
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4">
              <SectionTitle icon={Sparkles} title="Design Update Status" />
              <div className="mt-4 space-y-3 text-sm">
                {Object.entries(data.designStatus).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3 last:border-b-0 last:pb-0">
                    <span className="text-[11px] capitalize text-[#a98c9f]">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <Tag
                      className={
                        value === "Confirmed"
                          ? "border-[#cdeed7] bg-[#effcf3] text-[#22a865]"
                          : value === "Pending"
                            ? "border-[#f2bfd4] bg-[#fff1f7] text-[#ea4f93]"
                            : "border-[#f4dbe7] bg-white text-[#856f80]"
                      }
                    >
                      {value}
                    </Tag>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4">
              <SectionTitle icon={Star} title="Recommended Add-ons" />
              <div className="mt-4 space-y-3">
                {data.addOns.map((item) => (
                  <AddonRow key={item.title} item={item} />
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4">
              <SectionTitle icon={Check} title="Next Step" />
              <p className="mt-4 text-xs leading-5 text-[#a88a9d]">
                Complete all confirmations above, then proceed to confirm the booking and start the service session.
              </p>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  disabled={!allConfirmed}
                  className={`w-full rounded-[12px] px-4 py-3 text-xs font-bold ${
                    allConfirmed
                      ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
                      : "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                  }`}
                >
                  Confirm Booking
                </button>
                <button
                  type="button"
                  onClick={handleOpenServiceSession}
                  className="w-full rounded-[12px] border border-[#f2bfd4] bg-white px-4 py-3 text-xs font-bold text-[#ea4f93]"
                >
                  Start Service Session
                </button>
                <button
                  type="button"
                  className="w-full rounded-[12px] bg-[linear-gradient(135deg,#f36b98_0%,#e24384_100%)] px-4 py-3 text-xs font-bold text-white"
                >
                  Change staff artist
                </button>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}
