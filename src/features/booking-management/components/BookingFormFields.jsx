import {
  BOOKING_BRANCH_OPTIONS,
  BOOKING_CHANNEL_OPTIONS,
  BOOKING_PAYMENT_OPTIONS,
  BOOKING_SERVICE_OPTIONS,
  BOOKING_STAFF_OPTIONS,
  BOOKING_STATUS_FILTERS,
} from "../services/mockBookings";
import { PropTypes } from "../../../shared/utils/propTypes";

function FieldShell({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--color-ink)]">
        {label}
      </span>
      {hint ? (
        <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-[#b38769]">
          {hint}
        </span>
      ) : null}
      <div className="mt-3">{children}</div>
    </label>
  );
}

FieldShell.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function getFieldClassName(disabled, isTextarea = false) {
  return [
    "w-full border border-[#f1d7c0] bg-[#fffdfb] text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4]",
    isTextarea
      ? "min-h-[140px] rounded-[22px] px-4 py-3"
      : "rounded-full px-4 py-3",
    disabled ? "cursor-not-allowed bg-[#f8f2ec] text-[#8e7e73]" : "",
  ].join(" ");
}

export function BookingFormFields({
  formValues,
  onFieldChange,
  disabled = false,
}) {
  return (
    <>
      <FieldShell label="Booking ID" hint="Reference code">
        <input
          value={formValues.id}
          onChange={onFieldChange("id")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        />
      </FieldShell>
      <FieldShell label="Customer name" hint="Guest profile">
        <input
          value={formValues.customerName}
          onChange={onFieldChange("customerName")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        />
      </FieldShell>
      <FieldShell label="Phone number" hint="Contact">
        <input
          value={formValues.customerPhone}
          onChange={onFieldChange("customerPhone")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        />
      </FieldShell>
      <FieldShell label="Branch" hint="Service location">
        <select
          value={formValues.branch}
          onChange={onFieldChange("branch")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        >
          {BOOKING_BRANCH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldShell>
      <FieldShell label="Service" hint="Booked treatment">
        <select
          value={formValues.service}
          onChange={onFieldChange("service")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        >
          {BOOKING_SERVICE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldShell>
      <FieldShell label="Assigned staff" hint="Technician">
        <select
          value={formValues.staffName}
          onChange={onFieldChange("staffName")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        >
          {BOOKING_STAFF_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldShell>
      <FieldShell label="Booking date" hint="YYYY-MM-DD">
        <input
          value={formValues.bookingDate}
          onChange={onFieldChange("bookingDate")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        />
      </FieldShell>
      <FieldShell label="Booking time" hint="Start time">
        <input
          value={formValues.bookingTime}
          onChange={onFieldChange("bookingTime")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        />
      </FieldShell>
      <FieldShell label="Duration" hint="Service length">
        <input
          value={formValues.duration}
          onChange={onFieldChange("duration")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        />
      </FieldShell>
      <FieldShell label="Booking status" hint="Operational state">
        <select
          value={formValues.status}
          onChange={onFieldChange("status")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        >
          {BOOKING_STATUS_FILTERS.filter((option) => option !== "All").map(
            (option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ),
          )}
        </select>
      </FieldShell>
      <FieldShell label="Channel" hint="Lead source">
        <select
          value={formValues.channel}
          onChange={onFieldChange("channel")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        >
          {BOOKING_CHANNEL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldShell>
      <FieldShell label="Payment status" hint="Collection state">
        <select
          value={formValues.paymentStatus}
          onChange={onFieldChange("paymentStatus")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        >
          {BOOKING_PAYMENT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldShell>
      <FieldShell label="Total amount" hint="Mock charge">
        <input
          value={formValues.total}
          onChange={onFieldChange("total")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        />
      </FieldShell>
      <FieldShell label="Created at" hint="Audit trail">
        <input
          value={formValues.createdAt}
          onChange={onFieldChange("createdAt")}
          disabled={disabled}
          className={getFieldClassName(disabled)}
        />
      </FieldShell>
      <div className="md:col-span-2">
        <FieldShell label="Service notes" hint="Customer request and ops note">
          <textarea
            value={formValues.notes}
            onChange={onFieldChange("notes")}
            disabled={disabled}
            className={getFieldClassName(disabled, true)}
          />
        </FieldShell>
      </div>
    </>
  );
}

BookingFormFields.propTypes = {
  formValues: PropTypes.shape({
    bookingDate: PropTypes.string.isRequired,
    bookingTime: PropTypes.string.isRequired,
    branch: PropTypes.string.isRequired,
    channel: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    customerName: PropTypes.string.isRequired,
    customerPhone: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    notes: PropTypes.string.isRequired,
    paymentStatus: PropTypes.string.isRequired,
    service: PropTypes.string.isRequired,
    staffName: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    total: PropTypes.string.isRequired,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
