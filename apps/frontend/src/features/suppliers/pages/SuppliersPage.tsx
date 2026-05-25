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
  importSuppliersFromExcel,
} from "../api/supplierApi";
import SupplierStatusBadge from "../components/SupplierStatusBadge";
import type {
  Supplier,
  SupplierCreatePayload,
  SupplierImportResult,
} from "../types/supplier.types";

const initialFormState: SupplierCreatePayload = {
  name: "",
  email: "",
  address: "",
  contact_person: "",
};

function getApiErrorMessage(error: any, fallback: string) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (detail?.message) {
    return `${detail.message}${detail.instructions ? ` ${detail.instructions}` : ""}`;
  }

  return fallback;
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

    if (!canCreateSuppliers) {
      showAlert("error", "You do not have permission to create suppliers.");
      return;
    }

    if (!formData.name.trim()) {
      showAlert("error", "Supplier name is required.");
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
      });

      setFormData(initialFormState);
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
                  Supported columns include supplier name, email, phone,
                  address, and contact person.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-semibold">Supported header examples</p>
                <p className="mt-1">
                  Supplier name: name, supplier, supplier_name, supplier
                  company, company name
                </p>
                <p>Email: email, supplier_email, email address</p>
                <p>Phone: phone, telephone, mobile, phone number</p>
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
                        <th
                          className={
                            canDeleteSuppliers
                              ? "w-[14%] whitespace-nowrap px-4 py-3"
                              : "w-[12%] whitespace-nowrap px-4 py-3"
                          }
                        >
                          Status
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
                        <tr
                          key={supplier.id}
                          className="group hover:bg-gray-50"
                        >
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

                          <td className="px-4 py-3">
                            <SupplierStatusBadge
                              isActive={supplier.is_active}
                            />
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
