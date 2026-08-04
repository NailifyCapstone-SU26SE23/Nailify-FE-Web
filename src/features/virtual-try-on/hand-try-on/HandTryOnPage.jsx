import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BuilderView } from "./BuilderView";
import { TryOnView } from "./TryOnView";
import { UploadView } from "./UploadView";
import { useHandLandmarkerTask } from "./useHandLandmarkerTask";
import "./tryOn.css";

export function HandTryOnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { containerRef, taskHandle } = useHandLandmarkerTask();
  const searchParams = new URLSearchParams(location.search);
  const currentNailVariantId = searchParams.get("nailVariantId");
  const legacyNailSetId = searchParams.get("nailSetId");
  const currentTryOnId = currentNailVariantId ?? legacyNailSetId;
  const tryOnMode = searchParams.get("mode");
  const routeState = location.state;
  const [isLoadingTryOn, setIsLoadingTryOn] = useState(
    Boolean(currentNailVariantId || legacyNailSetId),
  );
  const [loadError, setLoadError] = useState(null);

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
        Boolean(
          currentNailVariantId || legacyNailSetId || routeState?.tryOnConfig,
        ),
      );
      setLoadError(null);

      try {
        if (routeState?.tryOnConfig) {
          await taskHandle.loadFromConfig(routeState.tryOnConfig);
        } else if (currentNailVariantId) {
          await taskHandle.loadFromDatabase(currentNailVariantId);
        } else if (legacyNailSetId) {
          await taskHandle.loadFromDatabase(legacyNailSetId);
        }

        if (ignore) return;
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
    currentNailVariantId,
    legacyNailSetId,
    routeState?.tryOnConfig,
    taskHandle,
    tryOnMode,
  ]);

  const handleReturnToForm = () => {
    navigate(-1);
  };

  const handleSaveDraft = () => {
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
            onSaveDraft={handleSaveDraft}
          />
        </div>
      </main>
    </div>
  );
}
