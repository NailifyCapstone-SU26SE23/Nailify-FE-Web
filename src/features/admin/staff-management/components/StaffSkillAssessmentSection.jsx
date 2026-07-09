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
    <article className="rounded-[24px] border border-[#f7cadc] bg-[linear-gradient(180deg,#fff9fc_0%,#fffdfd_100%)] p-5 shadow-[0_12px_26px_rgba(236,72,153,0.05)]">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#cf8aa8]">
        {item.name || item.title}
      </p>
      <p className="mt-1 text-[13px] text-[#c07f9e]">{item.description || item.subtitle || "Specialty skill"}</p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRatingChange(item.id || item.key, value)}
            className="text-[#ea4f93] transition hover:scale-105"
            aria-label={`Set ${item.name || item.title} to ${value} stars`}
          >
            <Star
              size={16}
              fill={value <= normalizedRating ? "currentColor" : "none"}
              className={value <= normalizedRating ? "text-[#ea4f93]" : "text-[#f5c8da]"}
            />
          </button>
        ))}
      </div>

      <div className="mt-5 h-2 rounded-full bg-[#f3d4e3]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#e85ab4_0%,#ff8f7b_52%,#ffd34f_100%)]"
          style={{ width: `${(normalizedRating / 5) * 100}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[12px]">
        <span className="font-black text-[#7b6781]">
          {normalizedRating}★ {SKILL_LEVEL_LABELS[normalizedRating] ?? "Not rated"}
        </span>
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
    <section className="rounded-[28px] bg-white/65 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
      <div className="flex items-start gap-3 rounded-[22px] bg-[linear-gradient(180deg,#fffafc_0%,#fffdfd_100%)] p-4">
        <div className="rounded-[18px] bg-[#fff2f7] p-3 text-[#ea4f93]">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-slate-800">Skills & Specialties</h2>
          <p className="mt-1 text-[12px] text-slate-400">
            Rate each core skill to map the staff member's specialties and current level.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
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
