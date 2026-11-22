
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):

    id: UUID

    full_name: str = Field(max_length=100)

    created_at: datetime

    updated_at: datetime
