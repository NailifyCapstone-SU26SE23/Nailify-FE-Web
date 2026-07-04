import { useEffect, useRef, useState } from 'react';
import { setupHandLandmarker, type HandLandmarkerTaskHandle } from '@/features/virtual-try-on/handLandmarkerTask';

export function useHandLandmarkerTask() {
  const containerRef = useRef<HTMLElement | null>(null);
  const [taskHandle, setTaskHandle] = useState<HandLandmarkerTaskHandle | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    let activeTaskHandle: HandLandmarkerTaskHandle | null = null;
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
