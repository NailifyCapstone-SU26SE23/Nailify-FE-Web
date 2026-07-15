import {
  Bell,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  LoaderCircle,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Modal, Table } from "antd";
import jsQR from "jsqr";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { usePagination } from "../../../../shared/hooks/usePagination";
import {
  ROUTES,
  getReceptionistBookingDetailRoute,
} from "../../../../shared/constants/routes";
import {
  checkoutReceptionistBooking,
  fetchReceptionistBookings,
  manualCheckInReceptionistBooking,
  verifyReceptionistQrToken,
} from "../../../receptionist/bookings/services/receptionistBookingService";

const RECEPTION_METRICS = [
  {
    label: "Walk-ins Today",
    value: "14",
    note: "+3 from yesterday",
    icon: UserRound,
    iconClassName: "bg-[#ffeaf4] text-[#ef4f92]",
    noteClassName: "text-[#33b46e]",
  },
  {
    label: "Appointments Today",
    value: "28",
    note: "+5 this week",
    icon: CalendarClock,
    iconClassName: "bg-[#f1eaff] text-[#8d54ef]",
    noteClassName: "text-[#33b46e]",
  },
  {
    label: "Waiting Customers",
    value: "6",
    note: "Avg 18 min wait",
    icon: Clock3,
    iconClassName: "bg-[#fff0ea] text-[#ff7a3d]",
    noteClassName: "text-[#ff7a3d]",
  },
  {
    label: "Available Staff",
    value: "4",
    note: "3 busy | 1 break",
    icon: Users,
    iconClassName: "bg-[#e8fbf5] text-[#1da989]",
    noteClassName: "text-[#33b46e]",
  },
];

const QUICK_STATUS = [
  ["Current Queue", "6"],
  ["Avg Wait Time", "18 min"],
  ["Available Chairs", "4 / 10"],
  ["In Service Now", "6"],
  ["Completed Today", "12"],
  ["Revenue Today", "842.000 VND"],
];

const WAITING_QUEUE = [
  ["Ava Williams", "Spa Mani + Pedi", "8 min"],
  ["Mia Johnson", "Dip Powder Mani", "14 min"],
  ["Walk-in #3", "Gel Manicure", "21 min"],
  ["Lily Tran", "Classic Pedicure", "27 min"],
  ["Walk-in #5", "Nail Art Design", "33 min"],
  ["Walk-in #6", "Acrylic Full Set", "40 min"],
];

const STAFF_AVAILABILITY = [
  ["Mia Chen", "MC", "Busy", "bg-[#eb5b92]", "bg-[#ffeaf2] text-[#ef5a95]"],
  ["Sophie Park", "SP", "Available", "bg-[#8e50cf]", "bg-[#e8f8ed] text-[#30a364]"],
  ["Luna Kim", "LK", "Busy", "bg-[#25b6c4]", "bg-[#ffeaf2] text-[#ef5a95]"],
  ["Aria Nguyen", "AN", "Available", "bg-[#ff883d]", "bg-[#e8f8ed] text-[#30a364]"],
  ["Rose Jin", "RJ", "Break", "bg-[#57b15a]", "bg-[#fff4e8] text-[#f08b2e]"],
  ["Yuna Park", "YP", "Available", "bg-[#f2a33a]", "bg-[#e8f8ed] text-[#30a364]"],
  ["Dana Lee", "DL", "Available", "bg-[#d13f85]", "bg-[#e8f8ed] text-[#30a364]"],
  ["Hana Wu", "HW", "Busy", "bg-[#6247d8]", "bg-[#ffeaf2] text-[#ef5a95]"],
  ["Jade Oh", "JO", "Break", "bg-[#168dd2]", "bg-[#fff4e8] text-[#f08b2e]"],
];

const RECENT_CHECK_INS = [
  ["Emma Rose", "Gel Manicure", "9:02 AM | Checked In", "ER", "bg-[#f26e97]"],
  ["Sophie Liu", "Acrylic Full Set", "9:28 AM | In service", "SL", "bg-[#9b59d0]"],
  ["Chloe Kim", "French Tip Overlay", "10:55 AM | Completed", "CK", "bg-[#ef4f92]"],
  ["Zoe Parker", "Nail Art Design", "11:32 AM | In service", "ZP", "bg-[#8f5ce4]"],
  ["Walk-in #3", "Gel Manicure", "11:48 AM | Waiting", "WI", "bg-[#28b59b]"],
];

