import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type SupplierAction = {
  label: string;
  path: string;
};

type SupplierTopic = {
  label: string;
  keywords: string[];
  answer: string;
  steps: string[];
  actions: SupplierAction[];
  checkpoint: string;
};

const supplierTopics: SupplierTopic[] = [
  {
    label: "Purchase orders",
    keywords: ["po", "purchase order", "order", "missing po", "shared", "sent"],
    answer:
      "Purchase Orders show what the buyer has shared with you. If a PO is missing, the buyer may not have sent or shared it yet.",
    steps: [
      "Open Purchase Orders.",
      "Select the PO you want to review.",
      "Check item descriptions, quantities, prices, notes, and status.",
      "Create an invoice only when the PO is eligible and the details are correct.",
    ],
    actions: [
      { label: "Open POs", path: "/supplier-portal/purchase-orders" },
      { label: "Supplier Guide", path: "/supplier-portal/guide" },
    ],
    checkpoint:
      "Do not invoice a PO if quantities, prices, or items look wrong. Contact the buyer first.",
  },
  {
    label: "Create invoice",
    keywords: ["invoice", "create invoice", "bill", "submit invoice", "rejected"],
    answer:
      "Create invoices from eligible POs. The buyer reviews and approves the invoice inside their Tendaflow workspace.",
    steps: [
      "Open Purchase Orders.",
      "Open the eligible PO.",
      "Click Create Invoice.",
      "Enter invoice number, line items, quantities, prices, and totals.",
      "Submit the invoice for buyer review, then track it under Invoices.",
    ],
    actions: [
      { label: "Open POs", path: "/supplier-portal/purchase-orders" },
      { label: "View Invoices", path: "/supplier-portal/invoices" },
    ],
    checkpoint:
      "I can guide you, but I cannot submit the invoice for you. Review it before you click the final submit button.",
  },
  {
    label: "Invoice status",
    keywords: ["invoice status", "track invoice", "pending invoice", "approved invoice", "rejected invoice", "status"],
    answer:
      "Invoice status tells you where the buyer is in their review process. Open Invoices to check whether an invoice is submitted, approved, rejected, paid, or still in progress.",
    steps: [
      "Open Invoices.",
      "Find the invoice number.",
      "Open the invoice details.",
      "Review the status and any rejection reason if it was rejected.",
      "Contact the buyer if the status looks unclear or has not changed for a long time.",
    ],
    actions: [
      { label: "View Invoices", path: "/supplier-portal/invoices" },
      { label: "Supplier Guide", path: "/supplier-portal/guide" },
    ],
    checkpoint:
      "Only the buyer's internal team can approve or reject invoices.",
  },
  {
    label: "Payments",
    keywords: ["payment", "paid", "reference", "money", "amount", "method"],
    answer:
      "Payments show what the buyer has recorded against approved invoices. You can review payment details, but suppliers cannot create or approve payments.",
    steps: [
      "Open Payments.",
      "Review payment amount, method, reference, and status.",
      "Compare the payment record with your invoice and finance records.",
      "Contact the buyer's finance team if a payment is missing or unclear.",
    ],
    actions: [
      { label: "View Payments", path: "/supplier-portal/payments" },
      { label: "View Invoices", path: "/supplier-portal/invoices" },
    ],
    checkpoint:
      "Tendaflow shows payment records here; it does not move money from the supplier portal.",
  },
  {
    label: "Portal help",
    keywords: ["help", "confused", "support", "guide", "where", "start"],
    answer:
      "Start with Purchase Orders. From there you can review shared POs, create eligible invoices, and then track invoices and payments.",
    steps: [
      "Open Purchase Orders to see what the buyer has shared.",
      "Open Invoices to track invoices you submitted.",
      "Open Payments to review payment records.",
      "Use Supplier Guide when you want the fuller explanation.",
    ],
    actions: [
      { label: "Open POs", path: "/supplier-portal/purchase-orders" },
      { label: "Supplier Guide", path: "/supplier-portal/guide" },
    ],
    checkpoint:
      "For missing POs, rejected invoices, or payment questions, contact the buyer because they control those records.",
  },
];

