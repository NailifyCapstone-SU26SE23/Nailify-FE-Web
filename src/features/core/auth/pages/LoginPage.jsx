import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, ShieldQuestionMark } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import { AUTH_STATUS } from "../constants/authConstants";
import { getDashboardRouteByRole } from "../utils/getDashboardRouteByRole";
import { ROUTES } from "../../../../shared/constants/routes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is mandatory.")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Must match standard email format."
    ),
  password: z
    .string()
    .min(1, "Password is mandatory.")
    .min(6, "Password must be at least 6 characters.")
    .max(30, "Password must be at most 30 characters."),
});

const DECORATIVE_DOTS = Array.from({ length: 12 }, (_, index) => `dot-${index + 1}`);

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, loginGoogle, isAuthenticated, status, error, role } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@nailify.com",
      password: "123456",
    },
  });
  const { language } = useLanguage();
  const isVi = language === "vi";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardRouteByRole(role), { replace: true });
    }
  }, [isAuthenticated, navigate, role]);

  useEffect(() => {
    if (searchParams.get("reason") === "session_expired") {
      toast.error(isVi ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : "Session expired. Please login again.", { duration: 4000, id: "session_expired" });
      // Remove the reason param from URL so it doesn't show again on refresh
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "1025550275815-53gqspk618fbeevsk5c6spk5e44c4c4c.apps.googleusercontent.com",
          callback: async (response) => {
            try {
              const result = await loginGoogle(response.credential);
              if (result.meta.requestStatus === "fulfilled") {
                navigate(getDashboardRouteByRole(result.payload.user.role), {
                  replace: true,
                });
              }
            } catch (err) {
              console.error("Google sign-in error:", err);
            }
          },
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: "380", shape: "pill" }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [loginGoogle, navigate]);

  const onSubmit = async (values) => {
    const result = await login(values);

    if (result.meta.requestStatus === "fulfilled") {
      navigate(getDashboardRouteByRole(result.payload.user.role), {
        replace: true,
      });
    }
  };

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
          <div className="absolute left-[31%] top-12 text-5xl font-light opacity-75">
            +
          </div>
          <div className="absolute bottom-36 left-[46%] text-5xl font-light opacity-75">
            +
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
              <ShieldCheck size={16} />
              {isVi ? "Truy cập nội bộ" : "Internal Access"}
            </div>

            <div className="max-w-md space-y-4 py-4 md:py-10">
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl xl:text-6xl">
                {isVi ? "Chào mừng trở lại!" : "Welcome back!"}
              </h1>
              <p className="text-base leading-7 text-white/90 md:text-lg md:leading-8">
                {isVi ? "Đăng nhập với tài khoản vai trò nội bộ của bạn để truy cập không gian làm việc vận hành Nailify" :
                  "Sign in with your internal role account to access the Nailify operations workspace."}
              </p>
            </div>
            <div className="rounded-[28px] h-full p-5" />
          </div>
        </section>

        <section className="bg-[rgba(255,252,248,0.96)] px-8 py-7 md:px-10 md:py-8">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center">
            <div className="mb-6 space-y-2.5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d85a9b]">
                {isVi ? "Đăng nhập" : "Sign In"}
              </p>
              <h2 className="text-3xl font-semibold text-[var(--color-ink)] md:text-4xl">
                {isVi ? "Đăng nhập tài khoản nội bộ" : "Internal Login"}
              </h2>
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                {isVi ? "Đây là màn hình dành cho tài khoản có vai trò nội bộ đã có. Không thể tạo tài khoản mới tại đây." :
                  "This screen is for existing internal role accounts only. New account creation is not available here."}
              </p>
            </div>

            <form className="space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Email
                </span>
                <div className="flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ef6bb4]">
                  <Mail size={18} className="mr-3 text-[#d38f6b]" />
                  <input
                    {...register("email")}
                    className="w-full bg-transparent py-3 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298]"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email ? (
                  <span className="text-sm text-[#da4b7f]">
                    {errors.email.message}
                  </span>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {isVi ? "Mật khẩu" : "Password"}
                </span>
                <div className="flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ffbf69]">
                  <LockKeyhole size={18} className="mr-3 text-[#d38f6b]" />
                  <input
                    {...register("password")}
                    type={isPasswordVisible ? "text" : "password"}
                    className="w-full bg-transparent py-3 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298]"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className="ml-3 text-[#d38f6b] transition hover:text-[#c76f46]"
                    aria-label={isPasswordVisible ? (isVi ? "Ẩn mật khẩu" : "Hide password") : (isVi ? "Hiện mật khẩu" : "Show password")}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password ? (
                  <span className="text-sm text-[#da4b7f]">
                    {errors.password.message}
                  </span>
                ) : null}
              </label>

              <div className="flex items-center justify-between gap-4 text-sm text-[var(--color-muted)]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-[#efc9d8] accent-[#ef5db4]"
                  />
                  {isVi ? "Nhớ tôi" : "Remember me"}
                </label>
                <Link to={ROUTES.forgotPassword} className="font-semibold text-[#d85a9b] hover:underline">
                  {isVi ? "Quên mật khẩu?" : "Forgot password?"}
                </Link>
              </div>

              {error ? (
                <p className="rounded-2xl bg-[#fff0f5] px-4 py-3 text-sm text-[#da4b7f]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === AUTH_STATUS.loading}
                className="w-full rounded-full bg-[linear-gradient(90deg,#ef5db4_0%,#f59b6c_58%,#ffd95a_100%)] px-4 py-3 font-semibold text-white shadow-[0_18px_34px_rgba(239,93,180,0.32)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === AUTH_STATUS.loading ? (isVi ? "Đang đăng nhập..." : "Signing in...") : (isVi ? "Đăng nhập" : "Sign In")}
              </button>

              <div className="rounded-[24px] border border-gray-200 bg-[#fff7ef] px-5 py-3.5 text-sm leading-6 text-gray-600">
                <span className="inline-flex items-center align-middle gap-2 font-semibold text-black">
                  <ShieldQuestionMark size={20} />
                  {isVi ? "Chính sách truy cập: " : "Access policy: "}
                </span>{" "}
                {isVi ? "chỉ tài khoản Nhân viên, Quản lý và Quản trị viên hiện có mới có thể đăng nhập trên trang này." :
                  "only existing Staff, Manager, and Admin accounts can sign in on this page."}
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
