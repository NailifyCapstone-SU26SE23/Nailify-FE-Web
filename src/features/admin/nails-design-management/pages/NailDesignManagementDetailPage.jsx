import {
  BarChart3,
  CircleDollarSign,
  Copy,
  Eye,
  PencilLine,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { getMockNailDesignDetailById } from "../services/mockNailDesigns";

const DESIGN_PREVIEW_IMAGE =
  "https://i0.wp.com/greenweddingshoes.com/wp-content/uploads/2025/12/red-cat-eye-christmas-holiday-nails-with-bow.webp?fit=1024%2C9999";

function SectionCard({
  title,
  subtitle,
  icon,
  children,
  sectionId,
  sectionRef,
  highlighted = false,
}) {
  return (
    <article
      id={sectionId}
      ref={sectionRef}
      className={`scroll-mt-6 rounded-[22px] border bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] transition-all duration-300 md:p-5 ${
        highlighted
          ? "border-[#ea4f93] shadow-[0_18px_38px_rgba(236,72,153,0.18)] ring-4 ring-[#ffd8e8]"
          : "border-[#f8d3e2]"
      }`}
    >
      <div className="flex items-start gap-3 border-b border-[#f8deea] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#fff0f6_0%,#fff8e9_100%)] text-[#ea4f93]">
          {icon}
        </div>
        <div>
          <h3 className="font-extrabold text-[#432744]">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-[#c694ad]">{subtitle}</p> : null}
        </div>
      </div>
      <div className="pt-4">{children}</div>
    </article>
  );
}

SectionCard.propTypes = {
  children: PropTypes.node,
  highlighted: PropTypes.bool,
  icon: PropTypes.node.isRequired,
  sectionId: PropTypes.string,
  sectionRef: PropTypes.shape({ current: PropTypes.any }),
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
};

function Pill({ children, tone = "default" }) {
  const toneMap = {
    default: "border-[#f4c6da] bg-white text-[#8c7085]",
    pink: "border-[#ffd1e3] bg-[#fff0f7] text-[#ea4f93]",
    purple: "border-[#ead8ff] bg-[#f5ecff] text-[#8b5cf6]",
    blue: "border-[#dce7ff] bg-[#eef4ff] text-[#4a72d8]",
    green: "border-[#d7f3e0] bg-[#eaf9ee] text-[#2fa25f]",
    yellow: "border-[#f8e3b3] bg-[#fff4df] text-[#d9871c]",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

Pill.propTypes = {
  children: PropTypes.node,
  tone: PropTypes.string,
};

function SkillStars({ count }) {
  return (
    <div className="flex gap-1 text-[#ea4f93]">
      {[1, 2, 3, 4, 5].map((starNumber) => (
        <span key={starNumber} className={starNumber <= count ? "opacity-100" : "opacity-20"}>
          ★
        </span>
      ))}
    </div>
  );
}

SkillStars.propTypes = {
  count: PropTypes.number.isRequired,
};

function getHeroTagTone(index) {
  if (index < 2) {
    return "pink";
  }

  return index % 3 === 0 ? "purple" : "default";
}

function getProfileValueTone(index) {
  if (index % 4 === 0) {
    return "pink";
  }
  if (index % 4 === 1) {
    return "purple";
  }
  if (index % 4 === 2) {
    return "green";
  }

  return "yellow";
}

function getComparisonValueTone(label) {
  return label === "Premium vs Market" ? "text-[#2fa25f]" : "text-[#432744]";
}

const CUSTOMER_PROFILE_OPTIONS = {
  "Skin Tone": ["Fair", "Light Medium", "Medium", "Tan", "Deep"],
  "Skin Undertone": ["Warm", "Cool", "Neutral"],
  "Color Palette": ["Nude", "Pink", "Red", "Black", "Chrome", "White", "Pastel", "Neon"],
  "Age Group": ["Teen", "20s", "30s", "40+"],
  "Style / Personality": [
    "Elegant",
    "Cute",
    "Minimal",
    "Sexy",
    "Luxury",
    "Feminine",
    "Bold",
    "Soft Girl",
    "Korean Style",
  ],
  "Vibe Level": ["Subtle", "Soft", "Moderate", "Eye-catching", "Luxury Statement"],
  Occasion: ["Daily", "Office", "Wedding", "Party", "Holiday", "Valentine", "Birthday", "Photoshoot"],
  "Hand Shape": ["Slim Fingers", "Short Fingers", "Wide Hands", "Long Fingers"],
  Audience: ["Female", "Male", "Unisex", "Gay"],
};

const DESIGN_COMPONENT_OPTIONS = {
  "Design Status": ["Active", "Draft", "Archived"],
  "Try-On Ready": ["Yes", "No"],
  Complexity: ["Basic", "Intermediate", "Advanced", "Expert"],
  "Est. Duration": ["45 min", "60 min", "75 min", "90 min", "120 min"],
  "Nail Shape": ["Almond", "Square", "Round", "Oval", "Coffin", "Stiletto"],
  "Nail Length": ["Short", "Medium", "Long"],
};

const COMPONENT_VALUE_OPTIONS = {
  "Primary Finish": ["Glossy", "Matte", "Chrome", "Glitter", "Jelly", "Velvet"],
  "Main Pattern": ["French Tip", "Floral", "Marble", "Stone", "Pearl", "Gold Line", "Sticker", "Cat Eye", "Ombre"],
  "Color Direction": ["Nude", "Pink", "Red", "Black", "Chrome", "White", "Pastel", "Rose Gold"],
  "Nail Shape": ["Almond", "Square", "Round", "Oval", "Coffin", "Stiletto"],
  "Nail Length": ["Short", "Medium", "Long"],
  Complexity: ["Simple", "Medium", "Complex", "Premium Art"],
  "Collection Mood": ["Bridal", "Luxury", "Minimal", "Romantic", "Bold", "Soft Girl"],
  Occasion: ["Daily", "Office", "Wedding", "Party", "Holiday", "Photoshoot"],
};

const VARIANT_LEVEL_OPTIONS = ["Basic", "Intermediate", "Advanced", "Expert", "Premium"];
const WORKFLOW_LEVEL_OPTIONS = ["Easy", "Moderate", "Advanced", "Expert"];
const SKILL_LEVEL_LABELS = {
  1: "1★ Junior",
  2: "2★ Developing",
  3: "3★ Intermediate",
  4: "4★ Advanced",
  5: "5★ Expert",
};

function InputLabel({ children }) {
  return (
    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#c694ad]">
      {children}
    </span>
  );
}

InputLabel.propTypes = {
  children: PropTypes.node,
};

function EditInput({ value, onChange, className = "" }) {
  return (
    <input
      value={value}
      onChange={onChange}
      className={`h-11 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4] ${className}`}
    />
  );
}

EditInput.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

function EditTextarea({ value, onChange, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      className="w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 py-3 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
    />
  );
}

EditTextarea.propTypes = {
  onChange: PropTypes.func.isRequired,
  rows: PropTypes.number,
  value: PropTypes.string.isRequired,
};

function EditSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

EditSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string.isRequired,
};

function SkillLevelSlider({ value, onChange }) {
  const progress = ((value - 1) / 4) * 100;

  return (
    <div className="pt-2">
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        onChange={onChange}
        className="skill-level-slider h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(90deg, #ea4f93 0%, #f59f61 55%, #f7d85f 100%) 0 / ${progress}% 100% no-repeat, #f6d5e3`,
        }}
      />
    </div>
  );
}

SkillLevelSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
};

