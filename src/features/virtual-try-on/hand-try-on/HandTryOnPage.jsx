import { useEffect, useState } from "react";
import { Modal } from "antd";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BuilderView } from "./BuilderView";
import { TryOnView } from "./TryOnView";
import { UploadView } from "./UploadView";
import { useHandLandmarkerTask } from "./useHandLandmarkerTask";
import {
  fetchAdminNailVariantDetail,
  fetchAdminNailVariantReferences,
  updateAdminNailVariant,
} from "../../admin/nails-design-management/services/nailDesignManagementService";
import {
  buildColorJsonFromTryOn,
  createVariantNailComponents,
  findShapeId,
  findSurfaceId,
} from "../../admin/nails-design-management/utils/variantTryOnUtils";
import { getAdminNailVariantDetailRoute } from "../../../shared/constants/routes";
import "./tryOn.css";

export function HandTryOnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { designId, variantId: routeVariantId } = useParams();
  const { containerRef, taskHandle } = useHandLandmarkerTask();
  const searchParams = new URLSearchParams(location.search);
  const currentNailVariantId = searchParams.get("nailVariantId");
  const legacyNailSetId = searchParams.get("nailSetId");
  const activeVariantId = currentNailVariantId ?? routeVariantId;
  const currentTryOnId = activeVariantId ?? legacyNailSetId;
  const tryOnMode = searchParams.get("mode");
  const routeState = location.state;
  const [isLoadingTryOn, setIsLoadingTryOn] = useState(
    Boolean(activeVariantId || legacyNailSetId),
  );
  const [initialConfigSignature, setInitialConfigSignature] = useState("");
  const [loadError, setLoadError] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getConfigSignature = () => {
    if (!taskHandle) return "";

    try {
      return JSON.stringify(taskHandle.getSerializedConfig());
    } catch {
      return "";
    }
  };

  const hasUnsavedChanges = () =>
    Boolean(taskHandle && initialConfigSignature && getConfigSignature() !== initialConfigSignature);

  const navigateBackToSource = (options = {}) => {
    if (routeState?.returnTo) {
      navigate(routeState.returnTo, options);
      return;
    }

    if (designId && activeVariantId) {
      navigate(getAdminNailVariantDetailRoute(designId, activeVariantId), options);
      return;
    }

    navigate(-1);
  };

  useEffect(() => {
    const handleTryOnReturn = () => {
      if (routeState?.returnTo) {
        navigate(routeState.returnTo);
        return;
      }

      navigate(-1);
    };

    window.addEventListener("nailify:try-on-return", handleTryOnReturn);
    return () =>
      window.removeEventListener("nailify:try-on-return", handleTryOnReturn);
  }, [navigate, routeState?.returnTo]);

  useEffect(() => {
    if (!taskHandle) return;

    let ignore = false;

    const loadAndStartRequestedMode = async () => {
      setIsLoadingTryOn(
        Boolean(activeVariantId || legacyNailSetId || routeState?.tryOnConfig),
      );
      setLoadError(null);

      try {
        if (routeState?.tryOnConfig) {
          await taskHandle.loadFromConfig(routeState.tryOnConfig);
        } else if (activeVariantId) {
          await taskHandle.loadFromDatabase(activeVariantId);
        } else if (legacyNailSetId) {
          await taskHandle.loadFromDatabase(legacyNailSetId);
        }

        if (ignore) return;
        setInitialConfigSignature(JSON.stringify(taskHandle.getSerializedConfig()));
        if (tryOnMode === "live") {
          taskHandle.startLiveTryOn();
        } else if (tryOnMode === "image") {
          taskHandle.startImageTryOn();
        }
      } catch (requestError) {
        if (ignore) return;
        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load try-on data.",
        );
      } finally {
        if (!ignore) setIsLoadingTryOn(false);
      }
    };

    void loadAndStartRequestedMode();

    return () => {
      ignore = true;
    };
  }, [
    activeVariantId,
    legacyNailSetId,
    routeState?.tryOnConfig,
    taskHandle,
    tryOnMode,
  ]);

  const handleReturnToForm = () => {
    if (hasUnsavedChanges()) {
      setShowLeaveConfirm(true);
      return;
    }

    navigateBackToSource();
  };

  const handleSaveDraft = () => {
    if (!taskHandle) {
      return;
    }

    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    if (!taskHandle) return;

    const nextConfig = taskHandle.getSerializedConfig();

    if (!activeVariantId) {
      if (!routeState?.returnTo) return;

      setInitialConfigSignature(JSON.stringify(nextConfig));
      setShowSaveConfirm(false);
      navigate(routeState.returnTo, {
        state: {
          draftValues: routeState.draftValues,
          pendingImages: taskHandle.getPendingImageFiles(),
          tryOnConfig: nextConfig,
        },
        replace: true,
      });
      return;
    }

    setIsSaving(true);
    setLoadError(null);

    try {
      const [variantDetail, references] = await Promise.all([
        fetchAdminNailVariantDetail(activeVariantId),
        fetchAdminNailVariantReferences(),
      ]);
      const nailShapeId = findShapeId(references.shapes, nextConfig);
      const nailSurfaceId = findSurfaceId(references.surfaces, nextConfig);

      if (!nailShapeId || !nailSurfaceId) {
        throw new Error("Nail shape and surface references are required.");
      }

      await updateAdminNailVariant(activeVariantId, {
        name: variantDetail.name,
        nailShapeId,
        nailSurfaceId,
        nailDesignId: variantDetail.nailDesignId || Number(designId || 0),
        imageUrl: variantDetail.imageUrl,
        colorJson: buildColorJsonFromTryOn(nextConfig),
      });
      await createVariantNailComponents(activeVariantId, nextConfig);

      setInitialConfigSignature(JSON.stringify(nextConfig));
      setShowSaveConfirm(false);
      toast.success("Saved try-on changes.");
      navigateBackToSource({ replace: true });
    } catch (saveError) {
      setLoadError(saveError instanceof Error ? saveError.message : "Failed to save try-on changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    navigateBackToSource();
  };

  const handleLegacyDraftReturn = () => {
    if (!taskHandle || !routeState?.returnTo) {
      return;
    }

    navigate(routeState.returnTo, {
      state: {
        draftValues: routeState.draftValues,
        pendingImages: taskHandle.getPendingImageFiles(),
        tryOnConfig: taskHandle.getSerializedConfig(),
      },
      replace: true,
    });
  };

  return (
    <div className="app-container">
      {isLoadingTryOn || loadError ? (
        <div className="dashboard-page">
          <section
            className={
              loadError
                ? "dashboard-shell dashboard-alert"
                : "dashboard-shell dashboard-empty"
            }
          >
            {loadError ?? "Loading try-on setup..."}
          </section>
        </div>
      ) : null}
      <main
        ref={containerRef}
        className="main-content"
        style={
          isLoadingTryOn || loadError
            ? { height: 0, overflow: "hidden", visibility: "hidden" }
            : undefined
        }
      >
        <div className="task-container" id="hand-landmarker-root">
          <div id="model-selector-container" style={{ display: "none" }} />
          <div id="view-mode-toggle" style={{ display: "none" }} />

          <BuilderView
            currentNailSetId={currentTryOnId}
            handLandmarkerTask={taskHandle}
            onReturnToForm={handleReturnToForm}
            onSaveDraft={handleSaveDraft}
          />

          <UploadView />
          <TryOnView
            currentNailSetId={currentTryOnId}
            handLandmarkerTask={taskHandle}
            onReturnToForm={handleReturnToForm}
            onSaveDraft={handleLegacyDraftReturn}
          />
        </div>
      </main>
      <Modal
        open={showSaveConfirm}
        title="Do you want to save changes?"
        okText={isSaving ? "Saving..." : "Yes"}
        cancelText="Cancel"
        onOk={() => void confirmSave()}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        confirmLoading={isSaving}
        maskClosable={!isSaving}
        keyboard={!isSaving}
      >
        <p>Pressing Yes will update this nail variant try-on setup right away.</p>
      </Modal>
      <Modal
        open={showLeaveConfirm}
        title="There are unsaved changes"
        okText="Leave"
        cancelText="Stay"
        onOk={confirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      >
        <p>Do you want to leave without saving?</p>
      </Modal>
    </div>
  );
}
