import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isValidPhoneNumber } from "react-phone-number-input";
import type { Value } from "react-phone-number-input";
import PhoneInputField from "../../../components/ui/PhoneInputField";

import {
  activateSupplier,
  createSupplier,
  deactivateSupplier,
  getSuppliers,
  importSuppliersFromExcel,
} from "../api/supplierApi";
import type {
  Supplier,
  SupplierCreatePayload,
  SupplierImportResult,
} from "../types/supplier.types";

import SupplierStatusBadge from "../components/SupplierStatusBadge";

const initialFormState: SupplierCreatePayload = {
  name: "",
  email: "",
  address: "",
  contact_person: "",
};

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] =
    useState<SupplierCreatePayload>(initialFormState);

  const [phoneNumber, setPhoneNumber] = useState<Value | undefined>(undefined);
  const [phoneNumberError, setPhoneNumberError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<SupplierImportResult | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSuppliers() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load suppliers.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    setPhoneNumberError("");

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      setPhoneNumberError("Enter a valid phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await createSupplier({
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: phoneNumber || null,
        address: formData.address?.trim() || null,
        contact_person: formData.contact_person?.trim() || null,
      });

      setFormData(initialFormState);
      setPhoneNumber(undefined);
      await loadSuppliers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create supplier.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImportSuppliers(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedExcelFile) {
      setError("Please select an Excel file to upload.");
      return;
    }

    if (!selectedExcelFile.name.toLowerCase().endsWith(".xlsx")) {
      setError("Only .xlsx Excel files are supported.");
      return;
    }

    try {
      setIsImporting(true);
      setError("");
      setSuccessMessage("");
      setImportResult(null);

      const result = await importSuppliersFromExcel(selectedExcelFile);

      setImportResult(result);
      setSuccessMessage(
        `${result.created_count} supplier(s) imported successfully. ${result.failed_count} row(s) failed.`,
      );

      setSelectedExcelFile(null);
      await loadSuppliers();
    } catch (err: any) {
      const detail = err.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (detail?.message) {
        setError(
          `${detail.message} ${
            detail.instructions ? ` ${detail.instructions}` : ""
          }`,
        );
      } else {
        setError("Failed to import suppliers from Excel.");
      }
    } finally {
      setIsImporting(false);
    }
  }

  async function handleToggleSupplier(supplier: Supplier) {
    try {
      setError("");

      if (supplier.is_active) {
        await deactivateSupplier(supplier.id);
      } else {
        await activateSupplier(supplier.id);
      }

      await loadSuppliers();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to update supplier status.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage supplier records used for purchase orders and invoices.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}
      {importResult && importResult.errors.length > 0 && (
        <div className="fixed right-4 top-20 z-[9999] w-[calc(100%-2rem)] max-w-lg rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 shadow-lg sm:right-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {importResult.created_count === 0
                  ? "No new suppliers were imported"
                  : "Some supplier rows need attention"}
              </p>

              <p className="mt-1">{importResult.errors[0]?.message}</p>

              {importResult.errors.length > 1 && (
                <p className="mt-1 text-xs">
                  {importResult.errors.length - 1} more issue(s) are listed in
                  the import summary below.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setImportResult(null)}
              className="text-lg leading-none opacity-70 hover:opacity-100"
              aria-label="Dismiss import warning"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create Supplier</h2>

        <form
          onSubmit={handleCreateSupplier}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">
              Supplier Name
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              placeholder="e.g. ABC Office Supplies"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Contact Person
            </label>
            <input
              name="contact_person"
              value={formData.contact_person ?? ""}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              placeholder="e.g. Mary Wanjiku"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email ?? ""}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              placeholder="supplier@example.com"
            />
          </div>

          <div>
            <PhoneInputField
              label="Phone"
              value={phoneNumber}
              onChange={setPhoneNumber}
              error={phoneNumberError}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <textarea
              name="address"
              value={formData.address ?? ""}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              placeholder="Supplier address"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Supplier"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Import Suppliers from Excel
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload an .xlsx file to create multiple suppliers at once.
              Supported columns include supplier name, email, phone, address,
              and contact person.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold">Supported header examples</p>
          <p className="mt-1">
            Supplier name: name, supplier, supplier_name, supplier company,
            company name
          </p>
          <p>Email: email, supplier_email, email address</p>
          <p>Phone: phone, telephone, mobile, phone number</p>
        </div>

        <form
          onSubmit={handleImportSuppliers}
          className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">
              Excel file
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(event) => {
                setSelectedExcelFile(event.target.files?.[0] ?? null);
                setImportResult(null);
              }}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-blue/90"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isImporting}
              className="w-full whitespace-nowrap rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            >
              {isImporting ? "Importing..." : "Import Suppliers"}
            </button>
          </div>
        </form>

        {importResult && importResult.errors.length > 0 && (
          <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-semibold text-yellow-800">
              Some rows were not imported
            </p>

            <div className="mt-3 max-h-48 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-yellow-900">
                  <tr>
                    <th className="py-2 pr-4">Row</th>
                    <th className="py-2">Issue</th>
                  </tr>
                </thead>

                <tbody>
                  {importResult.errors.map((item) => (
                    <tr
                      key={`${item.row}-${item.message}`}
                      className="border-t border-yellow-200"
                    >
                      <td className="py-2 pr-4 font-medium text-yellow-900">
                        {item.row}
                      </td>
                      <td className="py-2 text-yellow-800">{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Supplier List</h2>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-gray-500">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">
            No suppliers found. Create your first supplier above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Supplier
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Contact Person
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Phone
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {supplier.name}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {supplier.contact_person || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {supplier.email || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {supplier.phone || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <SupplierStatusBadge isActive={supplier.is_active} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex justiify-end gap-2">
                        <Link
                          to={`/suppliers/${supplier.id}`}
                          className="rounded=lg bg-primary-blue px-4 py-2 text-xs font-semibold text-white hover:bg-primary-blue/90"
                        >
                          View
                        </Link>
                        <Link
                          to={`/suppliers/${supplier.id}#portal-users`}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-primary-blue bg-primary-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-blue/90"
                        >
                          Portal Users
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleSupplier(supplier)}
                          className="rounded-lg border px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {supplier.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SuppliersPage;
