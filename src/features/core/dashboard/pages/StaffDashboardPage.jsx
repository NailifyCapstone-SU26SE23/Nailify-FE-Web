export function StaffDashboardPage() {
  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
        <div className="h-3 bg-[image:var(--gradient-accent)]" />
        <div className="p-7 md:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-[#d45b9f]">
            Staff Dashboard
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
            Staff workload overview
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--color-muted)]">
            This is the landing page for the Staff role. You can extend this
            dashboard with today's bookings, work schedules, and personal KPIs
            inside the `dashboard` feature.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[22px] bg-white p-5 shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          <p className="text-sm uppercase tracking-[0.16em] text-[#d45b9f]">
            Today
          </p>
          <p className="mt-3 text-3xl font-semibold">12</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            active bookings assigned
          </p>
        </article>
        <article className="rounded-[22px] bg-white p-5 shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          <p className="text-sm uppercase tracking-[0.16em] text-[#d45b9f]">
            Schedule
          </p>
          <p className="mt-3 text-3xl font-semibold">3</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            upcoming shifts this week
          </p>
        </article>
        <article className="rounded-[22px] bg-white p-5 shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          <p className="text-sm uppercase tracking-[0.16em] text-[#d45b9f]">
            KPI
          </p>
          <p className="mt-3 text-3xl font-semibold">96%</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            service completion rate
          </p>
        </article>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-[24px] bg-white p-6 shadow-[0_16px_34px_rgba(94,76,62,0.06)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
            Upcoming workflow
          </p>
          <div className="mt-5 space-y-4">
            {[
              "09:00 AM  •  Gel polish appointment",
              "11:30 AM  •  Customer design consultation",
              "02:00 PM  •  Nail art booking",
              "04:30 PM  •  End-of-day service wrap-up",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm text-[var(--color-ink)]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] bg-white p-6 shadow-[0_16px_34px_rgba(94,76,62,0.06)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
            Notes
          </p>
          <div className="mt-5 rounded-2xl bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-5 text-sm leading-7 text-[var(--color-muted)]">
            Use this area for staff reminders, shift notes, customer requests,
            or quick actions once the real feature modules are wired in.
          </div>
        </article>
      </div>
    </section>
  );
}
