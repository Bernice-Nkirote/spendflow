import { useMemo, useState } from "react";
import MobileFloatingTableAction from "../../../components/ui/MobileFloatingTableAction";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
  stickyRightCell,
  stickyRightHeader,
} from "../../../components/ui/tableStickyStyles";

export type ReportTableColumn<T> = {
  header: string;
  accessor: keyof T;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

type SortDirection = "asc" | "desc";

type Props<T> = {
  columns: readonly ReportTableColumn<T>[];
  data: T[];
};

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) return numericValue;

  const dateValue = Date.parse(String(value));
  if (!Number.isNaN(dateValue)) return dateValue;

  return String(value).toLowerCase();
}

function getHeaderStickyClass(index: number, totalColumns: number) {
  if (index === 0) return stickyLeftHeader;
  if (index === totalColumns - 1) return stickyRightHeader;

  return "";
}

function getCellStickyClass(index: number, totalColumns: number) {
  if (index === 0) return stickyLeftCell;
  if (index === totalColumns - 1) return stickyRightCell;

  return "";
}
export default function ReportTable<T>({ columns, data }: Props<T>) {
  const [selectedMobileRow, setSelectedMobileRow] = useState<T | null>(null);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleSort(accessor: keyof T, sortable?: boolean) {
    if (!sortable) return;

    if (sortKey === accessor) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(accessor);
    setSortDirection("asc");
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = normalizeValue(a[sortKey]);
      const bValue = normalizeValue(b[sortKey]);

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;

      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const actionColumn = columns.find((column) => column.header === "Actions");
  const identityColumn = columns[0];
  const hasActionColumn = Boolean(actionColumn);

  function toggleMobileActions(row: T) {
    setSelectedMobileRow((current) => (current === row ? null : row));
  }

  const selectedReference =
    selectedMobileRow && identityColumn
      ? String(
          selectedMobileRow[identityColumn.accessor] ?? "Selected report row",
        )
      : "";

  return (
    <>
      <TableWrapper minWidth="1300px">
        <table className="w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, columnIndex) => {
                const isSorted = sortKey === col.accessor;

                return (
                  <th
                    key={String(col.accessor)}
                    onClick={() => handleSort(col.accessor, col.sortable)}
                    className={`${getHeaderStickyClass(
                      columnIndex,
                      columns.length,
                    )} ${col.header === "Actions" ? "hidden lg:table-cell" : ""} whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary-gray ${
                      col.sortable
                        ? "cursor-pointer select-none hover:bg-gray-100"
                        : ""
                    } ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {col.header}
                    {col.sortable && (
                      <span className="ml-1 text-gray-400">
                        {isSorted ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {sortedData.map((row, index) => (
              <tr key={index} className="group hover:bg-gray-50">
                {columns.map((col, columnIndex) => {
                  const value = row[col.accessor];

                  return (
                    <td
                      key={String(col.accessor)}
                      className={`${getCellStickyClass(
                        columnIndex,
                        columns.length,
                      )} ${col.header === "Actions" ? "hidden lg:table-cell" : ""} px-4 py-3 text-primary-black ${
                        col.align === "right"
                          ? "text-right tabular-nums"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left"
                      }`}
                    >
                      {hasActionColumn && columnIndex === 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleMobileActions(row)}
                          className="block max-w-[240px] text-left lg:pointer-events-none"
                          title="Tap to show actions"
                        >
                          {col.render
                            ? col.render(value, row)
                            : String(value ?? "-")}
                        </button>
                      ) : col.render ? (
                        col.render(value, row)
                      ) : (
                        String(value ?? "-")
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      {actionColumn && (
        <MobileFloatingTableAction
          isOpen={Boolean(selectedMobileRow)}
          reference={selectedReference}
          label="Selected report row"
          onClose={() => setSelectedMobileRow(null)}
        >
          {selectedMobileRow &&
            actionColumn.render?.(
              selectedMobileRow[actionColumn.accessor],
              selectedMobileRow,
            )}
        </MobileFloatingTableAction>
      )}
    </>
  );
}
