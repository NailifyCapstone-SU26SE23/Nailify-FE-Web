import { useEffect, useRef, useState } from "react";
import { setupHandLandmarker } from "../handLandmarkerTask";

export function useHandLandmarkerTask() {
  const containerRef = useRef(null);
  const [taskHandle, setTaskHandle] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    let activeTaskHandle = null;
    let disposed = false;

    if (container) {
      setupHandLandmarker(container).then((handle) => {
        if (disposed) {
          handle.cleanup();
          return;
        }
        activeTaskHandle = handle;
        setTaskHandle(handle);
      });
    }

    return () => {
      disposed = true;
      activeTaskHandle?.cleanup();
      activeTaskHandle = null;
      setTaskHandle(null);
    };
  }, []);

  return { containerRef, taskHandle };
}
