export const NAIL_DESIGN_SUMMARY = [
  {
    label: "Total designs",
    value: "8",
    description: "mock catalog entries available for admin review",
  },
  {
    label: "Featured",
    value: "3",
    description: "designs currently highlighted on promotional surfaces",
  },
  {
    label: "Draft concepts",
    value: "2",
    description: "designs still waiting for final merchandising approval",
  },
];

const NAIL_DESIGN_FIELDS = [
  "id",
  "name",
  "category",
  "collection",
  "status",
  "price",
  "duration",
  "artist",
  "popularity",
  "updatedAt",
  "palette",
  "tags",
  "description",
  "notes",
];

const createMockNailDesign = (definition) =>
  NAIL_DESIGN_FIELDS.reduce((design, field, index) => {
    design[field] = definition[index];
    return design;
  }, {});

const NAIL_DESIGN_ROW_DEFINITIONS = [];

export const NAIL_DESIGN_ROWS = NAIL_DESIGN_ROW_DEFINITIONS.map((definition) =>
  createMockNailDesign(definition),
);

export const NAIL_DESIGN_STATUS_FILTERS = [
  "All",
  "Published",
  "Draft",
  "Review",
  "Archived",
];

export const NAIL_DESIGN_STATUS_STYLES = {
  Published: "bg-[#edfdf4] text-[#16975f]",
  Draft: "bg-[#fff7e7] text-[#cc8a16]",
  Review: "bg-[#eef4ff] text-[#3f68c9]",
  Archived: "bg-[#fff0f5] text-[#d14c84]",
};

export const NAIL_DESIGN_CATEGORY_OPTIONS = [
  "Chrome",
  "Minimal",
  "Aura",
  "Cat Eye",
  "Jelly",
  "Marble",
  "Bridal",
  "Graphic",
];

export const NAIL_DESIGN_COLLECTION_OPTIONS = [
  "Summer 2026",
  "Everyday Edit",
  "Night Luxe",
  "Glass Candy",
  "Autumn Preview",
  "Ceremony Suite",
  "Studio Lab",
];

export const NAIL_DESIGN_POPULARITY_OPTIONS = [
  "New",
  "Stable",
  "Rising",
  "Trending",
  "Cooling",
];

export const createEmptyNailDesign = () => ({
  id: "ND-NEW",
  name: "",
  category: NAIL_DESIGN_CATEGORY_OPTIONS[0],
  collection: NAIL_DESIGN_COLLECTION_OPTIONS[0],
  status: "Draft",
  price: "",
  duration: "60 min",
  artist: "",
  popularity: "New",
  updatedAt: "2026-06-05",
  palette: "",
  tags: "",
  description: "",
  notes: "",
});

export const getMockNailDesignById = (designId) => null;