const starterPrompts = [
  "What should I do first?",
  "Why can't I see a purchase order?",
  "How do I create an invoice?",
  "Where do I track invoice status?",
  "Where do I see payments?",
];

function findTopic(message: string): SupplierTopic | null {
  const lowerMessage = message.toLowerCase();

  return (
    supplierTopics.find((topic) =>
      topic.keywords.some((keyword) => lowerMessage.includes(keyword)),
    ) ?? null
  );
}

export default function SupplierPortalAssistantPage() {
  const [message, setMessage] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(starterPrompts[0]);

  const topic = useMemo(() => findTopic(activeQuestion), [activeQuestion]);
  const response = topic ?? supplierTopics[4];
  const isFallback = topic === null;

  function submitMessage(nextMessage = message) {
    const trimmed = nextMessage.trim();
    if (!trimmed) return;
    setActiveQuestion(trimmed);
    setMessage("");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-primary-blue/10 bg-white/85 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-blue">
              Supplier Assistant
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-primary-black">
              Quick help for supplier portal tasks.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-primary-gray">
              Ask about purchase orders, creating invoices, invoice status, and
              payments. I only guide supplier duties.
            </p>
          </div>

          <Link
            to="/supplier-portal/guide"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-[#A7EBF2]/70 bg-white/75 px-4 py-2 text-sm font-semibold text-[#26658C] shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54ACBF]/70 hover:bg-white hover:text-[#007CBE] hover:shadow-md"
          >
            Supplier Guide
          </Link>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-primary-black">
            Common questions
          </p>
          <div className="mt-4 space-y-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submitMessage(prompt)}
                className="w-full rounded-xl border border-[#A7EBF2]/55 bg-white/72 px-3 py-2 text-left text-sm font-semibold text-primary-gray shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54ACBF]/70 hover:bg-white hover:text-[#26658C]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 brand-gradient-surface px-4 py-4 text-white sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              Ask Supplier Assistant
            </p>
            <p className="mt-1 text-sm leading-6 text-white/80">
              I give steps and links. You review and take the final action.
            </p>
          </div>

          <div className="space-y-4 bg-gray-50/80 p-4 sm:p-5">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-md brand-gradient-accent px-4 py-3 text-sm leading-6 text-white shadow-sm">
                {activeQuestion}
              </div>
            </div>

            <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-gray-200 bg-white p-4 text-sm text-primary-gray shadow-sm">
              <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-primary-blue">
                {response.label}
              </span>

              <p className="mt-3 leading-6">{response.answer}</p>

              {isFallback && (
                <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  I may not have matched that exactly. I can answer supplier
                  portal questions about POs, invoices, invoice status, and
                  payments. For record corrections, contact the buyer.
                </p>
              )}

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-gray">
                  Next steps
                </p>
                <ol className="mt-2 space-y-2">
                  {response.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 leading-6">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-primary-blue">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-gray">
                  Shortcuts
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {response.actions.map((action) => (
                    <Link
                      key={action.path}
                      to={action.path}
                      className="rounded-xl border border-[#54ACBF]/40 bg-[#26658C] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[#26658C]/20 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54ACBF]/80 hover:bg-white/35 hover:text-[#26658C] hover:shadow-md"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                <p className="font-semibold">Checkpoint</p>
                <p className="mt-1">{response.checkpoint}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white p-4 sm:p-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-sm focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/20">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask about POs, invoices, invoice status, or payments..."
                className="min-h-20 max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm text-primary-black outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-2 pt-2">
                <p className="text-xs text-primary-gray">
                  Supplier-only guidance. No internal admin actions here.
                </p>
                <button
                  type="button"
                  onClick={() => submitMessage()}
                  disabled={!message.trim()}
                  className="inline-flex items-center justify-center rounded-xl border border-[#54ACBF]/40 bg-[#26658C] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#26658C]/20 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54ACBF]/80 hover:bg-white/35 hover:text-[#26658C] hover:shadow-md disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-300 disabled:text-white disabled:shadow-none"
                >
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
