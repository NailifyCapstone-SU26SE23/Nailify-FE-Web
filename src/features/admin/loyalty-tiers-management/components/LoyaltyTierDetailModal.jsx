import React, { useState, useEffect } from "react";
import {
  X,
  Award,
  Sparkles,
  Percent,
  Layers,
  Users,
  AlertCircle,
  Calendar,
  Lock,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchLoyaltyTierDetail } from "../services/loyaltyTiersManagementService";

export default function LoyaltyTierDetailModal({ isOpen, tierId, onClose }) {
  const [tier, setTier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && tierId) {
      const getDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const detail = await fetchLoyaltyTierDetail(tierId);
          setTier(detail);
        } catch (err) {
          console.error("Failed to load loyalty tier detail:", err);
          setError(err instanceof Error ? err.message : "Failed to load loyalty tier details.");
        } finally {
          setIsLoading(false);
        }
      };
      void getDetail();
    }
  }, [isOpen, tierId]);

  if (!isOpen) return null;

  // Derive gradient colors
  let startColor = tier?.backgroundColor || "#D48138";
  let endColor = tier?.backgroundColor || "#A86F3C";
  if (tier?.colorJson) {
    try {
      const colors = typeof tier.colorJson === "string" ? JSON.parse(tier.colorJson) : tier.colorJson;
      startColor = colors.gradientStart || colors.primary || tier.backgroundColor;
      endColor = colors.gradientEnd || colors.primary || tier.backgroundColor;
    } catch (e) { }
  }

  // Derived mock member count for UI richness
  const getMockMemberCount = (name) => {
    if (!name) return 0;
    const lower = String(name).toLowerCase();
    if (lower.includes("đồng") || lower.includes("bronze")) return 142;
    if (lower.includes("bạc") || lower.includes("silver")) return 88;
    if (lower.includes("vàng") || lower.includes("gold")) return 45;
    if (lower.includes("kim cương") || lower.includes("diamond")) return 14;
    if (lower.includes("bạch kim") || lower.includes("platinum")) return 28;
    return 6;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#291723]/60 backdrop-blur-[4px]"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", damping: 26, stiffness: 240 }}
          className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-[2.5rem] border border-[#fcecf4] bg-white p-7 shadow-[0_24px_50px_rgba(47,20,38,0.18)]"
        >
          {/* Header Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0f6] text-[#ea4f93] hover:bg-[#ffe3f0] hover:scale-105 active:scale-95 transition-all"
            title="Close modal"
          >
            <X size={16} />
          </button>

          {/* Modal Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f6] text-[#ea4f93]">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#3f2034] leading-tight">Loyalty Tier Details</h3>
              <p className="text-[11px] font-semibold text-[#a08998]">System Configuration & Member Perks</p>
            </div>
          </div>

          {isLoading ? (
            /* Skeletal Loading State */
            <div className="space-y-6 py-4 animate-pulse">
              <div className="h-32 rounded-2xl bg-slate-100" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-14 rounded-2xl bg-slate-100" />
                <div className="h-14 rounded-2xl bg-slate-100" />
              </div>
              <div className="h-16 rounded-2xl bg-slate-100" />
            </div>
          ) : error ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle size={32} className="text-red-500 mb-3" />
              <h4 className="text-sm font-bold text-[#3f2034]">{error}</h4>
              <button
                onClick={onClose}
                className="mt-4 rounded-full bg-[#ea4f93] px-6 py-2 text-xs font-bold text-white shadow-sm"
              >
                Close
              </button>
            </div>
          ) : tier ? (
            /* Content State */
            <div className="space-y-5">

              {/* Membership Card Presentation */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${startColor}, ${endColor})`,
                  color: tier.textColor
                }}
                className="relative rounded-3xl p-6 shadow-md overflow-hidden"
              >
                {/* Glassmorphism overlays */}
                <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] opacity-85">
                      Nailify VIP Program
                    </span>
                    <h4 className="mt-3 text-2xl font-bold tracking-tight">{tier.name}</h4>
                    <p className="mt-1 text-[11px] opacity-90 max-w-[240px] truncate">{tier.description || "Active Club Member"}</p>
                  </div>

                  {/* Badge image thumbnail */}
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center overflow-hidden">
                    {tier.imageUrl ? (
                      <img
                        src={tier.imageUrl}
                        alt={`${tier.name} badge`}
                        className="h-13 w-13 object-contain"
                      />
                    ) : (
                      <Award size={28} style={{ color: tier.textColor }} />
                    )}
                  </div>
                </div>

                <div className="relative z-10 mt-6 flex justify-between items-end">
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 block">Points Threshold</span>
                    <span className="text-sm font-bold font-mono mt-0.5 block">
                      {tier.minLifetimePoints.toLocaleString()} - {tier.maxLifetimePoints.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 block">Discount Benefit</span>
                    <span className="text-xl font-bold mt-0.5 block">
                      {tier.discountRate > 0 ? `${tier.discountRate}% OFF` : "Standard Rates"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Grid Details */}
              <div className="grid grid-cols-2 gap-3.5">

                {/* Min points threshold */}
                <div className="rounded-2xl border border-[#fcedf5] bg-[#fffcfd] p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Lock size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-[#a08998] block">Required Min</span>
                    <span className="text-xs font-bold font-mono text-[#3f2034]">{tier.minLifetimePoints.toLocaleString()} pts</span>
                  </div>
                </div>

                {/* Max points threshold */}
                <div className="rounded-2xl border border-[#fcedf5] bg-[#fffcfd] p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-[#a08998] block">Required Max</span>
                    <span className="text-xs font-bold font-mono text-[#3f2034]">{tier.maxLifetimePoints.toLocaleString()} pts</span>
                  </div>
                </div>

                {/* Discount Rate */}
                <div className="rounded-2xl border border-[#fcedf5] bg-[#fffcfd] p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Percent size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-[#a08998] block">Discount Rate</span>
                    <span className="text-xs font-bold text-[#3f2034]">{tier.discountRate}% Markdown</span>
                  </div>
                </div>

                {/* Sort Order */}
                <div className="rounded-2xl border border-[#fcedf5] bg-[#fffcfd] p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Layers size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-[#a08998] block">Sort Priority</span>
                    <span className="text-xs font-bold text-[#3f2034]">Level Rank #{tier.sortOrder}</span>
                  </div>
                </div>
              </div>

              {/* Status & Member Count Row */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Active Status */}
                <div className="rounded-2xl border border-[#fcedf5] bg-[#fffcfd] p-3 flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${tier.status === "Active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}>
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-[#a08998] block">Status</span>
                    <span className={`text-xs font-bold ${tier.status === "Active" ? "text-green-600" : "text-red-500"
                      }`}>{tier.status}</span>
                  </div>
                </div>

                {/* Registered members count */}
                <div className="rounded-2xl border border-[#fcedf5] bg-[#fffcfd] p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-[#a08998] block">Total Members</span>
                    <span className="text-xs font-bold text-[#3f2034]">{getMockMemberCount(tier.name)} Active</span>
                  </div>
                </div>
              </div>

              {/* Description box */}
              {tier.description && (
                <div className="rounded-2xl border border-[#fcedf5] bg-[#fffcfd] p-4">
                  <div className="flex items-center gap-2 mb-2 text-[#7e6074]">
                    <Clock size={13} className="text-[#a08998]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#a08998]">
                      Tier Description / Rule Note
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#7c6374]">
                    {tier.description}
                  </p>
                </div>
              )}

              {/* Close Action footer */}
              <div className="flex gap-2 border-t border-[#fcecf4] pt-4 mt-5">
                <button
                  onClick={onClose}
                  className="w-full inline-flex h-11 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-white font-extrabold text-xs shadow-[0_8px_18px_rgba(235,90,153,0.18)] active:scale-[0.98] transition-transform cursor-pointer"
                >
                  Dismiss Details
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
