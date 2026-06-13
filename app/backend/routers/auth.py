from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from db_models import User
from schemas import AuthResponse, LoginRequest, RegisterRequest, UserOut
from security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(
        or_(User.username == body.username, User.email == body.email.lower())
    ).first()
    if exists:
        field = "usuario" if exists.username == body.username else "correo"
        raise HTTPException(status.HTTP_409_CONFLICT, f"Ese {field} ya está registrado")

    user = User(
        username=body.username,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    ident = body.identifier.strip()
    user = db.query(User).filter(
        or_(User.username == ident, User.email == ident.lower())
    ).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales incorrectas")
    return AuthResponse(token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
