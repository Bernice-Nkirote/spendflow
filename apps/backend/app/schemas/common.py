from typing import Annotated
from decimal import Decimal
from pydantic import Field

AmountType = Annotated[
    Decimal,
    Field(gt=0, max_digits=12, decimal_places=2)
]