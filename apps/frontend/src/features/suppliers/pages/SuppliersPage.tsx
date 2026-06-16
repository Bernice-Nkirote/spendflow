import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isValidPhoneNumber } from "react-phone-number-input";
import type { Value } from "react-phone-number-input";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import MobileFloatingTableAction from "../../../components/ui/MobileFloatingTableAction";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";
import PhoneInputField from "../../../components/ui/PhoneInputField";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
} from "../../../components/ui/tableStickyStyles";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { getStoredUser, userHasPermission } from "../../../utils/permissions";

import {
  activateSupplier,
  createSupplier,
  deactivateSupplier,
  deleteSupplier,
  getPaginatedSuppliers,
  getSupplierSummary,
  importSuppliersFromExcel,
} from "../api/supplierApi";
import SupplierStatusBadge from "../components/SupplierStatusBadge";
import type {
  Supplier,
  SupplierCreatePayload,
  SupplierImportResult,
  SupplierSummary,
} from "../types/supplier.types";

const initialFormState: SupplierCreatePayload = {
  name: "",
  email: "",
  address: "",
  contact_person: "",
  category: "",
  sub_category: "",
};

const supplierCategoryOptions = [
  "Electronics",
  "Technology",
  "Building Materials",
  "Catering Services",
  "Office Supplies",
  "Professional Services",
  "Transport and Logistics",
  "Maintenance",
  "Other",
];

function getApiErrorMessage(error: any, fallback: string) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (detail?.message) {
    return `${detail.message}${detail.instructions ? ` ${detail.instructions}` : ""}`;
  }

  return fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 2,
  }).format(value);
}

