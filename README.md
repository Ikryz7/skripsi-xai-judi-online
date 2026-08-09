# Deteksi Promosi Judi Online pada Komentar YouTube (IndoBERT + XAI)

Klasifikasi komentar YouTube yang mengandung promosi judi online menggunakan
fine-tuning **IndoBERT** (`indobenchmark/indobert-base-p1`) dengan penjelasan
model berbasis **SHAP** (XAI). Tersedia dalam bentuk REST API (FastAPI) dan
ekstensi browser Chrome.

## Alur Penelitian

1. `notebook/preprocessing.ipynb` — pembersihan data (cleaning, case folding,
   normalisasi slang, anti-homoglyph).
2. `notebook/training.ipynb` — fine-tuning IndoBERT.
3. `notebook/evaluation.ipynb` — evaluasi model pada data uji.
4. `notebook/04_prediction.ipynb` — uji prediksi manual.
5. `notebook/05_shap.ipynb` — analisis explainability dengan SHAP.

## Struktur Folder

| Folder | Keterangan |
|---|---|
| `dataset/` | Dataset mentah & hasil preprocessing |
| `notebook/` | Seluruh alur eksperimen |
| `model/` | Model terbaik (IndoBERT fine-tuned) |
| `api/` | REST API FastAPI (`predict` & `explain`) |
| `extension/` | Ekstensi Chrome (MV3) |
| `output/` | Hasil evaluasi, confusion matrix, & SHAP |

## Cara Menjalankan

### 1. Siapkan Environment (sekali saja)

```powershell
# Buat virtual environment
python -m venv .venv

# Aktifkan virtual environment (Windows)
.venv\Scripts\activate

# Install dependency
pip install -r requirements.txt
```

### 2. Jalankan API

Pastikan model sudah ada di `model/indobert_best`, lalu jalankan:

```powershell
cd api
python -m uvicorn app:app --reload
```

API akan berjalan di `http://127.0.0.1:8000`.

| Endpoint | Metode | Fungsi |
|---|---|---|
| `/` | GET | Cek status API |
| `/predict` | POST | Klasifikasi teks (`{"text": "..."}`) |
| `/explain` | POST | Klasifikasi + token importance SHAP |

Contoh request:

```powershell
curl -X POST http://127.0.0.1:8000/predict `
  -H "Content-Type: application/json" `
  -d '{"text": "AERO88 gacor, bonus new member 100%"}'
```

### 3. Jalankan Ekstensi Chrome

1. Buka `chrome://extensions`.
2. Aktifkan **Developer mode** (pojok kanan atas).
3. Klik **Load unpacked**.
4. Pilih folder `extension/`.
5. Buka YouTube — komentar yang terindikasi promosi judi online akan di-blur.
   Klik **Tampilkan Komentar** untuk melihatnya, atau **Lihat Alasan** untuk
   penjelasan SHAP.

> Catatan: API harus berjalan sebelum ekstensi digunakan.

## Performa Model

| Metrik | Nilai |
|---|---|
| Accuracy | 97.79% |
| Precision | 97.28% |
| Recall | 98.39% |
| F1-Score | 97.83% |

Detail: `output/classification_report.txt`, `output/evaluation_metrics.csv`.

## Dependency Utama

`fastapi`, `uvicorn`, `torch`, `transformers`, `shap`, `pandas`,
`scikit-learn`, `ftfy` (lengkap di `requirements.txt`).
