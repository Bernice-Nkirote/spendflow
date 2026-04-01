from fastapi import HTTPException
from app.models.purchase_order import PurchaseOrder
from app.models.invoice import Invoice
from app.models.invoice_line_item import InvoiceLineItem
from app.models.audit_log import AuditLog
from app.services.audit_log_service import AuditLogService
from app.repositories.invoice_repository import InvoiceRepository, InvoiceLineItemRepository
from decimal import Decimal

class InvoiceService:
    def __init__(self, invoice_repo: InvoiceRepository, line_item_repo: InvoiceLineItemRepository, db):
        self.db = db
        self.invoice_repo = invoice_repo
        self.line_item_repo = line_item_repo

    def create_invoice(self, po_id, submitting_user, invoice_data):
         #  GET PO
        po = self.db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
        if not po:
            raise HTTPException(404, "PO not found")

        # CHECK STATUS
        if po.status not in ["APPROVED", "SENT"]:
            raise HTTPException(400, "Cannot invoice unapproved PO")

        # DETERMINE WHO IS SUBMITTING
        submitted_by_user_id = None
        submitted_by_supplier_id = None

        supplier_id = None
        if hasattr(submitting_user, "supplier_id"):
            submitted_by_supplier_id = submitting_user.supplier_id
            supplier_id = submitting_user.supplier_id
            # If supplier is the one submitting the supplier id will come from them the user
        
          # ADD THIS (CRITICAL SECURITY CHECK)
        if supplier_id != po.supplier_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot invoice another supplier's PO"
             )
        else:
            submitted_by_user_id = submitting_user.id
            supplier_id = invoice_data.supplier_id
            # If someone else is submitting the invoice the supplier id will come from the invoice data that
            # user will be submitting.


        # CREATE INVOICE (WITHOUT TOTAL YET) - flush only
        invoice = Invoice(
            invoice_number=invoice_data.invoice_number,
            purchase_order_id=po.id,
            company_id=po.company_id,
            supplier_id=supplier_id,
            submitted_by_user_id=submitted_by_user_id,
            submitted_by_supplier_id=submitted_by_supplier_id,
            total_amount=Decimal(0)
        )

        invoice = self.invoice_repo.create(invoice)  # repo handles add/commit/refresh

        # PROCESS LINE ITEMS
        total_amount = Decimal(0)
        for item in invoice_data.line_items:
            po_item = next(
                (i for i in po.items if i.id == item.purchase_order_item_id), None
            )
            if not po_item:
                raise HTTPException(400, "Invalid PO item")

            # prevent over-invoicing
            already_invoiced_qty = sum(
                li.invoiced_quantity
                for inv in po.invoices
                for li in inv.line_items
                if li.purchase_order_item_id == item.purchase_order_item_id
            )

            if item.invoiced_quantity + already_invoiced_qty > po_item.quantity:
                raise HTTPException(400, "Over-invoicing not allowed")

            total_price = item.invoiced_quantity * item.unit_price

            line_item = InvoiceLineItem(
                invoice_id=invoice.id,
                purchase_order_item_id=item.purchase_order_item_id,
                description=item.description,
                invoiced_quantity=item.invoiced_quantity,
                unit_price=item.unit_price,
                total_price=total_price
            ) 
            self.line_item_repo.create(line_item)  #use repo
            total_amount += total_price

            # SET TOTAL
        invoice.total_amount = total_amount

        #  AUDIT LOG
        AuditLogService.log(
            db=self.db,
            entity="invoice",
            entity_id=invoice.id,
            action="CREATE",
            user_id=getattr(submitting_user, "id", None),
            new_values={
                "total_amount": str(invoice.total_amount),
                "supplier_id": str(invoice.supplier_id)
            }
        )
        self.db.commit()
        self.db.refresh(invoice)

        return invoice