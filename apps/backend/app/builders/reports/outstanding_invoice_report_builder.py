from app.schemas.reports.outstanding_invoice_report_schema import (
    OutstandingInvoiceReportRow,
)


class OutstandingInvoiceReportBuilder:
    def build_rows(self, raw_rows) -> list[OutstandingInvoiceReportRow]:
        return [
            OutstandingInvoiceReportRow(
                invoice_id=row.invoice_id,
                invoice_number=row.invoice_number,
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                purchase_order_id=row.purchase_order_id,
                po_number=row.po_number,

                total_amount=row.total_amount,
                amount_paid=row.amount_paid,
                outstanding_amount=row.outstanding_amount,
                currency=row.currency,

                base_currency=row.base_currency,
                base_total_amount=row.base_total_amount,
                base_amount_paid=row.base_amount_paid,
                base_outstanding_amount=row.base_outstanding_amount,

                status=row.status,
                created_at=row.created_at,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "Invoice Number",
            "Supplier",
            "PO Number",

            "Total Amount",
            "Amount Paid",
            "Outstanding Amount",
            "Currency",

            "Base Currency",
            "Base Total Amount",
            "Base Amount Paid",
            "Base Outstanding Amount",

            "Status",
            "Created At",
        ]

    def export_rows(
        self,
        rows: list[OutstandingInvoiceReportRow],
    ) -> list[list]:
        return [
            [
                row.invoice_number,
                row.supplier_name or "N/A",
                row.po_number or "N/A",

                row.total_amount,
                row.amount_paid,
                row.outstanding_amount,
                row.currency,

                row.base_currency,
                row.base_total_amount,
                row.base_amount_paid,
                row.base_outstanding_amount,

                row.status,
                row.created_at,
            ]
            for row in rows
        ]