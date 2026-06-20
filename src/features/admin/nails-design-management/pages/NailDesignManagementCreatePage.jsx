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
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { formatDurationLabel } from "../../../../shared/utils/formatDuration";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  NAIL_DESIGN_CATEGORY_OPTIONS,
  NAIL_DESIGN_COLLECTION_OPTIONS,
  createEmptyNailDesign,
} from "../services/mockNailDesigns";

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
  ["Audience", ["Female", "Male", "Others"]],
];

const STRUCTURE_GROUPS = [
  ["Nail Length", ["Short", "Medium", "Long"]],
  ["Nail Shape", ["Almond", "Square", "Round", "Oval", "Coffin", "Stiletto"]],
  ["Surface / Finish", ["Glossy", "Matte", "Chrome", "Glitter", "Jelly", "Velvet"]],
  ["Main Pattern", ["French Tip", "Floral", "Marble", "Stone", "Pearl", "Gold Line", "Sticker", "Cat Eye", "Ombre"]],
  ["Nail Complexity", ["Simple", "Medium", "Complex", "+ Premium Art"]],
];


const VARIANT_COLOR_OPTIONS = [
  { label: "Cherry Red", swatch: "linear-gradient(135deg,#d61f4b 0%,#8e0e22 100%)" },
  { label: "Wine Red", swatch: "linear-gradient(135deg,#9c2438 0%,#5f1120 100%)" },
  { label: "Rose Gold", swatch: "linear-gradient(135deg,#e2a3b8 0%,#bb5f79 100%)" },
  { label: "Pearl White", swatch: "linear-gradient(135deg,#fff8fb 0%,#d9b8c8 100%)" },
  { label: "Champagne Gold", swatch: "linear-gradient(135deg,#f0d28c 0%,#b98522 100%)" },
  { label: "Soft Pink", swatch: "linear-gradient(135deg,#ffd9ea 0%,#e47fb0 100%)" },
];
const VARIANT_FINISH_OPTIONS = ["Glossy", "Glitter", "Chrome", "Velvet", "Jelly"];
const VARIANT_SHAPE_OPTIONS = [
  { label: "Almond", previewStyle: { borderRadius: "999px 999px 720px 720px" } },
  { label: "Oval", previewStyle: { borderRadius: "999px" } },
  { label: "Square", previewStyle: { borderRadius: "10px" } },
  { label: "Round", previewStyle: { borderRadius: "999px 999px 520px 520px" } },
  { label: "Coffin", previewStyle: { clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)" } },
];
const VARIANT_LENGTH_OPTIONS = ["Short", "Medium", "Long"];
const VARIANT_ACCESSORY_OPTIONS = [
  "Ribbon line art",
  "French tip replacement",
  "Crystal charm cluster",
  "Pearl charm",
  "Heart gem",
  "Gold foil sticker",
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
  return Object.fromEntries(PROFILE_GROUPS.map(([label]) => [label, []]));
}

function createInitialStructureSelections() {
  return Object.fromEntries(STRUCTURE_GROUPS.map(([label]) => [label, ""]));
}

function createEmptyVariant(index, structureSelections = {}) {
  return {
    code: index === 0 ? "BASE" : `VAR ${index}`,
    name: "",
    color: "Cherry Red",
    finish: structureSelections["Surface / Finish"] || "Glossy",
    shape: structureSelections["Nail Shape"] || "Almond",
    length: structureSelections["Nail Length"] || "Medium",
    accessory: "",
    materialCost: "0",
    extraFee: "0",
    quantity: "1",
    notes: [],
    badgeTone: index === 0 ? "bg-[#ea4f93] text-white" : "bg-[#f2e9ff] text-[#8b5cf6]",
  };
}

function createEmptyWorkflowStep(index) {
  return [`Step ${index + 1}`, "Easy", "0"];
}

function createEmptyCostRow(index) {
  return [`Material ${index + 1}`, "1", "0"];
}

function createEmptyServiceRow(index) {
  return [`Service Fee ${index + 1}`, "0"];
}

function createInitialSkillCards() {
  return SKILL_CARDS.map(([title, subtitle]) => [title, subtitle, 1, "Beginner"]);
}

function parseCurrencyValue(value) {
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
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

PillButton.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

function ColorSwatchButton({ active = false, label, onClick, swatch }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[92px] flex-col items-center gap-2 rounded-[18px] border px-3 py-3 text-center transition ${
        active
          ? "border-[#ea4f93] bg-[#fff0f7] shadow-[0_10px_20px_rgba(236,72,153,0.12)]"
          : "border-[#f4c6da] bg-white hover:border-[#ef6bb4]"
      }`}
    >
      <span
        className="h-9 w-9 rounded-full border border-white shadow-[0_6px_14px_rgba(67,39,68,0.12)]"
        style={{ background: swatch }}
      />
      <span className={`text-[11px] font-bold ${active ? "text-[#ea4f93]" : "text-[#7e6075]"}`}>
        {label}
      </span>
    </button>
  );
}

ColorSwatchButton.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  swatch: PropTypes.string.isRequired,
};

function ShapeOptionButton({ active = false, label, onClick, previewStyle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[92px] flex-col items-center gap-2 rounded-[18px] border px-3 py-3 text-center transition ${
        active
          ? "border-[#ea4f93] bg-[#fff0f7] shadow-[0_10px_20px_rgba(236,72,153,0.12)]"
          : "border-[#f4c6da] bg-white hover:border-[#ef6bb4]"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4f8]">
        <span
          className="block h-6 w-4 bg-[linear-gradient(180deg,#f4c5b0_0%,#d69a7f_100%)]"
          style={previewStyle}
        />
      </span>
      <span className={`text-[11px] font-bold ${active ? "text-[#ea4f93]" : "text-[#7e6075]"}`}>
        {label}
      </span>
    </button>
  );
}

ShapeOptionButton.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  previewStyle: PropTypes.shape({}),
};

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

SectionCard.propTypes = {
  children: PropTypes.node,
  icon: PropTypes.node.isRequired,
  step: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

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

UploadPanel.propTypes = {
  badge: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

function SkillStars({ count }) {
  return (
    <div className="flex gap-1 text-[#ea4f93]">
      {[1, 2, 3, 4, 5].map((starNumber) => (
        <span key={starNumber} className={starNumber <= count ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

SkillStars.propTypes = {
  count: PropTypes.number.isRequired,
};

function getVariantPreviewDecorations(accessory) {
  switch (accessory) {
    case "French tip replacement":
      return ["French Tip"];
    case "Crystal charm cluster":
      return ["Stone"];
    case "Pearl charm":
      return ["Pearl"];
    case "Gold foil sticker":
      return ["Gold Line", "Sticker"];
    case "Heart gem":
      return ["Stone"];
    case "Ribbon line art":
      return ["Sticker"];
    default:
      return [];
  }
}

function getColorStyle(color) {
  const found = VARIANT_COLOR_OPTIONS.find((item) => item.label === color);

  if (!found) {
    return { background: "linear-gradient(180deg,#d7e0eb 0%,#bac8d8 100%)" };
  }

  return { backgroundImage: found.swatch };
}

function getFinishEffect(finish) {
  switch (finish) {
    case "Matte":
      return "opacity-90 saturate-[0.85]";
    case "Glitter":
      return "before:absolute before:inset-[18%] before:rounded-inherit before:bg-[radial-gradient(circle,_rgba(255,255,255,0.95)_0%,_transparent_58%)] before:opacity-70";
    case "Jelly":
      return "opacity-80";
    case "Chrome":
      return "before:absolute before:inset-x-[16%] before:top-[10%] before:h-[28%] before:rounded-full before:bg-white/60";
    default:
      return "before:absolute before:inset-x-[22%] before:top-[10%] before:h-[18%] before:rounded-full before:bg-white/35";
  }
}

function getNailMetrics(shape, length, index) {
  const heightMap = {
    Short: [42, 52, 60, 52, 40],
    Medium: [52, 64, 78, 64, 48],
    Long: [66, 84, 100, 84, 62],
  };
  const shapeClassMap = {
    Almond: "rounded-t-[26px] rounded-b-[18px]",
    Square: "rounded-t-[10px] rounded-b-[8px]",
    Round: "rounded-t-[30px] rounded-b-[24px]",
    Oval: "rounded-t-[24px] rounded-b-[22px]",
    Coffin: "rounded-t-[14px] rounded-b-[8px] [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]",
  };

  return {
    height: heightMap[length]?.[index] ?? 60,
    shapeClassName: shapeClassMap[shape] ?? shapeClassMap.Almond,
  };
}

function PreviewNail({ colorStyle, decorationSet, finish, index, length, shape }) {
  const metrics = getNailMetrics(shape, length, index);
  const isChrome = finish === "Chrome";
  const isJelly = finish === "Jelly";
  const isMatte = finish === "Matte";
  const isGlitter = finish === "Glitter";

  return (
    <div
      className={`relative w-9 ${metrics.shapeClassName} ${getFinishEffect(finish)} overflow-hidden shadow-[0_12px_18px_rgba(174,190,208,0.22)]`}
      style={{ ...colorStyle, height: metrics.height }}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.4),transparent_42%)]" />
      {isChrome ? (
        <>
          <span className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.55)_0%,transparent_30%,rgba(255,255,255,0.1)_48%,rgba(255,255,255,0.45)_72%,transparent_100%)] mix-blend-screen" />
          <span className="absolute inset-y-0 left-[18%] w-[18%] bg-white/25 blur-[3px]" />
        </>
      ) : null}
      {isJelly ? (
        <span className="absolute inset-[6%] rounded-[inherit] border border-white/35 bg-white/12" />
      ) : null}
      {isMatte ? (
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_50%)] mix-blend-normal" />
      ) : null}
      {isGlitter ? (
        <>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(255,255,255,0.95)_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_22%,rgba(255,255,255,0.75)_0_1px,transparent_1.6px),radial-gradient(circle_at_46%_68%,rgba(255,255,255,0.85)_0_1px,transparent_1.5px),radial-gradient(circle_at_78%_74%,rgba(255,255,255,0.9)_0_1px,transparent_1.8px)] opacity-85" />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.12)_55%,transparent_100%)]" />
        </>
      ) : null}
      {decorationSet.has("Pearl") ? (
        <span className="absolute left-1/2 top-[38%] h-2 w-2 -translate-x-1/2 rounded-full bg-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_2px_6px_rgba(255,255,255,0.55)]" />
      ) : null}
      {decorationSet.has("French Tip") ? (
        <span className="absolute inset-x-[15%] bottom-[8%] h-[18%] rounded-full bg-white/95" />
      ) : null}
      {decorationSet.has("Gold Line") ? (
        <span className="absolute inset-y-[18%] left-1/2 w-[2px] -translate-x-1/2 bg-[#f5c44f]/90" />
      ) : null}
      {decorationSet.has("Stone") ? (
        <span className="absolute right-[18%] top-[24%] h-2.5 w-2.5 rounded-full bg-white/95 ring-1 ring-[#d4b6ff]" />
      ) : null}
      {decorationSet.has("Sticker") ? (
        <span className="absolute left-1/2 top-[30%] -translate-x-1/2 rounded-full bg-white/90 px-1.5 py-0.5 text-[7px] font-extrabold text-[#ea4f93] shadow-sm">
          S
        </span>
      ) : null}
    </div>
  );
}

PreviewNail.propTypes = {
  colorStyle: PropTypes.shape({}).isRequired,
  decorationSet: PropTypes.shape({ has: PropTypes.func.isRequired }).isRequired,
  finish: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  length: PropTypes.string.isRequired,
  shape: PropTypes.string.isRequired,
};

function LiveNailReference({ title, variant }) {
  const colorStyle = getColorStyle(variant.color);
  const decorationSet = new Set(getVariantPreviewDecorations(variant.accessory));

  return (
    <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#fff3f9_0%,#ffeef7_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] bg-white/65 px-3 py-2 text-[10px] font-bold text-[#b07d97]">
        <span>Surface Mode</span>
        <span className="rounded-full bg-[#fff1f7] px-2.5 py-1 text-[#ea4f93]">
          {variant.finish || "Glossy"}
        </span>
      </div>
      <div className="flex items-end justify-center gap-3 rounded-[18px] bg-white/55 p-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <PreviewNail
            key={index}
            colorStyle={colorStyle}
            decorationSet={decorationSet}
            finish={variant.finish || "Glossy"}
            index={index}
            length={variant.length || "Medium"}
            shape={variant.shape || "Almond"}
          />
        ))}
      </div>
      <p className="mt-4 text-center font-semibold text-[#432744]">{title}</p>
      <p className="mt-1 text-center text-xs text-[#b07d97]">
        Preview updates from the current variant selections
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {[variant.shape, variant.length, variant.color, variant.finish, variant.accessory]
          .filter(Boolean)
          .map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#f2bfd4] bg-white px-2.5 py-1 text-[10px] font-bold text-[#ea4f93]"
            >
              {item}
            </span>
          ))}
      </div>
    </div>
  );
}

LiveNailReference.propTypes = {
  title: PropTypes.string.isRequired,
  variant: PropTypes.shape({
    accessory: PropTypes.string,
    color: PropTypes.string,
    finish: PropTypes.string,
    length: PropTypes.string,
    shape: PropTypes.string,
  }).isRequired,
};

export function NailDesignManagementCreatePage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createEmptyNailDesign);
  const [selectedTags, setSelectedTags] = useState([]);
  const [profileSelections, setProfileSelections] = useState(createInitialProfileSelections);
  const [structureSelections, setStructureSelections] = useState(createInitialStructureSelections);
  const [variants, setVariants] = useState([createEmptyVariant(0)]);
  const [workflowSteps, setWorkflowSteps] = useState([createEmptyWorkflowStep(0)]);
  const [costRows, setCostRows] = useState([createEmptyCostRow(0)]);
  const [serviceRows, setServiceRows] = useState([createEmptyServiceRow(0)]);
  const [skillCards, setSkillCards] = useState(createInitialSkillCards);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

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

    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === activeVariantIndex
          ? {
              ...variant,
              shape: group === "Nail Shape" ? value : variant.shape,
              length: group === "Nail Length" ? value : variant.length,
              finish: group === "Surface / Finish" ? value : variant.finish,
            }
          : variant,
      ),
    );
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
      return [...current, createEmptyVariant(nextNumber, structureSelections)];
    });
    setActiveVariantIndex(variants.length);
  };

  const duplicateVariant = (index) => {
    setVariants((current) => {
      const source = current[index];
      const nextVariant = {
        ...source,
        code: `VAR ${current.length}`,
        name: source.name ? `${source.name} Copy` : `Variant ${current.length}`,
        badgeTone: "bg-[#f2e9ff] text-[#8b5cf6]",
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

  const updateWorkflowStep = (index, field, value) => {
    setWorkflowSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index
          ? [
              field === "label" ? value : step[0],
              field === "level" ? value : step[1],
              field === "time" ? value : step[2],
            ]
          : step,
      ),
    );
  };

  const removeWorkflowStep = (index) => {
    setWorkflowSteps((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, stepIndex) => stepIndex !== index);
    });
  };

  const updateCostRow = (index, field, value) => {
    setCostRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? [
              field === "label" ? value : row[0],
              field === "qty" ? value : row[1],
              field === "price" ? value : row[2],
            ]
          : row,
      ),
    );
  };

  const removeCostRow = (index) => {
    setCostRows((current) => {
      if (current.length === 1) return current;
      return current.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const updateServiceRow = (index, field, value) => {
    setServiceRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? [field === "label" ? value : row[0], field === "price" ? value : row[1]]
          : row,
      ),
    );
  };

  const removeServiceRow = (index) => {
    setServiceRows((current) => {
      if (current.length === 1) return current;
      return current.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const updateSkillCard = (index, field, value) => {
    setSkillCards((current) =>
      current.map((skill, skillIndex) =>
        skillIndex === index
          ? [
              field === "title" ? value : skill[0],
              field === "subtitle" ? value : skill[1],
              field === "score" ? value : skill[2],
              field === "level" ? value : skill[3],
            ]
          : skill,
      ),
    );
  };

  const activeVariant = variants[activeVariantIndex] ?? variants[0];
  const complexityValue = structureSelections["Nail Complexity"];
  const complexityProgress =
    !complexityValue
      ? "w-0"
      : complexityValue === "Simple"
        ? "w-[22%]"
        : complexityValue === "Complex"
          ? "w-[74%]"
          : complexityValue === "+ Premium Art"
            ? "w-full"
            : "w-[52%]";

  const previewTitle = `${activeVariant?.name || "New Variant"} / ${activeVariant?.shape || "Shape"} / ${
    activeVariant?.length || "Length"
  }`;

  const totalEstimatedDuration = useMemo(
    () => workflowSteps.reduce((total, [, , time]) => total + parseCurrencyValue(time), 0),
    [workflowSteps],
  );
  const materialTotal = useMemo(
    () =>
      costRows.reduce(
        (total, [, qty, price]) => total + parseCurrencyValue(qty) * parseCurrencyValue(price),
        0,
      ),
    [costRows],
  );
  const serviceTotal = useMemo(
    () => serviceRows.reduce((total, [, price]) => total + parseCurrencyValue(price), 0),
    [serviceRows],
  );
  const sellingPrice = parseCurrencyValue(formValues.price);
  const estimatedProfit = useMemo(
    () => `${(sellingPrice - materialTotal - serviceTotal).toLocaleString("en-US")} VND`,
    [materialTotal, sellingPrice, serviceTotal],
  );
  const profitMargin = useMemo(() => {
    if (!sellingPrice) {
      return "0%";
    }

    return `${Math.max(
      0,
      Math.round(((sellingPrice - materialTotal - serviceTotal) / sellingPrice) * 100),
    )}%`;
  }, [materialTotal, sellingPrice, serviceTotal]);

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[1.7rem] font-extrabold text-[#432744]">
              Create New Nail Design
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
              onClick={() => setShowCreateConfirm(true)}
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
                  value={formValues.id}
                  onChange={handleChange("id")}
                  placeholder="e.g. ND-4001"
                  className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
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

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5c4559]">Selling Price</span>
                <input
                  value={formValues.price}
                  onChange={handleChange("price")}
                  placeholder="e.g. 430000"
                  className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5c4559]">Estimated Duration</span>
                <input
                  value={formValues.duration}
                  onChange={handleChange("duration")}
                  placeholder="e.g. 75 min"
                  className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                />
              </label>
            </div>
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
                  key={variant.code}
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
                        <label className="block space-y-2">
                          <span className="text-sm font-semibold text-[#5c4559]">Variant Name</span>
                          <input
                            value={variant.name}
                            onChange={(event) => updateVariant(index, "name", event.target.value)}
                            placeholder={`Variant ${index + 1}`}
                            className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm text-[#432744] outline-none"
                          />
                        </label>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                          Step A. Choose Color
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {VARIANT_COLOR_OPTIONS.map((item) => (
                            <ColorSwatchButton
                              key={item.label}
                              active={variant.color === item.label}
                              label={item.label}
                              swatch={item.swatch}
                              onClick={() => updateVariant(index, "color", item.label)}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                          Step B. Choose Shape
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {VARIANT_SHAPE_OPTIONS.map((item) => (
                            <ShapeOptionButton
                              key={item.label}
                              active={variant.shape === item.label}
                              label={item.label}
                              previewStyle={item.previewStyle}
                              onClick={() => updateVariant(index, "shape", item.label)}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                          Step C. Choose Surface
                        </p>
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
                          Step D. Choose Length
                        </p>
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
                          Step E. Choose Decoration
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
                          {(variant.notes.length > 0 ? variant.notes : ["No accessory notes yet"]).map((item) => (
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
                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-sm font-semibold text-[#5c4559]">Accessory Notes</span>
                          <input
                            value={variant.notes.join(", ")}
                            onChange={(event) =>
                              updateVariant(
                                index,
                                "notes",
                                event.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              )
                            }
                            placeholder="Comma separated notes"
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
              {workflowSteps.map(([label, level, time], index) => (
                <div
                  key={label}
                  className="grid gap-3 rounded-[18px] border border-[#f7d7e5] bg-[#fff3f8] px-4 py-3 md:grid-cols-[minmax(0,1fr)_110px_170px_44px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ea4f93] text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <input
                      value={label}
                      onChange={(event) => updateWorkflowStep(index, "label", event.target.value)}
                      className="h-10 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm font-semibold text-[#432744] outline-none"
                    />
                  </div>
                  <div className="flex items-center md:justify-center">
                    <select
                      value={level}
                      onChange={(event) => updateWorkflowStep(index, "level", event.target.value)}
                      className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                    >
                      {["Easy", "Medium", "Advanced", "Expert"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={time}
                      onChange={(event) => updateWorkflowStep(index, "time", event.target.value)}
                      className="h-10 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm text-[#432744] outline-none"
                    />
                    <span className="text-sm text-[#c694ad]">min</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWorkflowStep(index)}
                    disabled={workflowSteps.length === 1}
                    className="inline-flex h-10 w-10 items-center justify-center self-center rounded-2xl border border-[#f4c6da] bg-white text-[#ea4f93] transition hover:bg-[#fff0f7] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label={`Remove workflow step ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-[#fff3f8] px-4 py-3 text-sm">
              <p className="font-semibold text-[#8c7085]">
                Total Estimated Duration: <span className="text-[#432744]">{totalEstimatedDuration} minutes</span>
              </p>
              <button
                type="button"
                onClick={() =>
                  setWorkflowSteps((current) => [...current, createEmptyWorkflowStep(current.length)])
                }
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
                  {costRows.map(([label, qty, price], index) => (
                    <div
                      key={`${label}-${index}`}
                      className="grid grid-cols-[minmax(0,1fr)_84px_84px_40px] gap-2"
                    >
                      <input
                        value={label}
                        onChange={(event) => updateCostRow(index, "label", event.target.value)}
                        className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                      />
                      <input
                        value={qty}
                        onChange={(event) => updateCostRow(index, "qty", event.target.value)}
                        className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                      />
                      <input
                        value={price}
                        onChange={(event) => updateCostRow(index, "price", event.target.value)}
                        className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeCostRow(index)}
                        disabled={costRows.length === 1}
                        className="inline-flex h-10 w-10 items-center justify-center self-center rounded-2xl border border-[#f4c6da] bg-white text-[#ea4f93] transition hover:bg-[#fff0f7] disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label={`Remove material row ${index + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#f5cfe0] pt-4 text-sm font-bold">
                  <span className="text-[#432744]">Material Total</span>
                  <span className="text-[#ea4f93]">{materialTotal.toLocaleString("en-US")} VND</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCostRows((current) => [...current, createEmptyCostRow(current.length)])}
                  className="mt-4 rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                >
                  Add Material Row
                </button>
              </div>

              <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fff3f8] p-4">
                <p className="font-bold text-[#432744]">Service Pricing</p>
                <div className="mt-4 space-y-3">
                  {serviceRows.map(([label, price], index) => (
                    <div key={`${label}-${index}`} className="grid grid-cols-[1fr_140px_44px] gap-3">
                      <input
                        value={label}
                        onChange={(event) => updateServiceRow(index, "label", event.target.value)}
                        className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                      />
                      <input
                        value={price}
                        onChange={(event) => updateServiceRow(index, "price", event.target.value)}
                        className="h-10 rounded-2xl border border-[#f4d4e2] bg-white px-3 text-sm text-[#432744] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeServiceRow(index)}
                        disabled={serviceRows.length === 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#f4c6da] bg-white text-[#ea4f93] transition hover:bg-[#fff0f7] disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label={`Remove service row ${index + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#f5cfe0] pt-4 text-sm font-bold">
                  <span className="text-[#432744]">Service Total</span>
                  <span className="text-[#ea4f93]">{serviceTotal.toLocaleString("en-US")} VND</span>
                </div>
                <button
                  type="button"
                  onClick={() => setServiceRows((current) => [...current, createEmptyServiceRow(current.length)])}
                  className="mt-4 rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                >
                  Add Service Row
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-[20px] bg-[image:var(--gradient-accent)] p-4 text-center text-white md:grid-cols-4">
              {[
                [`${(materialTotal + serviceTotal).toLocaleString("en-US")} VND`, "Suggested Cost"],
                [formValues.price || "0", "Selling Price"],
                [estimatedProfit, "Est. Profit"],
                [profitMargin, "Margin"],
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
              {skillCards.map(([title, subtitle, score, level], index) => (
                <div
                  key={title}
                  className="rounded-[18px] border border-[#f7d7e5] bg-[#fff3f8] p-4"
                >
                  <h4 className="font-bold text-[#432744]">{title}</h4>
                  <input
                    value={subtitle}
                    onChange={(event) => updateSkillCard(index, "subtitle", event.target.value)}
                    className="mt-2 h-10 w-full rounded-2xl border border-[#f4d4e2] bg-white px-3 text-xs text-[#c694ad] outline-none"
                  />
                  <div className="mt-3">
                    <SkillStars count={score} />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={score}
                    onChange={(event) => {
                      const nextScore = Number(event.target.value);
                      updateSkillCard(index, "score", nextScore);
                      updateSkillCard(
                        index,
                        "level",
                        ["Beginner", "Junior", "Intermediate", "Advanced", "Expert"][nextScore - 1],
                      );
                    }}
                    className="mt-3 w-full"
                  />
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
                [structureSelections["Nail Complexity"] || "Not set", "Complexity Level"],
                [formValues.price || "0", "Selling Price"],
                [`${totalEstimatedDuration} min`, "Est. Duration"],
                [String(variants.length), "Variants"],
                [`${workflowSteps.length} Steps`, "Workflow"],
                [profitMargin, "Profit Margin"],
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
                [formValues.name && formValues.id ? "Required fields completed" : "Required fields incomplete", formValues.name && formValues.id ? "Done" : "Pending"],
                [sellingPrice > 0 ? "Pricing configured" : "Pricing pending", sellingPrice > 0 ? "Done" : "Pending"],
                [`Workflow mapped (${workflowSteps.length} steps)`, workflowSteps.length > 0 ? "Done" : "Pending"],
                ["Staff skills configured", skillCards.length > 0 ? "Done" : "Pending"],
                ["Media assets uploaded", "Pending"],
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
                onClick={() => setShowCreateConfirm(true)}
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
              <LiveNailReference variant={activeVariant} title={previewTitle} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedTags.length > 0 ? (
                selectedTags.slice(0, 3).map((tag) => (
                  <PillButton key={tag} active>
                    {tag}
                  </PillButton>
                ))
              ) : (
                <PillButton>No tags selected</PillButton>
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f8d3e2] bg-[#fff7fb] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <h3 className="font-extrabold text-[#432744]">Current Variant</h3>
            <div className="mt-4 space-y-2 text-sm text-[#8c7085]">
              <div className="flex items-center justify-between gap-3">
                <span>Color</span>
                <span className="font-semibold text-[#432744]">{activeVariant.color || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Finish</span>
                <span className="font-semibold text-[#432744]">{activeVariant.finish || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Shape</span>
                <span className="font-semibold text-[#432744]">{activeVariant.shape || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Length</span>
                <span className="font-semibold text-[#432744]">{activeVariant.length || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Accessory</span>
                <span className="font-semibold text-right text-[#432744]">{activeVariant.accessory || "Not set"}</span>
              </div>
            </div>
          </section>    

          <section className="rounded-[24px] border border-[#f8d3e2] bg-[#fff7fb] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <h3 className="font-extrabold text-[#432744]">Profit Analysis</h3>
            <div className="mt-4 space-y-2 text-sm">
              {[
                ["Material Cost", `${materialTotal.toLocaleString("en-US")} VND`],
                ["Service Cost", `${serviceTotal.toLocaleString("en-US")} VND`],
                ["Selling Price", formValues.price || "0"],
                ["Total Planned Duration", `${totalEstimatedDuration} min`],
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
              <p className="mt-2 text-sm font-semibold">{profitMargin} Margin</p>
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
                  onClick={action || undefined}
                  className="w-full rounded-full border border-[#f4c6da] bg-white px-4 py-2.5 text-left text-xs font-bold text-[#7e6075]"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <ActionConfirmModal
        open={showCreateConfirm}
        intent="success"
        title="Publish Nail Design"
        subtitle="This will add the design to the current mock catalog."
        description="Confirm to publish this nail design with its selected style profile, pricing, and structure."
        confirmText="Publish Design"
        cancelText="Review Again"
        confirmIcon={Sparkles}
        width={520}
        onConfirm={handleCreate}
        onCancel={() => setShowCreateConfirm(false)}
        highlights={[formValues.name || "New nail design", formValues.category || "Category pending", formValues.collection || "Collection pending"]}
        details={[
          { label: "Suggested Price", value: formValues.suggestedPrice || "No price entered" },
          { label: "Est. Duration", value: formValues.estimatedDuration ? formatDurationLabel(formValues.estimatedDuration) : "No duration entered" },
        ]}
        warnings={["This mock publish updates the UI flow only and does not persist outside this feature."]}
      />
    </section>
  );
}
