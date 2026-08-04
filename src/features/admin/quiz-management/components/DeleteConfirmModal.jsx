import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Trash2 } from "lucide-react";

/**
 * DeleteConfirmModal
 *
 * Props:
 *   isOpen      – boolean  – controls visibility
 *   isDeleting  – boolean  – shows loading spinner on confirm button
 *   title       – string   – modal heading  (default: "Delete Question")
 *   description – string   – body text below the heading
 *   onConfirm   – () => void – called when user clicks "Delete"
 *   onCancel    – () => void – called on "Cancel" or backdrop click
 */
export function DeleteConfirmModal({
    isOpen,
    isDeleting = false,
    title = "Delete Question",
    description = "This action cannot be undone. The question and all its answer choices will be permanently removed.",
    onConfirm,
    onCancel,
}) {
    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (e.key === "Escape" && !isDeleting) onCancel?.();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, isDeleting, onCancel]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="delete-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-50 bg-[#1a0d14]/60 backdrop-blur-[3px]"
                        onClick={() => { if (!isDeleting) onCancel?.(); }}
                    />

                    {/* Modal Card */}
                    <motion.div
                        key="delete-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 12 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-[#f5e3ed] bg-white shadow-[0_32px_64px_-16px_rgba(50,28,41,0.35)]"
                    >
                        {/* Accent bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-[#ea4f93] to-[#f97bb7]" />

                        <div className="relative p-7">
                            {/* Close button */}
                            <button
                                onClick={() => { if (!isDeleting) onCancel?.(); }}
                                disabled={isDeleting}
                                aria-label="Close"
                                className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full text-[#c9a7be] transition hover:bg-[#fff0f6] hover:text-[#d14c84] disabled:opacity-40"
                            >
                                <X size={14} />
                            </button>

                            {/* Warning icon */}
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f3] shadow-[0_8px_16px_-4px_rgba(234,79,147,0.2)]">
                                <AlertTriangle size={26} className="text-[#d14c84]" strokeWidth={2.2} />
                            </div>

                            {/* Text */}
                            <h2
                                id="delete-modal-title"
                                className="mb-2  text-[1.25rem] leading-snug text-[#3f2034]"
                            >
                                {title}
                            </h2>
                            <p className="text-[13px] leading-relaxed text-[#8c7484]">
                                {description}
                            </p>

                            {/* Divider */}
                            <div className="my-5 h-px bg-[#f5e3ed]" />

                            {/* Actions */}
                            <div className="flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => { if (!isDeleting) onCancel?.(); }}
                                    disabled={isDeleting}
                                    className="flex-1 rounded-xl border border-[#f0dde8] bg-[#fffbfc] py-2.5 text-[13px] font-bold text-[#8c7484] transition hover:bg-[#fff0f6] hover:text-[#c95b90] disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    disabled={isDeleting}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d14c84] to-[#ea4f93] py-2.5 text-[13px] font-extrabold text-white shadow-[0_8px_16px_-4px_rgba(234,79,147,0.45)] transition hover:from-[#bb4476] hover:to-[#d14c84] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                            Deleting…
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={13} strokeWidth={2.5} />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default DeleteConfirmModal;
