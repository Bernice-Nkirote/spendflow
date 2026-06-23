import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Card from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";

type SupplierTopic = {
  label: string;
  keywords: string[];
  answer: string;
  steps: string[];
};

const supplierTopics: SupplierTopic[] = [
  {
    label: "Getting started",
    keywords: ["start", "login", "setup", "password", "invite", "email"],
    answer:
      "Start from the setup email. Create your password, sign in through Supplier Login, then review Purchase Orders first.",
    steps: [
      "Open the Tendaflow setup email.",
      "Create your password before the setup link expires.",
      "Sign in through Supplier Login.",
      "Open Purchase Orders to see what the buyer has shared with you.",
    ],
  },
  {
    label: "Purchase orders",
    keywords: ["po", "purchase order", "order", "missing po", "shared"],
    answer:
      "Purchase Orders show what the buyer has shared with you. If a PO is missing, ask the buyer to confirm it was sent or marked as shared.",
    steps: [
      "Open Purchase Orders.",
      "Click the PO you want to review.",
      "Check item descriptions, quantities, prices, notes, and status.",
      "Create an invoice only when the PO is eligible.",
    ],
  },
  {
    label: "Invoices",
    keywords: ["invoice", "create invoice", "bill", "submit invoice", "rejected"],
    answer:
      "Create invoices from eligible POs. The buyer's internal team reviews and approves invoices in their Tendaflow workspace.",
    steps: [
      "Open the eligible PO.",
      "Click Create Invoice.",
      "Enter invoice number, items, quantities, prices, and totals.",
      "Submit the invoice for review.",
      "Track status from Invoices.",
    ],
  },
  {
    label: "Payments",
    keywords: ["payment", "paid", "reference", "money", "status"],
    answer:
      "Payments show what the buyer has recorded against approved invoices. Suppliers can review payment information, but cannot create or approve payments.",
    steps: [
      "Open Payments.",
      "Review amount, method, reference, and status.",
      "Compare the payment record with your invoice and financial records.",
      "Contact the buyer's finance team if something looks wrong.",
    ],
  },
  {
    label: "Need help",
    keywords: ["help", "confused", "support", "contact", "guide"],
    answer:
      "You are okay. For portal steps, use the Supplier Guide. For missing records or corrections, contact the buyer because they control shared POs, approvals, and payments.",
    steps: [
      "Open Supplier Guide for detailed portal steps.",
      "Ask the buyer about missing POs, expired setup links, rejected invoices, or payment questions.",
      "Do not submit an invoice if PO details look incorrect.",
    ],
  },
];

const starterPrompts = [
  "How do I get started?",
  "Why can't I see a purchase order?",
  "How do I create an invoice?",
  "Where do I track invoice status?",
  "Where do I see payments?",
];

function findTopic(message: string) {
  const lowerMessage = message.toLowerCase();

  return (
    supplierTopics.find((topic) =>
      topic.keywords.some((keyword) => lowerMessage.includes(keyword)),
    ) ?? supplierTopics[4]
  );
}

export default function SupplierPortalAssistantPage() {
  const [message, setMessage] = useState("");
  const [activePrompt, setActivePrompt] = useState(starterPrompts[0]);

  const topic = useMemo(() => findTopic(activePrompt), [activePrompt]);

  function submitMessage(nextMessage = message) {
    const trimmed = nextMessage.trim();
    if (!trimmed) return;
    setActivePrompt(trimmed);
    setMessage("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Assistant"
        description="Quick, supplier-only guidance for POs, invoices, payments, and portal access."
        actions={
          <Link
            to="/supplier-portal/guide"
            className="inline-flex items-center justify-center rounded-xl border border-primary-blue/20 bg-blue-50 px-4 py-2 text-sm font-semibold text-primary-blue transition hover:bg-blue-100"
          >
            Supplier Guide
          </Link>
        }
      />

      <Card className="border-primary-blue/10 bg-primary-blue text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          Supplier-only helper
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          Ask about your portal workflow.
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
          I can guide you, but you stay in control. I cannot submit invoices,
          change POs, approve records, or record payments.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <p className="text-sm font-semibold text-primary-black">
            Common supplier questions
          </p>
          <div className="mt-4 space-y-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submitMessage(prompt)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-semibold text-primary-gray transition hover:border-primary-blue/30 hover:bg-blue-50 hover:text-primary-blue"
              >
                {prompt}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about POs, invoices, payments, login, or missing records..."
              className="min-h-24 w-full resize-none bg-transparent px-3 py-2 text-sm text-primary-black outline-none"
            />
            <div className="flex justify-end border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => submitMessage()}
                disabled={!message.trim()}
                className="rounded-full bg-primary-blue px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Ask
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-blue">
              {topic.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-primary-gray">
              {topic.answer}
            </p>
            <ol className="mt-4 space-y-2">
              {topic.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-primary-gray">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary-blue">
                    {index + 1}
                  </span>
                  <span className="leading-6">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
}