const DEFAULT_DESIGN_DETAIL = {
  breadcrumbsLabel: "Chrome Pearl Elegance",
  heroTitle: "Chrome Pearl Elegance",
  heroSubtitle:
    "A sophisticated chrome nail design featuring lustrous pearl accents and delicate gold line detailing.",
  designStatus: "Active",
  tryOnReady: true,
  complexity: "Advanced",
  estimatedDuration: "90 minutes",
  nailShape: "Almond",
  nailLength: "Medium",
  suggestedPrice: "VND680,000",
  popularityScore: "8.8/10",
  bookingRate: "74%",
  customerRating: "4.6★",
  favorites: "427",
  totalBookings: "312",
  avgRating: "4.7★",
  repeatRate: "68%",
  customerProfile: {
    "Skin Tone": ["Fair", "Light Medium", "Medium"],
    "Skin Undertone": ["Cool", "Neutral"],
    Occasion: ["Wedding", "Party", "Photoshoot"],
    "Age Group": ["20s", "30s"],
    Style: ["Elegant", "Feminine", "Luxury"],
    Audience: ["Female", "Unisex"],
    Vibe: ["Soft but eye-catching"],
    "Hand Shape": ["Slim Fingers", "Long Fingers"],
  },
  designComponents: [
    ["Nail Length", "Medium"],
    ["Nail Shape", "Almond"],
    ["Main Color", "Pearl Chrome"],
    ["Surface / Finish", "Glossy"],
    ["Decoration", "Pearl + Gold Line"],
    ["Complexity", "Advanced"],
    ["Texture", "Chrome"],
    ["Pattern", "Minimal Pearl"],
  ],
  variants: [
    {
      name: "Minimal Pearl Variant",
      description: "Changed textured pearl density, no gold charm",
      materialDelta: "+VND30,000 material",
      priceDelta: "+VND50,000 price",
      level: "Intermediate",
      duration: "75 min",
    },
    {
      name: "Luxury Stone Variant",
      description: "Changed Swarovski crystal stones added",
      materialDelta: "+VND85,000 material",
      priceDelta: "+VND200,000 price",
      level: "Expert",
      duration: "110 min",
    },
    {
      name: "Bridal Pearl Variant",
      description: "Changed full pearl coverage + lace pattern",
      materialDelta: "+VND70,000 material",
      priceDelta: "+VND150,000 price",
      level: "Expert",
      duration: "120 min",
    },
    {
      name: "Gold Charm Variant",
      description: "Changed gold charm pendants on ring finger",
      materialDelta: "+VND45,000 material",
      priceDelta: "+VND90,000 price",
      level: "Advanced",
      duration: "95 min",
    },
  ],
  pricing: {
    materialCosts: [
      ["Gel Polish Cost", "VND45,000"],
      ["Chrome Powder Cost", "VND38,000"],
      ["Pearl Decoration Cost", "VND52,000"],
      ["Gold Line Cost", "VND18,000"],
      ["Tool Usage Cost", "VND12,000"],
    ],
    servicePricing: [
      ["Base Service Price", "VND280,000"],
      ["Decoration Fee", "VND80,000"],
      ["Complexity Fee", "VND60,000"],
      ["Staff Labor Fee", "VND120,000"],
      ["Variant Extra Fee", "VND0"],
    ],
    summary: [
      ["Total Material Cost", "VND165,000"],
      ["Total Service Price", "VND540,000"],
      ["Overhead & Tax (10%)", "VND54,000"],
      ["Suggested Selling Price", "VND680,000"],
      ["Estimated Profit", "VND461,000"],
      ["Profit Margin", "67.8%"],
    ],
    comparison: [
      ["Market Average", "VND620,000"],
      ["Our Price", "VND680,000"],
      ["Premium vs Market", "+9.7%"],
    ],
  },
  workflow: [
    ["Preparation", "5 min", ["Sanitizer", "Towel", "Tray"], "Easy"],
    ["Cleaning & Cuticle Care", "10 min", ["Cuticle Remover", "Pusher", "Nipper"], "Moderate"],
    ["Nail Shaping", "8 min", ["File", "Buffer", "Almond Form Guide"], "Moderate"],
    ["Base Coat Application", "5 min", ["Bonding Agent", "Base Gel"], "Easy"],
    ["Color Application", "13 min", ["Pearl Chrome Gel Polish (2 coats)"], "Advanced"],
    ["Chrome & Decoration", "20 min", ["Chrome Powder", "Pearl Beads", "Gold Liner"], "Expert"],
    ["Top Coat Sealing", "5 min", ["No-Wipe Top Coat", "Gel Sealer"], "Moderate"],
    ["UV/LED Drying", "15 min", ["LED Lamp 48W", "UV Lamp"], "Easy"],
    ["Final Review & Finishing", "10 min", ["Cuticle Oil", "Brush Cleaner"], "Easy"],
  ],
  skills: [
    ["Precision", "Accuracy & Detail", 4, "4★ Advanced"],
    ["Color", "Color Matching", 5, "5★ Expert"],
    ["Design", "Artistry", 5, "5★ Expert"],
    ["Form", "Nail Shape & Form", 3, "3★ Intermediate"],
    ["Material", "Material Handling", 4, "4★ Advanced"],
    ["Speed", "Job Speed", 3, "3★ Intermediate"],
  ],
  staffMatch: [
    ["Linh Nguyen", "94% match"],
    ["Mai Tran", "94% match"],
    ["Hoa Pham", "89% match"],
  ],
  eligibleArtists: "8",
  expertLevel: "3",
  advancedLevel: "5",
};

const DESIGN_DETAIL_OVERRIDES = {
  "ND-3001": {
    breadcrumbsLabel: "Chrome Pearl Elegance",
    heroTitle: "Chrome Pearl Elegance",
    heroSubtitle:
      "A sophisticated chrome nail design featuring lustrous pearl accents and delicate gold line detailing. Crafted for clients who desire an elevated, feminine aesthetic.",
  },
  "ND-3002": {
    breadcrumbsLabel: "Matcha Minimal Tips",
    heroTitle: "Matcha Minimal Tips",
    designStatus: "Active",
    complexity: "Intermediate",
    suggestedPrice: "VND420,000",
  },
  "ND-3004": {
    breadcrumbsLabel: "Velvet Midnight Cat Eye",
    heroTitle: "Velvet Midnight Cat Eye",
    complexity: "Expert",
    suggestedPrice: "VND720,000",
  },
};

export const getMockNailDesignDetailById = (designId) => null;
