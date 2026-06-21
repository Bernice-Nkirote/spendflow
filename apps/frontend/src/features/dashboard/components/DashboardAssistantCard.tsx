import { Link } from "react-router-dom";

export default function DashboardAssistantCard() {
  return (
    <div className="rounded-2xl border border-primary-blue/10 bg-primary-blue/90 p-5 text-white shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
        Tenda Assistant
      </p>
      <h2 className="mt-2 text-xl font-semibold">Need a hand deciding?</h2>
      <p className="mt-2 text-sm leading-6 text-blue-50">
        Ask for help with PRs, POs, invoices, payments, approvals, suppliers,
        roles, departments, exchange rates, reports, or where to start.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/assistant"
          className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-blue shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"
        >
          Ask Tenda
        </Link>
        <Link
          to="/user-guide"
          className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
        >
          Open guide
        </Link>
      </div>
    </div>
  );
}