export function NailDesignManagementDetailPage() {
  const { designId } = useParams();
  const initialDesign = getMockNailDesignDetailById(designId);
  const heroSectionRef = useRef(null);
  const customerProfileRef = useRef(null);
  const designComponentsRef = useRef(null);
  const designVariantsRef = useRef(null);
  const pricingRef = useRef(null);
  const workflowRef = useRef(null);
  const skillsRef = useRef(null);
  const quickSummaryRef = useRef(null);
  const customerPreviewRef = useRef(null);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState(initialDesign);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState("");

  if (!initialDesign) {
    return <Navigate to={ROUTES.adminNailDesigns} replace />;
  }

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleBooleanChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value === "true",
    }));
  };

  const handleCustomerProfileToggle = (label, option) => () => {
    setFormValues((current) => {
      const currentValues = current.customerProfile[label] ?? [];
      const hasOption = currentValues.includes(option);

      return {
        ...current,
        customerProfile: {
          ...current.customerProfile,
          [label]: hasOption
            ? currentValues.filter((value) => value !== option)
            : [...currentValues, option],
        },
      };
    });
  };

  const handleDesignComponentChange = (index) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      designComponents: current.designComponents.map((entry, entryIndex) =>
        entryIndex === index ? [entry[0], nextValue] : entry,
      ),
    }));
  };

  const handleVariantFieldChange = (index, field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [field]: nextValue,
            }
          : variant,
      ),
    }));
  };

  const handleWorkflowFieldChange = (index, field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      workflow: current.workflow.map((step, stepIndex) => {
        if (stepIndex !== index) {
          return step;
        }

        if (field === "title") {
          return [nextValue, step[1], step[2], step[3]];
        }

        if (field === "duration") {
          return [step[0], nextValue, step[2], step[3]];
        }

        if (field === "tools") {
          return [
            step[0],
            step[1],
            nextValue.split(",").map((item) => item.trim()).filter(Boolean),
            step[3],
          ];
        }

        return [step[0], step[1], step[2], nextValue];
      }),
    }));
  };

  const handleSkillFieldChange = (index, field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      skills: current.skills.map((skill, skillIndex) => {
        if (skillIndex !== index) {
          return skill;
        }

        if (field === "title") {
          return [nextValue, skill[1], skill[2], skill[3]];
        }

        if (field === "subtitle") {
          return [skill[0], nextValue, skill[2], skill[3]];
        }

        if (field === "score") {
          const score = Number.parseInt(nextValue, 10);
          const normalizedScore = Number.isNaN(score) ? 1 : Math.min(5, Math.max(1, score));

          return [skill[0], skill[1], normalizedScore, SKILL_LEVEL_LABELS[normalizedScore]];
        }

        return [skill[0], skill[1], skill[2], nextValue];
      }),
    }));
  };

  const handleStartEdit = () => {
    setFlashMessage("");
    setIsEditing(true);
  };

  const scrollToSection = (sectionRef, options = {}) => {
    if (options.startEdit && !isEditing) {
      setFlashMessage("");
      setIsEditing(true);
    }

    if (options.sectionKey) {
      setHighlightedSection(options.sectionKey);
      window.setTimeout(() => {
        setHighlightedSection((current) => (current === options.sectionKey ? "" : current));
      }, 2200);
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const handleCancelEdit = () => {
    setShowCancelConfirm(false);
    setFormValues(initialDesign);
    setFlashMessage("");
    setIsEditing(false);
  };

  const handleSave = () => {
    setShowSaveConfirm(false);
    setFlashMessage("Mock update completed. Changes are local to this detail screen.");
    setIsEditing(false);
  };

  const summaryRows = [
    ["Design Status", formValues.designStatus],
    ["Try-On Ready", formValues.tryOnReady ? "Yes" : "No"],
    ["Complexity", formValues.complexity],
    ["Est. Duration", formValues.estimatedDuration],
    ["Nail Shape", formValues.nailShape],
    ["Nail Length", formValues.nailLength],
    ["Suggested Price", formValues.suggestedPrice],
  ];

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <style>
        {`
          .skill-level-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 9999px;
            background: #ea4f93;
            border: 3px solid #fff7fb;
            box-shadow: 0 4px 12px rgba(234, 79, 147, 0.28);
          }

          .skill-level-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 9999px;
            background: #ea4f93;
            border: 3px solid #fff7fb;
            box-shadow: 0 4px 12px rgba(234, 79, 147, 0.28);
          }

          .skill-level-slider::-moz-range-track {
            height: 8px;
            border-radius: 9999px;
            background: transparent;
          }
        `}
      </style>

      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-[#c694ad]">
              Nail Designs / <span className="text-[#ea4f93]">{formValues.breadcrumbsLabel}</span>
            </p>
            <h2 className="mt-1 text-[1.7rem] font-extrabold text-[#432744]">
              Nail Design Detail
            </h2>
            <p className="mt-1 text-sm text-[#c694ad]">
              View and edit design details, workflow, and AI recommendation profile. Pricing stays locked.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-[#eaf9ee] px-4 py-2 text-xs font-bold text-[#2fa25f]">
              {formValues.designStatus}
            </span>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaveConfirm(true)}
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#7e6075]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
                >
                  <PencilLine size={13} className="mr-1.5 inline" />
                  Edit Design
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFlashMessage("Mock duplicate completed. A cloned design would be created in a real flow.")
                  }
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
                >
                  <Copy size={13} className="mr-1.5 inline" />
                  Duplicate Design
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {flashMessage ? (
        <div className="rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
          {flashMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <article
            ref={heroSectionRef}
            id="hero-section"
            className={`scroll-mt-6 rounded-[22px] border bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] transition-all duration-300 md:p-5 ${
              highlightedSection === "hero"
                ? "border-[#ea4f93] shadow-[0_18px_38px_rgba(236,72,153,0.18)] ring-4 ring-[#ffd8e8]"
                : "border-[#f8d3e2]"
            }`}
          >
            <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-[18px] bg-[#f6edf2]">
                <img
                  src={DESIGN_PREVIEW_IMAGE}
                  alt={formValues.heroTitle}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-3">
                  <Pill tone="pink">Try-On Ready</Pill>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                  {formValues.id}
                </p>
                {isEditing ? (
                  <div className="mt-2 space-y-3">
                    <input
                      value={formValues.heroTitle}
                      onChange={handleChange("heroTitle")}
                      className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-xl font-extrabold text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                    />
                    <textarea
                      value={formValues.heroSubtitle}
                      onChange={handleChange("heroSubtitle")}
                      rows={4}
                      className="w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 py-3 text-sm text-[#7c6678] outline-none transition focus:border-[#ef6bb4]"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="mt-2 text-4xl font-extrabold leading-tight text-[#432744]">
                      {formValues.heroTitle}
                    </h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[#7c6678]">
                      {formValues.heroSubtitle} Created for clients who desire an elevated,
                      feminine aesthetic, perfect for weddings, formal events, and high-end
                      photoshoots.
                    </p>
                  </>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Chrome", "Luxury", "Elegant", "Pearl", "Wedding", "Soft Girl", "Luxury"].map(
                    (tag, index) => (
                      <Pill
                        key={`${tag}-${getHeroTagTone(index)}`}
                        tone={getHeroTagTone(index)}
                      >
                        {tag}
                      </Pill>
                    ),
                  )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Popularity Score", formValues.popularityScore],
                    ["Booking Rate", formValues.bookingRate],
                    ["Customer Rating", formValues.customerRating],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[18px] bg-[#fff3f8] px-4 py-4">
                      <p className="text-xs font-semibold text-[#c694ad]">{label}</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <SectionCard
            title="Customer Matching Profile"
            subtitle="AI recommendation and customer personalization profile"
            icon={<Sparkles size={18} />}
            sectionId="customer-profile-section"
            sectionRef={customerProfileRef}
            highlighted={highlightedSection === "customer-profile"}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(formValues.customerProfile).map(([label, values]) => (
                <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                    {label}
                  </p>
                  {isEditing ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(CUSTOMER_PROFILE_OPTIONS[label] ?? []).map((option, index) => {
                          const active = values.includes(option);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={handleCustomerProfileToggle(label, option)}
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                                active
                                  ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93]"
                                  : `text-[#8c7085] ${index % 3 === 0 ? "border-[#ead8ff] bg-[#f9f4ff]" : index % 3 === 1 ? "border-[#d7f3e0] bg-[#effcf4]" : "border-[#f8e3b3] bg-[#fff8e8]"}`
                              }`}
                            >
                              <span className="text-xs">{active ? "−" : "+"}</span>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-[#b2879f]">
                        {values.length > 0 ? `Selected ${values.length} tags` : "Select one or more tags"}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {values.map((value, index) => (
                        <Pill key={value} tone={getProfileValueTone(index)}>
                          {value}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Design Components"
            subtitle="Core structure and styling decisions"
            icon={<Settings2 size={18} />}
            sectionId="design-components-section"
            sectionRef={designComponentsRef}
            highlighted={highlightedSection === "design-components"}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {formValues.designComponents.map(([label, value], index) => (
                <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                    {label}
                  </p>
                  {isEditing ? (
                    <div className="mt-3 text-left">
                      <EditSelect
                        value={value}
                        onChange={handleDesignComponentChange(index)}
                        options={COMPONENT_VALUE_OPTIONS[label] ?? [value]}
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-extrabold text-[#432744]">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Design Variants"
            subtitle="Design variations have different accessories"
            icon={<Copy size={18} />}
            sectionId="design-variants-section"
            sectionRef={designVariantsRef}
            highlighted={highlightedSection === "design-variants"}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {formValues.variants.map((variant, index) => (
                <div key={variant.name} className="rounded-[20px] border border-[#f7d7e5] bg-white p-3 shadow-[0_10px_20px_rgba(236,72,153,0.05)]">
                  <div className="overflow-hidden rounded-[16px] bg-[#f6edf2]">
                    <img
                      src={DESIGN_PREVIEW_IMAGE}
                      alt={variant.name}
                      className="h-44 w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {isEditing ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <InputLabel>Variant Name</InputLabel>
                        <EditInput
                          value={variant.name}
                          onChange={handleVariantFieldChange(index, "name")}
                        />
                      </div>
                      <div>
                        <InputLabel>Description</InputLabel>
                        <EditTextarea
                          value={variant.description}
                          onChange={handleVariantFieldChange(index, "description")}
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <InputLabel>Level</InputLabel>
                          <EditSelect
                            value={variant.level}
                            onChange={handleVariantFieldChange(index, "level")}
                            options={VARIANT_LEVEL_OPTIONS}
                          />
                        </div>
                        <div>
                          <InputLabel>Duration</InputLabel>
                          <EditInput
                            value={variant.duration}
                            onChange={handleVariantFieldChange(index, "duration")}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="mt-3 font-extrabold text-[#432744]">{variant.name}</h4>
                      <p className="mt-1 text-sm text-[#8c7085]">{variant.description}</p>
                    </>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="pink">{variant.materialDelta}</Pill>
                    <Pill tone="yellow">{variant.priceDelta}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="blue">{variant.level}</Pill>
                    <Pill tone="green">{variant.duration}</Pill>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-2 text-xs font-bold text-[#ea4f93]"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-full bg-[image:var(--gradient-accent)] px-3 py-2 text-xs font-bold text-white"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-full border border-[#f4c6da] bg-white px-3 py-2 text-xs font-bold text-[#8c7085]"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Pricing & Cost Breakdown"
            subtitle=""
            icon={<CircleDollarSign size={18} />}
            sectionId="pricing-section"
            sectionRef={pricingRef}
            highlighted={highlightedSection === "pricing"}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="font-bold text-[#432744]">Material Costs</p>
                    <div className="mt-4 space-y-3">
                      {formValues.pricing.materialCosts.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-[#8c7085]">{label}</span>
                          <span className="font-semibold text-[#432744]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-[#432744]">Service Pricing</p>
                    <div className="mt-4 space-y-3">
                      {formValues.pricing.servicePricing.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-[#8c7085]">{label}</span>
                          <span className="font-semibold text-[#432744]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="font-bold text-[#432744]">Summary</p>
                  <div className="mt-4 space-y-3 text-sm">
                    {formValues.pricing.summary.map(([label, value], index) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-[#8c7085]">{label}</span>
                        <span
                          className={`font-semibold ${
                            index >= 3 ? "text-[#ea4f93]" : "text-[#432744]"
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[20px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="font-bold text-[#432744]">Price Comparison</p>
                  <div className="mt-4 space-y-3 text-sm">
                    {formValues.pricing.comparison.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-[#8c7085]">{label}</span>
                        <span className={`font-semibold ${getComparisonValueTone(label)}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Service Workflow"
            subtitle=""
            icon={<BarChart3 size={18} />}
            sectionId="workflow-section"
            sectionRef={workflowRef}
            highlighted={highlightedSection === "workflow"}
          >
            <div className="space-y-3">
              {formValues.workflow.map(([title, duration, tools, level], index) => (
                <div
                  key={title}
                  className="grid gap-3 rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] px-4 py-3 md:grid-cols-[34px_minmax(0,1fr)]"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ea4f93] text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    {isEditing ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <InputLabel>Step Title</InputLabel>
                          <EditInput
                            value={title}
                            onChange={handleWorkflowFieldChange(index, "title")}
                          />
                        </div>
                        <div>
                          <InputLabel>Duration</InputLabel>
                          <EditInput
                            value={duration}
                            onChange={handleWorkflowFieldChange(index, "duration")}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <InputLabel>Tools</InputLabel>
                          <EditTextarea
                            value={tools.join(", ")}
                            onChange={handleWorkflowFieldChange(index, "tools")}
                            rows={2}
                          />
                        </div>
                        <div>
                          <InputLabel>Skill Level</InputLabel>
                          <EditSelect
                            value={level}
                            onChange={handleWorkflowFieldChange(index, "level")}
                            options={WORKFLOW_LEVEL_OPTIONS}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-[#432744]">{title}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Pill tone="pink">{duration}</Pill>
                          {tools.map((tool, toolIndex) => (
                            <Pill key={tool} tone={toolIndex % 2 === 0 ? "blue" : "purple"}>
                              {tool}
                            </Pill>
                          ))}
                          <Pill tone="yellow">{level}</Pill>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Required Staff Skills"
            subtitle=""
            icon={<Star size={18} />}
            sectionId="skills-section"
            sectionRef={skillsRef}
            highlighted={highlightedSection === "skills"}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {formValues.skills.map(([title, subtitle, score, label], index) => (
                <div key={title} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <InputLabel>Skill</InputLabel>
                        <EditInput value={title} onChange={handleSkillFieldChange(index, "title")} />
                      </div>
                      <div>
                        <InputLabel>Subtitle</InputLabel>
                        <EditInput
                          value={subtitle}
                          onChange={handleSkillFieldChange(index, "subtitle")}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <InputLabel>Level Control</InputLabel>
                          <SkillLevelSlider
                            value={score}
                            onChange={handleSkillFieldChange(index, "score")}
                          />
                        </div>
                        <div>
                          <InputLabel>Label</InputLabel>
                          <div className="rounded-2xl border border-[#f4d4e2] bg-white px-4 py-3">
                            <SkillStars count={score} />
                            <p className="mt-2 text-sm font-semibold text-[#8c7085]">
                              {SKILL_LEVEL_LABELS[score]}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f9d8e5]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#ea4f93_0%,#f59f61_55%,#f7d85f_100%)]"
                          style={{ width: `${score * 20}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                        {title}
                      </p>
                      <p className="mt-1 text-xs text-[#c694ad]">{subtitle}</p>
                      <div className="mt-3">
                        <SkillStars count={score} />
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-[#f9d8e5]">
                        <div
                          className="h-full rounded-full bg-[image:var(--gradient-accent)]"
                          style={{ width: `${score * 20}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-[#8c7085]">{label}</p>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-[18px] bg-[image:var(--gradient-accent)] px-4 py-4 text-center text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                  Required Staff Level
                </p>
                <p className="mt-2 text-lg font-extrabold">Advanced Artist</p>
              </div>
              {[
                [formValues.eligibleArtists, "Eligible Artists"],
                [formValues.expertLevel, "Expert Level"],
                [formValues.advancedLevel, "Advanced Level"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] px-4 py-4 text-center">
                  {isEditing ? (
                    <div className="text-left">
                      <InputLabel>{label}</InputLabel>
                      <EditInput
                        value={value}
                        onChange={handleChange(
                          label === "Eligible Artists"
                            ? "eligibleArtists"
                            : label === "Expert Level"
                              ? "expertLevel"
                              : "advancedLevel",
                        )}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                      <p className="mt-1 text-xs text-[#c694ad]">{label}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard
            title="Quick Summary"
            subtitle=""
            icon={<Sparkles size={18} />}
            sectionId="quick-summary-section"
            sectionRef={quickSummaryRef}
            highlighted={highlightedSection === "quick-summary"}
          >
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <InputLabel>Design Status</InputLabel>
                  <EditSelect
                    value={formValues.designStatus}
                    onChange={handleChange("designStatus")}
                    options={DESIGN_COMPONENT_OPTIONS["Design Status"]}
                  />
                </div>
                <div>
                  <InputLabel>Try-On Ready</InputLabel>
                  <select
                    value={String(formValues.tryOnReady)}
                    onChange={handleBooleanChange("tryOnReady")}
                    className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <InputLabel>Complexity</InputLabel>
                  <EditSelect
                    value={formValues.complexity}
                    onChange={handleChange("complexity")}
                    options={DESIGN_COMPONENT_OPTIONS.Complexity}
                  />
                </div>
                <div>
                  <InputLabel>Est. Duration</InputLabel>
                  <EditSelect
                    value={formValues.estimatedDuration}
                    onChange={handleChange("estimatedDuration")}
                    options={DESIGN_COMPONENT_OPTIONS["Est. Duration"]}
                  />
                </div>
                <div>
                  <InputLabel>Nail Shape</InputLabel>
                  <EditSelect
                    value={formValues.nailShape}
                    onChange={handleChange("nailShape")}
                    options={DESIGN_COMPONENT_OPTIONS["Nail Shape"]}
                  />
                </div>
                <div>
                  <InputLabel>Nail Length</InputLabel>
                  <EditSelect
                    value={formValues.nailLength}
                    onChange={handleChange("nailLength")}
                    options={DESIGN_COMPONENT_OPTIONS["Nail Length"]}
                  />
                </div>
                <div className="rounded-[16px] border border-dashed border-[#f3c9dd] bg-[#fff8fb] px-4 py-3 text-xs text-[#8c7085]">
                  Suggested price remains locked in edit mode.
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {summaryRows.map(([label, value], index) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-[#8c7085]">{label}</span>
                    <span className={`font-semibold ${index === 6 ? "text-[#ea4f93]" : "text-[#432744]"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Performance" subtitle="" icon={<BarChart3 size={18} />}>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["342", "Total Bookings"],
                ["218", "Favorites"],
                ["4.6★", "Avg Rating"],
                ["61%", "Repeat Rate"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[18px] bg-[#fff3f8] px-4 py-4 text-center">
                  <p className="text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                  <p className="mt-1 text-xs text-[#c694ad]">{label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Staff Match" subtitle="" icon={<WandSparkles size={18} />}>
            <div className="space-y-3">
              {formValues.staffMatch.map(([name, score]) => (
                <div key={name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ea4f93_0%,#9b5cf6_100%)] text-[10px] font-bold text-white">
                      {name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <p className="text-sm font-bold text-[#432744]">{name}</p>
                  </div>
                  <span className="text-xs font-bold text-[#ea4f93]">{score}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[16px] bg-[#fff4df] px-3 py-3 text-xs text-[#af7a22]">
              5 artists below required skill level filtered out for this design.
            </div>
          </SectionCard>

          <SectionCard title="Quick Actions" subtitle="" icon={<Settings2 size={18} />}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  scrollToSection(heroSectionRef, { startEdit: true, sectionKey: "hero" })
                }
                className={`w-full rounded-full px-4 py-2.5 text-left text-xs font-bold text-white transition ${
                  highlightedSection === "hero"
                    ? "bg-[image:var(--gradient-accent)] shadow-[0_14px_26px_rgba(236,72,153,0.28)] ring-4 ring-[#ffd8e8]"
                    : "bg-[image:var(--gradient-accent)]"
                }`}
              >
                <PencilLine size={13} className="mr-1.5 inline" />
                Edit Design
              </button>
              {[
                [
                  "Add Variant",
                  Copy,
                  () =>
                    scrollToSection(designVariantsRef, {
                      startEdit: true,
                      sectionKey: "design-variants",
                    }),
                  "design-variants",
                ],
                [
                  "Update Price",
                  CircleDollarSign,
                  () => scrollToSection(pricingRef, { sectionKey: "pricing" }),
                  "pricing",
                ],
                [
                  "Upload Media",
                  Upload,
                  () => scrollToSection(heroSectionRef, { sectionKey: "hero" }),
                  "hero",
                ],
                [
                  "Archive Design",
                  Trash2,
                  () =>
                    scrollToSection(quickSummaryRef, {
                      startEdit: true,
                      sectionKey: "quick-summary",
                    }),
                  "quick-summary",
                ],
              ].map(([label, Icon, onClick, sectionKey]) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className={`w-full rounded-full border px-4 py-2.5 text-left text-xs font-bold transition ${
                    highlightedSection === sectionKey
                      ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93] shadow-[0_12px_24px_rgba(236,72,153,0.16)] ring-4 ring-[#ffd8e8]"
                      : "border-[#f4c6da] bg-white text-[#7e6075]"
                  }`}
                >
                  <Icon size={13} className="mr-1.5 inline" />
                  {label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Customer Preview"
            subtitle="How customers see this design"
            icon={<Eye size={18} />}
            sectionId="customer-preview-section"
            sectionRef={customerPreviewRef}
            highlighted={highlightedSection === "customer-preview"}
          >
            <div className="overflow-hidden rounded-[18px] bg-[#f6edf2]">
              <img
                src={DESIGN_PREVIEW_IMAGE}
                alt={formValues.heroTitle}
                className="h-44 w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="mt-3 font-extrabold text-[#432744]">{formValues.heroTitle}</h4>
            <p className="mt-1 text-lg font-extrabold text-[#ea4f93]">{formValues.suggestedPrice}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Elegant", "Pearl", "Wedding", "Luxury"].map((tag, index) => (
                <Pill key={tag} tone={index % 2 === 0 ? "pink" : "purple"}>
                  {tag}
                </Pill>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white"
            >
              Try On Virtually
            </button>
          </SectionCard>
        </aside>
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save Design Changes"
        subtitle="This will update the design in the current mock detail flow."
        description="Confirm to apply the latest edits to this nail design."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Sparkles}
        width={520}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[formValues.name || "Design detail", formValues.designStatus || "Status pending", formValues.complexity || "Complexity pending"]}
        details={[
          { label: "Suggested Price", value: formValues.suggestedPrice || "No price entered" },
          { label: "Est. Duration", value: formValues.estimatedDuration || "No duration entered" },
        ]}
        warnings={["This mock update changes the UI flow only and does not persist outside this screen."]}
      />

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title="Discard Design Edits"
        subtitle="You are about to leave edit mode without saving."
        description="Unsaved updates to this nail design will be discarded."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: "Editing Mode", value: "Nail design detail" },
          { label: "Result", value: "Revert to last loaded values" },
        ]}
        warnings={["Current unsaved non-pricing edits on this screen will be lost. Pricing remains read-only."]}
      />
    </section>
  );
}
