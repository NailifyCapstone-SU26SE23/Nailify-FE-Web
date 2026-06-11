import {
  ArrowUp,
  CalendarClock,
  Check,
  CheckCheck,
  ClipboardCheck,
  Clock3,
  Palette,
  PencilLine,
  Search,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";

const STEP_STYLES = {
  complete: {
    bullet: "bg-[image:var(--gradient-accent)] text-white shadow-[0_10px_20px_rgba(236,72,153,0.18)]",
    label: "text-[#ea4f93]",
    line: "bg-[#f3bfd4]",
  },
  current: {
    bullet: "bg-[image:var(--gradient-accent)] text-white shadow-[0_10px_20px_rgba(236,72,153,0.18)]",
    label: "text-[#ea4f93]",
    line: "bg-[#f3bfd4]",
  },
  upcoming: {
    bullet: "border border-[#f2cade] bg-[#fff7fb] text-[#d45b9f]",
    label: "text-[#9f8a9a]",
    line: "bg-[#f6dce8]",
  },
};

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[#ea4f93]" />
      <h2 className="text-xs font-extrabold text-[#ea4f93]">{title}</h2>
    </div>
  );
}

SectionTitle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
};

function InfoCard({ label, value, note, tone = "default" }) {
  const valueTone = tone === "success" ? "text-[#16a34a]" : "text-[#3f2b3f]";

  return (
    <article className="rounded-[16px] border border-[#f6dbe7] bg-[#fff9fc] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">{label}</p>
      <p className={`mt-2 text-sm font-extrabold ${valueTone}`}>{value}</p>
      <p className="mt-1 text-xs text-[#9a7f90]">{note}</p>
    </article>
  );
}

