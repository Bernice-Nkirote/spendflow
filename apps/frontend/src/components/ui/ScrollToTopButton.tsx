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
      className="fixed bottom-24 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-[#274C77]/20 bg-blue-50/65 text-[#274C77] shadow-[0_8px_22px_rgba(39,76,119,0.14)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#274C77]/35 hover:bg-blue-100/75 hover:shadow-[0_10px_26px_rgba(39,76,119,0.2)] lg:bottom-24 lg:right-6"
      aria-label="Scroll to top"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 drop-shadow-sm"
      >
        <path d="M18 15L12 9L6 15" />
      </svg>
    </button>
  );
}
