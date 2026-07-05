import { FileText, Sparkles, UserRound, X } from "lucide-react";
import { PropTypes } from "../../utils/propTypes";

function normalizeBookingText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getUniqueBookingLabels(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeBookingText).filter(Boolean))];
}

function buildNotesSections(booking) {
  const bookingItems = Array.isArray(booking?.bookingItems) ? booking.bookingItems : [];
  const serviceNames = getUniqueBookingLabels(bookingItems.map((item) => item?.serviceName));
  const customerRequest =
    bookingItems.find((item) => normalizeBookingText(item?.customerNailName))?.customerNailName
    || booking?.customerNote
    || "No customer note from API.";
  const designAdjustment =
    bookingItems.find((item) => normalizeBookingText(item?.nailVariantName))?.nailVariantName
    || booking?.designName
    || "Capture final design adjustments during consultation.";
  const notesBeforeService =
    serviceNames.join(", ")
    || booking?.uiService
    || "Verify services, confirm timing, then start session.";

  return [
    { label: "Customer Requests", value: customerRequest },
    { label: "Design Adjustments", value: designAdjustment },
    { label: "Notes Before Service", value: notesBeforeService },
  ];
}

export function StaffBookingNotesModal({ booking, open, onClose }) {
  if (!open || !booking) {
    return null;
  }

  const notesSections = buildNotesSections(booking);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2f1322]/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#f1cade] bg-white shadow-[0_30px_80px_rgba(63,43,63,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
              Staff Booking Notes
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-[#ea4f93]">
              {booking?.customerName || "Booking Notes"}
            </h3>
            <p className="mt-1 text-sm text-[#a88a9d]">
              {booking?.uiId || `Booking #${booking?.id || "--"}`} • {booking?.uiStatus || booking?.status || "--"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff5f8]"
            aria-label="Close notes modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[18px] border border-[#f6dbe7] bg-[#fff9fc] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffe8f2] text-[#ea4f93]">
                <UserRound size={18} />
              </span>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Customer</p>
              <p className="mt-2 text-sm font-extrabold text-[#3f2b3f]">{booking?.customerName || "--"}</p>
            </article>

            <article className="rounded-[18px] border border-[#f6dbe7] bg-[#fff9fc] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4e8] text-[#d9871c]">
                <FileText size={18} />
              </span>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Service</p>
              <p className="mt-2 text-sm font-extrabold text-[#3f2b3f]">{booking?.uiService || "--"}</p>
            </article>

            <article className="rounded-[18px] border border-[#f6dbe7] bg-[#fff9fc] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eefaf3] text-[#16a34a]">
                <Sparkles size={18} />
              </span>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Staff Artist</p>
              <p className="mt-2 text-sm font-extrabold text-[#3f2b3f]">{booking?.staffName || "--"}</p>
            </article>
          </div>

          <div className="mt-6 space-y-4">
            {notesSections.map((section) => (
              <article
                key={section.label}
                className="rounded-[20px] border border-[#f3d5e2] bg-[#fffafd] p-5 shadow-[0_10px_24px_rgba(236,72,153,0.04)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                  {section.label}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#5f4a5c]">
                  {section.value || "--"}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

StaffBookingNotesModal.propTypes = {
  booking: PropTypes.shape({
    bookingItems: PropTypes.arrayOf(
      PropTypes.shape({
        customerNailName: PropTypes.string,
        nailVariantName: PropTypes.string,
        serviceName: PropTypes.string,
      }),
    ),
    customerName: PropTypes.string,
    customerNote: PropTypes.string,
    designName: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    staffName: PropTypes.string,
    status: PropTypes.string,
    uiId: PropTypes.string,
    uiService: PropTypes.string,
    uiStatus: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
