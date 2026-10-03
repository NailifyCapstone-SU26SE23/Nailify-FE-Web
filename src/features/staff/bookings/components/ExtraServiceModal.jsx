import React, { useState } from "react";
import { Search, X, ChevronLeft } from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";

function formatServiceDuration(value, language = "en") {
  return formatDurationMinutes(value, language);
}

export function ExtraServiceModal({
  open,
  services,
  selectedServiceQuantities,
  searchValue,
  isLoading,
  isSaving,
  meta,
  onClose,
  onSearchChange,
  onSearchSubmit,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onPageChange,
  onConfirm,
  activeTab = "services",
  onTabChange,
  totalSelectedCount,
}) {
  if (!open) {
    return null;
  }
  const { language } = useLanguage();
  const normalizedServices = Array.isArray(services) ? services : [];
  const normalizedSelectedServiceQuantities =
    selectedServiceQuantities && typeof selectedServiceQuantities === "object"
      ? selectedServiceQuantities
      : {};

  const selectedCount = totalSelectedCount !== undefined 
    ? totalSelectedCount 
    : Object.values(normalizedSelectedServiceQuantities).reduce((sum, value) => {
        const quantity = Number(value || 0);
        return quantity > 0 ? sum + quantity : sum;
      }, 0);
  const isVi = language === "vi";
  const [selectedDesign, setSelectedDesign] = useState(null);

  const handleTabChange = (tab) => {
    setSelectedDesign(null);
    if (onTabChange) onTabChange(tab);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2f1c2e]/45 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[#f1cddd] bg-white shadow-[0_24px_60px_rgba(63,43,63,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5 pb-0">
          <div className="w-full">
            <div className="flex w-full items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#3f2b3f]">{language === "vi" ? "Thêm dịch vụ phụ" : "Add Extra Service"}</h3>
                <p className="mt-1 text-sm text-[#a88a9d]">{language === "vi" ? "Chọn một hoặc nhiều dịch vụ đang hoạt động và thêm vào lịch hẹn này." : "Select one or more active services and append them to this booking."}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff5f8]"
              >
                <X size={16} />
              </button>
            </div>
            {onTabChange && (
              <div className="mt-5 flex gap-6">
                <button
                  type="button"
                  onClick={() => handleTabChange("services")}
                  className={`border-b-2 pb-3 text-sm font-bold transition ${activeTab === "services" ? "border-[#ea4f93] text-[#ea4f93]" : "border-transparent text-[#a88a9d] hover:text-[#3f2b3f]"}`}
                >
                  {isVi ? "Dịch vụ thường" : "Services"}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("variants")}
                  className={`border-b-2 pb-3 text-sm font-bold transition ${activeTab === "variants" ? "border-[#ea4f93] text-[#ea4f93]" : "border-transparent text-[#a88a9d] hover:text-[#3f2b3f]"}`}
                >
                  {isVi ? "Mẫu móng (Nail Art)" : "Nail Variants"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3">
              <Search size={16} className="text-[#ea4f93]" />
              <input
                value={searchValue}
                onChange={onSearchChange}
                placeholder={isVi ? "Tìm kiếm tên dịch vụ..." : "Search service name..."}
                className="w-full bg-transparent text-sm text-[#3f2b3f] outline-none placeholder:text-[#c59ab0]"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white"
            >
              {isVi ? "Tìm kiếm" : "Search"}
            </button>
          </form>

          {activeTab === "variants" && selectedDesign && (
            <div className="mb-4 mt-2 flex items-center gap-3">
              <button onClick={() => setSelectedDesign(null)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] hover:bg-[#fff5f8]">
                <ChevronLeft size={16} />
              </button>
              <h4 className="font-bold text-[#3f2b3f]">{selectedDesign.name}</h4>
            </div>
          )}

          <div className={activeTab === "variants" ? "mt-2 grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3" : "mt-5 space-y-3 pr-1"}>
            {isLoading ? (
              <div className="rounded-lg border border-dashed border-[#f1cade] bg-[#fff8fb] px-4 py-10 text-center text-sm font-medium text-[#a88a9d]">
                {isVi ? "Đang tải dịch vụ..." : "Loading services..."}
              </div>
            ) : (() => {
              const itemsToRender = activeTab === "variants" && selectedDesign 
                ? (Array.isArray(selectedDesign.nailVariants) ? selectedDesign.nailVariants : []).map(v => ({
                    serviceId: String(v.nailVariantId).trim(),
                    name: String(v.name).trim(),
                    price: Number(v.price),
                    duration: Number(v.duration),
                    imageUrl: String(v.imageUrl || selectedDesign.imageUrl || "").trim(),
                    categories: [],
                    status: String(v.status || "Active"),
                    isVariantItem: true,
                  }))
                : normalizedServices;
                
              if (!itemsToRender.length) {
                return (
                  <div className="col-span-full rounded-lg border border-dashed border-[#f1cade] bg-[#fff8fb] px-4 py-10 text-center text-sm font-medium text-[#a88a9d]">
                    {isVi ? "Không tìm thấy dịch vụ nào." : "No services found."}
                  </div>
                );
              }
              
              return itemsToRender.map((service) => {
                const selectedQuantity = Number(normalizedSelectedServiceQuantities?.[service.serviceId] || 0);
                const isSelected = selectedQuantity > 0;

                if (activeTab === "variants") {
                  if (!selectedDesign) {
                    return (
                      <div
                        key={service.serviceId}
                        onClick={() => setSelectedDesign(service)}
                        className="relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#f3d5e2] bg-white transition hover:border-[#ea4f93] hover:shadow-[0_8px_16px_rgba(236,72,153,0.12)]"
                      >
                        <div className="relative aspect-[4/3] w-full bg-[#fceef5]">
                          {service.imageUrl ? (
                            <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[#c59ab0]">No image</div>
                          )}
                          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f9e5b] backdrop-blur-sm shadow-sm">
                            {language === "vi" ? (String(service.status).toLowerCase() === "active" ? "Hoạt động" : String(service.status).toLowerCase() === "inactive" ? "Ngừng hoạt động" : service.status) : service.status}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-4 bg-white">
                          <h4 className="font-bold text-[#3f2b3f] line-clamp-1">{service.name}</h4>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Array.isArray(service.categories) && service.categories.slice(0, 3).map((cat, i) => (
                              <span key={i} className="rounded-full bg-[#fff4da] px-2 py-0.5 text-[10px] font-medium text-[#bd8517]">
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={service.serviceId}
                        className={`relative flex flex-col overflow-hidden rounded-2xl border transition ${isSelected
                          ? "border-[#ea4f93] shadow-[0_8px_16px_rgba(236,72,153,0.12)]"
                          : "border-[#f3d5e2] bg-white hover:shadow-md"
                        }`}
                      >
                        <div className="relative aspect-[4/3] w-full bg-[#fceef5]">
                          {service.imageUrl ? (
                            <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[#c59ab0]">No image</div>
                          )}
                          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f9e5b] backdrop-blur-sm shadow-sm">
                            {language === "vi" ? (String(service.status).toLowerCase() === "active" ? "Hoạt động" : String(service.status).toLowerCase() === "inactive" ? "Ngừng hoạt động" : service.status) : service.status}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-4 bg-white">
                          <h4 className="font-bold text-[#3f2b3f] line-clamp-1">{service.name}</h4>
                          <div className="mt-auto pt-4 flex items-end justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#ea4f93]">{new Intl.NumberFormat("vi-VN").format(service.price)} VND</span>
                              <span className="text-xs font-medium text-[#8b5cf6]">{formatServiceDuration(service.duration, language)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onDecreaseQuantity(service.serviceId)}
                                disabled={selectedQuantity <= 0}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-base font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#fff5f8]"
                              >
                                -
                              </button>
                              <span className="min-w-[1.25rem] text-center text-sm font-bold text-[#3f2b3f]">
                                {selectedQuantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onIncreaseQuantity(service.serviceId)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ea4f93] bg-[#fff1f7] text-base font-bold text-[#ea4f93] hover:bg-[#fceef5]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }

                return (
                  <div
                    key={service.serviceId}
                    className={`w-full rounded-lg border px-4 py-4 text-left transition ${isSelected
                      ? "border-[#ea4f93] bg-[#fff1f7] shadow-[0_14px_28px_rgba(236,72,153,0.12)]"
                      : "border-[#f3d5e2] bg-white hover:bg-[#fff8fb]"
                      }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#3f2b3f]">{service.name}</p>
                        <p className="mt-1 text-xs text-[#a88a9d]">
                          {service.description || "No description provided."}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 rounded-full border border-[#cdeed7] bg-[#effcf3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1f9e5b]">
                        {language === "vi" ? (String(service.status).toLowerCase() === "active" ? "Hoạt động" : String(service.status).toLowerCase() === "inactive" ? "Ngừng hoạt động" : service.status) : service.status}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between ">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#fff4da] px-3 py-2 text-[11px] font-bold text-[#bd8517]">
                          {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(service.price)} VND
                        </span>
                        <span className="rounded-full bg-[#f7efff] px-3 py-2 text-[11px] font-bold text-[#8b5cf6]">
                          {formatServiceDuration(service.duration, language)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => onDecreaseQuantity(service.serviceId)}
                          disabled={selectedQuantity <= 0}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-lg font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold text-[#3f2b3f]">
                          {selectedQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onIncreaseQuantity(service.serviceId)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ea4f93] bg-[#fff1f7] text-lg font-bold text-[#ea4f93]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            })()}
          </div>
        </div>

        <div className="shrink-0 bg-white">
          <div className="flex flex-col gap-3 border-t border-[#f7dfeb] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#a88a9d]">
              {isVi ? "Hiển thị " + meta?.firstRowOnPage ?? 0 : "Showing"} {meta?.firstRowOnPage ?? 0}-{meta?.lastRowOnPage ?? 0} of {meta?.totalItems ?? 0} services
            </p>
            <p className="text-xs font-bold text-[#ea4f93]">
              {isVi ? "Đã chọn: " : "Selected: "} {selectedCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange((meta?.currentPage ?? 1) - 1)}
                disabled={!meta?.hasPrevious || isLoading}
                className="rounded-xl border border-[#f2bfd4] bg-white px-3 py-2 text-xs font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isVi ? "Trước đó" : "Previous"}
              </button>
              <span className="text-xs font-bold text-[#866f80]">
                {isVi ? "Trang " : "Page "} {meta?.currentPage ?? 1}/{meta?.totalPages ?? 1}
              </span>
              <button
                type="button"
                onClick={() => onPageChange((meta?.currentPage ?? 1) + 1)}
                disabled={!meta?.hasNext || isLoading}
                className="rounded-xl border border-[#f2bfd4] bg-white px-3 py-2 text-xs font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isVi ? "Tiếp theo" : "Next"}
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#f7dfeb] px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#f2bfd4] bg-white px-5 py-3 text-sm font-bold text-[#ea4f93]"
            >
              {isVi ? "Hủy" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={selectedCount <= 0 || isSaving || isLoading}
              className="rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (language === "vi" ? "Đang thêm dịch vụ..." : "Adding Services...") : (language === "vi" ? "Thêm dịch vụ" : "Add Services")}
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
  onDecreaseQuantity: PropTypes.func.isRequired,
  onIncreaseQuantity: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  searchValue: PropTypes.string.isRequired,
  selectedServiceQuantities: PropTypes.objectOf(PropTypes.number).isRequired,
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
