import { Spin, Alert, Modal, Input, message } from "antd";
import {
  Palette,
  Heart,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchCustomerNailById, approveCustomerNail, rejectCustomerNail, fetchSalonStaff, assignReviewer, managerApproveQuote, managerReject } from "../services/customerNailsService";

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[18px] border border-[#f8deea] bg-white p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

function getStatusTone(status) {
  switch (status) {
    case "Approved":
    case "Reviewed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Rejected":
      return "bg-[#ffe6ec] text-[#e1447f]";
    case "Pending":
    case "PendingReview":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Draft":
      return "bg-[#f3f4f6] text-[#6b7280]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatVND(amount) {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function CustomerNailDetailPage() {
  const { customerNailId } = useParams();
  const navigate = useNavigate();
  const [nail, setNail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // 'auth', 'notfound', 'network', 'unknown'
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [finalPrice, setFinalPrice] = useState('');
  const [finalDuration, setFinalDuration] = useState('');

  useEffect(() => {
    if (customerNailId) {
      loadCustomerNailDetail();
    }
  }, [customerNailId]);

  const loadCustomerNailDetail = async () => {
    try {
      setIsLoading(true);
      setError("");
      setErrorType("");

      console.log("[Page] Loading nail detail for ID:", customerNailId);
      const data = await fetchCustomerNailById(customerNailId);

      console.log("[Page] Successfully loaded:", data);
      setNail(data);

      // Nếu có approvedArtistId, fetch thông tin staff được assign
      if (data?.approvedArtistId) {
        try {
          const salonId = "484c3aef-3ae1-4ad6-8aba-6b0bc6df586d"; // TODO: Lấy từ context/param
          const staffList = await fetchSalonStaff(salonId);
          const assignedStaff = staffList.find(
            (staff) => staff.staffId === data.approvedArtistId
          );
          if (assignedStaff) {
            setNail((prev) => ({
              ...prev,
              assignedStaff: assignedStaff,
            }));
          }
        } catch (err) {
          console.error("[Page] Error loading assigned staff:", err);
          // Không throw error, chỉ log vì đây là optional
        }
      }
    } catch (err) {
      console.error("[Page] Error loading nail:", err);

      const errorMessage = err.message || "Failed to load customer nail detail.";

      // Determine error type for better UX
      if (
        errorMessage.includes("Token") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("đăng nhập")
      ) {
        setErrorType("auth");
        setError("Token không hợp lệ! Vui lòng đăng nhập lại.");
      } else if (errorMessage.includes("not found")) {
        setErrorType("notfound");
        setError(`Customer nail "${customerNailId}" không tồn tại.`);
      } else if (
        errorMessage.includes("connect") ||
        errorMessage.includes("network")
      ) {
        setErrorType("network");
        setError("Không thể kết nối đến server. Kiểm tra kết nối internet.");
      } else {
        setErrorType("unknown");
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await approveCustomerNail(customerNailId);
      message.success("Customer nail approved successfully!");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error approving nail:", err);
      message.error(err.message || "Failed to approve customer nail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.error("Please enter a reject reason.");
      return;
    }
    try {
      setIsSubmitting(true);
      await rejectCustomerNail(customerNailId, rejectReason.trim());
      message.success("Customer nail rejected successfully!");
      setIsRejectModalOpen(false);
      setRejectReason("");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error rejecting nail:", err);
      message.error(err.message || "Failed to reject customer nail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAssignModal = async () => {
    try {
      setIsLoadingStaff(true);
      setIsAssignModalOpen(true);
      setSelectedStaff(null);
      const staff = await fetchSalonStaff("484c3aef-3ae1-4ad6-8aba-6b0bc6df586d");
      setStaffList(staff);
    } catch (err) {
      console.error("[Page] Error loading salon staff:", err);
      message.error(err.message || "Failed to load salon staff.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedStaff) {
      message.error("Please select a staff member.");
      return;
    }
    try {
      setIsSubmitting(true);
      await assignReviewer(customerNailId, selectedStaff.staffId);
      message.success("Staff assigned successfully!");
      setIsAssignModalOpen(false);
      setSelectedStaff(null);
      // Update nail object with assigned staff
      setNail((prev) => ({
        ...prev,
        status: "Assigned",
        assignedStaff: selectedStaff,
        approvedArtistId: selectedStaff.staffId,
      }));
    } catch (err) {
      console.error("[Page] Error assigning reviewer:", err);
      message.error(err.message || "Failed to assign staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerApproveQuote = async () => {
    if (!finalPrice) {
      message.error("Please enter a final price.");
      return;
    }
    try {
      setIsSubmitting(true);
      await managerApproveQuote(customerNailId, parseFloat(finalPrice), parseFloat(finalDuration) || 0);
      message.success("Quote approved successfully!");
      setIsApproveModalOpen(false);
      setFinalPrice("");
      setFinalDuration("");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error approving quote:", err);
      message.error(err.message || "Failed to approve quote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerReject = async () => {
    if (!rejectReason.trim()) {
      message.error("Please enter a reject reason.");
      return;
    }
    try {
      setIsSubmitting(true);
      await managerReject(customerNailId, rejectReason.trim());
      message.success("Customer nail rejected successfully!");
      setIsRejectModalOpen(false);
      setRejectReason("");
      await loadCustomerNailDetail();
    } catch (err) {
      console.error("[Page] Error rejecting customer nail:", err);
      message.error(err.message || "Failed to reject customer nail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error states
  if (error) {
    return (
      <div className="flex min-h-full flex-col gap-4">
        <button
          onClick={() => navigate(ROUTES.managerCustomerNails)}
          className="inline-flex items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] transition hover:bg-[#fff7fb] w-fit"
        >
          <ChevronLeft size={14} />
          Back to Customer Nails
        </button>

        <div className="min-h-full">
          <Alert
            message={
              errorType === "auth"
                ? "Session Expired"
                : errorType === "notfound"
                ? "Not Found"
                : errorType === "network"
                ? "Connection Error"
                : "Error Loading Customer Nail Detail"
            }
            description={error}
            type={
              errorType === "auth"
                ? "warning"
                : errorType === "network"
                ? "error"
                : "error"
            }
            showIcon
            icon={
              errorType === "auth" ? (
                <AlertTriangle size={20} />
              ) : undefined
            }
            action={
              errorType === "auth" ? (
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="text-xs font-semibold text-[#ea4f93] hover:underline"
                >
                  Go to Login
                </button>
              ) : (
                <button
                  onClick={loadCustomerNailDetail}
                  className="text-xs font-semibold text-[#ea4f93] hover:underline"
                >
                  Retry
                </button>
              )
            }
          />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spin size="large" tip="Loading customer nail detail..." />
      </div>
    );
  }

  // No data state
  if (!nail) {
    return (
      <div className="flex min-h-full flex-col gap-4">
        <button
          onClick={() => navigate(ROUTES.managerCustomerNails)}
          className="inline-flex items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] transition hover:bg-[#fff7fb] w-fit"
        >
          <ChevronLeft size={14} />
          Back to Customer Nails
        </button>

        <Alert
          message="No Data"
          description="Customer nail data is empty"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(ROUTES.managerCustomerNails)}
        className="inline-flex items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.1)] transition hover:bg-[#fff7fb] w-fit"
      >
        <ChevronLeft size={14} />
        Back to Customer Nails
      </button>

      <Card className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#fff0f8] to-[#fffafb] border-b border-[#f6dce7] p-5">
          <div className="flex items-center gap-4">
            {nail?.imageUrl ? (
              <img
                src={nail.imageUrl}
                alt={nail.name}
                className="h-20 w-20 rounded-[20px] object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-2xl font-black text-white shadow-lg">
                <Palette size={32} />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-extrabold text-[#402542]">
                {nail?.name || "Untitled Design"}
              </h2>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${getStatusTone(
                    nail?.status
                  )}`}
                >
                  {nail?.status === "Approved" ? (
                    <CheckCircle2 size={14} />
                  ) : nail?.status === "Rejected" ? (
                    <XCircle size={14} />
                  ) : (
                    <Calendar size={14} />
                  )}
                  {nail?.status || "Draft"}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${nail?.basedOnNailVariantId !== null ? "bg-[#e7ecff] text-[#4755b8]" : "bg-[#fef3c7] text-[#d97706]"}`}>
                  {nail?.basedOnNailVariantId !== null ? "Preset" : "Custom Design"}
                </span>
                {nail?.isFavorite && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#ea4f93]">
                    <Heart size={14} fill="currentColor" />
                    Favorite
                  </div>
                )}
                {nail?.isPublic && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#6b7280]">
                    <Eye size={14} />
                    Public
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Basic Info */}
          <SectionHeading title="Design Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">
                Nail Shape
              </p>
              <p className="text-sm font-semibold text-[#3f2240]">
                {nail?.nailShape?.name || "Custom Shape"}
              </p>
            </div>
            <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">
                Nail Surface
              </p>
              <p className="text-sm font-semibold text-[#3f2240]">
                {nail?.nailSurface?.name || "Custom Surface"}
              </p>
            </div>
            <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">
                Price
              </p>
              <p className="text-sm font-semibold text-[#3f2240]">
                {formatVND(nail?.price)}
              </p>
            </div>
            <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">
                Created At
              </p>
              <p className="text-sm font-semibold text-[#3f2240]">
                {formatDate(nail?.createdAt)}
              </p>
            </div>
          </div>

          {/* Custom Color */}
          {nail?.customColor && (
            <>
              <SectionHeading title="Custom Color" />
              <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    try {
                      const colorData =
                        typeof nail.customColor === "string"
                          ? JSON.parse(nail.customColor)
                          : nail.customColor;

                      if (colorData?.mode === "solid" && colorData?.color) {
                        return (
                          <>
                            <div
                              className="h-12 w-12 rounded-[12px] border-2 border-white shadow-md"
                              style={{ backgroundColor: colorData.color }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-[#3f2240]">
                                Solid Color
                              </p>
                              <p className="text-xs text-[#c08aa4]">
                                {colorData.color}
                              </p>
                            </div>
                          </>
                        );
                      } else if (
                        colorData?.mode === "gradient" &&
                        colorData?.gradient
                      ) {
                        return (
                          <>
                            <div
                              className="h-12 w-12 rounded-[12px] border-2 border-white shadow-md"
                              style={{
                                background: `linear-gradient(to right, ${colorData.gradient.join(
                                  ", "
                                )})`,
                              }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-[#3f2240]">
                                Gradient Color
                              </p>
                              <p className="text-xs text-[#c08aa4]">
                                {colorData.gradient.join(" → ")}
                              </p>
                            </div>
                          </>
                        );
                      } else if (
                        colorData?.mode === "perFinger" &&
                        Array.isArray(colorData?.fingers)
                      ) {
                        return (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {colorData.fingers.map((finger, index) => (
                                <div key={finger.fingerIndex || index} className="flex flex-col items-center gap-1">
                                  <div
                                    className="h-8 w-6 rounded-[8px] border-2 border-white shadow-md"
                                    style={{ backgroundColor: finger.color || "#ccc" }}
                                  />
                                  <span className="text-[10px] font-bold text-[#c08aa4]">
                                    {finger.fingerIndex}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#3f2240]">
                                Per-Finger Color
                              </p>
                              <p className="text-xs text-[#c08aa4]">
                                {colorData.fingers.length} fingers
                              </p>
                            </div>
                          </>
                        );
                      }
                    } catch (e) {
                      console.error("Failed to parse custom color:", e);
                    }

                    return (
                      <div className="flex items-center gap-2 text-xs text-[#c08aa4]">
                        <ImageIcon size={12} />
                        <span>Color configuration unavailable</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {/* Reject Reason */}
          {nail?.rejectReason && (
            <>
              <SectionHeading title="Reject Reason" />
              <div className="rounded-xl border border-[#e1447f] bg-[#ffe6ec] p-4">
                <p className="text-sm text-[#e1447f]">{nail.rejectReason}</p>
              </div>
            </>
          )}

          {/* Approve/Reject Buttons - Only show when status is PendingReview */}
          {nail?.status === "PendingReview" && (
            <>
              <SectionHeading title="Review Actions" />
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full bg-[#2fa25f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2a9255] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full bg-[#e1447f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#d63e75] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </>
          )}

          {/* Assigned Staff Info - Show if staff already assigned */}
          {nail?.status === "Assigned" && nail?.assignedStaff && (
            <>
              <SectionHeading title="Assigned Staff" />
              <div className="rounded-xl border border-[#a8d5ba] bg-[#eaf9ee] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a8d5ba] to-[#2fa25f] text-lg font-bold text-white">
                    {nail.assignedStaff.firstName?.[0]}{nail.assignedStaff.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2fa25f]">
                      {nail.assignedStaff.firstName} {nail.assignedStaff.lastName}
                    </p>
                    <p className="text-xs text-[#2d8a5f]">{nail.assignedStaff.email}</p>
                    {nail.assignedStaff.role && (
                      <p className="text-xs text-[#2d8a5f]">{nail.assignedStaff.role}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Assign Staff Button - Only show if status is PendingReview and no staff assigned */}
          {nail?.status === "PendingReview" && !nail?.assignedStaff && (
            <>
              <SectionHeading title="Assign Staff" />
              <button
                onClick={handleOpenAssignModal}
                disabled={isSubmitting}
                className="rounded-full bg-[#ea4f93] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#df4588] disabled:opacity-50 w-fit inline-flex items-center gap-2"
              >
                Assign Staff
              </button>
            </>
          )}

          {/* Confirm/Reject Buttons - Only show when status is Reviewed */}
          {nail?.status === "Reviewed" && (
            <>
              <SectionHeading title="Review Actions" />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsApproveModalOpen(true)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full bg-[#2fa25f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2a9255] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Confirm
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full bg-[#e1447f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#d63e75] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Reject Customer Nail"
        open={isRejectModalOpen}
        onOk={nail?.status === "Reviewed" ? handleManagerReject : handleReject}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectReason("");
        }}
        confirmLoading={isSubmitting}
        okText="Reject"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: '#e1447f', color: '#fff' } }}
      >
        <div className="py-4">
          <p className="mb-2 text-sm text-[#402542]">
            Please provide a reason for rejecting this customer nail:
          </p>
          <Input.TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reject reason"
            rows={4}
            className="mt-2"
          />
        </div>
      </Modal>

      {/* Approve Quote Modal */}
      <Modal
        title="Confirm Quote"
        open={isApproveModalOpen}
        onOk={handleManagerApproveQuote}
        onCancel={() => {
          setIsApproveModalOpen(false);
          setFinalPrice("");
          setFinalDuration("");
        }}
        confirmLoading={isSubmitting}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: '#2fa25f', color: '#fff' } }}
      >
        <div className="py-4 space-y-4">
          <p className="text-sm text-[#402542]">
            Please enter the final quote details:
          </p>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-2">
              Final Price
            </p>
            <Input
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder="Enter final price"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-2">
              Final Duration (minutes)
            </p>
            <Input
              type="number"
              value={finalDuration}
              onChange={(e) => setFinalDuration(e.target.value)}
              placeholder="Enter final duration"
            />
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        title="Assign Staff"
        open={isAssignModalOpen}
        onOk={handleAssignReviewer}
        onCancel={() => {
          setIsAssignModalOpen(false);
          setSelectedStaff(null);
        }}
        confirmLoading={isSubmitting}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: '#ea4f93', color: '#fff' } }}
      >
        <div className="py-4">
          {isLoadingStaff ? (
            <div className="flex items-center justify-center py-8">
              <Spin tip="Loading staff..." />
            </div>
          ) : (
            <div className="space-y-2">
              {staffList.length === 0 ? (
                <p className="text-sm text-[#c08aa4]">No staff available.</p>
              ) : (
                staffList.map((staff) => (
                  <div
                    key={staff.staffId}
                    onClick={() => setSelectedStaff(staff)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      selectedStaff?.staffId === staff.staffId
                        ? "border-[#ea4f93] bg-[#fff0f8]"
                        : "border-[#f4c7da] hover:border-[#ea4f93]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#3f2240]">
                      {staff.firstName} {staff.lastName}
                    </p>
                    <p className="text-xs text-[#c08aa4]">{staff.email}</p>
                    {staff.role && (
                      <p className="text-xs text-[#c08aa4]">{staff.role}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
