import {
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  Upload,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ROUTES,
  getAdminNailDesignDetailRoute,
} from "../../../shared/constants/routes";
import { PropTypes } from "../../../shared/utils/propTypes";
import { NAIL_DESIGN_ROWS } from "../services/mockNailDesigns";

const SUMMARY_CARDS = [
  {
    label: "Total Designs",
    value: "1,284",
    note: "+46 this month",
    icon: Tag,
    iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
  },
  {
    label: "Active Designs",
    value: "987",
    note: "+12 this week",
    icon: WandSparkles,
    iconClassName: "bg-[#f3ebff] text-[#8b5cf6]",
  },
  {
    label: "Try-On Ready",
    value: "642",
    note: "+23 uploaded",
    icon: Sparkles,
    iconClassName: "bg-[#e7fbf4] text-[#23b68b]",
  },
  {
    label: "Most Popular Style",
    value: "French Ombre",
    note: "4,821 saves",
    icon: Star,
    iconClassName: "bg-[#fff4df] text-[#f5a623]",
  },
];

const DESIGN_CARD_PRESETS = [
  {
    title: "Nude Minimalist",
    tags: ["Minimalist", "Everyday", "Clean"],
    tones: ["Nude"],
    price: "$28",
    status: "No Try-On",
    accent: "bg-[#fff0f5] text-[#eb5a99]",
  },
  {
    title: "French Ombré Bliss",
    tags: ["Ombré", "Bridal", "Elegant"],
    tones: ["Pastel"],
    price: "$48",
    status: "Try-On Ready",
    accent: "bg-[#e7fbf4] text-[#23b68b]",
  },
  {
    title: "Chrome Glitter Storm",
    tags: ["Glitter", "Party", "Bold"],
    tones: ["Chrome"],
    price: "$65",
    status: "Try-On Ready",
    accent: "bg-[#e7fbf4] text-[#23b68b]",
  },
];

const TRENDING_DESIGNS = [
  ["French Ombré Bliss", "4,821 saves · 2.3k views"],
  ["Rose Petal Garden", "3,854 saves · 1.9k views"],
  ["Pastel Rainbow Swirl", "2,987 saves · 7.4k views"],
  ["Chrome Glitter Storm", "2,438 saves · 6.1k views"],
];

const MISSING_TRY_ON = [
  "Nude Minimalist",
  "Velvet Noir",
  "Sakura Dream",
  "Midnight Marble",
  "Coral Sunset",
];

const POPULAR_TAGS = [
  ["Bridal", "bg-[#ffe7ef] text-[#ea4f93]"],
  ["Elegant", "bg-[#eef2ff] text-[#566ce8]"],
  ["Spring", "bg-[#eaf9ee] text-[#2fa25f]"],
  ["Summer", "bg-[#fff4df] text-[#d9871c]"],
  ["Bold", "bg-[#ffe7ef] text-[#ea4f93]"],
  ["Minimalist", "bg-[#e7fbf4] text-[#23b68b]"],
  ["Pastel", "bg-[#f5ecff] text-[#8b5cf6]"],
  ["Everyday", "bg-[#eaf9ee] text-[#2fa25f]"],
  ["Glam", "bg-[#ffe7ef] text-[#ea4f93]"],
  ["Autumn", "bg-[#fff4df] text-[#d9871c]"],
  ["Chrome", "bg-[#f5ecff] text-[#8b5cf6]"],
  ["Romantic", "bg-[#ffe7ef] text-[#ea4f93]"],
  ["3D Art", "bg-[#e7fbf4] text-[#23b68b]"],
  ["Party", "bg-[#fff4df] text-[#d9871c]"],
];

const SEASONAL_SUGGESTIONS = [
  ["Cherry Blossom", "Spring Collection", "Trending", "bg-[#e7fbf4] text-[#23b68b]"],
  ["Tropical Brights", "Summer Collection", "Upcoming", "bg-[#fff4df] text-[#d9871c]"],
  ["Harvest Warmth", "Autumn Collection", "Plan Now", "bg-[#ffe7ef] text-[#ea4f93]"],
];

const DESIGN_PREVIEW_IMAGE =
  "https://i0.wp.com/greenweddingshoes.com/wp-content/uploads/2025/12/red-cat-eye-christmas-holiday-nails-with-bow.webp?fit=1024%2C9999";

function getPreviewMeta(index) {
  return DESIGN_CARD_PRESETS[index % DESIGN_CARD_PRESETS.length];
}

