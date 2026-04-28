from app.schemas.reports.po_report_schema import POReportRow


class POReportBuilder:
    def build_rows(self, raw_rows) -> list[POReportRow]:
        return [
            POReportRow(
                po_id=row.po_id,
                po_number=row.po_number,
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                department_id=row.department_id,
                department_name=row.department_name,
                purchase_requisition_id=row.purchase_requisition_id,
                total_amount=row.total_amount,
                currency=row.currency,
                status=row.status,
                item_count=row.item_count,
                created_by=row.created_by,
                submitted_by=row.submitted_by,
                issued_by=row.issued_by,
                created_at=row.created_at,
                submitted_at=row.submitted_at,
                issued_at=row.issued_at,
            )
            for row in raw_rows
        ]

    def headers(self) -> list[str]:
        return [
            "po_id",
            "po_number",
            "supplier_id",
            "supplier_name",
            "department_id",
            "department_name",
            "purchase_requisition_id",
            "total_amount",
            "currency",
            "status",
            "item_count",
            "created_by",
            "submitted_by",
            "issued_by",
            "created_at",
            "submitted_at",
            "issued_at",
        ]

    def export_rows(
        self,
        rows: list[POReportRow],
    ) -> list[list]:
        return [
            [
                str(row.po_id),
                row.po_number,
                str(row.supplier_id),
                row.supplier_name,
                str(row.department_id) if row.department_id else None,
                row.department_name,
                str(row.purchase_requisition_id) if row.purchase_requisition_id else None,
                row.total_amount,
                row.currency,
                row.status,
                row.item_count,
                str(row.created_by),
                str(row.submitted_by) if row.submitted_by else None,
                str(row.issued_by) if row.issued_by else None,
                row.created_at,
                row.submitted_at,
                row.issued_at,
            ]
            for row in rows
        ]