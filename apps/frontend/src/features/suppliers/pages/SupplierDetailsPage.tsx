import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
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
import StatusBadge from "../../../components/ui/StatusBadge";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
} from "../../../components/ui/tableStickyStyles";

import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { getStoredUser, userHasPermission } from "../../../utils/permissions";

import {
  activateSupplier,
  activateSupplierUser,
  createSupplierUser,
  deactivateSupplier,
  deactivateSupplierUser,
  getSupplierById,
  getSupplierUsers,
  resendSupplierSetupLink,
  updateSupplier,
} from "../api/supplierApi";
import SupplierStatusBadge from "../components/SupplierStatusBadge";
import type {
  Supplier,
  SupplierUpdatePayload,
  SupplierUser,
} from "../types/supplier.types";

const emptyForm: SupplierUpdatePayload = {
  name: "",
  email: "",
  phone: "",
  address: "",
  contact_person: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSupplierUserStatus(user: SupplierUser) {
  if (!user.is_active) {
    return { label: "Inactive", variant: "danger" as const };
  }

  if (!user.has_completed_onboarding) {
    return { label: "Pending setup", variant: "warning" as const };
  }

  return { label: "Active", variant: "success" as const };
}

function getApiErrorMessage(error: any, fallback: string) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (detail?.message) {
    return `${detail.message}${detail.instructions ? ` ${detail.instructions}` : ""}`;
  }

  return fallback;
}

