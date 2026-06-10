export function ManagerDashboardPage() {
  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
        <div className="h-3 bg-[image:var(--gradient-accent)]" />
        <div className="p-7 md:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-[#d45b9f]">
            Manager Dashboard
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
            Salon operations overview
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--color-muted)]">
            This is the landing page for the Manager role. You can plug in
            booking stats, revenue, salon performance, and staffing insights
            using the same feature-based structure.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Bookings", "184", "total bookings this week"],
          ["Revenue", "$12.4K", "projected weekly revenue"],
          ["Staffing", "28", "active staff across shifts"],
        ].map(([label, value, description]) => (
          <article
            key={label}
            className="rounded-[22px] bg-white p-5 shadow-[0_14px_30px_rgba(94,76,62,0.06)]"
          >
            <p className="text-sm uppercase tracking-[0.16em] text-[#d45b9f]">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {description}
            </p>
          </article>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[24px] bg-white p-6 shadow-[0_16px_34px_rgba(94,76,62,0.06)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
            Operations snapshot
          </p>
          <div className="mt-5 space-y-4">
            {[
              "Peak booking volume expected between 1 PM and 5 PM.",
              "Two staff members need reassignment for tomorrow's schedule.",
              "Top-performing branch is tracking above revenue target.",
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
            Manager focus
          </p>
          <div className="mt-5 rounded-2xl bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-5 text-sm leading-7 text-[var(--color-muted)]">
            This space can hold salon performance charts, staffing alerts, and
            revenue trends once the real manager dashboard data is connected.
          </div>
        </article>
      </div>
    </section>
  );
}
