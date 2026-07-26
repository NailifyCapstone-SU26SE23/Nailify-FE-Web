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
  AlertCircle,
  ClipboardList,
  Armchair,
  Activity,
} from "lucide-react";
import { Modal, Table } from "antd";
import jsQR from "jsqr";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import ChairMap from "../../../../shared/components/ui/ChairMap";
import { usePagination } from "../../../../shared/hooks/usePagination";
import {
  ROUTES,
  getReceptionistBookingDetailRoute,
} from "../../../../shared/constants/routes";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  checkoutReceptionistBooking,
  fetchReceptionistBookings,
  manualCheckInReceptionistBooking,
  verifyReceptionistQrToken,
} from "../../../receptionist/bookings/services/receptionistBookingService";
import { dashboardService } from "../services/dashboardService";
import {
  useReceptionistDashboard,
  useWalkInQueue,
  useWaitlist,
  useStaffArtists,
} from "../hooks/useAdminDashboard";

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
    customer: typeof booking.customerName === 'object' ? booking.customerName?.customerName || "--" : (booking.customerName || "--"),
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
  const Icon = item.icon || Activity;
  const color = item.color || '#10b981';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          background: `linear-gradient(135deg, ${color}, transparent 75%)`,
        }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {item.label}
          </p>
          <h2 className="mt-3 text-[24px] font-black tracking-tight text-slate-800 leading-none break-all">
            {item.value} <span className="text-[14px] text-slate-400 font-semibold">{item.unit !== "VND" ? "" : "₫"}</span>
          </h2>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">{item.note}</p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm shrink-0 ml-2"
          style={{
            backgroundColor: `${color}18`,
            color: color,
          }}
        >
          <Icon size={24} strokeWidth={2.4} />
        </div>
      </div>
      <div
        className="mt-6 h-1.5 rounded-full"
        style={{
          background: `linear-gradient(to right, ${color}, transparent)`,
        }}
      />
    </div>
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

  const { data: dashboardData } = useReceptionistDashboard(user?.salonId, getTodayDateParam());

  const { data: walkInQueueData } = useWalkInQueue(user?.salonId);
  const { data: waitlistData } = useWaitlist(user?.salonId);
  const { data: staffArtistsData } = useStaffArtists(user?.salonId);

  const activeStaffItems = staffArtistsData?.items || dashboardData?.liveChairStatus || [];
  const todayStr = getTodayDateParam();

  const artistSlotQueries = useQueries({
    queries: activeStaffItems.map((artist) => ({
      queryKey: ["artistSlots", artist.staffId || artist.userId, todayStr],
      queryFn: () => dashboardService.getArtistAvailableSlots(artist.staffId || artist.userId, todayStr),
      enabled: !!(artist.staffId || artist.userId) && !!todayStr,
      staleTime: 60 * 1000,
    })),
  });

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

  const displayMetrics = dashboardData ? [
    {
      label: "Walk-In Queue Size",
      value: String(dashboardData.currentWalkInQueueSize || "0"),
      note: `Clear in ${dashboardData.estimatedTimeToClearQueueMins || 0}m`,
      icon: UserRound,
      color: "#ef4f92",
    },
    {
      label: "Appointments Left",
      value: String(dashboardData.remainingAppointmentsToday || "0"),
      note: "Today",
      icon: CalendarClock,
      color: "#8d54ef",
    },
    {
      label: "Waitlist Size",
      value: String(dashboardData.currentWaitlistSize || "0"),
      note: `Avg wait ${dashboardData.averageWaitTimeMinutes || 0}m`,
      icon: Clock3,
      color: "#ff7a3d",
    },
    {
      label: "Staff On Duty",
      value: (dashboardData.staffOnDutyText || "").split(" ")[0] || "0",
      note: dashboardData.staffOnDutyText || "0 artists",
      icon: Users,
      color: "#1da989",
    },
  ] : [];

  const displayQuickStatus = dashboardData ? [
    ["Current Queue", String(dashboardData.currentWalkInQueueSize || "0")],
    ["Waitlist Size", String(dashboardData.currentWaitlistSize || "0")],
    ["Avg Wait Time", `${dashboardData.averageWaitTimeMinutes || 0} min`],
    ["Appts Remaining Today", String(dashboardData.remainingAppointmentsToday || "0")],
    ["Staff On Duty", dashboardData.staffOnDutyText || "N/A"],
  ] : [];

  const activeWaitlistItems = waitlistData?.items || dashboardData?.liveWaitlist || [];
  const displayQueue = activeWaitlistItems.map(w => [
    typeof w.customerName === 'object' ? w.customerName?.customerName || "Walk-in" : (w.customerName || "Walk-in"), 
    `Pos: ${w.position}`, 
    `${w.estimatedDuration || w.estimatedWait || 0}m`
  ]);

  const displayStaff = activeStaffItems.map((c, idx) => {
    const name = c.firstName ? `${c.firstName} ${c.lastName}` : (c.name || "Chair");

    let isBusy = c.isOccupied === true;
    const artistQuery = artistSlotQueries[idx];
    const isOffToday = artistQuery?.data?.isOffToday === true;

    if (artistQuery?.data?.busySlots?.length > 0) {
      const now = new Date();
      isBusy = artistQuery.data.busySlots.some(slot => {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        return now >= start && now <= end;
      });
    }

    return [
      name,
      getInitials(name),
      isOffToday ? "Off Today" : (c.status === "Active" && !isBusy ? "Available" : (isBusy ? "Busy" : "Inactive")),
      getAvatarTone(idx),
      isOffToday ? "bg-[#ffeaf2] text-[#ef5a95]" : (c.status === "Active" && !isBusy ? "bg-[#e8f8ed] text-[#30a364]" : "bg-[#ffeaf2] text-[#ef5a95]"),
      isOffToday
    ];
  });

  const displayArrivals = dashboardData?.upcomingArrivals?.length ?
    dashboardData.upcomingArrivals.map((u, idx) => {
      const cName = typeof u.customerName === 'object' ? u.customerName?.customerName || 'Customer' : (u.customerName || 'Customer');
      return [
        cName,
        u.assignedArtistName || "--",
        new Date(u.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " | Upcoming",
        getInitials(cName),
        getAvatarTone(idx)
      ];
    }) : [];

  const displayWalkInQueue = walkInQueueData || dashboardData?.liveWalkInQueue || [];
  const displayMasterSchedule = dashboardData?.masterSalonSchedule || [];
  const displayAlerts = dashboardData?.noShowLateAlerts || [];



  return (
    <section className="flex min-h-screen flex-col bg-slate-50 text-slate-800 font-sans">
      <div className="mx-auto w-full space-y-6 p-4 md:p-8
                      bg-[#fff9fb]
                      bg-[radial-gradient(circle_at_top_right,rgba(255,191,73,.55),transparent_38%),radial-gradient(circle_at_top_left,rgba(255,121,198,.35),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,163,196,.45),transparent_35%),linear-gradient(to_right,#f3c7db_1px,transparent_1px),linear-gradient(to_bottom,#f3c7db_1px,transparent_1px)]
                    ">
        <div className="flex w-full min-w-0 flex-col gap-4">
          <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1.72fr)_280px]">
            <div className="min-w-0 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {displayMetrics.map((item) => (
                  <MetricCard key={item.label} item={item} />
                ))}
              </div>

              <DashboardCard>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between mb-4">
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
                      onClick={() => navigate(ROUTES.receptionistQueue)}
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
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${appointmentPage === 1
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
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${appointmentPage === appointmentTotalPages
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
                <div className="space-y-4">
                  <DashboardCard>
                    <SectionTitle icon={Clock3} title="Walk-In Queue" />
                    <div className="mt-4 space-y-3">
                      {displayWalkInQueue.length > 0 ? (
                        displayWalkInQueue.map((item, index) => (
                          <div
                            key={`${item.guestName}-${index}`}
                            className="flex flex-col gap-3 rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ea4f93] text-[10px] font-extrabold text-white">
                                {item.queuePosition || index + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#432744]">
                                  {typeof item.guestName === 'object' ? item.guestName?.customerName || 'Customer' : (item.guestName || 'Customer')}
                                </p>
                                <p className="mt-1 break-words text-[11px] text-[#b28a9f]">
                                  {typeof item.requestNote === 'object' ? item.requestNote?.note || 'Walk-in request' : (item.requestNote || "--")}
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-sm font-extrabold text-[#ea4f93]">
                                {item.estimatedWait || 0}m
                              </p>
                              <p className="text-[10px] text-[#c59bb0]">waiting</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-center text-sm text-[#aa8a99]">
                          No walk-ins currently waiting.
                        </div>
                      )}
                    </div>
                  </DashboardCard>
                </div>

                <DashboardCard>
                  <SectionTitle icon={Clock3} title="Waitlist Queue" />
                  <div className="mt-4 space-y-3">
                    {displayQueue.length > 0 ? (
                      displayQueue.map(([name, service, wait], index) => (
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
                      ))
                    ) : (
                      <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-center text-sm text-[#aa8a99]">
                        No customers currently on the waitlist.
                      </div>
                    )}
                  </div>
                </DashboardCard>
              </div>
              <DashboardCard>
                <SectionTitle icon={UserRound} title="Live Chair Status" />
                <div className="mt-4">
                  {dashboardData?.liveChairStatus?.length > 0 ? (
                    <ChairMap
                      chairs={dashboardData.liveChairStatus.map(c => ({ ...c, chairName: c.name }))}
                      renderCell={(cellName, chair) => {
                        if (chair) {
                          return (
                            <div
                              key={cellName}
                              className="flex flex-col items-center justify-center gap-1 w-[90px] h-[90px] rounded-2xl border-2 transition-all duration-300 bg-[#fff8fb] border-pink-200 shadow-sm hover:shadow-md"
                            >
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${chair.isOccupied ? "bg-[#eb5b92]" : "bg-[#8e50cf]"}`}
                              >
                                <Armchair size={16} />
                              </div>
                              <p className="mt-1 text-[11px] font-bold text-[#432744] truncate w-full text-center px-1">{chair.name || "Chair"}</p>
                              {chair.isOccupied ? (
                                <div className="flex flex-col items-center leading-tight">
                                  <span className="inline-flex rounded-full bg-[#ffeaf2] px-2 py-0.5 text-[9px] font-bold text-[#ef5a95]">
                                    Occupied
                                  </span>
                                  <span className="text-[9px] text-[#aa8a99] truncate w-20 text-center">
                                    {typeof chair.currentCustomer === 'object' ? chair.currentCustomer?.customerName || 'Customer' : (chair.currentCustomer || 'Customer')}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex rounded-full bg-[#e8f8ed] px-2 py-0.5 text-[9px] font-bold text-[#30a364]">
                                  Available
                                </span>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={cellName}
                              className="flex flex-col items-center justify-center w-[90px] h-[90px] rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 opacity-40 pointer-events-none"
                            >
                              <span className="text-[10px] font-bold text-slate-300">{cellName}</span>
                            </div>
                          );
                        }
                      }}
                    />
                  ) : (
                    <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-center text-sm text-[#aa8a99]">
                      No chair status data available.
                    </div>
                  )}
                </div>
              </DashboardCard>
              <DashboardCard>
                <SectionTitle icon={UserRound} title="Staff Availability" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {displayStaff.length > 0 ? (
                    displayStaff.map(([name, initials, status, avatarTone, badgeTone, isOffToday]) => (
                      <div
                        key={name}
                        className={`rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-4 text-center ${isOffToday ? "opacity-50 grayscale" : ""}`}
                      >
                        <div
                          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold text-white ${avatarTone}`}
                        >
                          {initials}
                        </div>
                        <p className={`mt-3 text-sm font-bold ${isOffToday ? "text-gray-500" : "text-[#432744]"}`}>{name}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${badgeTone}`}
                        >
                          {status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-center text-sm text-[#aa8a99]">
                      No staff availability data available.
                    </div>
                  )}
                </div>
              </DashboardCard>
            </div>

            <aside className="min-w-0 space-y-4">
              <DashboardCard>
                <SectionTitle icon={AlertCircle} title="Late / No-Show Alerts" />
                <div className="mt-4 space-y-3">
                  {displayAlerts.length > 0 ? (
                    displayAlerts.map((alert, index) => (
                      <div
                        key={alert.bookingId || index}
                        className="flex flex-col gap-3 rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ef4f92] text-[10px] font-extrabold text-white">
                            !
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#432744]">
                              {typeof alert.customerName === 'object' ? alert.customerName?.customerName || 'Customer' : (alert.customerName || 'Customer')}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-[#ef4f92]">{alert.minutesLate} mins late</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-center text-sm text-[#aa8a99]">
                      No late alerts at this time.
                    </div>
                  )}
                </div>
              </DashboardCard>

              <DashboardCard>
                <SectionTitle icon={Sparkles} title="Quick Status" />
                <div className="mt-4 space-y-4">
                  {displayQuickStatus.map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="break-words text-[#9d8191]">{label}</span>
                      <span className="font-extrabold text-[#ea4f93]">{value}</span>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard>
                <SectionTitle icon={Bell} title="Recent Check-ins & Arrivals" />
                <div className="mt-4 space-y-4">
                  {displayArrivals.length > 0 ? (
                    displayArrivals.map(([name, service, time, initials, bg], index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${bg}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#432744]">{name}</p>
                          <p className="mt-1 truncate text-xs text-[#aa8a99]">
                            {service} • <span className="font-semibold text-[#ef4f92]">{time}</span>
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-6 text-center text-sm text-[#aa8a99]">
                      No upcoming arrivals today.
                    </div>
                  )}
                </div>
              </DashboardCard>
            </aside>
          </div>
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