function normalizeDesign(design, index) {
  const preview = getPreviewMeta(index);
  const tags = design.tags.split(",").map((item) => item.trim()).filter(Boolean);

  return {
    ...design,
    uiTitle: preview.title,
    uiTags: preview.tags,
    uiTones: preview.tones,
    uiPrice: preview.price,
    uiStatus: preview.status,
    uiStatusTone: preview.accent,
    uiTagsAll: tags,
    initials: design.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[18px] border border-[#f8d7e5] bg-white p-4 shadow-[0_10px_24px_rgba(236,72,153,0.06)]">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.iconClassName}`}>
        <Icon size={16} />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#cd98b1]">
        {item.label}
      </p>
      <p className="mt-1 text-[1.9rem] font-extrabold leading-none text-[#3f2741]">
        {item.value}
      </p>
      <p className="mt-2 text-xs font-medium text-[#21b07b]">{item.note}</p>
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

function SmallTag({ children, className = "" }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}

SmallTag.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

function DesignPreview({ design }) {
  return (
    <div className="h-52 overflow-hidden rounded-t-[16px] bg-[#f6edf2]">
      <img
        src={DESIGN_PREVIEW_IMAGE}
        alt={design.uiTitle}
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

DesignPreview.propTypes = {
  design: PropTypes.shape({
    uiTitle: PropTypes.string.isRequired,
  }).isRequired,
};

export function NailDesignManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const designs = useMemo(
    () => NAIL_DESIGN_ROWS.map((design, index) => normalizeDesign(design, index)),
    [],
  );

  const filteredDesigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return designs;
    }

    return designs.filter((design) =>
      [
        design.id,
        design.name,
        design.uiTitle,
        design.category,
        design.collection,
        design.artist,
        design.tags,
        design.uiTagsAll.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [designs, query]);

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <div className="flex flex-col gap-3 rounded-[18px] bg-white/70 p-1 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
          >
            <Tag size={13} className="mr-1.5 inline" />
            Manage Tags
          </button>
          <button
            type="button"
            className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
          >
            <Plus size={13} className="mr-1.5 inline" />
            Add Category
          </button>
          <button
            type="button"
            className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
          >
            <Upload size={13} className="mr-1.5 inline" />
            Upload Try-On Asset
          </button>
          <Link
            to={ROUTES.adminNailDesignsCreate}
            className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
          >
            <Plus size={13} className="mr-1.5 inline" />
            Add Design
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.72fr)_290px]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#432744]">Design Gallery</h3>
              <p className="mt-1 text-[11px] text-[#c694ad]">
                Showing {filteredDesigns.length} of 1,284 designs
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-1.5 text-[10px] font-bold text-[#ea4f93]"
              >
                Filter
              </button>
              <button
                type="button"
                className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-1.5 text-[10px] font-bold text-[#ea4f93]"
              >
                Sort
              </button>
            </div>
          </div>

          {flashMessage ? (
            <div className="mb-4 rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
              {flashMessage}
            </div>
          ) : null}

          <label className="relative mb-4 block max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#df7baa]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search designs, categories, tags..."
              className="h-10 w-full rounded-full border border-[#f5d7e4] bg-[#fff9fc] pl-10 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDesigns.map((design) => (
              <article
                key={design.id}
                className="overflow-hidden rounded-[18px] border border-[#f8dce8] bg-white shadow-[0_12px_28px_rgba(236,72,153,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(236,72,153,0.12)]"
              >
                <Link to={getAdminNailDesignDetailRoute(design.id)} className="block">
                  <DesignPreview design={design} />
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={getAdminNailDesignDetailRoute(design.id)}
                        className="font-extrabold text-[#432744] transition hover:text-[#ea4f93]"
                      >
                        {design.uiTitle}
                      </Link>
                      <p className="mt-1 text-[11px] text-[#c694ad]">{design.id}</p>
                    </div>
                    <p className="text-sm font-extrabold text-[#432744]">{design.uiPrice}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {design.uiTags.map((tag, index) => (
                      <SmallTag
                        key={`${design.id}-${tag}`}
                        className={
                          [
                            "bg-[#ffe7ef] text-[#ea4f93]",
                            "bg-[#f5ecff] text-[#8b5cf6]",
                            "bg-[#fff4df] text-[#d9871c]",
                          ][index % 3]
                        }
                      >
                        {tag}
                      </SmallTag>
                    ))}
                    {design.uiTones.map((tag) => (
                      <SmallTag key={`${design.id}-${tag}`} className="bg-[#fff7fb] text-[#c694ad]">
                        {tag}
                      </SmallTag>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <SmallTag className={design.uiStatusTone}>{design.uiStatus}</SmallTag>
                    <div className="flex gap-2">
                      <Link
                        to={getAdminNailDesignDetailRoute(design.id)}
                        className="rounded-full border border-[#f4c6da] bg-white px-3 py-1.5 text-[10px] font-bold text-[#8c7085]"
                      >
                        View
                      </Link>
                      <Link
                        to={getAdminNailDesignDetailRoute(design.id)}
                        className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-1.5 text-[10px] font-bold text-[#ea4f93]"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredDesigns.length === 0 ? (
            <div className="mt-4 rounded-[16px] border border-[#f8dce8] bg-[#fffafb] px-5 py-8 text-center text-sm text-[#8a7082]">
              No nail designs matched the current search.
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
            <h3 className="text-sm font-extrabold text-[#432744]">Trending Designs</h3>
            <div className="mt-4 space-y-4">
              {TRENDING_DESIGNS.map(([name, meta], index) => (
                <div key={name} className="flex gap-3">
                  <span className="w-4 text-xs font-extrabold text-[#ea4f93]">{index + 1}</span>
                  <div>
                    <p className="text-sm font-bold text-[#432744]">{name}</p>
                    <p className="mt-1 text-[11px] text-[#c694ad]">{meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
            <h3 className="text-sm font-extrabold text-[#432744]">Missing Try-On Assets</h3>
            <div className="mt-4 space-y-3">
              {MISSING_TRY_ON.map((name) => (
                <div key={name} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#6b5668]">{name}</span>
                  <SmallTag className="bg-[#ffe7ef] text-[#ea4f93]">Upload Needed</SmallTag>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
            >
              Bulk Upload Assets
            </button>
          </section>

          <section className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
            <h3 className="text-sm font-extrabold text-[#432744]">Popular Tags</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {POPULAR_TAGS.map(([tag, tone]) => (
                <SmallTag key={tag} className={tone}>
                  {tag}
                </SmallTag>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.08)]">
            <h3 className="text-sm font-extrabold text-[#432744]">Seasonal Suggestions</h3>
            <div className="mt-4 space-y-4">
              {SEASONAL_SUGGESTIONS.map(([name, collection, badge, tone]) => (
                <div key={name} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#432744]">{name}</p>
                    <p className="mt-1 text-[11px] text-[#c694ad]">{collection}</p>
                  </div>
                  <SmallTag className={tone}>{badge}</SmallTag>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
