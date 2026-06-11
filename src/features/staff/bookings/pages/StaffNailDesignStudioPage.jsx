import {
  Check,
  Palette,
  Search,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  getMockBookingById,
  getStaffDesignStudioExperienceById,
} from "../../../core/booking-management/services/mockBookings";
import {
  getStaffBookingDetailRoute,
  getStaffBookingDesignUpdateRoute,
  ROUTES,
} from "../../../../shared/constants/routes";

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[#ea4f93]" />
      <h2 className="text-xs font-extrabold text-[#ea4f93]">{title}</h2>
    </div>
  );
}

SectionTitle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
};

function Pill({ active = false, children, className = "", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
        active
          ? "border-[#f2bfd4] bg-[#fff1f7] text-[#ea4f93]"
          : "border-[#f4dbe7] bg-white text-[#b18099] hover:bg-[#fff8fc]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

Pill.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

function TemplateCard({ item, isSelected, onSelect }) {
  return (
    <article
      className={`overflow-hidden rounded-[20px] border bg-white shadow-[0_10px_24px_rgba(236,72,153,0.08)] ${
        isSelected ? "border-[#ef6aac] ring-2 ring-[#ef6aac]/20" : "border-[#f4dbe7]"
      }`}
    >
      <img
        src={item.image}
        alt={item.name}
        className="h-28 w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="p-3">
        <h3 className="text-xs font-extrabold text-[#38253a]">{item.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#fff1f7] px-2 py-1 text-[9px] font-bold text-[#ea4f93]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#ea4f93]">{item.price}</p>
            <p className="mt-1 text-[10px] text-[#ae8da0]">{item.duration}</p>
          </div>
          <span className={`rounded-md px-2 py-1 text-[9px] font-extrabold ${item.accentClassName}`}>
            {item.accent}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="flex-1 rounded-[10px] bg-[image:var(--gradient-accent)] px-3 py-2 text-[10px] font-extrabold text-white"
          >
            {isSelected ? "Selected" : item.ctaLabel}
          </button>
          <button
            type="button"
            onClick={onSelect}
            className="rounded-[10px] border border-[#f2bfd4] bg-white px-3 py-2 text-[10px] font-extrabold text-[#ea4f93]"
          >
            Customize
          </button>
        </div>
      </div>
    </article>
  );
}

TemplateCard.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  item: PropTypes.shape({
    accent: PropTypes.string.isRequired,
    accentClassName: PropTypes.string.isRequired,
    ctaLabel: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

function RecommendationBlock({ title, items }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-[#a78a9e]">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[#d8cbff] bg-[#f1edff] px-3 py-1.5 text-[10px] font-bold text-[#7d5ce6]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

RecommendationBlock.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  title: PropTypes.string.isRequired,
};

const TEMPLATE_PRESETS = {
  "chrome-pearl": {
    shape: "Almond",
    length: "Medium",
    color: "Chrome",
    finish: "Glossy",
    decorations: ["Pearl"],
    extras: [],
  },
  "korean-nude": {
    shape: "Oval",
    length: "Short",
    color: "Nude",
    finish: "Glossy",
    decorations: [],
    extras: [],
  },
  "french-ombre": {
    shape: "Coffin",
    length: "Medium",
    color: "Pink",
    finish: "Glossy",
    decorations: ["French Tip"],
    extras: [],
  },
  "wedding-floral": {
    shape: "Almond",
    length: "Long",
    color: "White",
    finish: "Glossy",
    decorations: ["Floral", "Stone"],
    extras: ["Hand Spa"],
  },
  "minimal-beige": {
    shape: "Square",
    length: "Short",
    color: "Nude",
    finish: "Matte",
    decorations: [],
    extras: [],
  },
  "soft-nude": {
    shape: "Oval",
    length: "Short",
    color: "Nude",
    finish: "Glossy",
    decorations: [],
    extras: [],
  },
  "pink-gloss": {
    shape: "Round",
    length: "Medium",
    color: "Pink",
    finish: "Glossy",
    decorations: [],
    extras: [],
  },
  "custom-consultation": {
    shape: "Almond",
    length: "Medium",
    color: "Pink",
    finish: "Glossy",
    decorations: [],
    extras: [],
  },
};

const NAIL_LABELS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];

function createNailDecorationLayout(decorations = []) {
  const layout = Array.from({ length: 5 }, () => []);

  if (decorations.includes("French Tip")) {
    return layout.map(() => ["French Tip"]);
  }

  if (decorations.includes("Cat Eye")) {
    return layout.map(() => ["Cat Eye"]);
  }

  if (decorations.includes("Pearl")) {
    layout[3] = [...layout[3], "Pearl"];
  }

  if (decorations.includes("Stone")) {
    layout[3] = [...layout[3], "Stone"];
  }

  if (decorations.includes("Floral")) {
    layout[3] = [...layout[3], "Floral"];
  }

  if (decorations.includes("Gold Line")) {
    layout[1] = [...layout[1], "Gold Line"];
    layout[3] = [...layout[3], "Gold Line"];
  }

  if (decorations.includes("Sticker")) {
    layout[2] = [...layout[2], "Sticker"];
  }

  return layout;
}

function getColorStyle(color, colors) {
  const found = colors.find((item) => item.label === color);

  if (!found) {
    return { background: "linear-gradient(180deg,#d7e0eb 0%,#bac8d8 100%)" };
  }

  if (found.swatch.startsWith("linear-gradient")) {
    return { backgroundImage: found.swatch };
  }

  if (color === "Chrome") {
    return { background: "linear-gradient(180deg,#e0e6ef 0%,#b6c0cf 45%,#eff3f8 100%)" };
  }

  return { backgroundColor: found.swatch };
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

function PreviewNail({ decorationSet, finish, index, isActive, shape, length, colorStyle }) {
  const metrics = getNailMetrics(shape, length, index);
  const isChrome = finish === "Chrome";
  const isJelly = finish === "Jelly";
  const isMatte = finish === "Matte";
  const isGlitter = finish === "Glitter";
  const isCatEye = decorationSet.has("Cat Eye");

  return (
    <div
      className={`relative w-9 ${metrics.shapeClassName} ${getFinishEffect(finish)} overflow-hidden shadow-[0_12px_18px_rgba(174,190,208,0.22)] ${isActive ? "ring-2 ring-[#ef6aac]/45 ring-offset-2 ring-offset-[#fff2f8]" : ""}`}
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

      {isCatEye ? (
        <span className="absolute inset-y-[8%] left-1/2 w-[22%] -translate-x-1/2 rounded-full bg-white/65 blur-[5px] opacity-80" />
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

      {decorationSet.has("Floral") ? (
        <span className="absolute left-1/2 top-[34%] h-3 w-3 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_#ffffff_15%,_#f59ac2_18%,_#f59ac2_34%,_transparent_38%)]" />
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
  isActive: PropTypes.bool.isRequired,
  length: PropTypes.string.isRequired,
  shape: PropTypes.string.isRequired,
};

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

function ChoiceGrid({ items, selected, onSelect, type = "pill" }) {
  if (type === "color") {
    return (
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const isGradient = item.swatch.startsWith("linear-gradient");
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(item.label)}
              className="flex flex-col items-center gap-2 text-[10px] font-bold text-[#8c7285]"
            >
              <span
                className={`block h-7 w-7 rounded-full border-2 ${
                  selected === item.label ? "border-[#ea4f93] ring-2 ring-[#f7bdd6]" : "border-white shadow-sm"
                }`}
                style={isGradient ? { backgroundImage: item.swatch } : { backgroundColor: item.swatch }}
              />
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "shape" || type === "length") {
    return (
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const isActive = selected === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex min-w-[64px] flex-col items-center rounded-[14px] border px-3 py-3 text-[10px] font-bold ${
                isActive
                  ? "border-[#ef6aac] bg-[#fff4f8] text-[#ea4f93] shadow-[0_10px_20px_rgba(236,72,153,0.12)]"
                  : "border-[#f4dbe7] bg-white text-[#b18099]"
              }`}
            >
              <span
                className={`mb-2 block rounded-full bg-[linear-gradient(180deg,#ffd7ea_0%,#f3b8d2_100%)] ${
                  type === "shape"
                    ? item === "Coffin"
                      ? "h-8 w-6 rounded-sm"
                      : item === "Square"
                        ? "h-8 w-6 rounded-[4px]"
                        : item === "Oval"
                          ? "h-8 w-6 rounded-[45%]"
                          : item === "Round"
                            ? "h-8 w-6 rounded-[50%]"
                            : "h-8 w-6 rounded-[12px]"
                    : item === "Short"
                      ? "h-4 w-3"
                      : item === "Medium"
                        ? "h-7 w-3"
                        : "h-10 w-3"
                }`}
              />
              {item}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Pill key={item} active={selected.includes(item)} onClick={() => onSelect(item)}>
          {item}
        </Pill>
      ))}
    </div>
  );
}

ChoiceGrid.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        swatch: PropTypes.string.isRequired,
      }),
    ]),
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  selected: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
  type: PropTypes.oneOf(["pill", "color", "shape", "length"]),
};

export function StaffNailDesignStudioPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const booking = getMockBookingById(bookingId);
  const studio = getStaffDesignStudioExperienceById(bookingId);

  const [selectedTemplateId, setSelectedTemplateId] = useState(studio?.selectedDesign.id ?? "");
  const [selectedShape, setSelectedShape] = useState(studio?.builder.initialSelection.shape ?? "");
  const [selectedLength, setSelectedLength] = useState(studio?.builder.initialSelection.length ?? "");
  const [selectedColor, setSelectedColor] = useState(studio?.builder.initialSelection.color ?? "");
  const [selectedFinish, setSelectedFinish] = useState(studio?.builder.initialSelection.finish ?? "");
  const [isDesignConfirmed, setIsDesignConfirmed] = useState(false);
  const [activeNailIndex, setActiveNailIndex] = useState(3);
  const [nailDecorations, setNailDecorations] = useState(
    createNailDecorationLayout(studio?.builder.initialSelection.decorations ?? []),
  );
  const [selectedExtras, setSelectedExtras] = useState(studio?.builder.initialSelection.extras ?? []);

  const activeTemplate = useMemo(
    () => studio?.templates.find((item) => item.id === selectedTemplateId) ?? studio?.selectedDesign,
    [selectedTemplateId, studio],
  );
  const previewColorStyle = useMemo(
    () => getColorStyle(selectedColor, studio?.builder.colors ?? []),
    [selectedColor, studio],
  );
  const selectedDecorations = useMemo(
    () => nailDecorations[activeNailIndex] ?? [],
    [activeNailIndex, nailDecorations],
  );

  const applyTemplatePreset = (templateId) => {
    setSelectedTemplateId(templateId);

    const preset = TEMPLATE_PRESETS[templateId];

    if (!preset) {
      return;
    }

    setSelectedShape(preset.shape);
    setSelectedLength(preset.length);
    setSelectedColor(preset.color);
    setSelectedFinish(preset.finish);
    setNailDecorations(createNailDecorationLayout(preset.decorations));
    setActiveNailIndex(preset.decorations.length > 0 ? 3 : 0);
    setSelectedExtras(preset.extras);
  };

  if (!booking || !studio) {
    return <Navigate to={ROUTES.staffBookings} replace />;
  }

  const toggleArraySelection = (value, current, setter) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const toggleNailDecoration = (decoration) => {
    setNailDecorations((current) =>
      current.map((items, index) => {
        if (index !== activeNailIndex) {
          return items;
        }

        return items.includes(decoration)
          ? items.filter((item) => item !== decoration)
          : [...items, decoration];
      }),
    );
  };

  const detailRoute = getStaffBookingDetailRoute(bookingId);
  const updateDesignRoute = getStaffBookingDesignUpdateRoute(bookingId);
  const priceMap = {
    "chrome-pearl": "$48.00",
    "korean-nude": "$35.00",
    "french-ombre": "$42.00",
    "wedding-floral": "$65.00",
    "minimal-beige": "$30.00",
    "soft-nude": "$35.00",
    "pink-gloss": "$42.00",
    "custom-consultation": "$56.00",
  };

  const handleConfirmDesign = () => {
    setIsDesignConfirmed(true);
  };

  const handleOpenUpdateBookingDesign = () => {
    if (!isDesignConfirmed) {
      return;
    }

    navigate(updateDesignRoute, {
      state: {
        designUpdate: {
          bookingCode: studio.bookingCode,
          statusLabel: "Updating Design",
          summaryStatus: "Updating Design",
          customer: studio.customerName,
          staffArtist: studio.staffName,
          appointment: "Today, 2:30 PM",
          chair: "Chair #3",
          previousDesign: {
            name: "Classic French Manicure",
            shortName: "Classic French",
            price: "$45.00",
            duration: "45 min",
            image: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=800&q=80",
          },
          newDesign: {
            name:
              `${selectedColor} ${selectedFinish} ${selectedDecorations.length > 0 ? selectedDecorations[0] : activeTemplate.name}`.replace(/\s+/g, " ").trim(),
            shortName: activeTemplate.name,
            price: priceMap[selectedTemplateId] ?? studio.builder.totalPrice,
            duration: studio.builder.estimatedDuration,
            image: activeTemplate.image,
          },
          serviceSummary: {
            shape: [selectedShape],
            length: [selectedLength === "Long" ? "Medium Long" : selectedLength],
            colors: [selectedColor, "Deep Rose", "Pearl White"].filter((value, index, arr) => arr.indexOf(value) === index),
            finish: [selectedFinish, selectedFinish === "Chrome" ? "Mirror Effect" : "Soft Reflection"],
            decorations: Array.from(new Set(nailDecorations.flat())).length > 0 ? Array.from(new Set(nailDecorations.flat())) : ["Minimal Finish"],
            extras: selectedExtras.length > 0 ? selectedExtras : ["Gel Top Coat"],
          },
          pricing: {
            originalPrice: "$45.00",
            newPrice: priceMap[selectedTemplateId] ?? studio.builder.totalPrice,
            additionalCost: "+$33.00",
            additionalNote: "To be collected",
            updatedDuration: studio.builder.estimatedDuration,
            durationNote: "+30 min added",
            warning: "Additional payment required - customer must pay an extra $33.00 before service begins.",
          },
          designStatus: {
            previousDesign: "Classic French",
            newDesign: activeTemplate.name,
            designSelected: "Confirmed",
            bookingUpdated: "Pending",
            customerAgreed: "Pending",
          },
          addOns: [
            { title: "Hand Spa", note: "Moisturizing treatment", price: "+$18", tone: "pink", kind: "spa" },
            { title: "Chrome Upgrade", note: "Mirror chrome powder", price: "+$12", tone: "violet", kind: "chrome" },
            { title: "Nail Repair", note: "Fix broken nails", price: "+$8", tone: "emerald", kind: "repair" },
          ],
          confirmations: [
            {
              key: "reviewed",
              title: "Customer reviewed new design",
              note: `Customer has seen and approved the ${activeTemplate.name} design preview`,
              checked: true,
            },
            {
              key: "price",
              title: "Customer accepted updated price",
              note: "Customer agrees to pay updated total before service starts",
              checked: false,
            },
            {
              key: "duration",
              title: "Customer accepted updated duration",
              note: `Customer acknowledges service will take approximately ${studio.builder.estimatedDuration}`,
              checked: false,
            },
          ],
        },
      },
    });
  };

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f9_100%)]">
      <div className="rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
        <div className="space-y-4">
          <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#80687d]" />
              <input
                type="text"
                defaultValue=""
                placeholder="Search nails designs..."
                className="h-11 w-full rounded-[12px] border border-[#f4dbe7] bg-[#fffafc] pl-11 pr-4 text-sm text-[#594456] outline-none transition focus:border-[#ef6aac]"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {studio.filters.map((filter, index) => (
                <Pill key={filter} active={index === 0}>
                  {filter}
                </Pill>
              ))}
            </div>
          </article>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#38253a]">Ready-Made Design Templates</h2>
                    <p className="mt-1 text-[11px] text-[#a8899c]">
                      Select a template or customize from scratch
                    </p>
                  </div>
                  <button type="button" className="text-[11px] font-bold text-[#ea4f93]">
                    See all 48 designs
                  </button>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {studio.templates.map((item) => (
                    <TemplateCard
                      key={item.id}
                      item={item}
                      isSelected={item.id === selectedTemplateId}
                      onSelect={() => applyTemplatePreset(item.id)}
                    />
                  ))}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-extrabold text-[#38253a]">Layer-Based Custom Builder</h2>
                  <span className="rounded-full border border-[#f2bfd4] bg-[#fff4f8] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                    {studio.builder.modeLabel}
                  </span>
                </div>

                <div className="mt-6 space-y-6">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">1</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Nail Shape</p>
                    </div>
                    <ChoiceGrid
                      items={studio.builder.shapes}
                      selected={selectedShape}
                      onSelect={setSelectedShape}
                      type="shape"
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">2</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Nail Length</p>
                    </div>
                    <ChoiceGrid
                      items={studio.builder.lengths}
                      selected={selectedLength}
                      onSelect={setSelectedLength}
                      type="length"
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">3</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Nail Color</p>
                    </div>
                    <ChoiceGrid
                      items={studio.builder.colors}
                      selected={selectedColor}
                      onSelect={setSelectedColor}
                      type="color"
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">4</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Finish / Texture</p>
                    </div>
                    <ChoiceGrid
                      items={studio.builder.finishes}
                      selected={[selectedFinish]}
                      onSelect={setSelectedFinish}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">5</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Decorations</p>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {NAIL_LABELS.map((label, index) => (
                        <Pill
                          key={label}
                          active={activeNailIndex === index}
                          onClick={() => setActiveNailIndex(index)}
                        >
                          {label}
                        </Pill>
                      ))}
                    </div>
                    <p className="mb-3 text-[10px] font-bold text-[#b07d97]">
                      Editing decoration for {NAIL_LABELS[activeNailIndex]} nail
                    </p>
                    <ChoiceGrid
                      items={studio.builder.decorations}
                      selected={selectedDecorations}
                      onSelect={toggleNailDecoration}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef6aac] text-[10px] font-extrabold text-white">6</span>
                      <p className="text-xs font-extrabold text-[#ea4f93]">Extra Services</p>
                    </div>
                    <ChoiceGrid
                      items={studio.builder.extras}
                      selected={selectedExtras}
                      onSelect={(value) => toggleArraySelection(value, selectedExtras, setSelectedExtras)}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-[18px] border border-[#f2bfd4] bg-[linear-gradient(135deg,#fff6fa_0%,#ffeef7_100%)] p-4">
                  <SectionTitle icon={Star} title="Price & Duration Estimation" />
                  <div className="mt-4 space-y-3 text-sm text-[#8a6f83]">
                    {studio.builder.priceRows.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3 border-b border-[#f6d8e7] pb-2">
                        <span>{label}</span>
                        <span className="font-bold text-[#ea4f93]">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-base font-extrabold text-[#38253a]">Estimated Total</p>
                    <p className="text-[1.6rem] font-extrabold text-[#d83379]">{studio.builder.totalPrice}</p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#d34f88]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ea4f93]" />
                    Estimated Duration: {studio.builder.estimatedDuration}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleOpenUpdateBookingDesign}
                    disabled={!isDesignConfirmed}
                    className={`rounded-[12px] px-4 py-3 text-xs font-bold transition ${
                      isDesignConfirmed
                        ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
                        : "cursor-not-allowed border border-[#f2bfd4] bg-[#fff4f8] text-[#c7a0b4]"
                    }`}
                  >
                    Update Booking Design
                  </button>
                  <button
                    type="button"
                    className="rounded-[12px] border border-[#f2bfd4] bg-white px-4 py-3 text-xs font-bold text-[#ea4f93]"
                  >
                    Save Design
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDesign}
                    className="rounded-[12px] bg-[linear-gradient(135deg,#37d999_0%,#11b879_100%)] px-4 py-3 text-xs font-bold text-white shadow-[0_12px_24px_rgba(17,184,121,0.18)]"
                  >
                    {isDesignConfirmed ? "Design Confirmed" : "Confirm Design"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(detailRoute)}
                    className="rounded-[12px] border border-[#ded2da] bg-white px-4 py-3 text-xs font-bold text-[#846e7f]"
                  >
                    Back to Booking Detail
                  </button>
                </div>
              </article>
            </div>

            <aside className="space-y-4">
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4">
                <SectionTitle icon={Palette} title="Live Nail Preview" />
                <div className="mt-4 rounded-[18px] bg-[linear-gradient(180deg,#fff3f9_0%,#ffeef7_100%)] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] bg-white/65 px-3 py-2 text-[10px] font-bold text-[#b07d97]">
                    <span>Surface Mode</span>
                    <span className="rounded-full bg-[#fff1f7] px-2.5 py-1 text-[#ea4f93]">
                      {selectedFinish}
                    </span>
                  </div>
                  <div className="flex items-end justify-center gap-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <PreviewNail
                        key={index}
                        colorStyle={previewColorStyle}
                        decorationSet={new Set(nailDecorations[index] ?? [])}
                        finish={selectedFinish}
                        index={index}
                        isActive={activeNailIndex === index}
                        length={selectedLength}
                        shape={selectedShape}
                      />
                    ))}
                  </div>
                  <div className="mt-5 text-center">
                    <p className="text-[10px] text-[#aa8c9f]">Current Design</p>
                    <p className="mt-1 text-sm font-extrabold text-[#ea4f93]">{activeTemplate.name}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold text-[#d2508a]">
                      <span>{selectedShape}</span>
                      <span>{selectedLength}</span>
                      <span>{selectedColor}</span>
                      <span>{selectedFinish}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {selectedDecorations.length > 0 ? (
                      selectedDecorations.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[#f2bfd4] bg-white px-2.5 py-1 text-[10px] font-bold text-[#ea4f93]"
                        >
                          {NAIL_LABELS[activeNailIndex]}: {item}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-[#f0d7e3] bg-white px-2.5 py-1 text-[10px] font-bold text-[#b48aa0]">
                        {NAIL_LABELS[activeNailIndex]}: No decoration
                      </span>
                    )}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {[
                      ["Shape", selectedShape],
                      ["Finish", selectedFinish],
                      ["Length", selectedLength],
                      ["Color", selectedColor],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[12px] bg-white px-3 py-2 text-center">
                        <p className="text-[10px] text-[#a98c9f]">{label}</p>
                        <p className="mt-1 text-xs font-extrabold text-[#ea4f93]">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[12px] border border-[#f2bfd4] bg-white/70 px-3 py-2 text-center text-[10px] font-bold text-[#b07d97]">
                    {isDesignConfirmed
                      ? "Design confirmed. Update Booking Design is now ready."
                      : "Confirm Design first to unlock Update Booking Design."}
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4">
                <SectionTitle icon={Star} title="Customer Preferences" />
                <div className="mt-4 space-y-4">
                  {studio.preferences.map((item) => (
                    <div key={item.label} className="border-b border-[#f8e6ef] pb-3 last:border-b-0 last:pb-0">
                      <p className="text-[10px] text-[#a98c9f]">{item.label}</p>
                      <p className="mt-1 text-xs font-extrabold text-[#38253a]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4">
                <SectionTitle icon={Check} title="Current Booking Summary" />
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ["Booking ID", `#${studio.bookingCode}`],
                    ["Status", studio.statusLabel],
                    ["Current Service", activeTemplate.summaryService ?? studio.selectedDesign.summaryService],
                    ["Assigned Staff", studio.staffName],
                    ["Selected Design", activeTemplate.name],
                    ["Appointment", "Today, 2:30 PM"],
                    ["Est. Total", studio.builder.totalPrice],
                  ].map(([label, value], index) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between gap-4 ${
                        index < 6 ? "border-b border-[#f8e6ef] pb-3" : ""
                      }`}
                    >
                      <span className="text-[11px] text-[#a98c9f]">{label}</span>
                      <span className={`text-right font-extrabold ${label === "Est. Total" ? "text-[#d83379]" : "text-[#38253a]"}`}>
                        {label === "Status" ? (
                          <span className="rounded-full bg-[#fff3d9] px-2 py-1 text-[10px] text-[#c58a12]">
                            {value}
                          </span>
                        ) : (
                          value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
