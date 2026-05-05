import Button from "../../../components/ui/Button";

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
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-primary-black sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-primary-gray">
          View, filter, and export business-readable procurement reports.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
    </section>
  );
}
