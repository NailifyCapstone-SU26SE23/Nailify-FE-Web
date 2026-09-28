import { Avatar, Button, Modal, Spin, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import {
  getWalletReferenceTypeLabel,
  getWalletTransactionStatusColor,
  getWalletTransactionStatusLabel,
  getWalletTransactionTypeColor,
  getWalletTransactionTypeLabel,
} from "../utils/walletTransactionUtils";

const { Text } = Typography;

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a88a9f]">
        {label}
      </span>
      <div className="min-w-0 text-right text-sm font-semibold text-[#2d1b35]">{children}</div>
    </div>
  );
}

export function WalletTransactionDetailModal({
  open,
  loading,
  transaction,
  walletOwner,
  onClose,
  t,
  language,
}) {
  return (
    <Modal
      centered
      open={open}
      onCancel={onClose}
      footer={null}
      width={940}
      destroyOnHidden
    >
      {loading ? (
        <div className="flex justify-center p-12">
          <Spin />
        </div>
      ) : transaction ? (
        <div className="grid max-h-[76vh] gap-5 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px] p-4">
          <section>
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ea4f93]">
                  {t("walletTransactions.transactionInformation")}
                </div>
              </div>
              <Tag color={getWalletTransactionStatusColor(transaction.status)} className="!rounded-full !text-xs !font-bold">
                {getWalletTransactionStatusLabel(transaction.status, language)}
              </Tag>
            </div>

            <div className="mb-2 rounded-2xl border border-[#f5e2ec] bg-[#fff9fb] p-5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a88a9f]">
                {t("walletTransactions.amount")}
              </div>
              <div className={`mt-1 font-mono text-4xl font-bold tracking-tight ${Number(transaction.amount) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {formatCurrency(transaction.amount)}
              </div>
            </div>

            <div>
              <DetailRow label={t("walletTransactions.balanceBefore")}>
                <span className="font-mono">{formatCurrency(transaction.balanceBefore)}</span>
              </DetailRow>
              <DetailRow label={t("walletTransactions.balanceAfter")}>
                <span className="font-mono">{formatCurrency(transaction.balanceAfter)}</span>
              </DetailRow>
              <DetailRow label={t("walletTransactions.type")}>
                <Tag color={getWalletTransactionTypeColor(transaction.type)} className="!m-0 !rounded-full !font-bold">
                  {getWalletTransactionTypeLabel(transaction.type, language)}
                </Tag>
              </DetailRow>
              <DetailRow label={t("walletTransactions.referenceType")}>
                {getWalletReferenceTypeLabel(transaction.referenceType, language)}
              </DetailRow>
              <DetailRow label={t("walletTransactions.createdAt")}>
                <span className="font-mono">{transaction.createdAt ? dayjs(transaction.createdAt).format("YYYY-MM-DD HH:mm") : "-"}</span>
              </DetailRow>
              <DetailRow label={t("walletTransactions.descriptionField")}>
                <span className="text-right leading-relaxed">{transaction.description || "-"}</span>
              </DetailRow>
            </div>
          </section>

          <aside className="flex h-full flex-col">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ea4f93]">
              {t("walletTransactions.walletOwner")}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
              {walletOwner ? (
                <div className="flex w-full flex-col items-center text-center">
                  <Avatar
                    src={walletOwner.avatarUrl}
                    size={200}
                    className="!border-4 !border-[#fff2f7] !bg-[#fff2f7] !text-3xl !font-bold !text-[#ea4f93] shadow-[0_12px_30px_rgba(234,79,147,0.16)]"
                  >
                    {!walletOwner.avatarUrl && walletOwner.firstName?.charAt(0)}
                  </Avatar>
                  <div className="mt-4 max-w-full">
                    <div className="truncate text-xl font-bold text-[#2d1b35]">
                      {[walletOwner.firstName, walletOwner.lastName].filter(Boolean).join(" ") || "-"}
                    </div>
                    <div className="mt-1 truncate text-md font-medium text-[#a88a9f]">
                      {walletOwner.email || "-"}
                    </div>
                    <div className="mt-1 truncate text-md font-medium text-[#a88a9f]">
                      {walletOwner.phone || "-"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  {t("walletTransactions.walletOwnerUnavailable")}
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex justify-center p-10">
          <Text type="secondary">{t("walletTransactions.detailLoadFailed")}</Text>
        </div>
      )}
    </Modal>
  );
}
