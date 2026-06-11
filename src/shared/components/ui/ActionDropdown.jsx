import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PropTypes } from "../../utils/propTypes";

export function ActionDropdown({
  align = "right",
  buttonClassName = "",
  items,
  label = "Actions",
  menuClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  const menuPositionClassName =
    align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right";

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
        <div
          className={`absolute top-[calc(100%+0.5rem)] z-20 min-w-[190px] rounded-[18px] border border-[#f8d7e5] bg-white p-2 shadow-[0_18px_34px_rgba(236,72,153,0.16)] ${menuPositionClassName} ${menuClassName}`}
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
