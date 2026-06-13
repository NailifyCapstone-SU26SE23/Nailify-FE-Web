import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FilePenLine,
  Heart,
  Image,
  ImageUp,
  Pause,
  Play,
  Plus,
  Printer,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import {
  getStaffBookingDesignUpdateRoute,
  getStaffBookingDetailRoute,
  ROUTES,
} from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { getMockBookingById } from "../../../core/booking-management/services/mockBookings";

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#fff0f6_0%,#ffe5ef_100%)] text-[#ea4f93]">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-sm font-extrabold text-[#3f2b3f]">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-[#a88a9d]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

SectionTitle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
};

function ProgressStep({ step, index, isLast }) {
  const stateClasses = {
    active: {
      dot: "bg-[image:var(--gradient-accent)] text-white shadow-[0_10px_20px_rgba(236,72,153,0.2)]",
      label: "text-[#ea4f93]",
      pill: "bg-[#ffe9f3] text-[#ea4f93]",
      line: "bg-[#f4c6da]",
    },
    upcoming: {
      dot: "border border-slate-300 bg-white text-slate-500",
      label: "text-slate-500",
      pill: "bg-slate-100 text-slate-500",
      line: "bg-slate-200",
    },
    complete: {
      dot: "bg-[linear-gradient(135deg,#34d399_0%,#10b981_100%)] text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)]",
      label: "text-emerald-600",
      pill: "bg-emerald-50 text-emerald-600",
      line: "bg-emerald-200",
    },
  };

  const tone = stateClasses[step.state];

  return (
    <div className="flex flex-1 items-start gap-3">
      <div className="flex flex-1 items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${tone.dot}`}
        >
          {step.state === "complete" ? <Check size={16} /> : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-extrabold ${tone.label}`}>{step.label}</p>
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${tone.pill}`}
          >
            {step.statusLabel}
          </span>
        </div>
      </div>
      {!isLast ? <div className={`mt-4 hidden h-px flex-1 xl:block ${tone.line}`} /> : null}
    </div>
  );
}

ProgressStep.propTypes = {
  index: PropTypes.number.isRequired,
  isLast: PropTypes.bool.isRequired,
  step: PropTypes.shape({
    label: PropTypes.string.isRequired,
    state: PropTypes.oneOf(["active", "upcoming", "complete"]).isRequired,
    statusLabel: PropTypes.string.isRequired,
  }).isRequired,
};

function SummaryValue({ label, value, accent = false }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">{label}</p>
      <p className={`mt-1 text-sm font-bold ${accent ? "text-[#ea4f93]" : "text-[#3f2b3f]"}`}>{value}</p>
    </div>
  );
}

