export const SALON_SUMMARY = [
  {
    title: "12",
    label: "Total Salons",
    note: "+2 this quarter",
    accent: "from-rose-100 to-pink-50",
    iconBg: "bg-rose-100 text-rose-500",
    noteColor: "text-emerald-500",
    icon: "briefcase",
  },
  {
    title: "9",
    label: "Active Salons",
    note: "75% operational",
    accent: "from-emerald-100 to-slate-50",
    iconBg: "bg-emerald-100 text-emerald-500",
    noteColor: "text-emerald-500",
    icon: "check",
  },
  {
    title: "3",
    label: "Closed Salons",
    note: "1 under renovation",
    accent: "from-rose-100 to-slate-50",
    iconBg: "bg-rose-100 text-rose-500",
    noteColor: "text-rose-500",
    icon: "sparkles",
  },
  {
    title: "78%",
    label: "Avg Occupancy",
    note: "+5% vs last month",
    accent: "from-amber-100 to-slate-50",
    iconBg: "bg-amber-100 text-amber-500",
    noteColor: "text-emerald-500",
    icon: "trendingUp",
  },
];

export const SALON_BRANCHES = [
  {
    id: "NY-001",
    name: "Nailify Downtown",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
    address: "123 Main St, New York, NY",
    manager: "Maggie Sophie Chen",
    phone: "+1 (212) 555-0101",
    schedule: "Mon-Sat 9:00 AM - 8:00 PM",
    rating: "4.9",
    reviews: "312",
    status: "ACTIVE",
    statusTone: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "NY-002",
    name: "Nailify Midtown",
    image:
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=900&q=80",
    address: "456 5th Ave, New York, NY",
    manager: "Mia Russo",
    phone: "+1 (212) 555-0202",
    schedule: "Mon-Sun 8:00 AM - 9:00 PM",
    rating: "4.7",
    reviews: "285",
    status: "BUSY",
    statusTone: "bg-amber-100 text-amber-600",
  },
  {
    id: "BK-001",
    name: "Nailify Brooklyn",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
    address: "789 Bedford Ave, Brooklyn, NY",
    manager: "Grace Kim",
    phone: "+1 (718) 555-0303",
    schedule: "Closed - Under Renovation",
    rating: "4.5",
    reviews: "198",
    status: "CLOSED",
    statusTone: "bg-rose-100 text-rose-600",
  },
];

const SALON_TABLE_DEFINITIONS = [
  ["Nailify Downtown", "123 Main St, New York", "Sophie Chen", "14", "Mon-Sat 9AM-8PM", "ACTIVE", "bg-emerald-100 text-emerald-600"],
  ["Nailify Midtown", "456 5th Ave, New York", "Lily Park", "18", "Mon-Sun 8AM-9PM", "BUSY", "bg-amber-100 text-amber-600"],
  ["Nailify Brooklyn", "789 Bedford Ave, Brooklyn", "Mia Torres", "10", "Temporarily Closed", "CLOSED", "bg-rose-100 text-rose-600"],
  ["Nailify Upper East", "826 E 86th St, New York", "Grace Kim", "12", "Tue-Sun 10AM-7PM", "ACTIVE", "bg-emerald-100 text-emerald-600"],
  ["Nailify SoHo", "55 Spring St, New York", "Nina Russo", "16", "Mon-Sun 8AM-8PM", "ACTIVE", "bg-emerald-100 text-emerald-600"],
  ["Nailify Downtown", "123 Main St, New York", "Sophie Chen", "14", "Mon-Sat 9AM-8PM", "ACTIVE", "bg-emerald-100 text-emerald-600"],
  ["Nailify Midtown", "456 5th Ave, New York", "Lily Park", "18", "Mon-Sun 8AM-9PM", "BUSY", "bg-amber-100 text-amber-600"],
  ["Nailify Brooklyn", "789 Bedford Ave, Brooklyn", "Mia Torres", "10", "Temporarily Closed", "CLOSED", "bg-rose-100 text-rose-600"],
  ["Nailify Upper East", "826 E 86th St, New York", "Grace Kim", "12", "Tue-Sun 10AM-7PM", "ACTIVE", "bg-emerald-100 text-emerald-600"],
  ["Nailify SoHo", "55 Spring St, New York", "Nina Russo", "16", "Mon-Sun 8AM-8PM", "ACTIVE", "bg-emerald-100 text-emerald-600"],
];

export const SALON_ALERTS = [
  {
    title: "Brooklyn branch renovation overdue by 2 weeks. Reporting delayed.",
    time: "Today, 9:14 AM",
    color: "text-rose-500",
  },
  {
    title: "Midtown branch at 98% capacity. Consider adding staff shifts.",
    time: "Today, 8:45 AM",
    color: "text-amber-500",
  },
  {
    title: "Queens branch manager position vacant since Nov 12.",
    time: "Yesterday, 5:30 PM",
    color: "text-amber-500",
  },
  {
    title: "SoHo branch license renewal due in 14 days.",
    time: "Yesterday, 2:10 PM",
    color: "text-amber-500",
  },
  {
    title: "Upper East branch HVAC maintenance scheduled for Dec 20.",
    time: "Dec 15, 11:00 AM",
    color: "text-amber-500",
  },
];

