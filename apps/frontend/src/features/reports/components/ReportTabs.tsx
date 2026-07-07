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
                  className={`shrink-0 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "border-[#5EB0C8]/50 bg-[#26658C] text-white shadow-sm shadow-[#26658C]/20"
                      : "border-white/70 bg-white/68 text-[#2A7387] shadow-sm shadow-[#011C40]/[0.03] backdrop-blur hover:-translate-y-0.5 hover:border-[#8EB1D1]/70 hover:bg-[#A7C7E7]/22 hover:text-[#011C40] hover:shadow-md"
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
