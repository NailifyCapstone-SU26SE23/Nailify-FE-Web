import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";

export function UserManagementHeroCard({
  avatarUrl,
  backLabel,
  backTo,
  badge,
  title,
  description,
  headerActions,
  panelIcon,
  panelTitle,
  panelDescription,
}) {
  const normalizedAvatarUrl = String(avatarUrl || "").trim();
  const [hasImageError, setHasImageError] = useState(false);
  const avatarFallback = String(title || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  useEffect(() => {
    setHasImageError(false);
  }, [normalizedAvatarUrl]);

  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
      <div className="h-3 bg-[image:var(--gradient-accent)]" />
      <div className="flex flex-col gap-5 p-5 sm:p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#d45b9f] transition hover:text-[#c73a87]"
          >
            {panelIcon}
            <span>{backLabel}</span>
          </Link>
          {headerActions ? <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">{headerActions}</div> : null}
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-full md:max-w-[32rem]">
            <p className="mt-5 text-sm uppercase tracking-[0.24em] text-[#d45b9f]">
              {badge}
            </p>
            <div className="mt-3 flex items-center gap-4">
              {normalizedAvatarUrl && !hasImageError ? (
                <img
                  src={normalizedAvatarUrl}
                  alt={`${title} avatar`}
                  className="h-16 w-16 rounded-3xl border border-[#f6dbe7] object-cover shadow-[0_14px_28px_rgba(94,76,62,0.08)]"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setHasImageError(true)}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[linear-gradient(180deg,#ffd9eb_0%,#ea4f93_100%)] text-lg font-bold text-white shadow-[0_14px_28px_rgba(94,76,62,0.08)]">
                  {avatarFallback}
                </div>
              )}
              <h2 className="text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
                {title}
              </h2>
            </div>
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
              </div>
            </div>
            <p className="mt-4 leading-6">{panelDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

UserManagementHeroCard.propTypes = {
  avatarUrl: PropTypes.string,
  backLabel: PropTypes.string.isRequired,
  backTo: PropTypes.string.isRequired,
  badge: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  headerActions: PropTypes.node,
  panelIcon: PropTypes.node.isRequired,
  panelTitle: PropTypes.string.isRequired,
  panelDescription: PropTypes.string.isRequired,
};
