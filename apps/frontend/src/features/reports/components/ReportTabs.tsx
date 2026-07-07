import Card from "../../../components/ui/Card";

export type ReportType =
  | "purchase-requisitions"
  | "purchase-orders"
  | "invoices"
  | "outstanding-invoices"
  | "payments"
  | "supplier-spend"
  | "supplier-lead-time";

export const reports: {
  label: string;
  value: ReportType;
  permission: string;
}[] = [
  {
    label: "PR Report",
    value: "purchase-requisitions",
    permission: "reports.pr.view",
  },
  {
    label: "PO Report",
    value: "purchase-orders",
    permission: "reports.po.view",
  },
  {
    label: "Invoice Report",
    value: "invoices",
    permission: "reports.invoices.view",
  },
  {
    label: "Outstanding Invoice",
    value: "outstanding-invoices",
    permission: "reports.outstanding_invoices.view",
  },
  {
    label: "Payment Report",
    value: "payments",
    permission: "reports.payments.view",
  },
  {
    label: "Supplier Spend",
    value: "supplier-spend",
    permission: "reports.supplier_spend.view",
  },
  {
    label: "Supplier Lead Time",
    value: "supplier-lead-time",
    permission: "reports.supplier_lead_time.view",
  },
];

type Props = {
  activeReport: ReportType;
  onChange: (report: ReportType) => void;
  allowedReports: ReportType[];
};

export default function ReportTabs({
  activeReport,
  onChange,
  allowedReports,
}: Props) {
  const visibleReports = reports.filter((report) =>
    allowedReports.includes(report.value),
  );

  return (
    <Card className="overflow-hidden">
      <div className="min-w-0">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-primary-black">
            Report Type
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Switch between procurement, invoice, payment, and supplier reports.
          </p>
        </div>

        <div className="tendaflow-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex w-max gap-2 rounded-2xl border border-[#A7C7E7]/45 bg-white/48 p-2 shadow-inner shadow-[#011C40]/[0.03] backdrop-blur">
            {visibleReports.map((report) => {
              const isActive = activeReport === report.value;

              return (
                <button
                  key={report.value}
                  type="button"
                  onClick={() => onChange(report.value)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary-blue text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary-black"
                  }`}
                >
                  {report.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
