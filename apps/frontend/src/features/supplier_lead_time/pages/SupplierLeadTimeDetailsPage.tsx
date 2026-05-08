import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

import { getSupplierLeadTimeDetail } from "../api/supplierLeadTimeApi";
import type { SupplierLeadTimeDetail } from "../types/supplierLeadTimeDetail.types";

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString();
}

function formatLeadTime(value?: number | null) {
  if (value === null || value === undefined) return "-";

  return `${value.toFixed(2)} days`;
}

export default function SupplierLeadTimeDetailsPage() {
  const { poId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<SupplierLeadTimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        if (!poId) {
          setError("Missing purchase order ID");
          return;
        }

        const response = await getSupplierLeadTimeDetail(poId);

        setData(response);
      } catch (err) {
        console.error(err);
        setError("Failed to load supplier lead time details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [poId]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">
          Loading supplier lead time details...
        </p>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <p className="text-sm text-red-600">
            {error || "Supplier lead time detail not found"}
          </p>

          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Supplier Lead Time Detail
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            PO Number: {data.po_number}
          </p>
        </div>

        <Button onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500">Supplier</p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {data.supplier_name}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">Lead Time</p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {formatLeadTime(data.lead_time_days)}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">PO Status</p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {data.po_status}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">Invoice Status</p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {data.invoice_status || "-"}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Timeline Details
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Purchase Order Number</p>

              <p className="mt-1 font-medium text-gray-900">{data.po_number}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>

              <p className="mt-1 font-medium text-gray-900">
                {data.invoice_number || "-"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">PO Issued At</p>

              <p className="mt-1 font-medium text-gray-900">
                {formatDate(data.issued_at)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Invoice Created At</p>

              <p className="mt-1 font-medium text-gray-900">
                {formatDate(data.invoice_created_at)}
              </p>
            </div>
          </div>

          <div className="px-6 py-4">
            <p className="text-sm text-gray-500">Lead Time Calculation</p>

            <p className="mt-1 font-medium text-gray-900">
              {formatLeadTime(data.lead_time_days)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
