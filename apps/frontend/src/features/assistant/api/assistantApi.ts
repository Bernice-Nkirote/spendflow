import axiosInstance from "../../../api/axiosInstance";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
} from "../types/assistant.types";

export async function askAssistant(
  payload: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  const response = await axiosInstance.post<AssistantChatResponse>(
    "/assistant/chat",
    payload,
  );

  return response.data;
}
