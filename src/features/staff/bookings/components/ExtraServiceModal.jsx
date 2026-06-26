import { Search, X } from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";

export function ExtraServiceModal({
  open,
  services,
  selectedServiceIds,
  searchValue,
  isLoading,
  isSaving,
  meta,
  onClose,
  onSearchChange,
  onSearchSubmit,
  onSelect,
  onPageChange,
  onConfirm,
  title = "Add Extra Service",
  description = "Select one or more active services and append them to this booking.",
  confirmText = "Add Selected Services",
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1c2e]/45 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[#f1cddd] bg-white shadow-[0_24px_60px_rgba(63,43,63,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-[#3f2b3f]">{title}</h3>
            <p className="mt-1 text-sm text-[#a88a9d]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff5f8]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3">
              <Search size={16} className="text-[#ea4f93]" />
              <input
                value={searchValue}
                onChange={onSearchChange}
                placeholder="Search service name..."
                className="w-full bg-transparent text-sm text-[#3f2b3f] outline-none placeholder:text-[#c59ab0]"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white"
            >
              Search
            </button>
          </form>

          <div className="mt-5 space-y-3 pr-1">
            {isLoading ? (
              <div className="rounded-[20px] border border-dashed border-[#f1cade] bg-[#fff8fb] px-4 py-10 text-center text-sm font-medium text-[#a88a9d]">
                Loading services...
              </div>
            ) : services.length ? (
              services.map((service) => {
                const isSelected = selectedServiceIds.includes(service.serviceId);

                return (
                  <button
                    key={service.serviceId}
                    type="button"
                    onClick={() => onSelect(service.serviceId)}
                    className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-[#ea4f93] bg-[#fff1f7] shadow-[0_14px_28px_rgba(236,72,153,0.12)]"
                        : "border-[#f3d5e2] bg-white hover:bg-[#fff8fb]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#3f2b3f]">{service.name}</p>
                        <p className="mt-1 text-xs text-[#a88a9d]">
                          {service.description || "No description provided."}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 rounded-full border border-[#cdeed7] bg-[#effcf3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1f9e5b]">
                        {service.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#fff4da] px-3 py-1 text-[11px] font-bold text-[#bd8517]">
                        {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(service.price)} VND
                      </span>
                      <span className="rounded-full bg-[#f7efff] px-3 py-1 text-[11px] font-bold text-[#8b5cf6]">
                        {service.duration} min
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#f1cade] bg-[#fff8fb] px-4 py-10 text-center text-sm font-medium text-[#a88a9d]">
                No services found.
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 bg-white">
          <div className="flex flex-col gap-3 border-t border-[#f7dfeb] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#a88a9d]">
              Showing {meta?.firstRowOnPage ?? 0}-{meta?.lastRowOnPage ?? 0} of {meta?.totalItems ?? 0} services
            </p>
            <p className="text-xs font-bold text-[#ea4f93]">
              Selected: {selectedServiceIds.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange((meta?.currentPage ?? 1) - 1)}
                disabled={!meta?.hasPrevious || isLoading}
                className="rounded-xl border border-[#f2bfd4] bg-white px-3 py-2 text-xs font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-[#866f80]">
                Page {meta?.currentPage ?? 1}/{meta?.totalPages ?? 1}
              </span>
              <button
                type="button"
                onClick={() => onPageChange((meta?.currentPage ?? 1) + 1)}
                disabled={!meta?.hasNext || isLoading}
                className="rounded-xl border border-[#f2bfd4] bg-white px-3 py-2 text-xs font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#f7dfeb] px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#f2bfd4] bg-white px-5 py-3 text-sm font-bold text-[#ea4f93]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!selectedServiceIds.length || isSaving || isLoading}
              className="rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Adding Services..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ExtraServiceModal.propTypes = {
  confirmText: PropTypes.string,
  description: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool.isRequired,
  meta: PropTypes.shape({
    currentPage: PropTypes.number,
    firstRowOnPage: PropTypes.number,
    hasNext: PropTypes.bool,
    hasPrevious: PropTypes.bool,
    lastRowOnPage: PropTypes.number,
    totalItems: PropTypes.number,
    totalPages: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  searchValue: PropTypes.string.isRequired,
  selectedServiceIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      description: PropTypes.string,
      duration: PropTypes.number,
      name: PropTypes.string.isRequired,
      price: PropTypes.number,
      serviceId: PropTypes.string.isRequired,
      status: PropTypes.string,
    }),
  ).isRequired,
  title: PropTypes.string,
};
