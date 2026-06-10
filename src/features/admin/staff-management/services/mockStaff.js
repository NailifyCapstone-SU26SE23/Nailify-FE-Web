export const STAFF_SUMMARY = [
  {
    title: "84",
    label: "Total Staff",
    note: "+3 this month",
    accent: "from-rose-100 to-pink-50",
    iconBg: "bg-rose-100 text-rose-500",
    noteColor: "text-emerald-500",
    icon: "users",
  },
  {
    title: "84",
    label: "Staff Artists",
    note: "+2 this month",
    accent: "from-violet-100 to-fuchsia-50",
    iconBg: "bg-violet-100 text-violet-500",
    noteColor: "text-emerald-500",
    icon: "sparkles",
  },
  {
    title: "5",
    label: "Salon Managers",
    note: "+1 this month",
    accent: "from-amber-100 to-orange-50",
    iconBg: "bg-amber-100 text-amber-500",
    noteColor: "text-emerald-500",
    icon: "shieldCheck",
  },
  {
    title: "15",
    label: "Available Today",
    note: "88% availability",
    accent: "from-emerald-100 to-teal-50",
    iconBg: "bg-emerald-100 text-emerald-500",
    noteColor: "text-emerald-500",
    icon: "briefcase",
  },
  {
    title: "6",
    label: "On Leave",
    note: "3 returning soon",
    accent: "from-rose-100 to-red-50",
    iconBg: "bg-rose-100 text-rose-500",
    noteColor: "text-rose-500",
    icon: "calendarClock",
  },
];

export const STAFF_FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "artist", label: "Artists" },
  { key: "manager", label: "Managers" },
  { key: "available", label: "Available" },
  { key: "leave", label: "On Leave" },
  { key: "inactive", label: "Inactive" },
];

const STAFF_MEMBER_DEFINITIONS = [
  {
    id: "NF-001",
    name: "Sophia Lee",
    role: "Senior Nail Artist",
    type: "artist",
    status: "available",
    salon: "Nailify Central",
    rating: "4.9",
    bookings: "312",
    retention: "98%",
    accent: "Performance",
    accentTone: "bg-violet-100 text-violet-600",
    tags: [
      { label: "Gel", tone: "bg-rose-100 text-rose-500" },
      { label: "Nail Art", tone: "bg-violet-100 text-violet-600" },
      { label: "Acrylic", tone: "bg-sky-100 text-sky-600" },
    ],
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "NF-002",
    name: "Mia Chen",
    role: "Nail Artist",
    type: "artist",
    status: "available",
    salon: "Nailify Uptown",
    rating: "4.7",
    bookings: "248",
    retention: "94%",
    accent: "Performance",
    accentTone: "bg-amber-100 text-amber-600",
    tags: [
      { label: "Manicure", tone: "bg-amber-100 text-amber-600" },
      { label: "Gel", tone: "bg-rose-100 text-rose-500" },
    ],
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "NF-003",
    name: "Nina Torres",
    role: "Salon Manager",
    type: "manager",
    status: "available",
    salon: "Nailify Uptown",
    rating: "4.9",
    bookings: "18",
    retention: "99%",
    accent: "Leadership",
    accentTone: "bg-sky-100 text-sky-600",
    tags: [
      { label: "Management", tone: "bg-sky-100 text-sky-600" },
      { label: "Training", tone: "bg-emerald-100 text-emerald-600" },
    ],
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "NF-004",
    name: "Rachel Park",
    role: "Nail Artist",
    type: "artist",
    status: "available",
    salon: "Nailify Westgate",
    rating: "4.5",
    bookings: "189",
    retention: "91%",
    accent: "Performance",
    accentTone: "bg-emerald-100 text-emerald-600",
    tags: [
      { label: "Pedicure", tone: "bg-rose-100 text-rose-500" },
      { label: "Nail Art", tone: "bg-emerald-100 text-emerald-600" },
    ],
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "NF-005",
    name: "Amy Liu",
    role: "Senior Artist",
    type: "artist",
    status: "leave",
    salon: "Nailify Downtown",
    rating: "4.6",
    bookings: "276",
    retention: "95%",
    accent: "Performance",
    accentTone: "bg-violet-100 text-violet-600",
    tags: [
      { label: "Gel", tone: "bg-rose-100 text-rose-500" },
      { label: "Manicure", tone: "bg-amber-100 text-amber-600" },
      { label: "Pedicure", tone: "bg-rose-100 text-rose-500" },
    ],
    initials: "AL",
    avatarTone: "from-pink-400 to-rose-300",
  },
  {
    id: "NF-006",
    name: "Jessica Kim",
    role: "Salon Manager",
    type: "manager",
    status: "available",
    salon: "Nailify Eastside",
    rating: "4.8",
    bookings: "22",
    retention: "97%",
    accent: "Leadership",
    accentTone: "bg-violet-100 text-violet-600",
    tags: [
      { label: "Management", tone: "bg-sky-100 text-sky-600" },
      { label: "Scheduling", tone: "bg-violet-100 text-violet-600" },
    ],
    initials: "JK",
    avatarTone: "from-violet-400 to-fuchsia-300",
  },
  {
    id: "NF-007",
    name: "Karen Sato",
    role: "Nail Artist",
    type: "artist",
    status: "inactive",
    salon: "Nailify Riverside",
    rating: "4.1",
    bookings: "152",
    retention: "84%",
    accent: "Performance",
    accentTone: "bg-rose-100 text-rose-500",
    tags: [
      { label: "Pedicure", tone: "bg-rose-100 text-rose-500" },
      { label: "Acrylic", tone: "bg-sky-100 text-sky-600" },
    ],
    initials: "KS",
    avatarTone: "from-amber-400 to-orange-300",
  },
  {
    id: "NF-008",
    name: "Priya Mehta",
    role: "Nail Artist",
    type: "artist",
    status: "leave",
    salon: "Nailify Central",
    rating: "4.4",
    bookings: "205",
    retention: "89%",
    accent: "Performance",
    accentTone: "bg-emerald-100 text-emerald-600",
    tags: [
      { label: "Gel", tone: "bg-rose-100 text-rose-500" },
      { label: "Nail Art", tone: "bg-emerald-100 text-emerald-600" },
    ],
    initials: "PM",
    avatarTone: "from-indigo-400 to-sky-300",
  },
];

