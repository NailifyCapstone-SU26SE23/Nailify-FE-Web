import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { ChevronDown, X, Check } from "lucide-react";

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = "Select...",
  prefixIcon,
  suffixIcon,
  className = "",
  disabled = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? [...value] : [];
      if (newValue.includes(optionValue)) {
        onChange(newValue.filter((v) => v !== optionValue));
      } else {
        onChange([...newValue, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleRemove = (e, optionValue) => {
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  // Determine display text/nodes
  const getDisplayNode = () => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-gray-400">{placeholder}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => {
            const option = options.find((o) => o.value === v);
            return (
              <span
                key={v}
                className="flex items-center gap-1 bg-[#ef6bb4]/10 text-[#ef6bb4] px-2 py-0.5 rounded-md text-[13px] font-medium"
              >
                {option ? option.label : v}
                <X
                  size={14}
                  className="cursor-pointer hover:text-[#d84b95] transition-colors"
                  onClick={(e) => handleRemove(e, v)}
                />
              </span>
            );
          })}
        </div>
      );
    } else {
      if (value === undefined || value === null || value === "") {
        return <span className="text-gray-400">{placeholder}</span>;
      }
      const option = options.find((o) => o.value === value);
      return <span>{option ? option.label : value}</span>;
    }
  };

  const isSelected = (val) => {
    if (multiple) return Array.isArray(value) && value.includes(val);
    return value === val;
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Trigger */}
      <div
        className={`flex min-h-[44px] cursor-pointer select-none items-center justify-between rounded-lg border bg-white px-3 py-2 transition-all
          ${
            error
              ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
              : "border-[#f1d7c0] hover:border-[#ef6bb4] focus-within:border-[#ef6bb4] focus-within:ring-2 focus-within:ring-[#ef6bb4]/20"
          }
          ${disabled ? "cursor-not-allowed bg-gray-50 opacity-50 hover:border-[#f1d7c0]" : ""}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {prefixIcon && (
            <span className="flex-shrink-0 text-gray-500">{prefixIcon}</span>
          )}
          <div className="flex-1 truncate text-sm text-[var(--color-ink)]">
            {getDisplayNode()}
          </div>
        </div>

        <div className="ml-2 flex flex-shrink-0 items-center gap-2">
          {suffixIcon ? (
            <span className="text-gray-500">{suffixIcon}</span>
          ) : (
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#f1d7c0] bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              Không có dữ liệu
            </div>
          ) : (
            options.map((option) => {
              const selected = isSelected(option.value);
              return (
                <div
                  key={option.value}
                  className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors
                    ${
                      selected
                        ? "bg-[#ef6bb4]/10 font-medium text-[#ef6bb4]"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {selected && (
                    <Check
                      size={16}
                      className="ml-2 flex-shrink-0 text-[#ef6bb4]"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

CustomSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      value: PropTypes.any.isRequired,
    })
  ).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  placeholder: PropTypes.string,
  prefixIcon: PropTypes.node,
  suffixIcon: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
};

export default CustomSelect;