function SuppliersPage() {
  const currentUser = getStoredUser();

  const isAdminUser =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true;

  const canViewSuppliers = isAdminUser || userHasPermission("suppliers.view");

  const canCreateSuppliers =
    isAdminUser || userHasPermission("suppliers.create");

  const canUpdateSuppliers =
    isAdminUser || userHasPermission("suppliers.update");

  const canDeleteSuppliers =
    isAdminUser || userHasPermission("suppliers.delete");

  const canImportSuppliers =
    isAdminUser || userHasPermission("suppliers.import");

  const hasRowActions =
    canViewSuppliers || canUpdateSuppliers || canDeleteSuppliers;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] =
    useState<SupplierCreatePayload>(initialFormState);
  const [customCategory, setCustomCategory] = useState("");

  const [phoneNumber, setPhoneNumber] = useState<Value | undefined>(undefined);
  const [phoneNumberError, setPhoneNumberError] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [importResult, setImportResult] = useState<SupplierImportResult | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [supplierToToggleStatus, setSupplierToToggleStatus] =
    useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );
  const [selectedMobileSupplier, setSelectedMobileSupplier] =
    useState<Supplier | null>(null);
  const [selectedDetailSupplier, setSelectedDetailSupplier] =
    useState<Supplier | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<
    "overview" | "history" | "contacts"
  >("overview");
  const [supplierSummaries, setSupplierSummaries] = useState<
    Record<string, SupplierSummary>
  >({});
  const [summaryLoadingId, setSummaryLoadingId] = useState<string | null>(null);
  const [summaryErrors, setSummaryErrors] = useState<Record<string, string>>(
    {},
  );
  const [actionSupplierId, setActionSupplierId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const skip = (page - 1) * pageSize;

  async function loadSupplierRecords() {
    if (!canViewSuppliers) {
      setRecordsLoading(false);
      return;
    }

    try {
      setRecordsLoading(true);
      setRecordsError(null);

      const response = await getPaginatedSuppliers({
        skip,
        limit: pageSize,
      });

      setSuppliers(response.rows);
      setTotalCount(response.total_count);
    } catch (err: any) {
      setRecordsError(getApiErrorMessage(err, "Failed to load suppliers."));
    } finally {
      setRecordsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialPage() {
      try {
        setInitialLoading(true);
        setError(null);

        if (!canViewSuppliers) {
          setRecordsLoading(false);
        }
      } finally {
        setInitialLoading(false);
      }
    }

    loadInitialPage();
  }, [canViewSuppliers]);

  useEffect(() => {
    loadSupplierRecords();
  }, [skip, pageSize, canViewSuppliers]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreateSuppliers) {
      showAlert("error", "You do not have permission to create suppliers.");
      return;
    }

    if (!formData.name.trim()) {
      showAlert("error", "Supplier name is required.");
      return;
    }

    if (formData.category === "Other" && !customCategory.trim()) {
      showAlert("error", "Please enter the supplier category.");
      return;
    }

    setPhoneNumberError("");

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      setPhoneNumberError("Enter a valid phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await createSupplier({
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: phoneNumber || null,
        address: formData.address?.trim() || null,
        contact_person: formData.contact_person?.trim() || null,
        category:
          formData.category === "Other"
            ? customCategory.trim()
            : formData.category?.trim() || null,
        sub_category: formData.sub_category?.trim() || null,
      });

      setFormData(initialFormState);
      setCustomCategory("");
      setPhoneNumber(undefined);
      setPage(1);

      showAlert("success", "Supplier created successfully.");
      await loadSupplierRecords();
    } catch (err: any) {
      showAlert("error", getApiErrorMessage(err, "Failed to create supplier."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImportSuppliers(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canImportSuppliers) {
      showAlert("error", "You do not have permission to import suppliers.");
      return;
    }

    if (!selectedExcelFile) {
      showAlert("error", "Please select an Excel file to upload.");
      return;
    }

    if (!selectedExcelFile.name.toLowerCase().endsWith(".xlsx")) {
      showAlert("error", "Only .xlsx Excel files are supported.");
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      setImportResult(null);

      const result = await importSuppliersFromExcel(selectedExcelFile);

      setImportResult(result);
      setSelectedExcelFile(null);
      setPage(1);

      showAlert(
        result.failed_count > 0 ? "warning" : "success",
        `${result.created_count} supplier(s) imported successfully. ${result.failed_count} row(s) failed.`,
      );

      await loadSupplierRecords();
    } catch (err: any) {
      showAlert(
        "error",
        getApiErrorMessage(err, "Failed to import suppliers from Excel."),
      );
    } finally {
      setIsImporting(false);
    }
  }

  function toggleMobileSupplierActions(supplier: Supplier) {
    setSelectedMobileSupplier((current) =>
      current?.id === supplier.id ? null : supplier,
    );
  }

  async function openSupplierDetails(supplier: Supplier) {
    setSelectedDetailSupplier(supplier);
    setActiveDetailTab("overview");

    if (supplierSummaries[supplier.id]) {
      return;
    }

    try {
      setSummaryLoadingId(supplier.id);
      setSummaryErrors((current) => ({
        ...current,
        [supplier.id]: "",
      }));

      const summary = await getSupplierSummary(supplier.id);

      setSupplierSummaries((current) => ({
        ...current,
        [supplier.id]: summary,
      }));
    } catch (err: any) {
      setSummaryErrors((current) => ({
        ...current,
        [supplier.id]: getApiErrorMessage(
          err,
          "Failed to load supplier summary.",
        ),
      }));
    } finally {
      setSummaryLoadingId(null);
    }
  }

  function handleToggleSupplier(supplier: Supplier) {
    setConfirmError("");
    setSupplierToToggleStatus(supplier);
  }

  async function confirmToggleSupplierStatus() {
    if (!supplierToToggleStatus) return;

    if (!canUpdateSuppliers) {
      setConfirmError("You do not have permission to update suppliers.");
      return;
    }

    try {
      setActionSupplierId(supplierToToggleStatus.id);
      setRecordsError(null);

      if (supplierToToggleStatus.is_active) {
        await deactivateSupplier(supplierToToggleStatus.id);
        showAlert("success", "Supplier deactivated successfully.");
      } else {
        await activateSupplier(supplierToToggleStatus.id);
        showAlert("success", "Supplier activated successfully.");
      }

      setSupplierToToggleStatus(null);
      setConfirmError("");
      await loadSupplierRecords();
    } catch (err: any) {
      setConfirmError(
        getApiErrorMessage(err, "Failed to update supplier status."),
      );
    } finally {
      setActionSupplierId(null);
    }
  }

  function handleDeleteSupplier(supplier: Supplier) {
    setConfirmError("");
    setSupplierToDelete(supplier);
  }

  async function confirmDeleteSupplier() {
    if (!supplierToDelete) return;

    if (!canDeleteSuppliers) {
      setConfirmError("You do not have permission to delete suppliers.");
      return;
    }

    try {
      setActionSupplierId(supplierToDelete.id);
      setRecordsError(null);

      await deleteSupplier(supplierToDelete.id);

      setSupplierToDelete(null);
      setConfirmError("");
      setPage(1);

      showAlert("success", "Supplier deleted successfully.");
      await loadSupplierRecords();
    } catch (err: any) {
      setConfirmError(getApiErrorMessage(err, "Failed to delete supplier."));
    } finally {
      setActionSupplierId(null);
    }
  }

  const selectedSummary = selectedDetailSupplier
    ? supplierSummaries[selectedDetailSupplier.id]
    : undefined;

  const selectedSummaryError = selectedDetailSupplier
    ? summaryErrors[selectedDetailSupplier.id]
    : "";

  return (
    <PageContainer>
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(supplierToToggleStatus)}
        title={
          supplierToToggleStatus?.is_active
            ? "Deactivate supplier"
            : "Activate supplier"
        }
        message={`${supplierToToggleStatus?.is_active ? "Deactivate" : "Activate"} supplier "${supplierToToggleStatus?.name}"?`}
        confirmLabel={
          supplierToToggleStatus?.is_active ? "Deactivate" : "Activate"
        }
        variant={supplierToToggleStatus?.is_active ? "warning" : "info"}
        isLoading={actionSupplierId === supplierToToggleStatus?.id}
        errorMessage={confirmError}
        onConfirm={confirmToggleSupplierStatus}
        onCancel={() => {
          setSupplierToToggleStatus(null);
          setConfirmError("");
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(supplierToDelete)}
        title="Delete supplier"
        message={`Delete supplier "${supplierToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={actionSupplierId === supplierToDelete?.id}
        errorMessage={confirmError}
        onConfirm={confirmDeleteSupplier}
        onCancel={() => {
          setSupplierToDelete(null);
          setConfirmError("");
        }}
      />

      {selectedDetailSupplier && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close supplier details"
            className="absolute inset-0 bg-primary-black/50 backdrop-blur-[1px]"
            onClick={() => setSelectedDetailSupplier(null)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-primary-blue">
                    Supplier details
                  </p>
                  <h2 className="mt-1 text-2xl font-bold leading-tight text-primary-black">
                    {selectedDetailSupplier.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-primary-blue">
                      {selectedSummary?.category ||
                        selectedDetailSupplier.category ||
                        "Uncategorised"}
                    </span>
                    {(selectedSummary?.sub_category ||
                      selectedDetailSupplier.sub_category) && (
                      <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-primary-black">
                        {selectedSummary?.sub_category ||
                          selectedDetailSupplier.sub_category}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDetailSupplier(null)}
                >
                  Close
                </Button>
              </div>

              <div className="mt-6 flex rounded-lg border border-gray-200 bg-white p-1">
                {(["overview", "history", "contacts"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveDetailTab(tab)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${
                      activeDetailTab === tab
                        ? "bg-primary-blue text-white shadow-sm"
                        : "text-primary-gray hover:bg-gray-50 hover:text-primary-black"
                    }`}
                  >
                    {tab === "history" ? "Supply History" : tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {summaryLoadingId === selectedDetailSupplier.id ? (
                <LoadingState message="Loading supplier details..." />
              ) : selectedSummaryError ? (
                <ErrorState message={selectedSummaryError} />
              ) : activeDetailTab === "overview" ? (
                <div className="space-y-6">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                    <h3 className="text-sm font-semibold text-primary-blue">
                      What They Supply
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSummary?.supplies.length ? (
                        selectedSummary.supplies.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-primary-blue"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-primary-gray">
                          No supplied items recorded yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase text-primary-gray">
                        Primary Category
                      </p>
                      <p className="mt-1 text-sm font-semibold text-primary-black">
                        {selectedSummary?.category ||
                          selectedDetailSupplier.category ||
                          "Uncategorised"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase text-primary-gray">
                        Sub-category
                      </p>
                      <p className="mt-1 text-sm font-semibold text-primary-black">
                        {selectedSummary?.sub_category ||
                          selectedDetailSupplier.sub_category ||
                          "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
                      <p className="text-xs font-semibold uppercase text-primary-gray">
                        Location
                      </p>
                      <p className="mt-1 text-sm text-primary-black">
                        {selectedSummary?.location ||
                          selectedDetailSupplier.address ||
                          "No location recorded."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeDetailTab === "history" ? (
                <div>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-primary-black">
                        Recent Supply History
                      </h3>
                      <p className="mt-1 text-sm text-primary-gray">
                        Top 6 recent PO line items supplied by this vendor.
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary-blue">
                      Auto-updated
                    </span>
                  </div>

                  {selectedSummary?.recent_supplied_items.length ? (
                    <div className="space-y-3">
                      {selectedSummary.recent_supplied_items.map((item) => (
                        <div
                          key={`${item.po_id}-${item.item_name}`}
                          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-primary-black">
                                {item.item_name}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-primary-gray">
                                <span className="rounded-full bg-gray-100 px-2 py-1">
                                  Qty {formatMoney(item.quantity)}
                                </span>
                                <span className="rounded-full bg-gray-100 px-2 py-1">
                                  Unit {formatMoney(item.unit_price)}
                                </span>
                                <span className="rounded-full bg-gray-100 px-2 py-1">
                                  Total {formatMoney(item.total_price)}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 text-left sm:text-right">
                              <Link
                                to={`/purchase-orders/${item.po_id}`}
                                className="text-sm font-semibold text-primary-blue hover:underline"
                                onClick={() => setSelectedDetailSupplier(null)}
                              >
                                {item.po_number}
                              </Link>
                              <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
                                  {item.po_status}
                                </span>
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-primary-gray">
                                  {formatDate(item.supplied_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No supply history"
                      message="PO line items for this supplier will appear here automatically."
                    />
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-primary-gray">
                      Contact Person
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-black">
                      {selectedSummary?.contact_person ||
                        selectedDetailSupplier.contact_person ||
                        "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-primary-gray">
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-black">
                      {selectedSummary?.phone ||
                        selectedDetailSupplier.phone ||
                        "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-primary-gray">
                      Email
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-black">
                      {selectedSummary?.email ||
                        selectedDetailSupplier.email ||
                        "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-primary-gray">
                      Address
                    </p>
                    <p className="mt-1 text-sm text-primary-black">
                      {selectedSummary?.location ||
                        selectedDetailSupplier.address ||
                        "No address recorded."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <PageHeader
        title="Suppliers"
        description="Manage supplier records, import supplier data, and create supplier portal access."
      />

      {initialLoading && <LoadingState />}

      {!initialLoading && error && <ErrorState message={error} />}

      {!initialLoading && !error && !canViewSuppliers && (
        <ErrorState message="You do not have permission to view suppliers." />
      )}

      {!initialLoading && !error && canViewSuppliers && (
        <>
          {canCreateSuppliers && (
            <Card>
              <form onSubmit={handleCreateSupplier} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-primary-black">
                    Create Supplier
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Add a supplier that can be used for purchase orders and
                    invoices.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Supplier Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. ABC Office Supplies"
                  />

                  <Input
                    label="Contact Person"
                    name="contact_person"
                    value={formData.contact_person ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. Mary Wanjiku"
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email ?? ""}
                    onChange={handleChange}
                    placeholder="supplier@example.com"
                  />

                  <PhoneInputField
                    label="Phone"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    error={phoneNumberError}
                  />

                  <div>
                    <label className="block text-sm font-medium text-primary-black">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category ?? ""}
                      onChange={(event) => {
                        handleChange(event);
                        if (event.target.value !== "Other") {
                          setCustomCategory("");
                        }
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                    >
                      <option value="">Select category</option>
                      {supplierCategoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.category === "Other" && (
                    <Input
                      label="Custom Category"
                      name="customCategory"
                      value={customCategory}
                      onChange={(event) =>
                        setCustomCategory(event.target.value)
                      }
                      placeholder="e.g. Medical Supplies"
                    />
                  )}

                  <Input
                    label="Sub-category"
                    name="sub_category"
                    value={formData.sub_category ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. Laptops, Cement, Event meals"
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-primary-black">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address ?? ""}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                      placeholder="Supplier address"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? "Creating..." : "Create Supplier"}
                </Button>
              </form>
            </Card>
          )}

          {canImportSuppliers && (
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-primary-black">
                  Import Suppliers from Excel
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Upload an .xlsx file to create multiple suppliers at once.
                  Supported columns include supplier name, category,
                  sub-category, email, phone, address, and contact person.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5 text-sm text-blue-900">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Recommended Excel headers</p>
                    <p className="mt-1 text-blue-800">
                      Use these columns to import cleaner supplier records.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-blue">
                    .xlsx only
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    ["Supplier name", "name, supplier, supplier_name"],
                    ["Category", "category, supplier category, service type"],
                    ["Sub-category", "sub_category, specialization"],
                    ["Email", "email, supplier_email, email address"],
                    ["Phone", "phone, telephone, mobile, phone number"],
                    ["Location", "address, location, physical address"],
                    ["Contact person", "contact_person, representative"],
                  ].map(([label, examples]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-blue-100 bg-white px-3 py-2"
                    >
                      <p className="text-xs font-semibold uppercase text-primary-blue">
                        {label}
                      </p>
                      <p className="mt-1 text-xs text-primary-gray">
                        {examples}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleImportSuppliers}
                className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]"
              >
                <div>
                  <label className="block text-sm font-medium text-primary-black">
                    Excel file
                  </label>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={(event) => {
                      setSelectedExcelFile(event.target.files?.[0] ?? null);
                      setImportResult(null);
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-blue/90"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={isImporting}
                    className="w-full whitespace-nowrap lg:w-auto"
                  >
                    {isImporting ? "Importing..." : "Import Suppliers"}
                  </Button>
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
                            <td className="py-2 text-yellow-800">
                              {item.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-black">
                Supplier List
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Review supplier records, portal access, and supplier status.
              </p>
            </div>

            {recordsLoading && suppliers.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating suppliers...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : suppliers.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No suppliers found"
                message="Create your first supplier and they will appear here."
              />
            ) : (
              <>
                <TableWrapper
                  minWidth={canDeleteSuppliers ? "1350px" : "1150px"}
                >
                  <table className="w-full table-fixed text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th
                          className={`${stickyLeftHeader} w-[18%] whitespace-nowrap px-4 py-3`}
                        >
                          Supplier
                        </th>
                        <th className="w-[16%] whitespace-nowrap px-4 py-3">
                          Contact Person
                        </th>
                        <th className="w-[20%] whitespace-nowrap px-4 py-3">
                          Email
                        </th>
                        <th className="w-[14%] whitespace-nowrap px-4 py-3">
                          Phone
                        </th>
                        <th className="w-[14%] whitespace-nowrap px-4 py-3">
                          Category
                        </th>
                        <th
                          className={
                            canDeleteSuppliers
                              ? "w-[10%] whitespace-nowrap px-4 py-3"
                              : "w-[12%] whitespace-nowrap px-4 py-3"
                          }
                        >
                          Status
                        </th>
                        <th className="w-[10%] whitespace-nowrap px-4 py-3">
                          More
                        </th>
                        {hasRowActions && (
                          <th
                            className={
                              canDeleteSuppliers
                                ? "hidden w-[28%] whitespace-nowrap px-4 py-3 text-right lg:table-cell"
                                : "hidden w-[20%] whitespace-nowrap px-4 py-3 text-right lg:table-cell"
                            }
                          >
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {suppliers.map((supplier) => (
                        <tr key={supplier.id} className="group hover:bg-gray-50">
                          <td
                            className={`${stickyLeftCell} px-4 py-3 font-medium text-primary-black`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggleMobileSupplierActions(supplier)
                              }
                              className="block max-w-[260px] truncate text-left lg:pointer-events-none"
                              title="Tap to show actions"
                            >
                              {supplier.name}
                            </button>
                          </td>

                          <td className="px-4 py-3 text-primary-black">
                            <span
                              className="block truncate"
                              title={supplier.contact_person ?? ""}
                            >
                              {supplier.contact_person || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-primary-black">
                            <span
                              className="block truncate"
                              title={supplier.email ?? ""}
                            >
                              {supplier.email || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-primary-black">
                            {supplier.phone || "-"}
                          </td>

                          <td className="px-4 py-3 text-primary-black">
                            <span
                              className="block truncate"
                              title={supplier.category ?? ""}
                            >
                              {supplier.category || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <SupplierStatusBadge
                              isActive={supplier.is_active}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => openSupplierDetails(supplier)}
                            >
                              More
                            </Button>
                          </td>

                          {hasRowActions && (
                            <td className="hidden px-4 py-3 lg:table-cell">
                              <div
                                className={
                                  canDeleteSuppliers
                                    ? "flex min-w-max justify-end gap-3 whitespace-nowrap"
                                    : "flex justify-end gap-2 whitespace-nowrap"
                                }
                              >
                                {canViewSuppliers && (
                                  <Link
                                    to={`/suppliers/${supplier.id}`}
                                    state={{
                                      from: "suppliers",
                                      label: "Back to Suppliers",
                                      to: "/suppliers",
                                    }}
                                  >
                                    <Button type="button" size="sm">
                                      View
                                    </Button>
                                  </Link>
                                )}
                                {canUpdateSuppliers && (
                                  <>
                                    {isAdminUser && (
                                      <Link
                                        to={`/suppliers/${supplier.id}#portal-users`}
                                        state={{
                                          from: "suppliers",
                                          label: "Back to Suppliers",
                                          to: "/suppliers",
                                        }}
                                      >
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                        >
                                          Portal Users
                                        </Button>
                                      </Link>
                                    )}

                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        handleToggleSupplier(supplier)
                                      }
                                      disabled={
                                        actionSupplierId === supplier.id
                                      }
                                    >
                                      {supplier.is_active
                                        ? "Deactivate"
                                        : "Activate"}
                                    </Button>
                                  </>
                                )}
                                {canDeleteSuppliers && (
                                  <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteSupplier(supplier)
                                    }
                                    disabled={actionSupplierId === supplier.id}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrapper>

                <MobileFloatingTableAction
                  isOpen={Boolean(selectedMobileSupplier)}
                  reference={selectedMobileSupplier?.name ?? ""}
                  label="Selected supplier"
                  onClose={() => setSelectedMobileSupplier(null)}
                >
                  {selectedMobileSupplier && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          openSupplierDetails(selectedMobileSupplier);
                          setSelectedMobileSupplier(null);
                        }}
                      >
                        More
                      </Button>

                      {canViewSuppliers && (
                        <Link
                          to={`/suppliers/${selectedMobileSupplier.id}`}
                          state={{
                            from: "suppliers",
                            label: "Back to Suppliers",
                            to: "/suppliers",
                          }}
                        >
                          <Button type="button" size="sm">
                            View
                          </Button>
                        </Link>
                      )}

                      {canUpdateSuppliers && (
                        <>
                          {isAdminUser && (
                            <Link
                              to={`/suppliers/${selectedMobileSupplier.id}#portal-users`}
                              state={{
                                from: "suppliers",
                                label: "Back to Suppliers",
                                to: "/suppliers",
                              }}
                            >
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                              >
                                Portal Users
                              </Button>
                            </Link>
                          )}

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleToggleSupplier(selectedMobileSupplier)
                            }
                            disabled={
                              actionSupplierId === selectedMobileSupplier.id
                            }
                          >
                            {selectedMobileSupplier.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </Button>
                        </>
                      )}

                      {canDeleteSuppliers && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleDeleteSupplier(selectedMobileSupplier)
                          }
                          disabled={
                            actionSupplierId === selectedMobileSupplier.id
                          }
                        >
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </MobileFloatingTableAction>

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={setPage}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize);
                    setPage(1);
                  }}
                />
              </>
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
}

export default SuppliersPage;
