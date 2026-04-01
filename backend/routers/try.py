from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.services.auth_service import hash_password, verify_password, create_access_token
from backend.schemas.user import RegisterRequest, UserResponse, TokenResponse

app =APIRouterter()

@router.get('/login' , app)
def



class Query(Base):
    __tablename__ = "Query"
    id = Column(Intger )
    user_id = COlumn(Froreignkey(user.id))



def test_returnllm(query: reponseModel):
    quer = Mock()
 Exp =
mlflow.log_metrics('qurie contes' , count(queris))


