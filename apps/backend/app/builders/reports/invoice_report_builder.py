from app.schemas.reports.invoice_report_schema import InvoiceReportRow


class InvoiceReportBuilder:
    def build_rows(self, raw_rows) -> list[InvoiceReportRow]:
        return [
            InvoiceReportRow(
                invoice_id=row.invoice_id,
                invoice_number=row.invoice_number,
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                purchase_order_id=row.purchase_order_id,
                total_amount=row.total_amount,
                status=row.status,
                created_at=row.created_at,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "invoice_id",
            "invoice_number",
            "supplier_id",
            "supplier_name",
            "purchase_order_id",
            "total_amount",
            "status",
            "created_at",
        ]

    def export_rows(
        self,
        rows: list[InvoiceReportRow],
    ) -> list[list]:
        return [
            [
                str(row.invoice_id),
                row.invoice_number,
                str(row.supplier_id),
                row.supplier_name,
                str(row.purchase_order_id) if row.purchase_order_id else None,
                row.total_amount,
                row.status,
                row.created_at,
            ]
            for row in rows
        ]