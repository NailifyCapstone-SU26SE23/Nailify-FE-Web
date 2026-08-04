import { Sparkles, Star } from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";

const SKILL_LEVEL_LABELS = {
  1: "Beginner",
  2: "Foundation",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

function SkillRatingCard({ item, onRatingChange, rating }) {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs hover:border-[#E84F93]/40 transition group">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
            {item.name || item.title}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">{item.description || item.subtitle || "Specialty skill"}</p>
        </div>
        <span className="inline-flex rounded-full bg-pink-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#E84F93] border border-[#F3D6E5]">
          {normalizedRating}★ {SKILL_LEVEL_LABELS[normalizedRating] ?? "Not rated"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRatingChange(item.id || item.key, value)}
            className="p-0.5 text-[#E84F93] transition hover:scale-110 focus:outline-none"
            aria-label={`Set ${item.name || item.title} to ${value} stars`}
          >
            <Star
              size={18}
              fill={value <= normalizedRating ? "currentColor" : "none"}
              className={value <= normalizedRating ? "text-[#E84F93]" : "text-slate-200"}
            />
          </button>
        ))}
      </div>

      <div className="mt-3.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E84F93] via-[#EC4899] to-[#F43F5E] transition-all duration-300"
          style={{ width: `${(normalizedRating / 5) * 100}%` }}
        />
      </div>
    </article>
  );
}

SkillRatingCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    key: PropTypes.string,
    specialty: PropTypes.string,
    description: PropTypes.string,
    subtitle: PropTypes.string,
    name: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
  onRatingChange: PropTypes.func.isRequired,
  rating: PropTypes.number.isRequired,
};

export function StaffSkillAssessmentSection({ onRatingChange, ratings, skillTypes }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 shadow-xs">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-[#E84F93] border border-[#F3D6E5] shrink-0">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 ">Skills & Specialties</h2>
          <p className="text-xs text-slate-500 font-medium">
            Rate each core skill to map the staff member's artisan specialties and level.
          </p>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {skillTypes.map((item) => (
          <SkillRatingCard
            key={item.id}
            item={item}
            rating={Number(ratings[item.id] ?? 0)}
            onRatingChange={onRatingChange}
          />
        ))}
      </div>
    </section>
  );
}

StaffSkillAssessmentSection.propTypes = {
  onRatingChange: PropTypes.func.isRequired,
  ratings: PropTypes.objectOf(PropTypes.number).isRequired,
  specialties: PropTypes.arrayOf(PropTypes.string).isRequired,
  skillTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
};