InfoCard.propTypes = {
  label: PropTypes.string.isRequired,
  note: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(["default", "success"]),
  value: PropTypes.string.isRequired,
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

function SuggestedCard({ item }) {
  return (
    <article className="flex items-center gap-3 rounded-[14px] border border-[#f6dbe7] bg-white p-2.5">
      <img
        src={item.image}
        alt={item.name}
        className="h-11 w-11 rounded-xl object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold text-[#432744]">{item.name}</p>
        <p className="mt-1 text-[10px] text-[#aa8c9f]">{item.meta}</p>
      </div>
    </article>
  );
}

SuggestedCard.propTypes = {
  item: PropTypes.shape({
    image: PropTypes.string.isRequired,
    meta: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

export function StaffBookingConsultationDetail({ data, onDelete, onOpenDesignStudio, onSave }) {
  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff5fa_100%)]">
      <div className="rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">

        <div className="mt-4 rounded-[22px] border border-[#f3d5e2] bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {data.steps.map((step, index) => {
              const tone = STEP_STYLES[step.state];

              return (
                <div key={step.key} className="flex flex-1 items-center gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${tone.bullet}`}>
                    {index + 1}
                  </div>
                  <p className={`whitespace-nowrap text-xs font-bold ${tone.label}`}>{step.label}</p>
                  {index < data.steps.length - 1 ? (
                    <div className={`hidden h-px flex-1 md:block ${tone.line}`} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
            <SectionTitle icon={UserRound} title="Customer Information" />

            <div className="mt-5 flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <img
                  src={data.customer.avatar}
                  alt={data.customer.name}
                  className="h-14 w-14 rounded-full border-[3px] border-[#f4d6e4] object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-2xl font-extrabold text-[#3f2b3f]">{data.customer.name}</p>
                      <p className="mt-1 text-sm text-[#9a7f90]">{data.customer.phone}</p>
                    </div>
                    <Tag className="border-[#f3ddab] bg-[#fff8df] text-[#d39a1d]">
                      <Star size={11} className="mr-1 inline-block fill-current" />
                      {data.customer.memberTier}
                    </Tag>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {data.customer.facts.map((item) => (
                      <div key={item.label}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#4b3348]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[12px] border border-[#f5cada] bg-[#fff1f6] px-4 py-3 text-sm text-[#d44b88]">
                <span className="font-bold">Allergy Note:</span> {data.customer.allergyNote}
              </div>

              <p className="text-sm text-[#7a6275]">
                <span className="font-medium text-[#a08697]">Customer Preferences:</span>{" "}
                {data.customer.preferences}
              </p>
            </div>
          </article>

          <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
            <SectionTitle icon={CalendarClock} title="Booking Information" />
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.bookingInfo.map((item) => (
                <InfoCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  note={item.note}
                  tone={item.tone}
                />
              ))}
            </div>
          </article>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <SectionTitle icon={Sparkles} title="Current Selected Nail Design" />

                <div className="mt-5 flex flex-col gap-4 lg:flex-row">
                  <img
                    src={data.design.image}
                    alt={data.design.name}
                    className="h-40 w-full rounded-[18px] object-cover lg:w-44"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1">
                    <h3 className="text-[1.5rem] font-extrabold text-[#ea4f93]">{data.design.name}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {data.design.details.map((item) => (
                        <div key={item.label}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#4b3348]">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {data.design.tags.map((tag) => (
                        <Tag key={tag.label} className={tag.className}>
                          {tag.label}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <SectionTitle icon={Search} title="Customer Consultation" />
                <div className="mt-5 flex flex-col items-center gap-6 text-center">
                  <p className="text-lg font-bold text-[#3f2b3f]">
                    Does the customer want to continue with the selected nail design — {data.design.name}?
                  </p>
                  <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[image:var(--gradient-accent)] px-5 py-4 text-sm font-bold text-white shadow-[0_16px_28px_rgba(236,72,153,0.2)]"
                    >
                      <Check size={16} />
                      Confirm Current Design
                    </button>
                    <button
                      type="button"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-[#f4cada] bg-white px-5 py-4 text-sm font-bold text-[#ea4f93]"
                    >
                      <Palette size={16} />
                      Choose Another Design
                    </button>
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <SectionTitle icon={PencilLine} title="Staff Notes" />
                <div className="mt-5 space-y-4">
                  {data.staffNotes.map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                        {item.label}
                      </p>
                      <div className="mt-2 rounded-[14px] border border-[#f6dbe7] bg-[#fff9fc] px-4 py-4 text-sm text-[#634d5f]">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <SectionTitle icon={ClipboardCheck} title="Final Confirmation Checklist" />
                <div className="mt-5 space-y-3">
                  {data.checklist.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-sm font-semibold ${item.checked
                          ? "border-[#f2a9c9] bg-[#fff1f7] text-[#d74f8d]"
                          : "border-[#f0d8e3] bg-white text-[#6f5c6b]"
                        }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${item.checked
                            ? "border-[#df5c96] bg-[#df5c96] text-white"
                            : "border-[#e4cbd7] bg-[#fff7fb] text-transparent"
                          }`}
                      >
                        <Check size={12} />
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onSave}
                  className="mt-5 w-full rounded-[14px] bg-[image:var(--gradient-accent)] px-5 py-4 text-sm font-bold text-white shadow-[0_16px_28px_rgba(236,72,153,0.2)]"
                >
                  Proceed to Service Session
                </button>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onOpenDesignStudio}
                    className="rounded-[12px] border border-[#f4cada] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                  >
                    Open Design Studio
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    className="rounded-[12px] border border-[#f4cada] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                  >
                    Update Booking
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-[12px] border border-[#ddd0d8] bg-white px-4 py-2.5 text-xs font-bold text-[#8e7786]"
                  >
                    Back to Queue
                  </button>
                </div>
              </article>
            </div>

            <aside className="space-y-4 border-t border-[#f3d5e2] pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
              <article className="rounded-[18px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                <SectionTitle icon={Clock3} title="Session Status" />
                <div className="mt-4 space-y-3">
                  {data.sessionStatus.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3 text-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                        {item.label}
                      </p>
                      <p className="text-right font-bold text-[#432744]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[18px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                <SectionTitle icon={ArrowUp} title="Customer History" />
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                      Favorite Styles
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {data.customerHistory.favoriteStyles.map((tag) => (
                        <Tag key={tag.label} className={tag.className}>
                          {tag.label}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                      Previous Nail Shapes
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#4b3348]">
                      {data.customerHistory.previousShapes}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                      Last Uploaded Photo
                    </p>
                    <div className="mt-2 flex items-center gap-3 rounded-[14px] border border-[#f6dbe7] bg-white p-2.5">
                      <img
                        src={data.customerHistory.lastUpload.image}
                        alt={data.customerHistory.lastUpload.title}
                        className="h-12 w-12 rounded-xl object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs font-extrabold text-[#432744]">
                          {data.customerHistory.lastUpload.title}
                        </p>
                        <p className="mt-1 text-[10px] text-[#a98b9d]">
                          {data.customerHistory.lastUpload.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-[18px] border border-[#f3d5e2] bg-white p-4">
                <SectionTitle icon={Sparkles} title="Suggested Designs" />
                <div className="mt-4 space-y-3">
                  {data.suggestedDesigns.map((item) => (
                    <SuggestedCard key={item.name} item={item} />
                  ))}
                </div>
              </article>

              <article className="rounded-[18px] border border-[#f3d5e2] bg-white p-4">
                <SectionTitle icon={CheckCheck} title="Next Actions" />
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={onSave}
                    className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#f4cada] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                  >
                    <PencilLine size={13} />
                    Update Booking
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDesignStudio}
                    className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#f4cada] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                  >
                    <Search size={13} />
                    Open Design Studio
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white"
                  >
                    <ArrowUp size={13} />
                    Start Service
                  </button>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

StaffBookingConsultationDetail.propTypes = {
  data: PropTypes.shape({
    artistInitials: PropTypes.string.isRequired,
    bookingCode: PropTypes.string.isRequired,
    bookingInfo: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        note: PropTypes.string.isRequired,
        tone: PropTypes.oneOf(["default", "success"]),
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
    checklist: PropTypes.arrayOf(
      PropTypes.shape({
        checked: PropTypes.bool.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ).isRequired,
    customer: PropTypes.shape({
      allergyNote: PropTypes.string.isRequired,
      avatar: PropTypes.string.isRequired,
      facts: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ).isRequired,
      memberTier: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      preferences: PropTypes.string.isRequired,
    }).isRequired,
    customerHistory: PropTypes.shape({
      favoriteStyles: PropTypes.arrayOf(
        PropTypes.shape({
          className: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        }),
      ).isRequired,
      lastUpload: PropTypes.shape({
        date: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
      }).isRequired,
      previousShapes: PropTypes.string.isRequired,
    }).isRequired,
    design: PropTypes.shape({
      details: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ).isRequired,
      image: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(
        PropTypes.shape({
          className: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        }),
      ).isRequired,
    }).isRequired,
    sessionStatus: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
    staffNotes: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
    statusLabel: PropTypes.string.isRequired,
    steps: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        state: PropTypes.oneOf(["complete", "current", "upcoming"]).isRequired,
      }),
    ).isRequired,
    suggestedDesigns: PropTypes.arrayOf(
      PropTypes.shape({
        image: PropTypes.string.isRequired,
        meta: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onOpenDesignStudio: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};
