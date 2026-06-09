import { CircleDollarSign, Layers3, Sparkles, Wallet } from "lucide-react";

export const SERVICE_CATEGORY_TONES = {
  "Basic Nail": "bg-[#ffe7ef] text-[#ea4f93]",
  "Gel Nail": "bg-[#f1e9ff] text-[#8b5cf6]",
  "Nail Art": "bg-[#e6f0ff] text-[#4f7df0]",
  "Gel Extension": "bg-[#fff1da] text-[#f08a24]",
  "Hand Spa": "bg-[#ffe0f1] text-[#ea4f93]",
  Removal: "bg-[#ddf8f2] text-[#18a581]",
  "Custom Design": "bg-[#ffe6e2] text-[#f26452]",
};

export const SERVICE_CATEGORIES = Object.keys(SERVICE_CATEGORY_TONES);

export const ADD_ON_TYPE_TONES = {
  Decorative: "bg-[#ffe7ef] text-[#ea4f93]",
  Finish: "bg-[#e6f0ff] text-[#4f7df0]",
  Repair: "bg-[#fff1da] text-[#f08a24]",
  Treatment: "bg-[#ddf8f2] text-[#18a581]",
};

export const ADD_ON_TYPES = Object.keys(ADD_ON_TYPE_TONES);
export const STATUS_OPTIONS = ["Active", "Inactive"];

export const SERVICE_CATEGORY_FILTERS = ["All", ...SERVICE_CATEGORIES];

const BASE_SERVICE_ROWS = [
  { id: "svc-01", name: "Classic Manicure", category: "Basic Nail", price: 22, duration: 30, hasAddOn: true, status: "Active" },
  { id: "svc-02", name: "Classic Pedicure", category: "Basic Nail", price: 28, duration: 45, hasAddOn: true, status: "Active" },
  { id: "svc-03", name: "Gel Manicure", category: "Gel Nail", price: 38, duration: 60, hasAddOn: true, status: "Active" },
  { id: "svc-04", name: "Gel Pedicure", category: "Gel Nail", price: 45, duration: 75, hasAddOn: true, status: "Active" },
  { id: "svc-05", name: "Floral Nail Art", category: "Nail Art", price: 55, duration: 90, hasAddOn: true, status: "Active" },
  { id: "svc-06", name: "Ombre Gradient Art", category: "Nail Art", price: 60, duration: 90, hasAddOn: false, status: "Inactive" },
  { id: "svc-07", name: "Gel Extension Full Set", category: "Gel Extension", price: 75, duration: 120, hasAddOn: true, status: "Active" },
  { id: "svc-08", name: "Gel Extension Refill", category: "Gel Extension", price: 50, duration: 75, hasAddOn: true, status: "Active" },
  { id: "svc-09", name: "Luxury Hand Spa", category: "Hand Spa", price: 35, duration: 50, hasAddOn: true, status: "Active" },
  { id: "svc-10", name: "Express Hand Spa", category: "Hand Spa", price: 20, duration: 25, hasAddOn: false, status: "Inactive" },
  { id: "svc-11", name: "Gel Removal", category: "Removal", price: 15, duration: 20, hasAddOn: false, status: "Active" },
  { id: "svc-12", name: "Acrylic Removal", category: "Removal", price: 18, duration: 25, hasAddOn: false, status: "Active" },
  { id: "svc-13", name: "Custom Design (per nail)", category: "Custom Design", price: 8, duration: 15, hasAddOn: true, status: "Active" },
];

const BASE_ADD_ON_ROWS = [
  { id: "addon-01", name: "Decoration", type: "Decorative", price: 5, appliedTo: "All Services", status: "Active" },
  { id: "addon-02", name: "Stone", type: "Decorative", price: 7, appliedTo: "All Services", status: "Active" },
  { id: "addon-03", name: "Pearl", type: "Decorative", price: 8, appliedTo: "Gel Nail", status: "Active" },
  { id: "addon-04", name: "Chrome Powder", type: "Finish", price: 10, appliedTo: "Gel Nail", status: "Active" },
  { id: "addon-05", name: "Nail Repair", type: "Repair", price: 6, appliedTo: "All Services", status: "Active" },
  { id: "addon-06", name: "Hand Spa Upgrade", type: "Treatment", price: 12, appliedTo: "Hand Spa", status: "Inactive" },
];

export const MOST_BOOKED_SERVICES = [
  ["Gel Manicure", "248 bookings"],
  ["Classic Manicure", "196 bookings"],
  ["Floral Nail Art", "154 bookings"],
  ["Gel Extension Full Set", "132 bookings"],
  ["Luxury Hand Spa", "98 bookings"],
];

