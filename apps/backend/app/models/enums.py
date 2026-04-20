from sqlalchemy.dialects.postgresql import ENUM
import enum


class EntityTypeEnum(str, enum.Enum):
    PR = "PR"
    PO = "PO"
    INVOICE = "INVOICE"
    PAYMENT = "PAYMENT"


class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ActionType(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PRStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    CONVERTED_TO_PO = "CONVERTED_TO_PO"


class POStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SENT = "SENT"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class InvoiceStateEnum(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    APPROVED = "APPROVED"
    SENT = "SENT"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    CANCELLED = "CANCELLED"


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class PaymentMethodEnum(str, enum.Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    MPESA = "MPESA"
    CASH = "CASH"


entity_type_enum = ENUM(
    *[e.value for e in EntityTypeEnum],
    name="entitytypeenum",
    create_type=False,
)

approval_status_enum = ENUM(
    *[e.value for e in ApprovalStatus],
    name="approvalstatusenum",
    create_type=False,
)

action_type_enum = ENUM(
    *[e.value for e in ActionType],
    name="actiontypeenum",
    create_type=False,
)

pr_status_enum = ENUM(
    *[e.value for e in PRStatusEnum],
    name="prstatusenum",
    create_type=False,
)

po_status_enum = ENUM(
    *[e.value for e in POStatusEnum],
    name="postatusenum",
    create_type=False,
)

invoice_status_enum = ENUM(
    *[e.value for e in InvoiceStateEnum],
    name="invoicestatusenum",
    create_type=False,
)

payment_status_enum = ENUM(
    *[e.value for e in PaymentStatusEnum],
    name="paymentstatusenum",
    create_type=False,
)

payment_method_enum = ENUM(
    *[e.value for e in PaymentMethodEnum],
    name="paymentmethodenum",
    create_type=False,
)