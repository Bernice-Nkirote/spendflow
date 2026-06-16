from app.schemas.reports.supplier_spend_report_schema import SupplierSpendReportRow


class SupplierSpendReportBuilder:
    def build_rows(self, raw_rows) -> list[SupplierSpendReportRow]:
        return [
            SupplierSpendReportRow(
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                supplier_category=row.supplier_category,
                supplier_sub_category=row.supplier_sub_category,

                total_invoice_amount=row.total_invoice_amount,
                total_paid_amount=row.total_paid_amount,
                outstanding_amount=row.outstanding_amount,

                base_currency=row.base_currency,
                base_total_invoice_amount=row.base_total_invoice_amount,
                base_total_paid_amount=row.base_total_paid_amount,
                base_outstanding_amount=row.base_outstanding_amount,

                invoice_count=row.invoice_count,
                payment_count=row.payment_count,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "Supplier",
            "Category",
            "Sub-category",

            "Total Invoice Amount",
            "Total Paid Amount",
            "Outstanding Amount",

            "Base Currency",
            "Base Total Invoice Amount",
            "Base Total Paid Amount",
            "Base Outstanding Amount",

            "Invoice Count",
            "Payment Count",
        ]

    def export_rows(
        self,
        rows: list[SupplierSpendReportRow],
    ) -> list[list]:
        return [
            [
                row.supplier_name or "N/A",
                row.supplier_category or "Uncategorised",
                row.supplier_sub_category or "N/A",

                row.total_invoice_amount,
                row.total_paid_amount,
                row.outstanding_amount,

                row.base_currency or "N/A",
                row.base_total_invoice_amount,
                row.base_total_paid_amount,
                row.base_outstanding_amount,

                row.invoice_count,
                row.payment_count,
            ]
            for row in rows
        ]