export const HIGHEST_REVENUE_SERVICES = [
  ["Gel Extension Full Set", "$9,900", 100],
  ["Gel Manicure", "$9,424", 94],
  ["Floral Nail Art", "$8,470", 85],
  ["Gel Pedicure", "$6,750", 67],
  ["Classic Manicure", "$4,312", 43],
];

export const PRICING_ALERTS = [
  {
    tone: "amber",
    title: "Below Market Rate",
    body: "Classic Manicure at $22 is 18% below local avg. Consider updating.",
  },
  {
    tone: "rose",
    title: "Price Not Updated",
    body: "Gel Removal price unchanged for 6+ months.",
  },
  {
    tone: "sky",
    title: "New Competitor Pricing",
    body: "Nearby salons offer Gel Extension at $68. You're at $75.",
  },
  {
    tone: "emerald",
    title: "Optimal Pricing",
    body: "Floral Nail Art is priced competitively with high demand.",
  },
];

const serviceUpdates = new Map();
const addOnUpdates = new Map();
const deletedServiceIds = new Set();
const deletedAddOnIds = new Set();
const createdServices = [];
const createdAddOns = [];
let nextServiceId = 100;
let nextAddOnId = 100;

const cloneRecord = (record) => ({ ...record });

export const createEmptyService = () => ({
  name: "",
  category: SERVICE_CATEGORIES[0],
  price: "",
  duration: "",
  hasAddOn: true,
  status: "Active",
});

export const createEmptyAddOn = () => ({
  name: "",
  type: ADD_ON_TYPES[0],
  price: "",
  appliedTo: "All Services",
  status: "Active",
});

const normalizeService = (record) => ({
  ...record,
  price: Number(record.price),
  duration: Number(record.duration),
  hasAddOn: Boolean(record.hasAddOn),
});

const normalizeAddOn = (record) => ({
  ...record,
  price: Number(record.price),
});

const mergeWithUpdates = (baseRows, updates, deletedIds) =>
  baseRows
    .filter((row) => !deletedIds.has(String(row.id)))
    .map((row) => cloneRecord(updates.get(String(row.id)) ?? row));

export const getServiceRowsWithUpdates = () => {
  const updatedBase = mergeWithUpdates(BASE_SERVICE_ROWS, serviceUpdates, deletedServiceIds);
  const updatedCreated = createdServices
    .filter((row) => !deletedServiceIds.has(String(row.id)))
    .map((row) => cloneRecord(serviceUpdates.get(String(row.id)) ?? row));

  return [...updatedBase, ...updatedCreated];
};

export const getAddOnRowsWithUpdates = () => {
  const updatedBase = mergeWithUpdates(BASE_ADD_ON_ROWS, addOnUpdates, deletedAddOnIds);
  const updatedCreated = createdAddOns
    .filter((row) => !deletedAddOnIds.has(String(row.id)))
    .map((row) => cloneRecord(addOnUpdates.get(String(row.id)) ?? row));

  return [...updatedBase, ...updatedCreated];
};

export const buildServicePricingSummary = (services, addOns) => {
  const activeServices = services.filter((service) => service.status === "Active");
  const avgPrice =
    services.length > 0
      ? services.reduce((total, service) => total + Number(service.price || 0), 0) / services.length
      : 0;
  const activeRate = services.length > 0 ? Math.round((activeServices.length / services.length) * 100) : 0;

  return [
    {
      label: "Total Services",
      value: String(services.length),
      note: `${Math.max(services.length - BASE_SERVICE_ROWS.length, 0)} newly added`,
      icon: Layers3,
      iconClassName: "bg-[#ffe7ef] text-[#ea4f93]",
    },
    {
      label: "Active Services",
      value: String(activeServices.length),
      note: `${activeRate}% active rate`,
      icon: Sparkles,
      iconClassName: "bg-[#e7fbf4] text-[#1ead77]",
    },
    {
      label: "Add-ons Available",
      value: String(addOns.length),
      note: `${addOns.filter((item) => item.status === "Active").length} active`,
      icon: CircleDollarSign,
      iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
    },
    {
      label: "Avg. Service Price",
      value: `$${avgPrice.toFixed(2)}`,
      note: `${services.filter((item) => item.price >= avgPrice).length} above avg.`,
      icon: Wallet,
      iconClassName: "bg-[#ffe6e7] text-[#ef4f67]",
    },
  ];
};

