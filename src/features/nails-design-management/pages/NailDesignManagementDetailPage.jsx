import {
  BarChart3,
  CircleDollarSign,
  Copy,
  Eye,
  FileImage,
  PencilLine,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { getMockNailDesignDetailById } from "../services/mockNailDesigns";

const DESIGN_PREVIEW_IMAGE =
  "https://i0.wp.com/greenweddingshoes.com/wp-content/uploads/2025/12/red-cat-eye-christmas-holiday-nails-with-bow.webp?fit=1024%2C9999";

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <article className="rounded-[22px] border border-[#f8d3e2] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
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

function SkillStars({ count }) {
  return (
    <div className="flex gap-1 text-[#ea4f93]">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < count ? "opacity-100" : "opacity-20"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function NailDesignManagementDetailPage() {
  const navigate = useNavigate();
  const { designId } = useParams();
  const initialDesign = getMockNailDesignDetailById(designId);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState(initialDesign);

  if (!initialDesign) {
    return <Navigate to={ROUTES.adminNailDesigns} replace />;
  }

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleStartEdit = () => {
    setFlashMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormValues(initialDesign);
    setFlashMessage("");
    setIsEditing(false);
  };

  const handleSave = () => {
    setFlashMessage("Mock update completed. Changes are local to this detail screen.");
    setIsEditing(false);
  };

  const handleDelete = () => {
    navigate(ROUTES.adminNailDesigns, {
      state: {
        flashMessage: `Mock delete completed for ${formValues.heroTitle || formValues.id}.`,
      },
    });
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
              View design components, pricing, workflow, and AI recommendation profile.
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
                  onClick={handleSave}
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
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
          <article className="rounded-[22px] border border-[#f8d3e2] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
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
                        key={`${tag}-${index}`}
                        tone={index < 2 ? "pink" : index % 3 === 0 ? "purple" : "default"}
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
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(formValues.customerProfile).map(([label, values]) => (
                <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                    {label}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {values.map((value, index) => (
                      <Pill
                        key={value}
                        tone={index % 4 === 0 ? "pink" : index % 4 === 1 ? "purple" : index % 4 === 2 ? "green" : "yellow"}
                      >
                        {value}
                      </Pill>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Design Components"
            subtitle="Core structure and styling decisions"
            icon={<Settings2 size={18} />}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {formValues.designComponents.map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c694ad]">
                    {label}
                  </p>
                  <p className="mt-3 text-sm font-extrabold text-[#432744]">{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Design Variants"
            subtitle="Design variations have different accessories"
            icon={<Copy size={18} />}
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
                  <h4 className="mt-3 font-extrabold text-[#432744]">{variant.name}</h4>
                  <p className="mt-1 text-sm text-[#8c7085]">{variant.description}</p>
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
                    {formValues.pricing.comparison.map(([label, value], index) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-[#8c7085]">{label}</span>
                        <span className={`font-semibold ${index === 2 ? "text-[#2fa25f]" : "text-[#432744]"}`}>
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
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Required Staff Skills"
            subtitle=""
            icon={<Star size={18} />}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {formValues.skills.map(([title, subtitle, score, label]) => (
                <div key={title} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
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
                  <p className="text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                  <p className="mt-1 text-xs text-[#c694ad]">{label}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Quick Summary" subtitle="" icon={<Sparkles size={18} />}>
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
                className="w-full rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-left text-xs font-bold text-white"
              >
                <PencilLine size={13} className="mr-1.5 inline" />
                Edit Design
              </button>
              {[
                ["Add Variant", Copy],
                ["Update Price", CircleDollarSign],
                ["Upload Media", Upload],
                ["Archive Design", Trash2],
              ].map(([label, Icon]) => (
                <button
                  key={label}
                  type="button"
                  className="w-full rounded-full border border-[#f4c6da] bg-white px-4 py-2.5 text-left text-xs font-bold text-[#7e6075]"
                >
                  <Icon size={13} className="mr-1.5 inline" />
                  {label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Customer Preview" subtitle="How customers see this design" icon={<Eye size={18} />}>
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
    </section>
  );
}