const APPOINTMENTS_PAGE_SIZE = 5;

function getInitials(name) {
  return (name || "--")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getTodayDateParam() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeLabel(startTime, totalDuration) {
  if (!startTime) {
    return "--";
  }

  const [hourText = "0", minuteText = "0"] = startTime.split(":");
  const startDate = new Date();
  startDate.setHours(Number(hourText), Number(minuteText), 0, 0);

  const endDate = new Date(startDate.getTime() + Number(totalDuration || 0) * 60000);
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function getStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-[#ffeaf2] text-[#ef5a95]";
    case "CheckedIn":
      return "bg-[#e8f8ed] text-[#309d63]";
    case "Approved":
      return "bg-[#eef1fb] text-[#6876c8]";
    case "Pending":
      return "bg-[#fff4e8] text-[#f08b2e]";
    default:
      return "bg-[#fff1f6] text-[#eb5a98]";
  }
}

function getAvatarTone(index) {
  return [
    "bg-[#f26e97]",
    "bg-[#9b59d0]",
    "bg-[#ff8d4d]",
    "bg-[#28b59b]",
    "bg-[#ef4f92]",
    "bg-[#8f5ce4]",
    "bg-[#de6ca4]",
  ][index % 7];
}

function normalizeAppointmentRow(booking, index) {
  return {
    id: booking.bookingId,
    bookingId: booking.bookingId,
    time: formatTimeLabel(booking.startTime, booking.totalDuration),
    customer: booking.customerName || "--",
    service:
      booking.bookingItems?.map((item) => item.serviceName).filter(Boolean).join(", ") || "--",
    staff: booking.artistName || "--",
    status: booking.status || "--",
    tone: getStatusTone(booking.status),
    avatarTone: getAvatarTone(index),
  };
}

function canManualCheckIn(status) {
  return !["CheckedIn", "Completed", "ServiceCompleted", "Cancelled"].includes(status);
}

function isReadyForCheckout(status) {
  return String(status || "").trim() === "ServiceCompleted";
}

function DashboardCard({ children, className = "" }) {
  return (
    <section
      className={`w-full min-w-0 overflow-hidden rounded-[24px] border border-[#f4d8e3] bg-white p-4 shadow-[0_12px_30px_rgba(236,72,153,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? <Icon size={14} className="text-[#eb5a98]" /> : null}
        <h3 className="min-w-0 text-sm font-extrabold text-[#e14f91]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <DashboardCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${item.iconClassName}`}
        >
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[1.7rem] font-black leading-none text-[#432744]">{item.value}</p>
          <p className="mt-1 text-xs text-[#8e7a87]">{item.label}</p>
          <p className={`mt-1 text-[11px] font-semibold ${item.noteClassName}`}>{item.note}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

function MobileAppointmentCard({ row, actions }) {
  return (
    <article className="w-full min-w-0 rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#432744]">{row.customer}</p>
          <p className="mt-1 text-xs font-semibold text-[#ea4f93]">{row.time}</p>
        </div>
        <span
          className={`inline-flex max-w-full break-words rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-normal ${row.tone}`}
        >
          {row.status}
        </span>
      </div>

      <div className="mt-4 flex min-w-0 items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${row.avatarTone}`}
        >
          {getInitials(row.customer)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-xs text-[#584654]">{row.service}</p>
          <p className="mt-1 break-words text-[11px] text-[#aa8a99]">{row.staff}</p>
        </div>
        <div className="shrink-0">
          <ActionDropdown
            label="Action"
            items={actions}
            buttonClassName="px-3 py-1.5 text-[11px]"
          />
        </div>
      </div>
    </article>
  );
}

export function ReceptionistDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const greetingName = user?.fullName?.split(" ")[0] ?? "Jessica";
  const [appointmentQuery, setAppointmentQuery] = useState("");
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [appointmentRows, setAppointmentRows] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScannerStarting, setIsScannerStarting] = useState(false);
  const [isVerifyingQr, setIsVerifyingQr] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [lastScannedCode, setLastScannedCode] = useState("");
  const scannerVideoRef = useRef(null);
  const scannerCanvasRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerFrameRef = useRef(null);
  const isQrHandledRef = useRef(false);
  const hasCameraSupport =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);
  const scannerSupportMessage = hasCameraSupport
    ? ""
    : "Camera access requires a secure browser context with webcam support.";

  useEffect(() => {
    const today = getTodayDateParam();
    const timerId = window.setTimeout(() => {
      void (async () => {
        setIsAppointmentsLoading(true);
        setAppointmentsError("");

        try {
          const bookings = await fetchReceptionistBookings(today);
          const normalizedRows = Array.isArray(bookings)
            ? bookings.map(normalizeAppointmentRow)
            : [];
          setAppointmentRows(normalizedRows);
        } catch (loadError) {
          const message = loadError instanceof Error ? loadError.message : "Failed to load today's appointments.";
          setAppointmentsError(message);
          toast.error(message);
        } finally {
          setIsAppointmentsLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const filteredAppointmentRows = useMemo(() => {
    const normalizedQuery = appointmentQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return appointmentRows;
    }

    return appointmentRows.filter((row) =>
      [row.bookingId, row.customer, row.service, row.staff, row.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [appointmentQuery, appointmentRows]);

  const {
    currentPage: appointmentPage,
    paginatedItems: paginatedAppointmentRows,
    setCurrentPage: setAppointmentPage,
    totalPages: appointmentTotalPages,
  } = usePagination(filteredAppointmentRows, APPOINTMENTS_PAGE_SIZE);

  const updateAppointmentRow = (updatedBooking) => {
    if (!updatedBooking?.bookingId) {
      return;
    }

    setAppointmentRows((currentRows) =>
      currentRows.map((row, index) =>
        row.bookingId === updatedBooking.bookingId ? normalizeAppointmentRow(updatedBooking, index) : row,
      ),
    );
  };

  const handleManualCheckIn = async (bookingId) => {
    try {
      const updatedBooking = await manualCheckInReceptionistBooking(bookingId);
      updateAppointmentRow(updatedBooking);
      toast.success(`Checked in successfully.`);
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check in booking.";
      toast.error(message);
    }
  };

  const handleCheckout = async (bookingId) => {
    try {
      const updatedBooking = await checkoutReceptionistBooking(bookingId);
      updateAppointmentRow(updatedBooking);
      toast.success(`Checkout completed successfully for booking ${bookingId}.`);
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check out booking.";
      toast.error(message);
    }
  };

  const getActionItems = (bookingId, status) => [
    {
      key: "view",
      label: "View Booking",
      icon: Eye,
      onSelect: () => navigate(getReceptionistBookingDetailRoute(bookingId)),
    },
    ...(canManualCheckIn(status)
      ? [
        {
          key: "check-in",
          label: "Check In",
          icon: UserCheck,
          onSelect: () => void handleManualCheckIn(bookingId),
        },
      ]
      : []),
    ...(isReadyForCheckout(status)
      ? [
        {
          key: "checkout",
          label: "Checkout",
          icon: UserCheck,
          onSelect: () => void handleCheckout(bookingId),
        },
      ]
      : []),
    {
      key: "reschedule",
      label: "Reschedule",
      icon: CalendarClock,
      onSelect: () => navigate(getReceptionistBookingDetailRoute(bookingId)),
    },
    {
      key: "edit",
      label: "Edit Booking",
      icon: PencilLine,
      onSelect: () => navigate(getReceptionistBookingDetailRoute(bookingId)),
    },
  ];

  const appointmentColumns = useMemo(() => ([
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      render: (value) => <span className="text-xs font-semibold text-[#ea4f93]">{value}</span>,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${row.avatarTone}`}>
            {getInitials(row.customer)}
          </div>
          <p className="text-xs font-bold text-[#432744]">{row.customer}</p>
        </div>
      ),
    },
    // {
    //   title: "Service",
    //   dataIndex: "service",
    //   key: "service",
    //   render: (value) => <span className="text-xs text-[#584654]">{value}</span>,
    // },
    {
      title: "Staff",
      dataIndex: "staff",
      key: "staff",
      render: (value) => <span className="text-xs text-[#584654]">{value}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value, row) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${row.tone}`}>
          {value}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, row) => (
        <ActionDropdown
          label="Action"
          items={getActionItems(row.bookingId, row.status)}
          buttonClassName="px-3 py-1.5 text-[11px]"
        />
      ),
    },
  ]), [getActionItems]);

  useEffect(() => {
    if (!isScannerOpen) {
      return undefined;
    }

    if (scannerSupportMessage) {
      return undefined;
    }

    let isCancelled = false;

    const stopScanner = () => {
      if (scannerFrameRef.current) {
        window.cancelAnimationFrame(scannerFrameRef.current);
        scannerFrameRef.current = null;
      }

      const stream = scannerStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        scannerStreamRef.current = null;
      }

      const videoElement = scannerVideoRef.current;
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };

    const handleQrDetected = async (rawValue) => {
      if (!rawValue || isQrHandledRef.current) {
        return;
      }

      isQrHandledRef.current = true;
      setLastScannedCode(rawValue);
      stopScanner();
      setIsVerifyingQr(true);
      setScannerError("");

      try {
        const booking = await verifyReceptionistQrToken(rawValue);
        const verifiedBookingId = booking?.bookingId;

        if (!verifiedBookingId) {
          throw new Error("QR verified but booking ID was not returned.");
        }

        setIsScannerOpen(false);
        toast.success(`Check-in verified for ${booking.customerName || "customer"}.`);
        navigate(getReceptionistBookingDetailRoute(verifiedBookingId));
      } catch (verificationError) {
        const message =
          verificationError instanceof Error
            ? verificationError.message
            : "Unable to verify the scanned QR code.";
        setScannerError(message);
        toast.error(message);
        isQrHandledRef.current = false;
      } finally {
        if (!isCancelled) {
          setIsVerifyingQr(false);
        }
      }
    };

    const scanFrame = async () => {
      if (isCancelled || isQrHandledRef.current || !scannerVideoRef.current) {
        return;
      }

      try {
        const videoElement = scannerVideoRef.current;
        const canvasElement = scannerCanvasRef.current;

        if (
          videoElement &&
          canvasElement &&
          videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          const width = videoElement.videoWidth;
          const height = videoElement.videoHeight;

          if (width > 0 && height > 0) {
            canvasElement.width = width;
            canvasElement.height = height;

            const context = canvasElement.getContext("2d", { willReadFrequently: true });
            if (context) {
              context.drawImage(videoElement, 0, 0, width, height);
              const imageData = context.getImageData(0, 0, width, height);
              const decodedQr = jsQR(imageData.data, width, height);

              if (decodedQr?.data) {
                void handleQrDetected(decodedQr.data);
                return;
              }
            }
          }
        }
      } catch {
        // Keep scanning; transient frame read errors are expected while the camera warms up.
      }

      scannerFrameRef.current = window.requestAnimationFrame(() => {
        void scanFrame();
      });
    };

    void (async () => {
      setIsScannerStarting(true);
      setIsVerifyingQr(false);
      setScannerError("");
      setLastScannedCode("");
      isQrHandledRef.current = false;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        scannerStreamRef.current = stream;

        const videoElement = scannerVideoRef.current;
        if (!videoElement) {
          stopScanner();
          return;
        }

        videoElement.srcObject = stream;
        videoElement.setAttribute("playsinline", "true");
        await videoElement.play();
        scannerFrameRef.current = window.requestAnimationFrame(() => {
          void scanFrame();
        });
      } catch (cameraError) {
        const message =
          cameraError instanceof Error ? cameraError.message : "Unable to access webcam for QR scanning.";
        setScannerError(message);
        toast.error(message);
      } finally {
        if (!isCancelled) {
          setIsScannerStarting(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
      stopScanner();
      setIsScannerStarting(false);
      setIsVerifyingQr(false);
      isQrHandledRef.current = false;
    };
  }, [isScannerOpen, navigate, scannerSupportMessage]);

  return (
    <section className="flex min-h-full w-full min-w-0 flex-col gap-5 overflow-x-hidden bg-[linear-gradient(180deg,#fff8fb_0%,#fff4f8_100%)]">
      <div className="flex w-full min-w-0 flex-col gap-4 rounded-[28px] border border-[#f5d7e4] bg-[#fff7fb] p-3 shadow-[0_16px_38px_rgba(236,72,153,0.05)] sm:p-4 md:p-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-black text-[#ea4f93]">
              Good Morning, {greetingName}
              <span className="ml-1 text-[#f49fc2]">*</span>
            </p>
            <p className="mt-1 break-words text-xs text-[#bc8ca2]">
              Saturday, July 12, 2025 | Salon opens at 9:00 AM
            </p>
          </div>
        </div>

        <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1.72fr)_280px]">
          <div className="min-w-0 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {RECEPTION_METRICS.map((item) => (
                <MetricCard key={item.label} item={item} />
              ))}
            </div>

            <DashboardCard>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <SectionTitle icon={CalendarClock} title="Today's Appointments" />
                <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] xl:w-auto xl:min-w-[720px]">
                  <label className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-[#f4d6e2] bg-white px-4 text-sm text-[#c59bb0] sm:min-w-[0] xl:min-w-[380px]">
                    <Search size={16} className="text-[#3f2f39]" />
                    <input
                      type="text"
                      value={appointmentQuery}
                      onChange={(event) => setAppointmentQuery(event.target.value)}
                      placeholder="Search customer by phone number, name, ..."
                      className="w-full bg-transparent text-sm text-[#5c4557] outline-none placeholder:text-[#c7a0b2]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7dcff] bg-white px-4 text-sm font-bold text-[#7a57d9] shadow-[0_10px_24px_rgba(122,87,217,0.1)] whitespace-nowrap sm:min-w-[140px]"
                  >
                    <UserCheck size={15} />
                    Check-in
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.receptionistBookingsCreate)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#f3cfe0] bg-[#fff3f8] px-4 text-sm font-bold text-[#eb5a98] whitespace-nowrap sm:min-w-[170px]"
                  >
                    <Plus size={15} />
                    Create Walk-In
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {isAppointmentsLoading ? (
                  <div className="flex min-h-40 items-center justify-center gap-3 rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-sm font-medium text-[#b38a9f]">
                    <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                    Loading today's appointments...
                  </div>
                ) : appointmentsError ? (
                  <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-center text-sm text-[#d14c84]">
                    {appointmentsError}
                  </div>
                ) : paginatedAppointmentRows.length ? (
                  paginatedAppointmentRows.map((row) => (
                    <MobileAppointmentCard
                      key={row.id}
                      row={row}
                      actions={getActionItems(row.bookingId, row.status)}
                    />
                  ))
                ) : (
                  <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-center text-sm text-[#aa8a99]">
                    No appointments found for today.
                  </div>
                )}
              </div>

              <div className="mt-4 hidden md:block">
                <Table
                  rowKey="id"
                  columns={appointmentColumns}
                  dataSource={paginatedAppointmentRows}
                  loading={isAppointmentsLoading}
                  pagination={false}
                  scroll={{ x: 960 }}
                  locale={{ emptyText: appointmentsError || "No appointments found for today." }}
                />
              </div>

              {!isAppointmentsLoading && !appointmentsError && filteredAppointmentRows.length > 0 ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-[#f7e0ea] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#aa8a99]">
                    Showing {(appointmentPage - 1) * APPOINTMENTS_PAGE_SIZE + 1}
                    {" - "}
                    {Math.min(appointmentPage * APPOINTMENTS_PAGE_SIZE, filteredAppointmentRows.length)}
                    {" of "}
                    {filteredAppointmentRows.length} appointments
                  </p>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setAppointmentPage(Math.max(1, appointmentPage - 1))}
                      disabled={appointmentPage === 1}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                        appointmentPage === 1
                          ? "cursor-not-allowed border-[#f2dce6] bg-[#fff7fb] text-[#d4b5c4]"
                          : "border-[#f2bfd4] bg-white text-[#ea4f93] hover:bg-[#fff2f8]"
                      }`}
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="min-w-[84px] text-center text-xs font-bold text-[#7f6478]">
                      Page {appointmentPage}/{appointmentTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppointmentPage(Math.min(appointmentTotalPages, appointmentPage + 1))}
                      disabled={appointmentPage === appointmentTotalPages}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                        appointmentPage === appointmentTotalPages
                          ? "cursor-not-allowed border-[#f2dce6] bg-[#fff7fb] text-[#d4b5c4]"
                          : "border-[#f2bfd4] bg-white text-[#ea4f93] hover:bg-[#fff2f8]"
                      }`}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              ) : null}
            </DashboardCard>

            <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <DashboardCard>
                <SectionTitle icon={Clock3} title="Waiting Queue" />
                <div className="mt-4 space-y-3">
                  {WAITING_QUEUE.map(([name, service, wait], index) => (
                    <div
                      key={`${name}-${wait}`}
                      className="flex flex-col gap-3 rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ea4f93] text-[10px] font-extrabold text-white">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#432744]">{name}</p>
                          <p className="mt-1 break-words text-[11px] text-[#b28a9f]">{service}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-extrabold text-[#ea4f93]">{wait}</p>
                        <p className="text-[10px] text-[#c59bb0]">waiting</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard>
                <SectionTitle icon={UserRound} title="Staff Availability" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {STAFF_AVAILABILITY.map(([name, initials, status, avatarTone, badgeTone]) => (
                    <div
                      key={name}
                      className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-4 text-center"
                    >
                      <div
                        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold text-white ${avatarTone}`}
                      >
                        {initials}
                      </div>
                      <p className="mt-3 text-sm font-bold text-[#432744]">{name}</p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${badgeTone}`}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
          </div>

          <aside className="min-w-0 space-y-4">
            <DashboardCard>
              <SectionTitle icon={Sparkles} title="Quick Status" />
              <div className="mt-4 space-y-4">
                {QUICK_STATUS.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="break-words text-[#9d8191]">{label}</span>
                    <span className="font-extrabold text-[#ea4f93]">{value}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard>
              <SectionTitle icon={Bell} title="Recent Check-ins" />
              <div className="mt-4 space-y-4">
                {RECENT_CHECK_INS.map(([name, service, meta, initials, tone]) => (
                  <div key={`${name}-${meta}`} className="flex gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${tone}`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#432744]">{name}</p>
                      <p className="mt-0.5 break-words text-[10px] font-semibold text-[#ea4f93]">
                        {service}
                      </p>
                      <p className="mt-0.5 break-words text-[10px] text-[#aa8a99]">{meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
 
          </aside>
        </div>
      </div>

      <Modal
        open={isScannerOpen}
        onCancel={() => setIsScannerOpen(false)}
        footer={null}
        centered
        width="min(92vw, 560px)"
        styles={{
          body: {
            padding: 16,
          },
        }}
        title={<span className="text-base font-extrabold text-[#432744]">Customer QR Check-in</span>}
      >
        <div className="space-y-4 overflow-hidden">
          <p className="text-sm text-[#8f7484]">
            Point the webcam at the customer QR code. The scanned token will be sent to backend
            `verify-qr` before opening the booking.
          </p>

          <div className="overflow-hidden rounded-[20px] border border-[#f2d8e4] bg-[#fff7fb]">
            <div className="relative aspect-[4/3] bg-[#2a1d2b]">
              <video ref={scannerVideoRef} className="h-full w-full object-cover" muted />
              <canvas ref={scannerCanvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <div className="h-full w-full rounded-[24px] border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(42,29,43,0.18)]" />
              </div>
              {isScannerStarting || isVerifyingQr ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#2a1d2b]/55 px-4 text-center text-sm font-semibold text-white">
                  {isScannerStarting ? "Starting camera..." : "Verifying QR check-in..."}
                </div>
              ) : null}
            </div>
          </div>

          {scannerError || scannerSupportMessage ? (
            <div className="rounded-[18px] border border-[#f5d5df] bg-[#fff1f5] px-4 py-3 text-sm text-[#c44779]">
              {scannerError || scannerSupportMessage}
            </div>
          ) : (
            <div className="rounded-[18px] border border-[#efe3f8] bg-[#faf6ff] px-4 py-3 text-sm text-[#7a57d9]">
              {isVerifyingQr ? "Checking token with backend..." : "Waiting for QR code..."}
            </div>
          )}

          {lastScannedCode ? (
            <div className="rounded-[18px] border border-[#f1dde8] bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c49aaf]">
                Last scanned payload
              </p>
              <p className="mt-2 break-all text-sm text-[#5c4557]">{lastScannedCode}</p>
            </div>
          ) : null}
        </div>
      </Modal>
    </section>
  );
}
