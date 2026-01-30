import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Case 1: normal page scroll (most apps)
    window.scrollTo(0, 0);

    // Case 2: dashboard container scroll (optional, safe)
    const container = document.getElementById("app-scroll-container");
    if (container) {
      container.scrollTo({ top: 0 });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
