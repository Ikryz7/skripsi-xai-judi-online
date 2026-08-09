from pathlib import Path

import torch
import shap
import numpy as np
import torch.nn.functional as F

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification
)

from preprocess import preprocess


# =====================================================
# DEVICE
# =====================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("SHAP Device :", device)


# =====================================================
# MODEL
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "model" / "indobert_best"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_PATH
)

model.to(device)
model.eval()


MAX_LENGTH = 128

LABELS = {
    0: "Bukan Judi Online",
    1: "Judi Online"
}


# =====================================================
# PREDICT PROBA
# =====================================================

def predict_proba(texts):

    texts = [preprocess(t) for t in texts]

    inputs = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt"
    )

    inputs = {
        k: v.to(device)
        for k, v in inputs.items()
    }

    with torch.no_grad():

        outputs = model(**inputs)

        probs = F.softmax(
            outputs.logits,
            dim=1
        )

    return probs.cpu().numpy()


# =====================================================
# CREATE EXPLAINER
# =====================================================

explainer = shap.Explainer(
    predict_proba,
    tokenizer
)

print("SHAP Explainer Loaded.")


# =====================================================
# EXPLAIN
# =====================================================

def explain(text):

    clean_text = preprocess(text)

    values = explainer([clean_text])

    probs = predict_proba([clean_text])[0]

    label = int(np.argmax(probs))

    probability = float(probs[label])

    tokens = values[0].data

    shap_values = values[0].values[:, label]

    explanation = []

    for token, score in zip(tokens, shap_values):

        token = token.strip()

        if token == "":
            continue

        explanation.append({

            "token": token,

            "importance": float(score)

        })

    explanation = sorted(

        explanation,

        key=lambda x: abs(x["importance"]),

        reverse=True

    )

    return {

        "text": clean_text,

        "label": label,

        "prediction": LABELS[label],

        "probability": probability,

        "explanation": explanation

    }