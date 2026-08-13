# Deteksi Promosi Judi Online pada Komentar YouTube (IndoBERT + XAI)

Klasifikasi komentar YouTube yang mengandung promosi judi online menggunakan
fine-tuning **IndoBERT** (`indobenchmark/indobert-base-p1`) dengan penjelasan
model berbasis **SHAP** (XAI). Tersedia dalam bentuk REST API (FastAPI) dan
ekstensi browser Chrome.

## Alur Penelitian

1. `notebook/01_preprocessing.ipynb` — pembersihan data (cleaning, case
   folding, anti-homoglyph).
2. `notebook/02_training.ipynb` — fine-tuning IndoBERT.
3. `notebook/03_evaluation.ipynb` — evaluasi model pada data uji.
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
```

**Aktifkan virtual environment** (tiap buka terminal baru perlu aktivasi ulang):

| Terminal | Perintah |
|---|---|
| PowerShell | `.venv\Scripts\Activate.ps1` |
| CMD | `.venv\Scripts\activate.bat` |
| Git Bash | `source .venv/Scripts/activate` |

```powershell
# Install dependency (setelah aktivasi)
pip install -r requirements.txt
```

> **Alternatif tanpa aktivasi** — panggil langsung interpreter venv:
> ```powershell
> .venv\Scripts\python.exe -m pip install -r requirements.txt
> .venv\Scripts\python.exe -m uvicorn app:app --reload
> ```
>
> Untuk **Jupyter/VS Code**: aktivasi tidak relevan — cukup pilih interpreter
> `.venv\Scripts\python.exe` sebagai kernel.

> Untuk **training GPU (CUDA)**, pasang PyTorch CUDA build terlebih dahulu:
> `pip install torch --index-url https://download.pytorch.org/whl/cu128`
> Lalu lanjutkan dengan `pip install -r requirements.txt`.

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
| Accuracy | 98.12% |
| Precision | 97.12% |
| Recall | 99.24% |
| F1-Score | 98.17% |

Detail: `output/classification_report.txt`, `output/evaluation_metrics.csv`.

## Dependency Utama

`fastapi`, `uvicorn`, `torch`, `transformers`, `shap`, `pandas`,
`scikit-learn`, `ftfy` (lengkap di `requirements.txt`).
