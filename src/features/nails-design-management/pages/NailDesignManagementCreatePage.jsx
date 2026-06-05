import { Save, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { NailDesignManagementFormFields } from "../components/NailDesignManagementFormFields";
import { NailDesignManagementHeroCard } from "../components/NailDesignManagementHeroCard";
import { NailDesignManagementSnapshotCard } from "../components/NailDesignManagementSnapshotCard";
import { createEmptyNailDesign } from "../services/mockNailDesigns";

export function NailDesignManagementCreatePage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createEmptyNailDesign);

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

  return (
    <section className="flex min-h-full flex-col gap-4">
      <NailDesignManagementHeroCard
        backLabel="Back to design list"
        backTo={ROUTES.adminNailDesigns}
        badge="Nail Design Management"
        title="Create nail design"
        description="Set up a new mock design concept with status, collection, pricing, and merchandising notes from a dedicated admin screen."
        panelIcon={<Sparkles size={18} className="text-[#d45b9f]" />}
        panelTitle="Create mode"
        panelDescription="This page is focused on drafting a new catalog entry, while detail pages stay focused on reviewing and editing an existing design."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <NailDesignManagementFormFields
              formValues={formValues}
              onFieldChange={handleChange}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
            >
              <Save size={16} />
              <span>Create design</span>
            </button>
          </div>
        </article>

        <NailDesignManagementSnapshotCard
          formValues={formValues}
          notice="This is mock CRUD only. Create action updates the UI flow, but it does not persist data outside this screen."
        />
      </div>
    </section>
  );
}