export const buildCategoryBreakdown = (services) =>
  SERVICE_CATEGORIES.map((category) => [
    category,
    services.filter((service) => service.category === category).length,
  ]).filter(([, count]) => count > 0);

const validateService = (formData) => {
  if (!formData.name?.trim()) {
    return "Service name is required.";
  }

  if (!SERVICE_CATEGORIES.includes(formData.category)) {
    return "Category is invalid.";
  }

  const price = Number(formData.price);
  if (!Number.isFinite(price) || price < 0) {
    return "Price must be a valid non-negative number.";
  }

  const duration = Number(formData.duration);
  if (!Number.isFinite(duration) || duration < 5) {
    return "Duration must be at least 5 minutes.";
  }

  if (!STATUS_OPTIONS.includes(formData.status)) {
    return "Status is invalid.";
  }

  return null;
};

const validateAddOn = (formData) => {
  if (!formData.name?.trim()) {
    return "Add-on name is required.";
  }

  if (!ADD_ON_TYPES.includes(formData.type)) {
    return "Add-on type is invalid.";
  }

  const price = Number(formData.price);
  if (!Number.isFinite(price) || price < 0) {
    return "Price must be a valid non-negative number.";
  }

  if (!formData.appliedTo?.trim()) {
    return "Applied-to target is required.";
  }

  if (!STATUS_OPTIONS.includes(formData.status)) {
    return "Status is invalid.";
  }

  return null;
};

export const createMockService = (formData) => {
  const validationError = validateService(formData);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const record = normalizeService({
    id: `svc-${nextServiceId}`,
    name: formData.name.trim(),
    category: formData.category,
    price: formData.price,
    duration: formData.duration,
    hasAddOn: formData.hasAddOn,
    status: formData.status,
  });
  nextServiceId += 1;
  createdServices.push(record);
  serviceUpdates.set(String(record.id), record);
  deletedServiceIds.delete(String(record.id));

  return { success: true, message: `${record.name} created successfully.` };
};

export const updateMockService = (recordId, formData) => {
  const validationError = validateService(formData);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const current = getServiceRowsWithUpdates().find((item) => String(item.id) === String(recordId));
  if (!current) {
    return { success: false, message: "Service not found." };
  }

  const record = normalizeService({
    ...current,
    name: formData.name.trim(),
    category: formData.category,
    price: formData.price,
    duration: formData.duration,
    hasAddOn: formData.hasAddOn,
    status: formData.status,
  });

  serviceUpdates.set(String(recordId), record);
  deletedServiceIds.delete(String(recordId));
  return { success: true, message: `${record.name} updated successfully.` };
};

export const removeMockServiceById = (recordId) => {
  serviceUpdates.delete(String(recordId));
  deletedServiceIds.add(String(recordId));
  const createdIndex = createdServices.findIndex((item) => String(item.id) === String(recordId));
  if (createdIndex >= 0) {
    createdServices.splice(createdIndex, 1);
  }
};

export const createMockAddOn = (formData) => {
  const validationError = validateAddOn(formData);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const record = normalizeAddOn({
    id: `addon-${nextAddOnId}`,
    name: formData.name.trim(),
    type: formData.type,
    price: formData.price,
    appliedTo: formData.appliedTo.trim(),
    status: formData.status,
  });
  nextAddOnId += 1;
  createdAddOns.push(record);
  addOnUpdates.set(String(record.id), record);
  deletedAddOnIds.delete(String(record.id));

  return { success: true, message: `${record.name} created successfully.` };
};

export const updateMockAddOn = (recordId, formData) => {
  const validationError = validateAddOn(formData);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const current = getAddOnRowsWithUpdates().find((item) => String(item.id) === String(recordId));
  if (!current) {
    return { success: false, message: "Add-on not found." };
  }

  const record = normalizeAddOn({
    ...current,
    name: formData.name.trim(),
    type: formData.type,
    price: formData.price,
    appliedTo: formData.appliedTo.trim(),
    status: formData.status,
  });

  addOnUpdates.set(String(recordId), record);
  deletedAddOnIds.delete(String(recordId));
  return { success: true, message: `${record.name} updated successfully.` };
};

export const removeMockAddOnById = (recordId) => {
  addOnUpdates.delete(String(recordId));
  deletedAddOnIds.add(String(recordId));
  const createdIndex = createdAddOns.findIndex((item) => String(item.id) === String(recordId));
  if (createdIndex >= 0) {
    createdAddOns.splice(createdIndex, 1);
  }
};

export const SERVICE_ROWS = getServiceRowsWithUpdates();
export const ADD_ON_ROWS = getAddOnRowsWithUpdates();
