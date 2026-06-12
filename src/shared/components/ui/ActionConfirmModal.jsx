import { Modal } from "antd";
import {
  AlertTriangle,
  CircleAlert,
  Info,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { PropTypes } from "../../utils/propTypes";

const INTENT_STYLES = {
  danger: {
    headerClassName: "bg-[linear-gradient(135deg,#f43f5e_0%,#e11d48_100%)]",
    badgeClassName: "bg-white/18 text-white",
    iconClassName: "bg-white/16 text-white",
    panelClassName: "border-rose-100 bg-[#fff7fa]",
    panelIconClassName: "bg-rose-100 text-rose-500",
    confirmClassName:
      "border-rose-500 bg-[linear-gradient(135deg,#f43f5e_0%,#e11d48_100%)] text-white shadow-[0_16px_28px_rgba(225,29,72,0.22)] hover:opacity-95",
    cancelClassName: "border-rose-200 bg-white text-rose-500 hover:bg-rose-50",
    warningClassName: "border-amber-200 bg-amber-50 text-amber-800",
  },
  success: {
    headerClassName: "bg-[linear-gradient(135deg,#14b8a6_0%,#0f9f8f_100%)]",
    badgeClassName: "bg-white/18 text-white",
    iconClassName: "bg-white/16 text-white",
    panelClassName: "border-emerald-100 bg-[#f4fffb]",
    panelIconClassName: "bg-emerald-100 text-emerald-600",
    confirmClassName:
      "border-emerald-500 bg-[linear-gradient(135deg,#10b981_0%,#059669_100%)] text-white shadow-[0_16px_28px_rgba(5,150,105,0.22)] hover:opacity-95",
    cancelClassName: "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50",
    warningClassName: "border-emerald-100 bg-emerald-50 text-emerald-800",
  },
  warning: {
    headerClassName: "bg-[linear-gradient(135deg,#f59e0b_0%,#ea580c_100%)]",
    badgeClassName: "bg-white/18 text-white",
    iconClassName: "bg-white/16 text-white",
    panelClassName: "border-amber-100 bg-[#fffaf2]",
    panelIconClassName: "bg-amber-100 text-amber-600",
    confirmClassName:
      "border-amber-500 bg-[linear-gradient(135deg,#f59e0b_0%,#ea580c_100%)] text-white shadow-[0_16px_28px_rgba(234,88,12,0.18)] hover:opacity-95",
    cancelClassName: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
    warningClassName: "border-amber-200 bg-amber-50 text-amber-800",
  },
  info: {
    headerClassName: "bg-[linear-gradient(135deg,#ec4899_0%,#db2777_100%)]",
    badgeClassName: "bg-white/18 text-white",
    iconClassName: "bg-white/16 text-white",
    panelClassName: "border-rose-100 bg-[#fff7fb]",
    panelIconClassName: "bg-rose-100 text-rose-500",
    confirmClassName:
      "border-rose-500 bg-[linear-gradient(135deg,#ec4899_0%,#db2777_100%)] text-white shadow-[0_16px_28px_rgba(219,39,119,0.18)] hover:opacity-95",
    cancelClassName: "border-rose-200 bg-white text-rose-500 hover:bg-rose-50",
    warningClassName: "border-rose-100 bg-rose-50 text-rose-800",
  },
};

const ICON_BY_TONE = {
  danger: Trash2,
  success: Save,
  warning: AlertTriangle,
  info: CircleAlert,
};

const MODAL_STYLES = {
  body: { padding: 0 },
  content: { padding: 0, overflow: "hidden", borderRadius: 28 },
  mask: {
    backgroundColor: "rgba(47, 13, 33, 0.26)",
    backdropFilter: "blur(8px)",
  },
};

export function ActionConfirmModal({
  open,
  title,
  subtitle,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  intent = "info",
  confirmIcon: ConfirmIcon,
  loading = false,
  details = [],
  highlights = [],
  warnings = [],
  item = null,
  width = 480,
}) {
  const palette = INTENT_STYLES[intent] ?? INTENT_STYLES.info;
  const HeaderIcon = ICON_BY_TONE[intent] ?? ICON_BY_TONE.info;

  return (
    <Modal
      open={open}
      centered
      onCancel={loading ? undefined : onCancel}
      footer={null}
      closable={false}
      maskClosable={!loading}
      keyboard={!loading}
      width={width}
      styles={MODAL_STYLES}
    >
      <div>
        <div className={`px-6 py-5 text-white ${palette.headerClassName}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${palette.iconClassName}`}>
                <HeaderIcon size={20} />
              </div>
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${palette.badgeClassName}`}>
                  Confirm Action
                </span>
                <h3 className="mt-3 text-lg font-black">{title}</h3>
                {subtitle ? <p className="mt-1 text-sm text-white/78">{subtitle}</p> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={loading ? undefined : onCancel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              aria-label="Close confirmation modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className={`rounded-[22px] border p-4 ${palette.panelClassName}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${palette.panelIconClassName}`}>
                <Info size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-6 text-slate-700">{description}</p>
                {highlights.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-600"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {item ? (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-14 w-14 rounded-2xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <HeaderIcon size={18} className="text-slate-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold text-slate-800">{item.title}</p>
                  {item.meta ? <p className="mt-1 text-[11px] text-slate-500">{item.meta}</p> : null}
                  {item.note ? <p className="mt-1 text-[11px] text-slate-400">{item.note}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {details.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="rounded-[18px] border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {detail.label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-700">{detail.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className={`rounded-[22px] border p-4 ${palette.warningClassName}`}>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={15} />
                <p className="text-[12px] font-extrabold uppercase tracking-[0.08em]">Please Note</p>
              </div>
              <ul className="space-y-2">
                {warnings.map((warning) => (
                  <li key={warning} className="flex items-start gap-2 text-[12px] leading-5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-60 ${palette.cancelClassName}`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] transition disabled:cursor-wait disabled:opacity-70 ${palette.confirmClassName}`}
          >
            {ConfirmIcon ? <ConfirmIcon size={14} /> : null}
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

ActionConfirmModal.propTypes = {
  cancelText: PropTypes.string,
  confirmIcon: PropTypes.elementType,
  confirmText: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  details: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ),
  highlights: PropTypes.arrayOf(PropTypes.string),
  intent: PropTypes.oneOf(["danger", "success", "warning", "info"]),
  item: PropTypes.shape({
    image: PropTypes.string,
    meta: PropTypes.string,
    note: PropTypes.string,
    title: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
  warnings: PropTypes.arrayOf(PropTypes.string),
  width: PropTypes.number,
};

ActionConfirmModal.defaultProps = {
  cancelText: "Cancel",
  confirmIcon: null,
  details: [],
  highlights: [],
  intent: "info",
  item: null,
  loading: false,
  subtitle: "",
  warnings: [],
  width: 480,
};
