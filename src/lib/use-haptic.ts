import { useCallback } from "react";
import { hapticLight, hapticMedium, hapticSuccess } from "./haptic";

export function useHapticClick(fn?: () => void, level: "light" | "medium" | "success" = "light") {
  const hapticMap = { light: hapticLight, medium: hapticMedium, success: hapticSuccess };
  return useCallback(() => {
    hapticMap[level]();
    fn?.();
  }, [fn, level]);
}
