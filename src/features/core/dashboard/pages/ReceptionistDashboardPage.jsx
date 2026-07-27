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
  GripHorizontal,
  Pin,
  PinOff,
  EyeOff,
  Settings2,
} from "lucide-react";
import { Modal, Table, DatePicker, Dropdown, Button } from "antd";
import dayjs from "dayjs";
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
      return "bg-green-100 text-green-600";
    case "ServiceCompleted":
      return "bg-[#e8f8ed] text-[#309d63]";
    case "CheckedIn":
      return "bg-[#eef1fb] text-[#6876c8]";
    case "Approved":
      return "bg-[#f2f0ff] text-[#8b5cf6]";
    case "Pending":
      return "bg-[#fff4e8] text-[#f08b2e]";
    case "ReschedulePending":
      return "bg-[#fffbe6] text-[#faad14]";
    case "Cancelled":
    case "NoShow":
      return "bg-[#fff1f0] text-[#f5222d]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
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
    rawStartTime: booking.startTime || "",
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

function SectionTitle({ icon: Icon, title, action, className = "" }) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${className}`}>
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
          <h2 className="mt-3 text-[24px] font-bold tracking-tight text-slate-800 leading-none break-all">
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

const defaultWidgets = [
  { id: 'appointments', title: 'Today\'s Appointments', visible: true, pinned: false },
  { id: 'walkInQueue', title: 'Walk-In Queue', visible: true, pinned: false },
  { id: 'waitlist', title: 'Waitlist Queue', visible: true, pinned: false },
  { id: 'liveChair', title: 'Live Chair Status', visible: true, pinned: false },
];

function WidgetWrapper({ id, widget, onPin, onHide, onDragStart, onDragOver, onDrop, onDragEnter, children, isPinned, fullWidth }) {
  return (
    <div
      draggable={!isPinned}
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={`relative group h-full flex flex-col ${isPinned ? 'col-span-full' : (fullWidth ? 'xl:col-span-2' : '')}`}
    >
      <DashboardCard className={`flex flex-col h-full ${isPinned ? 'min-h-[400px]' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {!isPinned && (
              <div className="cursor-grab active:cursor-grabbing text-[#c59bb0] hover:text-[#ea4f93]">
                <GripHorizontal size={18} />
              </div>
            )}
            <h3 className={`min-w-0 font-extrabold text-[#e14f91] ${isPinned ? 'text-[18px]' : 'text-sm'}`}>{widget.title}</h3>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onPin(id)}
              className="p-1.5 text-[#c59bb0] hover:text-[#7a57d9] hover:bg-[#f2f0ff] rounded-md transition-colors"
              title={isPinned ? "Unpin widget" : "Pin to top"}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button
              onClick={() => onHide(id)}
              className="p-1.5 text-[#c59bb0] hover:text-[#ea4f93] hover:bg-[#fff2f8] rounded-md transition-colors"
              title="Hide widget"
            >
              <EyeOff size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </DashboardCard>
    </div>
  );
}

