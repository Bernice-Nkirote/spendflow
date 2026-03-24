from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO

class PurchaseOrderPDFService:
    @staticmethod
    def generate_pdf(po):
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, 750, f"Purchase Order: {po.po_number}")

        c.setFont("Helvetica", 12)
        c.drawString(50,730, f"Supplier ID: {po.supplier_id}")
        c.drawString(50,715, f"Company ID: {po.company_id}")
        c.drawString(50, 700, f"Total Amount: {po.total_amount} {po.currency}")

        y = 680
        c.setFont("Helvetica", 10)
        for item in po.items:
            c.drawString(60, y, f"{item.product_name} - {item.quantity} * {item.unit_price} = {item.total_price}")
            y -= 15

        c.showPage()
        c.save()
        buffer.seek(0)
        return buffer
