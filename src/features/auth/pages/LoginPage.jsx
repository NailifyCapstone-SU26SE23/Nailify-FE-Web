import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import { AUTH_STATUS } from "../constants/authConstants";
import { getDashboardRouteByRole } from "../utils/getDashboardRouteByRole";

const loginSchema = z.object({
  email: z.email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const demoAccounts = [
  "staff@nailify.com / Staff@123",
  "manager@nailify.com / Manager@123",
  "admin@nailify.com / Admin@123",
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, status, error, role } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "staff@nailify.com",
      password: "Staff@123",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardRouteByRole(role), { replace: true });
    }
  }, [isAuthenticated, navigate, role]);

  const onSubmit = async (values) => {
    const result = await login(values);

    if (result.meta.requestStatus === "fulfilled") {
      navigate(getDashboardRouteByRole(result.payload.user.role), {
        replace: true,
      });
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7d9e8_0%,#f9efcf_100%)] px-4 py-8 text-[var(--color-ink)] md:px-6 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white/40 shadow-[0_32px_90px_rgba(170,108,96,0.18)] backdrop-blur md:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#ef5db4_0%,#f59b6c_58%,#ffd95a_100%)] px-8 py-10 text-white md:px-10 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.18),transparent_22%),radial-gradient(circle_at_76%_70%,rgba(255,255,255,0.14),transparent_26%),linear-gradient(145deg,transparent_0%,rgba(160,60,126,0.16)_48%,rgba(255,255,255,0.08)_100%)]" />
          <div className="absolute -left-12 top-6 h-44 w-44 rounded-[40px] border border-white/30" />
          <div className="absolute left-8 top-32 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-[-2.5rem] h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute right-12 top-16 grid grid-cols-3 gap-2 opacity-85">
            {Array.from({ length: 12 }).map((_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-white" />
            ))}
          </div>
          <div className="absolute left-[31%] top-12 text-5xl font-light opacity-75">
            +
          </div>
          <div className="absolute bottom-36 left-[46%] text-5xl font-light opacity-75">
            +
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
              <ShieldCheck size={16} />
              Internal Access
            </div>

            <div className="max-w-md space-y-5 py-6 md:py-16">
              <h1 className="text-5xl font-semibold leading-tight md:text-6xl">
                Welcome back!
              </h1>
              <p className="text-lg leading-8 text-white/90">
                Sign in with your internal role account to access the Nailify
                operations workspace.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/25 bg-white/14 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/95">
                  Internal Demo Roles
                </p>
                <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold text-white">
                  Staff / Manager / Admin
                </span>
              </div>
              <ul className="space-y-3 text-sm">
                {demoAccounts.map((account) => (
                  <li
                    key={account}
                    className="rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-white/95"
                  >
                    {account}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-[rgba(255,252,248,0.96)] px-8 py-10 md:px-10 md:py-12">
          <div className="mx-auto flex max-w-md flex-col justify-center">
            <div className="mb-10 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d85a9b]">
                Sign In
              </p>
              <h2 className="text-4xl font-semibold text-[var(--color-ink)]">
                Internal Login
              </h2>
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                This screen is for existing internal role accounts only. New
                account creation is not available here.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Username or email
                </span>
                <div className="flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ef6bb4]">
                  <Mail size={18} className="mr-3 text-[#d38f6b]" />
                  <input
                    {...register("email")}
                    className="w-full bg-transparent py-3.5 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298]"
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
                  Password
                </span>
                <div className="flex items-center rounded-full border border-[#f1d7c0] bg-white px-4 transition focus-within:border-[#ffbf69]">
                  <LockKeyhole size={18} className="mr-3 text-[#d38f6b]" />
                  <input
                    {...register("password")}
                    type="password"
                    className="w-full bg-transparent py-3.5 text-[var(--color-ink)] outline-none placeholder:text-[#b3a298]"
                    placeholder="Enter your password"
                  />
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
                  <span>Remember me</span>
                </label>
                <span className="font-medium text-[#d85a9b]">
                  Contact admin for password reset
                </span>
              </div>

              {error ? (
                <p className="rounded-2xl bg-[#fff0f5] px-4 py-3 text-sm text-[#da4b7f]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === AUTH_STATUS.loading}
                className="w-full rounded-full bg-[linear-gradient(90deg,#ef5db4_0%,#f59b6c_58%,#ffd95a_100%)] px-4 py-3.5 font-semibold text-white shadow-[0_18px_34px_rgba(239,93,180,0.32)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === AUTH_STATUS.loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="rounded-[24px] bg-[#fff7ef] px-5 py-4 text-sm leading-6 text-[var(--color-muted)]">
                <span className="font-semibold text-[var(--color-ink)]">
                  Access policy:
                </span>{" "}
                only existing Staff, Manager, and Admin accounts can sign in on
                this page.
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
