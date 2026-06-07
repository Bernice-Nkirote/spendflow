from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TaskRead(BaseModel):
    id: str
    type: str
    reference: str
    message: str
    url: str
    created_at: datetime | None = None


class MyTasksResponse(BaseModel):
    rows: list[TaskRead]
    total_count: int