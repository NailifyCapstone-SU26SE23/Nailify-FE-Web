import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  Mail,
  Phone,
  Printer,
  Receipt,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ROUTES,
  getReceptionistBookingDetailRoute,
} from "../../../../shared/constants/routes";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import {
  fetchReceptionistBookingDetail,
  fetchReceptionistCustomerDetail,
  fetchReceptionistSalonDetail,
  getReceptionistSalonId,
  checkoutReceptionistBooking,
} from "../../bookings/services/receptionistBookingService";
import { createPayment, getPaymentStatus, cancelPayment } from "../services/receptionistPaymentService";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount)} VND`;
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

function formatTimeWithMeridiem(value) {
  if (!value) {
    return "--";
  }

  const [hourText = "0", minuteText = "0"] = String(value).split(":");
  const date = new Date();
  date.setHours(Number(hourText), Number(minuteText), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getCustomerDisplayName(customerProfile, booking) {
  const fullName = [customerProfile?.firstName, customerProfile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || booking?.customerName || "--";
}

function getCustomerInitials(customerProfile, booking) {
  return getCustomerDisplayName(customerProfile, booking)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NA";
}

function getBillItems(booking) {
  return (booking?.bookingItems ?? []).map((item, index) => ({
    id: item.bookingItemId || `${item.serviceId || "service"}-${index}`,
    name: item.serviceName ,
    subtitle: item.nailVariantName || item.customerNailName || "Service item",
    duration: item.duration ? formatDurationMinutes(item.duration) : "--",
    total: Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
  }));
}

function SummaryCard({ title, children, className = "" }) {
  return (
    <section className={`rounded-[24px] border border-[#f4d6e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)] ${className}`}>
      {title ? <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">{title}</p> : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

function PaymentStatusRow({ label, subtitle, dotClassName, isActive }) {
  return (
    <div className={`rounded-[16px] border px-4 py-3 ${isActive ? "border-[#f3cada] bg-[#fff4f8]" : "border-[#f4dfe8] bg-white"}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} />
        <p className="text-xs font-extrabold text-[#d54186]">{label}</p>
      </div>
      <p className="mt-1 text-[11px] text-[#b38a9f]">{subtitle}</p>
    </div>
  );
}

export function ReceptionistCheckoutPaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(location.state?.booking ?? null);
  const [customerProfile, setCustomerProfile] = useState(location.state?.customerProfile ?? null);
  const [salonProfile, setSalonProfile] = useState(null);
  const [paymentStage, setPaymentStage] = useState("awaiting");
  const [secondsRemaining, setSecondsRemaining] = useState(598);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCancellingPayment, setIsCancellingPayment] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      return undefined;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const bookingData = await fetchReceptionistBookingDetail(bookingId);
        if (!isMounted) {
          return;
        }

        setBooking(bookingData);

        const customerId = bookingData?.customerId;

        if (customerId) {
          try {
            const customerData = await fetchReceptionistCustomerDetail(customerId);
            if (isMounted) {
              setCustomerProfile(customerData);
            }
          } catch (customerError) {
            if (isMounted) {
              setCustomerProfile(null);
              toast.error(
                customerError instanceof Error
                  ? customerError.message
                  : "Failed to load customer detail.",
              );
            }
          }
        }

        try {
          const salonId = bookingData?.salonId || getReceptionistSalonId();
          const salonData = await fetchReceptionistSalonDetail(salonId);
          if (isMounted) {
            setSalonProfile(salonData);
          }
        } catch (salonError) {
          if (isMounted) {
            setSalonProfile(null);
            console.error("Failed to load salon detail:", salonError);
          }
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Failed to load checkout detail.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  useEffect(() => {
    if (paymentStage !== "awaiting" || secondsRemaining <= 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [paymentStage, secondsRemaining]);

  // Polling payment status
  useEffect(() => {
    if (paymentStage !== "awaiting" || !paymentInfo?.orderCode) {
      return undefined;
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await getPaymentStatus(paymentInfo.orderCode);
        const status = response?.data?.status || response?.status;
        if (status === "PAID") {
          setPaymentStage("paid");
          toast.success("Payment completed successfully.");
          
          try {
            await checkoutReceptionistBooking(bookingId);
            toast.success("Booking checked out successfully.");
          } catch (checkoutErr) {
            toast.error(checkoutErr instanceof Error ? checkoutErr.message : "Failed to check out booking automatically.");
          }
        } else if (status === "CANCELLED") {
          setPaymentStage("cancelled");
          toast.error("Payment was cancelled.");
        }
      } catch (err) {
        // Silently ignore errors during polling to avoid spamming the user
        console.error("Failed to fetch payment status", err);
      }
    }, 5000); // poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [paymentStage, paymentInfo?.orderCode]);

  const customerDisplayName = getCustomerDisplayName(customerProfile, booking);
  const customerInitials = getCustomerInitials(customerProfile, booking);
  const billItems = useMemo(() => getBillItems(booking), [booking]);
  const subtotalValue = billItems.reduce((sum, item) => sum + item.total, 0);
  const totalValue = Number(booking?.totalPrice || subtotalValue || 0);
  const discountValue = Math.max(0, subtotalValue - totalValue);
  const depositValue = 0;
  const remainingValue = Math.max(0, totalValue - depositValue);
  const qrImageSrc = useMemo(
    () => {
      if (paymentInfo?.qrCode) {
        if (paymentInfo.qrCode.startsWith("data:")) return paymentInfo.qrCode;
        if (paymentInfo.qrCode.startsWith("http")) return paymentInfo.qrCode;
        return `https://quickchart.io/qr?text=${encodeURIComponent(paymentInfo.qrCode)}&size=300`;
      }
      return booking?.qrCode ? `data:image/png;base64,${booking.qrCode}` : "";
    },
    [booking, paymentInfo],
  );
  const paymentReference = `VNPAY-${String(booking?.bookingId || bookingId || "PAY").slice(-6).toUpperCase()}`;
  const paymentBadge =
    paymentStage === "paid"
      ? "Paid"
      : paymentStage === "processing"
        ? "Processing"
        : paymentStage === "cancelled"
          ? "Cancelled"
          : "Awaiting Payment";
  const paymentBadgeClassName =
    paymentStage === "paid"
      ? "bg-[#e8f8ef] text-[#1f9d61]"
      : paymentStage === "processing"
        ? "bg-[#eef1ff] text-[#5374d8]"
        : paymentStage === "cancelled"
          ? "bg-[#ffe7ef] text-[#dc4d86]"
          : "bg-[#fff3cc] text-[#d99a11]";
  const completedTime = formatTimeWithMeridiem(booking?.startTime);
  const countdownLabel = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;

  const handleRefreshQr = async () => {
    try {
      setIsCreatingPayment(true);
      const res = await createPayment(bookingId);
      setPaymentInfo(res?.data || res);
      setSecondsRemaining(598);
      setPaymentStage("awaiting");
      toast.success("Payment session created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create payment link.");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      await checkoutReceptionistBooking(bookingId);
      setPaymentStage("paid");
      toast.success("Payment confirmed and booking checked out successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to checkout booking.");
    }
  };

  const handleCancelPayment = async () => {
    if (paymentInfo?.orderCode) {
      try {
        setIsCancellingPayment(true);
        await cancelPayment(paymentInfo.orderCode);
        setPaymentStage("cancelled");
        toast.success("Payment cancelled successfully.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to cancel payment link.");
      } finally {
        setIsCancellingPayment(false);
      }
    } else {
      setPaymentStage("cancelled");
      toast.success("Payment marked as cancelled in UI.");
    }
  };

  if (isLoading) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
        <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          Loading checkout payment...
        </div>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="rounded-[24px] border border-[#f6d8e5] bg-white p-6 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
        <p className="text-lg font-extrabold text-[#412643]">Checkout payment unavailable</p>
        <p className="mt-2 text-sm text-[#b38a9f]">{error || "This checkout could not be loaded."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={ROUTES.receptionistBookings}
            className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
          >
            Back to bookings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="rounded-[24px] border border-[#f6d8e5] bg-white px-5 py-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(getReceptionistBookingDetailRoute(booking.bookingId || bookingId))}
              className="inline-flex items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <ArrowLeft size={14} />
              Back to detail
            </button>
            <p className="mt-3 text-2xl font-black text-[#412643]">Checkout & Payment</p>
            <p className="mt-1 text-sm text-[#b38a9f]">Complete customer payment and print receipt.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-[#f3cade] bg-[#fff3f8] px-4 py-2 text-xs font-bold text-[#ea4f93]">
              #{String(booking.bookingId || bookingId).slice(-8).toUpperCase()}
            </span>
            <span className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-bold ${paymentBadgeClassName}`}>
              {paymentBadge}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.72fr)_300px]">
        <div className="space-y-4">
          <SummaryCard title="Customer & Booking Summary">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                {customerProfile?.avatarUrl ? (
                  <img crossOrigin="anonymous"
                    src={customerProfile.avatarUrl}
                    alt={customerDisplayName}
                    className="h-16 w-16 rounded-[20px] border-2 border-[#f4d6e2] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border-2 border-[#f4d6e2] bg-[linear-gradient(180deg,#ffd6e5_0%,#ef5b94_100%)] text-lg font-black text-white">
                    {customerInitials}
                  </div>
                )}

                <div>
                  <p className="text-xl font-black text-[#4a3741]">{customerDisplayName}</p>
                  <p className="mt-1 text-xs text-[#a48796]">{customerProfile?.phone || booking.customerName || "--"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#fff0c8] px-3 py-1 text-[10px] font-bold text-[#b18211]">
                      Gold Member
                    </span>
                    <span className="rounded-full bg-[#e8f8ef] px-3 py-1 text-[10px] font-bold text-[#1f9d61]">
                      Service Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Staff Artist</p>
                  <p className="mt-1 text-xs font-bold text-[#4a3741]">{booking.artistName || "--"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Chair</p>
                  <p className="mt-1 text-xs font-bold text-[#4a3741]">Chair 03</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Completed</p>
                  <p className="mt-1 text-xs font-bold text-[#4a3741]">{completedTime}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Booking ID</p>
                  <p className="mt-1 text-xs font-bold text-[#4a3741]">#{String(booking.bookingId || bookingId).slice(-8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </SummaryCard>

          <SummaryCard title="Bill Details">
            <div className="overflow-hidden rounded-[20px] border border-[#f5d7e4]">
              <div className="grid grid-cols-[minmax(0,1.4fr)_140px_140px] gap-4 border-b border-[#f5d7e4] bg-[#fff9fc] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c38ea8]">
                <span>Service</span>
                <span>Duration</span>
                <span className="text-right">Price</span>
              </div>

              <div className="divide-y divide-[#f8e6ee] bg-white">
                {billItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[minmax(0,1.4fr)_140px_140px] gap-4 px-4 py-4">
                    <div>
                      <p className="text-sm font-extrabold text-[#412643]">{item.name} </p>
                      <p className="mt-1 text-xs text-[#b38a9f]">{item.subtitle}</p>
                    </div>
                    <p className="text-sm text-[#8f7b88]">{item.duration}</p>
                    <p className="text-right text-sm font-extrabold text-[#412643]">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Subtotal", formatCurrency(subtotalValue)],
                ["Discount / Voucher", discountValue ? `-${formatCurrency(discountValue)}` : formatCurrency(0)],
                ["Deposit Paid", depositValue ? `-${formatCurrency(depositValue)}` : formatCurrency(0)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-[#8f7b88]">{label}</span>
                  <span className={`font-bold ${label === "Discount / Voucher" && discountValue ? "text-[#df4e86]" : "text-[#4a3741]"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[16px] border border-[#f3cade] bg-[linear-gradient(90deg,#fff2f7_0%,#ffeaf2_100%)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-[#d54186]">Remaining Amount</span>
                <span className="text-2xl font-black text-[#d54186]">{formatCurrency(remainingValue)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#f5d7e4] pt-4">
              <span className="text-lg font-extrabold text-[#412643]">Total Amount</span>
              <span className="text-2xl font-black text-[#412643]">{formatCurrency(totalValue)}</span>
            </div>
          </SummaryCard>

          <SummaryCard title="VNPay QR Payment">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="rounded-[20px] border border-[#f5d7e4] bg-[#fffafb] px-5 py-5 lg:w-[280px]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold text-[#d54186]">Scan VNPay QR to Pay</p>
                  <span className="rounded-full bg-[#1888f3] px-3 py-1 text-[10px] font-bold text-white">VNPay</span>
                </div>

                <div className="mt-5 flex flex-col items-center">
                  {qrImageSrc ? (
                    <img crossOrigin="anonymous"
                      src={qrImageSrc}
                      alt={`Payment QR for booking ${booking.bookingId || bookingId}`}
                      className="h-40 w-40 rounded-[20px] border-[3px] border-[#f3cade] bg-white p-2 object-contain"
                    />
                  ) : (
                    <div className="flex h-40 w-40 flex-col gap-2 items-center justify-center rounded-[20px] border-[3px] border-[#f3cade] bg-white text-center text-xs text-[#b38a9f]">
                      <span>QR code not available</span>
                      <button
                        type="button"
                        onClick={handleRefreshQr}
                        disabled={isCreatingPayment}
                        className="inline-flex items-center gap-1 rounded-full bg-[#ea4f93] px-3 py-1.5 font-bold text-white transition-colors hover:bg-[#d14c84] disabled:opacity-50"
                      >
                        {isCreatingPayment ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                        Generate
                      </button>
                    </div>
                  )}

                  <p className="mt-4 text-4xl font-black text-[#cf2e7a]">{formatCurrency(remainingValue)}</p>
                  <p className="mt-1 text-xs text-[#a48796]">Ref: {paymentReference}</p>
                  
                  {paymentInfo?.paymentUrl && (
                    <a
                      href={paymentInfo.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 text-xs font-bold text-[#1888f3] hover:underline"
                    >
                      Open Payment Gateway
                    </a>
                  )}

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff1f6] px-3 py-1.5 text-xs font-bold text-[#cf2e7a]">
                    <Clock3 size={13} />
                    {countdownLabel}
                  </div>
                  <p className="mt-4 text-center text-xs leading-5 text-[#b38a9f]">
                    Ask the customer to scan this QR code using banking app or VNPay wallet.
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold text-[#a48796]">Payment Status</p>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${paymentBadgeClassName}`}>
                    {paymentBadge}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <PaymentStatusRow
                    label="Awaiting Payment"
                    subtitle="QR code displayed"
                    dotClassName="bg-[#f0b429]"
                    isActive={paymentStage === "awaiting"}
                  />
                  <PaymentStatusRow
                    label="Processing"
                    subtitle="Payment in progress"
                    dotClassName="bg-[#4f8ef7]"
                    isActive={paymentStage === "processing"}
                  />
                  <PaymentStatusRow
                    label="Paid"
                    subtitle="Transaction complete"
                    dotClassName="bg-[#35b56b]"
                    isActive={paymentStage === "paid"}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleRefreshQr}
                    disabled={isCreatingPayment}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#f3d7e2] bg-white px-4 py-3 text-sm font-extrabold text-[#d14c84] disabled:opacity-50"
                  >
                    {isCreatingPayment ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                    {paymentInfo ? "Regenerate Link" : "Generate Payment Link"}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#cf3d82_0%,#ef5b92_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(235,91,146,0.22)]"
                  >
                    <Check size={14} />
                    Confirm Payment Manually
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPayment}
                    disabled={isCancellingPayment}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#f3d7e2] bg-white px-4 py-3 text-sm font-extrabold text-[#d14c84] disabled:opacity-50"
                  >
                    {isCancellingPayment ? <LoaderCircle size={14} className="animate-spin" /> : <X size={14} />}
                    Cancel Payment
                  </button>
                </div>
              </div>
            </div>
          </SummaryCard>

          <SummaryCard title="Payment Confirmation">
            <div className={`rounded-[18px] border px-4 py-4 ${paymentStage === "paid" ? "border-[#cfe9d8] bg-[linear-gradient(90deg,#eef9f1_0%,#f4fff6_100%)]" : "border-[#f3d7e2] bg-[#fffafb]"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${paymentStage === "paid" ? "bg-[#5fc57d] text-white" : "bg-[#fff1f6] text-[#d54186]"}`}>
                    {paymentStage === "paid" ? <BadgeCheck size={20} /> : <CircleDollarSign size={20} />}
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-[#412643]">
                      {paymentStage === "paid" ? "Payment Successful" : "Waiting for Payment Confirmation"}
                    </p>
                    <p className="mt-1 text-xs text-[#8f7b88]">
                      {paymentStage === "paid"
                        ? "Transaction verified via receptionist confirmation."
                        : "No payment API yet, this screen stays UI-only for now."}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paymentBadgeClassName}`}>
                  {paymentBadge}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Paid Amount", formatCurrency(remainingValue)],
                ["Payment Method", "VNPay QR"],
                ["Transaction ID", `VNPAY${String(booking.bookingId || bookingId).replace(/-/g, "").slice(0, 10).toUpperCase()}`],
                ["Paid Time", paymentStage === "paid" ? completedTime : "--"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[16px] border border-[#f3d7e2] bg-[#fffafb] px-4 py-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">{label}</p>
                  <p className="mt-2 text-sm font-extrabold text-[#412643]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => toast.success("Print bill is ready in UI.")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#cf3d82_0%,#ef5b92_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(235,91,146,0.22)]"
              >
                <Printer size={14} />
                Print Bill
              </button>
              <button
                type="button"
                onClick={() => toast.success("Receipt send flow is ready for payment API integration.")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f3d7e2] bg-white px-4 py-3 text-sm font-extrabold text-[#d54186]"
              >
                <Mail size={14} />
                Send Receipt to Customer
              </button>
              <Link
                to={ROUTES.receptionistBookings}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold ${
                  paymentStage === "paid"
                    ? "border-[#dcebdc] bg-[#eef9f1] text-[#1f9d61]"
                    : "border-[#f3d7e2] bg-[#fffafb] text-[#8f7b88]"
                }`}
              >
                <ShieldCheck size={14} />
                Finish Checkout
              </Link>
            </div>
          </SummaryCard>

          <SummaryCard title="Receipt Preview">
            <div className="rounded-[20px] border border-[#f3d7e2] bg-white px-5 py-5">
              <div className="text-center">
                <p className="text-lg font-black text-[#cf2e7a]">{salonProfile?.name || booking.salonName || "Nailify Salon"}</p>
                <p className="mt-1 text-xs text-[#b38a9f]">{salonProfile?.address || "Salon address not available"}</p>
                <p className="mt-1 text-xs text-[#b38a9f]">{salonProfile?.phone || "--"} | nailify.vn</p>
              </div>

              <div className="mt-5 space-y-2 border-y border-[#f3d7e2] py-4 text-sm">
                {[
                  ["Booking ID", `#${String(booking.bookingId || bookingId).slice(-8).toUpperCase()}`],
                  ["Customer", customerDisplayName],
                  ["Staff Artist", booking.artistName || "--"],
                  ["Date", formatDate(booking.bookingDate)],
                  ["Time", completedTime],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className="text-[#b38a9f]">{label}</span>
                    <span className="font-medium text-[#412643]">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {billItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#412643]">{item.name}</p>
                      <p className="text-xs text-[#b38a9f]">{item.subtitle}</p>
                    </div>
                    <span className="font-medium text-[#412643]">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-[#f3d7e2] pt-4 text-sm">
                {[
                  ["Subtotal", formatCurrency(subtotalValue)],
                  ["Discount", discountValue ? `-${formatCurrency(discountValue)}` : formatCurrency(0)],
                  ["Deposit Paid", depositValue ? `-${formatCurrency(depositValue)}` : formatCurrency(0)],
                  ["Total Amount", formatCurrency(totalValue)],
                  ["Amount Paid", paymentStage === "paid" ? formatCurrency(remainingValue) : formatCurrency(0)],
                  ["Payment Method", "VNPay QR"],
                  ["Transaction ID", `VNPAY${String(booking.bookingId || bookingId).replace(/-/g, "").slice(0, 10).toUpperCase()}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className={label === "Amount Paid" ? "font-bold text-[#d54186]" : "text-[#8f7b88]"}>{label}</span>
                    <span className={label === "Total Amount" ? "font-extrabold text-[#412643]" : "font-medium text-[#412643]"}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-[#f3d7e2] pt-4 text-center">
                <p className="text-sm font-extrabold text-[#cf2e7a]">Thank you for choosing Nailify!</p>
                <p className="mt-1 text-xs text-[#b38a9f]">Please come back soon. We love you!</p>
              </div>
            </div>
          </SummaryCard>
        </div>

        <aside className="space-y-4">
          <SummaryCard title="">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1f6] text-[#d54186]">
                <Receipt size={18} />
              </div>
              <div>
                <p className="text-base font-extrabold text-[#412643]">Checkout Status</p>
                <p className="mt-1 text-xs text-[#b38a9f]">Booking is completed, waiting for payment confirmation.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {[
                ["Booking", "Completed", "bg-[#e8f8ef] text-[#1f9d61]"],
                ["Payment", paymentBadge, paymentBadgeClassName],
                ["Receipt", paymentStage === "paid" ? "Ready" : "Not Printed", paymentStage === "paid" ? "bg-[#e8f8ef] text-[#1f9d61]" : "bg-[#fff1f6] text-[#d54186]"],
                ["Staff Artist", booking.artistName || "--", ""],
              ].map(([label, value, className]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-[#8f7b88]">{label}</span>
                  <span className={className ? `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${className}` : "font-bold text-[#412643]"}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </SummaryCard>

          <SummaryCard title="Customer Loyalty">
            <div className="rounded-[18px] bg-[linear-gradient(180deg,#fff8e5_0%,#fff3c7_100%)] px-4 py-4 text-center">
              <p className="text-xs font-bold text-[#b18211]">Gold Member</p>
              <p className="mt-3 text-3xl font-black text-[#d54186]">+63 pts</p>
              <p className="mt-1 text-xs text-[#8f7b88]">Earned from this visit</p>
            </div>
            <div className="mt-3 rounded-[16px] border border-[#f3d7e2] bg-[#fffafb] px-4 py-3 text-center text-xs text-[#8f7b88]">
              Available voucher: 50,000 off next visit
            </div>
          </SummaryCard>

          <SummaryCard title="Next Actions">
            <div className="space-y-3">
              {[
                ["Print Bill", Printer],
                ["Request Review", Sparkles],
                ["Book Next Appointment", Clock3],
                ["View Customer History", Phone],
              ].map(([label, Icon]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toast.success(`${label} is ready in UI.`)}
                  className="inline-flex w-full items-center gap-2 rounded-xl border border-[#f3d7e2] bg-[#fffafb] px-4 py-3 text-sm font-extrabold text-[#d54186]"
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </SummaryCard>

          <SummaryCard title="Support Notes">
            <div className="rounded-[18px] border border-[#f3d7e2] bg-[#fffafb] px-4 py-4 text-xs leading-6 text-[#8f7b88]">
              <p>
                <span className="font-extrabold text-[#d54186]">QR Payment Failed?</span>
                {" "}Refresh the QR code or use manual payment confirmation until payment API is available.
              </p>
              <p className="mt-3">
                <span className="font-extrabold text-[#d54186]">Receipt:</span>
                {" "}Keep the receipt printable. Send a digital copy by SMS or email if requested.
              </p>
            </div>
          </SummaryCard>
        </aside>
      </div>
    </section>
  );
}

