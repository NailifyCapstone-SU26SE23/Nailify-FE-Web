import { CalendarDays, ChevronLeft, ChevronRight, Eye, LoaderCircle, RefreshCcw, Search, SquareCheckBig, UserCheck, UserPlus, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Table, Modal } from "antd";
import toast from "react-hot-toast";
import jsQR from "jsqr";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { usePagination } from "../../../../shared/hooks/usePagination";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ROUTES,
  getReceptionistBookingDetailRoute,
} from "../../../../shared/constants/routes";
import { AssignReceptionistArtistModal } from "../components/AssignReceptionistArtistModal";
import {
  checkoutReceptionistBooking,
  fetchReceptionistBookings,
  fetchReceptionistSalonDetail,
  getReceptionistSalonId,
  manualCheckInReceptionistBooking,
  verifyReceptionistQrToken,
} from "../services/receptionistBookingService";

function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} VND`;
}

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) {
    return "--";
  }

  return value.slice(0, 5);
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function getTodayDateParam() {
  return toDateInputValue(new Date());
}

function getStatusTone(status) {
  const norm = String(status || "").trim().toLowerCase();
  switch (norm) {
    case "completed":
    case "servicecompleted":
      return "bg-[#e8f8ef] text-[#1f9d61] border border-[#b8f0d0]";
    case "confirmed":
    case "approved":
    case "checkedin":
      return "bg-[#eaf1ff] text-[#4c71d9] border border-[#c4d7ff]";
    case "pending":
      return "bg-[#fff3e5] text-[#d98b1d] border border-[#ffe0b3]";
    case "cancelled":
    case "rejected":
      return "bg-[#ffe8ef] text-[#df4e86] border border-[#ffc2d5]";
    default:
      return "bg-[#f5ecff] text-[#7c63d8] border border-[#dcd0ff]";
  }
}

function normalizeBooking(booking) {
  return {
    bookingId: booking.bookingId,
    customerName: booking.customerName || "Unknown customer",
    artistName: booking.artistName || "Unassigned",
    salonName: booking.salonName,
    bookingDate: booking.bookingDate,
    bookingDateValue: toDateInputValue(booking.bookingDate),
    startTime: booking.startTime,
    totalPrice: booking.totalPrice,
    status: booking.status || "Pending",
    totalDuration: booking.totalDuration,
    services: booking.bookingItems?.map((item) => item.serviceName).filter(Boolean) ?? [],
  };
}

function canManualCheckIn(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  return ![
    "checkedin",
    "in progress",
    "inprogress",
    "completed",
    "servicecompleted",
    "cancelled",
  ].includes(normalizedStatus);
}

function isReadyForCheckout(status) {
  return String(status || "").trim() === "ServiceCompleted";
}

const BOOKING_PAGE_SIZE = 10;
const RECEPTIONIST_BOOKING_FETCH_SIZE = 10;
const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected", "Cancelled", "CheckedIn", "InProgress", "ServiceCompleted", "Completed", "Repaired", "ReschedulePending", "RescheduleSuggested"];

export function ReceptionistBookingListPage() {
  const { t, language } = useLanguage();
  const formatDisplay = (s) => {
    switch (s) {
      case "Checked In":
      case "CheckedIn":
        return language === "vi" ? "Đã check in" : "Checked In";
      case "In Progress":
      case "InProgress":
        return language === "vi" ? "Đang tiến hành" : "In Progress";
      case "Pending":
        return language === "vi" ? "Đang chờ" : "Pending";
      case "Confirmed":
      case "Approved":
        return language === "vi" ? "Đã xác nhận" : "Confirmed";
      case "Completed":
      case "ServiceCompleted":
        return language === "vi" ? "Đã hoàn thành" : "Completed";
      case "Rejected":
        return language === "vi" ? "Đã từ chối" : "Rejected";
      case "Cancelled":
      case "Canceled":
        return language === "vi" ? "Đã hủy" : "Cancelled";
      case "ReschedulePending":
        return language === "vi" ? "Đang chờ dời lịch" : "Reschedule Pending";
      case "RescheduleSuggested":
        return language === "vi" ? "Đã đề xuất dời lịch" : "Reschedule Proposed";
      case "Repaired":
        return language === "vi" ? "Đã sửa chữa" : "Repaired";
      case "All":
        return language === "vi" ? "Tất cả" : "All";
      default:
        return s;
    }
  };
  const location = useLocation();
  const navigate = useNavigate();
  const todayDate = useMemo(() => getTodayDateParam(), []);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const [draftQuery, setDraftQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(todayDate);
  const [dateTo, setDateTo] = useState(todayDate);
  const [appliedDateFrom, setAppliedDateFrom] = useState(todayDate);
  const [appliedDateTo, setAppliedDateTo] = useState(todayDate);
  const [salonFilter, setSalonFilter] = useState("All salons");
  const [appliedSalonFilter, setAppliedSalonFilter] = useState("All salons");
  const [statusFilter, setStatusFilter] = useState("All");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All staff");
  const [appliedStaffFilter, setAppliedStaffFilter] = useState("All staff");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [salonName, setSalonName] = useState("Receptionist Booking Management");
  const [salonMeta, setSalonMeta] = useState("Bookings are loaded from salon API.");
  const [assignArtistBooking, setAssignArtistBooking] = useState(null);

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
  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const firstPageResult = await fetchReceptionistBookings({
        startDate: appliedDateFrom,
        endDate: appliedDateTo,
        pageNumber: 1,
        pageSize: RECEPTIONIST_BOOKING_FETCH_SIZE,
        includePagination: true,
      });
      let allBookings = Array.isArray(firstPageResult?.items) ? [...firstPageResult.items] : [];
      const totalPages = Math.max(1, Number(firstPageResult?.pagination?.totalPages || 1));

      if (totalPages > 1) {
        const remainingPageRequests = [];

        for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
          remainingPageRequests.push(
            fetchReceptionistBookings({
              startDate: appliedDateFrom,
              endDate: appliedDateTo,
              pageNumber,
              pageSize: RECEPTIONIST_BOOKING_FETCH_SIZE,
              includePagination: true,
            }),
          );
        }

        const remainingResults = await Promise.all(remainingPageRequests);
        remainingResults.forEach((pageResult) => {
          if (Array.isArray(pageResult?.items)) {
            allBookings = allBookings.concat(pageResult.items);
          }
        });
      }

      setBookings(allBookings.map(normalizeBooking));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load bookings.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [appliedDateFrom, appliedDateTo]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadBookings();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadBookings]);

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void (async () => {
        try {
          const salonId = getReceptionistSalonId();
          const salon = await fetchReceptionistSalonDetail(salonId);
          setSalonName(salon?.name || "Receptionist Booking Management");
          setSalonMeta(
            [salon?.address, salon?.phone].filter(Boolean).join(" | ") || "Bookings are loaded from salon API.",
          );
        } catch (salonError) {
          const message =
            salonError instanceof Error ? salonError.message : "Failed to load salon detail.";
          setSalonName("Receptionist Booking Management");
          setSalonMeta(message);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const salonOptions = useMemo(
    () => ["All salons", ...new Set(bookings.map((booking) => booking.salonName).filter(Boolean))],
    [bookings],
  );

  const staffOptions = useMemo(
    () => ["All staff", ...new Set(bookings.map((booking) => booking.artistName).filter(Boolean))],
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    const normalizedQuery = appliedQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          booking.bookingId,
          booking.customerName,
          booking.artistName,
          booking.salonName,
          booking.status,
          booking.services.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesDate =
        (!appliedDateFrom || booking.bookingDateValue >= appliedDateFrom) &&
        (!appliedDateTo || booking.bookingDateValue <= appliedDateTo);
      const matchesSalon =
        appliedSalonFilter === "All salons" || booking.salonName === appliedSalonFilter;
      const matchesStatus =
        appliedStatusFilter === "All" || booking.status === appliedStatusFilter;
      const matchesStaff =
        appliedStaffFilter === "All staff" || booking.artistName === appliedStaffFilter;

      return matchesQuery && matchesDate && matchesSalon && matchesStatus && matchesStaff;
    });
  }, [appliedDateFrom, appliedDateTo, appliedQuery, appliedSalonFilter, appliedStaffFilter, appliedStatusFilter, bookings]);

  const {
    currentPage,
    paginatedItems: paginatedBookings,
    setCurrentPage,
    totalPages,
  } = usePagination(filteredBookings, BOOKING_PAGE_SIZE);

  const paginationLabel = useMemo(() => {
    if (!filteredBookings.length) {
      return "Showing 0 bookings";
    }

    const start = (currentPage - 1) * BOOKING_PAGE_SIZE + 1;
    const end = Math.min(filteredBookings.length, start + paginatedBookings.length - 1);

    return `Showing ${start}-${end} of ${filteredBookings.length} bookings`;
  }, [currentPage, filteredBookings.length, paginatedBookings.length]);

  const summary = useMemo(() => {
    const waitingCount = bookings.filter((booking) => booking.status === "Pending").length;
    const checkedInCount = bookings.filter((booking) => booking.status === "CheckedIn").length;

    return {
      total: filteredBookings.length,
      waiting: waitingCount,
      checkedIn: checkedInCount,
      revenue: bookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
    };
  }, [bookings, filteredBookings.length]);

  function updateBookingRow(updatedBooking) {
    if (!updatedBooking?.bookingId) {
      return;
    }

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.bookingId === updatedBooking.bookingId ? normalizeBooking(updatedBooking) : booking,
      ),
    );
  }

  const handleManualCheckIn = useCallback(async (bookingId) => {
    try {
      const updatedBooking = await manualCheckInReceptionistBooking(bookingId);
      updateBookingRow(updatedBooking);
      toast.success("Customer checked in successfully.");
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check in booking.";
      toast.error(message);
    }
  }, []);

  const handleCheckout = useCallback(async (bookingId) => {
    try {
      const updatedBooking = await checkoutReceptionistBooking(bookingId);
      updateBookingRow(updatedBooking);
      toast.success("Checkout completed successfully.");
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check out booking.";
      toast.error(message);
    }
  }, []);

  const bookingColumns = useMemo(() => ([
    {
      title: t("receptionist.bookings.customer") || "Customer",
      dataIndex: "customerName",
      key: "customerName",
      sorter: (a, b) => (a.customerName || "").localeCompare(b.customerName || ""),
      render: (value) => <span className="text-sm font-bold text-[#412643]">{value}</span>,
    },
    {
      title: t("receptionist.bookings.salon") || "Salon",
      dataIndex: "salonName",
      key: "salonName",
      sorter: (a, b) => (a.salonName || "").localeCompare(b.salonName || ""),
      render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
    },
    {
      title: t("receptionist.bookings.artist") || "Artist",
      dataIndex: "artistName",
      key: "artistName",
      sorter: (a, b) => (a.artistName || "").localeCompare(b.artistName || ""),
      render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
    },
    {
      title: t("receptionist.bookings.time") || "Schedule",
      key: "schedule",
      sorter: (a, b) => {
        const timeA = new Date(`${a.bookingDate?.split('T')[0] || ''}T${a.startTime || '00:00:00'}`).getTime() || 0;
        const timeB = new Date(`${b.bookingDate?.split('T')[0] || ''}T${b.startTime || '00:00:00'}`).getTime() || 0;
        return timeA - timeB;
      },
      render: (_, booking) => (
        <div>
          <p className="text-sm font-semibold text-[#412643]">{formatDate(booking.bookingDate)}</p>
          <p className="mt-1 text-[11px] text-[#b38a9f]">{formatTime(booking.startTime)}</p>
        </div>
      ),
    },
    {
      title: t("receptionist.bookings.price") || "Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      sorter: (a, b) => (a.totalPrice || 0) - (b.totalPrice || 0),
      render: (value) => <span className="text-sm font-semibold text-[#412643]">{formatCurrency(value)}</span>,
    },
    {
      title: t("receptionist.bookings.status") || "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (status) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold ${getStatusTone(status)}`}>
          {formatDisplay(status)}
        </span>
      ),
    },
    {
      title: t("receptionist.bookings.actions") || "Action",
      key: "action",
      render: (_, booking) => (
        <ActionDropdown
          items={[
            {
              key: "view",
              label: language === "vi" ? "Xem chi tiết" : "View Booking",
              icon: Eye,
              onSelect: () => navigate(getReceptionistBookingDetailRoute(booking.bookingId)),
            },
            ...(canManualCheckIn(booking.status)
              ? [
                {
                  key: "assign-artist",
                  label: booking.artistName && booking.artistName !== "Unassigned"
                    ? t("receptionist.bookings.changeArtist") || "Change Staff Artist"
                    : t("receptionist.bookings.assignArtistTitle") || "Assign Staff Artist",
                  icon: UserRound,
                  className: "text-[#7c63d8]",
                  onSelect: () => setAssignArtistBooking(booking),
                },
                {
                  key: "check-in",
                  label: t("receptionist.dashboard.checkinBtn") || "Check In",
                  icon: SquareCheckBig,
                  className: "text-[#4c71d9]",
                  onSelect: () => void handleManualCheckIn(booking.bookingId),
                },
              ]
              : []),
            ...(isReadyForCheckout(booking.status)
              ? [
                {
                  key: "checkout",
                  label: t("receptionist.dashboard.checkoutBtn") || "Checkout",
                  icon: SquareCheckBig,
                  className: "text-[#4c71d9]",
                  onSelect: () => void handleCheckout(booking.bookingId),
                },
              ]
              : []),
          ]}
        />
      ),
    },
  ]), [handleCheckout, handleManualCheckIn, navigate, t]);

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
        const verifiedBookingId = booking?.bookingId || booking?.id;

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
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("receptionist.dashboard.todayBookings") || "Today Bookings", value: summary.total, note: t("receptionist.dashboard.bookingQueueNote") || "Salon booking queue", iconTone: "bg-[#ffe8f1] text-[#ea4f93]" },
          { label: t("receptionist.dashboard.statusWaiting") || "Waiting", value: summary.waiting, note: t("receptionist.dashboard.frontDeskActionNote") || "Need front desk action", iconTone: "bg-[#fff4e5] text-[#d98b1d]" },
          { label: t("receptionist.dashboard.statusCheckedIn") || "Checked In", value: summary.checkedIn, note: t("receptionist.dashboard.arrivedNote") || "Arrived customers", iconTone: "bg-[#e8f8ed] text-[#1f9d61]" },
          { label: t("receptionist.dashboard.todayRevenue") || "Revenue", value: formatCurrency(summary.revenue), note: t("receptionist.dashboard.revenueNote") || "Total loaded from API", iconTone: "bg-[#f1ecff] text-[#7c63d8]" },
        ].map((item) => (
          <article key={item.label} className="rounded-[20px] border border-[#f6d8e5] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconTone}`}>
              <CalendarDays size={18} />
            </span>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">{item.label}</p>
            <p className="mt-2 text-[1.8rem] font-extrabold text-[#412643]">{item.value}</p>
            <p className="mt-2 text-xs text-[#b38a9f]">{item.note}</p>
          </article>
        ))}
      </div>

      <article className="rounded-[24px] border border-[#f6d8e5] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-extrabold text-[#412643]">
              {salonName === "Receptionist Booking Management" ? t("receptionist.bookings.title") : salonName}
            </p>
            <p className="mt-1 text-sm text-[#b38a9f]">
              {salonMeta === "Bookings are loaded from salon API." ? t("receptionist.bookings.desc") : salonMeta}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadBookings()}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <RefreshCcw size={14} />
              {t("receptionist.common.refresh") || "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#e7dcff] bg-white hover:bg-[#7a57d9] hover:text-white px-4 text-sm font-bold text-[#7a57d9] shadow-[0_10px_24px_rgba(122,87,217,0.1)] whitespace-nowrap"
            >
              <UserCheck size={15} />
              {t("receptionist.bookings.scanCheckInBtn") || "Scan Check-in"}
            </button>

            <Link
              // to={ROUTES.receptionistBookingsCreate}
              to={ROUTES.receptionistCustomers}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] hover:bg-[image:var(--gradient-accent-hover)] hover:text-pink-600"
            >
              <UserPlus size={14} />
              {t("receptionist.walkIn.createBtn") || "Create Walk-in"}
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-[#f7d8e6] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                {t("receptionist.bookings.dateFrom") || "Date From"}
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                {t("receptionist.bookings.dateTo") || "Date To"}
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                {t("receptionist.bookings.salon") || "Salon"}
              </span>
              <select
                value={salonFilter}
                onChange={(event) => setSalonFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
              >
                {salonOptions.map((item) => (
                  <option key={item} value={item}>
                    {item === "All salons" ? t("receptionist.bookings.allSalons") || "All salons" : item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                {t("receptionist.common.status") || "Booking Status"}
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {formatDisplay(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
            <label className="space-y-2 md:w-64">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                {t("receptionist.bookings.artist") || "Staff Artist"}
              </span>
              <select
                value={staffFilter}
                onChange={(event) => setStaffFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
              >
                {staffOptions.map((item) => (
                  <option key={item} value={item}>
                    {item === "All staff" ? t("receptionist.bookings.allStaff") || "All staff" : item}
                  </option>
                ))}
              </select>
            </label>

            <label className="relative block flex-1">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                {t("receptionist.common.search") || "Search"}
              </span>
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-[2.6rem] -translate-y-1/2 text-[#d47aa8]"
              />
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder={t("receptionist.bookings.searchPlaceholder") || "Search booking ID, customer, artist, service..."}
                className="h-12 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] pl-11 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAppliedDateFrom(dateFrom);
                  setAppliedDateTo(dateTo);
                  setAppliedSalonFilter(salonFilter);
                  setAppliedStatusFilter(statusFilter);
                  setAppliedStaffFilter(staffFilter);
                  setAppliedQuery(draftQuery);
                  setCurrentPage(1);
                }}
                className="rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
              >
                {t("receptionist.common.apply") || "Apply"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDateFrom(todayDate);
                  setDateTo(todayDate);
                  setSalonFilter("All salons");
                  setStatusFilter("All");
                  setStaffFilter("All staff");
                  setDraftQuery("");
                  setAppliedDateFrom(todayDate);
                  setAppliedDateTo(todayDate);
                  setAppliedSalonFilter("All salons");
                  setAppliedStatusFilter("All");
                  setAppliedStaffFilter("All staff");
                  setAppliedQuery("");
                  setCurrentPage(1);
                }}
                className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-5 py-3 text-sm font-bold text-[#ea4f93]"
              >
                {t("receptionist.common.reset") || "Reset"}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-[16px] border border-[#f7d4df] bg-[#fff3f7] px-4 py-3 text-sm font-medium text-[#d14c84]">
            {error}
          </div>
        ) : null}

        {flashMessage ? (
          <div className="mt-4 rounded-[16px] border border-[#d8f0e0] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
            {flashMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-6 flex min-h-56 items-center justify-center rounded-[20px] border border-[#f7dce8] bg-[#fffafd]">
            <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
              <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
              {t("receptionist.common.loading") || "Loading bookings..."}
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[20px] border border-[#f7dce8]">
            <div className="hidden lg:block">
              <Table
                rowKey="bookingId"
                columns={bookingColumns}
                dataSource={paginatedBookings}
                pagination={false}
                scroll={{ x: 1100 }}
                locale={{ emptyText: t("receptionist.bookings.noBookings") || "No bookings matched the current search." }}
              />
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {paginatedBookings.map((booking) => (
                <article key={booking.bookingId} className="rounded-[18px] border border-[#f8dce8] bg-[#fffafb] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#412643]">{booking.customerName}</p>
                      <p className="mt-1 text-[11px] text-[#b38a9f]">{booking.artistName}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold ${getStatusTone(booking.status)}`}>
                      {formatDisplay(booking.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[#6b5668]">{booking.services[0]}</p>
                  <p className="mt-1 text-[11px] text-[#b38a9f]">{booking.salonName}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#412643]">{formatDate(booking.bookingDate)}</p>
                      <p className="mt-1 text-[11px] text-[#b38a9f]">{formatTime(booking.startTime)}</p>
                    </div>
                    <ActionDropdown
                      items={[
                        {
                          key: "view",
                          label: language === "vi" ? "Xem chi tiết" : "View Booking",
                          icon: Eye,
                          onSelect: () => navigate(getReceptionistBookingDetailRoute(booking.bookingId)),
                        },
                        ...(canManualCheckIn(booking.status)
                          ? [
                            {
                              key: "assign-artist",
                              label: booking.artistName && booking.artistName !== "Unassigned"
                                ? t("receptionist.bookings.changeArtist") || "Change Staff Artist"
                                : t("receptionist.bookings.assignArtistTitle") || "Assign Staff Artist",
                              icon: UserRound,
                              className: "text-[#7c63d8]",
                              onSelect: () => setAssignArtistBooking(booking),
                            },
                            {
                              key: "check-in",
                              label: t("receptionist.dashboard.checkinBtn") || "Check In",
                              icon: SquareCheckBig,
                              className: "text-[#4c71d9]",
                              onSelect: () => void handleManualCheckIn(booking.bookingId),
                            },
                          ]
                          : []),
                        ...(isReadyForCheckout(booking.status)
                          ? [
                            {
                              key: "checkout",
                              label: t("receptionist.dashboard.checkoutBtn") || "Checkout",
                              icon: SquareCheckBig,
                              className: "text-[#4c71d9]",
                              onSelect: () => void handleCheckout(booking.bookingId),
                            },
                          ]
                          : []),
                        // {
                        //   key: "reject",
                        //   label: "Reject Booking",
                        //   icon: XCircle,
                        //   className: "text-[#df4e86]",
                        //   onSelect: () => void handleRejectBooking(booking.bookingId),
                        // },
                      ]}
                    />
                  </div>
                </article>
              ))}
            </div>

            {filteredBookings.length ? (
              <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-[#c694ad]">{paginationLabel}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92] disabled:opacity-50"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[#ea4f93] px-2 text-[11px] font-bold text-white"
                  >
                    {currentPage}
                  </button>
                  <span className="px-2 text-[11px] font-medium text-[#b9849f]">/ {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92] disabled:opacity-50"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ) : null}

            {!filteredBookings.length ? (
              <div className="border-t border-[#f7dce8] bg-[#fffafd] px-5 py-10 text-center text-sm text-[#8a7082]">
                {language === "vi" ? "Không có lịch hẹn nào khớp với tìm kiếm hiện tại." : "No bookings matched the current search."}
              </div>
            ) : null}
          </div>
        )}
      </article>

      <AssignReceptionistArtistModal
        open={Boolean(assignArtistBooking)}
        bookingId={assignArtistBooking?.bookingId || ""}
        currentArtistName={assignArtistBooking?.artistName || ""}
        onClose={() => setAssignArtistBooking(null)}
        onAssigned={(updatedBooking) => {
          updateBookingRow(updatedBooking);
          setAssignArtistBooking(null);
        }}
      />

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
        title={<span className="text-base font-extrabold text-[#432744]">{language === "vi" ? "Quét mã QR khách hàng để làm thủ tục" : "Customer QR Check-in"}</span>}
      >
        <div className="space-y-4 overflow-hidden">
          <p className="text-sm text-[#8f7484]">
            {language === "vi" ? "Đặt camera vào mã QR của khách hàng. Token đã quét sẽ được gửi đến backend `verify-qr` trước khi mở lịch hẹn." : "Point the webcam at the customer QR code. The scanned token will be sent to backend `verify-qr` before opening the booking."}
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
                {language === "vi" ? "Mã QR khách hàng đã quét cuối cùng" : "Last scanned payload"}
              </p>
              <p className="mt-2 break-all text-sm text-[#5c4557]">{lastScannedCode}</p>
            </div>
          ) : null}
        </div>
      </Modal>
    </section>
  );
}
