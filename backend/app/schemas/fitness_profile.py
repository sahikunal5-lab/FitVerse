
from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class FitnessGoal(str, Enum):
    weight_loss = "weight_loss"
    muscle_gain = "muscle_gain"
    maintenance = "maintenance"
    general_fitness = "general_fitness"


class ExperienceLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"


class FitnessProfileInput(BaseModel):

    model_config = ConfigDict(extra="forbid")

    age: int | None = Field(
        default=None, ge=13, le=120
    )

    height_cm: float | None = Field(
        default=None, ge=50, le=250
    )

    weight_kg: float | None = Field(
        default=None, ge=10, le=400
    )

    fitness_goal: FitnessGoal | None = None

    experience_level: ExperienceLevel | None = None

    activity_level: ActivityLevel | None = None

    @field_validator("height_cm", "weight_kg")
    @classmethod
    def validate_one_decimal(cls, value):
        if value is not None:
            if abs(value * 10 - round(value * 10)) > 1e-6:
                raise ValueError(
                    "Use at most one decimal place."
                )
        return value


class FitnessProfileResponse(FitnessProfileInput):

    user_id: UUID

    created_at: datetime

    updated_at: datetime