SummaryValue.propTypes = {
  accent: PropTypes.bool,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

function ConfirmationItem({ checked, label, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
        checked
          ? "border-[#f2bfd4] bg-[#fff1f7] text-[#3f2b3f]"
          : "border-[#f4dbe7] bg-[#fff9fc] text-[#6f5c6b] hover:bg-[#fff4f8]"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          checked
            ? "bg-[image:var(--gradient-accent)] text-white"
            : "bg-white text-transparent ring-1 ring-[#e7cfdb]"
        }`}
      >
        <Check size={12} />
      </span>
      <span>{label}</span>
    </button>
  );
}

ConfirmationItem.propTypes = {
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
};

function SessionChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#f2bfd4] bg-[#fff5f9] px-3 py-1.5 text-[11px] font-semibold text-[#866f80]">
      <Icon size={13} className="text-[#ea4f93]" />
      {label}
    </span>
  );
}

SessionChip.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
};

function ActionGhostButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f2bfd4] bg-white px-4 py-3 text-sm font-bold text-[#ea4f93] transition hover:bg-[#fff5f8]"
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

ActionGhostButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

function CompareSummaryCard({ label, value, note, accent = false }) {
  return (
    <div className="rounded-[18px] border border-[#f2d3e1] bg-white p-4 shadow-[0_6px_18px_rgba(236,72,153,0.05)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c197ad]">{label}</p>
      <p className={`mt-2 text-sm font-extrabold ${accent ? "text-[#ea4f93]" : "text-[#3f2b3f]"}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[#a88a9d]">{note}</p>
    </div>
  );
}

CompareSummaryCard.propTypes = {
  accent: PropTypes.bool,
  label: PropTypes.string.isRequired,
  note: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

function CompareActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "primary",
  disabled = false,
}) {
  const toneClassName = {
    primary:
      "border-transparent bg-[image:var(--gradient-accent)] text-white shadow-[0_14px_24px_rgba(236,72,153,0.2)]",
    secondary: "border-[#eadcf4] bg-[#f8f0ff] text-[#8b5cf6]",
    success: "border-[#ccefdc] bg-[#ecfbf2] text-[#16a365]",
    outline: "border-[#f2bfd4] bg-white text-[#ea4f93]",
    muted: "border-[#ece4ea] bg-[#f7f4f6] text-[#9b8c97]",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5"
      } ${toneClassName}`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

CompareActionButton.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  tone: PropTypes.oneOf(["muted", "outline", "primary", "secondary", "success"]),
};

export function StaffServiceSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams();
  const booking = getMockBookingById(bookingId);
  const payload = location.state?.serviceSession;

  const fallbackData = useMemo(() => {
    if (!booking) {
      return null;
    }

    return {
      bookingCode: booking.id.replace("BKG", "BK"),
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerAvatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80",
      serviceLabel: booking.service,
      staffArtist: booking.staffName,
      chair: "Chair 03",
      appointmentTime: `${booking.bookingTime} - ${booking.duration}`,
      estimatedDuration: booking.duration,
      estimatedFinishTime: "11:30 AM",
      completedAt: "11:25 AM",
      designName: "Confirmed service design",
      totalPrice: booking.total,
      totalAmount: "$94.50",
      originalServicePrice: "$85.00",
      extraServiceFee: "$20.00",
      discountLabel: "Discount (Member 10%)",
      discountValue: "- $10.50",
      remainingBalance: "$94.50",
      beforePhotoTimestamp: "9:52 AM - Today",
      currentProcess: "Chrome color application",
      remainingTime: "35 minutes",
      materialsUsed: ["Gel Polish", "Chrome Powder", "Top Coat"],
      stepNote: "Customer requested softer chrome finish.",
      customerNotes: [
        "Sensitive nails - handle with care",
        "Avoid strong acetone smell",
        "Prefers elegant chrome style",
      ],
      backRoute: getStaffBookingDetailRoute(bookingId),
      designUpdateRoute: getStaffBookingDesignUpdateRoute(bookingId),
      confirmations: [
        "Customer identity confirmed",
        "Service design confirmed",
        "Price confirmed",
        "Before photo uploaded",
      ],
    };
  }, [booking, bookingId]);

  const data = useMemo(() => {
    if (!fallbackData && !payload) {
      return null;
    }

    return {
      ...fallbackData,
      ...payload,
      confirmations: payload?.confirmations ?? fallbackData?.confirmations ?? [],
      materialsUsed: payload?.materialsUsed ?? fallbackData?.materialsUsed ?? [],
      customerNotes: payload?.customerNotes ?? fallbackData?.customerNotes ?? [],
    };
  }, [fallbackData, payload]);

  const procedureSteps = useMemo(
    () => [
      "Step 1: Client Consultation",
      "Step 2: Sanitation & Preparation",
      "Step 3: Remove Old Product",
      "Step 4: Nail Shaping",
      "Step 5: Cuticle Care",
      "Step 6: Base Application",
      "Step 7: Color & Nail Art",
      "Step 8: Top Coat & Finish",
      "Step 9: Final Review",
    ],
    [],
  );

  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [started, setStarted] = useState(Boolean(payload?.started));
  const [completed, setCompleted] = useState(Boolean(payload?.completed));
  const [flashMessage, setFlashMessage] = useState("");
  const [beforePhoto, setBeforePhoto] = useState(payload?.beforePhoto ?? null);
  const [afterPhoto, setAfterPhoto] = useState(payload?.afterPhoto ?? null);
  const [sessionNote, setSessionNote] = useState(payload?.sessionNote ?? "");
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [confirmations, setConfirmations] = useState(
    (data?.confirmations ?? []).map((label, index) => ({
      label,
      checked: payload?.started ? true : index < 3,
    })),
  );
  const [completionChecks, setCompletionChecks] = useState([
    { label: "Service completed", checked: true },
    { label: "Customer reviewed final nails", checked: true },
    { label: "After photo uploaded", checked: Boolean(payload?.afterPhoto) },
  ]);

  useEffect(() => {
    return () => {
      if (beforePhoto?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(beforePhoto.previewUrl);
      }
      if (afterPhoto?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(afterPhoto.previewUrl);
      }
    };
  }, [afterPhoto, beforePhoto]);

  if (!data) {
    return <Navigate to={ROUTES.staffBookings} replace />;
  }

  const phase = !started ? "start" : completed ? "done" : "progress";
  const allConfirmed = confirmations.every((item) => item.checked);
  const canStartService = allConfirmed && Boolean(beforePhoto);
  const canCompleteSession = completionChecks.every((item) => item.checked) && Boolean(afterPhoto);
  const canOpenComparison = Boolean(beforePhoto) && Boolean(afterPhoto);
  const serviceProgress = phase === "done" ? 100 : started ? 65 : beforePhoto ? 35 : 0;

  const handleToggleConfirmation = (label) => {
    setConfirmations((current) =>
      current.map((item) => (item.label === label ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleToggleCompletionCheck = (label) => {
    setCompletionChecks((current) =>
      current.map((item) => (item.label === label ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleBeforePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (beforePhoto?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(beforePhoto.previewUrl);
    }

    const now = new Date();
    setBeforePhoto({
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      uploadedAt: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    });
    setConfirmations((current) =>
      current.map((item) =>
        item.label === "Before photo uploaded" ? { ...item, checked: true } : item,
      ),
    );
  };

  const handleAfterPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (afterPhoto?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(afterPhoto.previewUrl);
    }

    const now = new Date();
    setAfterPhoto({
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      uploadedAt: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      fileSizeLabel: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    });
    setCompletionChecks((current) =>
      current.map((item) =>
        item.label === "After photo uploaded" ? { ...item, checked: true } : item,
      ),
    );
  };

  const handleStartService = () => {
    setShowStartConfirm(false);
    setStarted(true);
    setFlashMessage(
      "Service session started successfully. The booking is now in the live service phase.",
    );
  };

  const handleMarkServiceDone = () => {
    setCompleted(true);
    setFlashMessage(
      "Service marked as done. Upload the after-service photo and complete the final review.",
    );
  };

  const handleCompleteSession = () => {
    setShowCompleteConfirm(false);
    setFlashMessage(
      "Session completed successfully. The booking is ready for payment and history archiving.",
    );
  };

  const handleSessionAction = (message) => {
    setFlashMessage(message);
  };

  const handleOpenComparison = () => {
    if (!canOpenComparison) {
      handleSessionAction("Upload both before and after photos to prepare the comparison view.");
      return;
    }

    setShowComparisonView(true);
    setFlashMessage("");
  };

  const progressSteps = [
    {
      label: "Start",
      statusLabel: started ? "Complete" : "Active",
      state: started ? "complete" : "active",
    },
    {
      label: "In Progress",
      statusLabel: completed ? "Complete" : started ? "Active" : "Not Yet",
      state: completed ? "complete" : started ? "active" : "upcoming",
    },
    {
      label: "Done",
      statusLabel: completed ? "Active" : "Not Yet",
      state: completed ? "active" : "upcoming",
    },
  ];

  const qualityChecks = [
    "Shape matches selected design",
    "Color matches selected design",
    "Decoration completed",
    "Final photo uploaded",
    "Customer approved result",
  ];

  if (showComparisonView) {
    return (
      <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff3f8_100%)]">
        <header className="rounded-[24px] border border-[#f3d5e2] bg-white/90 p-5 shadow-[0_14px_30px_rgba(236,72,153,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setShowComparisonView(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff4f8]"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-[1.65rem] font-black tracking-tight text-[#3f2b3f]">
                  Before & After Comparison
                </h1>
                <p className="mt-1 text-sm text-[#a88a9d]">
                  Compare customer hand photos before and after the nail service.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl border border-[#f2bfd4] bg-[#fff1f7] px-4 py-2 text-xs font-extrabold text-[#ea4f93]">
                #{data.bookingCode}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Completed
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-xs font-extrabold text-white">
                {data.staffArtist
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>
          </div>
        </header>

        <article className="rounded-[24px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
          <SectionTitle
            icon={Clock3}
            title="Session Progress"
            subtitle="Completed proof of the service workflow."
          />
          <div className="mt-6 flex flex-col gap-5 xl:flex-row">
            {[
              { label: "Start", statusLabel: "Completed", state: "complete" },
              { label: "In Progress", statusLabel: "Completed", state: "complete" },
              { label: "Done", statusLabel: "Completed", state: "complete" },
            ].map((step, index, list) => (
              <ProgressStep
                key={step.label}
                step={step}
                index={index}
                isLast={index === list.length - 1}
              />
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
          <SectionTitle
            icon={Camera}
            title="Photo Comparison"
            subtitle="Side-by-side view of the nail transformation."
          />

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] xl:items-center">
            <div className="overflow-hidden rounded-[22px] border border-[#f3d5e2] bg-[#fff8fb]">
              <div className="flex items-center justify-between border-b border-[#f8e3ec] px-4 py-3">
                <p className="text-sm font-extrabold text-[#3f2b3f]">Before Service</p>
                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-bold text-amber-600">
                  Before Photo
                </span>
              </div>
              <div className="p-4">
                <div className="overflow-hidden rounded-[18px] border border-[#f0d5e2] bg-white">
                  <img
                    src={beforePhoto.previewUrl}
                    alt={beforePhoto.fileName}
                    className="h-[320px] w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-[#f3dbe6] bg-white px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff1f7] text-[#ea4f93]">
                    <Clock3 size={14} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#b59aab]">Uploaded at</p>
                    <p className="text-sm font-bold text-[#3f2b3f]">{beforePhoto.uploadedAt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-white shadow-[0_12px_20px_rgba(236,72,153,0.24)]">
                <ArrowRight size={18} />
              </div>
              <div className="rounded-xl border border-[#f2bfd4] bg-[#fff5fa] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#ea4f93]">
                Transformation
                <br />
                Result
              </div>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-[#f3d5e2] bg-[#fff8fb]">
              <div className="flex items-center justify-between border-b border-[#f8e3ec] px-4 py-3">
                <p className="text-sm font-extrabold text-[#3f2b3f]">After Service</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                  After Photo
                </span>
              </div>
              <div className="p-4">
                <div className="overflow-hidden rounded-[18px] border border-[#f0d5e2] bg-white">
                  <img
                    src={afterPhoto.previewUrl}
                    alt={afterPhoto.fileName}
                    className="h-[320px] w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-[#f3dbe6] bg-white px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff1f7] text-[#ea4f93]">
                    <Clock3 size={14} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#b59aab]">Uploaded at</p>
                    <p className="text-sm font-bold text-[#3f2b3f]">{afterPhoto.uploadedAt}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <CompareSummaryCard label="Service" value={data.serviceLabel} note={data.designName} />
          <CompareSummaryCard label="Staff Artist" value={data.staffArtist} note="Senior Artist" />
          <CompareSummaryCard label="Duration" value={data.estimatedDuration} note="On schedule" />
          <CompareSummaryCard label="Design Match" value="96%" note="Excellent" accent />
          <CompareSummaryCard label="Satisfaction" value="Pending" note="Awaiting review" />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <article className="rounded-[24px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 rounded-full bg-[image:var(--gradient-accent)]" />
              <h2 className="text-sm font-extrabold text-[#3f2b3f]">Quality Check</h2>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {qualityChecks.map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white">
                    <Check size={12} />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <CompareActionButton
                icon={Receipt}
                label="Save to Customer History"
                tone="primary"
                onClick={() =>
                  handleSessionAction("Completed comparison can now be saved to the customer history.")
                }
              />
              <CompareActionButton
                icon={Heart}
                label="Add to Staff Portfolio"
                tone="secondary"
                onClick={() =>
                  handleSessionAction("This completed nail set can be added to the staff portfolio.")
                }
              />
              <CompareActionButton
                icon={Send}
                label="Send to Customer"
                tone="success"
                onClick={() =>
                  handleSessionAction("Comparison proof has been prepared to send to the customer.")
                }
              />
              <CompareActionButton
                icon={CreditCard}
                label="Go to Payment"
                tone="outline"
                onClick={() =>
                  navigate(data.backRoute, {
                    state: {
                      fromServiceSession: true,
                      readyForCheckout: true,
                    },
                  })
                }
              />
              <CompareActionButton
                icon={ArrowLeft}
                label="Back to Service Session"
                tone="muted"
                onClick={() => setShowComparisonView(false)}
              />
            </div>
          </article>

          <aside className="space-y-4">
            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d75d93]">
                Customer
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={data.customerAvatar}
                  alt={data.customerName}
                  className="h-14 w-14 rounded-full border border-[#f2bfd4] object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-sm font-extrabold text-[#3f2b3f]">{data.customerName}</p>
                  <span className="mt-1 inline-flex rounded-full bg-[#ffd771] px-2.5 py-1 text-[10px] font-bold text-[#9a5b00]">
                    Gold Member
                  </span>
                  <p className="mt-2 text-xs text-[#a88a9d]">#{data.bookingCode}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d75d93]">
                Selected Design
              </p>
              <div className="mt-4 overflow-hidden rounded-[16px] border border-[#f1d4e1]">
                <img
                  src={afterPhoto.previewUrl}
                  alt={data.designName}
                  className="h-32 w-full object-cover"
                />
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["Shape", "Almond"],
                  ["Length", "Medium"],
                  ["Color", "Pearl Chrome"],
                  ["Finish", "Glossy"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-[#b08ea2]">{label}</span>
                    <span className="font-bold text-[#3f2b3f]">{value}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d75d93]">
                Proof Record
              </p>
              <div className="mt-4 space-y-3 text-sm text-[#866f80]">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ea4f93]" />
                  <div>
                    <p>Before photo uploaded</p>
                    <p className="font-bold text-[#3f2b3f]">{beforePhoto.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ea4f93]" />
                  <div>
                    <p>After photo uploaded</p>
                    <p className="font-bold text-[#3f2b3f]">{afterPhoto.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ea4f93]" />
                  <div>
                    <p>Verified by</p>
                    <p className="font-bold text-[#3f2b3f]">{data.staffArtist}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p>Session status</p>
                    <p className="font-bold text-emerald-600">Completed</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d75d93]">
                Next Step
              </p>
              <div className="mt-4 space-y-3">
                <CompareActionButton
                  icon={Receipt}
                  label="Checkout"
                  tone="primary"
                  onClick={() =>
                    navigate(data.backRoute, {
                      state: {
                        fromServiceSession: true,
                        readyForCheckout: true,
                      },
                    })
                  }
                />
                <CompareActionButton
                  icon={ClipboardCheck}
                  label="Request Review"
                  tone="outline"
                  onClick={() =>
                    handleSessionAction("Customer review request can be sent after comparison is confirmed.")
                  }
                />
                <CompareActionButton
                  icon={Printer}
                  label="Print Receipt"
                  tone="secondary"
                  onClick={() => handleSessionAction("Receipt printing can be prepared from the final payment flow.")}
                />
              </div>
            </article>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f9_100%)]">
      <header className="rounded-[24px] border border-[#f6dbe8] bg-white/90 p-5 shadow-[0_14px_30px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#f2bfd4] bg-[#fff1f7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ea4f93]">
                Service Session
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                  phase === "done"
                    ? "border-[#f3bfd4] bg-[image:var(--gradient-accent)] text-white"
                    : phase === "progress"
                      ? "border-rose-200 bg-[linear-gradient(135deg,#fff1f7_0%,#ffe3ee_100%)] text-[#d65b92]"
                      : "border-[#f2bfd4] bg-[#fff5f8] text-[#d65b92]"
                }`}
              >
                {phase === "done" ? "Done" : phase === "progress" ? "In Progress" : "Start"}
              </span>
            </div>
            <h1 className="mt-3 text-[1.9rem] font-black tracking-tight text-[#3f2b3f]">
              Service Session
            </h1>
            <p className="mt-2 text-sm text-[#a88a9d]">
              {phase === "done"
                ? "Upload after-service hand photo to complete the session."
                : phase === "progress"
                  ? "Current nail service is in progress."
                  : "Upload a before-service hand photo and complete the final checks before starting the nail session."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#f2bfd4] bg-[#fff1f7] px-4 py-2 text-xs font-extrabold text-[#ea4f93]">
              #{data.bookingCode}
            </span>
            <button
              type="button"
              onClick={() => navigate(data.designUpdateRoute)}
              className="rounded-xl border border-[#f2bfd4] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              Update Design
            </button>
            <button
              type="button"
              onClick={() => navigate(data.backRoute)}
              className="rounded-xl border border-[#ead6df] bg-white px-4 py-2 text-xs font-bold text-[#866f80]"
            >
              Back to Detail
            </button>
          </div>
        </div>
      </header>

      {flashMessage ? (
        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {flashMessage}
        </div>
      ) : null}

      <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
        <SectionTitle
          icon={Sparkles}
          title="Session Progress"
          subtitle="Track the start and completion of the service workflow."
        />
        <div className="mt-6 flex flex-col gap-5 xl:flex-row">
          {progressSteps.map((step, index) => (
            <ProgressStep
              key={step.label}
              step={step}
              index={index}
              isLast={index === progressSteps.length - 1}
            />
          ))}
        </div>
      </article>

      <div
        className={`grid gap-4 ${
          phase === "done" ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_320px]"
        }`}
      >
        <div className="space-y-4">
          {phase === "start" ? (
            <>
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={UserRound}
                  title="Customer & Booking Summary"
                  subtitle="Final service context before the session starts."
                />

                <div className="mt-5 border-b border-[#f8e6ef] pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={data.customerAvatar}
                      alt={data.customerName}
                      className="h-14 w-14 rounded-2xl border border-[#f2bfd4] object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-lg font-extrabold text-[#3f2b3f]">{data.customerName}</p>
                      <p className="mt-1 text-sm text-[#a88a9d]">{data.customerPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <SummaryValue label="Service" value={data.serviceLabel} accent />
                  <SummaryValue label="Staff Artist" value={data.staffArtist} />
                  <SummaryValue label="Chair" value={data.chair} />
                  <SummaryValue label="Appointment Time" value={data.appointmentTime} />
                  <SummaryValue label="Estimated Duration" value={data.estimatedDuration} />
                  <SummaryValue label="Confirmed Design" value={data.designName} />
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="Before-Service Photo Upload"
                  subtitle="Save a before photo as proof before the nail service starts."
                />

                <label className="mt-5 block cursor-pointer rounded-[22px] border-2 border-dashed border-[#f2bfd4] bg-[linear-gradient(180deg,#fff8fc_0%,#fff2f8_100%)] px-6 py-10 text-center transition hover:border-[#ea4f93] hover:bg-[#fff6fa]">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleBeforePhotoChange}
                  />
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffe6f1_0%,#f9bfd5_100%)] text-[#ea4f93]">
                    <ImageUp size={28} />
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-[#3f2b3f]">
                    Upload hand photo before service
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#a88a9d]">
                    This photo will be saved as proof before the nail service starts.
                    <br />
                    Drag and drop your file here, or click to browse.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="rounded-full bg-[#ffe6ef] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                      JPG
                    </span>
                    <span className="rounded-full bg-[#ffe6ef] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                      PNG
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)]">
                    <Upload size={14} />
                    Upload Before Photo
                  </span>
                </label>

                <div className="mt-6 border-t border-[#f8e6ef] pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                    Uploaded Preview
                  </p>
                  {beforePhoto ? (
                    <div className="mt-4 flex items-center gap-4 rounded-[20px] border border-[#f2bfd4] bg-[#fff8fb] p-4">
                      <img
                        src={beforePhoto.previewUrl}
                        alt={beforePhoto.fileName}
                        className="h-20 w-20 rounded-2xl border border-[#f2bfd4] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#3f2b3f]">
                          {beforePhoto.fileName}
                        </p>
                        <p className="mt-1 text-xs text-[#a88a9d]">
                          Uploaded at {beforePhoto.uploadedAt} - Today
                        </p>
                        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 size={12} />
                          Before Photo Uploaded
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[18px] border border-[#f4dbe7] bg-[#fffafb] px-4 py-4 text-sm text-[#a88a9d]">
                      No before-service photo uploaded yet.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={ShieldCheck}
                  title="Service Start Confirmation"
                  subtitle="Complete these checks before beginning the live service."
                />
                <div className="mt-5 space-y-3">
                  {confirmations.map((item) => (
                    <ConfirmationItem
                      key={item.label}
                      checked={item.checked}
                      label={item.label}
                      onToggle={() => handleToggleConfirmation(item.label)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!canStartService}
                  onClick={() => setShowStartConfirm(true)}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold transition ${
                    canStartService
                      ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_16px_28px_rgba(236,72,153,0.25)]"
                      : "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                  }`}
                >
                  <Play size={16} />
                  Start Service
                </button>
              </article>
            </>
          ) : phase === "progress" ? (
            <>
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={UserRound}
                  title="Current Session Overview"
                  subtitle="Live customer context while the service is running."
                />

                <div className="mt-5 flex flex-col gap-5 rounded-[22px] border border-[#f5d9e6] bg-[linear-gradient(180deg,#fffafc_0%,#fff5f9_100%)] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img
                      src={data.customerAvatar}
                      alt={data.customerName}
                      className="h-16 w-16 rounded-2xl border border-[#f2bfd4] object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-extrabold text-[#3f2b3f]">{data.customerName}</p>
                      <p className="mt-1 text-sm font-medium text-[#ea4f93]">{data.serviceLabel}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <SessionChip icon={UserRound} label={data.staffArtist} />
                        <SessionChip icon={Sparkles} label={data.chair} />
                        <SessionChip icon={Clock3} label={`Start: ${booking?.bookingTime ?? "10:00 AM"}`} />
                        <SessionChip icon={Clock3} label={`Est. Finish: ${data.estimatedFinishTime}`} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.12em]">
                      <span className="text-[#a88a9d]">Service Progress</span>
                      <span className="text-[#ea4f93]">{serviceProgress}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f8d9e8]">
                      <div
                        className="h-full rounded-full bg-[image:var(--gradient-accent)] transition-[width] duration-500"
                        style={{ width: `${serviceProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="Before Photo Preview"
                  subtitle="This image was uploaded before the service started."
                />

                <div className="mt-5 overflow-hidden rounded-[22px] border border-[#f2bfd4] bg-[#fff7fb]">
                  {beforePhoto ? (
                    <div className="relative">
                      <img
                        src={beforePhoto.previewUrl}
                        alt={beforePhoto.fileName}
                        className="h-[260px] w-full object-cover"
                      />
                      <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[10px] font-bold text-emerald-700 backdrop-blur">
                        <CheckCircle2 size={12} />
                        Before Photo Uploaded
                      </span>
                      <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-[#866f80] backdrop-blur">
                        Uploaded {beforePhoto.uploadedAt ?? data.beforePhotoTimestamp}
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-[260px] items-center justify-center px-6 text-center text-sm text-[#a88a9d]">
                      Before-service photo is not available yet.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Sparkles}
                  title="Current Service Status"
                  subtitle="Track what is happening during the active session."
                />

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[18px] border border-[#f2bfd4] bg-[#fff6fa] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                      Current Process
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-[#ea4f93]">{data.currentProcess}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#f2bfd4] bg-[#fff6fa] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                      Estimated Remaining
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-[#3f2b3f]">{data.remainingTime}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#f2bfd4] bg-[#fff6fa] p-4 md:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                      Materials Used
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(data.materialsUsed ?? []).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[#f1c6d8] bg-[#ffeaf3] px-3 py-1 text-[11px] font-bold text-[#ea4f93]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[14px] border border-[#f2bfd4] bg-[#fff1f7] px-4 py-3 text-sm text-[#866f80]">
                  <span className="font-extrabold text-[#ea4f93]">Step Note:</span> {data.stepNote}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Play}
                  title="Live Session Actions"
                  subtitle="Quick controls while the appointment is in progress."
                />

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <ActionGhostButton
                    icon={Play}
                    label="Continue Service"
                    onClick={() => handleSessionAction("Service session continues with the current workflow.")}
                  />
                  <ActionGhostButton
                    icon={Pause}
                    label="Pause Session"
                    onClick={() => handleSessionAction("Service session has been marked as paused for this booking.")}
                  />
                  <ActionGhostButton
                    icon={Plus}
                    label="Add Extra Service"
                    onClick={() => handleSessionAction("Extra service flow can be added to this booking session.")}
                  />
                  <ActionGhostButton
                    icon={FilePenLine}
                    label="Add Session Note"
                    onClick={() =>
                      handleSessionAction("Use the staff notes area below to record the latest session update.")
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={handleMarkServiceDone}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-4 text-sm font-extrabold text-white shadow-[0_16px_28px_rgba(236,72,153,0.25)]"
                >
                  <CheckCircle2 size={16} />
                  Mark Service as Done
                </button>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={FilePenLine}
                  title="Staff Notes"
                  subtitle="Capture progress notes for the current live session."
                />

                <textarea
                  value={sessionNote}
                  onChange={(event) => setSessionNote(event.target.value)}
                  rows={6}
                  placeholder="Add notes about polish layers, customer feedback, or special handling instructions."
                  className="mt-5 w-full rounded-[20px] border border-[#f2bfd4] bg-[#fffafd] px-4 py-3 text-sm text-[#3f2b3f] outline-none transition placeholder:text-[#b59aab] focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ffd8e8]"
                />
              </article>
            </>
          ) : (
            <>
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={UserRound}
                  title="Customer & Service Summary"
                  subtitle="Final service context before closing this session."
                />

                <div className="mt-5 border-b border-[#f8e6ef] pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={data.customerAvatar}
                      alt={data.customerName}
                      className="h-14 w-14 rounded-full border border-[#f2bfd4] object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-lg font-extrabold text-[#3f2b3f]">{data.customerName}</p>
                      <p className="mt-1 text-sm text-[#ea4f93]">{data.serviceLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <SummaryValue label="Staff Artist" value={data.staffArtist} />
                  <SummaryValue label="Chair" value={data.chair} />
                  <SummaryValue label="Duration" value={data.estimatedDuration} accent />
                  <SummaryValue label="Start Time" value={booking?.bookingTime ?? "10:00 AM"} />
                  <SummaryValue label="Completed" value={data.completedAt} />
                  <SummaryValue label="Service" value={data.serviceLabel} />
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="After-Service Photo Upload"
                  subtitle="Upload the final photo as proof after the service is finished."
                />

                <label className="mt-5 block cursor-pointer rounded-[22px] border-2 border-dashed border-[#f2bfd4] bg-[linear-gradient(180deg,#fff8fc_0%,#fff2f8_100%)] px-6 py-10 text-center transition hover:border-[#ea4f93] hover:bg-[#fff6fa]">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleAfterPhotoChange}
                  />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffe6f1_0%,#f9bfd5_100%)] text-[#ea4f93]">
                    <Image size={26} />
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-[#3f2b3f]">
                    Upload completed nail photo
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#a88a9d]">
                    This photo will be saved as proof after the service is finished.
                    <br />
                    Drag and drop your file here or click to browse.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="rounded-full bg-[#f0e8ff] px-3 py-1 text-[10px] font-bold text-[#6b46c1]">
                      JPG
                    </span>
                    <span className="rounded-full bg-[#f0e8ff] px-3 py-1 text-[10px] font-bold text-[#6b46c1]">
                      PNG
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)]">
                    <Upload size={14} />
                    Upload After Photo
                  </span>
                </label>

                <div className="mt-6 border-t border-[#f8e6ef] pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ea4f93]">
                    Preview - After Photo
                  </p>
                  {afterPhoto ? (
                    <div className="mt-4 overflow-hidden rounded-[20px] border border-[#f2bfd4] bg-white">
                      <img
                        src={afterPhoto.previewUrl}
                        alt={afterPhoto.fileName}
                        className="h-[260px] w-full object-cover"
                      />
                      <div className="flex flex-col gap-3 border-t border-[#f5d9e6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-[#3f2b3f]">{afterPhoto.fileName}</p>
                          <p className="mt-1 text-xs text-[#a88a9d]">
                            Uploaded at {afterPhoto.uploadedAt} - {afterPhoto.fileSizeLabel ?? "2.4 MB"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 size={12} />
                          After Photo Uploaded
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[18px] border border-[#f4dbe7] bg-[#fffafb] px-4 py-4 text-sm text-[#a88a9d]">
                      No after-service photo uploaded yet.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={ClipboardCheck}
                  title="Completion Confirmation"
                  subtitle="Review the final checks before closing the booking."
                />

                <div className="mt-5 space-y-3">
                  {completionChecks.map((item) => (
                    <ConfirmationItem
                      key={item.label}
                      checked={item.checked}
                      label={item.label}
                      onToggle={() => handleToggleCompletionCheck(item.label)}
                    />
                  ))}
                </div>

                <div className="mt-5 rounded-[18px] border border-[#f2bfd4] bg-[#fff6fa] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                    Nail Procedure
                  </p>
                  <div className="mt-4 space-y-3">
                    {procedureSteps.map((step) => (
                      <div
                        key={step}
                        className="flex items-center gap-3 rounded-xl border border-[#f2bfd4] bg-white px-4 py-3 text-sm font-medium text-[#3f2b3f]"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,#6ee7b7_0%,#10b981_100%)] text-white">
                          <Check size={12} />
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-[#f2bfd4] bg-white px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-[#3f2b3f]">Save Design to History</p>
                        <p className="mt-1 text-xs text-[#a88a9d]">
                          Archive this completed design into the customer profile.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Receipt}
                  title="Final Service Summary"
                  subtitle="Review the amount before handing over to payment flow."
                />

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a88a9d]">Original Service Price</span>
                    <span className="font-bold text-[#3f2b3f]">{data.originalServicePrice}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a88a9d]">Extra Service Fee</span>
                    <span className="font-bold text-[#3f2b3f]">{data.extraServiceFee}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a88a9d]">{data.discountLabel}</span>
                    <span className="font-bold text-emerald-600">{data.discountValue}</span>
                  </div>
                  <div className="border-t border-[#f5d9e6]" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-extrabold text-[#3f2b3f]">Total Amount</span>
                    <span className="text-base font-extrabold text-[#ea4f93]">{data.totalAmount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a88a9d]">Remaining Balance</span>
                    <span className="font-extrabold text-[#6b46c1]">{data.remainingBalance}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canCompleteSession}
                  onClick={() => setShowCompleteConfirm(true)}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold transition ${
                    canCompleteSession
                      ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_16px_28px_rgba(236,72,153,0.25)]"
                      : "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  Complete Session
                </button>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Sparkles}
                  title="Next Step"
                  subtitle="Handoff actions after the staff session is finished."
                />

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(data.backRoute, {
                        state: {
                          fromServiceSession: true,
                          readyForCheckout: true,
                        },
                      })
                    }
                    className="flex min-h-20 items-start gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff7fb] px-4 py-4 text-left transition hover:bg-[#fff2f8]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe7f1] text-[#ea4f93]">
                      <Receipt size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#3f2b3f]">Go to Checkout</span>
                      <span className="mt-1 block text-xs text-[#a88a9d]">Proceed from staff handoff to payment review.</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSessionAction("Customer review request can be sent after the final session handoff.")
                    }
                    className="flex min-h-20 items-start gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff7fb] px-4 py-4 text-left transition hover:bg-[#fff2f8]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4eaff] text-[#8b5cf6]">
                      <ClipboardCheck size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#3f2b3f]">Request Customer Review</span>
                      <span className="mt-1 block text-xs text-[#a88a9d]">Send the final review prompt to the customer profile.</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSessionAction("Completed design can now be saved to the customer history archive.")
                    }
                    className="flex min-h-20 items-start gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff7fb] px-4 py-4 text-left transition hover:bg-[#fff2f8]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Sparkles size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#3f2b3f]">Save Design to History</span>
                      <span className="mt-1 block text-xs text-[#a88a9d]">Archive this final result to the customer profile.</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!canOpenComparison}
                    onClick={handleOpenComparison}
                    className={`flex min-h-20 items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                      canOpenComparison
                        ? "border-[#f2bfd4] bg-[#fff7fb] hover:bg-[#fff2f8]"
                        : "cursor-not-allowed border-[#f4dbe7] bg-[#fffafb] opacity-70"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe7f1] text-[#ea4f93]">
                      <Camera size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#3f2b3f]">Compare Before & After</span>
                      <span className="mt-1 block text-xs text-[#a88a9d]">
                        Open the side-by-side transformation view after both photos are uploaded.
                      </span>
                    </span>
                  </button>
                </div>
              </article>
            </>
          )}
        </div>

        <aside className={`space-y-4 ${phase === "done" ? "hidden" : ""}`}>
          {phase === "start" ? (
            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <SectionTitle icon={Clock3} title="Session Snapshot" />
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                  <span className="text-[11px] text-[#a88a9d]">Booking Code</span>
                  <span className="font-extrabold text-[#3f2b3f]">#{data.bookingCode}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                  <span className="text-[11px] text-[#a88a9d]">Design Status</span>
                  <span className="font-extrabold text-[#ea4f93]">{data.designName}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                  <span className="text-[11px] text-[#a88a9d]">Estimated Total</span>
                  <span className="font-extrabold text-[#3f2b3f]">{data.totalPrice}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#a88a9d]">Photo Status</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      beforePhoto ? "bg-emerald-50 text-emerald-600" : "bg-[#fff5ef] text-[#d9871c]"
                    }`}
                  >
                    {beforePhoto ? "Uploaded" : "Pending"}
                  </span>
                </div>
              </div>
            </article>
          ) : (
            <>
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Sparkles}
                  title="Service Details"
                  subtitle="Confirmed design context for the active booking."
                />
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                    <span className="text-[11px] text-[#a88a9d]">Booking Code</span>
                    <span className="font-extrabold text-[#3f2b3f]">#{data.bookingCode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                    <span className="text-[11px] text-[#a88a9d]">Confirmed Design</span>
                    <span className="text-right font-extrabold text-[#ea4f93]">{data.designName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                    <span className="text-[11px] text-[#a88a9d]">Duration</span>
                    <span className="font-extrabold text-[#3f2b3f]">{data.estimatedDuration}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                    <span className="text-[11px] text-[#a88a9d]">Estimated Total</span>
                    <span className="font-extrabold text-[#3f2b3f]">{data.totalPrice}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#a88a9d]">Status</span>
                    <span className="rounded-full border border-rose-200 bg-[#fff1f7] px-2.5 py-1 text-[10px] font-bold text-[#d65b92]">
                      In Progress
                    </span>
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={ShieldCheck}
                  title="Customer Notes"
                  subtitle="Important reminders from the consultation stage."
                />
                <div className="mt-4 space-y-3">
                  {(data.customerNotes ?? []).map((note) => (
                    <div
                      key={note}
                      className="flex items-start gap-3 rounded-[14px] border border-[#f6dbe8] bg-[#fff7fb] px-3 py-3 text-sm text-[#866f80]"
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ea4f93]" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="Next Action"
                  subtitle="Common next steps while finishing the session."
                />
                <div className="mt-4 space-y-3">
                  <ActionGhostButton
                    icon={Camera}
                    label="Upload After Photo"
                    onClick={() =>
                      handleSessionAction("After-photo upload is the next recommended step for this session.")
                    }
                  />
                  <button
                    type="button"
                    onClick={handleMarkServiceDone}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-[linear-gradient(180deg,#ffe7ef_0%,#ffd9e6_100%)] px-4 py-3 text-sm font-bold text-[#d65b92] transition hover:bg-[#ffe1eb]"
                  >
                    <CheckCircle2 size={15} />
                    Complete Session
                  </button>
                  <ActionGhostButton
                    icon={Sparkles}
                    label="Compare Before & After"
                    onClick={handleOpenComparison}
                  />
                </div>
              </article>
            </>
          )}
        </aside>
      </div>

      <ActionConfirmModal
        open={showStartConfirm}
        intent="success"
        title="Start Service Session"
        subtitle="This will begin the live service flow for the current booking."
        description="Confirm that the before photo is uploaded and all final checks are completed before starting service."
        confirmText="Start Service"
        cancelText="Review Again"
        confirmIcon={Play}
        onConfirm={handleStartService}
        onCancel={() => setShowStartConfirm(false)}
        highlights={[data.customerName, data.serviceLabel, data.chair]}
        details={[
          { label: "Appointment", value: data.appointmentTime },
          { label: "Estimated Duration", value: data.estimatedDuration },
        ]}
        warnings={[
          "Once started, this session should proceed with the confirmed service design and price.",
        ]}
      />

      <ActionConfirmModal
        open={showCompleteConfirm}
        intent="success"
        title="Complete Service Session"
        subtitle="This will close the staff session and prepare the booking for payment."
        description="Confirm that the after-service photo is uploaded and the customer has reviewed the final result."
        confirmText="Complete Session"
        cancelText="Review Again"
        confirmIcon={CheckCircle2}
        onConfirm={handleCompleteSession}
        onCancel={() => setShowCompleteConfirm(false)}
        highlights={[data.customerName, data.serviceLabel, data.totalAmount]}
        details={[
          { label: "Completed At", value: data.completedAt },
          { label: "Remaining Balance", value: data.remainingBalance },
        ]}
        warnings={[
          "Completing this session should only happen after the final photo and completion checks are done.",
        ]}
      />
    </section>
  );
}
