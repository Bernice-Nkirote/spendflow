import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import TableWrapper from "../../../components/ui/TableWrapper";

import { formatCurrency } from "../../../utils/formatCurrency";
import { getInvoiceById } from "../api/invoiceApi";
import { getPaymentsByInvoice } from "../../payments/api/paymentApi";
import type { InvoiceDetails } from "../types/invoice.types";
import InvoiceActions from "../components/InvoiceActions";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRate(value: string | number | null | undefined) {
  if (!value) return "-";

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) return "-";

  return numericValue.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const returnTo = searchParams.get("returnTo");

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      if (!id) {
        setError("Invoice ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getInvoiceById(id);
        setInvoice(response);

        const payments = await getPaymentsByInvoice(id);
        setHasPendingPayment(
          payments.some((payment) => payment.status === "PENDING_APPROVAL"),
        );
      } catch {
        setError("Failed to load invoice details.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [id]);

  if (loading) return <LoadingState message="Loading invoice details..." />;

  if (error) return <ErrorState message={error} />;

  if (!invoice) {
    return <ErrorState message="Invoice was not found." />;
  }

  const submittedBy =
    invoice.submitted_by_user_name ??
    invoice.submitted_by_supplier_user_name ??
    "-";

  return (
    <PageContainer className="module-theme module-procurement">
      {actionSuccess && (
        <FloatingAlert
          type="success"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}

      {actionError && (
        <FloatingAlert
          type="error"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}

      <PageHeader
        title={invoice.invoice_number}
        description={`Supplier: ${invoice.supplier_name ?? "-"}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <InvoiceStatusBadge status={invoice.status} />

            {returnTo ? (
              <BackButton label="Back to Approval" to={returnTo} />
            ) : (
              <BackButton
                fallbackLabel="Back to Invoices"
                fallbackTo="/invoices"
              />
            )}
          </div>
        }
      />

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Invoice Actions
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Created {formatDate(invoice.created_at)}
            </p>
          </div>

          <InvoiceActions
            invoice={invoice}
            hasPendingPayment={hasPendingPayment}
            onUpdated={(updatedInvoice) => {
              setInvoice(updatedInvoice);
              setActionError(null);
              setActionSuccess("Invoice action completed successfully.");
            }}
            onError={(message) => {
              setActionSuccess(null);
              setActionError(message);
            }}
          />
        </div>
      </Card>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-sm text-gray-600">Original Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(
              Number(invoice.total_amount ?? 0),
              invoice.currency ?? "KES",
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Transaction currency: {invoice.currency ?? "-"}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">Base Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {invoice.base_amount && invoice.base_currency
              ? formatCurrency(
                  Number(invoice.base_amount),
                  invoice.base_currency,
                )
              : "-"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Used for approvals and reporting
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">Exchange Rate</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatRate(invoice.exchange_rate)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {invoice.currency}
            {invoice.base_currency ? ` -> ${invoice.base_currency}` : ""}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">Supplier</p>
          <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
            {invoice.supplier_name ?? "-"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Rate date: {formatDate(invoice.exchange_rate_date)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">Status</p>
          <div className="mt-3">
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-2 text-xs text-gray-500">Invoice lifecycle status</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-primary-black">
          Invoice Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Invoice Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.invoice_number}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              PO Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.po_number ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Submitted By
            </p>
            <p className="mt-1 text-sm text-primary-black">{submittedBy}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </p>

            <div className="mt-2">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(invoice.created_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Updated At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(invoice.updated_at)}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Line Items
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Line-level billing details attached to this invoice.
          </p>
        </div>

        <TableWrapper minWidth="800px">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {invoice.line_items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {item.description}
                  </td>

                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {item.invoiced_quantity}
                  </td>

                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(
                      Number(item.unit_price ?? 0),
                      invoice.currency ?? "KES",
                    )}
                  </td>

                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(
                      Number(item.total_price ?? 0),
                      invoice.currency ?? "KES",
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      </Card>
    </PageContainer>
  );
}
