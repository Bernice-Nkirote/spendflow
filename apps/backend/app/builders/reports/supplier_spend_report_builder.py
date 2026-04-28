from app.schemas.reports.supplier_spend_report_schema import SupplierSpendReportRow


class SupplierSpendReportBuilder:
    def build_rows(self, raw_rows) -> list[SupplierSpendReportRow]:
        return [
            SupplierSpendReportRow(
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                total_invoice_amount=row.total_invoice_amount,
                total_paid_amount=row.total_paid_amount,
                outstanding_amount=row.outstanding_amount,
                invoice_count=row.invoice_count,
                payment_count=row.payment_count,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "supplier_id",
            "supplier_name",
            "total_invoice_amount",
            "total_paid_amount",
            "outstanding_amount",
            "invoice_count",
            "payment_count",
        ]

    def export_rows(
        self,
        rows: list[SupplierSpendReportRow],
    ) -> list[list]:
        return [
            [
                str(row.supplier_id),
                row.supplier_name,
                row.total_invoice_amount,
                row.total_paid_amount,
                row.outstanding_amount,
                row.invoice_count,
                row.payment_count,
            ]
            for row in rows
        ]