export const STAFF_QUICK_ACTIONS = [
  { label: "Add Staff", icon: "plus", bg: "bg-rose-100", text: "text-rose-500", desc: "New member" },
  { label: "Transfer", icon: "arrowRightLeft", bg: "bg-violet-100", text: "text-violet-500", desc: "Move staff" },
  { label: "Assign Salon", icon: "briefcase", bg: "bg-sky-100", text: "text-sky-500", desc: "Set location" },
  { label: "Performance", icon: "barChart", bg: "bg-amber-100", text: "text-amber-500", desc: "View stats" },
  { label: "Schedule", icon: "calendarClock", bg: "bg-emerald-100", text: "text-emerald-500", desc: "Manage shifts" },
  { label: "Deactivate", icon: "clock", bg: "bg-slate-100", text: "text-slate-500", desc: "Suspend access" },
];

export const STAFF_TOP_PERFORMERS = [
  {
    name: "Sophia Lee",
    meta: "312 bookings · Central",
    rating: "4.9",
    color: "bg-amber-400",
    rank: "1",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
  },
  {
    name: "Nina Torres",
    meta: "Manager · Uptown",
    rating: "4.9",
    color: "bg-slate-300",
    rank: "2",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=80&q=80",
  },
  {
    name: "Mia Chen",
    meta: "248 bookings · Uptown",
    rating: "4.7",
    color: "bg-orange-300",
    rank: "3",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80",
  },
  {
    name: "Jessica Kim",
    meta: "Manager · Eastside",
    rating: "4.8",
    color: "bg-violet-300",
    rank: "4",
    initials: "JK",
    avatarTone: "from-violet-400 to-fuchsia-300",
  },
  {
    name: "Amy Liu",
    meta: "276 bookings · Downtown",
    rating: "4.6",
    color: "bg-pink-300",
    rank: "5",
    initials: "AL",
    avatarTone: "from-pink-400 to-rose-300",
  },
];

