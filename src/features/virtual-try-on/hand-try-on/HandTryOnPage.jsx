import { useEffect, useState } from "react";
import { Modal, Spin } from "antd";
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
import { useLanguage } from "../../../shared/hooks/useLanguage";
import "./tryOn.css";

export function HandTryOnPage() {
  const { t, language } = useLanguage();
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
            : t("handTryOn.loadErrorFallback"),
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
    t,
  ]);

  const handleReturnToForm = () => {
    if (hasUnsavedChanges()) {
      setShowLeaveConfirm(true);
      return;
    }
    navigateBackToSource();
  };

  const handleSaveDraft = () => {
    if (!taskHandle) return;
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
        throw new Error(t("handTryOn.shapeSurfaceRequired"));
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
      toast.success(t("handTryOn.saveSuccess"));
      navigateBackToSource({ replace: true });
    } catch (saveError) {
      setLoadError(
        saveError instanceof Error
          ? saveError.message
          : t("handTryOn.saveError"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    navigateBackToSource();
  };

  const handleLegacyDraftReturn = () => {
    if (!taskHandle || !routeState?.returnTo) return;
    navigate(routeState.returnTo, {
      state: {
        draftValues: routeState.draftValues,
        pendingImages: taskHandle.getPendingImageFiles(),
        tryOnConfig: taskHandle.getSerializedConfig(),
      },
      replace: true,
    });
  };

  const isLoading = isLoadingTryOn || Boolean(loadError);

  return (
    <div className="app-container">
      {isLoading ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[linear-gradient(180deg,#fff9fc_0%,#fff2f8_100%)] px-6 py-10">
          <div
            className={`w-full max-w-md rounded-[28px] border p-8 text-center shadow-[0_18px_40px_rgba(236,72,153,0.10)] ${loadError
              ? "border-[#f5c6d8] bg-[linear-gradient(180deg,#fff6fa_0%,#ffeef6_100%)]"
              : "border-[#f6dbe8] bg-[linear-gradient(180deg,#fff9fc_0%,#fff2f8_100%)]"
              }`}
          >
            {loadError ? (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe4ef] text-[#e1447f]">
                  <span className="text-2xl font-bold">!</span>
                </div>
                <h2 className="mt-4 text-lg font-bold text-[#432744]">
                  {t("handTryOn.errorTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#8f6b80]">
                  {loadError}
                </p>
                <button
                  type="button"
                  onClick={() => navigateBackToSource()}
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-[#f4c1d8] bg-white px-5 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_6px_16px_rgba(236,72,153,0.08)] transition hover:bg-[#fff7fb]"
                >
                  {t("handTryOn.backButton")}
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ffe7f2]">
                  <Spin size="large" />
                </div>
                <h2 className="mt-5 text-lg font-bold text-[#432744]">
                  {t("handTryOn.loadingTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#8f6b80]">
                  {t("handTryOn.loadingSubtitle")}
                </p>
                <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-[#ffe7f2]">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-[#ea4f93]" />
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <main
        ref={containerRef}
        className="main-content"
        style={
          isLoading ? { height: 0, overflow: "hidden", visibility: "hidden" } : undefined
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
        title={t("handTryOn.saveConfirmTitle")}
        okText={isSaving ? t("handTryOn.saving") : t("handTryOn.yes")}
        cancelText={t("handTryOn.cancel")}
        onOk={() => void confirmSave()}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        confirmLoading={isSaving}
        maskClosable={!isSaving}
        keyboard={!isSaving}
      >
        <p>{t("handTryOn.saveConfirmBody")}</p>
      </Modal>

      <Modal
        open={showLeaveConfirm}
        title={t("handTryOn.leaveConfirmTitle")}
        okText={t("handTryOn.leave")}
        cancelText={t("handTryOn.stay")}
        onOk={confirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      >
        <p>{t("handTryOn.leaveConfirmBody")}</p>
      </Modal>
    </div>
  );
}