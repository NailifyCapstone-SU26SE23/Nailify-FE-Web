import React from 'react';
import { Activity } from "lucide-react";
import { PropTypes } from "../../utils/propTypes";

export function TopMetricsRow({ metrics, className }) {
  const safeStr = (val) => {
    if (val === null || val === undefined) return '';
    if (React.isValidElement(val)) return val;
    if (typeof val === 'object') {
      try {
        return val.customerName || JSON.stringify(val);
      } catch (e) {
        return String(val);
      }
    }
    return String(val);
  };

  return (
    <div className={className || "grid gap-5 md:grid-cols-2 xl:grid-cols-5"}>
      {metrics.map((metric, i) => {
        const Icon = metric.icon || Activity;
        const color = metric.color || '#10b981';

        let displayUnit = "";
        if (metric.unit === "VND" || metric.unit === "₫") {
          displayUnit = "VND";
        } else if (metric.unit && !["USERS", "LOCATIONS", "STAFF", "/ 5.0"].includes(metric.unit)) {
          displayUnit = metric.unit;
        }

        let displayValue = safeStr(metric.value);
        if (typeof displayValue === 'string' && displayValue.includes("₫")) {
          displayValue = displayValue.replace(/₫/g, "").trim();
          displayUnit = "VND";
        }

        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                background: `linear-gradient(135deg, ${color}, transparent 75%)`,
              }}
            />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {metric.label}
                </p>
                <h2 className="mt-3 text-[24px] font-bold tracking-tight text-slate-800 leading-none break-all">
                  {displayValue} <span className="text-[14px] text-slate-400 font-semibold">{displayUnit}</span>
                </h2>
                {metric.note && (
                  <p className="mt-1 text-[11px] font-medium text-green-600">{safeStr(metric.note)}</p>
                )}
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm shrink-0 ml-2"
                style={{
                  backgroundColor: `${color}18`,
                  color: color,
                }}
              >
                <Icon size={24} strokeWidth={2.4} />
              </div>
            </div>
            <div
              className="mt-6 h-1.5 rounded-full"
              style={{
                background: `linear-gradient(to right, ${color}, transparent)`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

TopMetricsRow.propTypes = {
  metrics: PropTypes.array.isRequired,
  className: PropTypes.string,
};
