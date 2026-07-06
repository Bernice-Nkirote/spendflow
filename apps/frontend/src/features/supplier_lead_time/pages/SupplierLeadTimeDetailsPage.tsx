import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";

import { getSupplierLeadTimeDetail } from "../api/supplierLeadTimeApi";
import ReportStatusBadge from "../../reports/components/ReportStatusBadge";
import type { SupplierLeadTimeDetail } from "../types/supplierLeadTimeDetail.types";
import { formatLeadTime } from "../../reports/utils/formatLeadTime";

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SupplierLeadTimeDetailsPage() {
  const { poId } = useParams<{ poId: string }>();

  const [data, setData] = useState<SupplierLeadTimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!poId) {
        setError("Purchase order ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getSupplierLeadTimeDetail(poId);
        setData(response);
      } catch {
        setError("Failed to load supplier lead time details.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [poId]);

  if (loading) {
    return (
      <PageContainer className="module-theme module-reports">
        <LoadingState message="Loading supplier lead time details..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="module-theme module-reports">
        <BackButton fallbackLabel="Back to Reports" fallbackTo="/reports" />
        <ErrorState message={error} />
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer className="module-theme module-reports">
        <BackButton fallbackLabel="Back to Reports" fallbackTo="/reports" />
        <ErrorState message="Supplier lead time detail was not found." />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="module-theme module-reports">
      <BackButton fallbackLabel="Back to Reports" fallbackTo="/reports" />

      <PageHeader
        title="Supplier Lead Time Detail"
        description={`PO Number: ${data.po_number}`}
      />

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-primary-gray">Supplier</p>
          <p className="mt-2 break-words text-lg font-semibold text-primary-black">
            {data.supplier_name}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Lead Time</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatLeadTime(data.lead_time_days)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Days between PO issue and invoice creation
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">PO Status</p>
          <div className="mt-2">
            <ReportStatusBadge status={data.po_status} />
          </div>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Invoice Status</p>
          <div className="mt-2">
            {data.invoice_status ? (
              <ReportStatusBadge status={data.invoice_status} />
            ) : (
              <span className="text-sm text-primary-gray">-</span>
            )}
          </div>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-primary-black">
          Timeline Details
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Supplier delivery timing based on the purchase order issue date and
          invoice creation date.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Purchase Order Number
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {data.po_number}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Invoice Number
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {data.invoice_number || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              PO Issued At
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {formatDate(data.issued_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Invoice Created At
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {formatDate(data.invoice_created_at)}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Lead Time Calculation
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {formatLeadTime(data.lead_time_days)}
            </p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
