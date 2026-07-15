import { useCallback } from "react";
import { hapticLight, hapticMedium, hapticSuccess } from "./haptic";

const hapticMap = { light: hapticLight, medium: hapticMedium, success: hapticSuccess };

export function useHapticClick(fn?: () => void, level: "light" | "medium" | "success" = "light") {
  return useCallback(() => {
    hapticMap[level]();
    fn?.();
  }, [fn, level]);
}
