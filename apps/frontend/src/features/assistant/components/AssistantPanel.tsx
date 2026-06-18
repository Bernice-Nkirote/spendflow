import { Link } from "react-router-dom";

export default function AssistantPanel() {
  return (
    <Link
      to="/assistant"
      className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-primary-blue px-5 text-sm font-semibold text-white shadow-xl shadow-primary-blue/20 transition hover:-translate-y-0.5 hover:bg-primary-blue/90"
      aria-label="Open AI assistant"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
        AI
      </span>
      Assistant
    </Link>
  );
}
