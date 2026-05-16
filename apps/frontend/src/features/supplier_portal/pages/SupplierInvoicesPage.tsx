import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/ui/LoadingState";
import { formatCurrency } from "../../../utils/formatCurrency";
import { getSupplierInvoices } from "../api/supplierPortalApi";
import SupplierInvoiceStatusBadge from "../components/SupplierInvoiceStatusBadge";

type SupplierInvoice = {
  id: string;
  invoice_number: string;
  po_number?: string | null;
  supplier_name?: string | null;
  status: string;
  total_amount: string;
  currency: string;
  base_amount?: string | null;
  base_currency?: string | null;
  created_at: string;
};

function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const data = await getSupplierInvoices();
        setInvoices(data);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  if (loading) return <LoadingState message="Loading invoices..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-black">
          Supplier Invoices
        </h1>
        <p className="mt-1 text-sm text-primary-gray">
          Track invoices submitted through your supplier portal.
        </p>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            message="Invoices created from your purchase orders will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    Invoice Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Base Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-blue">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3">{invoice.po_number ?? "-"}</td>
                    <td className="px-4 py-3">
                      <SupplierInvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(
                        Number(invoice.total_amount),
                        invoice.currency,
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {invoice.base_amount && invoice.base_currency
                        ? formatCurrency(
                            Number(invoice.base_amount),
                            invoice.base_currency,
                          )
                        : "Not available"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/supplier-portal/invoices/${invoice.id}`}
                        className="text-sm font-medium text-primary-blue hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SupplierInvoicesPage;
