import { PropTypes } from "../../utils/propTypes";

export function EmptyState({ title = "No data available", description = "" }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

EmptyState.propTypes = {
  description: PropTypes.string,
  title: PropTypes.string,
};
