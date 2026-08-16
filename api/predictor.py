from pathlib import Path

import torch
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

print("Device :", device)


# =====================================================
# MODEL PATH
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "model" / "indobert_best"


# =====================================================
# LOAD TOKENIZER
# =====================================================

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_PATH
)


# =====================================================
# LOAD MODEL
# =====================================================

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_PATH
)

model.to(device)

model.eval()


MAX_LENGTH = 128


LABELS = {

    0: "Bukan Promosi Judi Online",

    1: "Promosi Judi Online"

}


# =====================================================
# PREDICT
# =====================================================

def predict(text):

    text = preprocess(text)

    inputs = tokenizer(

        text,

        truncation=True,

        padding=True,

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

    probability, prediction = torch.max(

        probs,

        dim=1

    )

    label = prediction.item()

    return {

        "text": text,

        "label": label,

        "prediction": LABELS[label],

        "probability": float(probability.item())

    }