export function ReceptionistDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const selectedDateStr = selectedDate.format("YYYY-MM-DD");

  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('receptionistDashboardWidgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return defaultWidgets;
  });

  const [draggedWidgetId, setDraggedWidgetId] = useState(null);

  useEffect(() => {
    localStorage.setItem('receptionistDashboardWidgets', JSON.stringify(widgets));
  }, [widgets]);

  const { data: dashboardData } = useReceptionistDashboard(user?.salonId, selectedDateStr);

  const { data: walkInQueueData } = useWalkInQueue(user?.salonId);
  const { data: waitlistData } = useWaitlist(user?.salonId);
  const { data: staffArtistsData } = useStaffArtists(user?.salonId);

  const activeStaffItems = staffArtistsData?.items || dashboardData?.liveChairStatus || [];
  const todayStr = selectedDateStr;

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

  const [selectedChair, setSelectedChair] = useState(null);
  const [isChairModalOpen, setIsChairModalOpen] = useState(false);

  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [isQueueDetailModalOpen, setIsQueueDetailModalOpen] = useState(false);

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

  const handleDragStart = (e, id) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) return;

    setWidgets((prev) => {
      const newWidgets = [...prev];
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidgetId);
      const targetIndex = newWidgets.findIndex(w => w.id === targetId);

      const [draggedItem] = newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, draggedItem);
      return newWidgets;
    });
    setDraggedWidgetId(null);
  };

  const handleDragEnter = (e, id) => {
    e.preventDefault();
  };

  const togglePin = (id) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, pinned: !w.pinned } : w));
  };

  const toggleHide = (id) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const resetLayout = () => {
    setWidgets(defaultWidgets);
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void (async () => {
        setIsAppointmentsLoading(true);
        setAppointmentsError("");

        try {
          const bookings = await fetchReceptionistBookings(selectedDateStr);
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
  }, [selectedDateStr]);

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
      width: 170,
      sorter: (a, b) => (a.rawStartTime || "").localeCompare(b.rawStartTime || ""),
      defaultSortOrder: 'ascend',
      render: (value) => <span className="text-xs font-semibold text-[#ea4f93] whitespace-nowrap">{value}</span>,
    },
    {
      title: "Customer",
      key: "customer",
      sorter: (a, b) => a.customer.localeCompare(b.customer),
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${row.avatarTone}`}>
            {getInitials(row.customer)}
          </div>
          <p className="text-xs font-bold text-[#432744] whitespace-nowrap">{row.customer}</p>
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
      sorter: (a, b) => a.staff.localeCompare(b.staff),
      render: (value) => <span className="text-xs text-[#584654] whitespace-nowrap">{value}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (value, row) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${row.tone}`}>
          {value}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
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

  const displayWalkInQueue = (walkInQueueData || dashboardData?.liveWalkInQueue || [])
    .slice()
    .sort((a, b) => (a.queuePosition || 999) - (b.queuePosition || 999));
  const displayMasterSchedule = dashboardData?.masterSalonSchedule || [];
  const displayAlerts = dashboardData?.noShowLateAlerts || [];

  const renderWidgetContent = (id) => {
    switch (id) {
      case 'appointments':
        return (
          <>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end mb-4">
              <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] w-auto">
                <label className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-[#f4d6e2] bg-white px-4 text-sm text-[#c59bb0] sm:min-w-[0] xl:min-w-[380px]">
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
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#e7dcff] bg-white hover:bg-[#7a57d9] hover:text-white px-4 text-sm font-bold text-[#7a57d9] shadow-[0_10px_24px_rgba(122,87,217,0.1)] whitespace-nowrap"
                >
                  <UserCheck size={15} />
                  Check-in
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.receptionistCustomers)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#f3cfe0] bg-[#fff3f8] hover:bg-[#eb5a98] hover:text-white px-4 text-sm font-bold text-[#eb5a98] whitespace-nowrap"
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

            <div className="mt-4 hidden md:block flex-1 overflow-auto">
              <Table
                rowKey="id"
                columns={appointmentColumns}
                dataSource={paginatedAppointmentRows}
                loading={isAppointmentsLoading}
                pagination={false}
                size="middle"
                scroll={{ x: "max-content" }}
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
          </>
        );

      case 'walkInQueue':
        return (
          <div className="mt-2 space-y-3 flex-1 overflow-y-auto min-h-0">
            {displayWalkInQueue.length > 0 ? (
              displayWalkInQueue.map((item, index) => {
                const guestName = typeof item.guestName === 'object' ? item.guestName?.customerName || 'Customer' : (item.guestName || 'Customer');
                const requestNote = typeof item.requestNote === 'object' ? item.requestNote?.note || 'Walk-in request' : (item.requestNote || "--");

                // Convert arrivalTime to readable format (HH:mm)
                const arrivalTimeStr = item.arrivalTime ? new Date(item.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

                // Determine status styling
                const status = item.status || "Waiting";
                let statusTone = "bg-[#fffbe6] text-[#faad14] border-[#ffe58f]";
                let statusLabel = "Đang Đợi";

                if (status.toLowerCase() === "called") {
                  statusTone = "bg-[#e6f4ff] text-[#0066ff] border-[#91caff]";
                  statusLabel = "Đã Gọi";
                } else if (status.toLowerCase() === "done" || status.toLowerCase() === "completed") {
                  statusTone = "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]";
                  statusLabel = "Hoàn Thành";
                } else if (status.toLowerCase() === "in_service" || status.toLowerCase() === "inservice") {
                  statusTone = "bg-[#f9f0ff] text-[#722ed1] border-[#d3adf7]";
                  statusLabel = "Đang Phục Vụ";
                }

                return (
                  <div
                    key={item.queueId || `${guestName}-${index}`}
                    onClick={() => { setSelectedQueueItem(item); setIsQueueDetailModalOpen(true); }}
                    className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[20px] border border-[#F3E2EC] bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(232,79,147,0.12)] cursor-pointer"
                  >
                    <div className="flex items-start gap-3 w-full sm:w-auto overflow-hidden">
                      {/* Position Badge */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#E84F93] to-[#8B5CF6] text-sm font-black text-white shadow-md shadow-[#E84F93]/30 group-hover:scale-110 transition-transform">
                          #{item.queuePosition || index + 1}
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[15px] font-bold text-[#2B182B] truncate">{guestName}</p>
                          {item.isLateArrival && (
                            <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#DC2626] border border-[#FEE2E2] flex-shrink-0">
                              Trễ
                            </span>
                          )}
                          {item.assignedNailArtistId && (
                            <span className="rounded-full bg-[#F5F3FF] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7C3AED] border border-[#EDE9FE] flex-shrink-0">
                              Có Thợ
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#D1FAE5]">
                            <Clock3 size={11} /> {arrivalTimeStr}
                          </span>
                          <span className="text-[#9E8497] truncate" title={requestNote}>
                            {requestNote}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-1 border-t border-[#F3E2EC] pt-3 sm:border-t-0 sm:pt-0 shrink-0">
                      <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${statusTone}`}>
                        {statusLabel}
                      </span>
                      {status.toLowerCase() !== "done" && status.toLowerCase() !== "completed" && (
                        <p className="text-lg font-black text-[#E84F93] leading-none whitespace-nowrap mt-1 sm:mt-0">
                          {item.estimatedWait || 0} <span className="text-[10px] font-bold text-[#9E8497]">phút</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-8 text-center text-sm font-medium text-[#aa8a99]">
                No walk-ins currently waiting.
              </div>
            )}
          </div>
        );

      case 'waitlist':
        return (
          <div className="mt-2 space-y-3 flex-1 overflow-y-auto min-h-0">
            {displayQueue.length > 0 ? (
              displayQueue.map(([name, service, wait], index) => (
                <div
                  key={`${name}-${wait}`}
                  className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[20px] border border-[#f7e0ea] bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(245,158,11,0.12)] cursor-pointer"
                >
                  <div className="flex items-start gap-3 w-full sm:w-auto overflow-hidden">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-sm font-black text-white shadow-md shadow-[#F59E0B]/30 group-hover:scale-110 transition-transform">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-[#2B182B] truncate">{name}</p>
                      <div className="mt-1 flex items-center">
                        <span className="truncate text-[11px] font-medium text-[#9E8497] bg-[#F3F4F6] inline-flex px-2 py-0.5 rounded-md border border-[#E5E7EB]" title={service}>
                          {service}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-1 border-t border-[#F3E2EC] pt-3 sm:border-t-0 sm:pt-0 shrink-0">
                    <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border bg-[#fffbe6] text-[#faad14] border-[#ffe58f] whitespace-nowrap">
                      Waiting
                    </span>
                    <p className="text-lg font-black text-[#F59E0B] leading-none whitespace-nowrap mt-1 sm:mt-0">
                      {wait.replace('m', '')} <span className="text-[10px] font-bold text-[#9E8497]">phút</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] border border-[#f7e0ea] bg-[#fff8fb] px-4 py-8 text-center text-sm font-medium text-[#aa8a99]">
                No customers currently on the waitlist.
              </div>
            )}
          </div>
        );

      case 'liveChair':
        return (
          <div className="mt-2 flex-1 overflow-auto min-h-0">
            {dashboardData?.liveChairStatus?.length > 0 ? (
              <ChairMap
                chairs={dashboardData.liveChairStatus.map(c => ({ ...c, chairName: c.name }))}
                renderCell={(cellName, chair) => {
                  if (chair) {
                    return (
                      <div
                        key={cellName}
                        onClick={() => {
                          setSelectedChair(chair);
                          setIsChairModalOpen(true);
                        }}
                        className="flex flex-col items-center justify-center gap-1 w-[90px] h-[90px] rounded-2xl border-2 transition-all duration-300 bg-[#fff8fb] border-pink-200 shadow-sm hover:shadow-md cursor-pointer hover:scale-105"
                      >
                        <div
                          className={`mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${chair.isOccupied ? "bg-[#eb5b92]" : "bg-[#8e50cf]"}`}
                        >
                          <Armchair size={16} />
                        </div>
                        <p className="mt-1 text-[11px] font-bold text-[#432744] truncate w-full text-center px-1">{chair.name || "Chair"}</p>
                        {chair.isOccupied ? (
                          <div className="flex flex-col items-center leading-tight">
                            <span className="inline-flex rounded-full bg-[#ffeaf2] px-2 py-0.5 text-[9px] font-bold text-[#ef5a95]">
                              Occupied
                            </span>
                            <span className="text-[9px] text-[#aa8a99] truncate w-20 text-center mt-0.5">
                              {typeof chair.currentCustomer === 'object' ? chair.currentCustomer?.customerName || 'Customer' : (chair.currentCustomer || 'Customer')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center leading-tight">
                            <span className="inline-flex rounded-full bg-[#e8f8ed] px-2 py-0.5 text-[9px] font-bold text-[#30a364]">
                              Available
                            </span>
                            <span className="text-[9px] text-[#aa8a99] truncate w-20 text-center mt-0.5">
                              {typeof chair.currentCustomer === 'object' ? chair.currentCustomer?.customerName || '--' : (chair.currentCustomer || '--')}
                            </span>
                          </div>
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
        );

      default:
        return null;
    }
  };

  return (
    <section className="flex min-h-screen flex-col bg-slate-50 text-slate-800 font-sans">
      <div className="mx-auto w-full space-y-6 p-4 md:p-8
                      bg-[#fff9fb]
                      bg-[radial-gradient(circle_at_top_right,rgba(255,191,73,.55),transparent_38%),radial-gradient(circle_at_top_left,rgba(255,121,198,.35),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,163,196,.45),transparent_35%),linear-gradient(to_right,#f3c7db_1px,transparent_1px),linear-gradient(to_bottom,#f3c7db_1px,transparent_1px)]
                    ">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div>
            <h1 className="text-2xl font-black text-[#e14f91]">Receptionist Dashboard</h1>
            <p className="text-sm font-semibold text-[#c59bb0]">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {greetingName}!</p>
          </div>
          <div className="flex items-center gap-3">
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              allowClear={false}
              format="YYYY-MM-DD"
              className="h-10 rounded-xl border-[#f4d6e2]"
            />
            <Dropdown
              menu={{
                items: [
                  ...widgets.map(w => ({
                    key: w.id,
                    label: (
                      <div className="flex items-center justify-between min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        <span className="font-medium text-slate-700">{w.title}</span>
                        <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); toggleHide(w.id); }}>
                          {w.visible ? <Eye size={14} className="text-emerald-500" /> : <EyeOff size={14} className="text-slate-400" />}
                        </Button>
                      </div>
                    )
                  })),
                  { type: 'divider' },
                  {
                    key: 'reset',
                    label: <div className="text-red-500 text-center font-bold">Reset Layout</div>,
                    onClick: resetLayout
                  }
                ]
              }}
              trigger={['click']}
            >
              <Button className="h-10 rounded-xl border-[#f4d6e2] text-[#e14f91] font-bold bg-white hover:bg-pink-50 flex items-center gap-2 shadow-sm">
                <Settings2 size={16} />
                Customize
              </Button>
            </Dropdown>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {displayMetrics.map((item) => (
              <MetricCard key={item.label} item={item} />
            ))}
          </div>
          <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1.72fr)_320px]">
            <div className="min-w-0 space-y-4">

              <div className="grid w-full min-w-0 gap-4 grid-cols-1 lg:grid-cols-2">
                {widgets
                  .filter(w => w.pinned && w.visible)
                  .map(w => (
                    <WidgetWrapper
                      key={w.id}
                      id={w.id}
                      widget={w}
                      onPin={togglePin}
                      onHide={toggleHide}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnter={handleDragEnter}
                      isPinned={true}
                      fullWidth={['appointments', 'liveChair'].includes(w.id)}
                    >
                      {renderWidgetContent(w.id)}
                    </WidgetWrapper>
                  ))}
                {widgets
                  .filter(w => !w.pinned && w.visible)
                  .map(w => (
                    <WidgetWrapper
                      key={w.id}
                      id={w.id}
                      widget={w}
                      onPin={togglePin}
                      onHide={toggleHide}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnter={handleDragEnter}
                      isPinned={false}
                      fullWidth={['appointments', 'liveChair'].includes(w.id)}
                    >
                      {renderWidgetContent(w.id)}
                    </WidgetWrapper>
                  ))}
              </div>
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

      <Modal
        title={
          <div className="flex items-center gap-2 text-[#432744]">
            <Armchair className="text-[#ea4f93]" size={20} />
            <span className="font-bold text-lg">Chair {selectedChair?.name} Details</span>
          </div>
        }
        open={isChairModalOpen}
        onCancel={() => {
          setIsChairModalOpen(false);
          setSelectedChair(null);
        }}
        footer={null}
        width={400}
        centered
        className="rounded-2xl"
      >
        {selectedChair && (
          <div className="mt-4 space-y-4 text-sm text-[#584654]">
            <div className="flex justify-between items-center py-2 border-b border-[#f7e0ea]">
              <span className="font-semibold text-[#aa8a99]">isOccupied</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedChair.isOccupied ? "bg-pink-50 text-pink-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                {selectedChair.isOccupied ? "true" : "false"}
              </span>
            </div>

            <div className="bg-[#fff8fb] rounded-xl p-4 border border-[#f7e0ea] mt-4 flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedChair.isOccupied ? 'bg-pink-100 text-pink-500' : 'bg-emerald-100 text-emerald-500'}`}>
                <UserRound size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#aa8a99]">currentCustomer</p>
                <p className="font-bold text-[#432744] text-base truncate">
                  {selectedChair.isOccupied ? (
                    typeof selectedChair.currentCustomer === 'object'
                      ? selectedChair.currentCustomer?.customerName
                      : (selectedChair.currentCustomer || "Walk-In")
                  ) : (
                    <span className="text-gray-400 italic">None</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Queue Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-[#2B182B] text-base font-bold">
            <UserRound size={18} className="text-[#E84F93]" />
            Chi Tiết Lượt Chờ
          </div>
        }
        open={isQueueDetailModalOpen}
        onCancel={() => setIsQueueDetailModalOpen(false)}
        footer={null}
        width={500}
        centered
        className="rounded-2xl"
      >
        {selectedQueueItem && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500">Khách Hàng</span>
              <span className="text-sm font-bold text-gray-900">{typeof selectedQueueItem.guestName === 'object' ? selectedQueueItem.guestName?.customerName : selectedQueueItem.guestName}</span>
            </div>
            {selectedQueueItem.guestPhone && (
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm font-medium text-gray-500">Số Điện Thoại</span>
                <span className="text-sm font-bold text-gray-900">{selectedQueueItem.guestPhone}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500">Số Thứ Tự</span>
              <span className="text-sm font-bold text-[#E84F93]">#{selectedQueueItem.queuePosition}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500">Trạng Thái</span>
              <span className="text-sm font-bold text-gray-900">{selectedQueueItem.status || "Đang Đợi"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500">Giờ Đến</span>
              <span className="text-sm font-bold text-gray-900">
                {selectedQueueItem.arrivalTime ? new Date(selectedQueueItem.arrivalTime).toLocaleTimeString() : "--"}
              </span>
            </div>
            {selectedQueueItem.calledTime && (
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm font-medium text-gray-500">Giờ Gọi</span>
                <span className="text-sm font-bold text-[#0066ff]">
                  {new Date(selectedQueueItem.calledTime).toLocaleTimeString()}
                </span>
              </div>
            )}
            {selectedQueueItem.serviceStartTime && (
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm font-medium text-gray-500">Bắt Đầu Phục Vụ</span>
                <span className="text-sm font-bold text-[#52c41a]">
                  {new Date(selectedQueueItem.serviceStartTime).toLocaleTimeString()}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500">Yêu Cầu / Ghi Chú</span>
              <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap rounded-lg bg-gray-50 p-3">
                {typeof selectedQueueItem.requestNote === 'object' ? selectedQueueItem.requestNote?.note : (selectedQueueItem.requestNote || "Không có")}
              </p>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500">Thợ Phân Công</span>
              <span className="text-sm font-bold text-purple-600">
                {selectedQueueItem.assignedNailArtistName || "Chưa phân công"}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
