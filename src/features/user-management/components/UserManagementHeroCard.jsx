import { Link } from "react-router-dom";
import { PropTypes } from "../../../shared/utils/propTypes";

export function UserManagementHeroCard({
  backLabel,
  backTo,
  badge,
  title,
  description,
  panelIcon,
  panelTitle,
  panelDescription,
}) {
  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
      <div className="h-3 bg-[image:var(--gradient-accent)]" />
      <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-start md:justify-between md:p-8">
        <div className="max-w-full md:max-w-[32rem]">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#d45b9f] transition hover:text-[#c73a87]"
          >
            {panelIcon}
            <span>{backLabel}</span>
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.24em] text-[#d45b9f]">
            {badge}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-base leading-8 text-[var(--color-muted)]">
            {description}
          </p>
        </div>

        <div className="rounded-[24px] bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-4 text-sm text-[var(--color-muted)] shadow-[0_14px_30px_rgba(94,76,62,0.06)] sm:p-5 md:max-w-[22rem]">
          <div className="flex items-center gap-3 text-[var(--color-ink)]">
            <div className="rounded-2xl bg-white p-3 shadow-[0_12px_24px_rgba(94,76,62,0.08)]">
              {panelIcon}
            </div>
            <div>
              <p className="font-semibold">{panelTitle}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                Mock CRUD
              </p>
            </div>
          </div>
          <p className="mt-4 leading-6">{panelDescription}</p>
        </div>
      </div>
    </div>
  );
}

UserManagementHeroCard.propTypes = {
  backLabel: PropTypes.string.isRequired,
  backTo: PropTypes.string.isRequired,
  badge: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  panelIcon: PropTypes.node.isRequired,
  panelTitle: PropTypes.string.isRequired,
  panelDescription: PropTypes.string.isRequired,
};
