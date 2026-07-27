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
  QrCode, Wallet
} from "lucide-react";
import { Table, Radio } from "antd";
import { useEffect, useMemo, useState, useCallback } from "react";
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
    name: item.nailVariantName || item.customerNailName || item.serviceName,
    duration: item.duration ? formatDurationMinutes(item.duration) : "--",
    total: Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
    quantity: Math.max(1, Number(item.quantity || 1)),
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
  const [paymentMethod, setPaymentMethod] = useState("payos");

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
            localStorage.removeItem("pendingPaymentBookingId");
            toast.success("Booking checked out successfully.");
            navigate(`${ROUTES.paymentSuccess}?orderCode=${paymentInfo.orderCode}`);
          } catch (checkoutErr) {
            toast.error(checkoutErr instanceof Error ? checkoutErr.message : "Failed to check out booking automatically.");
          }
        } else if (status === "CANCELLED") {
          setPaymentStage("cancelled");
          toast.error("Payment was cancelled.");
          navigate(`${ROUTES.paymentCancel}?orderCode=${paymentInfo.orderCode}`);
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

  const handleCheckout = useCallback(async () => {
    if (!bookingId) {
      return;
    }

    setIsCreatingPayment(true);
    try {
      const response = await createPayment(bookingId);
      const paymentUrl = response?.data?.paymentUrl || response?.paymentUrl || response?.data?.checkoutUrl || response?.checkoutUrl;

      if (paymentUrl) {
        localStorage.setItem("pendingPaymentBookingId", bookingId);
        window.location.href = paymentUrl;
      } else {
        toast.error("Payment link not found.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred while creating payment.");
    } finally {
      setIsCreatingPayment(false);
    }
  }, [bookingId]);

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
            <p className="mt-3 text-2xl font-bold text-[#412643]">Checkout & Payment</p>
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border-2 border-[#f4d6e2] bg-[linear-gradient(180deg,#ffd6e5_0%,#ef5b94_100%)] text-lg font-bold text-white">
                    {customerInitials}
                  </div>
                )}

                <div>
                  <p className="text-xl font-bold text-[#4a3741]">{customerDisplayName}</p>
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

              </div>
            </div>
          </SummaryCard>

          <SummaryCard title="Bill Details">
            <div className="overflow-hidden rounded-[20px] border border-[#f5d7e4]">
              <Table
                dataSource={billItems}
                pagination={false}
                rowKey="id"
                columns={[
                  {
                    title: <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c38ea8]">Service</span>,
                    key: 'service',
                    render: (_, record) => (
                      <div>
                        <p className="text-sm font-extrabold text-[#412643]">{record.name} </p>
                      </div>
                    ),
                  },
                  {
                    title: <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c38ea8]">Duration</span>,
                    dataIndex: 'duration',
                    key: 'duration',
                    render: (text) => <span className="text-sm text-[#8f7b88]">{text}</span>,
                  },
                  {
                    title: <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c38ea8]">Qty</span>,
                    dataIndex: 'quantity',
                    key: 'quantity',
                    render: (text) => <span className="text-sm font-bold text-[#8f7b88]">x{text}</span>,
                  },
                  {
                    title: <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c38ea8]">Price</span>,
                    key: 'price',
                    align: 'right',
                    render: (_, record) => (
                      <span className="text-sm font-semibold text-green-700">{formatCurrency(record.total)}</span>
                    ),
                  },
                ]}
                className="custom-bill-table"
              />
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
                <span className="text-2xl font-bold text-[#d54186]">{formatCurrency(remainingValue)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#f5d7e4] pt-4">
              <span className="text-lg font-extrabold text-[#412643]">Total Amount</span>
              <span className="text-2xl font-bold text-green-700">{formatCurrency(totalValue)}</span>
            </div>
          </SummaryCard>

          <SummaryCard title="Payment Method">
            <div className="mb-4 w-fit">
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mx-auto grid w-fit grid-cols-2 gap-8"
                style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
              >
                <Radio.Button
                  value="payos"
                  className="
                            group !h-24 !rounded-2xl !border-2 !border-[#f3d7e2]
                            !bg-white transition-all duration-200
                            hover:-translate-y-1 hover:shadow-lg
                            data-[checked=true]:!border-[#ea4f93]
                            data-[checked=true]:!bg-[#fff3f8]
                            data-[checked=true]:shadow-[0_8px_24px_rgba(234,79,147,0.18)]
                          "
                >
                  <div className="flex h-full items-center gap-3">
                    <div
                      className="
                                flex h-12 w-12 items-center justify-center rounded-xl
                                bg-[#fff0f6] text-[#ea4f93]
                                transition-colors
                                group-data-[checked=true]:bg-[#ea4f93]
                                group-data-[checked=true]:text-white
                              "
                    >
                      <QrCode size={24} strokeWidth={2.2} />
                    </div>

                    <div className="text-left">
                      <p className="font-bold text-[#412643]">
                        PayOS
                      </p>
                      <p className="text-xs text-[#8d6a7b]">
                        Scan QR to pay
                      </p>
                    </div>
                  </div>
                </Radio.Button>

                <Radio.Button
                  value="cod"
                  className="
                            group !h-24 !rounded-2xl !border-2 !border-[#f3d7e2]
                            !bg-white transition-all duration-200
                            hover:-translate-y-1 hover:shadow-lg
                            data-[checked=true]:!border-[#ea4f93]
                            data-[checked=true]:!bg-[#fff3f8]
                            data-[checked=true]:shadow-[0_8px_24px_rgba(234,79,147,0.18)]
                          "
                >
                  <div className="flex h-full items-center gap-3">
                    <div
                      className="
                                flex h-12 w-12 items-center justify-center rounded-xl
                                bg-[#fff0f6] text-[#ea4f93]
                                transition-colors
                                group-data-[checked=true]:bg-[#ea4f93]
                                group-data-[checked=true]:text-white
                              "
                    >
                      <Wallet size={24} strokeWidth={2.2} />
                    </div>

                    <div className="text-left">
                      <p className="font-bold text-[#412643]">
                        Cash
                      </p>
                      <p className="text-xs text-[#8d6a7b]">
                        Pay at salon
                      </p>
                    </div>
                  </div>
                </Radio.Button>
              </Radio.Group>
            </div>

            {paymentMethod === 'cod' && (
              <div className="flex flex-col items-center justify-center p-6 border border-[#f3cade] rounded-[20px] bg-[#fffafb] mt-4">
                <CircleDollarSign size={48} className="text-[#ea4f93] mb-4" />
                <p className="text-lg font-bold text-[#412643]">Pay with Cash</p>
                <p className="text-sm text-[#b38a9f] text-center mb-6 max-w-sm">
                  Please collect {formatCurrency(totalValue)} from the customer before completing the checkout.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await checkoutReceptionistBooking(bookingId);
                      toast.success("Booking checked out successfully.");
                      navigate(`${ROUTES.paymentSuccess}?orderCode=COD-${bookingId}`);
                    } catch (checkoutErr) {
                      toast.error(checkoutErr instanceof Error ? checkoutErr.message : "Failed to check out booking.");
                    }
                  }}
                  className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#cf3d82_0%,#ef5b92_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(235,91,146,0.22)]"
                >
                  <Check size={18} />
                  Complete Checkout
                </button>
              </div>
            )}


            {/* Mock buttons for testing PaymentStatusPage (kept visible as requested) */}
            {paymentMethod === 'payos' && (
              <div className="flex flex-col gap-4 mt-4">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCreatingPayment}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1888f3] px-2 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(24,136,243,0.22)] disabled:opacity-50"
                >
                  {isCreatingPayment ? <LoaderCircle size={14} className="animate-spin" /> : null}
                  Checkout with PayOS
                </button>

              </div>
            )}
          </SummaryCard>

          <SummaryCard title="Receipt Preview">
            <div className="bg-[#faf8f5] border border-[#e6decb] p-5 rounded-[1.75rem] shadow-[0_8px_24px_rgba(97,76,60,0.03)] relative overflow-hidden text-[#4a3f35] border-t-4 border-t-[#ea4f93]">
              {/* Dashed edge header */}
              <div className="text-center pb-3.5 border-b border-dashed border-[#e6decb] space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#a88a9f]">Nailify Receipt</h3>
                <div className="font-mono text-[9px] text-[#a88a9f]">
                  {formatDate(booking.bookingDate)} {completedTime ? `, ${completedTime}` : ""}
                </div>
              </div>

              {/* Customer & Salon Details inside Receipt */}
              <div className="py-3.5 space-y-2 border-b border-dashed border-[#e6decb] text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-[#a88a9f] shrink-0">Customer</span>
                  <span className="font-bold text-[#2d1b35] text-right truncate">{customerDisplayName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[#a88a9f] shrink-0">Salon</span>
                  <span className="font-bold text-[#ea4f93] text-right truncate">{salonProfile?.name || booking.salonName || "Nailify Salon"}</span>
                </div>
                <div className="flex justify-between gap-3 border-t border-dashed border-[#e6decb]/40 pt-2 mt-1.5">
                  <span className="text-[#a88a9f] shrink-0">Loại thanh toán</span>
                  <span className="font-bold text-[#2d1b35] text-right">
                    {paymentStage === "paid" ? "Thanh toán còn lại" : "Thanh toán 100%"}
                  </span>
                </div>
              </div>

              {/* Billing Breakdown inside Receipt */}
              <div className="py-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#a88a9f]">Subtotal</span>
                  <span className="font-mono font-semibold text-[#2d1b35]">{formatCurrency(subtotalValue)}</span>
                </div>

                {discountValue > 0 && (
                  <div className="flex justify-between pl-2.5 text-[11px]">
                    <span className="text-[#a88a9f] italic">↳ Discount</span>
                    <span className="font-mono text-emerald-600 font-medium">
                      -{formatCurrency(discountValue)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-dashed border-[#e6decb] pt-2">
                  <span className="text-[#a88a9f] font-bold">Total Price</span>
                  <span className="font-mono font-bold text-[#2d1b35]">{formatCurrency(totalValue)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#a88a9f]">Deposit paid</span>
                  <span className="font-mono text-[#ea4f93] font-bold">{formatCurrency(depositValue)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#a88a9f]">Remaining balance</span>
                  <span className="font-mono text-[#2d1b35] font-semibold">{formatCurrency(remainingValue)}</span>
                </div>
              </div>

              {/* Barcode footer */}
              <div className="border-t border-dashed border-[#e6decb] pt-3.5 text-center space-y-1.5">
                <div className="flex justify-center items-center gap-[2px] opacity-25 h-6 select-none">
                  {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6].map((w, i) => (
                    <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-[#a88a9f] font-mono">
                  Nailify Inc — Thank You
                </div>
              </div>
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
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold ${paymentStage === "paid"
                  ? "border-[#dcebdc] bg-[#eef9f1] text-[#1f9d61]"
                  : "border-[#f3d7e2] bg-[#fffafb] text-[#8f7b88]"
                  }`}
              >
                <ShieldCheck size={14} />
                Finish Checkout
              </Link>
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
              <p className="mt-3 text-3xl font-bold text-[#d54186]">+63 pts</p>
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
    </section >
  );
}

