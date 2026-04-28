from app.schemas.reports.pr_report_schema import PRReportRow


class PRReportBuilder:
    def build_rows(self, raw_rows) -> list[PRReportRow]:
        return [
            PRReportRow(
                pr_id=row.pr_id,
                pr_number=row.pr_number,
                title=row.title,
                department_id=row.department_id,
                department_name=row.department_name,
                requested_by=row.requested_by,
                total_amount=row.total_amount,
                currency=row.currency,
                status=row.status,
                item_count=row.item_count,
                created_at=row.created_at,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "pr_id",
            "pr_number",
            "title",
            "department_id",
            "department_name",
            "requested_by",
            "total_amount",
            "currency",
            "status",
            "item_count",
            "created_at",
        ]

    def export_rows(
        self,
        rows: list[PRReportRow],
    ) -> list[list]:
        return [
            [
                str(row.pr_id),
                row.pr_number,
                row.title,
                str(row.department_id) if row.department_id else None,
                row.department_name,
                str(row.requested_by) if row.requested_by else None,
                row.total_amount,
                row.currency,
                row.status,
                row.item_count,
                row.created_at,
            ]
            for row in rows
        ]