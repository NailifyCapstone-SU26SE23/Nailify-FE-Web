import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PropTypes } from "../../utils/propTypes";

export function ActionDropdown({
  align = "right",
  buttonClassName = "",
  items,
  label = "Actions",
  menuClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState("down");
  const [menuStyle, setMenuStyle] = useState(null);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !containerRef.current || !menuRef.current) {
      return undefined;
    }

    const updateMenuDirection = () => {
      const containerRect = containerRef.current.getBoundingClientRect();
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;
      const requiredHeight = menuHeight + 12;
      const nextDirection =
        spaceBelow < requiredHeight && spaceAbove > spaceBelow ? "up" : "down";

      const rawLeft =
        align === "left" ? containerRect.left : containerRect.right - menuWidth;
      const left = Math.max(8, Math.min(rawLeft, viewportWidth - menuWidth - 8));
      const top =
        nextDirection === "up"
          ? Math.max(8, containerRect.top - menuHeight - 8)
          : Math.min(containerRect.bottom + 8, viewportHeight - menuHeight - 8);

      setOpenDirection(nextDirection);
      setMenuStyle({ left, top });
    };

    updateMenuDirection();
    window.addEventListener("resize", updateMenuDirection);
    window.addEventListener("scroll", updateMenuDirection, true);

    return () => {
      window.removeEventListener("resize", updateMenuDirection);
      window.removeEventListener("scroll", updateMenuDirection, true);
    };
  }, [isOpen]);

  const menuPositionClassName =
    align === "left"
      ? openDirection === "up"
        ? "origin-bottom-left"
        : "origin-top-left"
      : openDirection === "up"
        ? "origin-bottom-right"
        : "origin-top-right";

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-[#f6cfe0] bg-[#fff6fa] px-3 py-1.5 text-xs font-bold text-[#ea4f93] transition hover:bg-[#ffeef5] ${buttonClassName}`}
      >
        <span>{label}</span>
        <ChevronDown size={13} className={`transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle ?? { left: -9999, top: -9999 }}
            className={`fixed z-[1000] min-w-[190px] rounded-[18px] border border-[#f8d7e5] bg-white p-2 shadow-[0_18px_34px_rgba(236,72,153,0.16)] ${menuPositionClassName} ${menuClassName}`}
          >
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      item.onSelect();
                    }}
                    className={`flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-xs font-semibold transition hover:bg-[#fff4f8] ${item.className ?? "text-[#5f485a]"}`}
                  >
                    {Icon ? <Icon size={14} className="shrink-0" /> : null}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          ,
          document.body,
        )
      ) : null}
    </div>
  );
}

ActionDropdown.propTypes = {
  align: PropTypes.oneOf(["left", "right"]),
  buttonClassName: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      className: PropTypes.string,
      icon: PropTypes.elementType,
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      onSelect: PropTypes.func.isRequired,
    }),
  ).isRequired,
  label: PropTypes.string,
  menuClassName: PropTypes.string,
};
