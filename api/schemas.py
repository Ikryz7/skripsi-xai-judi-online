from typing import List
from pydantic import BaseModel


class PredictionRequest(BaseModel):
    text: str


class PredictionResponse(BaseModel):
    text: str
    label: int
    prediction: str
    probability: float


# ==========================
# SHAP
# ==========================

class ExplainRequest(BaseModel):
    text: str


class TokenImportance(BaseModel):
    token: str
    importance: float


class ExplainResponse(BaseModel):

    text: str

    label: int

    prediction: str

    probability: float

    explanation: List[TokenImportance]