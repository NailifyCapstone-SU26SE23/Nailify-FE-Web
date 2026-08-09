import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ROUTES, getReceptionistBookingDetailRoute } from "../../../../shared/constants/routes";
import { checkoutReceptionistBooking } from "../../bookings/services/receptionistBookingService";
import { getBookingIdByOrderCode } from "../services/receptionistPaymentService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

export default function PaymentStatusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isCancel = searchParams.get("cancel") === "true";
  const status = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");
  const isSuccess = !isCancel && (status === "PAID");

  useEffect(() => {
    const nextParams = orderCode ? `?orderCode=${encodeURIComponent(orderCode)}` : "";
    const nextPath = isSuccess ? ROUTES.paymentSuccess : ROUTES.paymentCancel;

    navigate(`${nextPath}${nextParams}`, { replace: true });
  }, [isSuccess, navigate, orderCode]);

  return <PaymentResultPage isSuccess={isSuccess} orderCode={orderCode} />;
}

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    const bookingId = localStorage.getItem("pendingPaymentBookingId");
    if (bookingId) {
      checkoutReceptionistBooking(bookingId)
        .then(() => {
          console.log("Successfully checked out booking:", bookingId);
          localStorage.removeItem("pendingPaymentBookingId");
        })
        .catch((err) => {
          console.error("Failed to automatically checkout booking after payment:", err);
        });
    }
  }, []);

  return <PaymentResultPage isSuccess orderCode={orderCode} />;
}

export function PaymentCancelPage() {
  const [searchParams] = useSearchParams();

  return <PaymentResultPage isSuccess={false} orderCode={searchParams.get("orderCode")} />;
}

function PaymentResultPage({ isSuccess, orderCode }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState("");
  const [isBookingIdLoading, setIsBookingIdLoading] = useState(false);
  const [bookingIdError, setBookingIdError] = useState("");
  const currentDate = language === "vi" 
    ? new Date().toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    if (!orderCode) {
      return;
    }

    let isMounted = true;
    setIsBookingIdLoading(true);
    setBookingIdError("");

    getBookingIdByOrderCode(orderCode)
      .then((data) => {
        if (!isMounted) return;

        setBookingId(data?.bookingId || "");
      })
      .catch((err) => {
        if (!isMounted) return;

        setBookingIdError(err instanceof Error ? err.message : (language === "vi" ? "Không thể tải liên kết chi tiết đặt lịch." : "Failed to fetch booking detail link."));
      })
      .finally(() => {
        if (!isMounted) return;

        setIsBookingIdLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderCode, language]);

  return (
    <div className={`flex min-h-screen items-center justify-center 
      ${isSuccess ? "bg-[#dcfce7]" : "bg-[#fee2e2]"
      } p-4 font-sans`}>
      <div className="w-full max-w-md overflow-hidden rounded-[20px] bg-white border border-gray-100 p-8 text-center relative">
        <div className="flex flex-col items-center justify-center mt-2">
          {/* Status Icon */}
          <div className={`mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full ${isSuccess ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#ef4444]"
            }`}>
            {isSuccess ? <CheckCircle2 size={36} strokeWidth={2.5} /> : <XCircle size={36} strokeWidth={2.5} />}
          </div>

          <h1 className={`text-[30px] font-bold mb-2 ${isSuccess ? "text-[#16a34a]" : "text-[#ef4444]"}`}>
            {isSuccess ? (language === "vi" ? "Thanh toán thành công!" : "Payment Successful!") : (language === "vi" ? "Đã hủy thanh toán!" : "Payment Cancelled!")}
          </h1>

          <p className="text-[16px] leading-relaxed text-[#6b7280] mb-8 max-w-[320px]">
            {isSuccess
              ? (language === "vi" ? "Thanh toán của bạn đã được xử lý thành công." : "Your payment has been processed successfully.")
              : (language === "vi" ? "Bạn đã hủy thanh toán lịch hẹn này." : "You have cancelled the payment.")}
          </p>
          
          {isSuccess && (
          <div className="w-full rounded-[16px] bg-[#f9fafb] p-5 mb-6 text-left">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6b7280]">{language === "vi" ? "Mã đơn hàng" : "Order Code"}</span>
                <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[14px] font-bold tracking-wider text-[#111827]">
                  {orderCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6b7280]">{t("receptionist.payments.payMethod") || "Payment Method"}</span>
                <span className="text-[14px] font-bold text-[#111827]">VietQR (QR)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6b7280]">{language === "vi" ? "Ngày" : "Date"}</span>
                <span className="text-[14px] font-bold text-[#111827]">{currentDate}</span>
              </div>
            </div>
          </div>
          )}

          {bookingIdError && (
            <p className="mb-4 text-sm font-medium text-[#ef4444]">{bookingIdError}</p>
          )}

          <div className="flex w-full flex-col gap-3">
            {bookingId && (
              <button
                type="button"
                onClick={() => navigate(getReceptionistBookingDetailRoute(bookingId))}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1f2937]"
              >
                <CalendarDays size={17} />
                {language === "vi" ? "Quay lại chi tiết lịch hẹn" : "Return to Booking Detail"}
              </button>
            )}

            {!bookingId && isBookingIdLoading && (
              <button
                type="button"
                disabled
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#e5e7eb] px-5 py-3.5 text-sm font-extrabold text-[#6b7280]"
              >
                <LoaderCircle size={17} className="animate-spin" />
                {language === "vi" ? "Đang tải chi tiết đặt lịch..." : "Loading Booking Detail"}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(ROUTES.root)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-extrabold text-[#374151] transition hover:bg-[#f9fafb]"
            >
              <ArrowLeft size={17} />
              {language === "vi" ? "Quay lại Trang chủ" : "Back to Home"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
