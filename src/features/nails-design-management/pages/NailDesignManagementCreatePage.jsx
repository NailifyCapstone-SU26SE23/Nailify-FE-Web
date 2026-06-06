import {
  Check,
  CircleDollarSign,
  Clock3,
  Copy,
  Eye,
  FileImage,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import {
  NAIL_DESIGN_CATEGORY_OPTIONS,
  NAIL_DESIGN_COLLECTION_OPTIONS,
  createEmptyNailDesign,
} from "../services/mockNailDesigns";

const DESIGN_CODE = "NDF-2025-0047";
const TAG_OPTIONS = [
  "Elegant",
  "Cute",
  "Trendy",
  "Luxury",
  "Soft Girl",
  "Office",
  "Party",
  "Y2K",
];

const PROFILE_GROUPS = [
  ["Skin Tone", ["Fair", "Light Medium", "Medium", "Tan", "Deep"]],
  ["Skin Undertone", ["Warm", "Cool", "Neutral"]],
  ["Color Palette", ["Nude", "Pink", "Red", "Black", "Chrome", "White", "Pastel", "Neon"]],
  ["Age Group", ["Teen", "20s", "30s", "40+"]],
  ["Style / Personality", ["Elegant", "Cute", "Minimal", "Sexy", "Luxury", "Feminine", "Bold", "Soft Girl", "Korean Style"]],
  ["Vibe Level", ["Subtle", "Soft", "Moderate", "Eye-catching", "Luxury Statement"]],
  ["Occasion", ["Daily", "Office", "Wedding", "Party", "Holiday", "Valentine", "Birthday", "Photoshoot"]],
  ["Hand Shape", ["Slim Fingers", "Short Fingers", "Wide Hands", "Long Fingers"]],
  ["Audience", ["Female", "Male", "Unisex", "Gay"]],
];

const STRUCTURE_GROUPS = [
  ["Nail Length", ["Short", "Medium", "Long"]],
  ["Nail Shape", ["Almond", "Square", "Round", "Oval", "Coffin", "Stiletto"]],
  ["Surface / Finish", ["Glossy", "Matte", "Chrome", "Glitter", "Jelly", "Velvet"]],
  ["Main Pattern", ["French Tip", "Floral", "Marble", "Stone", "Pearl", "Gold Line", "Sticker", "Cat Eye", "Ombre"]],
  ["Nail Complexity", ["Simple", "Medium", "Complex", "+ Premium Art"]],
];

const VARIANT_PRESETS = [
  {
    code: "BASE",
    name: "Ruby Bow Base",
    color: "Cherry Red",
    finish: "Glitter",
    shape: "Almond",
    length: "Medium",
    accessory: "Ribbon line art",
    materialCost: "85,000",
    extraFee: "0",
    quantity: "1",
    notes: ["Base color selected", "Bow artwork overlay"],
    badgeTone: "bg-[#ea4f93] text-white",
  },
  {
    code: "VAR 1",
    name: "French Ruby Variant",
    color: "Wine Red",
    finish: "Glossy",
    shape: "Oval",
    length: "Medium",
    accessory: "French tip replacement",
    materialCost: "120,000",
    extraFee: "50,000",
    quantity: "1",
    notes: ["French tip swap", "+2 complexity"],
    badgeTone: "bg-[#d4a93f] text-white",
  },
  {
    code: "VAR 2",
    name: "Rose Gold Accent Variant",
    color: "Rose Gold",
    finish: "Chrome",
    shape: "Almond",
    length: "Long",
    accessory: "Crystal charm cluster",
    materialCost: "200,000",
    extraFee: "100,000",
    quantity: "1",
    notes: ["Luxury accessory", "Overlay image required"],
    badgeTone: "bg-[#8b5cf6] text-white",
  },
];

const VARIANT_COLOR_OPTIONS = [
  "Cherry Red",
  "Wine Red",
  "Rose Gold",
  "Pearl White",
  "Champagne Gold",
  "Soft Pink",
];
const VARIANT_FINISH_OPTIONS = ["Glossy", "Glitter", "Chrome", "Velvet", "Jelly"];
const VARIANT_SHAPE_OPTIONS = ["Almond", "Oval", "Square", "Round", "Coffin"];
const VARIANT_LENGTH_OPTIONS = ["Short", "Medium", "Long"];
const VARIANT_ACCESSORY_OPTIONS = [
  "Ribbon line art",
  "French tip replacement",
  "Crystal charm cluster",
  "Pearl charm",
  "Heart gem",
  "Gold foil sticker",
];

const WORKFLOW_STEPS = [
  ["Preparation & Consultation", "Easy", "5"],
  ["Cleaning & Cuticle Care", "Easy", "10"],
  ["Nail Shaping & Filing", "Medium", "10"],
  ["Base Coat Application", "Easy", "5"],
  ["Color & Chrome Application", "Advanced", "20"],
  ["Decoration Placement", "Advanced", "15"],
  ["Top Coat Sealing", "Easy", "5"],
  ["UV/LED Curing", "Easy", "8"],
  ["Final Review & Polish", "Medium", "7"],
];

const COST_ROWS = [
  ["Gel Polish", "1", "30,000"],
  ["Chrome Powder", "1", "25,000"],
  ["Pearl Decoration", "10", "40,000"],
  ["Nail Extension", "5", "0"],
  ["Tool Usage", "1", "15,000"],
];

const SERVICE_ROWS = [
  ["Base Service", "200,000"],
  ["Staff Labor Fee", "100,000"],
  ["Complexity Fee", "50,000"],
  ["Luxury Fee", "80,000"],
  ["Variant Extra", "0"],
];

const SKILL_CARDS = [
  ["Precision", "Accuracy & Detail", 4, "Advanced"],
  ["Color", "Color Technique", 3, "Intermediate"],
  ["Form", "Nail Shape & Form", 3, "Intermediate"],
  ["Material", "Material Handling", 5, "Expert"],
  ["Design", "Aesthetic Design", 4, "Advanced"],
  ["Speed", "Service Speed", 2, "Junior"],
];

function createInitialProfileSelections() {
  return {
    "Skin Tone": ["Light Medium", "Medium"],
    "Skin Undertone": ["Cool"],
    "Color Palette": ["Red", "Pink", "Chrome"],
    "Age Group": ["20s", "30s"],
    "Style / Personality": ["Elegant", "Luxury", "Feminine"],
    "Vibe Level": ["Moderate"],
    Occasion: ["Wedding", "Party"],
    "Hand Shape": ["Slim Fingers", "Long Fingers"],
    Audience: ["Female"],
  };
}

function createInitialStructureSelections() {
  return {
    "Nail Length": "Medium",
    "Nail Shape": "Almond",
    "Surface / Finish": "Glitter",
    "Main Pattern": "French Tip",
    "Nail Complexity": "Medium",
  };
}

function getPreviewTheme(color) {
  switch (color) {
    case "Rose Gold":
      return {
        nail: "#cf7f97",
        glitter: "#f7bfd2",
        accent: "#bb5f79",
      };
    case "Pearl White":
      return {
        nail: "#efe5ea",
        glitter: "#f7f2f4",
        accent: "#d58ea7",
      };
    case "Champagne Gold":
      return {
        nail: "#d6a34c",
        glitter: "#f0d28c",
        accent: "#a8741d",
      };
    case "Soft Pink":
      return {
        nail: "#f0aac8",
        glitter: "#ffd6e7",
        accent: "#cf5e94",
      };
    case "Wine Red":
      return {
        nail: "#82192a",
        glitter: "#c42b43",
        accent: "#671120",
      };
    case "Cherry Red":
    default:
      return {
        nail: "#ad1128",
        glitter: "#e13153",
        accent: "#8e0e22",
      };
  }
}

function PillButton({
  children,
  active = false,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active
          ? "border-[#ea4f93] bg-[linear-gradient(180deg,#f25b99_0%,#d92f7b_100%)] text-white shadow-[0_10px_20px_rgba(236,72,153,0.18)]"
          : "border-[#f4c6da] bg-white text-[#8c7085] hover:border-[#ef6bb4] hover:text-[#ea4f93]"
      } ${disabled ? "cursor-not-allowed opacity-55" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionCard({ step, title, subtitle, icon, children }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[#f8d3e2] bg-white shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#f8deea] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#fff0f6_0%,#fff8e9_100%)] text-[#ea4f93]">
            {icon}
          </div>
          <div>
            <h3 className="font-extrabold text-[#432744]">{title}</h3>
            <p className="mt-1 text-xs text-[#c694ad]">{subtitle}</p>
          </div>
        </div>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ea4f93] px-2 text-[10px] font-bold text-white">
          {step}
        </span>
      </div>
      <div className="px-5 py-5">{children}</div>
    </article>
  );
}

function UploadPanel({ title, subtitle, badge }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#f6bfd7] bg-[#fff3f8] px-4 py-8 text-center">
      <Upload size={20} className="mx-auto text-[#ea4f93]" />
      <p className="mt-4 font-bold text-[#432744]">{title}</p>
      <p className="mt-1 text-xs text-[#c694ad]">{subtitle}</p>
      <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
        {badge}
      </span>
    </div>
  );
}

function SkillStars({ count }) {
  return (
    <div className="flex gap-1 text-[#ea4f93]">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < count ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

function LiveNailReference({ colorTheme, title }) {
  return (
    <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#3f403c_0%,#545256_48%,#f0f0f0_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      <div className="relative h-64 overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,rgba(0,0,0,0.18)_0%,rgba(255,255,255,0)_58%)]">
        <div className="absolute -right-12 -top-10 h-48 w-48 rotate-[32deg] bg-[radial-gradient(circle,#ffffff_0%,rgba(255,255,255,0.18)_40%,rgba(255,255,255,0)_72%)]" />
        <div className="absolute -bottom-10 left-0 right-0 h-28 rounded-[40px] bg-[rgba(0,0,0,0.14)] blur-sm" />

        <div className="absolute left-[1.7rem] top-[6.1rem] h-[8.4rem] w-[2.15rem] rotate-[18deg] rounded-[999px] bg-[linear-gradient(180deg,#f4c5b0_0%,#d69a7f_58%,#a26b58_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
          <div
            className="absolute -top-[0.7rem] left-1/2 h-[3.4rem] w-[1.8rem] -translate-x-1/2 rounded-[999px]"
            style={{
              background: `linear-gradient(180deg, ${colorTheme.glitter} 0%, ${colorTheme.nail} 100%)`,
            }}
          />
        </div>
        <div className="absolute left-[4.4rem] top-[3.9rem] h-[10.9rem] w-[2.45rem] rotate-[6deg] rounded-[999px] bg-[linear-gradient(180deg,#f3c2ad_0%,#d4977e_58%,#a56d59_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
          <div className="absolute -top-[0.9rem] left-1/2 h-[4.3rem] w-[2rem] -translate-x-1/2 rounded-[999px] bg-[linear-gradient(180deg,#f8dce6_0%,#f0b7ca_100%)]" />
          <svg
            viewBox="0 0 100 100"
            className="absolute left-1/2 top-[-0.35rem] h-[3.1rem] w-[2.5rem] -translate-x-1/2"
          >
            <path
              d="M49 50 C32 31, 17 28, 18 44 C19 58, 34 58, 49 50"
              fill="none"
              stroke={colorTheme.nail}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M51 50 C68 31, 83 28, 82 44 C81 58, 66 58, 51 50"
              fill="none"
              stroke={colorTheme.nail}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M50 49 C51 66, 49 77, 41 88"
              fill="none"
              stroke={colorTheme.nail}
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="absolute left-[7.8rem] top-[2.9rem] h-[12.2rem] w-[2.7rem] rotate-[2deg] rounded-[999px] bg-[linear-gradient(180deg,#f2c0aa_0%,#d3967d_58%,#a26c58_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
          <div
            className="absolute -top-[1rem] left-1/2 h-[4.8rem] w-[2.2rem] -translate-x-1/2 rounded-[999px]"
            style={{
              background: `linear-gradient(180deg, ${colorTheme.glitter} 0%, ${colorTheme.nail} 100%)`,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
            }}
          />
          <div className="absolute left-[55%] top-[0.25rem] h-2.5 w-1.5 rotate-[18deg] rounded-full bg-white/85" />
        </div>
        <div className="absolute left-[11.2rem] top-[5.15rem] h-[8.8rem] w-[2.15rem] rotate-[-8deg] rounded-[999px] bg-[linear-gradient(180deg,#f2bfaa_0%,#d09279_58%,#a16b57_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
          <div className="absolute -top-[0.75rem] left-1/2 h-[3.7rem] w-[1.8rem] -translate-x-1/2 rounded-[999px] bg-[linear-gradient(180deg,#f7d9e5_0%,#f1b6ca_100%)]" />
          <div
            className="absolute -top-[0.72rem] left-1/2 h-[1.25rem] w-[1.8rem] -translate-x-1/2 rounded-t-[999px]"
            style={{ backgroundColor: colorTheme.nail }}
          />
          <div className="absolute left-[54%] top-[0.75rem] h-2 w-1.25 rotate-[18deg] rounded-full bg-white/85" />
        </div>
        <div className="absolute right-[-0.2rem] bottom-[-1.15rem] h-[6.7rem] w-[2.4rem] rotate-[26deg] rounded-[999px] bg-[linear-gradient(180deg,#f2bfaa_0%,#d09279_58%,#a16b57_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
          <div
            className="absolute -top-[0.65rem] left-1/2 h-[3.1rem] w-[1.9rem] -translate-x-1/2 rounded-[999px]"
            style={{
              background: `linear-gradient(180deg, ${colorTheme.glitter} 0%, ${colorTheme.nail} 100%)`,
            }}
          />
        </div>

        <div className="absolute bottom-[-0.15rem] left-[-0.2rem] h-20 w-36 rounded-tr-[999px] bg-[#f9f6f1] shadow-[0_-4px_18px_rgba(255,255,255,0.25)]" />
      </div>
      <p className="mt-4 text-center font-semibold text-white">{title}</p>
      <p className="mt-1 text-center text-xs text-white/80">
        Reference-style preview based on the selected variant
      </p>
    </div>
  );
}

export function NailDesignManagementCreatePage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createEmptyNailDesign);
  const [selectedTags, setSelectedTags] = useState(["Elegant", "Trendy", "Luxury"]);
  const [profileSelections, setProfileSelections] = useState(createInitialProfileSelections);
  const [structureSelections, setStructureSelections] = useState(createInitialStructureSelections);
  const [variants, setVariants] = useState(VARIANT_PRESETS);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleCreate = () => {
    navigate(ROUTES.adminNailDesigns, {
      state: {
        flashMessage: `Mock create completed for ${formValues.name || "new nail design"}.`,
      },
    });
  };

  const toggleTag = (tag) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  const toggleProfileSelection = (group, value) => {
    setProfileSelections((current) => {
      const values = current[group] ?? [];
      return {
        ...current,
        [group]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  };

  const selectStructureValue = (group, value) => {
    setStructureSelections((current) => ({
      ...current,
      [group]: value,
    }));
  };

  const updateVariant = (index, field, value) => {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const addVariant = () => {
    setVariants((current) => {
      const nextNumber = current.length;
      const source = current[activeVariantIndex] ?? current[0];
      const nextVariant = {
        ...source,
        code: `VAR ${nextNumber}`,
        name: `${source.name} Copy`,
      };
      return [...current, nextVariant];
    });
    setActiveVariantIndex(variants.length);
  };

  const duplicateVariant = (index) => {
    setVariants((current) => {
      const source = current[index];
      const nextVariant = {
        ...source,
        code: `VAR ${current.length}`,
        name: `${source.name} Copy`,
      };
      return [...current, nextVariant];
    });
  };

  const removeVariant = (index) => {
    setVariants((current) => {
      if (current.length === 1) {
        return current;
      }
      const next = current.filter((_, variantIndex) => variantIndex !== index);
      const nextActiveIndex =
        activeVariantIndex >= next.length ? next.length - 1 : activeVariantIndex;
      setActiveVariantIndex(nextActiveIndex);
      return next;
    });
  };

  const activeVariant = variants[activeVariantIndex] ?? variants[0];
  const colorTheme = getPreviewTheme(activeVariant?.color);
  const complexityValue = structureSelections["Nail Complexity"];
  const complexityProgress =
    complexityValue === "Simple"
      ? "w-[22%]"
      : complexityValue === "Complex"
        ? "w-[74%]"
        : complexityValue === "+ Premium Art"
          ? "w-full"
          : "w-[52%]";

  const previewTitle = `${activeVariant?.color ?? "Cherry Red"} / ${
    structureSelections["Nail Shape"]
  } / ${structureSelections["Nail Length"]}`;

  const estimatedProfit = useMemo(() => "320,000 đ", []);

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[1.7rem] font-extrabold text-[#432744]">
              Create New Nail Design Template
            </h2>
            <p className="mt-1 text-sm text-[#c694ad]">
              Build a complete AI-ready nail design profile for the Nailify system.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-[#fff4df] px-4 py-2 text-xs font-bold text-[#d9871c]">
              Draft
            </span>
            <button
              type="button"
              className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#7e6075]"
            >
              <Save size={13} className="mr-1.5 inline" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
            >
              <Sparkles size={13} className="mr-1.5 inline" />
              Publish Design
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <SectionCard
            step="1"
            title="Basic Nail Design Information"
            subtitle="Core identity of this nail design template"
            icon={<Sparkles size={18} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-1">
                <span className="text-sm font-semibold text-[#5c4559]">Nail Design Name</span>
                <input
                  value={formValues.name}
                  onChange={handleChange("name")}
                  placeholder="e.g. Ruby Bow Romance"
                  className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5c4559]">Design Code</span>
                <input
                  value={DESIGN_CODE}
                  readOnly
                  className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fff8fb] px-4 text-sm text-[#7e6075] outline-none"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#5c4559]">Short Description</span>
                <textarea
                  value={formValues.description}
                  onChange={handleChange("description")}
                  rows={3}
                  placeholder="Describe the nail design style, feel, and key visual elements..."
                  className="w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 py-3 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[#5c4559]">Design Category</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {NAIL_DESIGN_CATEGORY_OPTIONS.slice(0, 10).map((item) => (
                    <PillButton
                      key={item}
                      active={item === formValues.category}
                      onClick={() =>
                        setFormValues((current) => ({ ...current, category: item }))
                      }
                    >
                      {item}
                    </PillButton>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#5c4559]">Design Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((item) => (
                    <PillButton
                      key={item}
                      active={selectedTags.includes(item)}
                      onClick={() => toggleTag(item)}
                    >
                      {item}
                    </PillButton>
                  ))}
                </div>
              </div>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-semibold text-[#5c4559]">Collection Name</span>
              <select
                value={formValues.collection}
                onChange={handleChange("collection")}
                className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
              >
                {NAIL_DESIGN_COLLECTION_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </SectionCard>

          <SectionCard
            step="2"
            title="Customer Matching Profile"
            subtitle="AI recommendation and customer personalization engine"
            icon={<WandSparkles size={18} />}
          >
            <div className="space-y-5">
              {PROFILE_GROUPS.map(([label, items], groupIndex) => (
                <div key={label} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#5c4559]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ffe7ef] text-[10px] font-bold text-[#ea4f93]">
                      {groupIndex + 1}
                    </span>
                    {label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <PillButton
                        key={item}
                        active={(profileSelections[label] ?? []).includes(item)}
                        onClick={() => toggleProfileSelection(label, item)}
                      >
                        {item}
                      </PillButton>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[18px] bg-[linear-gradient(180deg,#efe9ff_0%,#ede8ff_100%)] px-4 py-3 text-xs text-[#7b67a6]">
              This information helps the AI recommend suitable nail styles for customers based on their profile, preferences, and booking history.
            </div>
          </SectionCard>

          <SectionCard
            step="3"
            title="Nail Structure & Visual Design"
            subtitle="Define the physical and visual characteristics"
            icon={<Palette size={18} />}
          >
            <div className="space-y-5">
              {STRUCTURE_GROUPS.map(([label, items], groupIndex) => (
                <div key={label} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#5c4559]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ffe7ef] text-[10px] font-bold text-[#ea4f93]">
                      {groupIndex + 1}
                    </span>
                    {label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <PillButton
                        key={item}
                        active={structureSelections[label] === item}
                        onClick={() => selectStructureValue(label, item)}
                      >
                        {item}
                      </PillButton>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="h-2 rounded-full bg-[#f9d8e5]">
                <div className={`h-full rounded-full bg-[image:var(--gradient-accent)] ${complexityProgress}`} />
              </div>
              <div className="mt-2 grid grid-cols-4 text-[10px] text-[#c694ad]">
                <span>Simple</span>
                <span className="text-center">Medium</span>
                <span className="text-center">Complex</span>
                <span className="text-right">Premium</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step="4"
            title="Nail Variants & Accessory Replacement"
            subtitle="Choose color first, then structure, then accessory replacement and overlay assets for each variant"
            icon={<Copy size={18} />}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={addVariant}
                className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
              >
                <Plus size={13} className="mr-1.5 inline" />
                Add New Variant
              </button>
            </div>

            <div className="space-y-5">
              {variants.map((variant, index) => (
                <div
                  key={`${variant.code}-${index}`}
                  className={`rounded-[22px] border p-4 transition ${
                    activeVariantIndex === index
                      ? "border-[#ef6bb4] bg-[#fff0f6] shadow-[0_12px_24px_rgba(236,72,153,0.12)]"
                      : "border-[#f7d7e5] bg-[#fff3f8]"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveVariantIndex(index)}
                      className="flex items-center gap-3 text-left"
                    >
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${variant.badgeTone}`}>
                        {variant.code}
                      </span>
                      <h4 className="font-extrabold text-[#432744]">{variant.name}</h4>
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => duplicateVariant(index)}
                        className="rounded-xl bg-white p-2 text-[#d58aa8]"
                        title="Duplicate variant"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="rounded-xl bg-white p-2 text-[#ea4f93]"
                        title="Remove variant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                          Step A. Variant Color & Finish
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {VARIANT_COLOR_OPTIONS.map((item) => (
                            <PillButton
                              key={item}
                              active={variant.color === item}
                              onClick={() => updateVariant(index, "color", item)}
                            >
                              {item}
                            </PillButton>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {VARIANT_FINISH_OPTIONS.map((item) => (
                            <PillButton
                              key={item}
                              active={variant.finish === item}
                              onClick={() => updateVariant(index, "finish", item)}
                            >
                              {item}
                            </PillButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                          Step B. Nail Structure
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {VARIANT_SHAPE_OPTIONS.map((item) => (
                            <PillButton
                              key={item}
                              active={variant.shape === item}
                              onClick={() => updateVariant(index, "shape", item)}
                            >
                              {item}
                            </PillButton>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {VARIANT_LENGTH_OPTIONS.map((item) => (
                            <PillButton
                              key={item}
                              active={variant.length === item}
                              onClick={() => updateVariant(index, "length", item)}
                            >
                              {item}
                            </PillButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                          Step C. Accessory Replacement
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {VARIANT_ACCESSORY_OPTIONS.map((item) => (
                            <PillButton
                              key={item}
                              active={variant.accessory === item}
                              onClick={() => updateVariant(index, "accessory", item)}
                            >
                              {item}
                            </PillButton>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {variant.notes.map((item) => (
                            <PillButton key={item}>{item}</PillButton>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[#5c4559]">Material Cost</span>
                          <input
                            value={variant.materialCost}
                            onChange={(event) =>
                              updateVariant(index, "materialCost", event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm text-[#432744] outline-none"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[#5c4559]">Extra Service Fee</span>
                          <input
                            value={variant.extraFee}
                            onChange={(event) =>
                              updateVariant(index, "extraFee", event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm text-[#432744] outline-none"
                          />
                        </label>
                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-sm font-semibold text-[#5c4559]">Amount</span>
                          <input
                            value={variant.quantity}
                            onChange={(event) =>
                              updateVariant(index, "quantity", event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm text-[#432744] outline-none"
                          />
                        </label>
                      </div>

                      <div className="rounded-[18px] border border-dashed border-[#f4bfd6] bg-white px-4 py-6 text-center">
                        <FileImage size={20} className="mx-auto text-[#ea4f93]" />
                        <p className="mt-4 font-bold text-[#432744]">
                          Variant Overlay Asset
                        </p>
                        <p className="mt-1 text-xs text-[#c694ad]">
                          Upload accessory PNG / artwork overlay to attach on top of the nail preview for this variant.
                        </p>
                        <button
                          type="button"
                          className="mt-4 rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
                        >
                          <Upload size={13} className="mr-1.5 inline" />
                          Upload Variant Asset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            step="5"
            title="Nail Design Image & Media"
            subtitle="Visual assets for preview, try-on, and customer showcase"
            icon={<FileImage size={18} />}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <UploadPanel
                  title="Main Nail Preview Image"
                  subtitle="The primary showcase image — high resolution recommended"
                  badge="Primary Asset"
                />
              </div>
              <UploadPanel
                title="Gallery Images"
                subtitle="Multiple angles & close-ups"
                badge="Up to 8 images"
              />
              <UploadPanel
                title="Before / After"
                subtitle="Customer transformation reference"
                badge="Optional"
              />
              <UploadPanel
                title="Virtual Try-On Asset"
                subtitle="AR-ready nail overlay (PNG + alpha)"
                badge="Try-On Ready"
              />
              <UploadPanel
                title="Process Video"
                subtitle="Time-lapse or tutorial video"
                badge="Optional"
              />
            </div>
          </SectionCard>

          <SectionCard
            step="6"
            title="Service Workflow Mapping"
            subtitle="Map design to actual service steps"
            icon={<Clock3 size={18} />}
          >
            <div className="space-y-3">
              {WORKFLOW_STEPS.map(([label, level, time], index) => (
                <div
                  key={label}
                  className="grid gap-3 rounded-[18px] border border-[#f7d7e5] bg-[#fff3f8] px-4 py-3 md:grid-cols-[minmax(0,1fr)_110px_170px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ea4f93] text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="font-semibold text-[#432744]">{label}</p>
                  </div>
                  <div className="flex items-center md:justify-center">
                    <PillButton disabled>{level}</PillButton>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={time}
                      readOnly
                      className="h-10 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm text-[#432744] outline-none"
                    />
                    <span className="text-sm text-[#c694ad]">min</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-[#fff3f8] px-4 py-3 text-sm">
              <p className="font-semibold text-[#8c7085]">
                Total Estimated Duration: <span className="text-[#432744]">85 minutes</span>
              </p>
              <button
                type="button"
                className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
              >
                Add Step
              </button>
            </div>
          </SectionCard>

          <SectionCard
            step="7"
            title="Material & Service Costing"
            subtitle="Complete cost breakdown and pricing configuration"
            icon={<CircleDollarSign size={18} />}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fff3f8] p-4">
                <p className="font-bold text-[#432744]">Material Cost</p>
                <div className="mt-4 space-y-3">
                  {COST_ROWS.map(([label, qty, price]) => (
                    <div key={label} className="grid grid-cols-[1fr_120px_140px] gap-3">
                      <span className="self-center text-sm text-[#8c7085]">{label}</span>
                      <input
                        value={`Amount   ${qty}`}
                        readOnly
                        className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                      />
                      <input
                        value={`${price}   đ`}
                        readOnly
                        className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#f5cfe0] pt-4 text-sm font-bold">
                  <span className="text-[#432744]">Material Total</span>
                  <span className="text-[#ea4f93]">110,000 đ</span>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fff3f8] p-4">
                <p className="font-bold text-[#432744]">Service Pricing</p>
                <div className="mt-4 space-y-3">
                  {SERVICE_ROWS.map(([label, price]) => (
                    <div key={label} className="grid grid-cols-[1fr_140px] gap-3">
                      <span className="self-center text-sm text-[#8c7085]">{label}</span>
                      <input
                        value={`${price}   đ`}
                        readOnly
                        className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#f5cfe0] pt-4 text-sm font-bold">
                  <span className="text-[#432744]">Service Total</span>
                  <span className="text-[#ea4f93]">430,000 đ</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-[20px] bg-[image:var(--gradient-accent)] p-4 text-center text-white md:grid-cols-4">
              {[
                ["540K đ", "Suggested Price"],
                ["430K đ", "Selling Price"],
                [estimatedProfit, "Est. Profit"],
                ["74%", "Margin"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold">{value}</p>
                  <p className="mt-1 text-xs text-white/80">{label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            step="8"
            title="Staff Skill Requirements"
            subtitle="Skill levels required to perform this nail design"
            icon={<WandSparkles size={18} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {SKILL_CARDS.map(([title, subtitle, score, level]) => (
                <div
                  key={title}
                  className="rounded-[18px] border border-[#f7d7e5] bg-[#fff3f8] p-4"
                >
                  <p className="font-extrabold text-[#432744]">{title}</p>
                  <p className="mt-1 text-xs text-[#c694ad]">{subtitle}</p>
                  <div className="mt-3">
                    <SkillStars count={score} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#8c7085]">
                    {score}★ {level}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[18px] bg-[linear-gradient(180deg,#efe9ff_0%,#ede8ff_100%)] px-4 py-3 text-xs text-[#7b67a6]">
              These skill requirements are used to automatically match suitable staff for customer bookings. Only staff who meet minimum skill levels will be assigned.
            </div>
          </SectionCard>

          <SectionCard
            step="9"
            title="Final Review & Publish"
            subtitle="Review your complete nail design template before publishing"
            icon={<Check size={18} />}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                [structureSelections["Nail Complexity"], "Complexity Level"],
                ["430K đ", "Suggested Price"],
                ["85 min", "Est. Duration"],
                [String(variants.length), "Variants"],
                ["9 Steps", "Workflow"],
                ["74%", "Profit Margin"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-[#f7d7e5] bg-[#fff3f8] px-4 py-5 text-center"
                >
                  <p className="text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                  <p className="mt-1 text-xs text-[#c694ad]">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {[
                ["Required fields completed", "Done"],
                ["Pricing configured", "Done"],
                ["Workflow mapped (9 steps)", "Done"],
                ["Staff skills configured", "Done"],
                ["Media assets uploaded", activeVariant.accessory ? "Pending" : "Pending"],
              ].map(([label, status]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-[14px] bg-[#fff3f8] px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        status === "Done" ? "bg-[#eaf9ee] text-[#2fa25f]" : "bg-[#fff4df] text-[#d9871c]"
                      }`}
                    >
                      {status === "Done" ? <Check size={12} /> : <Clock3 size={12} />}
                    </span>
                    <span className="font-medium text-[#5c4559]">{label}</span>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      status === "Done" ? "text-[#2fa25f]" : "text-[#d9871c]"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
              >
                <Sparkles size={13} className="mr-1.5 inline" />
                Publish Design
              </button>
              <button
                type="button"
                className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#7e6075]"
              >
                <Save size={13} className="mr-1.5 inline" />
                Save Draft
              </button>
              <button
                type="button"
                className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#7e6075]"
              >
                <Eye size={13} className="mr-1.5 inline" />
                Preview Recommendation
              </button>
              <button
                type="button"
                className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#7e6075]"
              >
                Preview Try-On
              </button>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-[#f8d3e2] bg-[linear-gradient(180deg,#fff7fb_0%,#fff1f6_100%)] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#432744]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#ff477f]" />
              Live Nail Preview
            </div>
            <div className="mt-4">
              <LiveNailReference colorTheme={colorTheme} title={previewTitle} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PillButton active>Trending</PillButton>
              <PillButton>New</PillButton>
              <PillButton>Popular</PillButton>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f8d3e2] bg-[#fff7fb] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <h3 className="font-extrabold text-[#432744]">Current Variant</h3>
            <div className="mt-4 space-y-2 text-sm text-[#8c7085]">
              <div className="flex items-center justify-between gap-3">
                <span>Color</span>
                <span className="font-semibold text-[#432744]">{activeVariant.color}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Finish</span>
                <span className="font-semibold text-[#432744]">{activeVariant.finish}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Shape</span>
                <span className="font-semibold text-[#432744]">{activeVariant.shape}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Length</span>
                <span className="font-semibold text-[#432744]">{activeVariant.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Accessory</span>
                <span className="font-semibold text-right text-[#432744]">{activeVariant.accessory}</span>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f8d3e2] bg-[#fff7fb] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <h3 className="font-extrabold text-[#432744]">Staff Matching</h3>
            <div className="mt-4 space-y-3">
              {[
                ["My Linh", "Master Artist", "✓ Match"],
                ["Thu Ha", "Advanced Artist", "✓ Match"],
                ["Ngoc Anh", "Advanced Artist", "✓ Match"],
              ].map(([name, role, status]) => (
                <div key={name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ea4f93_0%,#9b5cf6_100%)] text-[10px] font-bold text-white">
                      {name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#432744]">{name}</p>
                      <p className="text-[11px] text-[#c694ad]">{role} ★★★★★</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2fa25f]">{status}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[16px] bg-[#fff4df] px-3 py-3 text-xs text-[#af7a22]">
              Material skill requires expert level for the current accessory replacement.
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f8d3e2] bg-[#fff7fb] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <h3 className="font-extrabold text-[#432744]">Profit Analysis</h3>
            <div className="mt-4 space-y-2 text-sm">
              {[
                ["Material Cost", "110,000 đ"],
                ["Labor Cost", "100,000 đ"],
                ["Overhead & Tools", "20,000 đ"],
                ["Total Cost", "230,000 đ"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-[#8c7085]">
                  <span>{label}</span>
                  <span className="font-semibold text-[#432744]">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[18px] bg-[image:var(--gradient-accent)] px-4 py-5 text-center text-white">
              <p className="text-3xl font-extrabold">{estimatedProfit}</p>
              <p className="mt-1 text-xs text-white/80">Estimated Profit per Service</p>
              <p className="mt-2 text-sm font-semibold">74% Margin</p>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f8d3e2] bg-[#fff7fb] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <h3 className="font-extrabold text-[#432744]">Quick Actions</h3>
            <div className="mt-4 space-y-2">
              {[
                ["Add New Variant", addVariant],
                ["Upload Media", null],
                ["Preview Workflow", null],
                ["Launch Try-On Preview", null],
              ].map(([label, action]) => (
                <button
                  key={label}
                  type="button"
                  onClick={action ?? undefined}
                  className="w-full rounded-full border border-[#f4c6da] bg-white px-4 py-2.5 text-left text-xs font-bold text-[#7e6075]"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
