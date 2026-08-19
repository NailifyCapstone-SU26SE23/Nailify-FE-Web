import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, ShieldCheck, CheckCircle, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
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

const otpSchema = z.object({
  token: z
    .string()
    .min(1, { message: "Verification token is required." }),
});

const newPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(1, { message: "Confirm password is required." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [savedEmail, setSavedEmail] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // Forms
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // Handlers
  const onSubmitEmail = async (values) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await authService.forgotPassword(values.email);

      if (response?.isSucceeded) {
        setSavedEmail(values.email);
        setStep(2);
        toast.success(
          language === "vi"
            ? "Mã OTP đã được gửi về email của bạn!"
            : "OTP code has been sent to your email!"
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

  const onSubmitOtp = async (values) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await authService.checkResetToken(values.token);

      if (response?.isSucceeded) {
        setSavedToken(values.token);
        setStep(3);
        toast.success(
          language === "vi"
            ? "Mã đặt lại hợp lệ."
            : "Reset token verified successfully."
        );
      } else {
        setError(response?.message || (language === "vi" ? "Mã xác thực không đúng." : "Invalid verification token."));
      }
    } catch (err) {
      console.error("Check token error:", err);
      setError(
        err.message ||
        (language === "vi" ? "Xác thực mã thất bại. Vui lòng kiểm tra lại." : "Verification failed. Please check your token.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (values) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await authService.resetPassword({
        token: savedToken,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      if (response?.isSucceeded) {
        setStep(4);
        toast.success(
          language === "vi"
            ? "Đặt lại mật khẩu thành công!"
            : "Password updated successfully!"
        );
      } else {
        setError(response?.message || (language === "vi" ? "Cập nhật mật khẩu thất bại." : "Failed to update password."));
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(
        err.message ||
        (language === "vi" ? "Đã xảy ra lỗi khi đổi mật khẩu." : "An error occurred during password update.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const DECORATIVE_DOTS = Array.from({ length: 12 }, (_, index) => `dot-${index + 1}`);

  // Dynamic content for the left banner based on the step
  const getBannerContent = () => {
    switch (step) {
      case 2:
        return {
          title: language === "vi" ? "Xác thực OTP" : "Verify OTP",
          desc: language === "vi"
            ? "Hãy kiểm tra hộp thư đến của bạn và nhập mã xác thực OTP gồm 6 ký tự để tiếp tục."
            : "Please check your inbox and enter the 6-character OTP verification code to continue.",
        };
      case 3:
        return {
          title: language === "vi" ? "Mật khẩu mới" : "New Password",
          desc: language === "vi"
            ? "Hãy đặt mật khẩu mới mạnh mẽ và an toàn cho tài khoản Nailify của bạn."
            : "Set a strong and secure new password for your Nailify account.",
        };
      case 4:
        return {
          title: language === "vi" ? "Hoàn thành!" : "Success!",
          desc: language === "vi"
            ? "Tài khoản của bạn đã được cập nhật mật khẩu mới thành công."
            : "Your account password has been updated successfully.",
        };
      default:
        return {
          title: language === "vi" ? "Khôi phục mật khẩu" : "Reset Password",
          desc: language === "vi"
            ? "Đừng lo lắng! Hãy cung cấp địa chỉ email tài khoản của bạn, chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu ngay lập tức."
            : "Don't worry! Enter your registered email address and we'll send you instructions to reset your password immediately.",
        };
    }
  };

  const banner = getBannerContent();

  return (
    <main className="h-dvh overflow-hidden bg-[linear-gradient(180deg,#f7d9e8_0%,#f9efcf_100%)] px-4 py-4 text-[var(--color-ink)] md:px-6 md:py-6">
      <div className="mx-auto grid h-full max-h-full w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white/40 shadow-[0_32px_90px_rgba(170,108,96,0.18)] backdrop-blur md:grid-cols-[1.15fr_0.85fr]">
        
        {/* Left Banner */}
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
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl xl:text-6xl transition-all duration-300">
                {banner.title}
              </h1>
              <p className="text-base leading-7 text-white/90 md:text-lg md:leading-8 transition-all duration-300">
                {banner.desc}
              </p>
            </div>
            <div className="rounded-[28px] h-full p-5" />
          </div>
        </section>

        {/* Right Form Container */}
        <section className="bg-[rgba(255,252,248,0.96)] px-8 py-7 md:px-10 md:py-8">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center">

            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d85a9b]">
                    {language === "vi" ? "Quên mật khẩu" : "Forgot Password"}
                  </p>
                  <h2 className="text-3xl font-semibold text-[var(--color-ink)] md:text-4xl">
                    {language === "vi" ? "Yêu cầu khôi phục" : "Request Reset"}
                  </h2>
                </div>

                <form className="space-y-4" onSubmit={handleSubmitEmail(onSubmitEmail)}>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      {language === "vi" ? "Địa chỉ Email đăng ký" : "Registered Email"}
                    </span>
                    <div className="flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ef6bb4]">
                      <Mail size={18} className="mr-3 text-[#d38f6b]" />
                      <input
                        {...registerEmail("email")}
                        type="email"
                        className="w-full bg-transparent py-3 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298]"
                        placeholder={language === "vi" ? "Nhập email của bạn" : "Enter your email"}
                      />
                    </div>
                    {emailErrors.email ? (
                      <span className="text-sm text-[#da4b7f]">{emailErrors.email.message}</span>
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
                    {isLoading ? (language === "vi" ? "Đang gửi..." : "Sending...") : (language === "vi" ? "Gửi mã OTP" : "Send OTP Code")}
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

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d85a9b]">
                    {language === "vi" ? "Bước 2: Xác thực" : "Step 2: Verify"}
                  </p>
                  <h2 className="text-3xl font-semibold text-[var(--color-ink)] md:text-4xl">
                    {language === "vi" ? "Nhập mã OTP" : "Enter OTP Code"}
                  </h2>
                </div>

                <form className="space-y-4" onSubmit={handleSubmitOtp(onSubmitOtp)}>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      {language === "vi" ? "Mã OTP từ email" : "OTP Code from email"}
                    </span>
                    <div className="flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ef6bb4]">
                      <KeyRound size={18} className="mr-3 text-[#d38f6b]" />
                      <input
                        {...registerOtp("token")}
                        type="text"
                        className="w-full bg-transparent py-3 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298] tracking-widest uppercase font-mono font-bold"
                        placeholder="74ANY3"
                      />
                    </div>
                    {otpErrors.token ? (
                      <span className="text-sm text-[#da4b7f]">{otpErrors.token.message}</span>
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
                    {isLoading ? (language === "vi" ? "Đang xác thực..." : "Verifying...") : (language === "vi" ? "Xác thực mã" : "Verify Code")}
                  </button>

                  <div className="pt-2 text-center flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep(1);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#d85a9b] hover:underline"
                    >
                      <ArrowLeft size={14} />
                      {language === "vi" ? "Thay đổi email" : "Change email"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d85a9b]">
                    {language === "vi" ? "Bước 3: Đổi mật khẩu" : "Step 3: New Password"}
                  </p>
                  <h2 className="text-3xl font-semibold text-[var(--color-ink)] md:text-4xl">
                    {language === "vi" ? "Nhập mật khẩu mới" : "Set New Password"}
                  </h2>
                </div>

                <form className="space-y-4" onSubmit={handleSubmitPassword(onSubmitPassword)}>
                  
                  {/* New Password */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      {language === "vi" ? "Mật khẩu mới" : "New Password"}
                    </span>
                    <div className="relative flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ef6bb4]">
                      <Lock size={18} className="mr-3 text-[#d38f6b]" />
                      <input
                        {...registerPassword("newPassword")}
                        type={isNewPasswordVisible ? "text" : "password"}
                        className="w-full bg-transparent py-3 pr-10 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298]"
                        placeholder={language === "vi" ? "Nhập mật khẩu mới" : "Enter new password"}
                      />
                      <button
                        type="button"
                        onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                        className="absolute right-4 text-slate-400 hover:text-slate-600"
                      >
                        {isNewPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.newPassword ? (
                      <span className="text-sm text-[#da4b7f]">{passwordErrors.newPassword.message}</span>
                    ) : null}
                  </label>

                  {/* Confirm Password */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      {language === "vi" ? "Xác nhận mật khẩu" : "Confirm New Password"}
                    </span>
                    <div className="relative flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ef6bb4]">
                      <Lock size={18} className="mr-3 text-[#d38f6b]" />
                      <input
                        {...registerPassword("confirmPassword")}
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        className="w-full bg-transparent py-3 pr-10 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298]"
                        placeholder={language === "vi" ? "Nhập lại mật khẩu mới" : "Re-enter new password"}
                      />
                      <button
                        type="button"
                        onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        className="absolute right-4 text-slate-400 hover:text-slate-600"
                      >
                        {isConfirmPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword ? (
                      <span className="text-sm text-[#da4b7f]">{passwordErrors.confirmPassword.message}</span>
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
                    {isLoading ? (language === "vi" ? "Đang cập nhật..." : "Updating...") : (language === "vi" ? "Cập nhật mật khẩu" : "Update Password")}
                  </button>
                </form>
              </div>
            )}

            {step === 4 && (
              <div className="text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-sm">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[var(--color-ink)]">
                    {language === "vi" ? "Cập nhật thành công!" : "Password Updated!"}
                  </h2>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    {language === "vi"
                      ? "Mật khẩu của bạn đã được thay đổi. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới."
                      : "Your password has been changed. You can now log in with your new password."}
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
            )}

          </div>
        </section>
      </div>
    </main>
  );
}
