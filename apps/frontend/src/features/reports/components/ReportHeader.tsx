import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

type Props = {
  title: string;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  exporting?: "csv" | "excel" | null;
};

export default function ReportHeader({
  title,
  onExportCSV,
  onExportExcel,
  exporting,
}: Props) {
  const isExporting = exporting !== null;

  return (
    <Card>
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-primary-black">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            View, filter, and export business-readable procurement reports.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onExportCSV}
            disabled={!onExportCSV || isExporting}
          >
            {exporting === "csv" ? "Exporting CSV..." : "Export CSV"}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onExportExcel}
            disabled={!onExportExcel || isExporting}
          >
            {exporting === "excel" ? "Exporting Excel..." : "Export Excel"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
