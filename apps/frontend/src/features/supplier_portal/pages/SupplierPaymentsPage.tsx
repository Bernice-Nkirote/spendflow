import { useEffect, useState } from "react";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/ui/LoadingState";
import { formatCurrency } from "../../../utils/formatCurrency";
import { getSupplierPayments } from "../api/supplierPortalApi";
import SupplierPaymentStatusBadge from "../components/SupplierPaymentStatusBadge";
import { formatSupplierEnum } from "../utils/formatSupplierEnum";

type SupplierPayment = {
  id: string;
  invoice_number?: string | null;
  supplier_name?: string | null;
  amount: string;
  currency: string;
  base_amount?: string | null;
  base_currency?: string | null;
  payment_method: string;
  status: string;
  reference?: string | null;
  paid_at: string;
  created_at: string;
};

function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const data = await getSupplierPayments();
        setPayments(data);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  if (loading) return <LoadingState message="Loading payments..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-black">
          Supplier Payments
        </h1>
        <p className="mt-1 text-sm text-primary-gray">
          View payment records linked to your supplier invoices.
        </p>
      </div>

      <Card>
        {payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            message="Payments made against your supplier invoices will appear here."
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
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Method</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Base Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Paid At</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-blue">
                      {payment.invoice_number ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {payment.reference ?? "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      {formatSupplierEnum(payment.payment_method)}
                    </td>
                    <td className="px-4 py-3">
                      <SupplierPaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(Number(payment.amount), payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {payment.base_amount && payment.base_currency
                        ? formatCurrency(
                            Number(payment.base_amount),
                            payment.base_currency,
                          )
                        : "Not available"}
                    </td>
                    <td className="px-4 py-3">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString()
                        : "-"}
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

export default SupplierPaymentsPage;
