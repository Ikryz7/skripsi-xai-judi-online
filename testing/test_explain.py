import pandas as pd
import requests

API_URL = "http://127.0.0.1:8000/explain"

test_ids = [1, 4, 11, 6, 14]

df = pd.read_csv("system_test.csv")
test_df = df[df["id"].isin(test_ids)]

results = []

for _, row in test_df.iterrows():

    try:
        response = requests.post(
            API_URL,
            json={"text": row["comment"]},
            timeout=120
        )

        response.raise_for_status()
        result = response.json()

        # Ambil 5 token dengan kontribusi terbesar
        explanations = result.get("explanation", [])

        explanations = sorted(
            explanations,
            key=lambda x: abs(x["importance"]),
            reverse=True
        )

        top_tokens = explanations[:5]

        data = {
            "id": row["id"],
            "comment": row["comment"],
            "label_actual": row["label_actual"],
            "prediction": result["prediction"],
            "probability": result["probability"]
        }

        for i, item in enumerate(top_tokens, start=1):
            data[f"token_{i}"] = item["token"]
            data[f"shap_{i}"] = item["importance"]

        results.append(data)

        print(f"\nID {row['id']}")
        print(f"Komentar   : {row['comment']}")
        print(f"Prediksi   : {result['prediction']}")
        print(f"Confidence : {result['probability'] * 100:.2f}%")

        print("Top token:")
        for item in top_tokens:
            print(
                f"  {item['token']} : "
                f"{item['importance']:+.6f}"
            )

    except Exception as e:
        print(f"ID {row['id']} ERROR: {e}")


result_df = pd.DataFrame(results)

result_df.to_csv(
    "system_explain_result.csv",
    index=False,
    encoding="utf-8-sig"
)

print("\n=== SELESAI ===")
print(result_df.to_string(index=False))