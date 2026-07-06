import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";

import { formatCurrency } from "../../../utils/formatCurrency";
import { getOutstandingInvoiceDetail } from "../api/outStandingInvoiceApi";
import ReportStatusBadge from "../../reports/components/ReportStatusBadge";
import type { OutstandingInvoiceDetail } from "../types/outStandingInvoice.type";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoneyValue(
  value: string | number | null | undefined,
  currency: string | null | undefined,
) {
  if (value === null || value === undefined || value === "") return "-";

  return formatCurrency(Number(value), currency ?? "KES");
}

export default function OutstandingInvoiceDetailsPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const [invoice, setInvoice] = useState<OutstandingInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOutstandingInvoice() {
      if (!invoiceId) {
        setError("Invoice ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getOutstandingInvoiceDetail(invoiceId);
        setInvoice(response);
      } catch {
        setError("Failed to load outstanding invoice details.");
      } finally {
        setLoading(false);
      }
    }

    fetchOutstandingInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <PageContainer className="module-theme module-reports">
        <LoadingState message="Loading outstanding invoice details..." />
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

  if (!invoice) {
    return (
      <PageContainer className="module-theme module-reports">
        <BackButton fallbackLabel="Back to Reports" fallbackTo="/reports" />
        <ErrorState message="Outstanding invoice was not found." />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="module-theme module-reports">
      <BackButton fallbackLabel="Back to Reports" fallbackTo="/reports" />

      <PageHeader
        title={`Outstanding Invoice ${invoice.invoice_number}`}
        description={`Supplier: ${invoice.supplier_name ?? "-"}`}
        actions={<ReportStatusBadge status={invoice.status} />}
      />

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <p className="text-sm text-primary-gray">Original Invoice Total</p>
          <p className="mt-2 break-words text-2xl font-semibold text-primary-black">
            {formatMoneyValue(invoice.total_amount, invoice.currency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Transaction currency: {invoice.currency ?? "-"}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Original Amount Paid</p>
          <p className="mt-2 break-words text-2xl font-semibold text-primary-black">
            {formatMoneyValue(invoice.amount_paid, invoice.currency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Paid in invoice currency
          </p>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <p className="text-sm font-medium text-yellow-700">
            Original Outstanding Balance
          </p>
          <p className="mt-2 break-words text-3xl font-bold text-yellow-800">
            {formatMoneyValue(invoice.outstanding_amount, invoice.currency)}
          </p>
          <p className="mt-1 text-xs text-yellow-700">
            Invoice-currency balance
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Base Invoice Total</p>
          <p className="mt-2 break-words text-2xl font-semibold text-primary-black">
            {formatMoneyValue(invoice.base_total_amount, invoice.base_currency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Base currency: {invoice.base_currency ?? "-"}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Base Amount Paid</p>
          <p className="mt-2 break-words text-2xl font-semibold text-primary-black">
            {formatMoneyValue(invoice.base_amount_paid, invoice.base_currency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Paid value in base currency
          </p>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <p className="text-sm font-medium text-primary-blue">
            Base Outstanding Balance
          </p>
          <p className="mt-2 break-words text-3xl font-bold text-primary-blue">
            {formatMoneyValue(
              invoice.base_outstanding_amount,
              invoice.base_currency,
            )}
          </p>
          <p className="mt-1 text-xs text-primary-blue">
            Company base-currency balance
          </p>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-primary-black">
          Outstanding Invoice Information
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Summary of the invoice, supplier, purchase order, and balance status.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Invoice Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.invoice_number}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              PO Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.po_number ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Status
            </p>
            <div className="mt-1">
              <ReportStatusBadge status={invoice.status} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(invoice.created_at)}
            </p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
