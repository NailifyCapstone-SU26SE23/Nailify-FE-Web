import { ArrowLeft, LoaderCircle, Save, Sliders } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { createAdminShapeMethodConfig } from "../services/shapeMethodConfigsManagementService";
import { fetchAdminNailShapes } from "../../nail-shapes-management/services/nailShapesManagementService";

export function ShapeMethodConfigCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nailShapes, setNailShapes] = useState([]);
  const [isLoadingShapes, setIsLoadingShapes] = useState(true);

  const [formValues, setFormValues] = useState({
    name: "",
    nailShapeId: "",
    price: "",
    duration: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAdminNailShapes({ pageNumber: 1, pageSize: 100 })
      .then(res => setNailShapes(res.items))
      .catch(err => toast.error("Failed to load nail shapes"))
      .finally(() => setIsLoadingShapes(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formValues.name.trim()) newErrors.name = "Name is required.";
    if (!formValues.nailShapeId) newErrors.nailShapeId = "Nail shape is required.";
    
    const priceNum = Number(formValues.price);
    if (!formValues.price || isNaN(priceNum) || priceNum < 0) {
      newErrors.price = "Price must be a valid positive number.";
    }

    const durationNum = Number(formValues.duration);
    if (!formValues.duration || isNaN(durationNum) || durationNum <= 0) {
      newErrors.duration = "Duration must be greater than 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Creating shape method config...");

    try {
      await createAdminShapeMethodConfig({
        name: formValues.name.trim(),
        nailShapeId: Number(formValues.nailShapeId),
        price: Number(formValues.price),
        duration: Number(formValues.duration),
      });

      toast.success("Shape method config created successfully.", { id: toastId });
      navigate(ROUTES.adminShapeMethodConfigs, {
        state: { flashMessage: "Config created successfully." },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create config.", { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to={ROUTES.adminShapeMethodConfigs}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#cd98b1] transition-colors hover:text-[#ea4f93]"
      >
        <ArrowLeft size={16} />
        Back to Configs
      </Link>

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-[24px] border border-[#f8dce8] bg-white shadow-[0_12px_32px_rgba(236,72,153,0.05)]">
        <div className="border-b border-[#fdebf3] bg-[#fffafc] px-6 py-6 md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#ffe8f2] text-[#ea4f93] shadow-inner">
              <Sliders size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#432744]">Create Method Config</h1>
              <p className="mt-1 text-sm font-medium text-[#b58a9f]">Add a new configuration for a nail shape method</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-bold text-[#5f4a5c]">
                Method Name <span className="text-[#ea4f93]">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formValues.name}
                onChange={handleChange}
                placeholder="e.g. Gắn móng giả (Tip)"
                className={`h-12 w-full rounded-xl border bg-[#fffafc] px-4 text-[15px] font-medium text-[#432744] shadow-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                    : "border-[#f4dbe7] focus:border-[#ea4f93] focus:ring-[#ea4f93]/10"
                }`}
              />
              {errors.name && <p className="mt-2 text-xs font-semibold text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="nailShapeId" className="mb-2 block text-sm font-bold text-[#5f4a5c]">
                Nail Shape <span className="text-[#ea4f93]">*</span>
              </label>
              <select
                id="nailShapeId"
                name="nailShapeId"
                value={formValues.nailShapeId}
                onChange={handleChange}
                disabled={isLoadingShapes}
                className={`h-12 w-full rounded-xl border bg-[#fffafc] px-4 text-[15px] font-medium text-[#432744] shadow-sm outline-none transition-all focus:bg-white focus:ring-4 disabled:opacity-60 ${
                  errors.nailShapeId
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                    : "border-[#f4dbe7] focus:border-[#ea4f93] focus:ring-[#ea4f93]/10"
                }`}
              >
                <option value="">Select a nail shape...</option>
                {nailShapes.map((shape) => (
                  <option key={shape.nailShapeId} value={shape.nailShapeId}>
                    {shape.name}
                  </option>
                ))}
              </select>
              {errors.nailShapeId && <p className="mt-2 text-xs font-semibold text-red-500">{errors.nailShapeId}</p>}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="mb-2 block text-sm font-bold text-[#5f4a5c]">
                  Price (VND) <span className="text-[#ea4f93]">*</span>
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formValues.price}
                  onChange={handleChange}
                  placeholder="e.g. 250000"
                  className={`h-12 w-full rounded-xl border bg-[#fffafc] px-4 text-[15px] font-medium text-[#432744] shadow-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                    errors.price
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-[#f4dbe7] focus:border-[#ea4f93] focus:ring-[#ea4f93]/10"
                  }`}
                />
                {errors.price && <p className="mt-2 text-xs font-semibold text-red-500">{errors.price}</p>}
              </div>

              <div>
                <label htmlFor="duration" className="mb-2 block text-sm font-bold text-[#5f4a5c]">
                  Duration (Mins) <span className="text-[#ea4f93]">*</span>
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={formValues.duration}
                  onChange={handleChange}
                  placeholder="e.g. 60"
                  className={`h-12 w-full rounded-xl border bg-[#fffafc] px-4 text-[15px] font-medium text-[#432744] shadow-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                    errors.duration
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-[#f4dbe7] focus:border-[#ea4f93] focus:ring-[#ea4f93]/10"
                  }`}
                />
                {errors.duration && <p className="mt-2 text-xs font-semibold text-red-500">{errors.duration}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#fdebf3] bg-[#fffafc] px-6 py-5 md:px-8">
          <Link
            to={ROUTES.adminShapeMethodConfigs}
            className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold text-[#5f4a5c] transition-colors hover:bg-[#fce9f2] hover:text-[#ea4f93]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(236,72,153,0.35)] disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Create Config
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
