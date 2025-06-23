// hooks/useResponsive.ts
import { useEffect, useState } from "react";

export function useResponsive(threshold = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < threshold);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [threshold]);

  return isMobile;
}