export const SALON_STATUS_FILTERS = ["All", "Active", "Closed", "Busy"];

export const TOP_PERFORMING_SALON = {
  title: "Top Performing Salon",
  branch: "Nailify Downtown",
  city: "123 Main St, New York",
  concern: { text: "4.9 Rating • 312 Reviews", color: "text-rose-500" },
  values: {
    image: SALON_BRANCHES[0].image,
    occupancy: "89%",
    revenue: "94%",
    utilization: "91%",
  },
};

export const LOW_OCCUPANCY_SALON = {
  title: "Low Occupancy Salon",
  branch: "Nailify Queens",
  city: "82 Jamica Ave, Queens",
  concern: { text: "Needs Attention", color: "text-amber-500" },
  values: {
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
    occupancy: "34%",
    revenue: "58%",
    utilization: "41%",
  },
  buttonLabel: "View Full Report",
};

export const SALON_MODAL_STYLES = {
  content: { borderRadius: 24, padding: 0, overflow: "hidden" },
  mask: { backgroundColor: "rgba(226, 93, 143, 0.12)" },
};

const createSalonRow = (definition, index) => {
  const branch = SALON_BRANCHES[index % SALON_BRANCHES.length];

  return {
    id: index + 1,
    name: definition[0],
    address: definition[1],
    manager: definition[2],
    staff: definition[3],
    hours: definition[4],
    status: definition[5],
    statusColor: definition[6],
    image: branch.image,
    salonId: branch.id,
    phone: branch.phone,
    rating: branch.rating,
    reviews: branch.reviews,
  };
};

export const createInitialSalons = () =>
  SALON_TABLE_DEFINITIONS.map((definition, index) =>
    createSalonRow(definition, index),
  );

export const matchesSalonStatusFilter = (salonStatus, statusFilter) => {
  if (statusFilter === "All") {
    return true;
  }

  return salonStatus === statusFilter.toUpperCase();
};

export const SALON_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "bg-emerald-100 text-emerald-600" },
  { value: "BUSY", label: "Busy", color: "bg-amber-100 text-amber-600" },
  { value: "CLOSED", label: "Closed", color: "bg-rose-100 text-rose-600" },
  {
    value: "MAINTENANCE",
    label: "Under Maintenance",
    color: "bg-blue-100 text-blue-600",
  },
];

export const SALON_DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_OPERATING_HOURS = {
  monday: { open: "09:00", close: "20:00" },
  tuesday: { open: "09:00", close: "20:00" },
  wednesday: { open: "09:00", close: "20:00" },
  thursday: { open: "09:00", close: "20:00" },
  friday: { open: "09:00", close: "20:00" },
  saturday: { open: "09:00", close: "18:00" },
  sunday: { open: "10:00", close: "16:00" },
};

export const createEmptySalonForm = () => ({
  salonName: "",
  salonId: "",
  address: "",
  manager: "",
  phone: "",
  staffAmount: "",
  operatingHours: Object.fromEntries(
    Object.entries(DEFAULT_OPERATING_HOURS).map(([day, hours]) => [
      day,
      { ...hours },
    ]),
  ),
  status: "ACTIVE",
  description: "",
});

export const SALON_FORM_MODAL_STYLES = {
  mask: {
    backgroundColor: "rgba(226, 93, 143, 0.1)",
  },
};

export const getSalonStatusStyle = (status) =>
  SALON_STATUS_OPTIONS.find((option) => option.value === status)?.color ??
  "bg-emerald-100 text-emerald-600";

const MOCK_SALON_DESCRIPTIONS = {
  "NY-001": "Flagship location in downtown Manhattan with premium services.",
  "NY-002": "High-traffic Midtown branch with extended weekend hours.",
  "BK-001": "Brooklyn location currently under renovation.",
};

const salonFormUpdates = new Map();
const deletedSalonIds = new Set();
const createdSalons = [];
let nextCreatedSalonId = 100;

const cloneOperatingHours = () =>
  Object.fromEntries(
    Object.entries(DEFAULT_OPERATING_HOURS).map(([day, hours]) => [day, { ...hours }]),
  );

const cloneFormData = (formData) => ({
  ...formData,
  operatingHours: Object.fromEntries(
    Object.entries(formData.operatingHours).map(([day, hours]) => [day, { ...hours }]),
  ),
});

const findSalonRecordById = (salonId) =>
  createInitialSalons().find(
    (entry) =>
      String(entry.id) === String(salonId) || entry.salonId === String(salonId),
  );

export const mapSalonRowToForm = (salon) => ({
  salonName: salon.name,
  salonId: salon.salonId,
  address: salon.address,
  manager: salon.manager,
  phone: salon.phone ?? "",
  staffAmount: String(salon.staff),
  operatingHours: cloneOperatingHours(),
  status: salon.status,
  description:
    MOCK_SALON_DESCRIPTIONS[salon.salonId] ??
    `Mock description for ${salon.name}.`,
});

