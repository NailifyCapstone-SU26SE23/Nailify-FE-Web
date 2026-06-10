import {
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  ADD_ON_TYPE_TONES,
  ADD_ON_TYPES,
  HIGHEST_REVENUE_SERVICES,
  MOST_BOOKED_SERVICES,
  PRICING_ALERTS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_FILTERS,
  SERVICE_CATEGORY_TONES,
  STATUS_OPTIONS,
  buildCategoryBreakdown,
  buildServicePricingSummary,
  createEmptyAddOn,
  createEmptyService,
  createMockAddOn,
  createMockService,
  getAddOnRowsWithUpdates,
  getServiceRowsWithUpdates,
  removeMockAddOnById,
  removeMockServiceById,
  updateMockAddOn,
  updateMockService,
} from "../services/mockServicePricing";

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[14px] ${item.iconClassName}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[1.9rem] font-extrabold leading-none text-[#432744]">{item.value}</p>
      <p className="mt-1 text-xs font-medium text-[#a98097]">{item.label}</p>
      <p className="mt-2 text-[11px] font-bold text-[#20ab77]">{item.note}</p>
    </article>
  );
}

MetricCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.func.isRequired,
    iconClassName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

function Pill({ children, active = false, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold",
        active ? "bg-[#ea4f93] text-white" : "border border-[#f4d5e3] bg-white text-[#8a7082]",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

Pill.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};

function StatusBadge({ status }) {
  const isActive = status === "Active";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
        isActive ? "bg-[#e8faef] text-[#20ab77]" : "bg-[#f2f4f7] text-[#98a2b3]",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isActive ? "bg-[#20ab77]" : "bg-[#b8bec8]",
        ].join(" ")}
      />
      {status}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

function TogglePill({ enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-5 w-9 items-center rounded-full p-0.5 transition",
        enabled ? "bg-[#ea4f93] justify-end" : "bg-[#f6a8cb] justify-start",
      ].join(" ")}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

TogglePill.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
};

function ActionButton({ children, onClick, tone = "default", icon: Icon }) {
  const className =
    tone === "rose"
      ? "border-[#f4c6da] text-[#ea4f93] bg-[#fff8fb]"
      : tone === "violet"
        ? "border-[#d9c6ff] text-[#7c57e9] bg-white"
        : tone === "danger"
          ? "border-[#f5cdd4] text-[#e35b73] bg-white"
          : "border-[#f4d5e3] text-[#8a7082] bg-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-bold ${className}`}
    >
      {Icon ? <Icon size={11} /> : null}
      {children}
    </button>
  );
}

ActionButton.propTypes = {
  children: PropTypes.node,
  icon: PropTypes.func,
  onClick: PropTypes.func,
  tone: PropTypes.string,
};

function SidePanel({ title, children }) {
  return (
    <section className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
      <h3 className="text-sm font-extrabold text-[#432744]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

SidePanel.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string.isRequired,
};

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#b6869f]">
        {label}
      </span>
      {children}
    </label>
  );
}

FormField.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string.isRequired,
};

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#311422]/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-[24px] border border-[#f6d8e6] bg-white shadow-[0_28px_80px_rgba(93,28,63,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#f6dbe7] px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-[#432744]">{title}</h3>
            <p className="mt-1 text-sm text-[#b1859d]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f4d5e3] text-[#a17a91]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

ModalShell.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

