import { useEffect } from "react";
import { CheckCircle2, XCircle, Mail, ArrowLeft, BadgeCheck } from "lucide-react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { checkoutReceptionistBooking } from "../../bookings/services/receptionistBookingService";

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isCancel = searchParams.get("cancel") === "true";
  const status = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");
  const isSuccess = !isCancel && (status === "PAID" || status === "SUCCESS");

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
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={`flex min-h-screen items-center justify-center 
      ${isSuccess ? "bg-[#dcfce7]" : "bg-[#fee2e2]"
      } p-4 font-sans`}>
      <div className="w-full max-w-md overflow-hidden rounded-[20px] bg-white border border-gray-100 p-8 text-center relative">

        {/* Back Button (Absolute Top Left) */}
        <button
          onClick={() => navigate(ROUTES.receptionistBookings)}
          className="absolute left-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-col items-center justify-center mt-2">
          {/* Status Icon */}
          <div className={`mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full ${isSuccess ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#ef4444]"
            }`}>
            {isSuccess ? <CheckCircle2 size={36} strokeWidth={2.5} /> : <XCircle size={36} strokeWidth={2.5} />}
          </div>

          <h1 className={`text-[22px] font-bold mb-2 ${isSuccess ? "text-[#16a34a]" : "text-[#ef4444]"}`}>
            {isSuccess ? "Payment Successful!" : "Payment Failed!"}
          </h1>

          <p className="text-[14px] leading-relaxed text-[#6b7280] mb-8 max-w-[320px]">
            {isSuccess
              ? "Your payment has been processed successfully. You will receive a confirmation email shortly."
              : "We couldn't process your payment. Please try again or contact support for assistance."}
          </p>

          {/* Receipt Details Card */}
          <div className="w-full rounded-[16px] bg-[#f9fafb] p-5 mb-6 text-left">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6b7280]">Amount</span>
                <span className="text-[15px] font-bold text-[#111827]">$149.99</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6b7280]">Order Code</span>
                <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold tracking-wider text-[#111827]">
                  {orderCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6b7280]">Payment Method</span>
                <span className="text-[14px] font-bold text-[#111827]">PayOS (QR)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6b7280]">Date</span>
                <span className="text-[14px] font-bold text-[#111827]">{currentDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6b7280]">Merchant</span>
                <span className="text-[14px] font-bold text-[#111827]">Nailify Salon</span>
              </div>
            </div>
          </div>

          {/* Email Pill */}
          {isSuccess && (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#eff6ff] px-4 py-3.5 text-[13px] font-medium text-[#64748b]">
              <Mail size={16} className="text-[#94a3b8]" />
              Receipt sent to customer@example.com
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
