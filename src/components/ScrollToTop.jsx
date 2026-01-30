import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const container = document.getElementById("app-scroll-container");

    if (container) {
      container.scrollTo({ top: 0, behavior: "auto" });
    } else {
      // fallback (login pages etc.)
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
