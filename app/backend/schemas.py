from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.-]+$")
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    identifier: str = Field(description="Usuario o correo")
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class RatingIn(BaseModel):
    movieId: int
    rating: float = Field(ge=0.5, le=5.0)


class RatingsSyncRequest(BaseModel):
    ratings: list[RatingIn] = Field(max_length=2000)


class GuestRatingsRequest(BaseModel):
    ratings: list[RatingIn] = Field(default_factory=list, max_length=2000)


class WatchlistIn(BaseModel):
    movieId: int
