import { PAYMENT_METHOD } from './statusFormatters';

export const getTransactionKind = (walletId, paymentLinkId) => {
    if (walletId != null) return "Nạp tiền vào ví";
    if (paymentLinkId === "WALLET_PAYMENT") return "Rút tiền từ ví";
    if (!paymentLinkId) return "Tiền mặt";
    return "Chuyển khoản";
};

export function TransactionBadge({
    walletId,
    paymentLinkId,
    language = "vi",
    className = "",
}) {
    const kind = getTransactionKind(walletId, paymentLinkId);
    if (!kind) return null;

    const config = PAYMENT_METHOD[kind];
    if (!config) return null;

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium border ${config.tone} ${className}`}
        >
            {config[language]}
        </span>
    );
}