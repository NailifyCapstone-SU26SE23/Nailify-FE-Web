export const TransactionKind = {
    WalletTopUp: "WALLET_TOP_UP",
    WalletPayment: "WALLET_PAYMENT",
    PayOSPayment: "PAYOS_PAYMENT",
    CashPayment: "CASH_PAYMENT", 
};

export const TRANSACTION_LABELS = {
    vi: {
        walletTopUp: "Nạp tiền vào Ví",
        walletPayment: "Thanh toán bằng Ví",
        payosPayment: "Chuyển khoản",
        cashPayment: "Tiền mặt",
        paidAt: "Thanh toán lúc",
    },
    en: {
        walletTopUp: "Wallet Top up",
        walletPayment: "Wallet Payment",
        payosPayment: "Bank Transfer",
        cashPayment: "Cash Payment",
        paidAt: "Paid At",
    },
};

const TRANSACTION_CONFIG = {
    [TransactionKind.WalletTopUp]: {
        labelKey: "walletTopUp",
        badge: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    },
    [TransactionKind.WalletPayment]: {
        labelKey: "walletPayment",
        badge: "bg-violet-50 text-violet-600 ring-violet-100",
    },
    [TransactionKind.CashPayment]: {
        labelKey: "cashPayment",
        badge: "bg-amber-50 text-amber-600 ring-amber-100",
    },
    [TransactionKind.PayOSPayment]: {
        labelKey: "payosPayment",
        badge: "bg-sky-50 text-sky-600 ring-sky-100",
    },
};

export const getTransactionKind = (walletId, paymentLinkId) => {
    if (walletId != null) return TransactionKind.WalletTopUp;
    if (paymentLinkId === "WALLET_PAYMENT") return TransactionKind.WalletPayment;
    if (!paymentLinkId) return TransactionKind.CashPayment;
    return TransactionKind.PayOSPayment;
};

export function TransactionBadge({
    walletId,
    paymentLinkId,
    language = "vi",
    className = "",
}) {
    const kind = getTransactionKind(walletId, paymentLinkId);
    if (!kind) return null;

    const { labelKey, badge } = TRANSACTION_CONFIG[kind];
    const label = TRANSACTION_LABELS[language]?.[labelKey];
    if (!label) return null;

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5
                  text-[12px] font-medium ring-1 ring-inset
                  ${badge} ${className}`}
        >
            {label}
        </span>
    );
}