import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, ShieldCheck, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { authService } from "../services/authService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ROUTES } from "../../../../shared/constants/routes";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is mandatory." })
    .email({ message: "Must match standard email format." }),
});

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await authService.forgotPassword(values.email);

      if (response?.isSucceeded) {
        setIsSuccess(true);
        toast.success(
          language === "vi"
            ? "Yêu cầu khôi phục mật khẩu đã được gửi thành công!"
            : "Password reset instructions sent successfully!"
        );
      } else {
        setError(response?.message || (language === "vi" ? "Yêu cầu thất bại." : "Request failed."));
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err.message ||
        (language === "vi" ? "Đã có lỗi xảy ra. Vui lòng thử lại sau." : "An error occurred. Please try again later.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const DECORATIVE_DOTS = Array.from({ length: 12 }, (_, index) => `dot-${index + 1}`);

  return (
    <main className="h-dvh overflow-hidden bg-[linear-gradient(180deg,#f7d9e8_0%,#f9efcf_100%)] px-4 py-4 text-[var(--color-ink)] md:px-6 md:py-6">
      <div className="mx-auto grid h-full max-h-full w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white/40 shadow-[0_32px_90px_rgba(170,108,96,0.18)] backdrop-blur md:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#ef5db4_0%,#f59b6c_58%,#ffd95a_100%)] px-8 py-8 text-white md:px-10 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.18),transparent_22%),radial-gradient(circle_at_76%_70%,rgba(255,255,255,0.14),transparent_26%),linear-gradient(145deg,transparent_0%,rgba(160,60,126,0.16)_48%,rgba(255,255,255,0.08)_100%)]" />
          <div className="absolute -left-12 top-6 h-44 w-44 rounded-[40px] border border-white/30" />
          <div className="absolute left-8 top-32 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-[-2.5rem] h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute right-12 top-16 grid grid-cols-3 gap-2 opacity-85">
            {DECORATIVE_DOTS.map((dotId) => (
              <span key={dotId} className="h-1.5 w-1.5 rounded-full bg-white" />
            ))}
          </div>
          <div className="absolute left-[31%] top-12 text-5xl font-light opacity-75">+</div>
          <div className="absolute bottom-36 left-[46%] text-5xl font-light opacity-75">+</div>

          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
              <ShieldCheck size={16} />
              Nailify Operations
            </div>

            <div className="max-w-md space-y-4 py-4 md:py-10">
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl xl:text-6xl">
                {language === "vi" ? "Khôi phục mật khẩu" : "Reset Password"}
              </h1>
              <p className="text-base leading-7 text-white/90 md:text-lg md:leading-8">
                {language === "vi"
                  ? "Đừng lo lắng! Hãy cung cấp địa chỉ email tài khoản của bạn, chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu ngay lập tức."
                  : "Don't worry! Enter your registered email address and we'll send you instructions to reset your password immediately."}
              </p>
            </div>
            <div className="rounded-[28px] h-full p-5" />
          </div>
        </section>

        <section className="bg-[rgba(255,252,248,0.96)] px-8 py-7 md:px-10 md:py-8">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center">

            {isSuccess ? (
              <div className="text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-sm">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[var(--color-ink)]">
                    {language === "vi" ? "Kiểm tra Email của bạn" : "Check Your Email"}
                  </h2>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    {language === "vi"
                      ? "Chúng tôi đã gửi một liên kết khôi phục mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác)."
                      : "We've sent a password reset link to your email. Please check your inbox (including spam folder)."}
                  </p>
                </div>
                <div className="pt-4">
                  <Link
                    to={ROUTES.login}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ef5db4] to-[#f59b6c] px-4 py-3 font-semibold text-white shadow-md hover:opacity-90"
                  >
                    <ArrowLeft size={16} />
                    {language === "vi" ? "Quay lại Đăng nhập" : "Back to Login"}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d85a9b]">
                    {language === "vi" ? "Quên mật khẩu" : "Forgot Password"}
                  </p>
                  <h2 className="text-3xl font-semibold text-[var(--color-ink)] md:text-4xl">
                    {language === "vi" ? "Yêu cầu khôi phục" : "Request Reset"}
                  </h2>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      {language === "vi" ? "Địa chỉ Email đăng ký" : "Registered Email"}
                    </span>
                    <div className="flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ef6bb4]">
                      <Mail size={18} className="mr-3 text-[#d38f6b]" />
                      <input
                        {...register("email")}
                        type="email"
                        className="w-full bg-transparent py-3 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298]"
                        placeholder={language === "vi" ? "Nhập email của bạn" : "Enter your email"}
                      />
                    </div>
                    {errors.email ? (
                      <span className="text-sm text-[#da4b7f]">{errors.email.message}</span>
                    ) : null}
                  </label>

                  {error ? (
                    <p className="rounded-2xl bg-[#fff0f5] px-4 py-3 text-sm text-[#da4b7f]">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-full bg-[linear-gradient(90deg,#ef5db4_0%,#f59b6c_58%,#ffd95a_100%)] px-4 py-3 font-semibold text-white shadow-[0_18px_34px_rgba(239,93,180,0.32)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (language === "vi" ? "Đang xử lý..." : "Processing...") : (language === "vi" ? "Gửi yêu cầu" : "Send Instructions")}
                  </button>

                  <div className="pt-2 text-center">
                    <Link
                      to={ROUTES.login}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#d85a9b] hover:underline"
                    >
                      <ArrowLeft size={14} />
                      {language === "vi" ? "Quay lại Đăng nhập" : "Back to Login"}
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
