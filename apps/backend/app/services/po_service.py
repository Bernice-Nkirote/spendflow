from decimal import Decimal
from datetime import datetime
from app.models.purchase_order import PurchaseOrder, POStatusEnum
from app.models.approval_instance import ApprovalInstance
from app.models.approval_action import ApprovalAction
from app.models.enums import ActionType
from app.repositories.po_repository import PurchaseOrderRepository
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.po_pdf_service import PurchaseOrderPDFService
from app.services.email_service import send_email_with_attachment
from fastapi import HTTPException


class PurchaseOrderService:
    def __init__(self, db):
        self.db = db
        self.repo = PurchaseOrderRepository(db)
        
    # Create PO
    def generate_po_number(self):
        return f"PO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    def create_po(self, po_data, current_user):
        po = PurchaseOrder(
            po_number=self.generate_po_number(),
            buyer_id=current_user["sub"],
            company_id=current_user["company_id"],
            supplier_id=po_data.supplier_id,
            status=POStatusEnum.PENDING_APPROVAL,
            total_amount=Decimal("0.00"),  # Will update when items are added
            currency=po_data.currency,
            notes=po_data.notes,
        )

        created_po = self.repo.create(po)

        # Create Approval Instance
        approval_service = ApprovalInstanceService(self.db)

        approval_service.create_instance(
        entity_type="PO",
        entity_id=created_po.id,
        company_id=current_user["company_id"]
        )

        return created_po

    def get_all_pos(self, company_id):
        return self.repo.get_all_by_company(company_id)

    def get_po(self, po_id, company_id):
        return self.repo.get_by_id(po_id, company_id)

    def delete_po(self, po_id, company_id):
        po = self.get_po(po_id, company_id)
        if not po:
            return None
        self.repo.delete(po)
        return po
    
    #  APPROVE PO
    def approve_po(self, po_id, current_user):
        po = self.get_po(po_id, current_user["company_id"])

        if not po:
            raise HTTPException(
                status_code=404, 
                detail="PO not found")

    # ROLE CHECK
        if current_user["role"] not in ["manager", "admin"]:
             raise HTTPException(status_code=403, detail="Not Authorized")
    
    # PREVENT RE-APPROVAL
        if po.status != POStatusEnum.PENDING_APPROVAL:
            raise HTTPException(
                status_code=400,
                detail="PO not approval state"
            )
        
    # get the approval instance
        instance = self.db.query(ApprovalInstance).filter(
            ApprovalInstance.entity_id == po.id,
            ApprovalInstance.entity_type == "PO"
        ).first()

        if not instance:
            raise HTTPException(
                status_code=404, 
                detail="Approval Instance not found")
        
        #  Create approval action
        action = ApprovalAction(
            approval_instance_id=instance.id,
            user_id=current_user["sub"],
            action=ActionType.APPROVED
        )

        self.db.add(action)

        # Update PO STATUS
        po.status = POStatusEnum.APPROVED
        self.db.commit()

        return po
    
    # REJECT PO
    def reject_po(self, po_id, current_user):
        po = self.get_po(po_id, current_user["company_id"])

        if not po:
            raise Exception("PO not found")
        
        # Role Check
        if current_user["role"] not in ["manager", "admin"]:
            raise HTTPException(
                status_code=403, 
                detail="Not authorized")

        # Prevent Reapproval
        if po.status != POStatusEnum.PENDING_APPROVAL:
            raise HTTPException(
                status_code=400, 
                detail="PO not in approval state")
        
        # Create Instance
        instance = self.db.query(ApprovalInstance).filter(
            ApprovalInstance.entity_id == po.id,
            ApprovalInstance.entity_type == "PO"
        ).first()

        if not instance:
            raise HTTPException(
                status_code=404, 
                detail="Approval Instance not found")
        
        action = ApprovalAction(
            approval_instance_id=instance.id,
            user_id=current_user["sub"],
            action=ActionType.REJECTED
        )

        self.db.add(action)
        po.status = POStatusEnum.REJECTED
        self.db.commit()
        return po
    
    
    #  SEND EMAIL TO SUPPLIER WITH PO AS PDF ATTACHMENT 
    def send_po_email(self, po_id, company_id):
        po = self.get_po(po_id, company_id)

        if not po:
            raise Exception("PO not found")
        
    # Block sending if not approved
        if po.status != POStatusEnum.APPROVED:
            raise HTTPException(
                status_code=400,
                detail="Po must be approved before sending"
            )

    #  generate PDF
        pdf_buffer = PurchaseOrderPDFService.generate_pdf(po)

    # safe supplier handling
        if not po.supplier:
            raise HTTPException(
                status_code=400, 
                detail="Supplier not found for this PO")
        
        supplier_email = po.supplier.email

        send_email_with_attachment(
            to_email=supplier_email,
            subject=f"Purchase Order {po.po_number}",
            body="Please find attached the purchase order.",
            file_buffer=pdf_buffer,
            filename=f"{po.po_number}.pdf"
        )

    # Update status
        po.status = POStatusEnum.SENT
        self.db.commit()

        return po
