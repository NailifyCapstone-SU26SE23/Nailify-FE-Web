export function AdminDashboardPage() {
  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
        <div className="h-3 bg-[image:var(--gradient-accent)]" />
        <div className="p-7 md:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-[#d45b9f]">
            Admin Dashboard
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
            System-wide overview
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--color-muted)]">
            This is the landing page for the Admin role. You can extend it with
            chain-level salon management, consolidated revenue, staff rankings,
            and cross-branch reporting.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Salons", "14"],
          ["Staff", "126"],
          ["Designs", "328"],
          ["Reports", "9"],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-[22px] bg-white p-5 shadow-[0_14px_30px_rgba(94,76,62,0.06)]"
          >
            <p className="text-sm uppercase tracking-[0.16em] text-[#d45b9f]">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[24px] bg-white p-6 shadow-[0_16px_34px_rgba(94,76,62,0.06)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
            Executive summary
          </p>
          <div className="mt-5 space-y-4">
            {[
              "Network-wide revenue is trending above the monthly target.",
              "Three salons need staffing adjustments before the weekend peak.",
              "New nail design submissions are pending final review.",
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
            System insights
          </p>
          <div className="mt-5 rounded-2xl bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-5 text-sm leading-7 text-[var(--color-muted)]">
            This panel is ready for cross-branch reporting, chain performance,
            and platform-level management data once those modules are added.
          </div>
        </article>
      </div>
    </section>
  );
}