export const getMockSalonFormById = (salonId) => {
  if (!salonId || deletedSalonIds.has(String(salonId))) {
    return null;
  }

  const savedForm = salonFormUpdates.get(String(salonId));
  if (savedForm) {
    return cloneFormData(savedForm);
  }

  const salon = findSalonRecordById(salonId);

  return salon ? mapSalonRowToForm(salon) : null;
};

export const fetchMockSalonFormById = (salonId) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(getMockSalonFormById(salonId));
    }, 500);
  });

export const applySalonFormToRow = (salon, formData) => ({
  ...salon,
  name: formData.salonName,
  address: formData.address,
  manager: formData.manager,
  staff: formData.staffAmount,
  phone: formData.phone,
  status: formData.status,
  statusColor: getSalonStatusStyle(formData.status),
});

export const saveMockSalonForm = (recordId, formData) => {
  salonFormUpdates.set(String(recordId), cloneFormData(formData));
  deletedSalonIds.delete(String(recordId));
};

const validateSalonForm = (formData, { requireSalonId = false } = {}) => {
  if (!formData.salonName?.trim()) {
    return "Salon name is required.";
  }

  if (requireSalonId && !formData.salonId?.trim()) {
    return "Salon ID is required.";
  }

  if (!formData.address?.trim()) {
    return "Address is required.";
  }

  if (!formData.manager?.trim()) {
    return "Manager name is required.";
  }

  if (!formData.phone?.trim()) {
    return "Phone number is required.";
  }

  const staffAmount = Number(formData.staffAmount);
  if (!Number.isFinite(staffAmount) || staffAmount < 1) {
    return "Staff amount must be at least 1.";
  }

  return null;
};

const isSalonIdTaken = (salonId) => {
  const normalizedId = salonId.trim();

  return (
    createInitialSalons().some((salon) => salon.salonId === normalizedId) ||
    createdSalons.some((salon) => salon.salonId === normalizedId)
  );
};

const formDataToSalonRow = (formData, id) => ({
  id,
  name: formData.salonName.trim(),
  address: formData.address.trim(),
  manager: formData.manager.trim(),
  staff: formData.staffAmount,
  hours: "Custom schedule",
  status: formData.status,
  statusColor: getSalonStatusStyle(formData.status),
  image: SALON_BRANCHES[0].image,
  salonId: formData.salonId.trim(),
  phone: formData.phone.trim(),
  rating: "—",
  reviews: "0",
});

export const submitMockSalonUpdate = (recordId, formData) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      if (!recordId || deletedSalonIds.has(String(recordId))) {
        resolve({
          success: false,
          message: "Salon not found. It may have been removed.",
        });
        return;
      }

      const salon = findSalonRecordById(recordId);
      if (!salon) {
        resolve({
          success: false,
          message: "Salon not found. Please refresh and try again.",
        });
        return;
      }

      const validationError = validateSalonForm(formData);
      if (validationError) {
        resolve({
          success: false,
          message: validationError,
        });
        return;
      }

      saveMockSalonForm(recordId, formData);
      resolve({
        success: true,
        message: `${formData.salonName.trim()} has been updated successfully.`,
      });
    }, 600);
  });

export const submitMockSalonCreate = (formData) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      const validationError = validateSalonForm(formData, { requireSalonId: true });
      if (validationError) {
        resolve({
          success: false,
          message: validationError,
        });
        return;
      }

      if (isSalonIdTaken(formData.salonId)) {
        resolve({
          success: false,
          message: "Salon ID already exists. Please use a different ID.",
        });
        return;
      }

      const newId = nextCreatedSalonId;
      nextCreatedSalonId += 1;

      const newSalon = formDataToSalonRow(formData, newId);
      createdSalons.push(newSalon);
      saveMockSalonForm(newId, formData);

      resolve({
        success: true,
        message: `${formData.salonName.trim()} has been created successfully.`,
      });
    }, 600);
  });

export const removeMockSalonById = (recordId) => {
  salonFormUpdates.delete(String(recordId));
  deletedSalonIds.add(String(recordId));

  const createdIndex = createdSalons.findIndex(
    (salon) => String(salon.id) === String(recordId),
  );
  if (createdIndex >= 0) {
    createdSalons.splice(createdIndex, 1);
  }
};

export const getSalonsWithUpdates = () => {
  const updatedBaseSalons = createInitialSalons()
    .filter((salon) => !deletedSalonIds.has(String(salon.id)))
    .map((salon) => {
      const savedForm = salonFormUpdates.get(String(salon.id));

      return savedForm ? applySalonFormToRow(salon, savedForm) : salon;
    });

  const updatedCreatedSalons = createdSalons.map((salon) => {
    const savedForm = salonFormUpdates.get(String(salon.id));

    return savedForm ? applySalonFormToRow(salon, savedForm) : salon;
  });

  return [...updatedBaseSalons, ...updatedCreatedSalons];
};

