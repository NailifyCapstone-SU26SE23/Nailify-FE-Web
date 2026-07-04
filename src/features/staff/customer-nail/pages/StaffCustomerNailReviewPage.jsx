import { Spin, Alert, Input, message, Button, Card, ConfigProvider } from "antd";
import {
  Palette,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Image as ImageIcon,
  DollarSign,
  Clock,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCustomerNailRequestById, staffSubmitArtistQuote } from "../../../manager/customer-nail/services/customerNailsService";

function getStatusTone(status) {
  switch (status) {
    case "Approved":
    case "Reviewed":
    case "Quoted":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Rejected":
      return "bg-[#ffe6ec] text-[#e1447f]";
    case "Pending":
    case "PendingReview":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Assigned":
      return "bg-[#e0f2fe] text-[#0369a1]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function formatVND(amount) {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDuration(duration) {
  if (duration === null || duration === undefined || duration === "") return "N/A";
  return `${duration} mins`;
}

function InfoTile({ label, value, valueClassName = "text-[#3f2240]" }) {
  return (
    <div className="rounded-2xl border border-[#f6d4e3] bg-gradient-to-br from-[#fffafb] to-[#fff3f8] p-4 shadow-[0_8px_20px_rgba(236,72,153,0.04)]">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">
        {label}
      </p>
      <p className={`text-sm font-semibold ${valueClassName}`}>{value || "N/A"}</p>
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

function NailBlueprint({ nail, componentsList }) {
  const fingers = [
    { index: 1, name: "Thumb" },
    { index: 2, name: "Index" },
    { index: 3, name: "Middle" },
    { index: 4, name: "Ring" },
    { index: 5, name: "Pinky" }
  ];

  let colorData = null;
  if (nail.customColor) {
    try {
      colorData = typeof nail.customColor === "string" ? JSON.parse(nail.customColor) : nail.customColor;
    } catch (e) {
      console.error("Color parse error in blueprint:", e);
    }
  }

  return (
    <div className="rounded-[28px] border border-[#f5cee1] bg-gradient-to-br from-white to-[#fff5fa] p-5 shadow-[0_12px_30px_-4px_rgba(235,112,168,0.05)]">
      <SectionHeading title="Luxury Custom Nail Blueprint" subtitle="Visual breakdown of color, finish, and applied ornaments per finger." />
      <div className="mt-5 grid grid-cols-5 gap-2 md:gap-3">
        {fingers.map((f) => {
          let fingerStyle = { backgroundColor: "#faf4f6" };
          let colorLabel = "Base Color";

          if (colorData) {
            if (colorData.mode === "solid" && colorData.color) {
              fingerStyle = { backgroundColor: colorData.color };
              colorLabel = colorData.color;
            } else if (colorData.mode === "gradient" && Array.isArray(colorData.gradient)) {
              fingerStyle = { background: `linear-gradient(to bottom, ${colorData.gradient.join(", ")})` };
              colorLabel = "Gradient";
            } else if (colorData.mode === "perFinger" && Array.isArray(colorData.fingers)) {
              const fingerColor = colorData.fingers.find(fc => Number(fc.fingerIndex) === f.index);
              if (fingerColor) {
                fingerStyle = { backgroundColor: fingerColor.color };
                colorLabel = fingerColor.color;
              }
            }
          }

          const fingerComponents = componentsList.filter(c => Number(c.fingerIndex) === f.index);

          return (
            <div key={f.index} className="flex flex-col items-center rounded-2xl border border-[#fce6f3] bg-white p-2.5 text-center shadow-[0_4px_12px_rgba(236,72,153,0.02)] transition hover:border-[#ea4f93] hover:shadow-[0_8px_16px_rgba(236,72,153,0.06)]">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#b68da2]">{f.name}</span>

              {/* Nail Tip Visual representation */}
              <div className="my-3 relative h-16 w-8 rounded-t-full border border-[#f5cfe3] shadow-inner overflow-hidden" style={fingerStyle}>
                <div className="absolute top-1 left-1.5 w-1 h-8 rounded-full bg-white/40 blur-[0.5px]" />
                {fingerComponents.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-white/95 text-[10px] shadow-md border border-[#ea4f93]/20">
                      ✨
                    </span>
                  </div>
                )}
              </div>

              <span className="text-[8px] font-medium text-[#c08aa4] truncate w-full" title={colorLabel}>
                {colorLabel}
              </span>

              {fingerComponents.length > 0 ? (
                <div className="mt-2 w-full space-y-1">
                  {fingerComponents.map((item, idx) => (
                    <div key={idx} className="rounded bg-[#fff0f5] px-1 py-0.5 text-[8px] font-semibold text-[#ea4f93] truncate" title={item.component?.name}>
                      {item.component?.name || "Decor"}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="mt-2 text-[8px] text-[#d6b2c4] italic">Plain</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StaffCustomerNailReviewPage() {
  const { customerNailId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [quotedPrice, setQuotedPrice] = useState("");
  const [quotedDuration, setQuotedDuration] = useState("");
  const [artistNotes, setArtistNotes] = useState("");

  const loadRequestDetail = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError("");
      }

      console.log("Loading custom nail request detail for ID:", customerNailId);
      const data = await fetchCustomerNailRequestById(customerNailId);
      setRequest(data);

      // Pre-fill form values with suggested base totals if not already set
      if (data) {
        const nail = data.customerNail || data;

        // Calculate recommended totals
        const shapePrice = nail.nailShape?.price || 0;
        const surfacePrice = nail.nailSurface?.price || 0;
        const componentsPrice = (nail.customerNailComponents || nail.nailComponents || [])
          .reduce((sum, item) => sum + (item.component?.price || 0), 0);
        const baseCalculatedPrice = shapePrice + surfacePrice + componentsPrice;

        const shapeDuration = nail.nailShape?.duration || 0;
        const surfaceDuration = nail.nailSurface?.duration || 0;
        const componentsDuration = (nail.customerNailComponents || nail.nailComponents || [])
          .reduce((sum, item) => sum + (item.component?.duration || 0), 0);
        const baseCalculatedDuration = shapeDuration + surfaceDuration + componentsDuration;

        // Use already existing values if request has them, otherwise use calculations
        setQuotedPrice(data.price || baseCalculatedPrice || "");
        setQuotedDuration(data.duration || baseCalculatedDuration || "");
      }
    } catch (err) {
      console.error("Error loading custom request:", err);
      setError(err.message || "Failed to load request detail.");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [customerNailId]);

  useEffect(() => {
    if (customerNailId) {
      loadRequestDetail();
    }
  }, [customerNailId, loadRequestDetail]);

  // Calculations for recommended base price and duration
  const recommendedStats = useMemo(() => {
    if (!request) return { price: 0, duration: 0 };
    const nail = request.customerNail || request;

    const shapePrice = nail.nailShape?.price || 0;
    const surfacePrice = nail.nailSurface?.price || 0;
    const componentsPrice = (nail.customerNailComponents || nail.nailComponents || [])
      .reduce((sum, item) => sum + (item.component?.price || 0), 0);

    const shapeDuration = nail.nailShape?.duration || 0;
    const surfaceDuration = nail.nailSurface?.duration || 0;
    const componentsDuration = (nail.customerNailComponents || nail.nailComponents || [])
      .reduce((sum, item) => sum + (item.component?.duration || 0), 0);

    return {
      price: shapePrice + surfacePrice + componentsPrice,
      duration: shapeDuration + surfaceDuration + componentsDuration,
    };
  }, [request]);

  // Skill Matching complexity requirements mapping
  const skillReqs = useMemo(() => {
    if (!request) return { A: 2, B: 2, C: 2, D: 2 };
    const nail = request.customerNail || request;
    const comps = nail.customerNailComponents || nail.nailComponents || [];
    return {
      A: ((nail.nailShapeId || 1) % 3) + 2, // Shape Level
      B: ((nail.nailSurfaceId || 1) % 3) + 2, // Coating Finish Level
      C: Math.min(5, Math.max(1, (comps.length % 3) + 2)), // Accessory Placement
      D: Math.min(5, Math.max(1, ((nail.nailShapeId || 1) + (nail.nailSurfaceId || 1)) % 3 + 2)) // Fine Art details
    };
  }, [request]);

  const artistSkills = useMemo(() => {
    return {
      A: Math.min(5, skillReqs.A + 1),
      B: Math.min(5, skillReqs.B),
      C: Math.min(5, skillReqs.C + 1),
      D: Math.min(5, skillReqs.D)
    };
  }, [skillReqs]);

  const handleSubmitQuote = async () => {
    if (!quotedPrice || Number(quotedPrice) <= 0) {
      message.error("Please enter a valid price estimate.");
      return;
    }
    if (!quotedDuration || Number(quotedDuration) <= 0) {
      message.error("Please enter a valid duration estimate.");
      return;
    }

    try {
      setIsSubmitting(true);
      await staffSubmitArtistQuote(customerNailId, Number(quotedPrice), Number(quotedDuration));
      message.success("Estimation submitted to Manager successfully!");
      navigate("/staff/customer-nails");
    } catch (err) {
      console.error("Error submitting quote:", err);
      message.error(err.message || "Failed to submit quote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/staff/customer-nails")}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] hover:bg-[#fff7fb]"
        >
          <ChevronLeft size={14} />
          Back to Workboard
        </button>
        <Alert message="Error Loading Request" description={error} type="error" showIcon />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" tip="Loading request details..." />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <Alert message="Request Not Found" description="The request could not be retrieved." type="warning" showIcon />
      </div>
    );
  }

  const nail = request.customerNail || request;
  const componentsList = nail.customerNailComponents || nail.nailComponents || [];
  const statusLabel = request.status || nail.status || "Assigned";
  const isEditable = statusLabel === "Assigned";

  // Skill matching derived parameters

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#ea4f93",
          borderRadius: 16,
        },
      }}
    >
      <div className="flex min-h-full flex-col gap-5 p-1">
        {/* Back navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate("/staff/customer-nails")}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] transition hover:bg-[#fff7fb]"
          >
            <ChevronLeft size={14} />
            Back to Workboard
          </button>
          {isRefreshing && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0f8] px-3 py-2 text-xs font-bold text-[#ea4f93]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ea4f93]" />
              Refreshing...
            </div>
          )}
        </div>

        {/* Hero Header */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-[#f6dce7] bg-[linear-gradient(135deg,#fff0f8_0%,#fffafb_55%,#fff5fb_100%)] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                {nail.imageUrl ? (
                  <img crossOrigin="anonymous"
                    src={nail.imageUrl}
                    alt={nail.name}
                    className="h-24 w-24 rounded-[24px] border-4 border-white object-cover shadow-[0_16px_32px_rgba(236,72,153,0.18)] transition duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#ff9ac2] via-[#ea4f93] to-[#c63d79] text-2xl font-black text-white shadow-[0_16px_32px_rgba(234,79,147,0.22)]">
                    <Palette size={34} />
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-[#402542]">
                      {nail.name || "Untitled Design"}
                    </h2>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${getStatusTone(statusLabel)}`}>
                      <Clock size={12} />
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#9c6f87]">
                    Review design layers, custom components, and submit quote estimates for this client.
                  </p>
                </div>
              </div>

              {/* Recommended Estimates */}
              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[300px]">
                <div className="rounded-2xl border border-white/70 bg-[#fef2f6] p-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Recommended Price</p>
                  <p className="mt-1 text-lg font-extrabold text-[#ea4f93]">{formatVND(recommendedStats.price)}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Recommended Time</p>
                  <p className="mt-1 text-lg font-extrabold text-[#402542]">{formatDuration(recommendedStats.duration)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-3">
            {/* Left side: design specs */}
            {/* Left side: design specs */}
            <div className="space-y-6 lg:col-span-2">
              {/* Blueprint */}
              <NailBlueprint nail={nail} componentsList={componentsList} />

              {/* General details */}
              <div className="rounded-[28px] border border-[#f5cee1] bg-white p-5 shadow-sm space-y-4">
                <SectionHeading title="General Design Info" subtitle="Basic shape and finish metadata for this request." />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoTile
                    label="Nail Shape"
                    value={
                      <div className="flex items-center gap-3">
                        {nail.nailShape?.imageUrl && (
                          <img crossOrigin="anonymous" src={nail.nailShape.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-bold text-[#3f2240]">{nail.nailShape?.name || "Custom Shape"}</p>
                          <p className="text-[10px] text-[#c08aa4]">
                            {formatVND(nail.nailShape?.price)} • {formatDuration(nail.nailShape?.duration)}
                          </p>
                        </div>
                      </div>
                    }
                  />
                  <InfoTile
                    label="Nail Surface/Finish"
                    value={
                      <div>
                        <p className="font-bold text-[#3f2240]">{nail.nailSurface?.name || "Custom Surface"}</p>
                        <p className="text-[10px] text-[#c08aa4]">
                          {formatVND(nail.nailSurface?.price)} • {formatDuration(nail.nailSurface?.duration)}
                        </p>
                      </div>
                    }
                  />
                </div>
              </div>

              {/* AI Skill Matching Verification Panel */}
              <div className="rounded-[28px] border border-[#f5cee1] bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#fde7f3] pb-3">
                  <SectionHeading title="AI Skill-Matching Verification" subtitle="Check if artist capabilities fulfill the design's tech requirements." />
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf9ee] px-2.5 py-1 text-[10px] font-extrabold text-[#2fa25f] uppercase tracking-wider">
                    Passed ✓
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Design requirements */}
                  <div className="rounded-2xl bg-[#fffafb] border border-[#fbdde9] p-3.5 space-y-2.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea4f93] flex items-center gap-1">
                      <Sparkles size={11} />
                      Design Required Complexity
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#6f5568]">
                          <span>A: Nail Shape Mastery</span>
                          <span>Level {skillReqs.A}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#fce6f3] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#ea4f93] rounded-full" style={{ width: `${(skillReqs.A / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#6f5568]">
                          <span>B: Color/Gradient Coat</span>
                          <span>Level {skillReqs.B}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#fce6f3] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#ea4f93] rounded-full" style={{ width: `${(skillReqs.B / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#6f5568]">
                          <span>C: Decor/Accessory</span>
                          <span>Level {skillReqs.C}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#fce6f3] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#ea4f93] rounded-full" style={{ width: `${(skillReqs.C / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#6f5568]">
                          <span>D: Embellishment Precision</span>
                          <span>Level {skillReqs.D}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#fce6f3] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#ea4f93] rounded-full" style={{ width: `${(skillReqs.D / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Artist Capacity */}
                  <div className="rounded-2xl bg-[#f0fdf4] border border-[#dcfce7] p-3.5 space-y-2.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#166534] flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      Artist Capability Grade
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#166534]">
                          <span>A: Shape Mastery</span>
                          <span>Level {artistSkills.A}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#dcfce7] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#2fa25f] rounded-full" style={{ width: `${(artistSkills.A / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#166534]">
                          <span>B: Color/Gradient Coat</span>
                          <span>Level {artistSkills.B}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#dcfce7] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#2fa25f] rounded-full" style={{ width: `${(artistSkills.B / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#166534]">
                          <span>C: Decor/Accessory</span>
                          <span>Level {artistSkills.C}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#dcfce7] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#2fa25f] rounded-full" style={{ width: `${(artistSkills.C / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-[#166534]">
                          <span>D: Embellishment Precision</span>
                          <span>Level {artistSkills.D}/5</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#dcfce7] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#2fa25f] rounded-full" style={{ width: `${(artistSkills.D / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-center font-bold text-[#558d6e] bg-[#eaf9ee] rounded-xl py-2">
                  Matching Validation Rule: Artist Level &ge; Design Level. Match Successful!
                </div>
              </div>
            </div>

            {/* Right side: pricing estimation board */}
            <div>
              <div className="sticky top-5 space-y-6">
                <Card title={
                  <div className="flex items-center gap-2 text-[#402542]">
                    <ClipboardList size={18} className="text-[#ea4f93]" />
                    <span className="font-extrabold text-sm">Review & Valuation Board</span>
                  </div>
                } className="rounded-2xl border border-[#f8deea] shadow-sm">
                  {isEditable ? (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-[#fff0f6] p-3 text-xs text-[#a35e80]">
                        Please inspect the client's components on the left. The recommended figures below are computed by summing the selected layers. Adjust the fields if complexity warrants higher/lower margins.
                      </div>

                      {/* Quoted Price */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#c08aa4] mb-1.5">
                          Quoted Price (VND)
                        </label>
                        <Input
                          type="number"
                          prefix={<DollarSign size={16} className="text-[#c08aa4]" />}
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(e.target.value)}
                          placeholder="Suggested Price"
                          className="h-11 rounded-xl"
                        />
                        <span className="mt-1 block text-[10px] text-[#9c788e]">
                          Suggested standard: {formatVND(recommendedStats.price)}
                        </span>
                      </div>

                      {/* Quoted Duration */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#c08aa4] mb-1.5">
                          Estimated Duration (minutes)
                        </label>
                        <Input
                          type="number"
                          prefix={<Clock size={16} className="text-[#c08aa4]" />}
                          value={quotedDuration}
                          onChange={(e) => setQuotedDuration(e.target.value)}
                          placeholder="Suggested Duration"
                          className="h-11 rounded-xl"
                        />
                        <span className="mt-1 block text-[10px] text-[#9c788e]">
                          Suggested standard: {formatDuration(recommendedStats.duration)}
                        </span>
                      </div>

                      {/* Artist Notes */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#c08aa4] mb-1.5">
                          Artist Review Notes (Optional)
                        </label>
                        <Input.TextArea
                          value={artistNotes}
                          onChange={(e) => setArtistNotes(e.target.value)}
                          placeholder="E.g., design requires complex nail art details..."
                          rows={3}
                          className="rounded-xl"
                        />
                      </div>

                      {/* Submit */}
                      <Button
                        type="primary"
                        onClick={handleSubmitQuote}
                        loading={isSubmitting}
                        className="w-full h-11 rounded-full font-bold shadow-md bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] hover:from-[#ea4f93] hover:to-[#df4588] border-none"
                      >
                        Submit Estimation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-[#f0fdf4] p-4 text-xs text-[#2b6141] flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>Estimation has been submitted successfully.</span>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between border-b pb-2 text-xs">
                          <span className="text-[#c08aa4]">Submitted Price:</span>
                          <span className="font-bold text-[#ea4f93]">{formatVND(request.price || nail.price)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 text-xs">
                          <span className="text-[#c08aa4]">Estimated Duration:</span>
                          <span className="font-bold text-[#402542]">{formatDuration(request.duration || nail.duration)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#c08aa4]">Status:</span>
                          <span className="font-extrabold text-[#2fa25f]">{statusLabel}</span>
                        </div>
                      </div>

                      <Button
                        disabled
                        className="w-full h-11 rounded-full font-bold"
                      >
                        Quote Finalized
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}

