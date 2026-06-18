import { Link, useNavigate } from "react-router-dom";

import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import AssistantChat from "../components/AssistantChat";

export default function AssistantPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <PageHeader
        title="Tenda Assistant"
        description="Not sure what to do next? Ask Tenda for a clear step-by-step path."
        actions={
          <>
            <Link
              to="/user-guide"
              className="inline-flex items-center justify-center rounded-xl border border-primary-blue/20 bg-blue-50 px-4 py-2 text-sm font-semibold text-primary-blue transition hover:bg-blue-100"
            >
              User Guide
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-primary-gray shadow-sm transition hover:bg-gray-50 hover:text-primary-black"
            >
              Close
            </button>
          </>
        }
      />

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-primary-gray">
        <span className="font-semibold text-primary-blue">
          AI-powered guidance:
        </span>{" "}
        Tenda can explain where to go, what to check, and what action to take
        next. You stay in control of every submission, approval, and payment.
      </div>

      <AssistantChat />
    </PageContainer>
  );
}
