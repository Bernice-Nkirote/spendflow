from app.schemas.reports.payment_report_schema import PaymentReportRow


class PaymentReportBuilder:
    def build_rows(self, raw_rows) -> list[PaymentReportRow]:
        return [
            PaymentReportRow(
                payment_id=row.payment_id,
                invoice_id=row.invoice_id,
                invoice_number=row.invoice_number,
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                amount=row.amount,
                status=row.status,
                payment_method=row.payment_method,
                reference=row.reference,
                created_by=row.created_by,
                created_at=row.created_at,
                paid_at=row.paid_at,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "payment_id",
            "invoice_id",
            "invoice_number",
            "supplier_id",
            "supplier_name",
            "amount",
            "status",
            "payment_method",
            "reference",
            "created_by",
            "created_at",
            "paid_at",
        ]

    def export_rows(
        self,
        rows: list[PaymentReportRow],
    ) -> list[list]:
        return [
            [
                str(row.payment_id),
                str(row.invoice_id),
                row.invoice_number,
                str(row.supplier_id) if row.supplier_id else None,
                row.supplier_name,
                row.amount,
                row.status,
                row.payment_method,
                row.reference,
                str(row.created_by) if row.created_by else None,
                row.created_at,
                row.paid_at,
            ]
            for row in rows
        ]