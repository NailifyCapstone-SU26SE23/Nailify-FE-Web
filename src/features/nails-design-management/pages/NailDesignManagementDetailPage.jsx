import { PencilLine, Save, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { NailDesignManagementFormFields } from "../components/NailDesignManagementFormFields";
import { NailDesignManagementHeroCard } from "../components/NailDesignManagementHeroCard";
import { NailDesignManagementSnapshotCard } from "../components/NailDesignManagementSnapshotCard";
import { getMockNailDesignById } from "../services/mockNailDesigns";

export function NailDesignManagementDetailPage() {
  const navigate = useNavigate();
  const { designId } = useParams();
  const initialDesign = getMockNailDesignById(designId);
  const [formValues, setFormValues] = useState(initialDesign);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  if (!initialDesign) {
    return <Navigate to={ROUTES.adminNailDesigns} replace />;
  }

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    setFlashMessage("Mock update completed. Changes are local to this detail screen.");
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

  const handleDelete = () => {
    navigate(ROUTES.adminNailDesigns, {
      state: {
        flashMessage: `Mock delete completed for ${formValues.name || formValues.id}.`,
      },
    });
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <NailDesignManagementHeroCard
        backLabel="Back to design list"
        backTo={ROUTES.adminNailDesigns}
        badge="Nail Design Management"
        title={formValues.name}
        description="Review the design profile, update catalog fields, or perform a mock delete from this admin detail page."
        panelIcon={<Sparkles size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? "Edit mode" : "View mode"}
        panelDescription="All actions here are UI-only and do not persist outside this feature."
      />

      {flashMessage ? (
        <div className="rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          {flashMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <NailDesignManagementFormFields
              formValues={formValues}
              onFieldChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff5ef] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#ffe9d7] sm:w-auto"
                >
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
              >
                <PencilLine size={16} />
                <span>Edit design</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
            >
              <Trash2 size={16} />
              <span>Delete design</span>
            </button>
          </div>
        </article>

        <NailDesignManagementSnapshotCard
          formValues={formValues}
          notice="This is mock CRUD only. Save and delete actions update the UI flow, but they do not persist data outside this screen."
        />
      </div>
    </section>
  );
}
