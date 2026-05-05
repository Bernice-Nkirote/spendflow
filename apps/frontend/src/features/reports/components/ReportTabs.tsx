export type ReportType =
  | "purchase-requisitions"
  | "purchase-orders"
  | "invoices"
  | "outstanding-invoices"
  | "payments"
  | "supplier-spend"
  | "supplier-lead-time";

type Props = {
  activeReport: ReportType;
  onChange: (report: ReportType) => void;
};

const reports: { label: string; value: ReportType }[] = [
  { label: "PR Report", value: "purchase-requisitions" },
  { label: "PO Report", value: "purchase-orders" },
  { label: "Invoice Report", value: "invoices" },
  { label: "Outstanding Invoice", value: "outstanding-invoices" },
  { label: "Payment Report", value: "payments" },
  { label: "Supplier Spend", value: "supplier-spend" },
  { label: "Supplier Lead Time", value: "supplier-lead-time" },
];

export default function ReportTabs({ activeReport, onChange }: Props) {
  return (
    <div className="min-w-0 rounded-xl border bg-white p-2 shadow-sm">
      <div className="overflow-x-auto">
        <div className="flex w-max gap-2">
          {reports.map((report) => {
            const isActive = activeReport === report.value;

            return (
              <button
                key={report.value}
                type="button"
                onClick={() => onChange(report.value)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary-blue text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {report.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
