from app.schemas.reports.payment_report_schema import PaymentReportRow
from app.utils.value_helper.enum_utils import enum_value


class PaymentReportBuilder:
    def build_rows(self, raw_rows) -> list[PaymentReportRow]:
        return [
            PaymentReportRow(
                payment_id=row.payment_id,
                payment_reference=row.payment_reference,
                invoice_id=row.invoice_id,
                invoice_number=row.invoice_number,
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                amount=row.amount,
                currency=row.currency,
                exchange_rate=row.exchange_rate,
                base_currency=row.base_currency,
                base_amount=row.base_amount,
                exchange_rate_date=row.exchange_rate_date,
                payment_method=row.payment_method,
                status=row.status,
                created_by_id=row.created_by_id,
                created_by_name=row.created_by_name,
                created_at=row.created_at,
                paid_at=row.paid_at,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "Payment Reference",
            "Invoice Number",
            "Supplier",
            "Amount",
            "Currency",
            "Exchange Rate",
            "Base Currency",
            "Base Amount",
            "Exchange Rate Date",
            "Payment Method",
            "Status",
            "Created By",
            "Created At",
            "Paid At",
        ]

    def export_rows(
        self,
        rows: list[PaymentReportRow],
    ) -> list[list]:
        return [
            [
                row.payment_reference or str(row.payment_id),
                row.invoice_number,
                row.supplier_name or "N/A",
                row.amount,
                row.currency or "N/A",
                row.exchange_rate,
                row.base_currency or "N/A",
                row.base_amount,
                row.exchange_rate_date,
                row.payment_method or "N/A",
                enum_value(row.status),
                row.created_by_name or "N/A",
                row.created_at,
                row.paid_at,
            ]
            for row in rows
        ]