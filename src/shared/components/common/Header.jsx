import { Bell, Calendar, LogOut, Menu } from "lucide-react";
import { PropTypes } from "../../utils/propTypes";
import { BackButton } from "../ui/BackButton";

export function Header({
  backButtonFallbackTo = "/",
  backButtonLabel = "Back",
  backButtonTo = null,
  description,
  onOpenMobileMenu,
  onLogout,
  title,
  todayLabel,
}) {
  return (
    <header className="bg-white px-5 py-4 shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 flex items-center justify-between md:hidden">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              title="Open menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f8c8db] bg-[#fff8fb] text-[#eb5a99] shadow-[0_12px_24px_rgba(235,90,153,0.12)] transition hover:bg-[#fff0f7]"
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="hidden md:block">
              <BackButton
                fallbackTo={backButtonFallbackTo}
                label={backButtonLabel}
                to={backButtonTo}
              />
            </div>
            <h1 className="text-[1.85rem] font-extrabold leading-none text-[#3d2a3a]">
              {title}
            </h1>
          </div>
          <p className="mt-2 text-sm text-[#c28ca6]">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#f8d5e4] bg-[#fff8fb] px-4 text-sm font-semibold text-[#eb5a99] shadow-[0_12px_24px_rgba(235,90,153,0.08)]">
              <Calendar size={16} />
              {todayLabel}
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#f8c8db] bg-[#fff8fb] px-4 text-sm font-semibold text-[#eb5a99] shadow-[0_12px_24px_rgba(235,90,153,0.12)] transition hover:bg-[#fff0f7]"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f8c8db] bg-[#fff8fb] text-[#eb5a99] shadow-[0_12px_24px_rgba(235,90,153,0.12)] transition hover:bg-[#fff0f7]"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  backButtonFallbackTo: PropTypes.string,
  backButtonLabel: PropTypes.string,
  backButtonTo: PropTypes.string,
  description: PropTypes.string.isRequired,
  onOpenMobileMenu: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  todayLabel: PropTypes.string.isRequired,
};
