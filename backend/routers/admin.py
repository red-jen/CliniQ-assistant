from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models.user import User
from backend.models.query import Query
from backend.dependencies import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    query_count: int = 0

    class Config:
        from_attributes = True


class QueryOut(BaseModel):
    id: int
    user_id: int
    username: str
    query: str
    reponse: str
    created_at: datetime

    class Config:
        from_attributes = True


class StatsOut(BaseModel):
    total_users: int
    total_queries: int
    queries_today: int


def require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users = db.query(User).all()
    result = []
    for u in users:
        count = db.query(func.count(Query.id)).filter(Query.user_id == u.id).scalar()
        result.append(UserOut(
            id=u.id, username=u.username, email=u.email, role=u.role, query_count=count or 0
        ))
    return result


@router.get("/stats", response_model=StatsOut)
def get_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_users = db.query(func.count(User.id)).scalar()
    total_queries = db.query(func.count(Query.id)).scalar()
    today = datetime.utcnow().date()
    queries_today = db.query(func.count(Query.id)).filter(
        func.date(Query.created_at) == today
    ).scalar()
    return StatsOut(total_users=total_users, total_queries=total_queries, queries_today=queries_today)


@router.get("/queries", response_model=List[QueryOut])
def list_queries(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    offset = (page - 1) * limit
    queries = (
        db.query(Query, User.username)
        .join(User, Query.user_id == User.id)
        .order_by(Query.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        QueryOut(
            id=q.id, user_id=q.user_id, username=username,
            query=q.query, reponse=q.reponse, created_at=q.created_at
        )
        for q, username in queries
    ]


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.query(Query).filter(Query.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": f"User {user.username} deleted"}
