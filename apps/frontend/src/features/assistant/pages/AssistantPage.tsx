import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import AssistantChat from "../components/AssistantChat";

export default function AssistantPage() {
  return (
    <PageContainer>
      <PageHeader
        title="AI Assistant"
        description="Ask for calm, specific guidance while you work through Tendaflow."
      />

      <AssistantChat />
    </PageContainer>
  );
}
