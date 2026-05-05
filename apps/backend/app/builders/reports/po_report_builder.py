from app.schemas.reports.po_report_schema import POReportRow

class POReportBuilder:
    @staticmethod
    def build_rows(rows):
        return [
            {
                
                "po_id": row.po_id,
                "po_number": row.po_number,

                "supplier_id": row.supplier_id,
                "supplier_name": row.supplier_name or "N/A",

                "department_id": row.department_id,
                "department_name": row.department_name or "N/A",

                "purchase_requisition_id": row.purchase_requisition_id,
                "pr_number": row.pr_number or "N/A",

                "created_by_name": row.created_by_name or "N/A",
                "submitted_by_name": row.submitted_by_name or "N/A",
                "issued_by_name": row.issued_by_name or "N/A",

                "item_id": row.item_id,
                "item_name": row.item_name,
                "quantity": row.quantity,
                "unit_price": row.unit_price,
                "line_total": row.line_total,

                "po_total_amount": row.po_total_amount,
                "currency": row.currency,
                "status": row.status,

                "created_at": row.created_at,
                "submitted_at": row.submitted_at,
                "issued_at": row.issued_at,

            }
            for row in rows
        ]

    @staticmethod
    def headers():
        return [
            "PO Number",
            "Supplier",
            "Department",
            "PR Number",
            "Created By",
            "Submitted By",
            "Issued By",
            "Item",
            "Quantity",
            "Unit Price",
            "Line Total",
            "PO Total Amount",
            "Currency",
            "Status",
            "Created At",
            "Submitted At",
            "Issued At",
        ]

    @staticmethod
    def export_rows(rows):
        return [
            [
                row.get("po_number"),
                row.get("supplier_name"),
                row.get("department_name"),
                row.get("pr_number"),
                row.get("created_by_name"),
                row.get("submitted_by_name"),
                row.get("issued_by_name"),
                row.get("item_name"),
                row.get("quantity"),
                row.get("unit_price"),
                row.get("line_total"),
                row.get("po_total_amount"),
                row.get("currency"),
                row.get("status"),
                row.get("created_at"),
                row.get("submitted_at"),
                row.get("issued_at"),
            ]
            for row in rows
        ]