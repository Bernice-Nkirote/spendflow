from app.schemas.reports.supplier_lead_time_report_schema import (
    SupplierLeadTimeReportRow,
)


class SupplierLeadTimeReportBuilder:
    def build_rows(self, raw_rows) -> list[SupplierLeadTimeReportRow]:
        return [
            SupplierLeadTimeReportRow(
                po_id=row.po_id,
                po_number=row.po_number,
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                invoice_id=row.invoice_id,
                invoice_number=row.invoice_number,
                issued_at=row.issued_at,
                invoice_created_at=row.invoice_created_at,
                lead_time_days=round(float(row.lead_time_days), 2)
                if row.lead_time_days is not None
                else None,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "Supplier",
            "PO Number",
            "Invoice Number",
            "PO Issued At",
            "Invoice Created At",
            "Lead Time Days",
        ]

    def export_rows(
        self,
        rows: list[SupplierLeadTimeReportRow],
    ) -> list[list]:
        return [
            [
                row.supplier_name or "N/A",
                row.po_number,
                row.invoice_number or "N/A",
                row.issued_at,
                row.invoice_created_at,
                row.lead_time_days,
            ]
            for row in rows
        ]