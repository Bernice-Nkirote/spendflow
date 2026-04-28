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
            "po_id",
            "po_number",
            "supplier_id",
            "supplier_name",
            "invoice_id",
            "invoice_number",
            "issued_at",
            "invoice_created_at",
            "lead_time_days",
        ]

    def export_rows(
        self,
        rows: list[SupplierLeadTimeReportRow],
    ) -> list[list]:
        return [
            [
                str(row.po_id),
                row.po_number,
                str(row.supplier_id),
                row.supplier_name,
                str(row.invoice_id) if row.invoice_id else None,
                row.invoice_number,
                row.issued_at,
                row.invoice_created_at,
                row.lead_time_days,
            ]
            for row in rows
        ]