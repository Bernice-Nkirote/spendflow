import { useState } from "react";
import { Link } from "react-router-dom";

import { askAssistant } from "../api/assistantApi";
import type { AssistantChatResponse } from "../types/assistant.types";

const starterPrompts = [
  "Suggest suppliers for laptops and networking equipment",
  "Guide me through creating a PR",
  "What should I check before approving an invoice?",
];

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

export default function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AssistantChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(nextMessage = message) {
    const trimmedMessage = nextMessage.trim();
    if (!trimmedMessage || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      setMessage(trimmedMessage);
      const assistantResponse = await askAssistant({
        message: trimmedMessage,
        context: window.location.pathname,
      });
      setResponse(assistantResponse);
    } catch (requestError) {
      setResponse(null);
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  function handleStarterPrompt(prompt: string) {
    setMessage(prompt);
    handleSubmit(prompt);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <section className="w-[calc(100vw-2.5rem)] max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-100 bg-primary-blue px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  Tendaflow Assistant
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Procurement guidance
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 [scrollbar-width:thin]">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-primary-blue">
              I can draft guidance and recommend suppliers, but I will never
              submit, approve, reject, issue, or pay anything for you.
            </div>

            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleStarterPrompt(prompt)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-primary-gray transition hover:border-primary-blue/30 hover:bg-blue-50 hover:text-primary-blue"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-gray">
                Ask a question
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Example: Suggest suppliers for catering services"
                className="min-h-24 w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              />
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isLoading || !message.trim()}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary-blue px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isLoading ? "Thinking..." : "Ask assistant"}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {response && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary-black">
                    Guidance
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-primary-gray">
                    {response.answer}
                  </p>
                </div>

                {response.supplier_suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-primary-black">
                      Suggested suppliers
                    </h3>
                    {response.supplier_suggestions.map((supplier) => (
                      <div
                        key={supplier.supplier_id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              to={`/suppliers/${supplier.supplier_id}`}
                              className="font-semibold text-primary-blue hover:underline"
                            >
                              {supplier.supplier_name}
                            </Link>
                            <p className="mt-1 text-xs text-primary-gray">
                              {supplier.category || "Uncategorised"}
                              {supplier.sub_category
                                ? ` • ${supplier.sub_category}`
                                : ""}
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
                            Score {supplier.score}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {supplier.recent_supplied_items
                            .slice(0, 4)
                            .map((item) => (
                              <span
                                key={item}
                                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-primary-gray"
                              >
                                {item}
                              </span>
                            ))}
                        </div>

                        <ul className="mt-3 space-y-1 text-xs text-primary-gray">
                          {supplier.reasons.slice(0, 3).map((reason) => (
                            <li key={reason}>- {reason}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-primary-black">
                    Next steps
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-primary-gray">
                    {response.suggested_next_steps.map((step) => (
                      <li key={step}>- {step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-14 items-center gap-2 rounded-full bg-primary-blue px-5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-primary-blue/90"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
          AI
        </span>
        Assistant
      </button>
    </div>
  );
}
