from decimal import Decimal
from io import BytesIO

from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.utils.value_helper.enum_utils import enum_value


class PDFService:
    def __init__(self):
        self.page_size = A4
        self.left_margin = 16 * mm
        self.right_margin = 16 * mm
        self.top_margin = 14 * mm
        self.bottom_margin = 14 * mm

    def _format_money(self, amount: Decimal | int | float | str) -> str:
        return f"{Decimal(amount):,.2f}"

    def _format_date(self, value) -> str:
        if not value:
            return "-"

        return value.strftime("%Y-%m-%d")

    def _safe_text(self, value) -> str:
        if value is None:
            return "-"
        value = str(value).strip()
        return value if value else "-"

    def _money(self, currency: str, amount: Decimal | int | float | str) -> str:
        return f"{currency} {self._format_money(amount)}"

    def _build_company_header(self, company, po, styles):
        company_name = self._safe_text(getattr(company, "name", None))
        po_currency = self._safe_text(getattr(po, "currency", None))
        return Table(
            [
                [
                    Paragraph(company_name, styles["CompanyName"]),
                    Paragraph("PURCHASE ORDER", styles["DocumentTitle"]),
                ],
                [
                    Paragraph(f"Base Currency: {po_currency}", styles["Muted"]),
                    Paragraph(f"PO No: {po.po_number}", styles["RightMuted"]),
                ],
            ],
            colWidths=[90 * mm, 88 * mm],
        )

    def _build_supplier_table(self, supplier, styles):
        supplier_rows = [
            ["Supplier Name", self._safe_text(supplier.name)],
            ["Contact Person", self._safe_text(supplier.contact_person)],
            ["Email", self._safe_text(supplier.email)],
            ["Phone", self._safe_text(supplier.phone)],
            ["Address", self._safe_text(supplier.address)],
        ]

        table = Table(supplier_rows, colWidths=[38 * mm, 140 * mm])
        table.setStyle(self._info_table_style())
        return table

    def _build_po_summary_table(self, po):
        rows = [
            ["PO Number", self._safe_text(po.po_number)],
            ["Status", self._safe_text(enum_value(po.status))],
            ["Prepared Date", self._format_date(po.created_at)],
            ["Prepared By", self._safe_text(getattr(po, "created_by_name", None))],
            ["Department", self._safe_text(getattr(po, "department_name", None))],
        ]

        table = Table(rows, colWidths=[38 * mm, 140 * mm])
        table.setStyle(self._info_table_style())
        return table
    
    def _build_items_table(self, items, currency: str):
        table_data = [["Item", "Description", "Qty", "Unit Price", "Line Total"]]

        for item in items:
            table_data.append(
                [
                    self._safe_text(item.item_name),
                    self._safe_text(item.description),
                    self._safe_text(item.quantity),
                    self._money(currency, item.unit_price),
                    self._money(currency, item.total_price),
                ]
            )

        table = Table(
            table_data,
            colWidths=[36 * mm, 58 * mm, 18 * mm, 32 * mm, 34 * mm],
            repeatRows=1,
        )

        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#274C77")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )

        return table

    def _build_total_table(self, po):
        table = Table(
            [["Total Amount", self._money(po.currency, po.total_amount)]],
            colWidths=[128 * mm, 50 * mm],
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E7ECEF")),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                    ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#8B8C89")),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        return table

    def _build_notes_table(self, po):
        table = Table(
            [["Notes", self._safe_text(po.notes)]],
            colWidths=[32 * mm, 146 * mm],
        )
        table.setStyle(self._info_table_style())
        return table

    def _build_signature_table(self):
        rows = [
            ["Prepared By", "Signature", "Date"],
            ["", "", ""],
            ["Approved By", "Signature", "Date"],
            ["", "", ""],
        ]

        table = Table(rows, colWidths=[60 * mm, 68 * mm, 50 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E7ECEF")),
                    ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#E7ECEF")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
                    ("ROWHEIGHT", (0, 1), (-1, 1), 18 * mm),
                    ("ROWHEIGHT", (0, 3), (-1, 3), 18 * mm),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                ]
            )
        )
        return table

    def _build_supplier_acknowledgement_table(self):
        rows = [
            ["Supplier Acknowledgement"],
            [
                "We acknowledge receipt of this purchase order and confirm that the goods/services will be supplied in accordance with the agreed terms."
            ],
            ["Supplier Representative", "Signature", "Date"],
            ["", "", ""],
        ]

        table = Table(
            rows,
            colWidths=[60 * mm, 68 * mm, 50 * mm],
        )
        table.setStyle(
            TableStyle(
                [
                    ("SPAN", (0, 0), (-1, 0)),
                    ("SPAN", (0, 1), (-1, 1)),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#274C77")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#E7ECEF")),
                    ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ("ROWHEIGHT", (0, 3), (-1, 3), 18 * mm),
                ]
            )
        )
        return table

    def _info_table_style(self):
        return TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E7ECEF")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )

    def _build_styles(self):
        styles = getSampleStyleSheet()

        styles.add(
            ParagraphStyle(
                name="CompanyName",
                parent=styles["Normal"],
                fontSize=16,
                leading=20,
                textColor=colors.HexColor("#274C77"),
                fontName="Helvetica-Bold",
            )
        )

        styles.add(
            ParagraphStyle(
                name="DocumentTitle",
                parent=styles["Normal"],
                fontSize=16,
                leading=20,
                alignment=TA_RIGHT,
                textColor=colors.HexColor("#141414"),
                fontName="Helvetica-Bold",
            )
        )

        styles.add(
            ParagraphStyle(
                name="SectionTitle",
                parent=styles["Normal"],
                fontSize=10,
                leading=13,
                textColor=colors.HexColor("#141414"),
                fontName="Helvetica-Bold",
            )
        )

        styles.add(
            ParagraphStyle(
                name="Muted",
                parent=styles["Normal"],
                fontSize=8,
                leading=10,
                textColor=colors.HexColor("#8B8C89"),
            )
        )

        styles.add(
            ParagraphStyle(
                name="RightMuted",
                parent=styles["Normal"],
                fontSize=8,
                leading=10,
                alignment=TA_RIGHT,
                textColor=colors.HexColor("#8B8C89"),
            )
        )

        styles.add(
            ParagraphStyle(
                name="Footer",
                parent=styles["Normal"],
                fontSize=7,
                leading=9,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#8B8C89"),
            )
        )

        return styles

    def generate_po_pdf(
        self,
        company,
        po,
        supplier,
        items,
    ) -> bytes:
        if not company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company is required for PDF generation",
            )

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

            styles = self._build_styles()
            story = []

            story.append(self._build_company_header(company, po, styles))
            story.append(Spacer(1, 10))

            story.append(Paragraph("Supplier Details", styles["SectionTitle"]))
            story.append(Spacer(1, 5))
            story.append(self._build_supplier_table(supplier, styles))
            story.append(Spacer(1, 10))

            story.append(Paragraph("Purchase Order Summary", styles["SectionTitle"]))
            story.append(Spacer(1, 5))
            story.append(self._build_po_summary_table(po))
            story.append(Spacer(1, 10))

            story.append(Paragraph("Purchase Order Items", styles["SectionTitle"]))
            story.append(Spacer(1, 5))
            story.append(self._build_items_table(items, po.currency))
            story.append(Spacer(1, 8))
            story.append(self._build_total_table(po))
            story.append(Spacer(1, 10))

            story.append(Paragraph("Notes", styles["SectionTitle"]))
            story.append(Spacer(1, 5))
            story.append(self._build_notes_table(po))
            story.append(Spacer(1, 12))

            story.append(Paragraph("Internal Approval and Signature", styles["SectionTitle"]))
            story.append(Spacer(1, 5))
            story.append(self._build_signature_table())
            story.append(Spacer(1, 12))

            story.append(self._build_supplier_acknowledgement_table())
            story.append(Spacer(1, 10))

            story.append(
                Paragraph(
                    "This purchase order was generated by SpendFlow. Please verify all details before fulfilment.",
                    styles["Footer"],
                )
            )

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