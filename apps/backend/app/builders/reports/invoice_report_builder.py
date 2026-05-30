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
                po_number=row.po_number,
                item_id=row.item_id,
                item_description=row.item_description,
                quantity=row.quantity,
                unit_price=row.unit_price,
                line_total=row.line_total,
                base_line_total=row.base_line_total,
                invoice_total_amount=row.invoice_total_amount,
                currency=row.currency,
                exchange_rate=row.exchange_rate,
                base_currency=row.base_currency,
                base_amount=row.base_amount,
                exchange_rate_date=row.exchange_rate_date,
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
            "Item",
            "Quantity",
            "Unit Price",
            "Line Total",
            "Base Line Total",
            "Invoice Total Amount",
            "Currency",
            "Exchange Rate",
            "Base Currency",
            "Base Amount",
            "Exchange Rate Date",
            "Status",
            "Created At",
        ]

    def export_rows(
        self,
        rows: list[InvoiceReportRow],
    ) -> list[list]:
        return [
            [
                row.invoice_number,
                row.supplier_name or "N/A",
                row.po_number or "N/A",
                row.item_description,
                row.quantity,
                row.unit_price,
                row.line_total,
                row.base_line_total,
                row.invoice_total_amount,
                row.currency,
                row.exchange_rate,
                row.base_currency,
                row.base_amount,
                row.exchange_rate_date,
                row.status,
                row.created_at,
            ]
            for row in rows
        ]