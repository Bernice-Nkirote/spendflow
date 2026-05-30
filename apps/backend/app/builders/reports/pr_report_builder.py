from app.schemas.reports.pr_report_schema import PRReportRow
from app.utils.value_helper.enum_utils import enum_value

class PRReportBuilder:
    def build_rows(self, raw_rows) -> list[PRReportRow]:
        return [
            PRReportRow(
                pr_id=row.pr_id,
                pr_number=row.pr_number,
                title=row.title,
                department_id=row.department_id,
                department_name=row.department_name,
                requested_by_id=row.requested_by_id,
                requested_by_name=row.requested_by_name,
                item_id=row.item_id,
                item_name=row.item_name,
                quantity=row.quantity,
                unit_price=row.unit_price,
                line_total=row.line_total,
                base_line_total=row.base_line_total,
                pr_total_amount=row.pr_total_amount,
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
            "PR Number",
            "Title",
            "Department",
            "Requested By",
            "Item",
            "Quantity",
            "Unit Price",
            "Line Total",
            "Base Line Total",
            "PR Total Amount",
            "Currency",
            "Exchange Rate",
            "Base Currency",
            "Base Amount",
            "Exchange Rate Date",
            "Status",
            "Created At",
        ]

    def export_rows(self, rows: list[PRReportRow]) -> list[list]:
        return [
            [
                row.pr_number,
                row.title,
                row.department_name or "N/A",
                row.requested_by_name or "N/A",
                row.item_name,
                row.quantity,
                row.unit_price,
                row.line_total,
                row.base_line_total,
                row.pr_total_amount,
                row.currency,
                row.exchange_rate,
                row.base_currency,
                row.base_amount,
                row.exchange_rate_date,
                enum_value(row.status),
                row.created_at,
            ]
            for row in rows
        ]