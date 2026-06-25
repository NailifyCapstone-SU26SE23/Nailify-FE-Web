import { useEffect } from "react";

export function useClickOutside(ref, handler) {
  useEffect(() => {
    function handleClick(event) {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      handler(event);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [handler, ref]);
}
