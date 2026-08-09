import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  USER_BRANCH_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_FILTERS,
} from "../services/mockUsers";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";

const isSalonRole = (role) => {
  const normalized = String(role || "").trim().toLowerCase();
  return ["staff", "staff_artist", "receptionist", "manager"].includes(normalized);
};

const FORM_STATUS_OPTIONS = USER_STATUS_FILTERS.filter((item) => item !== "All");
const INPUT_CLASSNAME =
  "w-full rounded-2xl border border-[#f1d7c0] bg-[#fffdfb] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4]";
const DISABLED_INPUT_CLASSNAME = "cursor-not-allowed bg-[#f9f1ea] text-[#8f7c6d]";

const getRoleLabel = (role, t) => {
  switch (String(role).trim().toLowerCase()) {
    case "admin":
      return t("superAdmin");
    case "manager":
      return t("salonManager");
    case "receptionist":
      return t("receptionist");
    case "staff":
    case "staff_artist":
      return t("nailArtist");
    default:
      return role;
  }
};

const getStatusLabel = (status, t) => {
  switch (status) {
    case "Active":
      return t("userManagement.detail.statusActive");
    case "Inactive":
      return t("userManagement.detail.statusInactive");
    case "Pending":
      return t("userManagement.detail.statusPending");
    case "Suspended":
      return t("userManagement.detail.statusSuspended");
    default:
      return status;
  }
};

