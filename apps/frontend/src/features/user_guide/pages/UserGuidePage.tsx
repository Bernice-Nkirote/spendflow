import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Card from "../../../components/ui/Card";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";

type GuideSection = {
  id: string;
  title: string;
  summary: string;
  whoUsesIt: string;
  steps: string[];
  watchFor: string[];
};

const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    summary:
      "Set up Tendaflow in the right order so procurement, approvals, reports, and supplier records work cleanly.",
    whoUsesIt: "Company owners and administrators.",
    steps: [
      "Confirm the company profile and business type.",
      "Create departments for teams, branches, or cost centres.",
      "Review the default roles before creating new ones.",
      "Procurement-style roles are prepared to create procurement work such as PRs and POs.",
      "Finance-style roles are prepared to create finance work such as invoices and payments.",
      "Assign permissions carefully when a role needs extra access beyond the default setup.",
      "Configure approval workflows for PRs, POs, invoices, and payments.",
      "Add suppliers and exchange rates before creating live procurement records.",
    ],
    watchFor: [
      "Start from this guide if you are unsure what to do first.",
      "Do not give approval permissions to users who should only request items.",
      "Test workflows with a small record before relying on them in production.",
    ],
  },
  {
    id: "business-types",
    title: "Business Types",
    summary:
      "Business type helps Tendaflow support one-person businesses, partnerships, and larger companies.",
    whoUsesIt: "Company owners and administrators.",
    steps: [
      "Use Sole Proprietorship for a one-person shop where the owner can approve alone.",
      "Use Partnership when partner approval rules need to be configurable.",
      "Use Company for larger teams with departments, roles, and multi-level approval workflows.",
      "For partnerships, configure partner approval options inside each approval workflow.",
    ],
    watchFor: [
      "Partnership approvals are configurable and not limited to exactly two people.",
      "Approval workflows still control the actual approval route.",
    ],
  },
  {
    id: "departments",
    title: "Departments",
    summary:
      "Departments organise users, procurement records, approvals, and reports by team or cost centre.",
    whoUsesIt: "Admins and company owners.",
    steps: [
      "Open Departments from the sidebar.",
      "Create a department with a clear name.",
      "Assign users to departments where required.",
      "Use departments when creating PRs, POs, and workflow levels.",
    ],
    watchFor: [
      "Approvers may need to belong to the same department as the workflow level.",
      "Use consistent department names for cleaner reporting.",
    ],
  },
  {
    id: "roles-permissions",
    title: "Roles and Permissions",
    summary:
      "Roles group users by responsibility. Permissions decide what each role can view, create, update, approve, export, or administer.",
    whoUsesIt: "Admins and company owners.",
    steps: [
      "Review the default roles before creating new roles.",
      "Procurement-style roles are intended to create PRs and POs.",
      "Finance-style roles are intended to create invoices and payments.",
      "Create roles such as Requester, Procurement Officer, Finance, Partner, Approver, or Admin.",
      "Open Permissions and assign only the actions each role needs.",
      "Assign users to the correct roles.",
      "Test access with a real user account before using the workflow in production.",
    ],
    watchFor: [
      "Default creation permissions help teams start faster, but they should still be reviewed.",
      "Permissions such as pr.create and pr.approve mean very different things.",
      "Avoid giving admin permissions to everyday procurement users.",
    ],
  },
  {
    id: "approval-workflows",
    title: "Approval Workflows",
    summary:
      "Approval workflows define who approves PRs, POs, invoices, and payments, and in what order.",
    whoUsesIt: "Admins and company owners.",
    steps: [
      "Open Approval Workflows.",
      "Choose the workflow for PR, PO, invoice, or payment.",
      "Add workflow levels in the order approvals should happen.",
      "Assign approver roles to each level.",
      "For partnerships, configure partner approval mode if needed.",
    ],
    watchFor: [
      "A workflow without levels cannot process approvals.",
      "A level without assigned roles cannot be approved.",
      "Users should watch the Tasks icon and notification bell for pending approvals.",
    ],
  },
  {
    id: "suppliers",
    title: "Suppliers and Supplier Import",
    summary:
      "Suppliers store vendor details, categories, contact information, location, and supply history.",
    whoUsesIt: "Procurement teams, admins, and users creating POs.",
    steps: [
      "Open Suppliers.",
      "Add one supplier manually or use Import Excel for bulk upload.",
      "Use headers such as name, email, phone, address, contact_person, category, and sub_category.",
      "Choose a category or select Other and enter a custom category.",
      "Use the More button to review contact details and recent supplied items.",
    ],
    watchFor: [
      "Good supplier categories improve PO supplier selection and reports.",
      "Avoid duplicate supplier names.",
      "Keep contact details updated for follow-up.",
    ],
  },
  {
    id: "purchase-requisitions",
    title: "Purchase Requisitions",
    summary:
      "A PR captures what a user needs before procurement creates or issues a PO.",
    whoUsesIt: "Requesters, department users, procurement teams, and approvers.",
    steps: [
      "Open Purchase Requisitions.",
      "Click Create PR.",
      "Add title, department, business reason, items, quantities, prices, and currency.",
      "Save the draft and review totals.",
      "Submit for approval when ready.",
    ],
    watchFor: [
      "Use realistic estimated prices.",
      "Check the Tasks icon and notification bell after submission if you are an approver.",
    ],
  },
  {
    id: "purchase-orders",
    title: "Purchase Orders",
    summary:
      "A PO confirms the supplier, items, quantities, and agreed pricing for procurement.",
    whoUsesIt: "Procurement teams and PO approvers.",
    steps: [
      "Open Purchase Orders.",
      "Create a PO directly or create one from an approved PR.",
      "Use the supplier picker to search by supplier, category, contact, or supplied items.",
      "Review item quantities, unit prices, totals, department, currency, and notes.",
      "Submit for approval when ready.",
    ],
    watchFor: [
      "Create PO from approved PR where possible for traceability.",
      "Review suggested suppliers before selecting one.",
    ],
  },
  {
    id: "invoices",
    title: "Invoices",
    summary:
      "Invoices record what the supplier bills and should be checked against the PO and delivered items.",
    whoUsesIt: "Finance users, procurement teams, supplier portal users, and invoice approvers.",
    steps: [
      "Open Invoices.",
      "Create an invoice and link it to the supplier and PO where applicable.",
      "Confirm invoice number, item descriptions, quantities, prices, totals, currency, and dates.",
      "Submit for approval when ready.",
      "Approvers review from Tasks, Approvals, or notification alerts.",
    ],
    watchFor: [
      "Do not approve invoices that do not match the PO or received items.",
      "Check outstanding invoice reports for unpaid balances.",
    ],
  },
  {
    id: "payments",
    title: "Payments",
    summary:
      "Payments record money paid against approved invoices and update invoice payment status.",
    whoUsesIt: "Finance users and payment approvers.",
    steps: [
      "Open an approved invoice.",
      "Create a payment from the invoice.",
      "Enter amount, payment method, reference, currency, and date.",
      "Review outstanding balance before saving or submitting.",
    ],
    watchFor: [
      "Do not overpay an invoice.",
      "Use references that can be traced to bank or mobile money records.",
    ],
  },
  {
    id: "exchange-rates",
    title: "Exchange Rates",
    summary:
      "Exchange rates convert foreign-currency procurement records into base currency for reporting.",
    whoUsesIt: "Finance users and admins.",
    steps: [
      "Open Exchange Rates.",
      "Add or update the currency rate and effective date.",
      "Use the currency on PRs, POs, invoices, or payments.",
      "Review base-currency totals in reports.",
    ],
    watchFor: [
      "Use accurate rates before creating foreign-currency records.",
      "Review exchange rate date for audit clarity.",
    ],
  },
  {
    id: "reports",
    title: "Reports",
    summary:
      "Reports summarise procurement activity, spend, outstanding invoices, payments, supplier spend, and lead time.",
    whoUsesIt: "Managers, finance users, admins, and auditors.",
    steps: [
      "Open Reports.",
      "Choose the report tab.",
      "Apply filters such as date, status, supplier, department, payment method, or supplier category.",
      "Review summary cards and table values.",
      "Export CSV or Excel when needed.",
    ],
    watchFor: [
      "Supplier category improves supplier spend analysis.",
      "Exported reports should be treated as sensitive business records.",
    ],
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    summary:
      "Audit logs show who did what, when, and on which record for accountability.",
    whoUsesIt: "Admins, auditors, and company owners.",
    steps: [
      "Open Audit Logs.",
      "Review user actions, record references, dates, and details.",
      "Use logs to investigate setup changes, approvals, supplier updates, and report exports.",
    ],
    watchFor: [
      "Audit logs are for traceability, not editing business records.",
      "Unexpected actions should be reviewed promptly.",
    ],
  },
  {
    id: "tasks-notifications",
    title: "Tasks and Notifications",
    summary:
      "Tasks and notifications help approvers find work that needs their attention.",
    whoUsesIt: "Approvers, procurement teams, finance users, and admins.",
    steps: [
      "Watch the Tasks icon for pending approval work.",
      "Check the notification bell for approval alerts.",
      "Open the task or notification to review the related record.",
      "Approve or reject only after checking the details.",
    ],
    watchFor: [
      "A missing task may mean the workflow level, department, or role assignment needs checking.",
      "Approvers must use their own account for accountability.",
    ],
  },
  {
    id: "supplier-portal",
    title: "Supplier Portal",
    summary:
      "The supplier portal lets internal users create controlled supplier access, while external suppliers view POs, create invoices from eligible POs, and track invoices or payments.",
    whoUsesIt: "Admins, procurement users with supplier update access, external supplier users, and internal teams reviewing supplier submissions.",
    steps: [
      "Open Suppliers in the internal Tendaflow workspace.",
      "Create the supplier first if the supplier does not already exist.",
      "Open the supplier record and go to the Portal Users section.",
      "Enter the supplier user's email address and create the portal user.",
      "Tendaflow emails the supplier a setup link so they can create their password.",
      "After setup, the supplier signs in through Supplier Login.",
      "The supplier can view assigned purchase orders, create invoices from eligible POs, and track invoices or payments.",
      "Internal users review submitted supplier invoices in the main workspace.",
    ],
    watchFor: [
      "Only admins or users with supplier update access can manage supplier portal users.",
      "Use the supplier's correct email address because the setup link is sent there.",
      "If the setup link expires or is lost, resend the setup link from the supplier's Portal Users section.",
      "You can activate or deactivate supplier portal users from the same Portal Users section.",
      "Supplier portal users should only access their own records.",
      "Internal invoice approval still happens in the main workspace.",
    ],
  },
];