export const STAFF_LEAVE_LIST = [
  { name: "Rachel Park", note: "Returning Jun 2, 2026", tag: "3 days", tone: "bg-amber-100 text-amber-600" },
  { name: "Karen Sato", note: "Returns Jun 3, 2026", tag: "17 days", tone: "bg-violet-100 text-violet-600" },
  { name: "Lisa Nguyen", note: "Returns Jun 6, 2026", tag: "10 days", tone: "bg-amber-100 text-amber-600" },
  { name: "Priya Mehta", note: "Returns Feb 10, 2026", tag: "12 days", tone: "bg-amber-100 text-amber-600" },
];

export const STAFF_LOW_RATING_ALERTS = [
  { name: "Bella Wong", detail: "3.2 - Needs improvement", action: "Review" },
  { name: "Chloe Martin", detail: "3.4 - Client score drop", action: "Review" },
];

export const STAFF_STATUS_LABELS = {
  available: "Available",
  leave: "On Leave",
  inactive: "Inactive",
};

export const STAFF_STATUS_TONES = {
  available: "bg-emerald-100 text-emerald-600",
  leave: "bg-amber-100 text-amber-600",
  inactive: "bg-rose-100 text-rose-600",
};

export const STAFF_MODAL_STYLES = {
  content: { borderRadius: 24, padding: 0, overflow: "hidden" },
  mask: { backgroundColor: "rgba(226, 93, 143, 0.12)" },
};

export const STAFF_FORM_MODAL_STYLES = {
  mask: { backgroundColor: "rgba(226, 93, 143, 0.12)" },
};

export const STAFF_ROLE_OPTIONS = [
  { value: "NAIL_ARTIST", label: "Nail Artist", color: "bg-rose-100 text-rose-600" },
  { value: "SENIOR_ARTIST", label: "Senior Artist", color: "bg-violet-100 text-violet-600" },
  { value: "SALON_MANAGER", label: "Salon Manager", color: "bg-sky-100 text-sky-600" },
  { value: "RECEPTIONIST", label: "Receptionist", color: "bg-amber-100 text-amber-600" },
];

export const STAFF_CREATE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "bg-emerald-100 text-emerald-600" },
  { value: "ONBOARDING", label: "Onboarding", color: "bg-violet-100 text-violet-600" },
  { value: "ON_LEAVE", label: "On Leave", color: "bg-amber-100 text-amber-600" },
  { value: "INACTIVE", label: "Inactive", color: "bg-rose-100 text-rose-600" },
];

export const STAFF_SALON_OPTIONS = [
  "Nailify Central",
  "Nailify Uptown",
  "Nailify Downtown",
  "Nailify Eastside",
  "Nailify Westgate",
];

export const STAFF_SPECIALTIES = [
  "Gel",
  "Nail Art",
  "Acrylic",
  "Pedicure",
  "Manicure",
  "Extensions",
  "Management",
  "Training",
];

export const STAFF_EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary"];

export const STAFF_DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export const STAFF_ONBOARDING_CHECKLIST = [
  "Complete personal information",
  "Assign salon and role",
  "Select specialties",
  "Set weekly working schedule",
  "Review and save profile",
];

export const STAFF_UPDATE_CHECKLIST = [
  "Review core profile information",
  "Confirm salon and role assignment",
  "Update specialties and notes",
  "Adjust weekly schedule if needed",
  "Save changes to return to staff list",
];

const DEFAULT_STAFF_SCHEDULE = {
  monday: { enabled: true, start: "09:00", end: "18:00" },
  tuesday: { enabled: true, start: "09:00", end: "18:00" },
  wednesday: { enabled: true, start: "09:00", end: "18:00" },
  thursday: { enabled: true, start: "09:00", end: "18:00" },
  friday: { enabled: true, start: "09:00", end: "18:00" },
  saturday: { enabled: true, start: "09:00", end: "16:00" },
  sunday: { enabled: false, start: "10:00", end: "15:00" },
};

const SPECIALTY_TONES = {
  Gel: "bg-rose-100 text-rose-500",
  "Nail Art": "bg-violet-100 text-violet-600",
  Acrylic: "bg-sky-100 text-sky-600",
  Pedicure: "bg-rose-100 text-rose-500",
  Manicure: "bg-amber-100 text-amber-600",
  Extensions: "bg-emerald-100 text-emerald-600",
  Management: "bg-sky-100 text-sky-600",
  Training: "bg-emerald-100 text-emerald-600",
};

