import { useEffect, useState } from "react";

export default function ScrollToTopButton() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (!showScrollTop) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-24 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#274C77]/15 bg-[#274C77]/75 text-white shadow-[0_10px_30px_rgba(39,76,119,0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-[#274C77]/90 hover:shadow-[0_14px_35px_rgba(39,76,119,0.28)] lg:bottom-24 lg:right-6"
      aria-label="Scroll to top"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 drop-shadow-sm"
      >
        <path d="M18 15L12 9L6 15" />
      </svg>
    </button>
  );
}