export default function UserGuidePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(guideSections[0].id);

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return guideSections;

    return guideSections.filter((section) => {
      const text = [
        section.title,
        section.summary,
        section.whoUsesIt,
        ...section.steps,
        ...section.watchFor,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(normalizedSearch);
    });
  }, [searchTerm]);

  const activeSection =
    filteredSections.find((section) => section.id === activeSectionId) ??
    filteredSections[0] ??
    guideSections[0];

  return (
    <PageContainer>
      <PageHeader
        title="User Guide"
        description="A practical guide to setting up and using Tendaflow safely."
        actions={
          <Link
            to="/assistant"
            className="inline-flex items-center justify-center rounded-xl bg-primary-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-blue/90"
          >
            Ask Tenda
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card>
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-gray">
              Search guide
            </label>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search PR, suppliers, approvals..."
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
            />
          </Card>

          <Card className="max-h-[70vh] overflow-y-auto [scrollbar-width:thin]">
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={[
                    "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition",
                    activeSection.id === section.id
                      ? "bg-blue-50 text-primary-blue"
                      : "text-primary-gray hover:bg-gray-50 hover:text-primary-black",
                  ].join(" ")}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </Card>
        </aside>

        <section className="space-y-5">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-blue">
              {activeSection.whoUsesIt}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-primary-black">
              {activeSection.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-primary-gray">
              {activeSection.summary}
            </p>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold text-primary-black">
                Key Steps
              </h3>
              <ol className="mt-4 space-y-3">
                {activeSection.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-primary-gray">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-primary-blue">
                      {index + 1}
                    </span>
                    <span className="pt-1 leading-6">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-primary-black">
                What To Watch For
              </h3>
              <ul className="mt-4 space-y-3">
                {activeSection.watchFor.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
