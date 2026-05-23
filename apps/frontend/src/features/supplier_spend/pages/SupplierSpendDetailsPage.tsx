import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import TableWrapper from "../../../components/ui/TableWrapper";

import { formatCurrency } from "../../../utils/formatCurrency";
import { getSupplierSpendDetail } from "../api/supplierSpendApi";
import ReportStatusBadge from "../../reports/components/ReportStatusBadge";
import type { SupplierSpendDetail } from "../types/supplierSpendDetail.types";

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

export default function SupplierSpendDetailsPage() {
  const { supplierId } = useParams<{ supplierId: string }>();

  const [supplierSpend, setSupplierSpend] =
    useState<SupplierSpendDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSupplierSpendDetail() {
      if (!supplierId) {
        setError("Supplier ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getSupplierSpendDetail(supplierId);
        setSupplierSpend(response);
      } catch {
        setError("Failed to load supplier spend details.");
      } finally {
        setLoading(false);
      }
    }

    fetchSupplierSpendDetail();
  }, [supplierId]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading supplier spend details..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <BackButton fallbackLabel="Back to Reports" fallbackTo="/reports" />
        <ErrorState message={error} />
      </PageContainer>
    );
  }

  if (!supplierSpend) {
    return (
      <PageContainer>
        <BackButton fallbackLabel="Back to Reports" fallbackTo="/reports" />
        <ErrorState message="Supplier spend details were not found." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton fallbackLabel="Back to Reports" fallbackTo="/reports" />

      <PageHeader
        title="Supplier Spend Details"
        description={`Supplier: ${supplierSpend.supplier_name}`}
      />

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-primary-gray">Base Invoice Total</p>
          <p className="mt-2 break-words text-2xl font-semibold text-primary-black">
            {formatMoneyValue(
              supplierSpend.base_total_invoice_amount,
              supplierSpend.base_currency,
            )}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Base currency: {supplierSpend.base_currency ?? "-"}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Base Paid Total</p>
          <p className="mt-2 break-words text-2xl font-semibold text-primary-black">
            {formatMoneyValue(
              supplierSpend.base_total_paid_amount,
              supplierSpend.base_currency,
            )}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Paid value normalized for reporting
          </p>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <p className="text-sm font-medium text-yellow-700">
            Base Outstanding
          </p>
          <p className="mt-2 break-words text-2xl font-bold text-yellow-800">
            {formatMoneyValue(
              supplierSpend.base_outstanding_amount,
              supplierSpend.base_currency,
            )}
          </p>
          <p className="mt-1 text-xs text-yellow-700">
            Company base-currency balance
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Activity Count</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {supplierSpend.invoice_count + supplierSpend.payment_count}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            {supplierSpend.invoice_count} invoices ·{" "}
            {supplierSpend.payment_count} payments
          </p>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-primary-black">
          Supplier Financial Summary
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Overview of invoice, payment, and outstanding balance activity.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Supplier Name
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {supplierSpend.supplier_name}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Base Currency
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {supplierSpend.base_currency ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Invoice Count
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {supplierSpend.invoice_count}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Payment Count
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {supplierSpend.payment_count}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Invoice Breakdown
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Invoice balances linked to this supplier.
            </p>
          </div>

          <p className="text-sm text-primary-gray">
            {supplierSpend.invoices.length} invoices
          </p>
        </div>

        {supplierSpend.invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            message="This supplier has no invoice history for this report."
          />
        ) : (
          <TableWrapper minWidth="1100px">
            <table className="w-full divide-y divide-gray-200 bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Invoice No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    PO Number
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Total
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Paid
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Outstanding
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Base Outstanding
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {supplierSpend.invoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                      {invoice.invoice_number}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {invoice.po_number ?? "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatMoneyValue(invoice.total_amount, invoice.currency)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatMoneyValue(invoice.amount_paid, invoice.currency)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-primary-black">
                      {formatMoneyValue(
                        invoice.outstanding_amount,
                        invoice.currency,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-primary-black">
                      {formatMoneyValue(
                        invoice.base_outstanding_amount,
                        invoice.base_currency,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <ReportStatusBadge status={invoice.status} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {formatDate(invoice.created_at)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/invoices/${invoice.invoice_id}`}
                        state={{
                          from: "reports",
                          report: "supplier-spend",
                          previousPath: `/reports/supplier-spend/${supplierId}`,
                          label: "Back to Supplier Spend Details",
                        }}
                      >
                        <Button type="button" variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Payment Breakdown
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Payments recorded against this supplier’s invoices.
            </p>
          </div>

          <p className="text-sm text-primary-gray">
            {supplierSpend.payments.length} payments
          </p>
        </div>

        {supplierSpend.payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            message="This supplier has no payment history for this report."
          />
        ) : (
          <TableWrapper minWidth="1100px">
            <table className="w-full divide-y divide-gray-200 bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Invoice No.
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Amount
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Base Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Paid At
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {supplierSpend.payments.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                      {payment.payment_reference ?? "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {payment.invoice_number}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatMoneyValue(payment.amount, payment.currency)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatMoneyValue(
                        payment.base_amount,
                        payment.base_currency,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {payment.payment_method ?? "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <ReportStatusBadge status={payment.status} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {formatDate(payment.paid_at)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {formatDate(payment.created_at)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/payments/${payment.payment_id}`}
                        state={{
                          from: "reports",
                          report: "supplier-spend",
                          previousPath: `/reports/supplier-spend/${supplierId}`,
                          label: "Back to Supplier Spend Details",
                        }}
                      >
                        <Button type="button" variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </Card>
    </PageContainer>
  );
}
