import { X, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { receptionistWalkInBookingService } from "./../services/receptionistWalkInBookingService";

function formatVND(amount) {
  if (!amount) return "0 VND";
  return amount.toLocaleString("vi-VN") + " VND";
}

export function NailVariantSelectionModal({
  isOpen,
  onClose,
  nailDesign,
  onSelectVariant,
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && nailDesign) {
      setSelectedVariantId(null);
      setIsLoading(true);
      receptionistWalkInBookingService
        .getNailVariantsByDesignId(nailDesign.nailDesignId)
        .then((res) => setVariants(res.data?.items || []))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, nailDesign]);

  if (!isOpen || !nailDesign) return null;


  const handleConfirm = () => {
    const variant = variants.find((v) => v.nailVariantId === selectedVariantId);
    if (variant) {
      onSelectVariant(variant);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-3xl overflow-hidden rounded-[24px] border border-[#f5d6e3] bg-white shadow-2xl animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center justify-between border-b border-[#f5d6e3] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#412643]">Select Nail Variant</h2>
            <p className="mt-1 text-sm text-[#c092a8]">
              Choose a specific variant for {nailDesign.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#fff4f8] p-2 text-[#ea4f93] hover:bg-[#ffe1ec]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#b48ca0]">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#ea4f93]" />
              <p>Loading variants...</p>
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center text-[#b48ca0]">
              No variants available for this design.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {variants.map((variant) => {
                const isSelected = selectedVariantId === variant.nailVariantId;
                return (
                  <button
                    key={variant.nailVariantId}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.nailVariantId)}
                    className={`relative overflow-hidden rounded-[16px] border bg-white text-left transition ${isSelected
                        ? "border-[#ea4f93] shadow-[0_4px_12px_rgba(236,72,153,0.15)] ring-2 ring-[#ea4f93] ring-offset-2"
                        : "border-[#f5d6e3] hover:border-[#ea4f93]"
                      }`}
                  >
                    <div className="h-28 overflow-hidden bg-gray-50">
                      <img
                        src={variant.imageUrl || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80"}
                        alt={variant.name || "Variant"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-[#432744]">
                        {variant.name || "Standard"}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#ea4f93]">
                        {formatVND(variant.price)}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#ea4f93] text-white">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#f5d6e3] bg-[#fffafc] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#f3d0de] bg-white px-5 py-2.5 text-sm font-bold text-[#ea4f93] hover:bg-[#fff4f8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedVariantId}
            className="rounded-xl bg-[image:var(--gradient-accent)] px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_16px_rgba(236,72,153,0.15)] disabled:opacity-50"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