const ROLE_PROFILE_MAP = {
  NAIL_ARTIST: {
    role: "Nail Artist",
    type: "artist",
    accent: "Performance",
    accentTone: "bg-violet-100 text-violet-600",
  },
  SENIOR_ARTIST: {
    role: "Senior Artist",
    type: "artist",
    accent: "Performance",
    accentTone: "bg-violet-100 text-violet-600",
  },
  SALON_MANAGER: {
    role: "Salon Manager",
    type: "manager",
    accent: "Leadership",
    accentTone: "bg-sky-100 text-sky-600",
  },
  RECEPTIONIST: {
    role: "Receptionist",
    type: "artist",
    accent: "Performance",
    accentTone: "bg-amber-100 text-amber-600",
  },
};

const CREATE_STATUS_TO_MEMBER_STATUS = {
  ACTIVE: "available",
  ONBOARDING: "available",
  ON_LEAVE: "leave",
  INACTIVE: "inactive",
};

const createdStaffMembers = [];
const deletedStaffIds = new Set();
const staffFormUpdates = new Map();

const STAFF_FORM_SEED = {
  "NF-001": {
    fullName: "Sophia Lee",
    staffId: "NF-001",
    email: "sophia.lee@nailify.com",
    phone: "+1 (555) 101-2001",
    role: "SENIOR_ARTIST",
    assignedSalon: "Nailify Central",
    status: "ACTIVE",
    employmentType: "Full-time",
    experience: "6 years",
    specialties: ["Gel", "Nail Art", "Acrylic"],
    emergencyContact: "Olivia Lee · +1 (555) 010-2001",
    address: "122 East 47th St, New York, NY",
    notes: "Top performer with strong retention and premium nail art skill set.",
    schedule: {
      monday: { enabled: true, start: "09:00", end: "18:00" },
      tuesday: { enabled: true, start: "09:00", end: "18:00" },
      wednesday: { enabled: true, start: "09:00", end: "18:00" },
      thursday: { enabled: true, start: "10:00", end: "19:00" },
      friday: { enabled: true, start: "10:00", end: "19:00" },
      saturday: { enabled: true, start: "09:00", end: "16:00" },
      sunday: { enabled: false, start: "10:00", end: "15:00" },
    },
  },
  "NF-003": {
    fullName: "Nina Torres",
    staffId: "NF-003",
    email: "nina.torres@nailify.com",
    phone: "+1 (555) 101-2003",
    role: "SALON_MANAGER",
    assignedSalon: "Nailify Uptown",
    status: "ACTIVE",
    employmentType: "Full-time",
    experience: "8 years",
    specialties: ["Management", "Training"],
    emergencyContact: "Marco Torres · +1 (555) 010-2003",
    address: "88 Madison Ave, New York, NY",
    notes: "Experienced salon manager focused on team coaching and daily operations.",
    schedule: {
      monday: { enabled: true, start: "08:30", end: "17:30" },
      tuesday: { enabled: true, start: "08:30", end: "17:30" },
      wednesday: { enabled: true, start: "08:30", end: "17:30" },
      thursday: { enabled: true, start: "08:30", end: "17:30" },
      friday: { enabled: true, start: "08:30", end: "17:30" },
      saturday: { enabled: true, start: "09:00", end: "15:00" },
      sunday: { enabled: false, start: "10:00", end: "14:00" },
    },
  },
};

const ROLE_LABEL_TO_VALUE = {
  "Nail Artist": "NAIL_ARTIST",
  "Senior Nail Artist": "SENIOR_ARTIST",
  "Senior Artist": "SENIOR_ARTIST",
  "Salon Manager": "SALON_MANAGER",
  Receptionist: "RECEPTIONIST",
};

const MEMBER_STATUS_TO_FORM_STATUS = {
  available: "ACTIVE",
  leave: "ON_LEAVE",
  inactive: "INACTIVE",
};