function SupplierDetailsPage() {
  const { supplierId } = useParams<{ supplierId: string }>();

  const currentUser = getStoredUser();

  const isAdminUser =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true;

  const canViewSuppliers = isAdminUser || userHasPermission("suppliers.view");

  const canUpdateSuppliers =
    isAdminUser || userHasPermission("suppliers.update");

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierUpdatePayload>(emptyForm);
  const [supplierUsers, setSupplierUsers] = useState<SupplierUser[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingPortalUser, setIsCreatingPortalUser] = useState(false);

  const [portalEmail, setPortalEmail] = useState("");
  const [error, setError] = useState("");

  const [supplierToToggleStatus, setSupplierToToggleStatus] =
    useState<Supplier | null>(null);
  const [supplierUserToToggleStatus, setSupplierUserToToggleStatus] =
    useState<SupplierUser | null>(null);
  const [supplierUserToResendSetup, setSupplierUserToResendSetup] =
    useState<SupplierUser | null>(null);
  const [selectedMobileSupplierUser, setSelectedMobileSupplierUser] =
    useState<SupplierUser | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState("");

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  async function loadSupplier() {
    if (!supplierId) return;

    if (!canViewSuppliers) {
      setIsLoading(false);
      setError("You do not have permission to view suppliers.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const supplierData = await getSupplierById(supplierId);

      let usersData: SupplierUser[] = [];

      if (isAdminUser) {
        usersData = await getSupplierUsers(supplierId);
      }

      setSupplier(supplierData);
      setSupplierUsers(usersData);
      setFormData({
        name: supplierData.name,
        email: supplierData.email || "",
        phone: supplierData.phone || "",
        address: supplierData.address || "",
        contact_person: supplierData.contact_person || "",
      });
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to load supplier details."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSupplier();
  }, [supplierId, canViewSuppliers]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supplierId) return;

    if (!canUpdateSuppliers) {
      showAlert("error", "You do not have permission to update suppliers.");
      return;
    }

    if (!formData.name?.trim()) {
      showAlert("error", "Supplier name is required.");
      return;
    }

    try {
      setIsSaving(true);

      const updatedSupplier = await updateSupplier(supplierId, {
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        contact_person: formData.contact_person?.trim() || null,
      });

      setSupplier(updatedSupplier);
      setIsEditing(false);
      showAlert("success", "Supplier updated successfully.");
    } catch (err: any) {
      showAlert("error", getApiErrorMessage(err, "Failed to update supplier."));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmToggleSupplierStatus() {
    if (!supplierToToggleStatus) return;

    if (!canUpdateSuppliers) {
      setConfirmError("You do not have permission to update suppliers.");
      return;
    }

    try {
      setActionId(supplierToToggleStatus.id);

      const updatedSupplier = supplierToToggleStatus.is_active
        ? await deactivateSupplier(supplierToToggleStatus.id)
        : await activateSupplier(supplierToToggleStatus.id);

      setSupplier(updatedSupplier);
      setSupplierToToggleStatus(null);
      setConfirmError("");

      showAlert(
        "success",
        updatedSupplier.is_active
          ? "Supplier activated successfully."
          : "Supplier deactivated successfully.",
      );
    } catch (err: any) {
      setConfirmError(
        getApiErrorMessage(err, "Failed to update supplier status."),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleCreateSupplierUser(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!supplierId) return;

    if (!canUpdateSuppliers) {
      showAlert(
        "error",
        "You do not have permission to manage supplier portal users.",
      );
      return;
    }

    const trimmedEmail = portalEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      showAlert("error", "Supplier portal email is required.");
      return;
    }

    try {
      setIsCreatingPortalUser(true);

      const createdUser = await createSupplierUser({
        supplier_id: supplierId,
        email: trimmedEmail,
      });

      setSupplierUsers((current) => [createdUser, ...current]);
      setPortalEmail("");

      showAlert(
        "success",
        "Supplier portal user created successfully. A setup link has been sent by email.",
      );
    } catch (err: any) {
      showAlert(
        "error",
        getApiErrorMessage(err, "Failed to create supplier portal user."),
      );
    } finally {
      setIsCreatingPortalUser(false);
    }
  }

  async function confirmToggleSupplierUserStatus() {
    if (!supplierId || !supplierUserToToggleStatus) return;

    if (!canUpdateSuppliers) {
      setConfirmError(
        "You do not have permission to manage supplier portal users.",
      );
      return;
    }

    try {
      setActionId(supplierUserToToggleStatus.id);

      const updatedUser = supplierUserToToggleStatus.is_active
        ? await deactivateSupplierUser(
            supplierUserToToggleStatus.id,
            supplierId,
          )
        : await activateSupplierUser(supplierUserToToggleStatus.id, supplierId);

      setSupplierUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );

      setSupplierUserToToggleStatus(null);
      setConfirmError("");

      showAlert(
        "success",
        updatedUser.is_active
          ? "Supplier portal user activated."
          : "Supplier portal user deactivated.",
      );
    } catch (err: any) {
      setConfirmError(
        getApiErrorMessage(
          err,
          "Failed to update supplier portal user status.",
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  function toggleMobileSupplierUserActions(user: SupplierUser) {
    setSelectedMobileSupplierUser((current) =>
      current?.id === user.id ? null : user,
    );
  }

  function handleResendSetupLink(user: SupplierUser) {
    setConfirmError("");
    setSupplierUserToResendSetup(user);
  }

  async function confirmResendSetupLink() {
    if (!supplierId || !supplierUserToResendSetup) return;

    if (!canUpdateSuppliers) {
      setConfirmError(
        "You do not have permission to manage supplier portal users.",
      );
      return;
    }

    try {
      setActionId(supplierUserToResendSetup.id);

      const updatedUser = await resendSupplierSetupLink(
        supplierUserToResendSetup.id,
        supplierId,
      );

      setSupplierUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );

      setSupplierUserToResendSetup(null);
      setConfirmError("");

      showAlert("success", "A new setup link has been sent to the supplier.");
    } catch (err: any) {
      setConfirmError(
        getApiErrorMessage(err, "Failed to resend supplier setup link."),
      );
    } finally {
      setActionId(null);
    }
  }

  if (isLoading) return <LoadingState message="Loading supplier..." />;

  if (error && !supplier) {
    return (
      <PageContainer className="module-theme module-suppliers">
        <BackButton fallbackLabel="Back to Suppliers" fallbackTo="/suppliers" />
        <ErrorState message={error} />
      </PageContainer>
    );
  }

  if (!supplier) {
    return (
      <PageContainer className="module-theme module-suppliers">
        <BackButton fallbackLabel="Back to Suppliers" fallbackTo="/suppliers" />
        <EmptyState
          title="Supplier not found"
          message="This supplier could not be found."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="module-theme module-suppliers">
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
        isLoading={actionId === supplierToToggleStatus?.id}
        errorMessage={confirmError}
        onConfirm={confirmToggleSupplierStatus}
        onCancel={() => {
          setSupplierToToggleStatus(null);
          setConfirmError("");
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(supplierUserToToggleStatus)}
        title={
          supplierUserToToggleStatus?.is_active
            ? "Deactivate supplier portal user"
            : "Activate supplier portal user"
        }
        message={`${supplierUserToToggleStatus?.is_active ? "Deactivate" : "Activate"} supplier portal user "${supplierUserToToggleStatus?.email}"?`}
        confirmLabel={
          supplierUserToToggleStatus?.is_active ? "Deactivate" : "Activate"
        }
        variant={supplierUserToToggleStatus?.is_active ? "warning" : "info"}
        isLoading={actionId === supplierUserToToggleStatus?.id}
        errorMessage={confirmError}
        onConfirm={confirmToggleSupplierUserStatus}
        onCancel={() => {
          setSupplierUserToToggleStatus(null);
          setConfirmError("");
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(supplierUserToResendSetup)}
        title="Resend setup link"
        message={`Resend setup link to "${supplierUserToResendSetup?.email}"? The new link will be valid for 24 hours.`}
        confirmLabel="Resend"
        variant="info"
        isLoading={actionId === supplierUserToResendSetup?.id}
        errorMessage={confirmError}
        onConfirm={confirmResendSetupLink}
        onCancel={() => {
          setSupplierUserToResendSetup(null);
          setConfirmError("");
        }}
      />

      <Card className="flex flex-col gap-4 p-4 shadow-md sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-3">
            <BackButton
              fallbackLabel="Back to Suppliers"
              fallbackTo="/suppliers"
            />
          </div>

          <h1 className="mt-3 break-words text-2xl font-semibold text-primary-black">
            {supplier.name}
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            Supplier profile, contact information, and supplier portal access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
          <SupplierStatusBadge isActive={supplier.is_active} />

          <span className="text-sm text-primary-gray">
            Created {formatDate(supplier.created_at)}
          </span>

          {canUpdateSuppliers && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing((current) => !current)}
              >
                {isEditing ? "Cancel Edit" : "Edit Supplier"}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setConfirmError("");
                  setSupplierToToggleStatus(supplier);
                }}
              >
                {supplier.is_active ? "Deactivate" : "Activate"}
              </Button>
            </>
          )}
        </div>
      </Card>

      {isEditing && canUpdateSuppliers ? (
        <Card className="p-4 shadow-md sm:p-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-primary-black">
                Edit Supplier
              </h2>
              <p className="mt-1 text-sm text-primary-gray">
                Update supplier contact and profile information.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Supplier Name"
                name="name"
                value={formData.name ?? ""}
                onChange={handleChange}
              />

              <Input
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person ?? ""}
                onChange={handleChange}
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email ?? ""}
                onChange={handleChange}
              />

              <Input
                label="Phone"
                name="phone"
                value={formData.phone ?? ""}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary-black">
                  Address / Location
                </label>
                <textarea
                  name="address"
                  value={formData.address ?? ""}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-4 shadow-md sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Supplier Information
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
                Supplier Name
              </p>
              <p className="mt-1 break-words text-sm font-semibold text-primary-black">
                {supplier.name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
                Contact Person
              </p>
              <p className="mt-1 text-sm text-primary-black">
                {supplier.contact_person || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
                Email
              </p>
              <p className="mt-1 break-words text-sm text-primary-black">
                {supplier.email || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
                Phone
              </p>
              <p className="mt-1 text-sm text-primary-black">
                {supplier.phone || "-"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
                Address / Location
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-primary-black">
                {supplier.address || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
                Created At
              </p>
              <p className="mt-1 text-sm text-primary-black">
                {formatDate(supplier.created_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
                Updated At
              </p>
              <p className="mt-1 text-sm text-primary-black">
                {formatDate(supplier.updated_at)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {isAdminUser && (
        <Card id="portal-users" className="p-4 shadow-md sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-black">
                Supplier Portal Users
              </h2>
              <p className="mt-1 text-sm text-primary-gray">
                Create and manage login access for this supplier.
              </p>
            </div>

            <p className="text-sm text-primary-gray">
              {supplierUsers.length} users
            </p>
          </div>

          <form
            onSubmit={handleCreateSupplierUser}
            className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]"
          >
            <Input
              label="Supplier User Email"
              type="email"
              value={portalEmail}
              onChange={(event) => setPortalEmail(event.target.value)}
              placeholder="supplier@example.com"
            />

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isCreatingPortalUser}
                className="w-full whitespace-nowrap"
              >
                {isCreatingPortalUser ? "Creating..." : "Create Portal User"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            {supplierUsers.length === 0 ? (
              <EmptyState
                title="No portal users"
                message="No portal users have been created for this supplier yet."
              />
            ) : (
              <TableWrapper minWidth="900px">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th
                        className={`${stickyLeftHeader} w-[38%] whitespace-nowrap px-4 py-3`}
                      >
                        Email
                      </th>
                      <th className="w-[18%] whitespace-nowrap px-4 py-3">
                        Status
                      </th>
                      <th className="w-[18%] whitespace-nowrap px-4 py-3">
                        Created
                      </th>
                      <th className="hidden w-[26%] whitespace-nowrap px-4 py-3 text-right lg:table-cell">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {supplierUsers.map((user) => {
                      const status = getSupplierUserStatus(user);
                      const isActionLoading = actionId === user.id;

                      return (
                        <tr key={user.id} className="group hover:bg-gray-50">
                          <td
                            className={`${stickyLeftCell} px-4 py-3 text-primary-black`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggleMobileSupplierUserActions(user)
                              }
                              className="block max-w-[260px] truncate text-left lg:pointer-events-none"
                              title="Tap to show actions"
                            >
                              {user.email}
                            </button>
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge variant={status.variant}>
                              {status.label}
                            </StatusBadge>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                            {formatDate(user.created_at)}
                          </td>

                          <td className="hidden px-4 py-3 lg:table-cell">
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              {!user.has_completed_onboarding &&
                                user.is_active && (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleResendSetupLink(user)}
                                    disabled={isActionLoading}
                                  >
                                    {isActionLoading ? "Sending..." : "Resend"}
                                  </Button>
                                )}

                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setConfirmError("");
                                  setSupplierUserToToggleStatus(user);
                                }}
                                disabled={isActionLoading}
                              >
                                {user.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrapper>
            )}

            <MobileFloatingTableAction
              isOpen={Boolean(selectedMobileSupplierUser)}
              reference={selectedMobileSupplierUser?.email ?? ""}
              label="Selected supplier portal user"
              onClose={() => setSelectedMobileSupplierUser(null)}
            >
              {selectedMobileSupplierUser && (
                <>
                  {!selectedMobileSupplierUser.has_completed_onboarding &&
                    selectedMobileSupplierUser.is_active && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleResendSetupLink(selectedMobileSupplierUser)
                        }
                        disabled={actionId === selectedMobileSupplierUser.id}
                      >
                        {actionId === selectedMobileSupplierUser.id
                          ? "Sending..."
                          : "Resend"}
                      </Button>
                    )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setConfirmError("");
                      setSupplierUserToToggleStatus(selectedMobileSupplierUser);
                    }}
                    disabled={actionId === selectedMobileSupplierUser.id}
                  >
                    {selectedMobileSupplierUser.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </Button>
                </>
              )}
            </MobileFloatingTableAction>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

export default SupplierDetailsPage;
