import Card from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";

const guideSections = [
  {
    title: "Getting Started",
    summary:
      "Use the supplier portal to review purchase orders, create invoices from eligible POs, and track invoice or payment progress.",
    steps: [
      "Open the setup email sent by Tendaflow.",
      "Create your password using the secure setup link.",
      "Sign in from Supplier Login.",
      "Review the Purchase Orders page first to see what has been shared with you.",
    ],
    watchFor: [
      "If your setup link expires, contact the buyer or procurement team to resend it.",
      "Use the email address that received the setup invitation.",
    ],
  },
  {
    title: "Purchase Orders",
    summary:
      "Purchase Orders show the items, quantities, pricing, and status shared with you by the buyer.",
    steps: [
      "Open Purchase Orders.",
      "Click a PO to review the details.",
      "Check item descriptions, quantities, prices, notes, and status.",
      "Create an invoice only when the PO is eligible for invoicing.",
    ],
    watchFor: [
      "If a PO is missing, ask the buyer to confirm it was sent or shared with you.",
      "Do not invoice a PO if the quantities, prices, or details are incorrect. Contact the buyer first.",
    ],
  },
  {
    title: "Invoices",
    summary:
      "Invoices are created from eligible purchase orders and then reviewed by the internal Tendaflow team.",
    steps: [
      "Open the eligible purchase order.",
      "Click Create Invoice.",
      "Enter the invoice number, line items, quantities, prices, and totals.",
      "Submit the invoice for the buyer's review.",
      "Track the invoice status from the Invoices page.",
    ],
    watchFor: [
      "Invoice details should match the PO and agreed supply.",
      "Internal users still approve invoices in the main Tendaflow workspace.",
      "If an invoice is rejected, review the reason and contact the buyer if anything is unclear.",
    ],
  },
  {
    title: "Payments",
    summary:
      "Payments show records made by the buyer against your approved invoices.",
    steps: [
      "Open Payments.",
      "Review payment reference, method, amount, and status.",
      "Compare payment records with your invoice and bank or mobile money records.",
    ],
    watchFor: [
      "If payment information looks incomplete, contact the buyer's finance team.",
      "The supplier portal shows payment status; it does not let suppliers create or approve payments.",
    ],
  },
  {
    title: "Need Help",
    summary:
      "Use the Supplier Assistant for quick help, or contact the buyer when a record needs correction.",
    steps: [
      "Open Supplier Assistant for quick steps.",
      "Use this guide for the full supplier portal workflow.",
      "Contact the buyer for missing POs, expired setup links, rejected invoices, or payment questions.",
    ],
    watchFor: [
      "The supplier assistant only guides supplier portal actions.",
      "It cannot submit invoices, change POs, approve invoices, or record payments for you.",
    ],
  },
];

export default function SupplierPortalGuidePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Portal Guide"
        description="A practical guide for suppliers using Tendaflow."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {guideSections.map((section) => (
          <Card key={section.title} className="h-full">
            <h2 className="text-lg font-semibold text-primary-black">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-primary-gray">
              {section.summary}
            </p>

            <h3 className="mt-5 text-sm font-semibold text-primary-black">
              Steps
            </h3>
            <ol className="mt-3 space-y-2">
              {section.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-primary-gray">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-primary-blue">
                    {index + 1}
                  </span>
                  <span className="leading-6">{step}</span>
                </li>
              ))}
            </ol>

            <h3 className="mt-5 text-sm font-semibold text-primary-black">
              Watch For
            </h3>
            <ul className="mt-3 space-y-2">
              {section.watchFor.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
