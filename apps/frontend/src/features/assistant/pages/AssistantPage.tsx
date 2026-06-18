import { Link, useNavigate } from "react-router-dom";

import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import AssistantChat from "../components/AssistantChat";

export default function AssistantPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <PageHeader
        title="AI Assistant"
        description="Ask for calm, specific guidance while you work through Tendaflow."
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

      <AssistantChat />
    </PageContainer>
  );
}
