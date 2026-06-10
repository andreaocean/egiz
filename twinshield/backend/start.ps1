Set-Location $PSScriptRoot
if (-not (Test-Path .\venv\Scripts\python.exe)) {
    python -m venv venv
    .\venv\Scripts\pip install -r requirements.txt
}
.\venv\Scripts\uvicorn main:app --host 0.0.0.0 --reload --port 8000
