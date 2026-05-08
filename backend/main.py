import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Diary API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8700"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve Next.js static build when it exists (production / Docker)
_frontend_out = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
if os.path.exists(_frontend_out):
    app.mount("/", StaticFiles(directory=_frontend_out, html=True), name="frontend")