function ServiceFormModal({ draft, mode, onChange, onClose, onSubmit, errorMessage }) {
  return (
    <ModalShell
      title={mode === "create" ? "Create Service" : "Edit Service"}
      subtitle="Manage mock service pricing, duration, and availability."
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Service Name">
            <input
              value={draft.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label="Category">
            <select
              value={draft.category}
              onChange={(event) => onChange("category", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Base Price">
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => onChange("price", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label="Duration (Min)">
            <input
              type="number"
              min="5"
              step="5"
              value={draft.duration}
              onChange={(event) => onChange("duration", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label="Status">
            <select
              value={draft.status}
              onChange={(event) => onChange("status", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Add-on Support">
            <button
              type="button"
              onClick={() => onChange("hasAddOn", !draft.hasAddOn)}
              className="flex h-11 w-full items-center justify-between rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658]"
            >
              <span>{draft.hasAddOn ? "Enabled" : "Disabled"}</span>
              <TogglePill enabled={draft.hasAddOn} />
            </button>
          </FormField>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d33b6e]">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#f4d5e3] px-4 py-2 text-sm font-bold text-[#8a7082]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-[image:var(--gradient-accent)] px-5 py-2 text-sm font-bold text-white"
          >
            {mode === "create" ? "Create Service" : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

ServiceFormModal.propTypes = {
  draft: PropTypes.shape({}).isRequired,
  errorMessage: PropTypes.string,
  mode: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

function AddOnFormModal({ draft, mode, onChange, onClose, onSubmit, serviceOptions, errorMessage }) {
  return (
    <ModalShell
      title={mode === "create" ? "Create Add-on" : "Edit Add-on"}
      subtitle="Manage mock add-on pricing and service assignment."
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Add-on Name">
            <input
              value={draft.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label="Type">
            <select
              value={draft.type}
              onChange={(event) => onChange("type", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              {ADD_ON_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Price">
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => onChange("price", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            />
          </FormField>
          <FormField label="Status">
            <select
              value={draft.status}
              onChange={(event) => onChange("status", event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Applied To">
          <select
            value={draft.appliedTo}
            onChange={(event) => onChange("appliedTo", event.target.value)}
            className="h-11 w-full rounded-2xl border border-[#f4d7e5] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"
          >
            <option value="All Services">All Services</option>
            {serviceOptions.map((service) => (
              <option key={service.id} value={service.category}>
                {service.category}
              </option>
            ))}
          </select>
        </FormField>

        {errorMessage ? (
          <div className="rounded-2xl bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d33b6e]">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#f4d5e3] px-4 py-2 text-sm font-bold text-[#8a7082]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-[image:var(--gradient-accent)] px-5 py-2 text-sm font-bold text-white"
          >
            {mode === "create" ? "Create Add-on" : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

AddOnFormModal.propTypes = {
  draft: PropTypes.shape({}).isRequired,
  errorMessage: PropTypes.string,
  mode: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  serviceOptions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

function ConfirmModal({ title, body, onCancel, onConfirm }) {
  return (
    <ModalShell title={title} subtitle="This mock action updates the current UI state only." onClose={onCancel}>
      <div className="space-y-5">
        <p className="text-sm leading-6 text-[#755d70]">{body}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#f4d5e3] px-4 py-2 text-sm font-bold text-[#8a7082]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#e95a86] px-5 py-2 text-sm font-bold text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

ConfirmModal.propTypes = {
  body: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

function getAlertTone(tone) {
  switch (tone) {
    case "amber":
      return { icon: CircleAlert, badge: "bg-[#fff4df] text-[#d9871c]" };
    case "rose":
      return { icon: CircleDollarSign, badge: "bg-[#ffe7ef] text-[#ea4f93]" };
    case "sky":
      return { icon: Sparkles, badge: "bg-[#e6f0ff] text-[#4f7df0]" };
    default:
      return { icon: CircleCheck, badge: "bg-[#e7fbf4] text-[#20ab77]" };
  }
}

function refreshRecords() {
  const services = getServiceRowsWithUpdates();
  const addOns = getAddOnRowsWithUpdates();

  return { services, addOns };
}

export function ServicePricingManagementPage() {
  const [records, setRecords] = useState(refreshRecords);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [flashMessage, setFlashMessage] = useState("");
  const [serviceModal, setServiceModal] = useState({ open: false, mode: "create", recordId: null });
  const [addOnModal, setAddOnModal] = useState({ open: false, mode: "create", recordId: null });
  const [deleteState, setDeleteState] = useState(null);
  const [serviceDraft, setServiceDraft] = useState(createEmptyService);
  const [addOnDraft, setAddOnDraft] = useState(createEmptyAddOn);
  const [serviceError, setServiceError] = useState("");
  const [addOnError, setAddOnError] = useState("");

  const { services, addOns } = records;

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory = activeCategory === "All" || service.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        [service.name, service.category, service.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, services]);

  const summaryCards = useMemo(
    () => buildServicePricingSummary(services, addOns),
    [services, addOns],
  );

  const categoryBreakdown = useMemo(() => buildCategoryBreakdown(services), [services]);

  const addOnAppliedToOptions = useMemo(
    () =>
      Array.from(
        new Map(services.map((service) => [service.category, service])).values(),
      ),
    [services],
  );

  const syncRecords = (message = "") => {
    setRecords(refreshRecords());
    setFlashMessage(message);
  };

  const openCreateService = () => {
    setServiceDraft(createEmptyService());
    setServiceError("");
    setServiceModal({ open: true, mode: "create", recordId: null });
  };

  const openEditService = (service) => {
    setServiceDraft({
      name: service.name,
      category: service.category,
      price: String(service.price),
      duration: String(service.duration),
      hasAddOn: service.hasAddOn,
      status: service.status,
    });
    setServiceError("");
    setServiceModal({ open: true, mode: "edit", recordId: service.id });
  };

  const openCreateAddOn = () => {
    setAddOnDraft(createEmptyAddOn());
    setAddOnError("");
    setAddOnModal({ open: true, mode: "create", recordId: null });
  };

  const openEditAddOn = (addOn) => {
    setAddOnDraft({
      name: addOn.name,
      type: addOn.type,
      price: String(addOn.price),
      appliedTo: addOn.appliedTo,
      status: addOn.status,
    });
    setAddOnError("");
    setAddOnModal({ open: true, mode: "edit", recordId: addOn.id });
  };

  const submitServiceForm = () => {
    const result =
      serviceModal.mode === "create"
        ? createMockService(serviceDraft)
        : updateMockService(serviceModal.recordId, serviceDraft);

    if (!result.success) {
      setServiceError(result.message);
      return;
    }

    setServiceModal({ open: false, mode: "create", recordId: null });
    setServiceError("");
    syncRecords(result.message);
  };

  const submitAddOnForm = () => {
    const result =
      addOnModal.mode === "create"
        ? createMockAddOn(addOnDraft)
        : updateMockAddOn(addOnModal.recordId, addOnDraft);

    if (!result.success) {
      setAddOnError(result.message);
      return;
    }

    setAddOnModal({ open: false, mode: "create", recordId: null });
    setAddOnError("");
    syncRecords(result.message);
  };

  const handleToggleServiceAddOn = (service) => {
    const result = updateMockService(service.id, {
      name: service.name,
      category: service.category,
      price: String(service.price),
      duration: String(service.duration),
      hasAddOn: !service.hasAddOn,
      status: service.status,
    });

    if (!result.success) {
      setFlashMessage(result.message);
      return;
    }

    syncRecords(`${service.name} add-on support updated.`);
  };

  return (
    <>
      <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4fa_100%)]">
        <div className="flex flex-col gap-3 rounded-[20px] border border-[#f8deea] bg-white/70 p-4 shadow-[0_12px_26px_rgba(236,72,153,0.05)] lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8eb0]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services or pricing..."
              className="h-10 w-full rounded-full border border-[#f4d7e5] bg-[#fffafc] pl-11 pr-4 text-sm text-[#5b4658] outline-none placeholder:text-[#d4a1b8] focus:border-[#ea4f93]"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateAddOn}
              className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <Plus size={13} className="mr-1.5 inline" />
              Add Add-on
            </button>
            <button
              type="button"
              onClick={openCreateService}
              className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
            >
              <Plus size={13} className="mr-1.5 inline" />
              Add Service
            </button>
          </div>
        </div>

        {flashMessage ? (
          <div className="rounded-[18px] border border-[#d8f5e7] bg-[#eefcf5] px-4 py-3 text-sm font-medium text-[#16975f]">
            {flashMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORY_FILTERS.map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)}>
              <Pill active={category === activeCategory}>{category}</Pill>
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_310px]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
              <div className="border-b border-[#f6dbe7] px-5 py-4">
                <h2 className="text-sm font-extrabold text-[#432744]">Services</h2>
                <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
                  {filteredServices.length} services in current view
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#fff9fc]">
                    <tr className="text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#c58ea8]">
                      <th className="px-5 py-3">Service Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Base Price</th>
                      <th className="px-4 py-3">Est. Duration</th>
                      <th className="px-4 py-3">Add-on</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="border-t border-[#f9e6ef] align-top">
                        <td className="px-5 py-4 text-sm font-bold text-[#432744]">{service.name}</td>
                        <td className="px-4 py-4">
                          <Pill className={SERVICE_CATEGORY_TONES[service.category]}>{service.category}</Pill>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#5f4b5d]">${service.price.toFixed(2)}</td>
                        <td className="px-4 py-4 text-sm text-[#5f4b5d]">{service.duration} min</td>
                        <td className="px-4 py-4">
                          <TogglePill
                            enabled={service.hasAddOn}
                            onClick={() => handleToggleServiceAddOn(service)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={service.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            <ActionButton tone="rose" icon={Pencil} onClick={() => openEditService(service)}>
                              Edit
                            </ActionButton>
                            <ActionButton tone="violet" onClick={() => openEditService(service)}>
                              Edit Duration
                            </ActionButton>
                            <ActionButton
                              tone="danger"
                              icon={Trash2}
                              onClick={() =>
                                setDeleteState({
                                  type: "service",
                                  recordId: service.id,
                                  label: service.name,
                                })
                              }
                            >
                              Delete
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.07)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#f6dbe7] px-5 py-4">
                <div>
                  <h2 className="text-sm font-extrabold text-[#432744]">Add-ons</h2>
                  <p className="mt-1 text-[11px] font-medium text-[#c694ad]">
                    {addOns.length} mock add-ons configured
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateAddOn}
                  className="rounded-full border border-[#f4c6da] bg-white px-3 py-1.5 text-[10px] font-bold text-[#ea4f93]"
                >
                  <Plus size={12} className="mr-1 inline" />
                  Add Add-on
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#fff9fc]">
                    <tr className="text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#c58ea8]">
                      <th className="px-5 py-3">Add-on Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Applied To</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addOns.map((item) => (
                      <tr key={item.id} className="border-t border-[#f9e6ef]">
                        <td className="px-5 py-4 text-sm font-bold text-[#432744]">{item.name}</td>
                        <td className="px-4 py-4">
                          <Pill className={ADD_ON_TYPE_TONES[item.type]}>{item.type}</Pill>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#5f4b5d]">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-4">
                          <Pill>{item.appliedTo}</Pill>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton tone="rose" icon={Pencil} onClick={() => openEditAddOn(item)}>
                              Edit
                            </ActionButton>
                            <ActionButton
                              tone="danger"
                              icon={Trash2}
                              onClick={() =>
                                setDeleteState({
                                  type: "addon",
                                  recordId: item.id,
                                  label: item.name,
                                })
                              }
                            >
                              Remove
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <SidePanel title="Insights">
              <div className="space-y-4">
                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fff8fb] p-4">
                  <p className="text-xs font-extrabold text-[#432744]">Most Booked Services</p>
                  <div className="mt-3 space-y-3">
                    {MOST_BOOKED_SERVICES.map(([name, value], index) => (
                      <div key={name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ffe7ef] text-[10px] font-extrabold text-[#ea4f93]">
                            {index + 1}
                          </span>
                          <span className="text-xs font-medium text-[#5d4c5c]">{name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#ea4f93]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fff8fb] p-4">
                  <p className="text-xs font-extrabold text-[#432744]">Highest Revenue Services</p>
                  <div className="mt-3 space-y-3">
                    {HIGHEST_REVENUE_SERVICES.map(([name, value, progress]) => (
                      <div key={name}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[#5d4c5c]">{name}</span>
                          <span className="text-[11px] font-bold text-[#ea4f93]">{value}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#f8dce8]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#ea4f93_0%,#f38cba_100%)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fff8fb] p-4">
                  <p className="text-xs font-extrabold text-[#432744]">Pricing Alerts</p>
                  <div className="mt-3 space-y-3">
                    {PRICING_ALERTS.map((alert) => {
                      const tone = getAlertTone(alert.tone);
                      const Icon = tone.icon;

                      return (
                        <div key={alert.title} className="flex items-start gap-3">
                          <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.badge}`}>
                            <Icon size={14} />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-[#432744]">{alert.title}</p>
                            <p className="mt-1 text-[11px] leading-5 text-[#8a7082]">{alert.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#f8dce8] bg-[#fff8fb] p-4">
                  <p className="text-xs font-extrabold text-[#432744]">Category Breakdown</p>
                  <div className="mt-3 space-y-3">
                    {categoryBreakdown.map(([name, count]) => (
                      <div key={name}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[#5d4c5c]">{name}</span>
                          <span className="text-[11px] font-bold text-[#ea4f93]">{count}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#f8dce8]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#ea4f93_0%,#f38cba_100%)]"
                            style={{ width: `${Math.min(count * 12, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SidePanel>
          </aside>
        </div>
      </section>

      {serviceModal.open ? (
        <ServiceFormModal
          mode={serviceModal.mode}
          draft={serviceDraft}
          errorMessage={serviceError}
          onClose={() => setServiceModal({ open: false, mode: "create", recordId: null })}
          onChange={(field, value) => setServiceDraft((current) => ({ ...current, [field]: value }))}
          onSubmit={submitServiceForm}
        />
      ) : null}

      {addOnModal.open ? (
        <AddOnFormModal
          mode={addOnModal.mode}
          draft={addOnDraft}
          errorMessage={addOnError}
          serviceOptions={addOnAppliedToOptions}
          onClose={() => setAddOnModal({ open: false, mode: "create", recordId: null })}
          onChange={(field, value) => setAddOnDraft((current) => ({ ...current, [field]: value }))}
          onSubmit={submitAddOnForm}
        />
      ) : null}

      {deleteState ? (
        <ConfirmModal
          title={deleteState.type === "service" ? "Delete Service" : "Delete Add-on"}
          body={`Are you sure you want to delete ${deleteState.label}? This mock record will be removed from the current admin UI state.`}
          onCancel={() => setDeleteState(null)}
          onConfirm={() => {
            if (deleteState.type === "service") {
              removeMockServiceById(deleteState.recordId);
            } else {
              removeMockAddOnById(deleteState.recordId);
            }
            syncRecords(`${deleteState.label} deleted successfully.`);
            setDeleteState(null);
          }}
        />
      ) : null}
    </>
  );
}
