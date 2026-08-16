import pandas as pd
import requests

API_URL = "http://127.0.0.1:8000/predict"

df = pd.read_csv("system_test.csv")

results = []

for _, row in df.iterrows():

    try:
        response = requests.post(
            API_URL,
            json={"text": row["comment"]},
            timeout=60
        )

        response.raise_for_status()

        result = response.json()

        results.append({
            "id": row["id"],
            "comment": row["comment"],
            "label_actual": row["label_actual"],
            "label_predicted": result["label"],
            "prediction": result["prediction"],
            "probability": result["probability"],
            "kategori": row["kategori"]
        })

        print(
            f'{row["id"]}. '
            f'{result["prediction"]} '
            f'({result["probability"] * 100:.2f}%)'
        )

    except Exception as e:

        results.append({
            "id": row["id"],
            "comment": row["comment"],
            "label_actual": row["label_actual"],
            "label_predicted": None,
            "prediction": "ERROR",
            "probability": None,
            "kategori": row["kategori"]
        })

        print(f'{row["id"]}. ERROR: {e}')


result_df = pd.DataFrame(results)

result_df["correct"] = (
    result_df["label_actual"] ==
    result_df["label_predicted"]
)

result_df.to_csv(
    "system_test_result.csv",
    index=False,
    encoding="utf-8-sig"
)

print("\n=== HASIL PENGUJIAN ===")
print(result_df.to_string(index=False))

print("\nJumlah benar:",
      result_df["correct"].sum(),
      "dari",
      len(result_df))

print(
    "Tingkat keberhasilan:",
    f'{result_df["correct"].mean() * 100:.2f}%'
)