export const createEmptyStaffForm = () => ({
  fullName: "",
  staffId: "",
  email: "",
  phone: "",
  role: "NAIL_ARTIST",
  assignedSalon: "Nailify Central",
  status: "ONBOARDING",
  employmentType: "Full-time",
  experience: "",
  specialties: ["Gel", "Nail Art"],
  emergencyContact: "",
  address: "",
  notes: "",
  schedule: Object.fromEntries(
    Object.entries(DEFAULT_STAFF_SCHEDULE).map(([day, hours]) => [day, { ...hours }]),
  ),
});

export const getStaffRoleOption = (roleValue) =>
  STAFF_ROLE_OPTIONS.find((option) => option.value === roleValue);

export const getStaffCreateStatusOption = (statusValue) =>
  STAFF_CREATE_STATUS_OPTIONS.find((option) => option.value === statusValue);

const cloneStaffMember = (member) => ({
  ...member,
  tags: member.tags.map((tag) => ({ ...tag })),
});

export const createInitialStaff = () =>
  STAFF_MEMBER_DEFINITIONS.map((member) => cloneStaffMember(member));

export const getStaffListWithUpdates = () => {
  const mergeMember = (member) => {
    const savedForm = staffFormUpdates.get(String(member.id));

    return savedForm ? applyStaffFormToMember(member, savedForm) : member;
  };

  return [
    ...createInitialStaff()
      .filter((member) => !deletedStaffIds.has(member.id))
      .map(mergeMember),
    ...createdStaffMembers
      .filter((member) => !deletedStaffIds.has(member.id))
      .map(mergeMember),
  ];
};

const findStaffMemberById = (staffId) => {
  const normalizedId = String(staffId);

  return (
    createInitialStaff().find((member) => member.id === normalizedId) ??
    createdStaffMembers.find((member) => member.id === normalizedId) ??
    null
  );
};

export const mapStaffMemberToForm = (member) => ({
  fullName: member.name,
  staffId: member.id,
  email: `${member.name.toLowerCase().replace(/\s+/g, ".")}@nailify.com`,
  phone: `+1 (555) ${member.id.slice(-3)}-${member.id.slice(-3)}`,
  role: ROLE_LABEL_TO_VALUE[member.role] ?? "NAIL_ARTIST",
  assignedSalon: member.salon,
  status: MEMBER_STATUS_TO_FORM_STATUS[member.status] ?? "ACTIVE",
  employmentType: "Full-time",
  experience: "",
  specialties: member.tags.map((tag) => tag.label),
  emergencyContact: "",
  address: "",
  notes: "",
  schedule: Object.fromEntries(
    Object.entries(DEFAULT_STAFF_SCHEDULE).map(([day, hours]) => [day, { ...hours }]),
  ),
});

export const getMockStaffFormById = (staffId) => {
  if (!staffId || deletedStaffIds.has(String(staffId))) {
    return null;
  }

  const savedForm = staffFormUpdates.get(String(staffId));
  if (savedForm) {
    return cloneStaffForm(savedForm);
  }

  const seedForm = STAFF_FORM_SEED[String(staffId)];
  if (seedForm) {
    return cloneStaffForm(seedForm);
  }

  const member = findStaffMemberById(staffId);

  return member ? mapStaffMemberToForm(member) : null;
};

export const fetchMockStaffFormById = (staffId) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(getMockStaffFormById(staffId));
    }, 350);
  });

const applyStaffFormToMember = (member, formData) => ({
  ...formDataToStaffMember(formData),
  id: member.id,
  rating: member.rating,
  bookings: member.bookings,
  retention: member.retention,
  image: member.image,
  initials: member.initials,
  avatarTone: member.avatarTone,
});

export const saveMockStaffForm = (recordId, formData) => {
  staffFormUpdates.set(String(recordId), cloneStaffForm(formData));
  deletedStaffIds.delete(String(recordId));
};

