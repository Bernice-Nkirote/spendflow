import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";

import { askAssistant } from "../api/assistantApi";
import type {
  AssistantChatResponse,
  AssistantSupplierSuggestion,
} from "../types/assistant.types";

const starterPrompts = [
  "Explain the business types",
  "Create a PR",
  "How do I add suppliers?",
  "How do I create departments and roles?",
  "Suggest suppliers for laptops and networking equipment",
  "Approve an invoice",
  "Configure approval workflows",
  "Record a payment",
  "Open supplier spend report",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AssistantChatResponse;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { detail?: unknown } } }).response
      ?.data?.detail === "string"
  ) {
    return (error as { response: { data: { detail: string } } }).response.data
      .detail;
  }

  return "The assistant could not respond right now.";
}

function highlightActionText(text: string) {
  const phrases = [
    "More button",
    "Tasks icon",
    "notification bell",
    "Approvals",
    "Suppliers",
    "Departments",
    "Roles",
    "Permissions",
    "Approval Workflows",
    "Exchange Rates",
    "Reports",
    "Audit Logs",
    "Create PR",
    "Create PO",
    "Import Excel",
    "Common Tasks",
    "User Guide",
  ];

  const matchedPhrase = phrases.find((phrase) => text.includes(phrase));
  if (!matchedPhrase) return text;

  const [before, after] = text.split(matchedPhrase);

  return (
    <>
      {before}
      <span className="rounded bg-blue-50 px-1 font-semibold text-primary-blue">
        {matchedPhrase}
      </span>
      {after}
    </>
  );
}

function SupplierSuggestionCard({
  supplier,
}: {
  supplier: AssistantSupplierSuggestion;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/suppliers/${supplier.supplier_id}`}
            className="font-semibold text-primary-blue hover:underline"
          >
            {supplier.supplier_name}
          </Link>
          <p className="mt-1 text-xs text-primary-gray">
            {supplier.category || "Uncategorised"}
            {supplier.sub_category ? ` - ${supplier.sub_category}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
          Score {supplier.score}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-primary-gray sm:grid-cols-3">
        <span className="truncate">{supplier.email || "No email recorded"}</span>
        <span className="truncate">{supplier.phone || "No phone recorded"}</span>
        <span className="truncate">
          {supplier.location || "No location recorded"}
        </span>
      </div>

      {supplier.recent_supplied_items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {supplier.recent_supplied_items.slice(0, 4).map((item) => (
            <span
              key={item}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-primary-gray"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      <ul className="mt-3 space-y-1 text-xs text-primary-gray">
        {supplier.reasons.slice(0, 3).map((reason) => (
          <li key={reason}>- {reason}</li>
        ))}
      </ul>
    </div>
  );
}

function AssistantReply({
  message,
  onClose,
}: {
  message: ChatMessage;
  onClose: () => void;
}) {
  const response = message.response;

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-gray-200 bg-white p-4 text-sm text-primary-gray shadow-sm">
        <p className="leading-6">{message.content}</p>

        {response && (
          <div className="mt-4 space-y-4">
            {response.actions.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-gray">
                  Shortcuts
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {response.actions.map((action) => (
                    <Link
                      key={`${action.label}-${action.path}`}
                      to={action.path}
                      onClick={onClose}
                      className="rounded-full bg-primary-blue px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-blue/90"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {response.supplier_suggestions.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-gray">
                  Suggested suppliers
                </p>
                {response.supplier_suggestions.map((supplier) => (
                  <SupplierSuggestionCard
                    key={supplier.supplier_id}
                    supplier={supplier}
                  />
                ))}
              </div>
            )}

            {response.suggested_next_steps.length > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-blue">
                  Next steps
                </p>
                <ul className="mt-2 space-y-1 leading-6">
                  {response.suggested_next_steps.map((step) => (
                    <li key={step}>- {highlightActionText(step)}</li>
                  ))}
                </ul>
              </div>
            )}

            {response.cautions.length > 0 && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-900">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Checkpoint
                </p>
                <ul className="mt-2 space-y-1 leading-6">
                  {response.cautions.map((caution) => (
                    <li key={caution}>- {caution}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I am your Tendaflow assistant. Ask me what you are trying to do and I will point you to the right screen, the next safe step, and any useful shortcut.",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isLoading]);

  async function handleSubmit(nextMessage = message) {
    const trimmedMessage = nextMessage.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage,
    };
    const history = messages
      .filter((item) => item.id !== "welcome")
      .slice(-10)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    setMessages((current) => [...current, userMessage]);
    setMessage("");

    try {
      setIsLoading(true);
      setError(null);
      const assistantResponse = await askAssistant({
        message: trimmedMessage,
        context: window.location.pathname,
        history,
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantResponse.answer,
          response: assistantResponse,
        },
      ]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  function handleStarterPrompt(prompt: string) {
    setIsTasksOpen(false);
    handleSubmit(prompt);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <>
      {isOpen && (
        <section className="fixed bottom-20 left-3 right-3 z-50 flex h-[min(760px,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:left-auto sm:right-5 sm:w-[44rem] lg:w-[52rem]">
          <div className="border-b border-white/10 bg-primary-blue px-4 py-3 text-white shadow-sm sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  Tendaflow Assistant
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Procurement chat
                </h2>
                <p className="mt-1 text-xs leading-5 text-white/75">
                  Quick guidance, safe shortcuts, and supplier suggestions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white/85 transition hover:bg-white/15 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => setIsTasksOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-semibold text-primary-black shadow-sm transition hover:border-primary-blue/30"
            >
              <span>Common Tasks</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
                {isTasksOpen ? "Hide" : "Show"}
              </span>
            </button>

            {isTasksOpen && (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleStarterPrompt(prompt)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-primary-gray transition hover:border-primary-blue/30 hover:bg-blue-50 hover:text-primary-blue"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/80 px-4 py-4 [scrollbar-width:thin] sm:px-5">
            {messages.map((chatMessage) =>
              chatMessage.role === "user" ? (
                <div key={chatMessage.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary-blue px-4 py-3 text-sm leading-6 text-white shadow-sm">
                    {chatMessage.content}
                  </div>
                </div>
              ) : (
                <AssistantReply
                  key={chatMessage.id}
                  message={chatMessage}
                  onClose={() => setIsOpen(false)}
                />
              ),
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-4 py-3 text-sm text-primary-gray shadow-sm">
                  Thinking through the clean path...
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-white p-4 sm:p-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-sm focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/20">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything: create PR, approve invoice, add suppliers, configure roles, suggest suppliers..."
                className="min-h-16 max-h-32 w-full resize-none bg-transparent px-3 py-2 text-sm text-primary-black outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-2 pt-2">
                <p className="text-xs text-primary-gray">
                  I guide and suggest. You review and click the final button.
                </p>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isLoading || !message.trim()}
                  className="inline-flex items-center justify-center rounded-full bg-primary-blue px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isLoading ? "Thinking..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-50 inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-primary-blue px-5 text-sm font-semibold text-white shadow-xl shadow-primary-blue/20 transition hover:-translate-y-0.5 hover:bg-primary-blue/90"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
          AI
        </span>
        Assistant
      </button>
    </>
  );
}
