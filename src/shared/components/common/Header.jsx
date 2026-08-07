import { Bell, Calendar, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { PropTypes } from "../../utils/propTypes";
import { BackButton } from "../ui/BackButton";
import { useNotifications } from "../../../features/core/notifications/context/NotificationContext";
import { NotificationDropdown } from "../../../features/core/notifications/components/NotificationDropdown";
import { useLanguage } from "../../hooks/useLanguage";

export function Header({
  showBackButton = false,
  backButtonFallbackTo = "/",
  backButtonLabel = null,
  backButtonTo = null,
  description,
  onOpenMobileMenu,
  onLogout,
  title,
  todayLabel,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { language, setLanguage, t } = useLanguage();

  const actualBackButtonLabel = backButtonLabel || t("back");

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
            {showBackButton && (
              <div className="hidden md:block">
                <BackButton
                  fallbackTo={backButtonFallbackTo}
                  label={actualBackButtonLabel}
                  to={backButtonTo}
                />
              </div>
            )}
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

            {/* Language Switcher */}
            <div className="relative inline-flex h-11 items-center rounded-2xl border border-[#f8d5e4] bg-[#fff8fb] p-1 shadow-[0_12px_24px_rgba(235,90,153,0.08)]">
              <div
                className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-[#eb5a99] to-[#ea4f93] shadow-[0_4px_12px_rgba(235,90,153,0.35)] transition-all duration-300 ease-out"
                style={{
                  left: language === "vi" ? "4px" : "calc(50% + 2px)",
                  width: "calc(50% - 6px)",
                }}
              />
              <button
                type="button"
                onClick={() => setLanguage("vi")}
                className={`relative z-10 flex h-full w-[12px] min-w-[38px] items-center justify-center text-xs font-bold transition-colors duration-200 ${
                  language === "vi" ? "text-white" : "text-[#eb5a99]"
                }`}
                title={t("vietnamese")}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`relative z-10 flex h-full w-[12px] min-w-[38px] items-center justify-center text-xs font-bold transition-colors duration-200 ${
                  language === "en" ? "text-white" : "text-[#eb5a99]"
                }`}
                title={t("english")}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title={t("signOut")}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#f8c8db] bg-[#fff8fb] px-4 text-sm font-semibold text-[#eb5a99] shadow-[0_12px_24px_rgba(235,90,153,0.12)] transition hover:bg-[#fff0f7]"
            >
              <LogOut size={16} />
              <span>{t("signOut")}</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f8c8db] bg-[#fff8fb] text-[#eb5a99] shadow-[0_12px_24px_rgba(235,90,153,0.12)] transition hover:bg-[#fff0f7]"
                title={t("notifications")}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ea4f93] text-[9px] font-bold text-white shadow-[0_4px_8px_rgba(234,79,147,0.4)] animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>
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
  showBackButton: PropTypes.bool,
  title: PropTypes.string.isRequired,
  todayLabel: PropTypes.string.isRequired,
};