export const submitMockStaffUpdate = (recordId, formData) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      if (!recordId || deletedStaffIds.has(String(recordId))) {
        resolve({
          success: false,
          message: "Staff member not found. It may have been removed.",
        });
        return;
      }

      const member = findStaffMemberById(recordId);
      if (!member) {
        resolve({
          success: false,
          message: "Staff member not found. Please refresh and try again.",
        });
        return;
      }

      const validationError = validateStaffForm(formData);
      if (validationError) {
        resolve({ success: false, message: validationError });
        return;
      }

      saveMockStaffForm(recordId, formData);

      const createdIndex = createdStaffMembers.findIndex(
        (entry) => entry.id === String(recordId),
      );
      if (createdIndex >= 0) {
        createdStaffMembers[createdIndex] = applyStaffFormToMember(member, formData);
      }

      resolve({
        success: true,
        message: `${formData.fullName.trim()} has been updated successfully.`,
      });
    }, 600);
  });

const isStaffIdTaken = (staffId) => {
  const normalizedId = staffId.trim();

  return (
    STAFF_MEMBER_DEFINITIONS.some((member) => member.id === normalizedId) ||
    createdStaffMembers.some((member) => member.id === normalizedId)
  );
};

const cloneStaffForm = (formData) => ({
  ...formData,
  specialties: [...formData.specialties],
  schedule: Object.fromEntries(
    Object.entries(formData.schedule).map(([day, hours]) => [day, { ...hours }]),
  ),
});

const formDataToStaffMember = (formData) => {
  const roleProfile = ROLE_PROFILE_MAP[formData.role] ?? ROLE_PROFILE_MAP.NAIL_ARTIST;

  return {
    id: formData.staffId.trim(),
    name: formData.fullName.trim(),
    role: roleProfile.role,
    type: roleProfile.type,
    status: CREATE_STATUS_TO_MEMBER_STATUS[formData.status] ?? "available",
    salon: formData.assignedSalon,
    rating: "—",
    bookings: "0",
    retention: "—",
    accent: roleProfile.accent,
    accentTone: roleProfile.accentTone,
    tags: formData.specialties.map((label) => ({
      label,
      tone: SPECIALTY_TONES[label] ?? "bg-slate-100 text-slate-600",
    })),
    initials: getStaffInitials(formData.fullName.trim() || "NS"),
    avatarTone: "from-pink-400 to-rose-300",
  };
};

const validateStaffForm = (formData) => {
  if (!formData.fullName?.trim()) {
    return "Full name is required.";
  }

  if (!formData.staffId?.trim()) {
    return "Staff ID is required.";
  }

  if (!formData.email?.trim()) {
    return "Email is required.";
  }

  if (!formData.phone?.trim()) {
    return "Phone number is required.";
  }

  if (formData.specialties.length === 0) {
    return "Select at least one specialty.";
  }

  return null;
};

export const submitMockStaffCreate = (formData) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      const validationError = validateStaffForm(formData);
      if (validationError) {
        resolve({ success: false, message: validationError });
        return;
      }

      if (isStaffIdTaken(formData.staffId)) {
        resolve({
          success: false,
          message: "Staff ID already exists. Please use a different ID.",
        });
        return;
      }

      const newMember = formDataToStaffMember(cloneStaffForm(formData));
      createdStaffMembers.push(newMember);
      saveMockStaffForm(formData.staffId, formData);
      resolve({
        success: true,
        message: `${formData.fullName.trim()} has been added successfully.`,
      });
    }, 600);
  });

export const removeMockStaffById = (staffId) => {
  deletedStaffIds.add(String(staffId));
  staffFormUpdates.delete(String(staffId));

  const createdIndex = createdStaffMembers.findIndex(
    (member) => member.id === String(staffId),
  );
  if (createdIndex >= 0) {
    createdStaffMembers.splice(createdIndex, 1);
  }
};

export const matchesStaffFilter = (member, filterKey) => {
  if (filterKey === "all") {
    return true;
  }

  if (filterKey === "artist") {
    return member.type === "artist";
  }

  if (filterKey === "manager") {
    return member.type === "manager";
  }

  return member.status === filterKey;
};

export const getStaffContactEmail = (member) =>
  `${member.name.toLowerCase().replace(/\s+/g, ".")}@nailify.com`;

export const getStaffContactPhone = (member) =>
  `+1 (555) ${member.id.slice(-3)}-${member.id.slice(-3)}`;

export const getStaffContactLocation = (member) => `${member.salon} Branch`;

export const getStaffInitials = (name) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