export function UserManagementFormFields({
  formValues,
  onFieldChange,
  disabled = false,
  showAccountFields = false,
  createApiFieldsOnly = false,
  updateApiFieldsOnly = false,
}) {
  const { t, language } = useLanguage();
  const [salons, setSalons] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadSalons = async () => {
      try {
        const response = await fetchAdminSalons({ pageSize: 100 });
        if (isMounted) {
          setSalons(response.items || []);
        }
      } catch (error) {
        console.error("Failed to load salons in form fields:", error);
      }
    };
    void loadSalons();
    return () => {
      isMounted = false;
    };
  }, []);
  if (createApiFieldsOnly) {
    return (
      <>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.firstName")}</span>
          <input
            value={formValues.firstName}
            onChange={onFieldChange("firstName")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterFirstName")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.lastName")}</span>
          <input
            value={formValues.lastName}
            onChange={onFieldChange("lastName")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterLastName")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.email")}</span>
          <input
            value={formValues.email}
            onChange={onFieldChange("email")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterEmail")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.password")}</span>
          <input
            type="password"
            value={formValues.password}
            onChange={onFieldChange("password")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterPassword")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.phoneLabel")}</span>
          <input
            value={formValues.phone}
            onChange={onFieldChange("phone")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterPhone")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.avatarUrl")}</span>
          <input
            value={formValues.avatarUrl}
            onChange={onFieldChange("avatarUrl")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterAvatarUrl")}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.role")}</span>
          <select
            value={formValues.role}
            onChange={onFieldChange("role")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          >
            {USER_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {getRoleLabel(role, t)}
              </option>
            ))}
          </select>
        </label>

        {isSalonRole(formValues.role) && (
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              {language === "vi" ? "Chi nhánh Salon" : "Salon Branch"}
            </span>
            <select
              value={formValues.salonId || ""}
              onChange={onFieldChange("salonId")}
              disabled={disabled}
              className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            >
              <option value="">
                {language === "vi" ? "Chọn Salon..." : "Select Salon..."}
              </option>
              {salons.map((salon) => (
                <option key={salon.id} value={salon.id}>
                  {salon.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </>
    );
  }

  if (updateApiFieldsOnly) {
    return (
      <>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.firstName")}</span>
          <input
            value={formValues.firstName}
            onChange={onFieldChange("firstName")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterFirstName")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.lastName")}</span>
          <input
            value={formValues.lastName}
            onChange={onFieldChange("lastName")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterLastName")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.email")}</span>
          <input
            value={formValues.email}
            onChange={onFieldChange("email")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterEmail")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.phoneLabel")}</span>
          <input
            value={formValues.phone}
            onChange={onFieldChange("phone")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterPhone")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.statusLabel")}</span>
          <select
            value={formValues.status}
            onChange={onFieldChange("status")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          >
            {FORM_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status, t)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.role")}</span>
          <input
            value={getRoleLabel(formValues.role, t)}
            disabled
            className={`${INPUT_CLASSNAME} ${DISABLED_INPUT_CLASSNAME}`}
            placeholder={t("userManagement.detail.role")}
          />
        </label>

        {isSalonRole(formValues.role) && (
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              {language === "vi" ? "Chi nhánh Salon" : "Salon Branch"}
            </span>
            <select
              value={formValues.salonId || ""}
              onChange={onFieldChange("salonId")}
              disabled={disabled}
              className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            >
              <option value="">
                {language === "vi" ? "Chọn Salon..." : "Select Salon..."}
              </option>
              {salons.map((salon) => (
                <option key={salon.id} value={salon.id}>
                  {salon.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </>
    );
  }

  return (
    <>
      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          {t("userManagement.detail.fullName")}
        </span>
        <input
          value={formValues.name}
          onChange={onFieldChange("name")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder={t("userManagement.detail.enterFullName")}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.email")}</span>
        <input
          value={formValues.email}
          onChange={onFieldChange("email")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder={t("userManagement.detail.enterEmail")}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.phoneLabel")}</span>
        <input
          value={formValues.phone}
          onChange={onFieldChange("phone")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder={t("userManagement.detail.enterPhone")}
        />
      </label>

      {showAccountFields ? (
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.password")}</span>
          <input
            type="password"
            value={formValues.password}
            onChange={onFieldChange("password")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterPassword")}
          />
        </label>
      ) : null}

      {showAccountFields ? (
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.avatarUrl")}</span>
          <input
            value={formValues.avatarUrl}
            onChange={onFieldChange("avatarUrl")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
            placeholder={t("userManagement.detail.enterAvatarUrl")}
          />
        </label>
      ) : null}

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          {t("userManagement.detail.joinedDate")}
        </span>
        <input
          type="date"
          value={formValues.joinedAt}
          onChange={onFieldChange("joinedAt")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.role")}</span>
        <select
          value={formValues.role}
          onChange={onFieldChange("role")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        >
          {USER_ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {getRoleLabel(role, t)}
            </option>
          ))}
        </select>
      </label>

      {isSalonRole(formValues.role) && (
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            {language === "vi" ? "Chi nhánh Salon" : "Salon Branch"}
          </span>
          <select
            value={formValues.salonId || ""}
            onChange={onFieldChange("salonId")}
            disabled={disabled}
            className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          >
            <option value="">
              {language === "vi" ? "Chọn Salon..." : "Select Salon..."}
            </option>
            {salons.map((salon) => (
              <option key={salon.id} value={salon.id}>
                {salon.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.statusLabel")}</span>
        <select
          value={formValues.status}
          onChange={onFieldChange("status")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        >
          {FORM_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel(status, t)}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          {t("userManagement.detail.lastActive")}
        </span>
        <input
          value={formValues.lastActive}
          onChange={onFieldChange("lastActive")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder={t("userManagement.detail.enterLastActive")}
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">{t("userManagement.detail.notes")}</span>
        <textarea
          value={formValues.notes}
          onChange={onFieldChange("notes")}
          rows={5}
          disabled={disabled}
          className={`w-full rounded-[22px] border border-[#f1d7c0] bg-[#fffdfb] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4] ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder={t("userManagement.detail.addInternalNotes")}
        />
      </label>
    </>
  );
}

UserManagementFormFields.propTypes = {
  formValues: PropTypes.shape({
    avatarUrl: PropTypes.string,
    branch: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    joinedAt: PropTypes.string.isRequired,
    lastName: PropTypes.string,
    lastActive: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    notes: PropTypes.string.isRequired,
    password: PropTypes.string,
    phone: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    salonId: PropTypes.string,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  createApiFieldsOnly: PropTypes.bool,
  showAccountFields: PropTypes.bool,
  updateApiFieldsOnly: PropTypes.bool,
};
