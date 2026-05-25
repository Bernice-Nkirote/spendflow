import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
import StatusBadge from "../../../components/ui/StatusBadge";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
} from "../../../components/ui/tableStickyStyles";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { getStoredUser, userHasPermission } from "../../../utils/permissions";

import { currencyOptions } from "../../../utils/currencyOptions";

import {
  createExchangeRate,
  deleteExchangeRate,
  getPaginatedExchangeRates,
  updateExchangeRate,
} from "../api/exchangeRateApi";
import type { ExchangeRate } from "../types/exchangeRate.types";

function getPositiveNumberFromSearchParam(
  value: string | null,
  fallback: number,
) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

function ExchangeRatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = getPositiveNumberFromSearchParam(searchParams.get("page"), 1);
  const pageSize = getPositiveNumberFromSearchParam(
    searchParams.get("page_size"),
    10,
  );
  const skip = (page - 1) * pageSize;
  const currentUser = getStoredUser();

  const isAdminUser =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true;

  const canViewExchangeRates =
    isAdminUser || userHasPermission("exchange_rates.view");

  const canCreateExchangeRates =
    isAdminUser || userHasPermission("exchange_rates.create");

  const canUpdateExchangeRates =
    isAdminUser || userHasPermission("exchange_rates.update");

  const canDeleteExchangeRates =
    isAdminUser || userHasPermission("exchange_rates.delete");

  const canManageExchangeRates =
    canCreateExchangeRates || canUpdateExchangeRates;

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [rate, setRate] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [actionRateId, setActionRateId] = useState<string | null>(null);

  const [rateToDelete, setRateToDelete] = useState<ExchangeRate | null>(null);
  const [selectedMobileExchangeRate, setSelectedMobileExchangeRate] =
    useState<ExchangeRate | null>(null);
  const [confirmError, setConfirmError] = useState("");

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  function updatePaginationSearchParams(
    nextPage: number,
    nextPageSize: number,
  ) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);

      nextParams.set("page", String(nextPage));
      nextParams.set("page_size", String(nextPageSize));

      return nextParams;
    });
  }

  function handlePageChange(nextPage: number) {
    updatePaginationSearchParams(nextPage, pageSize);
  }

  function handlePageSizeChange(nextPageSize: number) {
    updatePaginationSearchParams(1, nextPageSize);
  }

  async function loadExchangeRates(nextSkip = skip, nextLimit = pageSize) {
    if (!canViewExchangeRates) {
      setInitialLoading(false);
      setRecordsLoading(false);
      return;
    }
    try {
      setRecordsLoading(true);
      setRecordsError("");

      const response = await getPaginatedExchangeRates({
        skip: nextSkip,
        limit: nextLimit,
      });

      setExchangeRates(response.rows);
      setTotalCount(response.total_count);
    } catch (error) {
      setRecordsError(
        getApiErrorMessage(error, "Failed to load exchange rates."),
      );
    } finally {
      setRecordsLoading(false);
      setInitialLoading(false);
    }
  }

  async function resetToFirstPageAndReloadRates() {
    updatePaginationSearchParams(1, pageSize);
    await loadExchangeRates(0, pageSize);
  }

  useEffect(() => {
    loadExchangeRates();
  }, [skip, pageSize, canViewExchangeRates]);

  function resetForm() {
    setFromCurrency("");
    setToCurrency("");
    setRate("");
    setSource("MANUAL");
    setEffectiveDate("");
    setEditingRate(null);
  }

  function startEdit(exchangeRate: ExchangeRate) {
    setEditingRate(exchangeRate);
    setFromCurrency(exchangeRate.from_currency);
    setToCurrency(exchangeRate.to_currency);
    setRate(String(exchangeRate.rate));
    setSource(exchangeRate.source);
    setEffectiveDate(exchangeRate.effective_date);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingRate && !canUpdateExchangeRates) {
      showAlert(
        "error",
        "You do not have permission to update exchange rates.",
      );
      return;
    }

    if (!editingRate && !canCreateExchangeRates) {
      showAlert(
        "error",
        "You do not have permission to create exchange rates.",
      );
      return;
    }

    const normalizedFromCurrency = fromCurrency.trim().toUpperCase();
    const normalizedToCurrency = toCurrency.trim().toUpperCase();
    const normalizedSource = source.trim().toUpperCase() || "MANUAL";
    const numericRate = Number(rate);

    if (normalizedFromCurrency.length !== 3) {
      showAlert(
        "error",
        "From currency must be a 3-letter code, for example USD.",
      );
      return;
    }

    if (normalizedToCurrency.length !== 3) {
      showAlert(
        "error",
        "To currency must be a 3-letter code, for example KES.",
      );
      return;
    }

    if (normalizedFromCurrency === normalizedToCurrency) {
      showAlert("error", "From currency and to currency cannot be the same.");
      return;
    }

    if (!numericRate || numericRate <= 0) {
      showAlert("error", "Exchange rate must be greater than zero.");
      return;
    }

    if (!effectiveDate) {
      showAlert("error", "Effective date is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingRate) {
        await updateExchangeRate(editingRate.id, {
          rate: numericRate,
          source: normalizedSource,
          effective_date: effectiveDate,
        });

        showAlert("success", "Exchange rate updated successfully.");
      } else {
        await createExchangeRate({
          from_currency: normalizedFromCurrency,
          to_currency: normalizedToCurrency,
          rate: numericRate,
          source: normalizedSource,
          effective_date: effectiveDate,
        });

        showAlert("success", "Exchange rate created successfully.");
      }

      resetForm();
      await resetToFirstPageAndReloadRates();
    } catch (error) {
      showAlert(
        "error",
        getApiErrorMessage(error, "Failed to save exchange rate."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleMobileExchangeRateActions(exchangeRate: ExchangeRate) {
    setSelectedMobileExchangeRate((current) =>
      current?.id === exchangeRate.id ? null : exchangeRate,
    );
  }

  function handleDelete(exchangeRate: ExchangeRate) {
    if (!canDeleteExchangeRates) {
      showAlert(
        "error",
        "You do not have permission to delete exchange rates.",
      );
      return;
    }

    setConfirmError("");
    setRateToDelete(exchangeRate);
  }

  async function confirmDeleteExchangeRate() {
    if (!rateToDelete) return;

    try {
      setActionRateId(rateToDelete.id);

      await deleteExchangeRate(rateToDelete.id);

      showAlert("success", "Exchange rate deleted successfully.");

      setRateToDelete(null);
      setConfirmError("");

      await resetToFirstPageAndReloadRates();
    } catch (error) {
      setConfirmError(
        getApiErrorMessage(error, "Failed to delete exchange rate."),
      );
    } finally {
      setActionRateId(null);
    }
  }

  if (!canViewExchangeRates) {
    return (
      <PageContainer>
        <PageHeader
          title="Exchange Rates"
          description="Manage currency conversion rates used for approvals, reporting, and financial normalization."
        />

        <ErrorState message="You do not have permission to view exchange rates." />
      </PageContainer>
    );
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
        isOpen={Boolean(rateToDelete)}
        title="Delete exchange rate"
        message={`Delete ${rateToDelete?.from_currency} to ${rateToDelete?.to_currency} exchange rate for ${rateToDelete?.effective_date}?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={actionRateId === rateToDelete?.id}
        errorMessage={confirmError}
        onConfirm={confirmDeleteExchangeRate}
        onCancel={() => {
          setRateToDelete(null);
          setConfirmError("");
        }}
      />

      <PageHeader
        title="Exchange Rates"
        description="Manage currency conversion rates used for approvals, reporting, and financial normalization."
      />

      {initialLoading && <LoadingState message="Loading exchange rates..." />}

      {!initialLoading && (
        <>
          {canManageExchangeRates && (
            <Card>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-primary-black">
                    {editingRate ? "Edit exchange rate" : "Add exchange rate"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Configure rates used to convert transaction currencies into
                    the company base currency for approvals and reporting.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary-black">
                      From currency
                    </label>

                    <select
                      value={fromCurrency}
                      onChange={(event) => setFromCurrency(event.target.value)}
                      disabled={Boolean(editingRate)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="">Select currency</option>

                      {currencyOptions.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary-black">
                      To currency
                    </label>

                    <select
                      value={toCurrency}
                      onChange={(event) => setToCurrency(event.target.value)}
                      disabled={Boolean(editingRate)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="">Select currency</option>

                      {currencyOptions.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Rate"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    placeholder="129.50"
                    type="number"
                    min="0"
                    step="0.000001"
                  />

                  <Input
                    label="Effective date"
                    value={effectiveDate}
                    onChange={(event) => setEffectiveDate(event.target.value)}
                    type="date"
                  />

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="min-w-[100px]"
                    >
                      {isSaving
                        ? "Saving..."
                        : editingRate
                          ? "Update"
                          : "Create"}
                    </Button>

                    {editingRate && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetForm}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                <div className="max-w-sm">
                  <Input
                    label="Source"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    placeholder="MANUAL"
                    className="uppercase"
                  />
                </div>
              </form>
            </Card>
          )}
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-black">
                Exchange rate list
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Rates are used when PRs, POs, invoices, and payments are
                submitted for approval.
              </p>
            </div>

            {recordsLoading && exchangeRates.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating exchange rates...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : exchangeRates.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No exchange rates found"
                message="Add your first exchange rate before submitting foreign-currency transactions."
              />
            ) : recordsLoading && exchangeRates.length === 0 ? (
              <LoadingState message="Loading exchange rates..." />
            ) : (
              <>
                <TableWrapper minWidth="900px">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th
                          className={`${stickyLeftHeader} whitespace-nowrap px-4 py-3`}
                        >
                          Currency pair
                        </th>
                        <th className="px-4 py-3">Rate</th>
                        <th className="px-4 py-3">Effective date</th>
                        <th className="px-4 py-3">Source</th>
                        {(canUpdateExchangeRates || canDeleteExchangeRates) && (
                          <th className="hidden px-4 py-3 text-right lg:table-cell">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {exchangeRates.map((exchangeRate) => (
                        <tr
                          key={exchangeRate.id}
                          className="group hover:bg-gray-50"
                        >
                          <td
                            className={`${stickyLeftCell} whitespace-nowrap px-4 py-3 font-medium text-primary-black`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggleMobileExchangeRateActions(exchangeRate)
                              }
                              className="block max-w-[220px] text-left lg:pointer-events-none"
                              title="Tap to show actions"
                            >
                              {exchangeRate.from_currency} →{" "}
                              {exchangeRate.to_currency}
                            </button>
                          </td>

                          <td className="px-4 py-3 text-gray-700">
                            {Number(exchangeRate.rate).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              },
                            )}
                          </td>

                          <td className="px-4 py-3 text-gray-700">
                            {exchangeRate.effective_date}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge variant="info">
                              {exchangeRate.source}
                            </StatusBadge>
                          </td>
                          {(canUpdateExchangeRates ||
                            canDeleteExchangeRates) && (
                            <td className="hidden px-4 py-3 lg:table-cell">
                              <div className="flex justify-end gap-2 whitespace-nowrap">
                                {canUpdateExchangeRates && (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => startEdit(exchangeRate)}
                                  >
                                    Edit
                                  </Button>
                                )}

                                {canDeleteExchangeRates && (
                                  <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(exchangeRate)}
                                    disabled={actionRateId === exchangeRate.id}
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
                  isOpen={Boolean(selectedMobileExchangeRate)}
                  reference={
                    selectedMobileExchangeRate
                      ? `${selectedMobileExchangeRate.from_currency} → ${selectedMobileExchangeRate.to_currency}`
                      : ""
                  }
                  label="Selected exchange rate"
                  onClose={() => setSelectedMobileExchangeRate(null)}
                >
                  {selectedMobileExchangeRate && (
                    <>
                      {canUpdateExchangeRates && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => startEdit(selectedMobileExchangeRate)}
                        >
                          Edit
                        </Button>
                      )}

                      {canDeleteExchangeRates && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleDelete(selectedMobileExchangeRate)
                          }
                          disabled={
                            actionRateId === selectedMobileExchangeRate.id
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
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
}

export default ExchangeRatesPage;
