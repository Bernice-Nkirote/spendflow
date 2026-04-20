from decimal import Decimal
from io import BytesIO

from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Spacer,
    Paragraph,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet


class PDFService:
    def __init__(self):
        self.page_size = A4
        self.left_margin = 18 * mm
        self.right_margin = 18 * mm
        self.top_margin = 18 * mm
        self.bottom_margin = 18 * mm

    def _format_money(self, amount: Decimal | int | float | str) -> str:
        return f"{Decimal(amount):,.2f}"

    def _build_header_rows(self, po, supplier) -> list[list[str]]:
        supplier_name = supplier.name if supplier and supplier.name else "-"
        supplier_email = supplier.email if supplier and supplier.email else "-"
        supplier_phone = supplier.phone if supplier and supplier.phone else "-"
        supplier_contact = (
            supplier.contact_person
            if supplier and supplier.contact_person
            else "-"
        )

        issued_at = po.issued_at.strftime("%Y-%m-%d %H:%M") if po.issued_at else "-"
        submitted_at = po.submitted_at.strftime("%Y-%m-%d %H:%M") if po.submitted_at else "-"

        return [
            ["PO Number", po.po_number, "Supplier", supplier_name],
            ["Status", str(po.status.value), "Supplier Email", supplier_email],
            ["Currency", po.currency, "Contact Person", supplier_contact],
            ["Submitted At", submitted_at, "Supplier Phone", supplier_phone],
            ["Issued At", issued_at, "Department ID", str(po.department_id) if po.department_id else "-"],
        ]

    def _build_items_data(self, items, currency: str) -> list[list[str]]:
        table_data = [
            [
                "Item",
                "Description",
                "Quantity",
                "Unit Price",
                "Total",
            ]
        ]

        for item in items:
            table_data.append(
                [
                    item.item_name,
                    item.description or "-",
                    str(item.quantity),
                    f"{currency} {self._format_money(item.unit_price)}",
                    f"{currency} {self._format_money(item.total_price)}",
                ]
            )

        return table_data

    def _build_summary_rows(self, po) -> list[list[str]]:
        notes = po.notes if po.notes else "-"

        return [
            ["Notes", notes],
            ["Total Amount", f"{po.currency} {self._format_money(po.total_amount)}"],
        ]

    def generate_po_pdf(
        self,
        po,
        supplier,
        items,
    ) -> bytes:
        if not po:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order is required for PDF generation",
            )

        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier is required for PDF generation",
            )

        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one purchase order item is required for PDF generation",
            )

        buffer = BytesIO()

        try:
            doc = SimpleDocTemplate(
                buffer,
                pagesize=self.page_size,
                leftMargin=self.left_margin,
                rightMargin=self.right_margin,
                topMargin=self.top_margin,
                bottomMargin=self.bottom_margin,
            )

            styles = getSampleStyleSheet()
            story = []

            title = Paragraph("Purchase Order", styles["Title"])
            story.append(title)
            story.append(Spacer(1, 10))

            header_table = Table(
                self._build_header_rows(po, supplier),
                colWidths=[32 * mm, 58 * mm, 32 * mm, 58 * mm],
                repeatRows=0,
            )
            header_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                        ("BACKGROUND", (2, 0), (2, -1), colors.lightgrey),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.grey),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            story.append(header_table)
            story.append(Spacer(1, 14))

            items_title = Paragraph("Purchase Order Items", styles["Heading2"])
            story.append(items_title)
            story.append(Spacer(1, 6))

            items_table = Table(
                self._build_items_data(items, po.currency),
                colWidths=[38 * mm, 56 * mm, 22 * mm, 32 * mm, 32 * mm],
                repeatRows=1,
            )
            items_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.grey),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            story.append(items_table)
            story.append(Spacer(1, 14))

            summary_title = Paragraph("Summary", styles["Heading2"])
            story.append(summary_title)
            story.append(Spacer(1, 6))

            summary_table = Table(
                self._build_summary_rows(po),
                colWidths=[40 * mm, 138 * mm],
                repeatRows=0,
            )
            summary_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.grey),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            story.append(summary_table)

            doc.build(story)

            pdf_bytes = buffer.getvalue()
            if not pdf_bytes:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate purchase order PDF",
                )

            return pdf_bytes

        except HTTPException:
            raise

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate purchase order PDF: {str(exc)}",
            ) from exc

        finally:
            buffer.close()