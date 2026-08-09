from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from predictor import predict
from explainer import explain
from schemas import (
    PredictionRequest,
    PredictionResponse,
    ExplainRequest,
    ExplainResponse
)

from schemas import (
    PredictionRequest,
    PredictionResponse
)

app = FastAPI(

    title="YouTube Comment Detection API",

    version="1.0"

)

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


@app.get("/")
def root():

    return {

        "status": "running",

        "message": "IndoBERT API berhasil dijalankan"

    }


@app.post(
    "/predict",
    response_model=PredictionResponse
)
def prediction(request: PredictionRequest):

    result = predict(request.text)

    return result

@app.post(
    "/explain",
    response_model=ExplainResponse
)
def explanation(request: ExplainRequest):

    return explain(request.text)