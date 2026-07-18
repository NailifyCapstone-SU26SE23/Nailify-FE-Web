import { BadgeCheck, XCircle, ArrowLeft } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // PayOS usually returns cancel=true if the user cancelled
  const isCancel = searchParams.get("cancel") === "true";
  // PayOS returns status=PAID if successful
  const status = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");

  const isSuccess = !isCancel && (status === "PAID" || status === "SUCCESS");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff9fc] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-[#f3cade] bg-white shadow-[0_14px_32px_rgba(236,72,153,0.06)] text-center p-8">
        <div className="flex flex-col items-center justify-center">
          {isSuccess ? (
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#e8f8ef] text-[#1f9d61]">
              <BadgeCheck size={48} />
            </div>
          ) : (
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#ffe7ef] text-[#dc4d86]">
              <XCircle size={48} />
            </div>
          )}

          <h1 className="text-2xl font-black text-[#412643] mb-2">
            {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
          </h1>
          
          <p className="text-sm text-[#8f7b88] mb-6">
            {isSuccess
              ? "Cảm ơn bạn! Giao dịch của bạn đã được ghi nhận thành công."
              : "Rất tiếc, giao dịch của bạn đã bị hủy hoặc có lỗi xảy ra. Vui lòng thử lại sau."}
          </p>

          {orderCode && (
            <div className="mb-8 rounded-xl bg-[#fffafb] border border-[#f3d7e2] w-full p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#c38ea8] mb-1">
                Mã đơn hàng
              </p>
              <p className="text-lg font-black text-[#cf2e7a]">
                #{orderCode}
              </p>
            </div>
          )}

          <button
            onClick={() => navigate(ROUTES.root)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#cf3d82_0%,#ef5b92_100%)] px-6 py-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(235,91,146,0.22)]"
          >
            <ArrowLeft size={16} />
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
